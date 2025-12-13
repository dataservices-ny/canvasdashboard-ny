import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-outcomes-graph-key',
  templateUrl: './outcomes-graph-key.component.html',
  styleUrls: ['./outcomes-graph-key.component.scss']
})
export class OutcomesGraphKeyComponent implements OnInit {

  isCollapsed: boolean = true;
  rubricIsCollapsed: boolean = false;
  
  constructor() { }

  ngOnInit(): void {
  }

}
