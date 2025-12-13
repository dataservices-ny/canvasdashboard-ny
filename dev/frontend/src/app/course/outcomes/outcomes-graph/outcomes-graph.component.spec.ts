import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OutcomesGraphComponent } from './outcomes-graph.component';

describe('OutcomesGraphComponent', () => {
  let component: OutcomesGraphComponent;
  let fixture: ComponentFixture<OutcomesGraphComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OutcomesGraphComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OutcomesGraphComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
