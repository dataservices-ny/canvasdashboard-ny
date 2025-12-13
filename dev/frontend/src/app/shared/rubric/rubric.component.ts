import { Component, OnInit, Input } from '@angular/core';
import { Rubric, Assignment } from 'src/app/core/models/assignments';
import { RubricService } from 'src/app/core/services/rubric.service';
import { SubmissionRubric } from 'src/app/core/models/submissions';

@Component({
  selector: 'app-rubric',
  templateUrl: './rubric.component.html',
  styleUrls: ['./rubric.component.scss']
})
export class RubricComponent implements OnInit {

  @Input() assignment: Assignment;
  @Input() submission_rubric: SubmissionRubric;
  
  constructor(
    public rubricService: RubricService
  ) { }

  ngOnInit(): void {
  }

  rubric_mismatch(assignment_rubric, submission_rubric): boolean {
    let mismatch: boolean = false;

    if(submission_rubric != undefined) {
      Object.keys(submission_rubric).forEach(key => {
        if(!(Object.keys(assignment_rubric).includes(key))){
          console.log(key)
          mismatch = true
        }
      });
    }
    return mismatch
  }

}
