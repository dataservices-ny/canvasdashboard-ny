import { Assignments } from 'src/app/core/models/assignments';
import { GradingPeriod } from './../../../core/models/grading-period';
import { FilterService } from 'src/app/core/services/filter.service';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Course } from 'src/app/core/models/course';
import { Observable, Subscription } from 'rxjs';
import { Assessment, Outcomes } from 'src/app/core/models/outcomes';
import { RubricService } from 'src/app/core/services/rubric.service';
import { ActivatedRoute } from '@angular/router';
import { DataService } from 'src/app/core/services/data.service';
import { AssignmentModalService } from 'src/app/shared/assignment-modal/assignment-modal.service';
import { take, skipWhile } from 'rxjs/operators';
import { SectionService } from 'src/app/core/services/section.service';

@Component({
  selector: 'app-outcomes-gradebook',
  templateUrl: './outcomes-gradebook.component.html',
  styleUrls: ['./outcomes-gradebook.component.scss']
})
export class OutcomesGradebookComponent implements OnInit, OnDestroy {

  subscriptions: Subscription;
  course$: Observable<Course>;
  outcomes: Outcomes = {};
  course_outcomes: { [s: string]: Outcomes; };
  filtered_outcomes: { [s: string]: Outcomes; };
  assignments: Assignments;
  show_number: number = 3;
  show_number_dropdown_list : number[];
  max_number: number = 3;
  outcome_max_numbers: {[id: string]: number} = {};
  column_widths = {};
  some_loaded: boolean = false;
  selected_group: string;
  selected_period: GradingPeriod;
  loading: boolean = true;
  current_section: { id: string, name: string };

  constructor(
    private route: ActivatedRoute,
    private dataService: DataService,
    public assignmentModalService: AssignmentModalService,
    public rubricService: RubricService,
    public sectionService: SectionService,
    private filter: FilterService
  ) {  }

