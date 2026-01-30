import { FilterService } from 'src/app/core/services/filter.service';
import { DataFilterComponent } from './../../../shared/data-filter/data-filter.component';
import { GradingPeriod } from './../../../core/models/grading-period';
import { Assignments } from 'src/app/core/models/assignments';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { RubricService } from 'src/app/core/services/rubric.service';
import { skipWhile, take } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { Outcomes } from 'src/app/core/models/outcomes';
import { DataService } from 'src/app/core/services/data.service';
import { CourseService } from '../../course.service';
import { Course } from 'src/app/core/models/course';

@Component({
  selector: 'app-outcomes-list',
  templateUrl: './outcomes-list.component.html',
  styleUrls: ['./outcomes-list.component.scss']
})
export class OutcomesListComponent implements OnInit, OnDestroy {

  subscriptions: Subscription;
  course_id: string;
  student_id: string;
  outcomes: Outcomes = {};
  outcomes_collapsed: { [K: number]: boolean } = {}
  description_expanded: { [K: string]: boolean } = {};
  keyIsCollapsed: boolean = true;
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

    // this.subscriptions.add(this.route.parent.params.subscribe(p => {
   
    this.subscriptions.add(this.courseService.course_student_ids$.subscribe(course_student_ids => {

      this.student_id = course_student_ids.student_id
      this.course_id = course_student_ids.course_id
      // this.course_id = p['course_id']
      // this.student_id = p['student_id']
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
          if( !('outcomes' in course)) return null
          if( !(this.student_id in course.outcomes)) return null
          
          this.assignments = course.assignments
          if (this.assessments_loaded == false) {
            this.student_outcomes = {}
            this.student_outcomes = course.outcomes[this.student_id]
          }
  
          this.filterOutcomes()
  
          this.assessments_loaded = true;

          // for(const id in course.outcomes[this.student_id]){
          //   let outcome = course.outcomes[this.student_id][id];
          //   this.outcomes_collapsed[id] = false;
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

      // organize assessment groups
      this.outcomes_collapsed[key] = false;
      if (this.description_expanded[key] === undefined) {
        this.description_expanded[key] = false;
      }
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
    this.outcomes_collapsed[outcome_id] = !this.outcomes_collapsed[outcome_id]
  }

  toggleDescription(outcome_id): void {
    this.description_expanded[outcome_id] = !this.description_expanded[outcome_id];
  }

}
