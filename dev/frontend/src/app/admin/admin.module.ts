import { NgModule } from '@angular/core';
import { AdminRoutingModule } from './admin-routing.module';
import { CoreModule } from '../core/core.module';
import { SharedModule } from '../shared/shared.module';
import { AdminComponent } from './admin.component';
import { AdminAssignmentsComponent } from './admin-assignments/admin-assignments.component';
import { AdminOutcomesComponent } from './admin-outcomes/admin-outcomes.component';
import { AdminPaginationComponent } from './admin-pagination/admin-pagination.component';
import { AppRoutingModule } from '../app-routing.module';

@NgModule({
  declarations: [AdminComponent, AdminAssignmentsComponent, AdminOutcomesComponent, AdminPaginationComponent],
  imports: [
    CoreModule,
    SharedModule,
    AppRoutingModule
    // AdminRoutingModule
  ]
})
export class AdminModule { }