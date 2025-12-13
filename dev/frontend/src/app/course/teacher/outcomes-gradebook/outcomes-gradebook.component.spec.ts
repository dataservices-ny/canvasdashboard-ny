import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OutcomesGradebookComponent } from './outcomes-gradebook.component';

describe('OutcomesGradebookComponent', () => {
  let component: OutcomesGradebookComponent;
  let fixture: ComponentFixture<OutcomesGradebookComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OutcomesGradebookComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OutcomesGradebookComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
