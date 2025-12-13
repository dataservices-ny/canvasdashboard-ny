import { Component, OnInit, Input } from '@angular/core';
import { Assignment } from 'src/app/core/models/assignments';
import { AssignmentModalService } from '../assignment-modal/assignment-modal.service';
import { AssignmentsService } from 'src/app/core/services/assignments.service';
import { Submission } from 'src/app/core/models/submissions';
import { environment } from 'src/environments/environment';
import { UserService } from 'src/app/core/services/user.service';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-assignment-body',
  templateUrl: './assignment-body.component.html',
  styleUrls: ['./assignment-body.component.scss']
})
export class AssignmentBodyComponent implements OnInit {

  @Input() course_id: string;
  @Input() assignment: Assignment;
  @Input() submission: Submission;
  speedgrader: boolean;
  canvas_url: string = environment.canvas_url;

  constructor(
    public assignmentsService: AssignmentsService,
    public assignmentModalService: AssignmentModalService,
    private userService: UserService
  ) { }

  ngOnInit(): void {
    this.userService.getUser()
      .pipe(
        take(1)
      )
      .subscribe(user => {
        if(user.admin){
          this.speedgrader = true;
        }
        else if(user.teacher && user.teacher.filter(course => course.course_id == this.course_id).length > 0){
          this.speedgrader = true;
        }
      });
  }


}
