import { TestBed } from '@angular/core/testing';

import { ObjDecodingService } from './obj-decoding.service';

describe('ObjDecodingService', () => {
  let service: ObjDecodingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ObjDecodingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
