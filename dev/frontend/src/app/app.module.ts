import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CoreModule } from './core/core.module'
import { NavModule } from './nav/nav.module';
import { DirectoryModule } from './directory/directory.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { CourseModule } from './course/course.module';
import { AdminModule } from './admin/admin.module'

import { AppComponent } from './app.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { AppRoutingModule } from './app-routing.module';

import { HttpCancelInterceptor } from './core/interceptors/managehttp.interceptor.ts';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { HttpCancelService } from './core/services/httpcancel.service';

@NgModule({
  declarations: [AppComponent, PageNotFoundComponent],
  imports: [
    BrowserModule,
    CoreModule,
    DirectoryModule,
    DashboardModule,
    CourseModule,
    NavModule,
    AdminModule,
    AppRoutingModule,
  ],
  providers: [
    HttpCancelService,
    {
      multi: true,
      provide: HTTP_INTERCEPTORS,
      useClass: HttpCancelInterceptor
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
