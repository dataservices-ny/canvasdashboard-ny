import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { UserService } from '../services/user.service';
import { map } from 'rxjs/operators';
import { SidebarService } from '../services/sidebar.service';

@Injectable({
  providedIn: 'root'
})
export class CourseGuard implements CanActivate {
  
  constructor(
    private userService: UserService,
    private router: Router,
    private sidebarService: SidebarService){}
  
  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> {
    
    return this.userService.getUser().pipe(
      map(user => {
        let course_id = route.paramMap.get('course_id');

        // Get lti state from SidebarService or from param
        let lti = null; 
        if(this.sidebarService.lti){
          lti = 'true';
        }
        else{
          lti = route.queryParamMap.get('lti');
        }

        // Allow admin to proceed to course/:course_id
        if(user.admin == true){
          return true;
        }

        let path;
        
        // Check if teacher has the course in their courses
        // and allow to proceed to course/:course_id/assignments
        if(user.mode == 'teacher'){
          for(let course of user.teacher){
            if(course.course_id == course_id){
              path = ['course', course_id, 'assignment-gradebook'];
              return true;
            }
          }
          if('observer' in user){
            for (let observed of user.observer) {
              for(let course of observed.courses){
                if(course.course_id == course_id){
                  path = ['course', course_id, 'student', observed.id];
                }
              }
            }          
          }
        }
        
        // Check if student or observer has course in their courses
        // and redirect to the student's route.
        if(user.mode == 'student'){
          path = ['course', course_id, 'student', user.id];
        }
        if(user.mode == 'observer'){
          user.observer.forEach(observee => {
            observee.courses.forEach(course => {
              if(course.course_id == course_id){
                path = ['course', course_id, 'student', observee.id];
                return true;
              }
            })
          })
        }
        if(!path){
          path = ['notfound'];
        }
        this.router.navigate(path, { queryParams: { lti: lti } });
        return false;
      })
    )
  }

  
}
