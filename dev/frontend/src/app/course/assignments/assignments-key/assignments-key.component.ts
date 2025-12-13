import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-assignments-key',
  templateUrl: './assignments-key.component.html',
  styleUrls: ['./assignments-key.component.scss']
})
export class AssignmentsKeyComponent implements OnInit {

  isCollapsed: boolean = true;
  @Input() has_number_letter_grades: boolean;

  constructor() { }

  ngOnInit(): void {
  }

}
