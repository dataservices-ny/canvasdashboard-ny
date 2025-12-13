import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GradeEstimatorComponent } from './grade-estimator.component';

describe('GradeEstimatorComponent', () => {
  let component: GradeEstimatorComponent;
  let fixture: ComponentFixture<GradeEstimatorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GradeEstimatorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GradeEstimatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
