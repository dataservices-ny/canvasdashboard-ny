import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { Observable,of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { UserService } from '../services/user.service'
import { SidebarService } from '../services/sidebar.service';

@Injectable({
  providedIn: 'root'
})
export class DirectoryGuard implements CanActivate {
  
  constructor(
    private router: Router,
    private userService: UserService,
    private sidebarService: SidebarService ){}


  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> {
    // Get lti state from SidebarService or from param
    let lti = null; 
    if(this.sidebarService.lti){
      lti = 'true';
    }
    else{
      lti = route.queryParamMap.get('lti');
    }

    return this.userService.getUser().pipe(
      switchMap(user => {
        if(user.mode == 'student'){
          this.router.navigate(['/dashboard/student', user.id ], { queryParams: { lti: lti } })
          return of(false);
        }
        if(user.mode == 'observer' && user.observer.length == 1){
          this.router.navigate(['dashboard/student', user.observer[0].id], { queryParams: { lti: lti } })
          return of(false);
        }
        return of(true);
        }
      )
    )
  }
}