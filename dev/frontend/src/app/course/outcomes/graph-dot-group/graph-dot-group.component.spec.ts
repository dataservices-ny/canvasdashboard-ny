import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GraphDotGroupComponent } from './graph-dot-group.component';

describe('GraphDotComponent', () => {
  let component: GraphDotGroupComponent;
  let fixture: ComponentFixture<GraphDotGroupComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GraphDotGroupComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GraphDotGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
