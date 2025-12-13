import { Component, OnInit, Input } from '@angular/core';
import { RubricService } from 'src/app/core/services/rubric.service';

@Component({
  selector: 'app-rubric-badge',
  templateUrl: './rubric-badge.component.html',
  styleUrls: ['./rubric-badge.component.scss']
})
export class RubricBadgeComponent implements OnInit {

  @Input() points: number;
  @Input() skinny: boolean = false;
  @Input() extra_class: string = '';
  text: string;
  points_type: string = 'text'  // or 'points'

  constructor(
    public rubricService: RubricService
  ) { }

  ngOnInit(): void {
    if(this.points_type == 'points'){
      this.text = this.points.toString()
    }
    if(this.points_type == 'text'){
      this.text = this.toText(this.points)
    }

  }

  toText(points: number): string {
    if(points == null) return 'na'
    if(points >= 3) return 'A'
    if(points > 2) return 'P+'
    if(points == 2) return 'P'
    if(points > 1) return 'D+'
    if(points == 1) return 'D'
    if(points > 0) return 'D-'
    return 'NY'
  }

}
