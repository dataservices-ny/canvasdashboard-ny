import { GradingPeriod } from './../../../core/models/grading-period';
import { FilterService } from 'src/app/core/services/filter.service';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Course } from 'src/app/core/models/course';
import { Observable, Subscription} from 'rxjs';
import { map, take, skipWhile } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';
import { DataService } from 'src/app/core/services/data.service';
import { AssignmentModalService } from 'src/app/shared/assignment-modal/assignment-modal.service';
import { AssignmentsService } from 'src/app/core/services/assignments.service';
import { SectionService } from 'src/app/core/services/section.service';
import { Submission } from 'src/app/core/models/submissions';
import { Assignments } from 'src/app/core/models/assignments';

@Component({
  selector: 'app-assignment-gradebook',
  templateUrl: './assignment-gradebook.component.html',
  styleUrls: ['./assignment-gradebook.component.scss']
})
export class AssignmentGradebookComponent implements OnInit, OnDestroy {

  subscriptions: Subscription;
  course$: Observable<Course>;
  sorted_assignments: { id: string, dueAt: string, hidden: boolean, submittable: boolean }[];
  some_loaded: boolean = false;
  assignments: Assignments;
  selected_group: string;
  selected_period: GradingPeriod;
  current_section: { id: string, name: string };

  constructor(
    private route: ActivatedRoute,
    private dataService: DataService,
    public assignmentsService: AssignmentsService,
    public assignmentModalService: AssignmentModalService,
    public sectionService: SectionService,
    private filter: FilterService
  ) { }

  ngOnInit(): void {
    this.subscriptions = new Subscription();
    this.subscriptions.add(this.route.parent.params.subscribe(p => {
      
      const course_id = p['course_id'];

      this.sorted_assignments = [];
      
      this.course$ = this.dataService.getCourse(course_id, null, false);
      
      this.dataService.getAssignments(course_id);

      // Get students then load submissions.
      this.course$
        .pipe(
          skipWhile(course => typeof(course) == 'undefined' || course == null), 
          take(1)
        )
        .subscribe(course => {
          // Filter to ensure course has changed before loading new section students
          this.sectionService.current_section
            .pipe(
              skipWhile(s => !(s in course.sections))
            )
            .subscribe(current_section_id => {
              let student_ids = [];
              this.sorted_assignments.forEach(a => a.hidden = true)
              if (course.sections[current_section_id]) {
                this.current_section = {
                  'id': course.sections[current_section_id].section_id,
                  'name': course.sections[current_section_id].section_name
                }
                this.filterAssignments()
                course.sections[current_section_id].students.forEach(s => student_ids.push(s.id))
                this.dataService.getSubmissions(student_ids, course_id);
              }
          });
        });

      // Once course has assignments and submissions loaded add them to date sorted list 
      this.course$
        .pipe(
          skipWhile(c => typeof(c) == 'undefined' || c == null || !('assignments' in c)), 
          take(1)
        )
        .subscribe(course => {
          this.assignments = course.assignments
          this.filterAssignments()

          // Trigger to show graebook table
          this.some_loaded = true;
          
        });
    }));

    //Get selected assignments group and filter submissions/activities
    this.subscriptions.add(this.filter.assignment_group.subscribe(group => {
      this.selected_group = group

      // filter assignments
      this.filterAssignments()
    }))

    //Get selected period and filter submissions/activities
    this.subscriptions.add(this.filter.period.subscribe(period => {
      this.selected_period = period

      // filter assignments
      this.filterAssignments()
    }))
  }
  
