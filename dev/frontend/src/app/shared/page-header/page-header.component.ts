import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { UserService } from 'src/app/core/services/user.service';
import { map, skipWhile } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';
import { Student } from 'src/app/core/models/user';
import { SidebarService } from 'src/app/core/services/sidebar.service';
import { DataService } from 'src/app/core/services/data.service';

@Component({
  selector: 'app-page-header',
  templateUrl: './page-header.component.html',
  styleUrls: ['./page-header.component.scss']
})
export class PageHeaderComponent implements OnInit, OnDestroy {

  subscriptions: Subscription;
  @Input() title: string;
  @Input() subtitle: string = null;
  mode$: Observable<string>;
  nav: Boolean = false;

  constructor(
    private route: ActivatedRoute,
    private userService: UserService,
    private dataService: DataService,
    public sidebarService: SidebarService
  ) {}

  ngOnInit(): void {
    


    this.subscriptions = new Subscription();

    this.mode$ = this.userService.getUser().pipe(
      map(user => user.mode)
    )

  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  toggle_sidebar(): void {
    if(this.sidebarService.sidebar_toggle_class == 'toggled'){
      this.sidebarService.sidebar_toggle_class = ''
    }
    else {
      this.sidebarService.sidebar_toggle_class = 'toggled'
    }
  }

}

