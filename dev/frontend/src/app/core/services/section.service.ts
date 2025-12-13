import { Injectable } from '@angular/core';
import { Section } from '../models/course';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SectionService {

  current_section: BehaviorSubject<string> = new BehaviorSubject<string>(null);
  some_loaded: boolean = false;

  constructor() { }

  set(section: string): void{
    this.current_section.next(section);
  }
}
