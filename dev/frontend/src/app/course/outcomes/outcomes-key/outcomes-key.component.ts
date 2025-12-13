import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-outcomes-key',
  templateUrl: './outcomes-key.component.html',
  styleUrls: ['./outcomes-key.component.css']
})
export class OutcomesKeyComponent implements OnInit {

  isCollapsed: boolean = true;
  rubricIsCollapsed: boolean = false;
  
  constructor() { }

  ngOnInit(): void {
  }

}
