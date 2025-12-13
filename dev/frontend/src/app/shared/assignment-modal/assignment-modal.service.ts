import { Injectable } from '@angular/core';
import { AssignmentModalComponent } from './assignment-modal.component';
import { DataService } from 'src/app/core/services/data.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { take, skipWhile } from 'rxjs/operators';
import { combineLatest } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AssignmentModalService {

  constructor(
    private dataService: DataService,
    private modalService: NgbModal
  ) { }

  openAssignment(student_id, course_id, assignment_id): void {
    combineLatest([
      this.dataService.getAssignment(course_id, student_id, assignment_id),
      this.dataService.getSubmission(student_id, course_id, assignment_id)
    ])
      .pipe(
        skipWhile(([assignment, submission]) => !(assignment && submission)),
        take(1)
      )
      .subscribe(([assignment, submission]) => {
        assignment.descriptionIsCollapsed = true;
        const modalRef = this.modalService.open(AssignmentModalComponent, { size: 'lg', scrollable: true });
        modalRef.componentInstance.course_id = course_id;
        modalRef.componentInstance.assignment = assignment;
        modalRef.componentInstance.submission = submission;
        modalRef.componentInstance.modal = modalRef
      });
  }

}
