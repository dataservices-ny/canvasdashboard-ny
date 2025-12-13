import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AssignmentTitleComponent } from './assignment-title.component';

describe('AssignmentTitleComponent', () => {
  let component: AssignmentTitleComponent;
  let fixture: ComponentFixture<AssignmentTitleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AssignmentTitleComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AssignmentTitleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
