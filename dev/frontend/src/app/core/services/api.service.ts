import { Injectable } from '@angular/core';
import { interval, Observable, of, Subject, timer } from 'rxjs';
import { map, catchError, tap, retryWhen, delayWhen, concatMap, take, skipWhile, delay, takeUntil } from 'rxjs/operators';
import { Course } from '../models/course';
import { environment } from 'src/environments/environment';
import { HttpHeaders, HttpClient, HttpParams } from '@angular/common/http';
import { Assignments, Assignment } from '../models/assignments';
import { Outcomes } from '../models/outcomes';
import { Submissions } from '../models/submissions';
import { Student } from '../models/user';
import { Activities } from '../models/activities';
import { CourseOutcomeResults } from '../models/course-outcome-results';
import { Term } from '../models/term';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  base_url = environment.baseUrl;
  headers = new HttpHeaders({ 'Content-Type': 'application/json' })

  constructor(
    private http: HttpClient
  ) { }

  getCourse(course_id: string, student_id: string, get_sections: boolean = false): Observable<Course> {
    
    let url = `${this.base_url}api/course/${course_id}/`;
    let params = new HttpParams();
    if(student_id){
      params = params.append('student_id', student_id);
    }
    if(get_sections){
      params = params.append('get_sections', 'true');
    }
    return this.http.get<Course>(url, { params: params })
      .pipe(
        map(course => course),
        retryWhen(errors => {
          return errors
                  .pipe(
                    take(4),
                    delayWhen(() => timer(500)),
                    tap(() => console.log('getCourse retrying...'))
                  );
        }),
        catchError(this.handleError<Course>('getCourse'))
      );
  }

  getStudent(student_id: string): Observable<Student> {
    
    let url = `${this.base_url}api/student/${student_id}/`;

    return this.http.get<Student>(url)
      .pipe(
        retryWhen(errors => {
          return errors
                  .pipe(
                    take(4),
                    delayWhen(() => timer(500)),
                    tap(() => console.log('getStudent retrying...'))
                  );
        }),
        catchError(this.handleError<Student>('getStudent'))
      );
  }

  getTerms(): Observable<Term[]>  {
    let url = `${this.base_url}api/terms/`;

    return this.http.get<Term[]>(url)
      .pipe(
        retryWhen(errors => {
          return errors
                  .pipe(
                    take(4),
                    delayWhen(() => timer(500)),
                    tap(() => console.log('getTerms retrying...'))
                  );
        }),
        catchError(this.handleError<Term[]>('getTerms'))
      );
  }

  getMultipleStudents(students_ids: string[]): Observable<Student[]>{
    let uniqueIds = [...new Set(students_ids)]
    let url = `${this.base_url}api/get_multiple_students/${uniqueIds.join()}/`;
    return this.http.get<Student[]>(url)
      .pipe(
        retryWhen(errors => {
          return errors
                  .pipe(
                    take(4),
                    delayWhen(() => timer(500)),
                    tap(() => console.log('getMultipleStudents retrying...'))
                  );
        }),
        catchError(this.handleError<Student[]>('getMultipleStudents'))
    );
  }

  getAllStudents(): Observable<Student[]>{
    let url = `${this.base_url}api/get_students/`;
    return this.http.get<Student[]>(url)
      .pipe(
        retryWhen(errors => {
          return errors
                  .pipe(
                    take(4),
                    delayWhen(() => timer(500)),
                    tap(() => console.log('getAllStudents retrying...'))
                  );
        }),
        catchError(this.handleError<Student[]>('getAllStudents'))
    );
  }

  getAssignments(course_id: string, student_id: string = null, assignment_id: string = null, number: number =null): Observable<Assignments>{
    
    let url = `${this.base_url}api/assignments/`;
    let params = new HttpParams();

    params = params.append('course', course_id);
    if(student_id) { 
      params = params.append('student', student_id);
    }
    if(assignment_id) { 
      params = params.append('assignment', assignment_id);
    }
    if(number) { 
      params = params.append('number', number.toString());
    }
    return this.http.get<Assignments>(url, { params: params })
      .pipe(
        retryWhen(errors => {
          return errors
                  .pipe(
                    take(4),
                    delayWhen(() => timer(500)),
                    tap(() => console.log('getAssignments retrying...'))
                  );
        }),
        catchError(this.handleError<Assignments>('getAssignments'))
      );
  }

  getActivities(course_id, student_id, section_id): Observable<Activities>{
    
    let url = `${this.base_url}api/activities/`;
    let params = new HttpParams();

    params = params.append('course', course_id);
    params = params.append('section', section_id);
    params = params.append('student', student_id)


    return this.http.get<Activities>(url, { params: params })
      .pipe(
        retryWhen(errors => {
          return errors
                  .pipe(
                    take(4),
                    delayWhen(() => timer(500)),
                    tap(() => console.log('getActivities retrying...'))
                  );
        }),
        catchError(this.handleError<Activities>('getActivities'))
      );
  }

  getSubmissions(student_ids: string | string[], course_id: string): Observable<Submissions>{
    let url = `${this.base_url}api/submissions/`;
    let params = new HttpParams();
    
    if(typeof(student_ids) == 'string'){
      params = params.append('student[]', student_ids);
    }
    else{
      let uniqueIds = [...new Set(student_ids)]
      uniqueIds.forEach(id => params = params.append('student[]', id))
    }
    
    if(course_id) { 
      params = params.append('course', course_id);
    }
    
    return this.http.get<Submissions>(url, { params: params })
      .pipe(
        retryWhen(errors => {
          return errors
                  .pipe(
                    take(4),  
                    delayWhen(() => timer(500)),
                    tap(() => console.log('getSubmissions retrying...'))
                  );
        }),
        catchError(this.handleError<Submissions>('getSubmissions')),
      );
  }


  getOutcomeAssessments(course_id: string, student_id: string): Observable<Outcomes> {
    // TODO Add logic to get from cache
    let url = `${this.base_url}api/outcomes/student/${student_id}/course/${course_id}/`;
    
    return this.http.get<Outcomes>(url)
      .pipe(
        retryWhen(errors => {
          return errors
                  .pipe(
                    take(4),
                    delayWhen(() => timer(500)),
                    tap(() => console.log('getOutcomeAssessments retrying...'))
                  );
        }),
        catchError(this.handleError<Outcomes>('getOutcomeAssessments'))
      );
  }

  getOutcomeAssessmentsAlt(course_id: string, students_ids: string): Observable<Outcomes[]> {
    // TODO Add logic to get from cache
    students_ids = students_ids.replace(/[^\d,]+/g, '');

    let url = `${this.base_url}api/outcomes/course/${course_id}/students/${students_ids}`;
    
    return this.http.get<Outcomes[]>(url)
      .pipe(
        retryWhen(errors => {
          return errors
                  .pipe(
                    take(4),
                    delayWhen(() => timer(500)),
                    tap(() => console.log('getOutcomeAssessments retrying...'))
                  );
        }),
        catchError(this.handleError<Outcomes[]>('getOutcomeAssessments'))
      );
  }

  getOutcomeResults(course_id: string, student_ids: string[]): Observable<{[student_id: string]: CourseOutcomeResults}> {
    
    let params = new HttpParams();
    
    let uniqueIds = [...new Set(student_ids)]

    uniqueIds.forEach(id => { 
      params = params.append('student[]', id)
    });

    let url = `${this.base_url}api/outcome_results/course/${course_id}`;
    
    return this.http.get<{[student_id: string]: CourseOutcomeResults}>(url, { params: params })
      .pipe(
        retryWhen(errors => {
          return errors
                  .pipe(
                    take(4),
                    delayWhen(() => timer(500)),
                    tap(() => console.log('getOutcomeResults retrying...'))
                  );
        }),
        catchError(this.handleError<{[student_id: string]: CourseOutcomeResults}>('getOutcomeResults'))
      );
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
      console.log(operation)
      console.log(error); // log to console instead

      // TODO: better job of transforming error for user consumption
      //this.log(`${operation} failed: ${error.message}`);

      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }

}