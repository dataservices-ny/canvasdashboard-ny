import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OutcomesGraph2Component } from './outcomes-graph2.component';

describe('OutcomesGraph2Component', () => {
  let component: OutcomesGraph2Component;
  let fixture: ComponentFixture<OutcomesGraph2Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OutcomesGraph2Component ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OutcomesGraph2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
