import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-activity-body',
  templateUrl: './activity-body.component.html',
  styleUrls: ['./activity-body.component.css']
})
export class ActivityBodyComponent implements OnInit {

  @Input() activity;

  constructor() { }

  ngOnInit(): void {
  }

}
