import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '../core/models/user';
import { UserService } from '../core/services/user.service';
import { take } from 'rxjs/operators';
import { StudentSearchService } from '../core/services/student-search.service';

@Component({
  selector: 'app-directory',
  templateUrl: './directory.component.html',
  styleUrls: ['./directory.component.scss']
})
export class DirectoryComponent implements OnInit {

  user$: Observable<User>
  course_isCollapsed: {[C: string]: boolean} = {}
  student_isCollapsed: {[S: string]: boolean} = {}

  constructor(
    private userService: UserService,
    private studentSearchService: StudentSearchService
  ) { }

  ngOnInit(): void {
    this.user$ = this.userService.getUser()
    this.user$
      .pipe(take(1))
      .subscribe(user => {
        if(user.teacher){
          user.teacher.forEach(course => {
            this.course_isCollapsed[course.course_id] = true;
          })
        }
        if(user.observer){
          user.observer.forEach(student => {
            this.student_isCollapsed[student.id] = true;
          })
        }
      })
  }

  collapseCourse(course_id: string){
    if(this.course_isCollapsed[course_id])  this.course_isCollapsed[course_id] = false
    else this.course_isCollapsed[course_id] = true
  }

  collapseStudent(student_id: string){
    if(this.student_isCollapsed[student_id])  this.student_isCollapsed[student_id] = false
    else this.student_isCollapsed[student_id] = true
    
  }

}
