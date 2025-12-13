import { Component, OnInit } from '@angular/core';
import { Observable }     from 'rxjs';
import { UserService } from '../core/services/user.service';
import { User } from '../core/models/user';
import { environment } from 'src/environments/environment';
import { StudentSearchService } from '../core/services/student-search.service';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.scss']
})
export class NavComponent implements OnInit {

  user$: Observable<User>
  canvas_url: string = environment.canvas_url;
  veracross_url: string = environment.veracross_url;

  constructor(
    private userService: UserService,
    public studentSearchService: StudentSearchService
  ) { }

  ngOnInit(): void {
    this.user$ = this.userService.getUser();
  }
}