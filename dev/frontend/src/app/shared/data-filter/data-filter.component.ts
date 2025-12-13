import { GradingPeriod } from './../../core/models/grading-period';
import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { Subscription } from 'rxjs';
import { FilterService } from './../../core/services/filter.service';

@Component({
  selector: 'app-data-filter',
  templateUrl: './data-filter.component.html',
})
export class DataFilterComponent implements OnInit, OnDestroy{

  @Input() public assignments_groups: string[];
  @Input() public periods: GradingPeriod[];
  
  selected_group: string;
  selected_period: GradingPeriod;
  subscriptions: Subscription;

  constructor(private filter: FilterService) { }

  ngOnInit(): void {
    this.subscriptions = new Subscription();

    this.subscriptions = this.filter.assignment_group.subscribe(group => {
      this.selected_group = group
    })

    this.subscriptions.add(this.filter.period.subscribe(period => {
      this.selected_period = period
    }))
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  setGroup(g: string): void {
    this.filter.changeGroup(g)
  }

  setPeriod(p: GradingPeriod): void {
    this.filter.changePeriod(p)
  }
}