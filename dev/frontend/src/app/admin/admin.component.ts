import { TEMPORARY_NAME } from '@angular/compiler/src/render3/view/util';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { skipWhile } from 'rxjs/operators';
import { AdminStudent } from '../core/models/admin-student';
import { Term } from '../core/models/term';
import { AdminService } from './admin.service';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit, OnDestroy {

  grade_list: string[];
  current_grade: string;
  number: number;
  pages: number[];
  page: number;
  loading_grade_list: boolean;
  filtered_students$: BehaviorSubject<{ [s: string]: AdminStudent }>;
  show_custom_dates: boolean;
  bad_dates = false;
  listUpdating$: BehaviorSubject<boolean>;

  terms: Term[];
  current_term: Term;

  subscriptions: Subscription;

  constructor(
    private adminService: AdminService
  ) { }

  ngOnInit(): void {
    this.subscriptions = new Subscription();
    this.loading_grade_list = true;
    this.show_custom_dates = false;
    this.listUpdating$ = this.adminService.listUpdating$
    this.subscriptions.add(this.adminService.grade_list$
    .pipe(
      skipWhile(grade_list => !grade_list)
    )
    .subscribe(grade_list => {
      this.grade_list = grade_list;
      this.loading_grade_list = false;
    }));

    this.current_grade = null;
    this.subscriptions.add(this.adminService.current_grade$.subscribe(current_grade => this.current_grade = current_grade));
    
    this.subscriptions.add(this.adminService.number$.subscribe(number => this.number = number));
    this.subscriptions.add( this.adminService.pages$.subscribe(pages => this.pages = pages));
    this.subscriptions.add(this.adminService.page$.subscribe(page => this.page = page));
    this.filtered_students$ = this.adminService.filtered_students$;

    this.subscriptions.add(this.adminService.terms$.subscribe(terms => this.terms = terms))
    this.subscriptions.add(this.adminService.current_term$.subscribe(current_term => this.current_term = current_term))

  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  selectGrade(grade: string){
    this.adminService.current_grade$.next(grade);
    this.adminService.updateList();
  }

  selectNumber(number: number){
    this.adminService.number$.next(number);
    if(this.current_grade){
      this.adminService.updateList();
    }
  }

  selectTerm(term: Term){
    this.adminService.current_term$.next(term);
    this.adminService.start_date$.next(term.start_at);
    this.adminService.end_date$.next(term.end_at);
    if(this.current_grade){
      this.adminService.updateList();
    }
    this.show_custom_dates = false;
  }

  selectCustomDates(custom: boolean): void {
    if(custom){
      this.show_custom_dates = true;
      this.adminService.current_term$.next(null);
      this.adminService.start_date$.next(null);
      this.adminService.end_date$.next(null);
    }
    else{
      this.show_custom_dates = false;
      const current_term = this.adminService.terms$.value.find(term => term.name.toLowerCase().includes('all'));
      if(current_term){
        this.adminService.current_term$.next(current_term);
        this.adminService.start_date$.next(current_term.start_at);
        this.adminService.end_date$.next(current_term.end_at);
      }
      else{
        this.adminService.current_term$.next(this.adminService.terms$.value[0])
      }
      if(this.current_grade){
        this.adminService.updateList();
      }
    }
    
  }

  onDateSelect(start_end: string, date): void{

    // Assuming the user is in the same timezone as the school
    // Convert date to string
    let date_string = new Date(date.year, date.month-1, date.day).toISOString().slice(0,-5)+'Z'

    if(start_end == 'start'){
      this.adminService.start_date$.next(date_string);
      this.adminService.end_date$.next(null);
    }
    if(start_end == 'end'){
      this.adminService.end_date$.next(date_string);
    }
    if(this.adminService.start_date$.value >= this.adminService.end_date$.value){
      this.bad_dates = true;
    }
    else{
      this.bad_dates = false;
    }
    if( this.current_grade && 
        this.adminService.start_date$.value != null && 
        this.adminService.end_date$.value != null &&
        this.adminService.start_date$.value < this.adminService.end_date$.value
      ){
      this.adminService.updateList();
    }
  }

}
