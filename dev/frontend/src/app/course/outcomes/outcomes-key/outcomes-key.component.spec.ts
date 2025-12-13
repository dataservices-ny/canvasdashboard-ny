import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OutcomesKeyComponent } from './outcomes-key.component';

describe('OutcomesKeyComponent', () => {
  let component: OutcomesKeyComponent;
  let fixture: ComponentFixture<OutcomesKeyComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OutcomesKeyComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OutcomesKeyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
