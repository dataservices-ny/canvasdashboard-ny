import { NgModule } from '@angular/core';
import { CoreModule } from '../core/core.module'
import { DirectoryComponent } from './directory.component';
import { AppRoutingModule } from '../app-routing.module';
import { SharedModule } from '../shared/shared.module';


@NgModule({
  declarations: [DirectoryComponent],
  imports: [
    CoreModule,
    SharedModule,
    AppRoutingModule,
  ]
})
export class DirectoryModule { }