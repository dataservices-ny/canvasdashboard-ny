import { NgModule } from '@angular/core'; 
import { Routes, RouterModule } from '@angular/router';
import { DirectoryComponent } from './directory/directory.component'
import { DashboardComponent } from './dashboard/dashboard.component';

import { UserResolverService } from './core/services/user-resolver.service'
import { DashboardRedirectGuard } from './core/guards/dashboard-redirect.guard'
import { DirectoryGuard } from './core/guards/directory.guard';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { AuthGuard } from './core/guards/auth.guard';
import { AdminGuard } from './core/guards/admin.guard';
import { AdminComponent } from './admin/admin.component';
import { AdminAssignmentsComponent } from './admin/admin-assignments/admin-assignments.component';
import { AdminOutcomesComponent } from './admin/admin-outcomes/admin-outcomes.component';


const routes: Routes = [
  { 
    path: 'directory', 
    component: DirectoryComponent, 
    canActivate: [DirectoryGuard],
    resolve: { data: UserResolverService }
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [DashboardRedirectGuard],
    resolve: { data: UserResolverService }
  },
  {
    path: 'dashboard/student',
    component: DashboardComponent,
    canActivate: [DashboardRedirectGuard],
    resolve: { data: UserResolverService }
  },
  {
    path: 'dashboard/student/:student_id',
    component: DashboardComponent, 
    canActivate: [AuthGuard],
    resolve: { data: UserResolverService }
  },
  {
    path: 'course',
    loadChildren: () => import('./course/course.module').then(m => m.CourseModule),
    canLoad: [AuthGuard],
    resolve: { data: UserResolverService }
  },
  {
    path: 'admin',
    component: AdminComponent,
    children: [
      { path: 'assignments', component: AdminAssignmentsComponent },
      { path: 'outcomes', component: AdminOutcomesComponent },
      { path: '', redirectTo: 'assignments', pathMatch: 'full' },
    ],
    canLoad: [AuthGuard, AdminGuard],
    resolve: { data: UserResolverService }
  },
  { 
    path: '', 
    redirectTo: 'directory',
    pathMatch: 'full'
  },
  { path: 'notfound', 
    component: PageNotFoundComponent,
    canActivate: [AuthGuard],
  },
  { path: '**', 
    component: PageNotFoundComponent,
    canActivate: [AuthGuard],
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
