import { TestBed } from '@angular/core/testing';

import { PlaybackStateService } from './playback-state.service';

describe('PlaybackStateService', () => {
  let service: PlaybackStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PlaybackStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
