import { TestBed } from '@angular/core/testing';

import { SementalService } from './semental.service';

describe('SementalService', () => {
  let service: SementalService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SementalService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
