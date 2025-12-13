import { Component, OnInit, Input } from '@angular/core';
import { Assignment } from 'src/app/core/models/assignments';
import { AssignmentModalService } from '../assignment-modal/assignment-modal.service';
import { AssignmentsService } from 'src/app/core/services/assignments.service';
import { Submission } from 'src/app/core/models/submissions';

@Component({
  selector: 'app-assignment-title',
  templateUrl: './assignment-title.component.html',
  styleUrls: ['./assignment-title.component.scss']
})
export class AssignmentTitleComponent implements OnInit {

  @Input() assignment: Assignment;
  @Input() submission: Submission;
  @Input() color: string = 'text-body'
  @Input() is_model = false;
  @Input() upcoming = false;
  
  constructor(
    public assignmentsService: AssignmentsService,
    public assignmentModalService: AssignmentModalService
  ) { }

  ngOnInit(): void {
  }

}
