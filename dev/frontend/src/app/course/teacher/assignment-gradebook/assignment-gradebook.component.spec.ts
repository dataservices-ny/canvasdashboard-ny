import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AssignmentGradebookComponent } from './assignment-gradebook.component';

describe('AssignmentGradebookComponent', () => {
  let component: AssignmentGradebookComponent;
  let fixture: ComponentFixture<AssignmentGradebookComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AssignmentGradebookComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AssignmentGradebookComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
