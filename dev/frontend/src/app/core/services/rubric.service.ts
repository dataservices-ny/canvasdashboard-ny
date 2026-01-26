import { Injectable } from '@angular/core';
import { Assignment } from '../models/assignments';


@Injectable({
  providedIn: 'root'
})
export class RubricService {

  constructor() { }

  rubric_color(points: number): string {
    if(points == null) return 'na'
    else if(points > 2) return 'advanced'
    else if(points == 2) return 'proficient'
    else if(points >= 1) return 'developing'
    else return 'not-yet'
  }

  isMajor(assignment: Assignment): boolean {
    const group = assignment && assignment.assignment_group;
    return !!group && group.toLowerCase().includes('major');
  }
}
