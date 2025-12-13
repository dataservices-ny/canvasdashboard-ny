import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RubricBadgeComponent } from './rubric-badge.component';

describe('RubricBadgeComponent', () => {
  let component: RubricBadgeComponent;
  let fixture: ComponentFixture<RubricBadgeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RubricBadgeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RubricBadgeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
