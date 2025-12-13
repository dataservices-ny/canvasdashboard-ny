import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'icon-circle-fill',
  template: `
  <svg width=".813em" height=".813em" viewBox="0 0 16 16" class="bi bi-circle-fill" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="8" r="8"/>
  </svg>
  `,
  styles: [`svg { 
    display: block; 
    margin: .1em;
  }
`]
})
export class CircleFillIcon implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
