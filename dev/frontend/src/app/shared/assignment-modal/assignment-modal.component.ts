import { Component, OnInit, Input } from '@angular/core';
import { Assignment } from 'src/app/core/models/assignments';
import { NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Submission } from 'src/app/core/models/submissions';

@Component({
  selector: 'app-assignment-modal',
  templateUrl: './assignment-modal.component.html',
  styleUrls: ['./assignment-modal.component.css']
})
export class AssignmentModalComponent implements OnInit {

  @Input() course_id: string;
  @Input() assignment: Assignment;
  @Input() submission: Submission;
  @Input() modal: NgbModalRef

  constructor() { }

  ngOnInit(): void {
    this.assignment.isCollapsed = false;
  }

}
