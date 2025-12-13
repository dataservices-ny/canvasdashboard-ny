import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { Observable,of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { UserService } from '../services/user.service'
import { SidebarService } from '../services/sidebar.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  
  constructor(
    private router: Router,
    private userService: UserService,
    private sidebarService: SidebarService ){}


  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> {
    return this.userService.getUser().pipe(
      switchMap(user => {
        if(user.admin ){
          return of(true);
        }
        else{
          return of(false);
        }
      })
    )
  }
}