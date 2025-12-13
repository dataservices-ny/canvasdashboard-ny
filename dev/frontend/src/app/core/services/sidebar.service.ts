import { Injectable, NgZone } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {

  lti: Boolean = false;
  sidebar_toggle_class: string;
  show_toggle_button: boolean;

  constructor(
    private zone: NgZone
  ) { }

  sidebar_toggle_detect(): void {
    let mq = matchMedia('(max-width: 768px)')
    this.mq_handler(mq)
    matchMedia('(max-width: 768px)').addListener((mq => this.mq_handler(mq)));
  }

  mq_handler(mql): void{
    if (mql.matches) {
        this.zone.run(() => {
            this.sidebar_toggle_class = 'toggled';
            this.show_toggle_button = true;
        });
    }
    else {
      this.zone.run(() => {
        this.sidebar_toggle_class = '';
        this.show_toggle_button = false;
      });
    }
  }
  
}

