import { NgModule } from '@angular/core';
import { CoreModule } from '../core/core.module';
import { RubricComponent } from './rubric/rubric.component';
import { PageHeaderComponent } from './page-header/page-header.component';
import { AssignmentTitleComponent } from './assignment-title/assignment-title.component';
import { AssignmentBodyComponent } from './assignment-body/assignment-body.component';
import { AssignmentModalComponent } from './assignment-modal/assignment-modal.component';
import { RubricBadgeComponent } from './rubric-badge/rubric-badge.component';
import { RubricKeyComponent } from './rubric-key/rubric-key.component';
import { StudentSearchComponent } from './student-search/student-search.component';
import { ActivityModalComponent } from './activity-modal/activity-modal.component';
import { ActivityBodyComponent } from './activity-body/activity-body.component';
import { DataFilterComponent } from './data-filter/data-filter.component';

@NgModule({
  declarations: [
    RubricComponent,
    PageHeaderComponent,
    AssignmentTitleComponent,
    AssignmentBodyComponent,
    AssignmentModalComponent,
    RubricBadgeComponent,
    RubricKeyComponent,
    StudentSearchComponent,
    ActivityModalComponent,
    ActivityBodyComponent,
    DataFilterComponent
  ],
  imports: [
    CoreModule
  ],
  exports: [
    RubricComponent,
    PageHeaderComponent,
    AssignmentTitleComponent,
    AssignmentBodyComponent,
    AssignmentModalComponent,
    RubricBadgeComponent,
    RubricKeyComponent,
    StudentSearchComponent,
    ActivityModalComponent,
    ActivityBodyComponent,
    DataFilterComponent
  ]
})
export class SharedModule { }
