import { NgModule } from '@angular/core';
import { CoreModule } from '../core/core.module';
import { AppRoutingModule } from '../app-routing.module';
import { SharedModule } from '../shared/shared.module';
import { NavComponent } from './nav.component';


@NgModule({
  declarations: [NavComponent],
  imports: [
    CoreModule,
    SharedModule,
    AppRoutingModule
  ],
  exports: [
    NavComponent
  ]
})
export class NavModule { }
