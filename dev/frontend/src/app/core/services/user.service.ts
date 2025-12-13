import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, shareReplay, map } from 'rxjs/operators';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

import { User } from '../models/user';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  base_url = environment.baseUrl;
  headers = new HttpHeaders({ 'Content-Type': 'application/json' })
  user$: Observable<User>;

  constructor(
    private http: HttpClient,
    private router: Router) {

      // Getting the user in the cnstructor and using shareReplay() allows the data
      // to be fetched once and shared across all components.

      let url = `${this.base_url}api/user/`;
      this.user$ = this.http.get<User>(url).pipe(
        map(user => {
          if('teacher' in user || 'observer' in user){
            user = this.make_student_list(user)
          }
          return user
        }),
        shareReplay(),
        catchError(this.handleError<User>('getUser'))
      );
    }

  getUser(): Observable<User> {
    return this.user$;
  }

  make_student_list(user: User): User {
    user.student_list = [];
    let student_list_ids = []
    if('teacher' in user){
      user.teacher.forEach(course => {
        Object.values(course.sections).forEach(section => {
          section.students.forEach(s => {
            if(student_list_ids.indexOf(s.id) < 0){
              user.student_list.push(s)
              student_list_ids.push(s.id)
            }
          })
        })
      })
    }
    if('observer' in user){
      user.observer.forEach(observee => {
        if(student_list_ids.indexOf(observee.id) < 0){
          user.student_list.push({
            email: observee.email,
            id: observee.id,
            name: observee.name,
            short_name: observee.short_name,
            sortable_name: observee.sortable_name,
          });
          student_list_ids.push(observee.id)
        }
      })
    }
    return user
  }

  /**
   * Handle Http operation that failed.
   * Let the app continue.
   * @param operation - name of the operation that failed
   * @param result - optional value to return as the observable result
   */
  private handleError<T> (operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {

      // TODO: send the error to remote logging infrastructure
      console.log(error); // log to console instead

      // TODO: better job of transforming error for user consumption
      //this.log(`${operation} failed: ${error.message}`);

      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }

}