  ngOnInit(): void {
    this.subscriptions = new Subscription();
    this.subscriptions.add(this.route.parent.params.subscribe(p => {
      
      const course_id = p['course_id'];
      this.course$ = this.dataService.getCourse(course_id, null, false);
      
      this.dataService.getAssignments(course_id);

      // Get students then load outcome assessments.
      this.course$
      .pipe(
        skipWhile(c => typeof(c) == 'undefined' || c == null), 
        take(1)
      )
      .subscribe(course => {
        // Filter to ensure course has changed before loading new section students
        this.subscriptions.add(this.sectionService.current_section
          .pipe(
            skipWhile(s => !(s in course.sections))
          )
          .subscribe(current_section_id => {
            this.current_section = {
              'id': course.sections[current_section_id].section_id,
              'name': course.sections[current_section_id].section_name
            }
            this.filterOutcomes()
            course.sections[current_section_id].students.forEach(s => this.dataService.getOutcomeAssessments(course_id, s.id));

          })
        );
      });

      // // Get students then load outcome assessments.
      // this.course$
      //   .pipe(
      //     skipWhile(c => typeof(c) == 'undefined' || c == null), 
      //     take(1)
      //   )
      //   .subscribe(course => {
      //     // Filter to ensure course has changed before loading new section students
      //     this.subscriptions.add(this.sectionService.current_section
      //       .pipe(
      //         skipWhile(s => !(s in course.sections))
      //       )
      //       .subscribe(current_section_id => {
      //         let s_ids = []

      //         course.sections[current_section_id].students.forEach(s => s_ids.push(s.id));

      //         if(s_ids.length > 0) {
      //           this.loading = true;
      //           this.dataService.getOutcomeAssessmentsAlt(course_id, JSON.stringify(s_ids))
      //         }
      //       })
      //     );
      //   });
      this.loading = true;
      let outcomes_added = false;
      this.subscriptions.add(this.course$
        .pipe(
          skipWhile(c => typeof(c) == 'undefined' || c == null || !('assignments' in c) || !('outcomes' in c) || Object.keys(c.outcomes).length == 0),
        )
        .subscribe(course => {
          this.assignments = course.assignments

          if(!outcomes_added){ 

            this.course_outcomes = course.outcomes

            this.filterOutcomes()
            this.add_to_outcomes(this.filtered_outcomes[Object.keys(this.filtered_outcomes)[0]]);
            this.setNumber(this.show_number)
          }
          this.loading = false;
          this.some_loaded = true;
        }));
    }));

    //Get selected assignments group and filter outcomes
    this.subscriptions.add(this.filter.assignment_group.subscribe(group => {
      this.selected_group = group

      // filter outcomes
      this.filterOutcomes()
      if(this.filtered_outcomes != null) {
        this.add_to_outcomes(this.filtered_outcomes[Object.keys(this.filtered_outcomes)[0]]);
        this.setNumber(this.show_number)
      }
    }))

    //Get selected period and filter outcomes
    this.subscriptions.add(this.filter.period.subscribe(period => {
      this.selected_period = period

      // filter outcomes
      this.filterOutcomes()
      if(this.filtered_outcomes != null) {
        this.add_to_outcomes(this.filtered_outcomes[Object.keys(this.filtered_outcomes)[0]]);
        this.setNumber(this.show_number)
      }
    }))
  }
  
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  filterOutcomes(){
    if(this.course_outcomes != null) {
      for (const [student, outcomes] of Object.entries(this.course_outcomes)) {
        
        if(this.filtered_outcomes == null) {
          this.filtered_outcomes = {}
        }
        this.filtered_outcomes[student] = JSON.parse(JSON.stringify(outcomes));

        for (const [outcome, data] of Object.entries(outcomes)) {
          let filtered_assessments = []
          Object.values(this.assignments).forEach(a => {
            // assessments
            data.assessments.forEach(assessment => {
              if (assessment.assignment_id == parseInt(a._id)) {
                // group
                if (a.assignment_group == this.selected_group || this.selected_group == 'All') {
                  // period
                  if(this.selected_period != null) {
                    var a_date;
                    if (a.dueAt.length > 1 && this.current_section.id != 'all') {
                      Object.values(a.dueAt).forEach(d => {
                        if(d.section == this.current_section.id) {
                          a_date = new Date(d.date)
                        }
                      })
                    }
                    else if (a.dueAt.length == 1) {
                      a_date = new Date(a.dueAt[0].date)
                    }
                    
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
          this.filtered_outcomes[student][outcome].assessments = filtered_assessments
        }  
      }
    }
  }

  add_to_outcomes(outcomes: Outcomes){
    for (const [id, outcome] of Object.entries(outcomes)) {
      this.outcomes[id] = {
        description: outcome.description,
        title: outcome.title,
        points_possible: outcome.points_possible,
        mastery_points: outcome.mastery_points,
        ratings: outcome.ratings
      }
      this.outcome_max_numbers[id] = 0;
      this.column_widths[id] = {
        'width': '100px',
        'max-width': '100px'
      }
    }
    Object.values(this.filtered_outcomes).forEach(student => {
      for (const [id, outcome] of Object.entries(student)) {
        let num = outcome.assessments.length
        if(num > this.max_number){
          this.max_number = num;
          this.show_number_dropdown_list = [...Array(num-1).keys()].map(i => i + 1)
        }
        if(num > this.outcome_max_numbers[id]){
          this.outcome_max_numbers[id] = num;
        }
      }
    })
  }

  setNumber(n: number): void {
    this.show_number = n;
    const max_width = (n-1)*19.2 + 61.6;
    for (const [id, max] of Object.entries(this.outcome_max_numbers)) {
      let width = max_width;
      if(max < n){
        width = (max-1)*19.2 + 61.6;
      }
      const translate = 17;
      this.column_widths[id] = {
        'width': width+'px',
        'max-width': width+'px'
      }
    }
  }

  shouldShowAssessment(index: number, count: number, assessment: Assessment): boolean {
    return index + 1 > count - this.show_number && assessment.points != null;
  }

  majorBadge(index: number, count: number, assessment: Assessment): boolean {
    const assignment = this.assignments && this.assignments[assessment.assignment_id];
    return this.shouldShowAssessment(index, count, assessment) && this.rubricService.isMajor(assignment);
  }

  minorBadge(index: number, count: number, assessment: Assessment): boolean {
    const assignment = this.assignments && this.assignments[assessment.assignment_id];
    return this.shouldShowAssessment(index, count, assessment) && !this.rubricService.isMajor(assignment);
  }

}
