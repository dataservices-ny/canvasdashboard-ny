import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OutcomePointsTooltipComponent } from './outcome-points-tooltip.component';

describe('OutcomePointsTooltipComponent', () => {
  let component: OutcomePointsTooltipComponent;
  let fixture: ComponentFixture<OutcomePointsTooltipComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OutcomePointsTooltipComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OutcomePointsTooltipComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
