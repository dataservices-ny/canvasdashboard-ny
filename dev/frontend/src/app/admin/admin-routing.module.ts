import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminGuard } from '../core/guards/admin.guard';
import { AdminAssignmentsComponent } from './admin-assignments/admin-assignments.component';
import { AdminOutcomesComponent } from './admin-outcomes/admin-outcomes.component';
import { AdminComponent } from './admin.component';


const adminRoutes: Routes = [
  {
    component: AdminComponent,
    children: [
      { path: 'assignments', component: AdminAssignmentsComponent },
      { path: 'outcomes', component: AdminOutcomesComponent },
      { path: '', redirectTo: 'assignments', pathMatch: 'full' },
    ],
    canActivate: [AdminGuard]
  }
];

@NgModule({
  imports: [
    RouterModule.forChild(adminRoutes)
  ],
  exports: [
    RouterModule
  ]
})
export class AdminRoutingModule { }
