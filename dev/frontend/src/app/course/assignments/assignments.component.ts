import { GradingPeriod } from './../../core/models/grading-period';
import { Activities } from './../../core/models/activities';
import { Submissions } from './../../core/models/submissions';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Assignments } from 'src/app/core/models/assignments';
import { AssignmentsService } from 'src/app/core/services/assignments.service';
import { DataService } from 'src/app/core/services/data.service';
import { skipWhile } from 'rxjs/operators';
import { Submission } from 'src/app/core/models/submissions';
import { Subscription } from 'rxjs';
import { Activity } from 'src/app/core/models/activities';
import { CourseService } from '../course.service';
import { FilterService } from './../../core/services/filter.service';
import { stringify } from '@angular/compiler/src/util';

@Component({
  selector: 'app-assignments',
  templateUrl: './assignments.component.html',
  styleUrls: ['./assignments.component.scss']
})
export class AssignmentsComponent implements OnInit, OnDestroy {
  
  course_id: string;
  student_id: string;
  course_submissions: Submissions;
  course_activities: Activities;
  submissions: {
    incomplete_or_missing: Submission[],
    pending: Submission[],
    complete: Submission[]
  };
  assignments: Assignments;
  upcoming: { [k: string]: Activity|Submission };
  has_number_letter_grades: boolean = false;
  subscriptions: Subscription;
  show_spinner: boolean = true;
  selected_group: string;
  selected_period: GradingPeriod;
  upcoming_num: number;
  incomplete_or_missing_num: number;

  constructor(
    private courseService: CourseService,
    private dataService: DataService,
    public assignmentsService: AssignmentsService,
    private filter: FilterService,
    ) { }

