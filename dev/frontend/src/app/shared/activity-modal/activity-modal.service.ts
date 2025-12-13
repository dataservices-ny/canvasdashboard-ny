import { Injectable } from '@angular/core';
import { DataService } from 'src/app/core/services/data.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { take, skipWhile } from 'rxjs/operators';
import { ActivityModalComponent } from './activity-modal.component';

@Injectable({
  providedIn: 'root'
})
export class ActivityModalService {

  constructor(
    private dataService: DataService,
    private modalService: NgbModal
  ) { }

  openActivity(course_id, student_id, activity_id): void {
    this.dataService.getActivity(course_id, student_id, activity_id)
      .pipe(
        skipWhile(activity => typeof(activity) == "undefined"),
        take(1)
      )
      .subscribe(activity => {
        const modalRef = this.modalService.open(ActivityModalComponent, { size: 'lg', scrollable: true });
        modalRef.componentInstance.course_id = course_id;
        modalRef.componentInstance.activity = activity;
        modalRef.componentInstance.modal = modalRef
      });
  }
}
