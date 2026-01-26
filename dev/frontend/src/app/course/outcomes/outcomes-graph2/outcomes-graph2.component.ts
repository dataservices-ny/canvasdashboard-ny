import { GradingPeriod } from './../../../core/models/grading-period';
import { Assignments } from 'src/app/core/models/assignments';
import { Component, OnInit, ElementRef, ViewChildren, QueryList, AfterViewChecked, OnDestroy } from '@angular/core';
import { Outcomes } from 'src/app/core/models/outcomes';
import { RubricService } from 'src/app/core/services/rubric.service';
import { DataService } from 'src/app/core/services/data.service';
import { AssignmentModalService } from 'src/app/shared/assignment-modal/assignment-modal.service';
import { skipWhile, take } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { CourseService } from '../../course.service';
import { FilterService } from 'src/app/core/services/filter.service';

@Component({
  selector: 'app-outcomes-graph2',
  templateUrl: './outcomes-graph2.component.html',
  styleUrls: ['./outcomes-graph2.component.scss']
})
export class OutcomesGraph2Component implements OnInit, OnDestroy, AfterViewChecked {

  @ViewChildren('scroller') private scrollers: QueryList<ElementRef>;
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

  constructor(
    private courseService: CourseService,
    private dataService: DataService,
    public assignmentModalService: AssignmentModalService,
    public rubricService: RubricService,
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
    
    // Get outcomes
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
          if( !('assignments' in course)) return true;
        }),
        take(1)
      )
      .subscribe(course => {
        this.assignments = course.assignments
        if (this.assessments_loaded == false) {
          this.student_outcomes = {}
          this.student_outcomes = course.outcomes[this.student_id]
        }

        this.filterOutcomes()

        this.assessments_loaded = true;
      })
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
  
  ngAfterViewChecked(): void{
    this.scrollers.forEach(s => s.nativeElement.scrollLeft = s.nativeElement.scrollWidth)
  }

}
