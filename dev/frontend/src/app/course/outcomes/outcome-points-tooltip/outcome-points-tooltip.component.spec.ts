import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OutcomesPointsTooltipComponent } from './outcome-points-tooltip.component';

describe('OutcomesPointsTooltipComponent', () => {
  let component: OutcomesPointsTooltipComponent;
  let fixture: ComponentFixture<OutcomesPointsTooltipComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OutcomesPointsTooltipComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OutcomesPointsTooltipComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