  ngOnInit(): void {
    
    this.subscriptions = new Subscription();
    
    this.subscriptions.add(this.courseService.course_student_ids$.subscribe(course_student_ids => {

      this.student_id = course_student_ids.student_id
      this.course_id = course_student_ids.course_id
      
      this.upcoming = {};
      this.assignments = null;
      this.submissions = null;
      let activities_loaded = false;
      
      this.dataService.getSubmissions(this.student_id, this.course_id);
      this.dataService.getActivities(this.course_id, this.student_id);
      
      this.subscriptions.add(this.dataService.getCourse(this.course_id, this.student_id, false)
        .pipe(
          skipWhile(c => typeof(c) == 'undefined' || c == null)
        )
        .subscribe(course => {
          
          this.show_spinner = true;

          //Assignments
          if(this.assignments == null && 'assignments' in course){
            this.assignments = course.assignments;
            for(const [id, a] of Object.entries(course.assignments)){
              a.isCollapsed = true;
              a.descriptionIsCollapsed = true;
            }
          }

          //Submissions
          if(this.assignments != null && 'submissions' in course){
            this.course_submissions = course.submissions;
            if(this.student_id in course.submissions){
              this.submissions = {
                incomplete_or_missing: [],
                pending: [],
                complete: []
              }

              // Filter submissions
              this.filterSubmissions()
              
              // Add number/letter grade items to the key.
              Object.values(course.submissions[this.student_id]).forEach(s => {
                if((s._id in course.assignments && course.assignments[s._id].users.includes(this.student_id))){                  
                  if(!this.has_number_letter_grades){
                    if(this.assignmentsService.letter_number(course.assignments[s._id], s)){
                      this.has_number_letter_grades = true
                    } 
                  } 
                }
              });
              this.show_spinner = false;
            }
          }
          
          //Activities
          if(!activities_loaded && 'activities' in course){
            this.course_activities = course.activities;
            // Filter Activities
            this.filterActivities()
            this.show_spinner = false;
          }

          //Define the number of: (1) upcoming assignments/activities, (2) missing/incomplete assignments
          if(this.upcoming != null){
            this.upcoming_num = this.num_keys(this.upcoming)
          }
          if (this.submissions != null){
            if (this.submissions.incomplete_or_missing != null){
              this.incomplete_or_missing_num = this.num_keys(this.submissions.incomplete_or_missing)
            }
          }
        }));

    }));

    //Get selected assignments group and filter submissions/activities
    this.subscriptions.add(this.filter.assignment_group.subscribe(group => {
      this.selected_group = group

      // reset submissions/activities objects
      this.submissions = {
        incomplete_or_missing: [],
        pending: [],
        complete: []
      }
      this.upcoming = {};

      // filter submissions/activities
      this.filterSubmissions()
      this.filterActivities()
    }))

    //Get selected period and filter submissions/activities
    this.subscriptions.add(this.filter.period.subscribe(period => {
      this.selected_period = period

      // reset submissions/activities objects
      this.submissions = {
        incomplete_or_missing: [],
        pending: [],
        complete: []
      }
      this.upcoming = {};

      // filter submissions/activities
      this.filterSubmissions()
      this.filterActivities()
    }))
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  num_keys(o): number {
    return Object.keys(o).length
  }

  expandAll(): void {
    Object.values(this.assignments).forEach(assignment => assignment.isCollapsed = false);
  }

  collapseAll(): void {
    Object.values(this.assignments).forEach(assignment => assignment.isCollapsed = true);
    Object.values(this.assignments).forEach(assignment => assignment.descriptionIsCollapsed = true);
  }

  allExpanded(): boolean {
    return Object.values(this.assignments).every(assignment => assignment.isCollapsed == false)
  }

  allCollapsed(): boolean {
    return Object.values(this.assignments).every(assignment => assignment.isCollapsed == true)
  }

  filterSubmissions(): void {
    if (this.course_submissions != null) {
      if (this.num_keys(this.course_submissions) > 0) {

        const now = new Date().toISOString();
        Object.values(this.course_submissions[this.student_id]).forEach(s => {
          let conditions = [
            s._id in this.assignments,
            this.assignments[s._id].users.includes(this.student_id),
          ]
          // group filter
          if(this.selected_group != null) {
            conditions.push(this.assignments[s._id].assignment_group == this.selected_group || this.selected_group == 'All')
          }
          // period filter
          if(this.selected_period != null) {
            if(this.selected_period.name != 'All') {
              let a_date = new Date(s.dueAt)
              let p_start = new Date(this.selected_period.start_at)
              let p_end = new Date(this.selected_period.end_at)
              conditions.push(a_date >= p_start && a_date <= p_end)
            }
            else {
              conditions.push(this.selected_period.name == 'All')
            }
          }
          if(conditions.indexOf(false) === -1){
            // All upcoming assignment go in the upcoming section
            if(s.dueAt > now){
              this.upcoming[`s_${s._id}`] = s;
            }
            // All past incomplete assignments go in the incomplete/missing section
            if(s.complete === false){
              this.submissions.incomplete_or_missing.push(s);
            }    
            // All past complete assignments go in the complete section
            else if(s.complete === true){
              this.submissions.complete.push(s);
            }
            // All not_graded assignments go in the complete section
            else if(this.assignments[s._id].gradingType == 'not_graded'){
              this.submissions.complete.push(s);
            }
            // All past missing assignments go in the incomplete/missing section
            else if(s.missing === true){
              this.submissions.incomplete_or_missing.push(s);
            }
            // All other past assignments go in the not yet graded
            else{
              this.submissions.pending.push(s)
            }
          }
        });
      }
    }
  }

  filterActivities(): void {
    if (this.course_activities != null) {
      if (this.num_keys(this.course_activities) > 0) {
        Object.values(this.course_activities).forEach(a => {
          let conditions = [
            a.users.includes(this.student_id)
          ]
          // period filter
          if(this.selected_period != null) {
            if(this.selected_period.name != 'All') {
              let a_date = new Date(a.dueAt)
              let p_start = new Date(this.selected_period.start_at)
              let p_end = new Date(this.selected_period.end_at)
              conditions.push(a_date >= p_start && a_date <= p_end)
            }
            else {
              conditions.push(this.selected_period.name == 'All')
            }
          }
          if(conditions.indexOf(false) === -1){
            a.isCollapsed = true;
            a.dueAt = a.date
            this.upcoming[`s_${a._id}`] = a;
          }
        })
      }
    }
  }

}
