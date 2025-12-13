import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CourseComponent } from './course.component';
import { AssignmentsComponent } from './assignments/assignments.component';
import { OutcomesGraphComponent } from './outcomes/outcomes-graph/outcomes-graph.component';
import { OutcomesListComponent } from './outcomes/outcomes-list/outcomes-list.component';
import { OutcomesGraph2Component } from './outcomes/outcomes-graph2/outcomes-graph2.component';
import { TeacherComponent } from './teacher/teacher.component';
import { AssignmentGradebookComponent } from './teacher/assignment-gradebook/assignment-gradebook.component';
import { OutcomesGradebookComponent } from './teacher/outcomes-gradebook/outcomes-gradebook.component';
import { CourseGuard } from '../core/guards/course.guard';


const courseRoutes: Routes = [
  {
    path: ':course_id',
    component: TeacherComponent,
    children: [
      { path: 'assignment-gradebook', component: AssignmentGradebookComponent },
      { path: 'outcomes-gradebook', component: OutcomesGradebookComponent },
      { path: '', redirectTo: 'assignment-gradebook', pathMatch: 'full' }
    ],
    canActivate: [CourseGuard]
  },
  {
    path: ':course_id/student/:student_id',
    component: CourseComponent,
    children: [
      { path: 'assignments', component: AssignmentsComponent },
      { path: 'outcomes-graph', component: OutcomesGraphComponent },
      { path: 'outcomes-timeline', component: OutcomesGraph2Component },
      { path: 'outcomes-list', component: OutcomesListComponent },
      { path: '', redirectTo: 'assignments', pathMatch: 'full' }
    ]
  }
];

@NgModule({
  imports: [
    RouterModule.forChild(courseRoutes)
  ],
  exports: [
    RouterModule
  ]
})
export class CourseRoutingModule { }
