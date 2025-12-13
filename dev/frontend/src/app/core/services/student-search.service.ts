import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Student } from '../models/user';
import { UserService } from './user.service';
import { catchError, tap, skipWhile, take } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { Observable, of } from 'rxjs';
import { DataService } from './data.service';

@Injectable({
  providedIn: 'root'
})
export class StudentSearchService {

  base_url = environment.baseUrl;
  students: { [S: string]: Student } = {};
  students_loaded: Boolean = false

  constructor(
    private dataService: DataService,
    private userService: UserService) { }

  load_students(): void {
    // Load from user object (students that the user teaches or observers)
    this.userService.user$
      .pipe(
        skipWhile(user => typeof(user) == 'undefined'),
        take(1)
      )
      .subscribe(user => {      
        if(user.admin){
          this.dataService.STUDENTS$
            .pipe(
              skipWhile(students => Object.keys(students).length == 0),
              take(1)
            )
            .subscribe(students => {
              for (const [id, student] of Object.entries(students)) {
                this.students[id] = student
              }
              this.students_loaded = true
            });
        }
        else{
          if(user.teacher){
            user.teacher.forEach(course => {
              Object.values(course.sections).forEach(section => {
                section.students.forEach(student => this.students[student.id] = student)
              })
            });
            this.students_loaded = true
          }
          if(user.observer){
            user.observer.forEach(observee => {
              this.students[observee.id] = {
                email: observee.email,
                id: observee.id,
                name: observee.name,
                short_name: observee.short_name,
                sortable_name: observee.sortable_name,
              };
            });
            this.students_loaded = true
          }
        }
      })
  }
}