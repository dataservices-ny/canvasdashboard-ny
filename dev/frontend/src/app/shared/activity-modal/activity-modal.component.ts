import { Component, OnInit, Input } from '@angular/core';
import { Activity } from 'src/app/core/models/activities';
import { NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-activity-modal',
  templateUrl: './activity-modal.component.html',
  styleUrls: ['./activity-modal.component.css']
})
export class ActivityModalComponent implements OnInit {

  @Input() course_id: string;
  @Input() activity: Activity;
  @Input() modal: NgbModalRef

  constructor() { }

  ngOnInit(): void {
    this.activity.isCollapsed = false;
  }

}
