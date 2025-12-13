import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AssignmentBodyComponent } from './assignment-body.component';

describe('AssignmentBodyComponent', () => {
  let component: AssignmentBodyComponent;
  let fixture: ComponentFixture<AssignmentBodyComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AssignmentBodyComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AssignmentBodyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
