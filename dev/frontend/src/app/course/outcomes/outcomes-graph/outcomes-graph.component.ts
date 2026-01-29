import { FilterService } from 'src/app/core/services/filter.service';
import { Assignments } from 'src/app/core/models/assignments';
import { GradingPeriod } from './../../../core/models/grading-period';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Outcomes } from 'src/app/core/models/outcomes';
import { RubricService } from 'src/app/core/services/rubric.service';
import { ActivatedRoute } from '@angular/router';
import { DataService } from 'src/app/core/services/data.service';
import { skipWhile, take } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { CourseService } from '../../course.service';
import { Course } from 'src/app/core/models/course';

@Component({
  selector: 'app-outcomes-graph',
  templateUrl: './outcomes-graph.component.html',
  styleUrls: ['./outcomes-graph.component.scss']
})
export class OutcomesGraphComponent implements OnInit, OnDestroy {

  subscriptions: Subscription;
  course_id: string;
  student_id: string;
  outcomes: Outcomes;
  outcomes_collapsed: { [K: string]: boolean };
  assessments_loaded: boolean;
  assignments: Assignments;
  student_outcomes: Outcomes;
  selected_group: string;
  selected_period: GradingPeriod;
  course: Course;

  constructor(
    private dataService: DataService,
    public rubricService: RubricService,
    private courseService: CourseService,
    private filter: FilterService,
  ) { }

  ngOnInit(): void {
    this.subscriptions = new Subscription();

    // Get selected assignments group and filter submissions/activities
    this.subscriptions.add(this.filter.assignment_group.subscribe(group => {
      this.selected_group = group
      
      if(this.student_outcomes != null) {
        this.filterOutcomes()
      }
    }))
    
    //Get selected period and filter submissions/activities
    this.subscriptions.add(this.filter.period.subscribe(period => {
      this.selected_period = period
      
      if(this.student_outcomes != null) {
        this.filterOutcomes()
      }
    }))

    this.subscriptions.add(this.courseService.course_student_ids$.subscribe(course_student_ids => {

      this.student_id = course_student_ids.student_id
      this.course_id = course_student_ids.course_id

      this.outcomes = {};
      this.outcomes_collapsed = {};
      this.assessments_loaded = false;
      
      this.dataService.getCourse(this.course_id, this.student_id, false)
        .pipe(
          skipWhile(course => {
            if(typeof(course) == 'undefined' || course == null) return true;
            if( !('outcomes' in course)) return true;
            if( !(this.student_id in course.outcomes)) return true;
          }),
          take(1)
        )
        .subscribe(course => {
          this.course = course;
          this.assignments = course.assignments
          if (this.assessments_loaded == false) {
            this.student_outcomes = {}
            this.student_outcomes = course.outcomes[this.student_id]
          }
  
          this.filterOutcomes()
  
          this.assessments_loaded = true;
          // for(const id in course.outcomes[this.student_id]){
          //   let outcome = course.outcomes[this.student_id][id];
          //   this.outcomes_collapsed[id] = true;
          //   outcome.assessment_groups = {}
          //   let index = 0;
          //   outcome.assessments.forEach((assessment, i) => {
          //     if(assessment.points != null){
          //       assessment.index = index;
          //       index = index + 1;
          //     }
          //     if( !(assessment.points in outcome.assessment_groups) ) {
          //       outcome.assessment_groups[assessment.points] = []
          //     }
          //     outcome.assessment_groups[assessment.points].push(assessment);
          //   })
          //   this.outcomes[id] = outcome;
          // }
          // this.assessments_loaded = true;
        });
    }));
  }

  filterOutcomes() {
    Object.entries(this.student_outcomes).forEach(([key, value]) => {
      let outcome = JSON.parse(JSON.stringify(value));

      // filter outcomes
      let filtered_assessments = []
      Object.values(this.assignments).forEach(a => {
        // assessments
        outcome.assessments.forEach(assessment => {
          if (assessment.assignment_id == parseInt(a._id)) {
            // group
            if (a.assignment_group == this.selected_group || this.selected_group == 'All') {
              // period
              if(this.selected_period != null) {
                
                let a_date = new Date(assessment['dueAt'])
                let p_start = new Date(this.selected_period.start_at)
                let p_end = new Date(this.selected_period.end_at)

                if ((a_date >= p_start && a_date <= p_end) || this.selected_period.name == 'All') {
                  filtered_assessments.push(assessment)
                }
              }
              else {
                filtered_assessments.push(assessment)
              }
            }
          }
        })
      })

      outcome.assessments = []
      Object.values(filtered_assessments).forEach(a => {
        outcome.assessments.push(a)
      })
      outcome.assessments.sort((a,b) => (a.dueAt < b.dueAt) ? 1 : ((a.dueAt > b.dueAt) ? -1 : 0))
      // organize assessment groups
      this.outcomes_collapsed[key] = true;
      outcome.assessment_groups = {}
      let index = 0;
      outcome.assessments.forEach((assessment, i) => {
        if(assessment.points != null){
          assessment.index = index;
          index = index + 1;
        }
        if( !(assessment.points in outcome.assessment_groups) ) {
          outcome.assessment_groups[assessment.points] = []
        }
        outcome.assessment_groups[assessment.points].push(assessment);
      })

      this.outcomes[key] = outcome;
    })
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  collapse(outcome_id): void {
    this.outcomes_collapsed[outcome_id] = !this.outcomes_collapsed[outcome_id];
  }


  group_position(points): number {
    if(points < 0.5){
      return this.points_to_percent(points, 0, .5, 8.33333, 16.66667)
    }
    if(points < 2.5){
      return this.points_to_percent(points, 0.5, 2.5, 16.66667, 83.33333)
    }
    else{
      return this.points_to_percent(points, 2.5, 3.5, 83.33333, 100)
    }
  }

  points_to_percent(value, inMin, inMax, outMin, outMax) {
    return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
  }

}
