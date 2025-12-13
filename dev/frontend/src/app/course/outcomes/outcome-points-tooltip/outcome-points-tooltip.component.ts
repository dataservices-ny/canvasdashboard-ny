import { Component, OnInit, Input } from '@angular/core';
import { Assessment } from 'src/app/core/models/outcomes';

@Component({
  selector: 'app-outcome-points-tooltip',
  templateUrl: './outcome-points-tooltip.component.html',
  styleUrls: ['./outcome-points-tooltip.component.scss']
})
export class OutcomePointsTooltipComponent implements OnInit {

  @Input() assessment: Assessment;

  constructor() { }

  ngOnInit(): void {
  }

}
