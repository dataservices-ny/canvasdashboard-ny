import { Injectable } from '@angular/core';
import { BehaviorSubject, forkJoin, interval, Observable, Subscription, timer, of } from 'rxjs';
import { finalize, map, skipWhile, take, takeWhile } from 'rxjs/operators';
import { AdminCourse, AdminStudent } from '../core/models/admin-student';
import { Term } from '../core/models/term';
import { Student } from '../core/models/user';
import { AssignmentsService } from '../core/services/assignments.service';
import { DataService } from '../core/services/data.service';
import { HttpCancelService } from './../core/services/httpcancel.service';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  
  filtered_students$: BehaviorSubject<{ [student_id: string]: AdminStudent }>;
  all_outcomes$: BehaviorSubject<{[course_id: string]: {[outcome_id: string]: {title: string, has_assessments: boolean}}}>
  grade_list$: BehaviorSubject<string[]>;
  student_courses_loaded$: BehaviorSubject<boolean>;
  current_grade$: BehaviorSubject<string>;
  number$: BehaviorSubject<number>;
  page$: BehaviorSubject<number>;
  pages$: BehaviorSubject<number[]>;
  terms$: BehaviorSubject<Term[]>;
  current_term$: BehaviorSubject<Term>
  start_date$: BehaviorSubject<string>;
  end_date$: BehaviorSubject<string>;
  countOnlyRubric: boolean;
  listUpdating$: BehaviorSubject<boolean>;
  
  subsriptions: Subscription;
  start: number;
  students: { [s: string]: AdminStudent };
  delay_ms: number = 0;

  constructor(
    private dataService: DataService,
    private httpCancelService: HttpCancelService,
    private assignmentsService: AssignmentsService,
  ) { 
    
    this.filtered_students$ = new BehaviorSubject(null);
    this.all_outcomes$ = new BehaviorSubject(null);
    this.grade_list$ = new BehaviorSubject(null);
    this.student_courses_loaded$ = new BehaviorSubject(false);
    this.current_grade$ = new BehaviorSubject(null);
    this.number$ = new BehaviorSubject(25);
    this.pages$ = new BehaviorSubject([]);
    this.page$ = new BehaviorSubject(1);
    this.terms$ = new BehaviorSubject([]);
    this.current_term$ = new BehaviorSubject(null);
    this.start_date$ = new BehaviorSubject(null);
    this.end_date$ = new BehaviorSubject(null);
    this.listUpdating$ = new BehaviorSubject(false);

    this.subsriptions = new Subscription();
    this.start = 0;
    this.students = {};

    // Get the list of available grades
    let grade_list: Set<string> = new Set();
    this.subsriptions.add(this.dataService.STUDENTS$
      .pipe(
        skipWhile(students => Object.keys(students).length == 0),
        take(1)  
      )
      .subscribe(students => {
        for (const [id, student] of Object.entries(students)) {
          this.students[id] = new AdminStudent(student);
          grade_list.add(student.grade);
        }
        this.grade_list$.next([...grade_list].sort((a, b) => parseInt(a) - parseInt(b)));
      }));

    // Get the list of terms
    this.subsriptions.add(this.dataService.getTerms()
      .pipe(
        skipWhile(terms => !terms),
        take(1)  
      )
      .subscribe(terms => {
        this.terms$.next(terms);
        const current_term = terms.find(term => term.name.toLowerCase().includes('all'));
        if(current_term){
          this.current_term$.next(current_term);
          this.start_date$.next(current_term.start_at);
          this.end_date$.next(current_term.end_at);
        }
        else{
          this.current_term$.next(terms[0])
        }
      }));

  }

  ngOnDestroy(): void {
    this.subsriptions.unsubscribe();
  }

  updateList(){
    this.listUpdating$.next(true)
    this.subsriptions.unsubscribe();
    this.httpCancelService.cancelPendingRequests()
    this.subsriptions = new Subscription();
    this.student_courses_loaded$.next(false);
    
    this.all_outcomes$.next({})

    let full_grade = Object.values(this.students).filter(student => student.grade == this.current_grade$.value);
    let total_pages = 1;
    if(this.number$.value){
      total_pages = Math.ceil(full_grade.length / this.number$.value);
    }
    this.pages$.next([...Array(total_pages).keys()])
    full_grade = full_grade.sort((a,b) => (a.sortable_name > b.sortable_name) ? 1 : ((b.sortable_name > a.sortable_name) ? -1 : 0))
    
    this.get_students(full_grade, this.start, this.number$.value)
    
  }

  get_students(full_grade, start, number){
    let filtered_students = {};
    let get_student_observables: Observable<any>[] = [];
    let end;
    if(number){
      end = start + number
    }
    else {
      end = full_grade.length
    }
    let s_ids: string[] = []
    let s_admin = {}
    full_grade.slice(start, end).forEach(student => {
      s_ids.push(student.id)
      s_admin[student.id] = student
    })
    this.subsriptions.add(this.dataService.getMutipleStudents(s_ids, true).subscribe(students => {
        students.forEach(student => {
          filtered_students[student.id] = s_admin[student.id];
          this.filtered_students$.next(filtered_students);
        })
        this.filtered_students$.next(filtered_students);
        this.listUpdating$.next(false)
        this.process_students(students, filtered_students)
      })
    )
  }

  process_students(students:Student[], filtered_students){
          // Get missing submissions
          // `students` here is the list of Students who's courses were not loaded
          // Students whose courses and submissions already existed don't need 
          // submissions loaded.
          
          this.student_courses_loaded$.next(true);

          // Limit extra calls by combining all students with same courses
          let course_student_lists: { [c: string]: string[]} = {}
          
          students.forEach(student => {
            Object.values(student.courses).forEach( c => {
              this.students[student.id].courses[c.course_id] = {
                  course_id: c.course_id,
                  total_submissions: null,
                  complete: null,
                  incomplete: null,
                  non_graded: null,
                  missing: null,
                  late: null,
                  proficient_advanced: null,
                  developing_not_yet: null,
                  recent_submissions: [],
                  course_loaded: false,
                  outcome_results: null
              }
              if(!(c.course_id in course_student_lists)){
                course_student_lists[c.course_id] = [];
              }
              course_student_lists[c.course_id].push(student.id);
            });

            // Initialize totals
            this.students[student.id].total_submissions = null;
            this.students[student.id].total_complete = null ;
            this.students[student.id].total_incomplete = null;
            this.students[student.id].total_non_graded = null;
            this.students[student.id].total_missing = null;
            this.students[student.id].total_late = null;
            this.students[student.id].total_proficient_advanced = null;
            this.students[student.id].total_developing_not_yet = null;

            this.students[student.id].courses_loaded = true;
            filtered_students[student.id] = this.students[student.id];
            this.filtered_students$.next(filtered_students);
          })

          
          const course_keys = Object.keys(course_student_lists)

          this.subsriptions.add(interval(this.delay_ms)
            .pipe(
              take(course_keys.length)
            )
            .subscribe(i => {
              this.subsriptions.add(this.dataService.getCourse(course_keys[i], null, false).pipe(
                skipWhile(course => typeof(course) == 'undefined' || course == null ),
                map((course, j) => {
                  if(j == 0){
                    this.subsriptions.add(timer(this.delay_ms)
                      .pipe(
                        take(1)
                      )
                      // submissions are stored on the course in dataService
                      .subscribe(_ => {this.dataService.getSubmissions(course_student_lists[course_keys[i]], course_keys[i])})
                    );
                    
                    this.subsriptions.add(timer(this.delay_ms * 2)
                      .pipe(
                        take(1)
                      )
                      // assignments are stored on the course in dataService
                      .subscribe(_ => this.dataService.getAssignments(course_keys[i]))
                    );
                  }
                  return course
                }),
                takeWhile(course => {
                  // Check if all student submissions have been loaded.
                  // If not continue to take
                  // If so take the final value, then complete
                  if('submissions' in course && 'assignments' in course){
                    // Set of all students that should be loaded
                    let all_students = new Set(course_student_lists[course_keys[i]]);
                    // Set of all students who have submissions loaded
                    let loaded_students = new Set(Object.keys(course.submissions));
                    if (all_students.size !== loaded_students.size) return true;
                    for (var a of all_students) if (!loaded_students.has(a)) return true;
                    return false;
                  }
                  else{
                    return true
                  }
                }, true), // true means it will also take the last value that causes takeWhile to return false
                finalize(() => {
                    // Load outcomes
                    this.subsriptions.add(timer(this.delay_ms * 3)
                    .pipe(
                      take(1)
                    )
                    // outcome results are stored locally in adminService
                    .subscribe(_ => {
                      this.subsriptions.add(this.dataService.getOutcomeResults(course_keys[i], course_student_lists[course_keys[i]])
                        .pipe(
                          skipWhile(outcome_results => Object.keys(outcome_results).length == 0),
                          take(1)
                        )
                        .subscribe(outcome_results => {
                          let all_outcomes = this.all_outcomes$.value;
                          if( !all_outcomes ) {
                            all_outcomes = {};
                          }
                          // Use first student to add outcome to all_outcomes
                          if( !(course_keys[i] in all_outcomes) ){
                            all_outcomes[course_keys[i]] = {};
                            for(const [outcome_id, outcome] of Object.entries(Object.values(outcome_results)[0])){
                              all_outcomes[course_keys[i]][outcome_id] = {
                                title: outcome.title,
                                has_assessments: false
                              }
                            }
                            // Get each student's outcome results
                            for(const [student_id, student_outcome_results] of Object.entries(outcome_results)) {
                              filtered_students[student_id].courses[course_keys[i]].outcome_results = student_outcome_results;
                              // Update all_outcomes --> has_assessments
                              for(const [outcome_id, outcome] of Object.entries(student_outcome_results)){
                                if(outcome.results.length > 0){
                                  all_outcomes[course_keys[i]][outcome_id].has_assessments = true;
                                }
                              }
                            }
                            this.all_outcomes$.next(all_outcomes)
                            this.filtered_students$.next(filtered_students);
                          }
                        }))
                    })
                  );

                  // After all student submissions and assignments have been loaded
                  // Go through each student and make total_submissions = 0 for any
                  // course that did not have any submissions.
                  course_student_lists[course_keys[i]].forEach(student_id => {
                    if(this.students[student_id].courses[course_keys[i]].total_submissions == null){
                      this.students[student_id].courses[course_keys[i]].total_submissions = 0;
                      // Update the local filtered_students
                    filtered_students[student_id] = this.students[student_id];
                    }
                  })
                  // Update the observable filtered_students$
                  this.filtered_students$.next(filtered_students)
                })
              ).subscribe(course => { 

                const course_id = course_keys[i];

                course_student_lists[course_id].forEach(student_id => {
              
                  this.students[student_id].courses[course_id].course_name = course.course_name;
                  
                  if('submissions' in course && 'assignments' in course){

                    if(student_id in course['submissions'] && !this.students[student_id].courses[course_id].course_loaded){
                      
                      // Add submission data for the course to the main students data
                      Object.values(course.submissions[student_id]).forEach(submission => {
                        let conditions = [
                          (submission.dueAt >= this.start_date$.value && submission.dueAt < this.end_date$.value),
                          course.assignments[submission._id].gradingType != 'not_graded',
                        ]
                        if (this.countOnlyRubric) {
                          conditions.push('rubric' in submission)
                        }
                        let conditions_met: boolean = true;
                        conditions.forEach(condition => {
                          if (!condition) conditions_met = false;
                        })
                        
                        if (conditions_met) {
                          // count course submissions
                          if(this.students[student_id].courses[course_id].total_submissions == null){
                            this.students[student_id].courses[course_id].total_submissions = 1;
                          }
                          else {
                            this.students[student_id].courses[course_id].total_submissions += 1;
                          }
                          
                          // count course complete submissions
                          if(submission.complete == true){
                          
                            if(this.students[student_id].courses[course_id].complete == null){
                              this.students[student_id].courses[course_id].complete = 1;
                            }
                            else {
                              this.students[student_id].courses[course_id].complete += 1;
                            }

                            if(this.students[student_id].courses[course_id].incomplete == null){
                              this.students[student_id].courses[course_id].incomplete = 0;
                            }

                          }
                          // count course incomplete submissions
                          else if(submission.complete == false){

                            if(this.students[student_id].courses[course_id].incomplete == null){
                              this.students[student_id].courses[course_id].incomplete = 1;
                            }
                            else {
                              this.students[student_id].courses[course_id].incomplete += 1;
                            }

                            if(this.students[student_id].courses[course_id].complete == null){
                              this.students[student_id].courses[course_id].complete = 0;
                            }

                          }
                          // count course non-graded submissions
                          else if(submission.complete == null  && submission.grade == null && submission.score == null){

                            if(this.students[student_id].courses[course_id].non_graded == null){
                              this.students[student_id].courses[course_id].non_graded = 1;
                            }
                            else {
                              this.students[student_id].courses[course_id].non_graded += 1;
                            }

                            if(this.students[student_id].courses[course_id].complete == null){
                              this.students[student_id].courses[course_id].complete = 0;
                            }
                            if(this.students[student_id].courses[course_id].incomplete == null){
                              this.students[student_id].courses[course_id].incomplete = 0;
                            }

                          }

                          // count course missing submissions
                          if(submission.missing){

                            if(this.students[student_id].courses[course_id].missing == null){
                              this.students[student_id].courses[course_id].missing = 1;
                            }
                            else {
                              this.students[student_id].courses[course_id].missing += 1;
                            }

                          }
                          else {
                            if(this.students[student_id].courses[course_id].missing == null){
                              this.students[student_id].courses[course_id].missing = 0;
                            }
                          }

                          // count course late submissions
                          if(submission.late){

                            if(this.students[student_id].courses[course_id].late == null){
                              this.students[student_id].courses[course_id].late = 1;
                            }
                            else {
                              this.students[student_id].courses[course_id].late += 1;
                            }

                          }
                          else {
                            if(this.students[student_id].courses[course_id].late == null){
                              this.students[student_id].courses[course_id].late = 0;
                            }
                          }

                          // count proficient_advanced and developing_not_yet
                          if('rubric' in submission){
                            Object.values(submission.rubric).forEach(criteria => {
                              if(criteria.points){
                                if(criteria.points >= 2){
                                  if(this.students[student_id].courses[course_id].proficient_advanced == null){
                                    this.students[student_id].courses[course_id].proficient_advanced = 1;
                                  }
                                  else{
                                    this.students[student_id].courses[course_id].proficient_advanced += 1;
                                  }
                                }
                                else{
                                  if(this.students[student_id].courses[course_id].developing_not_yet == null){
                                    this.students[student_id].courses[course_id].developing_not_yet = 1;
                                  }
                                  else{
                                    this.students[student_id].courses[course_id].developing_not_yet += 1;
                                  }
                                }
                              }
                            })
                          }

                          // Add submissions to recent_submissions...
                          submission.grade = this.assignmentsService.letter_number(course.assignments[submission._id], submission) 
                          // If submission has a rubric
                          if('rubric' in submission){
                            this.students[student_id].courses[course_id].recent_submissions.push(submission);
                          }
                          // If submission has a grade other than 'null','complete', or 'incomplete'
                          else if(submission.grade){
                            this.students[student_id].courses[course_id].recent_submissions.push(submission);
                          }

                        }

                      });

                      if(this.students[student_id].courses[course_id].total_submissions == null){
                        this.students[student_id].courses[course_id].total_submissions = 0;
                      }

                      // Keep the 3 most recent submissions
                      this.students[student_id].courses[course_id].recent_submissions = this.students[student_id].courses[course_id].recent_submissions.sort((a,b) => {
                        if(a.dueAt < b.dueAt) return -1;
                        if(a.dueAt > b.dueAt) return 1;
                        return 0;
                      }).slice(0, 3)

                      // count total submissions
                      if(this.students[student_id].total_submissions == null){
                        this.students[student_id].total_submissions = this.students[student_id].courses[course_id].total_submissions;
                      }
                      else {
                        this.students[student_id].total_submissions += this.students[student_id].courses[course_id].total_submissions;
                      }

                      // count total complete submissions
                      if(this.students[student_id].total_complete == null){
                        this.students[student_id].total_complete = this.students[student_id].courses[course_id].complete;
                      }
                      else {
                        this.students[student_id].total_complete += this.students[student_id].courses[course_id].complete;
                      }

                      // count total incomplete submissions
                      if(this.students[student_id].total_incomplete == null){
                        this.students[student_id].total_incomplete = this.students[student_id].courses[course_id].incomplete;
                      }
                      else {
                        this.students[student_id].total_incomplete += this.students[student_id].courses[course_id].incomplete;
                      }

                      // count total non-graded submissions
                      if(this.students[student_id].total_non_graded == null){
                        this.students[student_id].total_non_graded = this.students[student_id].courses[course_id].non_graded;
                      }
                      else {
                        this.students[student_id].total_non_graded += this.students[student_id].courses[course_id].non_graded;
                      }

                      // count total missing submissions
                      if(this.students[student_id].total_missing == null){
                        this.students[student_id].total_missing = this.students[student_id].courses[course_id].missing;
                      }
                      else {
                        this.students[student_id].total_missing += this.students[student_id].courses[course_id].missing;
                      }

                      // count total late submissions
                      if(this.students[student_id].total_late == null){
                        this.students[student_id].total_late = this.students[student_id].courses[course_id].late;
                      }
                      else {
                        this.students[student_id].total_late += this.students[student_id].courses[course_id].late;
                      }

                      // count total proficient_advanced
                      if(this.students[student_id].total_proficient_advanced == null){
                        this.students[student_id].total_proficient_advanced = this.students[student_id].courses[course_id].proficient_advanced;
                      }
                      else {
                        this.students[student_id].total_proficient_advanced += this.students[student_id].courses[course_id].proficient_advanced;
                      }

                      // count total developing_not_yet
                      if(this.students[student_id].total_developing_not_yet == null){
                        this.students[student_id].total_developing_not_yet = this.students[student_id].courses[course_id].developing_not_yet;
                      }
                      else {
                        this.students[student_id].total_developing_not_yet += this.students[student_id].courses[course_id].developing_not_yet;
                      }

                      if (typeof(this.students[student_id].total_submissions) == 'number' && this.students[student_id].total_submissions > 0) {
                        this.students[student_id].percent_complete = Math.round( 100 * this.students[student_id].total_complete / this.students[student_id].total_submissions );
                        this.students[student_id].percent_incomplete = Math.round( 100 * this.students[student_id].total_incomplete / this.students[student_id].total_submissions );
                        this.students[student_id].percent_non_graded = Math.round( 100 * this.students[student_id].total_non_graded / this.students[student_id].total_submissions );
                        this.students[student_id].percent_missing = Math.round( 100 * this.students[student_id].total_missing / this.students[student_id].total_submissions );
                        this.students[student_id].percent_late = Math.round( 100 * this.students[student_id].total_late / this.students[student_id].total_submissions );
                      }
                      let adv_prof_dev_ny = this.students[student_id].total_proficient_advanced + this.students[student_id].total_developing_not_yet
                      if (typeof(adv_prof_dev_ny) == 'number' && adv_prof_dev_ny > 0) {
                        this.students[student_id].percent_proficient_advanced = Math.round( 100 * this.students[student_id].total_proficient_advanced / adv_prof_dev_ny );
                      }

                      this.students[student_id].courses[course_id].course_loaded = true;

                      // Update the local filtered_students
                      filtered_students[student_id] = this.students[student_id];

                      // Update the observable filtered_students$
                      this.filtered_students$.next(filtered_students)
                    }
                  }
                  
                });
              }));
            }));
  }
  
  // get_students(full_grade, start, number){
  //   let filtered_students = {};
  //   let get_student_observables: Observable<any>[] = [];
  //   let end;
  //   if(number){
  //     end = start + number
  //   }
  //   else {
  //     end = full_grade.length
  //   }
  //   full_grade.slice(start, end).forEach(student => {
  //     filtered_students[student.id] = student;
  //     this.filtered_students$.next(filtered_students);
  //     let student$ = this.dataService.getStudent(student.id, true);
  //     get_student_observables.push(student$);
  //     get_student_observables.push(timer(this.delay_ms))
  //   })

  //   this.filtered_students$.next(filtered_students);
  //   this.process_students(get_student_observables, filtered_students)

  // }

  // process_students(get_student_observables: Observable<Student>[], filtered_students){
  //   // Once all of the missing courses are loded
  //   this.subsriptions.add(
  //     forkJoin(get_student_observables)
  //       .pipe(
  //         map(students => students.filter(s => typeof(s) != 'number'))
  //       )
  //       .subscribe(students => {

  //         // Get missing submissions
  //         // `students` here is the list of Students who's courses were not loaded
  //         // Students whose courses and submissions already existed don't need 
  //         // submissions loaded.
          
  //         this.student_courses_loaded$.next(true);

  //         // Limit extra calls by combining all students with same courses
  //         let course_student_lists: { [c: string]: string[]} = {}
          
  //         students.forEach(student => {
  //           Object.values(student.courses).forEach( c => {
  //             this.students[student.id].courses[c.course_id] = {
  //                 course_id: c.course_id,
  //                 total_submissions: null,
  //                 complete: null,
  //                 incomplete: null,
  //                 late: null,
  //                 proficient_advanced: null,
  //                 developing_not_yet: null,
  //                 recent_submissions: [],
  //                 course_loaded: false,
  //                 outcome_results: null
  //             }
  //             if(!(c.course_id in course_student_lists)){
  //               course_student_lists[c.course_id] = [];
  //             }
  //             course_student_lists[c.course_id].push(student.id);
  //           });

  //           // Initialize totals
  //           this.students[student.id].total_submissions = null;
  //           this.students[student.id].total_complete = null ;
  //           this.students[student.id].total_incomplete = null;
  //           this.students[student.id].total_late = null;
  //           this.students[student.id].total_proficient_advanced = null;
  //           this.students[student.id].total_developing_not_yet = null;

  //           this.students[student.id].courses_loaded = true;
  //           filtered_students[student.id] = this.students[student.id];
  //           this.filtered_students$.next(filtered_students);
  //         })

          
  //         const course_keys = Object.keys(course_student_lists)

  //         this.subsriptions.add(interval(this.delay_ms)
  //           .pipe(
  //             take(course_keys.length)
  //           )
  //           .subscribe(i => {
            
  //             this.subsriptions.add(this.dataService.getCourse(course_keys[i], null, false).pipe(
  //               skipWhile(course => typeof(course) == 'undefined' || course == null ),
  //               map((course, j) => {
  //                 if(j == 0){
  //                   this.subsriptions.add(timer(this.delay_ms)
  //                     .pipe(
  //                       take(1)
  //                     )
  //                     // submissions are stored on the course in dataService
  //                     .subscribe(_ => this.dataService.getSubmissions(course_student_lists[course_keys[i]], course_keys[i]))
  //                   );
                    
  //                   this.subsriptions.add(timer(this.delay_ms * 2)
  //                     .pipe(
  //                       take(1)
  //                     )
  //                     // assignments are stored on the course in dataService
  //                     .subscribe(_ => this.dataService.getAssignments(course_keys[i]))
  //                   );

  //                   this.subsriptions.add(timer(this.delay_ms * 3)
  //                     .pipe(
  //                       take(1)
  //                     )
  //                     // outcome results are stored locally in adminService
  //                     .subscribe(_ => {
  //                       this.subsriptions.add(this.dataService.getOutcomeResults(course_keys[i], course_student_lists[course_keys[i]])
  //                         .pipe(
  //                           skipWhile(outcome_results => Object.keys(outcome_results).length == 0),
  //                           take(1)
  //                         )
  //                         .subscribe(outcome_results => {
  //                           let all_outcomes = this.all_outcomes$.value;
  //                           if( !all_outcomes ) {
  //                             all_outcomes = {};
  //                           }
  //                           // Use first student to add outcome to all_outcomes
  //                           if( !(course_keys[i] in all_outcomes) ){
  //                             all_outcomes[course_keys[i]] = {};
  //                             for(const [outcome_id, outcome] of Object.entries(Object.values(outcome_results)[0])){
  //                               all_outcomes[course_keys[i]][outcome_id] = {
  //                                 title: outcome.title,
  //                                 has_assessments: false
  //                               }
  //                             }
  //                             this.all_outcomes$.next(all_outcomes)
  //                           }
  //                           // Get each student's outcome results
  //                           for(const [student_id, student_outcome_results] of Object.entries(outcome_results)) {
  //                             filtered_students[student_id].courses[course_keys[i]].outcome_results = student_outcome_results;
  //                             // Update all_outcomes --> has_assessments
  //                             for(const [outcome_id, outcome] of Object.entries(student_outcome_results)){
  //                               if(outcome.results.length > 0){
  //                                 all_outcomes[course_keys[i]][outcome_id].has_assessments = true;
  //                               }
  //                             }
  //                           }
  //                           this.all_outcomes$.next(all_outcomes)
  //                           this.filtered_students$.next(filtered_students);
  //                         }))
  //                     })
  //                   );
  //                 }
  //                 return course
  //               }),
  //               takeWhile(course => {
  //                 // Check if all student submissions have been loaded.
  //                 // If not continue to take
  //                 // If so take the final value, then complete
  //                 if('submissions' in course && 'assignments' in course){
  //                   // Set of all students that should be loaded
  //                   let all_students = new Set(course_student_lists[course_keys[i]]);
  //                   // Set of all students who have submissions loaded
  //                   let loaded_students = new Set(Object.keys(course.submissions));
  //                   if (all_students.size !== loaded_students.size) return true;
  //                   for (var a of all_students) if (!loaded_students.has(a)) return true;
  //                   return false;
  //                 }
  //                 else{
  //                   return true
  //                 }
  //               }, true), // true means it will also take the last value that causes takeWhile to return false
  //               finalize(() => {
  //                 // After all student submissions and assignments have been loaded
  //                 // Go through each student and make total_submissions = 0 for any
  //                 // course that did not have any submissions.
  //                 course_student_lists[course_keys[i]].forEach(student_id => {
  //                   if(this.students[student_id].courses[course_keys[i]].total_submissions == null){
  //                     this.students[student_id].courses[course_keys[i]].total_submissions = 0;
  //                     // Update the local filtered_students
  //                   filtered_students[student_id] = this.students[student_id];
  //                   }
  //                 })
  //                 // Update the observable filtered_students$
  //                 this.filtered_students$.next(filtered_students)
  //               })
  //             ).subscribe(course => { 

  //               const course_id = course_keys[i];

  //               course_student_lists[course_id].forEach(student_id => {
              
  //                 this.students[student_id].courses[course_id].course_name = course.course_name;
                  
  //                 if('submissions' in course && 'assignments' in course){

  //                   if(student_id in course['submissions'] && !this.students[student_id].courses[course_id].course_loaded){
                      
  //                     // Add submission data for the course to the main students data
  //                     Object.values(course.submissions[student_id]).forEach(submission => {

  //                       if(submission.dueAt >= this.start_date$.value && submission.dueAt < this.end_date$.value){

  //                         // count course submissions
  //                         if(course.assignments[submission._id].gradingType != 'not_graded'){
  //                           if(this.students[student_id].courses[course_id].total_submissions == null){
  //                             this.students[student_id].courses[course_id].total_submissions = 1;
  //                           }
  //                           else {
  //                             this.students[student_id].courses[course_id].total_submissions += 1;
  //                           }
  //                         }
                          
  //                         // count course complete submissions
  //                         if(submission.complete == true){
                          
  //                           if(this.students[student_id].courses[course_id].complete == null){
  //                             this.students[student_id].courses[course_id].complete = 1;
  //                           }
  //                           else {
  //                             this.students[student_id].courses[course_id].complete += 1;
  //                           }

  //                           if(this.students[student_id].courses[course_id].incomplete == null){
  //                             this.students[student_id].courses[course_id].incomplete = 0;
  //                           }

  //                         }
  //                         // count course incomplete submissions
  //                         else if(submission.complete == false){

  //                           if(this.students[student_id].courses[course_id].incomplete == null){
  //                             this.students[student_id].courses[course_id].incomplete = 1;
  //                           }
  //                           else {
  //                             this.students[student_id].courses[course_id].incomplete += 1;
  //                           }

  //                           if(this.students[student_id].courses[course_id].complete == null){
  //                             this.students[student_id].courses[course_id].complete = 0;
  //                           }

  //                         }

  //                         // count course late submissions
  //                         if(submission.late){

  //                           if(this.students[student_id].courses[course_id].late == null){
  //                             this.students[student_id].courses[course_id].late = 1;
  //                           }
  //                           else {
  //                             this.students[student_id].courses[course_id].late += 1;
  //                           }

  //                         }
  //                         else {
  //                           if(this.students[student_id].courses[course_id].late == null){
  //                             this.students[student_id].courses[course_id].late = 0;
  //                           }
  //                         }

  //                         // count proficient_advanced and developing_not_yet
  //                         if('rubric' in submission){
  //                           Object.values(submission.rubric).forEach(criteria => {
  //                             if(criteria.points){
  //                               if(criteria.points >= 2){
  //                                 if(this.students[student_id].courses[course_id].proficient_advanced == null){
  //                                   this.students[student_id].courses[course_id].proficient_advanced = 1;
  //                                 }
  //                                 else{
  //                                   this.students[student_id].courses[course_id].proficient_advanced += 1;
  //                                 }
  //                               }
  //                               else{
  //                                 if(this.students[student_id].courses[course_id].developing_not_yet == null){
  //                                   this.students[student_id].courses[course_id].developing_not_yet = 1;
  //                                 }
  //                                 else{
  //                                   this.students[student_id].courses[course_id].developing_not_yet += 1;
  //                                 }
  //                               }
  //                             }
  //                           })
  //                         }

  //                         // Add submissions to recent_submissions...
  //                         submission.grade = this.assignmentsService.letter_number(course.assignments[submission._id], submission) 
  //                         // If submission has a rubric
  //                         if('rubric' in submission){
  //                           this.students[student_id].courses[course_id].recent_submissions.push(submission);
  //                         }
  //                         // If submission has a grade other than 'null','complete', or 'incomplete'
  //                         else if(submission.grade){
  //                           this.students[student_id].courses[course_id].recent_submissions.push(submission);
  //                         }

  //                       }

  //                     });

  //                     if(this.students[student_id].courses[course_id].total_submissions == null){
  //                       this.students[student_id].courses[course_id].total_submissions = 0;
  //                     }

  //                     // Keep the 3 most recent submissions
  //                     this.students[student_id].courses[course_id].recent_submissions = this.students[student_id].courses[course_id].recent_submissions.sort((a,b) => {
  //                       if(a.dueAt < b.dueAt) return -1;
  //                       if(a.dueAt > b.dueAt) return 1;
  //                       return 0;
  //                     }).slice(0, 3)

  //                     // count total submissions
  //                     if(this.students[student_id].total_submissions == null){
  //                       this.students[student_id].total_submissions = this.students[student_id].courses[course_id].total_submissions;
  //                     }
  //                     else {
  //                       this.students[student_id].total_submissions += this.students[student_id].courses[course_id].total_submissions;
  //                     }

  //                     // count total complete submissions
  //                     if(this.students[student_id].total_complete == null){
  //                       this.students[student_id].total_complete = this.students[student_id].courses[course_id].complete;
  //                     }
  //                     else {
  //                       this.students[student_id].total_complete += this.students[student_id].courses[course_id].complete;
  //                     }

  //                     // count total incomplete submissions
  //                     if(this.students[student_id].total_incomplete == null){
  //                       this.students[student_id].total_incomplete = this.students[student_id].courses[course_id].incomplete;
  //                     }
  //                     else {
  //                       this.students[student_id].total_incomplete += this.students[student_id].courses[course_id].incomplete;
  //                     }

  //                     // count total late submissions
  //                     if(this.students[student_id].total_late == null){
  //                       this.students[student_id].total_late = this.students[student_id].courses[course_id].late;
  //                     }
  //                     else {
  //                       this.students[student_id].total_late += this.students[student_id].courses[course_id].late;
  //                     }

  //                     // count total proficient_advanced
  //                     if(this.students[student_id].total_proficient_advanced == null){
  //                       this.students[student_id].total_proficient_advanced = this.students[student_id].courses[course_id].proficient_advanced;
  //                     }
  //                     else {
  //                       this.students[student_id].total_proficient_advanced += this.students[student_id].courses[course_id].proficient_advanced;
  //                     }

  //                     // count total developing_not_yet
  //                     if(this.students[student_id].total_developing_not_yet == null){
  //                       this.students[student_id].total_developing_not_yet = this.students[student_id].courses[course_id].developing_not_yet;
  //                     }
  //                     else {
  //                       this.students[student_id].total_developing_not_yet += this.students[student_id].courses[course_id].developing_not_yet;
  //                     }


  //                     this.students[student_id].percent_complete = Math.round( 100 * this.students[student_id].total_complete / ( this.students[student_id].total_complete + this.students[student_id].total_incomplete) );
  //                     this.students[student_id].percent_incomplete = Math.round( 100 * this.students[student_id].total_incomplete / ( this.students[student_id].total_complete + this.students[student_id].total_incomplete) );
  //                     this.students[student_id].percent_late = Math.round( 100 * this.students[student_id].total_late / ( this.students[student_id].total_complete + this.students[student_id].total_incomplete) );
  //                     this.students[student_id].percent_proficient_advanced = Math.round( 100 * this.students[student_id].total_proficient_advanced / ( this.students[student_id].total_proficient_advanced + this.students[student_id].total_developing_not_yet) );

  //                     this.students[student_id].courses[course_id].course_loaded = true;

  //                     // Update the local filtered_students
  //                     filtered_students[student_id] = this.students[student_id];

  //                     // Update the observable filtered_students$
  //                     this.filtered_students$.next(filtered_students)
  //                   }
  //                 }
                  
  //               });
  //             }));
  //           }));
  //       })
  //   );
  // }

  changePage(page: number){
    this.page$.next(page);
    this.start = (page - 1) * this.number$.value;
    this.updateList();
  }

  coursesLoading(courses: {[id: string]: AdminCourse}): boolean {
    if(typeof(courses) == 'undefined') return true;
    if(!courses) return true;
    if(Object.keys(courses).length == 0) return false;
    if(Object.values(courses).filter(course => course.total_submissions == null).length == 0){
      return false
    }
    return true;
  }

  anyCourseLoading(filtered_students: { [student_id: string]: AdminStudent }): boolean {
    let loading:boolean = false
    Object.keys(filtered_students).forEach(key => {
      if(typeof(filtered_students[key]) != 'undefined' && 'courses' in filtered_students[key]) {
        if(this.coursesLoading(filtered_students[key].courses)) {
          loading = true;
        }
      }
    })
    return loading
  }

}