  filterAssignments(): void {
    if(this.assignments != null) {
      this.sorted_assignments = []

      Object.values(this.assignments).forEach(assignment => {
        let conditions = [
          assignment.published,
          this.selected_group == assignment.assignment_group || this.selected_group == 'All',
        ]
        if(this.selected_period != null) {
          if(this.selected_period.name != 'All') {
            var a_date;
            var a_date_str;

            if (assignment.dueAt.length > 1 && this.current_section.id != 'all') {
              Object.values(assignment.dueAt).forEach(d => {
                if(d.section == this.current_section.id) {
                  a_date = new Date(d.date)
                  a_date_str = d.date
                }
              })
            }
            else {
              a_date = new Date(assignment.dueAt[0].date)
              a_date_str = assignment.dueAt[0].date
            }
            let p_start = new Date(this.selected_period.start_at)
            let p_end = new Date(this.selected_period.end_at)
            conditions.push(a_date >= p_start && a_date <= p_end)
          }
          if(conditions.indexOf(false) === -1){
            this.sorted_assignments.push({
              id: assignment._id,
              dueAt: a_date_str,
              submittable: assignment.submittable,
              hidden: true
            });
          }
        }
      });
      this.sorted_assignments.sort((a,b) => {
        if ( a.dueAt < b.dueAt ) return -1;
        if ( a.dueAt > b.dueAt ) return 1;
        return 0;
      })      
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  missing_count(student_id: string): Observable<{[key: string]: number}>{
    return this.course$.pipe(
      map(course => {
        let count = 0
        let total = 0
        if(student_id in course.submissions){
          Object.values(course.submissions[student_id]).forEach(a => {
            Object.values(this.sorted_assignments).forEach(sa => {
              if (sa.id == a._id) {
                total = total +1
                if (a.missing == true) {
                  count = count +1
                }
              }
            })
          })
        }
        return { 'count': count, 'percentage': count/total }
      })
    )
  }

  incomplete_count(student_id: string): Observable<{[key: string]: number}>{
    return this.course$.pipe(
      map(course => {
        let count = 0
        let total = 0
        if(student_id in course.submissions){
          Object.values(course.submissions[student_id]).forEach(a => {
            Object.values(this.sorted_assignments).forEach(sa => {
              if (sa.id == a._id) {
                total = total +1
                if (a.complete == false) {
                  count = count +1
                }
              }
            })
          })
        }
        return { 'count': count, 'percentage': count/total }
      })
    )
  }

  complete_count(student_id: string): Observable<{[key: string]: number}>{
    return this.course$.pipe(
      map(course => {
        let count = 0
        let total = 0
        if(student_id in course.submissions){
          Object.values(course.submissions[student_id]).forEach(a => {
            Object.values(this.sorted_assignments).forEach(sa => {
              if (sa.id == a._id) {
                total = total +1
                if (a.complete == true) {
                  count = count +1
                }
              }
            })
          })
        }
        return { 'count': count, 'percentage': count/total }
      })
    )
  }

  late_count(student_id: string): Observable<{[key: string]: number}>{
    return this.course$.pipe(
      map(course => {
        let count = 0
        let total = 0
        if(student_id in course.submissions){
          Object.values(course.submissions[student_id]).forEach(a => {
            Object.values(this.sorted_assignments).forEach(sa => {
              if (sa.id == a._id && sa.submittable) {
                total = total +1
                if (a.late == true) {
                  count = count +1
                }
              }
            })
          })
        }
        return { 'count': count, 'percentage': count/total }
      })
    )
  }

  non_graded_count(student_id: string): Observable<{[key: string]: number}>{
    return this.course$.pipe(
      map(course => {
        let count = 0
        let total = 0
        if(student_id in course.submissions){
          Object.values(course.submissions[student_id]).forEach(a => {
            Object.values(this.sorted_assignments).forEach(sa => {
              if (sa.id == a._id) {
                total = total +1
                if (a.complete == null) {
                  count = count +1
                }
              }
            })
          })
        }
        return { 'count': count, 'percentage': count/total }
      })
    )
  }

  // This feature is under construction.  need to figure out how to hide table columns.
  get_submission(course, assignment, student_id): Submission {
    if(course.hasOwnProperty('submissions')){
      if(course.submissions.hasOwnProperty(student_id)){
        if(course.submissions[student_id].hasOwnProperty(assignment.id)){
          assignment.hidden = false;
          return course.submissions[student_id][assignment.id];
        }
      }
    }
    return null
  }

}
