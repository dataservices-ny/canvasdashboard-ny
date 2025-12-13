import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { UserService } from '../core/services/user.service';
import { Observable, Subscription } from 'rxjs';
import { map, skipWhile, take } from 'rxjs/operators';
import { DataService } from '../core/services/data.service';
import { Course } from '../core/models/course';
import { SidebarService } from '../core/services/sidebar.service';
import { SectionService } from '../core/services/section.service';
import { Student } from '../core/models/user';
import { CourseService } from './course.service';
import { Location } from '@angular/common';

@Component({
  selector: 'app-course',
  templateUrl: './course.component.html',
  styleUrls: ['./course.component.scss']
})
export class CourseComponent implements OnInit, OnDestroy {

  subscriptions: Subscription;
  course$: Observable<Course>;
  mode$: Observable<string>;
  student$: Observable<Student>;
  student: Student;
  student_id: string;
  student_name: string;
  all_students_sorted_ids: {id: string, name: string}[];

  constructor(
    public route: ActivatedRoute,
    public router: Router,
    private location: Location,
    private courseService: CourseService,
    public userService: UserService,
    private dataService: DataService,
    public sidebarService: SidebarService,
    public sectionService: SectionService) { }

  ngOnInit(): void {
    
    this.subscriptions = new Subscription();
    this.all_students_sorted_ids = [];
    
    this.subscriptions.add(this.route.params.subscribe(p => {
      
      const course_id = p['course_id'];
      this.student_id = 'student_id' in p  ? p['student_id'] : null;
      
      this.courseService.update(course_id, this.student_id);

      this.mode$ = this.userService.getUser()
      .pipe(
        map(user => {
          if(user.mode != 'student'){
            this.course$
              .pipe(
                skipWhile(course => !('sections' in course)),
                take(1)
              )
              .subscribe(course => {
                Object.values(course.sections).forEach(section => {
                  section.students
                    .sort((a,b) => {
                      if(a.sortable_name > b.sortable_name) return 1
                      if(a.sortable_name < b.sortable_name) return -1
                      return 0
                    })
                    .forEach(student => this.all_students_sorted_ids.push(
                      {
                        id: student.id, 
                        name: student.name
                      }
                    ));
                })
              });
          }
          return user.mode
        })
      );
    }));

    this.courseService.course_student_ids$.subscribe(course_student_ids => {
      const course_id = course_student_ids.course_id;
      this.student_id = course_student_ids.student_id;

      this.course$ = this.dataService.getCourse(course_id, this.student_id, true);
      this.dataService.getAssignments(course_id, this.student_id)
      
      if(this.student_id){
        this.subscriptions.add(this.dataService.getStudent(this.student_id).subscribe(student => {
          this.student = student;
          this.student_name = student.name;
        }));
        this.dataService.getOutcomeAssessments(course_id, this.student_id);
      }

    });
    
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  incrementStudent(course_id: string, student_id: string, increment: number){
    const next = this.all_students_sorted_ids[ this.all_students_sorted_ids.findIndex(s => s.id ==student_id) + increment ];
    this.student_name = next.name;
    this.courseService.update(course_id, next.id)
    this.location.go(`/course/${course_id}/student/${next.id}/${this.route.firstChild.snapshot.url[0].path}`);    
  }

  goToStudent(course_id: string, student_id: string, student_name: string){
    this.student_name = student_name;
    this.courseService.update(course_id, student_id)
    this.location.go(`/course/${course_id}/student/${student_id}/${this.route.firstChild.snapshot.url[0].path}`);    
  }
}



