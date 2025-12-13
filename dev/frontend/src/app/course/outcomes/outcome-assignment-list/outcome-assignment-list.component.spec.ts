import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OutcomeAssignmentListComponent } from './outcome-assignment-list.component';

describe('OutcomeAssignmentListComponent', () => {
  let component: OutcomeAssignmentListComponent;
  let fixture: ComponentFixture<OutcomeAssignmentListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OutcomeAssignmentListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OutcomeAssignmentListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
