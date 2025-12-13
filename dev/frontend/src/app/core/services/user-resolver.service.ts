import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Resolve } from  '@angular/router';
import { UserService } from './user.service'
import { User } from '../models/user'
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})

export class UserResolverService implements Resolve<Observable<User>> {

  public constructor(private userService: UserService) { }

  public resolve(): Observable<User> {
      return this.userService.getUser()
  }

}