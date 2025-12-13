import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'icon-rubric',
  template: `
  <svg class="bi bi-rubric" width=".813em" height=".813em" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M 13.5 1 L 2.5 1 C 1.948 1 1.5 1.448 1.5 2 L 1.5 14 C 1.5 14.552 1.948 15 2.5 15 L 13.5 15 C 14.052 15 14.5 14.552 14.5 14 L 14.5 2 C 14.5 1.448 14.052 1 13.5 1 Z M 2.5 0 C 1.395 0 0.5 0.895 0.5 2 L 0.5 14 C 0.5 15.105 1.395 16 2.5 16 L 13.5 16 C 14.605 16 15.5 15.105 15.5 14 L 15.5 2 C 15.5 0.895 14.605 0 13.5 0 L 2.5 0 Z" transform="matrix(0, -1, 1, 0, 0, 16)" style=""></path>
    <rect width="3" height="5" x="6.5" y="2" rx="1" transform="matrix(0, -1, 1, 0, 0, 16)" style="fill: rgb(220, 53, 69);"></rect>
    <rect width="3" height="9" x="2.5" y="2" rx="1" transform="matrix(0, -1, 1, 0, 0, 16)" style="fill: rgb(255, 193, 7);"></rect>
    <rect width="3" height="12" x="10.5" y="2" rx="1" transform="matrix(0, -1, 1, 0, 0, 16)" style="fill: rgb(40, 167, 69);"></rect>
  </svg>
  `,
  styles: ['svg { display: block; }']
})
export class RubricIcon implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}


