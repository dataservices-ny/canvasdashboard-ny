import { Injectable } from '@angular/core';
import { CanActivate, CanLoad, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable,of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { UserService } from '../services/user.service'

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate, CanLoad {
  
  constructor(private userService: UserService){}
  
  canActivate(): Observable<boolean> {
    return this.checkUserAuth();
  }

  canLoad(): Observable<boolean> {
    return this.checkUserAuth();
  }

  checkUserAuth(): Observable<boolean> {
    return this.userService.getUser().pipe(
      switchMap(user => { return of(true) })
    )
  }
  
}
