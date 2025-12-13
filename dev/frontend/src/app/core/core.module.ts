import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HttpClientModule }    from '@angular/common/http';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { HttpClientInMemoryWebApiModule } from 'angular-in-memory-web-api';
import { InMemoryDataService }  from './services/in-memory-data.service';

import { enableProdMode } from '@angular/core';
import { environment } from '../../environments/environment';

import { BookIcon } from './icons/book.icon';
import { CircleCheckIcon } from './icons/circle-check.icon';
import { CircleIcon } from './icons/circle.icon';
import { DashIcon } from './icons/dash.icon';
import { HouseIcon } from './icons/house.icon';
import { KeyIcon } from './icons/key.icon';
import { PlusIcon } from './icons/plus.icon';
import { CircleXIcon } from './icons/circle-x.icon';
import { RubricIcon } from './icons/rubric.icon';
import { CommentIcon } from './icons/comment.icon';
import { CaratDownFillIcon } from './icons/carat-down-fill.icon';
import { CaratUpFillIcon } from './icons/carat-up-fill.icon';
import { ListIcon } from './icons/list.icon';
import { XIcon } from './icons/x.icon';
import { SortByPipe } from './pipes/sort-by.pipe';
import { FilterByPipe } from './pipes/filter-by.pipe';
import { FormsModule } from '@angular/forms';
import { PersonIcon } from './icons/person.icon';
import { CircleFillIcon } from './icons/circle-fill.icon';
import { GlassesIcon } from './icons/glasses.icon';
import { CheckIcon } from './icons/circle-check.icon copy';
import { CalendarIcon } from './icons/calendar.icon';

let dev = [];

let use_in_memory_data_service = false;

if(use_in_memory_data_service){
  dev = [
    // The HttpClientInMemoryWebApiModule module intercepts HTTP requests
    // and returns simulated server responses.
    HttpClientInMemoryWebApiModule.forRoot(
      InMemoryDataService, { dataEncapsulation: false }
    ),
  ];
}

if (environment.production) {
  dev = [];
  enableProdMode();
}

@NgModule({
  declarations: [
    BookIcon, CalendarIcon, CaratDownFillIcon, CaratUpFillIcon, CircleCheckIcon, 
    CircleXIcon, CircleIcon, CircleFillIcon, CheckIcon, DashIcon, GlassesIcon,  
    HouseIcon, KeyIcon, ListIcon, PersonIcon, PlusIcon, RubricIcon, 
    CommentIcon, XIcon, 
    SortByPipe, FilterByPipe,
  ],
  imports: [
    CommonModule,
    HttpClientModule,
    NgbModule,
    FormsModule,
    dev
  ],
  exports: [
    CommonModule,
    HttpClientModule,
    NgbModule,
    FormsModule,
    BookIcon, CalendarIcon, CaratDownFillIcon, CaratUpFillIcon, CircleCheckIcon, 
    CircleXIcon, CircleIcon, CircleFillIcon, CheckIcon, DashIcon, GlassesIcon,  
    HouseIcon, KeyIcon, ListIcon, PersonIcon, PlusIcon, RubricIcon, 
    CommentIcon, XIcon,
    SortByPipe, FilterByPipe,
  ]
})
export class CoreModule { }
