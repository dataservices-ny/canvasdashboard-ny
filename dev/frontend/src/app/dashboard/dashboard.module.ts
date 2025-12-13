import { NgModule } from '@angular/core';
import { CoreModule } from '../core/core.module';
import { DashboardComponent } from './dashboard.component';
import { AppRoutingModule } from '../app-routing.module';
import { SharedModule } from '../shared/shared.module';
import { CourseCardComponent } from './course-card/course-card.component';

@NgModule({
  declarations: [DashboardComponent, CourseCardComponent],
  imports: [
    CoreModule,
    SharedModule,
    AppRoutingModule,
  ]
})
export class DashboardModule { }