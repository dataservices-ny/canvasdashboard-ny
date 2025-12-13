import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RubricKeyComponent } from './rubric-key.component';

describe('RubricKeyComponent', () => {
  let component: RubricKeyComponent;
  let fixture: ComponentFixture<RubricKeyComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RubricKeyComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RubricKeyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
