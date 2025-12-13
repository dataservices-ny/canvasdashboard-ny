import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AssignmentsKeyComponent } from './assignments-key.component';

describe('AssignmentsKeyComponent', () => {
  let component: AssignmentsKeyComponent;
  let fixture: ComponentFixture<AssignmentsKeyComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AssignmentsKeyComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AssignmentsKeyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
