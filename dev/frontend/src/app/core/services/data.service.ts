import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject, Observable, of, pipe } from 'rxjs';
import { Course } from '../models/course';
import { ApiService } from './api.service';
import { take, skipWhile, switchMap, tap, map, concatMap } from 'rxjs/operators';
import { UserService } from './user.service';
import { Assignment } from '../models/assignments';
import { Student } from '../models/user';
import { Submission } from '../models/submissions';
import { Activity } from '../models/activities';
import { CourseOutcomeResults } from '../models/course-outcome-results';
import { Term } from '../models/term';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  private COURSES: {[course_id: string]: Subject<Course>} = {};
  public STUDENTS$: BehaviorSubject<{[student_id: string]: Student}> = new BehaviorSubject({});
  // public STUDENTS$: Subject<Student[]> = new BehaviorSubject<Student[]>(null);
  private TERMS: BehaviorSubject<Term[]> = new BehaviorSubject(null);

  constructor(
    private userService: UserService,
    private apiService: ApiService
  ) {
    userService.getUser().pipe(
      skipWhile(u => typeof(u) == 'undefined'),
      take(1)
    ).subscribe(user => {
      if(user.admin){
        this.getAllStudents();
      }
    })
  }

  getCourse(course_id: string, student_id: string = null, get_sections: boolean = false): Subject<Course> {
    
    if( !(course_id in this.COURSES) ){
      this.COURSES[course_id] = new BehaviorSubject<Course>(null)
    
      this.userService.getUser().pipe(
        skipWhile(u => typeof(u) == 'undefined'),
        take(1)
      ).subscribe(user => {
        
        let course = null;
        if('student' in user){
          course = user.student.find(c => c.course_id == course_id);
        }
        if(!course && 'teacher' in user){
          course = user.teacher.find(course => course.course_id == course_id)
        } 
        if(!course && 'observer' in user){
          for(const observee of user.observer){
            if(observee.id == student_id){
              course = observee.courses.find(c => c.course_id == course_id)
            }
          }
        }
        if(course && course.periods){
          this.COURSES[course_id].next(course)
        }
        else{
          this.apiService.getCourse(course_id, student_id, get_sections)
            .pipe(
              skipWhile(c => typeof(c) == 'undefined'),
              take(1)
            )
            .subscribe(course => this.COURSES[course_id].next(course));
        }
      })
    }

    return this.COURSES[course_id]
  }

  getTerms(): Observable<Term[]> {
    if(this.TERMS.value){
      return this.TERMS
    }
    else{
      return this.apiService.getTerms()
        .pipe(
          skipWhile(t => typeof(t) == 'undefined'),
          take(1),
          tap(terms => this.TERMS.next(terms))
        )
    }
  }
    

  getStudent(student_id: string, get_courses: boolean = false): Observable<Student> {

    if(student_id in this.STUDENTS$.value){
      if( !get_courses || (get_courses && 'courses' in this.STUDENTS$.value[student_id]) ){
        return of(this.STUDENTS$.value[student_id]);
      }
    }
    
    return this.userService.getUser().pipe(
      skipWhile(user => typeof(user) == 'undefined'),
      take(1),
      switchMap(user => {
        
        if (user.admin){
          // Get all courses for the student, not just those user teaches or observes.
          return this.apiService.getStudent(student_id)
                  .pipe(
                    take(1),
                    tap(student => this.STUDENTS$.next(Object.assign(this.STUDENTS$.value, {[student.id]:  student})))
                  );
        }
        
        let student;
        if('student' in user){
          if(student_id == user.id){
            student =  {
              email: user.email,
              id: user.id,
              name: user.name,
              courses: {}
            }
            user.student.forEach(course => {
              student.courses[course.course_id] = course
            })
          }
        }
        if('teacher' in user){
          user.teacher.forEach(course => {
            Object.values(course.sections).forEach(section => {
              section.students.forEach(s => {
                if(s.id == student_id){
                  if(!student){
                    student = s
                    student.courses = {}
                  }
                  student.courses[course.course_id] = {
                    course_id: course.course_id,
                    course_name: course.course_name,
                    section_id: section.section_id,
                    section_name: section.section_name,
                  }
                  return
                }
              })
            })
          })
        }
        if('observer' in user){
          user.observer.forEach(observee => {
            if(observee.id == student_id){
              if(!student){
                student = {
                  id: observee.id,
                  email: observee.email,
                  name: observee.name,
                  short_name: observee.short_name,
                  sortable_name: observee.sortable_name,
                  courses: {}
                }
              }
              observee.courses.forEach(course => {
                student.courses[course.course_id] = course
              })
            }
          })
        }
        if(student){
          return of(student)
        }
        else{
          console.log("no access to this student")
          return of(null)
        }
      }))
  }

  getMutipleStudents(students_ids: string[], get_courses: boolean = false): Observable<Student[]> {
    let permission:Boolean = false;
    this.userService.getUser().pipe(
      skipWhile(user => typeof(user) == 'undefined'),
      take(1)
      ).subscribe(user => {  
        if (user.admin){
          permission = true
        }
      })

      let students_observables:Observable<Student[]>;
      if (permission) {
        students_observables = this.apiService.getMultipleStudents(students_ids)                  
          .pipe(
            take(1),
            tap(students => students.forEach(student => {
               this.STUDENTS$.next(Object.assign(this.STUDENTS$.value, {[student.id]:  student}))
            }))
          )
      }
      return students_observables
  }

  getAllStudents(): void {
    this.apiService.getAllStudents()
      .pipe(
        skipWhile(students => typeof(students) == 'undefined'),
        take(1)
      )
    .subscribe(students => {
      let students_object = {}
      students.forEach(student => students_object[student.id] = student)
      this.STUDENTS$.next(students_object)
    })
  }

  getAssignments(course_id: string, student_id: string = null, number: number = 0): void {
    this.getCourse(course_id, student_id, false)
      .pipe(
        skipWhile(c => typeof(c) == 'undefined' || c == null),
        take(1)
      )
      .subscribe(course => {
        // Check if teacher or admin has already loaded the course assignments
        // Initialize course.all_assignments_loaded
        if(!('all_assignments_loaded' in course)) {
          course.all_assignments_loaded = false;
        }
        // Initialize course.assignments_loaded_for array
        if(!('assignments_loaded_for' in course)) {
          course.assignments_loaded_for = [];
        }
        // Initialize course.assignments_groups array
        if(!('assignments_groups' in course)) {
          course.assignments_groups = [];
        }
        // Initialize course.hasMajor flag
        if(!('hasMajor' in course)) {
          course.hasMajor = false;
        }
        // Check to see if all assignments or the assignments for the requested student are already loaded
        if( course.all_assignments_loaded || (student_id && course.assignments_loaded_for.includes(student_id))){
          return
        }
        else {
          // Ensure that all assignments are loaded for teacher and admin roles
          // This way teachers won't need to reload assignments over and over
          if(['teacher', 'admin'].includes(course.role)){
            student_id = null
          }
          
          // Call the api service
          this.apiService.getAssignments(course_id, student_id)
            .pipe(take(1))
            .subscribe(assignments => {
              // Add the returned assignments if they are not already loaded
              // else add the students to the user list for the assignment
              if(!('assignments' in course)){
                course.assignments = {}
              }
              for(const a in assignments){
                if(!(a in course.assignments)){
                  course.assignments[a] = assignments[a];
                }
                else{
                  assignments[a].users.forEach(user => {
                    if(!course.assignments[a].users.includes(user)){
                      course.assignments[a].users.push(user);
                    }
                  })
                }
              }
              
              // Build the assignments_groups array (unique values)
              const assignmentGroups = new Set<string>();
              for (let a in course.assignments) {
                let group = course.assignments[a].assignment_group

                if (typeof group == 'string') {
                  assignmentGroups.add(group)
                }
              }
              course.assignments_groups = [...assignmentGroups];
              course.hasMajor = course.assignments_groups.some(group => group.toLowerCase().includes('major'));

              // Add the student_id to the list of students for whom assignments are loaded 
              // else for teachers and admins set course.all_assignments_loaded = true
              if(student_id && !(course.assignments_loaded_for.includes(student_id))){
                course.assignments_loaded_for.push(student_id)
              }
              else{
                course.all_assignments_loaded = true
              }

              // Emit new course subject
              this.COURSES[course_id].next(course)
            })
        }
      });
  }

  getActivities(course_id: string, student_id: string): void {
    this.getCourse(course_id, student_id, false)
      .pipe(
        skipWhile(c => typeof(c) == 'undefined' || c == null), 
        take(1))
      .subscribe(course => {
      
        // Initialize course.assignments_loaded_for array
        if(!('activities_loaded_for' in course)) {
          course.activities_loaded_for = [];
        }

        // Check if activities are already loaded for this student
        if( course.activities_loaded_for.includes(student_id) ){
          return
        }
        else {
          // Call the api service
          this.apiService.getActivities(course_id, student_id, this.getStudentSection(course, student_id))
            .pipe(
              take(1)
            )
            .subscribe(activities => {
              // Add the returned activities if they are not already loaded
              // else add the students to the user list for the assignment
              if(!('activities' in course)){
                course.activities = {}
              }
              for(const a in activities){
                if(!(a in course.activities)){
                  course.activities[a] = activities[a];
                }
                else{
                  activities[a].users.forEach(user => {
                    if(!course.activities[a].users.includes(user)){
                      course.activities[a].users.push(user);
                    }
                  });
                  activities[a].sections.forEach(section => {
                    if(!course.activities[a].sections.includes(section)){
                      course.activities[a].sections.push(section);
                    }
                  })
                }
              }

              // Add the student_id to the list of students for whom activities are loaded 
              if(!(course.activities_loaded_for.includes(student_id))){
                course.activities_loaded_for.push(student_id)
              }

              // Emit new course subject
              this.COURSES[course_id].next(course)
            })
        }
      });
  }

  getSubmissions(student_ids: string | string[], course_id: string): void {
    this.getCourse(course_id, (typeof student_ids == 'string' ? student_ids : null), false)
      .pipe(
        skipWhile(c => typeof(c) == 'undefined' || c == null), 
        take(1)
      )
      .subscribe(course => {
        if( !('submissions' in course) ){
          course.submissions = {};
        }
        if(typeof(student_ids) == 'string'){
          student_ids = [student_ids];
        }
        let get_from_api = []
        student_ids.forEach(id => {
          if(!(id in course.submissions)){
            get_from_api.push(id);
          }
        })
        this.apiService.getSubmissions(get_from_api, course_id)
          .pipe(
            take(1)
          )
          .subscribe(submissions => { 
            course.submissions = Object.assign(course.submissions, submissions);
            this.COURSES[course_id].next(course);
          });
        this.COURSES[course_id].next(course);
      });
  }

  getAssignment(course_id: string, student_id: string, assignment_id: string): BehaviorSubject<Assignment> {
    let assignment$ = new BehaviorSubject<Assignment>(null);
    this.getCourse(course_id, student_id, false)
      .pipe(
        skipWhile(course => !course), 
        take(1)
      )
      .subscribe(course => {
        let get_from_api = true;
        if('assignments' in course){
          if(assignment_id in course.assignments){
            get_from_api = false;
            assignment$.next(course.assignments[assignment_id]);
          }
        }
        if(get_from_api){
          this.apiService.getAssignments(course_id, assignment_id)
            .pipe(
              take(1)
            )
            .subscribe(assignments => {
              if( !('assignments' in course)){
                course.assignments = {}
              }
              course.assignments = Object.assign(course.assignments, assignments);
              this.COURSES[course_id].next(course);
              assignment$.next(assignments[assignment_id]);
            });
        }
      });
    return assignment$
  }

  getSubmission(student_id: string, course_id: string, assignment_id: string): BehaviorSubject<Submission> {
    let submission$ = new BehaviorSubject<Submission>(null);
    this.getCourse(course_id, student_id, false)
      .pipe(
        skipWhile(course => !course), 
        take(1)
      )
      .subscribe(course => {
        let get_from_api = true;
        if('submissions' in course){
          if(student_id in course.submissions){
            if(assignment_id in course.submissions[student_id]){
              get_from_api = false;
              submission$.next(course.submissions[student_id][assignment_id]);
            }
          }
        }
        if(get_from_api){
          this.apiService.getSubmissions(student_id, course_id)
            .pipe(
              take(1)
            )
            .subscribe(submissions => {
              if( !('submissions' in course)){
                course.submissions = {}
              }
              course.submissions = Object.assign(course.submissions, submissions)
              this.COURSES[course_id].next(course);
              submission$.next(submissions[student_id][assignment_id])
            });
        }
      });
    return submission$
  }

  getActivity(course_id: string, student_id: string, activity_id: string): BehaviorSubject<Activity> {
    let activity$ = new BehaviorSubject<Activity>(null);
    this.getCourse(course_id, student_id, false)
      .pipe(
        skipWhile(course => !course), 
        take(1))
      .subscribe(course => {
        let get_from_api = true;
        if('activities' in course){
          if(activity_id in course.activities){
            get_from_api = false;
            activity$.next(course.activities[activity_id]);
          }
        }
        if(get_from_api){
          this.apiService.getActivities(course_id, student_id, this.getStudentSection(course, student_id)).pipe(take(1)).subscribe(activities => {
            if( !('activities' in course)){
              course.activities = {}
            }
            course.activities = Object.assign(course.activities, activities);
            this.COURSES[course_id].next(course);
            activity$.next(activities[activity_id]);
          })
        }
      });
    return activity$
  }

  getOutcomeAssessments(course_id: string, student_id: string): void {
    this.getCourse(course_id, student_id, false)
      .pipe(
        skipWhile(course => !course), 
        take(1))
      .subscribe(course => {
        if( !('outcomes' in course) ){
          course.outcomes = {}
        }
        if(student_id in course.outcomes){
          return
        }
        else {
          // Retrieve from API
          this.apiService.getOutcomeAssessments(course_id, student_id)
            .pipe(
              take(1)
            )
            .subscribe(outcomes => {
              for (const [id, outcome] of Object.entries(outcomes)) {
                outcome.assessments.sort((a, b) => {
                  if(a.dueAt > b.dueAt) return -1
                  if(a.dueAt < b.dueAt) return 1
                  else return 0
                });
              }
            course.outcomes = Object.assign(course.outcomes, { [student_id]: outcomes });
            this.COURSES[course_id].next(course)
          });
        }
      });
  }

  getOutcomeAssessmentsAlt(course_id: string, students_ids: string): void {
    this.getCourse(course_id, students_ids, false)
      .pipe(
        skipWhile(course => !course), 
        take(1))
      .subscribe(course => {
        if( !('outcomes' in course) ){
          course.outcomes = {}
        }
        let all_s_ids = true
        let s_ids_arr = students_ids.split(",")      
        let new_students = []

        for (let s of s_ids_arr) {
          if(!(s in course.outcomes)) {
            all_s_ids = false
            new_students.push(s)
          }
        }

        if(all_s_ids == true){
          return
        }
        else {
          // Retrieve from API
          this.apiService.getOutcomeAssessmentsAlt(course_id, new_students.join())
            .pipe(
              take(1)
            )
            .subscribe(all_outcomes => {
              //Object.values(all_outcomes).forEach(s_outcomes => {
              for (const [s_id, s_outcomes] of Object.entries(all_outcomes)) {
                for (const [id, outcome] of Object.entries(s_outcomes)) {
                  outcome.assessments.sort((a, b) => {
                    if(a.dueAt > b.dueAt) return -1
                    if(a.dueAt < b.dueAt) return 1
                    else return 0
                  });
                }
                course.outcomes = Object.assign(course.outcomes, { [s_id]: s_outcomes });
              }
            this.COURSES[course_id].next(course)
          });
        }
      });
  }

  getOutcomeResults(course_id: string, student_ids: string[]): Observable<{[student_id: string]: CourseOutcomeResults}> {
    return this.apiService.getOutcomeResults(course_id, student_ids)
  }

  getStudentSection(course: Course, student_id: string): string {
    for (const [id, section] of Object.entries(course.sections)){
      if(section.students.find(student => student.id == student_id)) {
        return section.section_id;
      }
    }
  }

}
