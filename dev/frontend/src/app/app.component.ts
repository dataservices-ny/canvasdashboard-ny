import { environment } from 'src/environments/environment';
import { Component, OnInit } from '@angular/core';
import { SidebarService } from './core/services/sidebar.service'
import { ActivatedRoute, Router, NavigationEnd, ActivationEnd } from '@angular/router';
import { take } from 'rxjs/operators';
import { UserService } from './core/services/user.service';
import { StudentSearchService } from './core/services/student-search.service';
import { HttpCancelService } from './core/services/httpcancel.service';

declare let gtag: Function;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent implements OnInit {

  constructor(
    public sidebarService: SidebarService,
    route: ActivatedRoute,
    private userService: UserService,
    public studentSearchService: StudentSearchService,
    public httpCancelService: HttpCancelService,
    public router: Router
  ) {
    // If coming from lti, turn off the sidebar
    route.queryParams.subscribe(params => {
      if(params['lti'] == 'true'){
        this.sidebarService.lti = true;
      }
    })

    // Google Analytics
    this.router.events.subscribe(event => {
      if(event instanceof NavigationEnd){
        gtag('config', environment.google_analytics_id, 
          {
            'page_path': event.urlAfterRedirects
          }
        );
      }
    })
  }

  ngOnInit(): void {
    // this.router.events.subscribe(event => {
    //   if (event instanceof ActivationEnd) {
    //     this.httpCancelService.cancelPendingRequests()
    //   }
    // })
    this.sidebarService.sidebar_toggle_detect();
    this.userService.getUser()
      .pipe(
        take(1)          
      )
      .subscribe(user => {
        if(['admin', 'teacher'].includes(user.mode)){
          this.studentSearchService.load_students();
        }
      })
  }
}