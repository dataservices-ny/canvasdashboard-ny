import { GradingPeriod } from './../models/grading-period';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FilterService {

  private assignmentGroupSource = new BehaviorSubject<string>('All');
  private periodSource = new BehaviorSubject<GradingPeriod>({'id': null,'name': 'All','start_at': null,'end_at': null});

  assignment_group = this.assignmentGroupSource.asObservable();
  period = this.periodSource.asObservable();

  constructor() { }

  changeGroup(group: string) {
    this.assignmentGroupSource.next(group)
  }

  changePeriod(period: GradingPeriod) {
    this.periodSource.next(period)
  }
}