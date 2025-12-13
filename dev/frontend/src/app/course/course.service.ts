import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CourseService {

  course_student_ids$: BehaviorSubject<{course_id: string, student_id: string}> = new BehaviorSubject(null);

  constructor(
  ) { }

  update(course_id: string, student_id: string){
    this.course_student_ids$.next({course_id: course_id, student_id: student_id})
  }
}
