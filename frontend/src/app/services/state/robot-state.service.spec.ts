import { TestBed } from '@angular/core/testing';

import { RobotStateService } from './robot-state.service';

describe('RobotStateService', () => {
  let service: RobotStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RobotStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
