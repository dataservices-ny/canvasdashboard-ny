import { Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { skipWhile, take, takeUntil } from 'rxjs/operators';
import { AdminStudent } from 'src/app/core/models/admin-student';
import { DataService } from 'src/app/core/services/data.service';
import { AssignmentModalService } from 'src/app/shared/assignment-modal/assignment-modal.service';
import { AdminService } from '../admin.service';

@Component({
  selector: 'app-admin-assignments',
  templateUrl: './admin-assignments.component.html',
  styleUrls: ['./admin-assignments.component.scss']
})
export class AdminAssignmentsComponent implements OnInit, OnDestroy {

  filtered_students$: BehaviorSubject<{ [s: string]: AdminStudent }>;
  student_courses_loaded: boolean;
  subscriptions: Subscription;
  number$:BehaviorSubject<number>;
  current_grade$:BehaviorSubject<string>;
  listUpdating$:BehaviorSubject<boolean>;
  avg_total_assignments$ = new BehaviorSubject(0);
  avg_complete_assignments$ = new BehaviorSubject(0);
  avg_incomplete_assignments$ = new BehaviorSubject(0);
  avg_non_graded_assignments$ = new BehaviorSubject(0);
  avg_missing_assignments$ = new BehaviorSubject(0);
  avg_late_assignments$ = new BehaviorSubject(0);
  avg_pct_complete_assignments$ = new BehaviorSubject(0);
  avg_pct_incomplete_assignments$ = new BehaviorSubject(0);
  avg_pct_non_graded_assignments$ = new BehaviorSubject(0);
  avg_pct_missing_assignments$ = new BehaviorSubject(0);
  avg_pct_late_assignments$ = new BehaviorSubject(0);
  avg_pct_outcomes_proficiency$ = new BehaviorSubject(0);

  constructor(
    public adminService: AdminService,
    public dataService: DataService,
    public assignmentModalService: AssignmentModalService
  ) { }

  ngOnInit(): void {
    this.subscriptions = new Subscription();
    this.filtered_students$ = this.adminService.filtered_students$;
    this.number$ = this.adminService.number$;
    this.listUpdating$ = this.adminService.listUpdating$;
    this.current_grade$ = this.adminService.current_grade$;
    this.subscriptions.add(this.filtered_students$.pipe(
      skipWhile(students => typeof(students) == 'undefined' || students == null ),
    ).subscribe(students => {
      
      let total_submissions = 0;
      let complete_assignments = 0;
      let incomplete_assignments = 0;
      let non_graded_assignments = 0;
      let missing_assignments = 0;
      let late_assignments = 0;
      let pct_complete_assignments = 0;
      let pct_incomplete_assignments = 0;
      let pct_non_graded_assignments = 0;
      let pct_missing_assignments = 0;
      let pct_late_assignments = 0;
      let pct_outcomes_proficiency = 0;
      let total_students = 0;

      if (students != null) {
        Object.keys(students).forEach(key => {
          let student = students[key];
          total_submissions += (typeof(student.total_submissions) == 'number') ? student.total_submissions : 0;
          complete_assignments += (typeof(student.total_complete) == 'number') ? student.total_complete : 0;
          incomplete_assignments += (typeof(student.total_incomplete) == 'number') ? student.total_incomplete : 0;
          non_graded_assignments += (typeof(student.total_incomplete) == 'number') ? student.total_non_graded : 0;
          missing_assignments += (typeof(student.total_incomplete) == 'number') ? student.total_missing : 0;
          late_assignments += (typeof(student.total_late) == 'number') ? student.total_late : 0;
          pct_complete_assignments += (typeof(student.percent_complete) == 'number') ? student.percent_complete : 0;
          pct_incomplete_assignments += (typeof(student.percent_incomplete) == 'number') ? student.percent_incomplete : 0;
          pct_non_graded_assignments += (typeof(student.percent_non_graded) == 'number') ? student.percent_non_graded : 0;
          pct_missing_assignments += (typeof(student.percent_missing) == 'number') ? student.percent_missing : 0;
          pct_late_assignments += (typeof(student.percent_late) == 'number') ? student.percent_late : 0;
          pct_outcomes_proficiency += (typeof(student.percent_proficient_advanced) == 'number') ? student.percent_proficient_advanced : 0;
          total_students += 1
        });
      }
      if(typeof(total_students) == 'number' && total_students > 0) {
        this.avg_total_assignments$.next(Math.round(total_submissions / total_students));
        this.avg_complete_assignments$.next(Math.round(complete_assignments / total_students));
        this.avg_incomplete_assignments$.next(Math.round(incomplete_assignments / total_students));
        this.avg_non_graded_assignments$.next(Math.round(non_graded_assignments / total_students));
        this.avg_missing_assignments$.next(Math.round(missing_assignments / total_students));
        this.avg_late_assignments$.next(Math.round(late_assignments / total_students));
        this.avg_pct_complete_assignments$.next(Math.round(pct_complete_assignments / total_students));
        this.avg_pct_incomplete_assignments$.next(Math.round(pct_incomplete_assignments / total_students));
        this.avg_pct_non_graded_assignments$.next(Math.round(pct_non_graded_assignments / total_students));
        this.avg_pct_missing_assignments$.next(Math.round(pct_missing_assignments / total_students));
        this.avg_pct_late_assignments$.next(Math.round(pct_late_assignments / total_students));
        this.avg_pct_outcomes_proficiency$.next(Math.round(pct_outcomes_proficiency / total_students));
      }
    }))
    this.subscriptions.add(this.adminService.student_courses_loaded$.subscribe(student_courses_loaded => this.student_courses_loaded = student_courses_loaded));
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  updateCountRubricOnly(checked: boolean){
    this.adminService.countOnlyRubric = checked;
    this.adminService.updateList();
  }

}
