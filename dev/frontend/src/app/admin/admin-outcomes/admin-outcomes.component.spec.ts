import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminOutcomesComponent } from './admin-outcomes.component';

describe('AdminOutcomesComponent', () => {
  let component: AdminOutcomesComponent;
  let fixture: ComponentFixture<AdminOutcomesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminOutcomesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminOutcomesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
