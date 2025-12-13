import { Injectable } from '@angular/core';

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
}
