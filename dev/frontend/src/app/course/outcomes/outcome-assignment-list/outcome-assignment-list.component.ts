import { Component, OnInit, Input } from '@angular/core';
import { Assessment } from 'src/app/core/models/outcomes';
import { RubricService } from 'src/app/core/services/rubric.service';
import { ActivatedRoute } from '@angular/router';
import { AssignmentModalService } from 'src/app/shared/assignment-modal/assignment-modal.service';

@Component({
  selector: 'app-outcome-assignment-list',
  templateUrl: './outcome-assignment-list.component.html',
  styleUrls: ['./outcome-assignment-list.component.scss']
})
export class OutcomeAssignmentListComponent implements OnInit {

  @Input() assessments: Assessment[];
  @Input() course_id: string;
  @Input() student_id: string;
  
  constructor(
    public rubricService: RubricService,
    public assignmentModalService: AssignmentModalService
  ) { }

  ngOnInit(): void {
  }

}
