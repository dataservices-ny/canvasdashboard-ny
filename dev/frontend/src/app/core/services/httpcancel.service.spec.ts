import { TestBed } from '@angular/core/testing';

import { HttpCancelService } from './httpcancel.service';

describe('HttpCancelService', () => {
  let service: HttpCancelService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HttpCancelService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
