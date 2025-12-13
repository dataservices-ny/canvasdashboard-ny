import { Component, OnInit, Input, AfterContentChecked } from '@angular/core';
import { Course } from 'src/app/core/models/course';
import { Observable } from 'rxjs';
import { DataService } from 'src/app/core/services/data.service';
import { AssignmentModalService } from 'src/app/shared/assignment-modal/assignment-modal.service';
import { AssignmentsService } from 'src/app/core/services/assignments.service';
import { Submission } from 'src/app/core/models/submissions';
import { skipWhile, take, takeWhile } from 'rxjs/operators';
import { ActivityModalService } from 'src/app/shared/activity-modal/activity-modal.service';
import { Activity } from 'src/app/core/models/activities';


@Component({
  selector: 'app-course-card',
  templateUrl: './course-card.component.html',
  styleUrls: ['./course-card.component.scss']
})
export class CourseCardComponent implements OnInit, AfterContentChecked {

  @Input() course_info: Course;
  @Input() student_id: string;
  course$: Observable<Course>;
  upcoming: any[] = [];
  announcements: Activity[] = [];
  feedback: Submission[] = [];
  missing_or_incomplete: Submission[] = [];
  empty: boolean = false;
  loaded: boolean = false;
  
  constructor(
    private dataService: DataService,
    public assignmentsService: AssignmentsService,
    public assignmentModalService: AssignmentModalService,
    public activityModalService: ActivityModalService
  ) { }

  ngOnInit(): void {
    this.dataService.getAssignments(this.course_info.course_id, this.student_id);
    this.dataService.getSubmissions(this.student_id, this.course_info.course_id);
    this.dataService.getActivities(this.course_info.course_id, this.student_id);
    this.course$ = this.dataService.getCourse(this.course_info.course_id, this.student_id, false);
    this.course$
    .pipe(
      skipWhile(c => typeof(c) == 'undefined' || c == null),
      takeWhile(c => {
        if( 'assignments' in c && Object.keys(c.assignments).length == 0 &&
            'activities' in c && Object.keys(c.activities).length == 0) {
          this.empty = true;
          this.loaded = true;
          return false
        }
        else{
          return true
        }
      }),
      skipWhile(c => {
        if( !('assignments' in c)) return true
        if( !('submissions' in c)) return true
        if( !('activities' in c)) return true
        if( !(this.student_id in c.submissions)) return true
      }),
      take(1)
    )
    .subscribe(course => {
        
        // Add submissions
        Object.values(course.submissions[this.student_id]).forEach(s => {
          if((s._id in course.assignments && course.assignments[s._id].users.includes(this.student_id))){
            if(new Date(s.dueAt) >= new Date()) this.upcoming.push(s)
            else if(s.complete == true) this.feedback.push(s);
            else if(s.complete == false || s.missing == true) this.missing_or_incomplete.push(s);
          }
        })
        
        // Add activities
        Object.values(course.activities).forEach(a => {
          // Ensure only the current student's activities are displayed
          if(a.users.includes(this.student_id) ){ //&& course.sections[a.section] && course.sections[a.section].students.find(s => s.id == this.student_id)
            if(a.type == 'announcement'){
              this.announcements.push(a);
            }
            else{
              this.upcoming.push(a);
            }
          }
        });
        
        // Sort
        this.feedback.sort((a, b) => this.sortByDueDate(a.dueAt, b.dueAt));
        this.upcoming.sort((a, b) => this.sortByDueDate(a.dueAt, b.dueAt));
        this.missing_or_incomplete.sort((a, b) => this.sortByDueDate(a.dueAt, b.dueAt));
        this.loaded = true;
      })
    
  }

  sortByDueDate(a, b): number{
    if (a < b) return 1
    if (a > b) return -1
    return 0;
  } 

  ngAfterContentChecked(){
    this.noTooltip = function(e){
      return (e.offsetWidth >= e.scrollWidth);
    }
  }

  noTooltip(e): boolean {
    return false
  }

  isSubmission(x): boolean {
    return 'dueAt' in x
  }
}
