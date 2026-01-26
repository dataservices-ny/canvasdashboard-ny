import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-outcomes-key',
  templateUrl: './outcomes-key.component.html',
  styleUrls: ['./outcomes-key.component.scss']
})
export class OutcomesKeyComponent implements OnInit {

  isCollapsed: boolean = true;
  rubricIsCollapsed: boolean = false;
  
  constructor() { }

  ngOnInit(): void {
  }

}
