import { NgModule } from '@angular/core';
import { CoreModule } from '../core/core.module';
import { SharedModule } from '../shared/shared.module'
import { CourseComponent } from './course.component';
import { AssignmentsComponent } from './assignments/assignments.component';
import { CourseRoutingModule } from './course-routing.module';
import { OutcomesGraphComponent } from './outcomes/outcomes-graph/outcomes-graph.component';
import { OutcomesListComponent } from './outcomes/outcomes-list/outcomes-list.component';
import { GraphDotGroupComponent } from './outcomes/graph-dot-group/graph-dot-group.component';
import { OutcomeAssignmentListComponent } from './outcomes/outcome-assignment-list/outcome-assignment-list.component';
import { AssignmentsKeyComponent } from './assignments/assignments-key/assignments-key.component';
import { OutcomesGraphKeyComponent } from './outcomes/outcomes-graph-key/outcomes-graph-key.component';
import { OutcomesGraph2Component } from './outcomes/outcomes-graph2/outcomes-graph2.component';
import { OutcomePointsTooltipComponent } from './outcomes/outcome-points-tooltip/outcome-points-tooltip.component';
import { TeacherComponent } from './teacher/teacher.component';
import { AssignmentGradebookComponent } from './teacher/assignment-gradebook/assignment-gradebook.component';
import { OutcomesGradebookComponent } from './teacher/outcomes-gradebook/outcomes-gradebook.component';
import { OutcomesKeyComponent } from './outcomes/outcomes-key/outcomes-key.component';
import { GradeEstimatorComponent } from './outcomes/grade-estimator/grade-estimator.component';


@NgModule({
  declarations: [
    CourseComponent, 
    AssignmentsComponent, 
    OutcomesGraphComponent, 
    OutcomesListComponent, 
    OutcomeAssignmentListComponent,
    GraphDotGroupComponent,
    AssignmentsKeyComponent,
    OutcomesGraphKeyComponent,
    OutcomesGraph2Component,
    OutcomePointsTooltipComponent,
    TeacherComponent,
    AssignmentGradebookComponent,
    OutcomesGradebookComponent,
    OutcomesKeyComponent,
    GradeEstimatorComponent
  ],
  imports: [
    CoreModule,
    SharedModule,
    CourseRoutingModule,
  ]
})
export class CourseModule { }
