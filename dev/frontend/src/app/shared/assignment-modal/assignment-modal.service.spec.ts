import { TestBed } from '@angular/core/testing';

import { AssignmentModalService } from './assignment-modal.service';

describe('AssignmentModalService', () => {
  let service: AssignmentModalService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AssignmentModalService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
