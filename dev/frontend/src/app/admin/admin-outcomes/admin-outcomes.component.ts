import { Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { AdminStudent } from 'src/app/core/models/admin-student';
import { DataService } from 'src/app/core/services/data.service';
import { AssignmentModalService } from 'src/app/shared/assignment-modal/assignment-modal.service';
import { AdminService } from '../admin.service';

@Component({
  selector: 'app-admin-outcomes',
  templateUrl: './admin-outcomes.component.html',
  styleUrls: ['./admin-outcomes.component.scss']
})
export class AdminOutcomesComponent implements OnInit, OnDestroy {

  filtered_students$: BehaviorSubject<{ [s: string]: AdminStudent }>;
  current_grade$:BehaviorSubject<string>;
  all_outcomes: {[course_id: string]: {[outcome_id: string]: {title: string, has_assessments: boolean}}};
  student_courses_loaded: boolean;
  showUnassessed: boolean;
  subscriptions: Subscription;
  listUpdating$:BehaviorSubject<boolean>;

  constructor(
    public adminService: AdminService,
    public dataService: DataService,
    public assignmentModalService: AssignmentModalService
  ) { }

  ngOnInit(): void {
    this.subscriptions = new Subscription();
    this.filtered_students$ = this.adminService.filtered_students$;
    this.listUpdating$ = this.adminService.listUpdating$;
    this.current_grade$ = this.adminService.current_grade$;
    this.subscriptions.add(this.adminService.all_outcomes$.subscribe(all_outcomes => this.all_outcomes = all_outcomes));
    this.subscriptions.add(this.adminService.student_courses_loaded$.subscribe(student_courses_loaded => this.student_courses_loaded = student_courses_loaded));

  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  updateShowUnassessed(checked: boolean){
    this.showUnassessed = checked;
  }

}
