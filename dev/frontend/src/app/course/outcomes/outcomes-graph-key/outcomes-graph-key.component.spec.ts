import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OutcomesGraphKeyComponent } from './outcomes-graph-key.component';

describe('OutcomesGraphKeyComponent', () => {
  let component: OutcomesGraphKeyComponent;
  let fixture: ComponentFixture<OutcomesGraphKeyComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OutcomesGraphKeyComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OutcomesGraphKeyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
