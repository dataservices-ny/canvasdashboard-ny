import { Component, OnDestroy, OnInit } from '@angular/core';
import { Assignments } from '../core/models/assignments';
import { map } from 'rxjs/operators';
import { Observable, Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { UserService } from '../core/services/user.service';
import { Student } from '../core/models/user';
import { DataService } from '../core/services/data.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {

  subscriptions: Subscription;
  mode$: Observable<string>;
  student$: Observable<Student>;
  assignments$: Observable<Assignments>;

  constructor(
    private route: ActivatedRoute,
    public userService: UserService,
    private dataService: DataService) { }

  ngOnInit(): void {
    this.subscriptions = new Subscription();

    this.mode$ = this.userService.getUser().pipe(
      map(user => user.mode)
    )

    this.subscriptions.add(this.route.params.subscribe(p => {
      const student_id = p['student_id']
      this.student$ = this.dataService.getStudent(student_id, true);
    }));
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
  
}
