import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, interval, NEVER } from 'rxjs';
import {
  scan,
  startWith,
  switchMap,
  tap,
  distinctUntilChanged,
} from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class PlaybackService {
  availableSpeeds = [
    {
      name: '1x',
      value: 1,
    },
    {
      name: '2x',
      value: 2,
    },
    {
      name: '5x',
      value: 5,
    },
    {
      name: '10x',
      value: 10,
    },
  ];

  // Stream for current playback position
  $playbackValue = new BehaviorSubject<number>(0);

  // Stream for playback status (playing or paused)
  private $isPlaying = new BehaviorSubject<boolean>(false);

  // Stream for playback speed
  private $speed = new BehaviorSubject<number>(1);

  // Stream for play/pause actions
  private playPauseAction$ = new Subject<boolean>();

  // Stream for the actual playback
  playback$: Observable<number>;

  // Total duration in seconds
  private totalDuration = 0;

  constructor() {
    // Initialize the playback stream
    this.playback$ = this.createPlaybackStream();

    // Subscribe to the playback stream to update the playback value
    this.playback$.subscribe((value) => {
      this.$playbackValue.next(value);
    });

    // Subscribe to play/pause actions
    this.playPauseAction$.subscribe((isPlaying) => {
      this.$isPlaying.next(isPlaying);
    });
  }

  private createPlaybackStream(): Observable<number> {
    // Create a stream that switches between an interval and NEVER based on play/pause state
    return this.$isPlaying.pipe(
      // Switch to interval when playing, NEVER when paused
      switchMap((isPlaying) => {
        if (!isPlaying) return NEVER;

        // Use the current speed to determine interval duration (in milliseconds)
        return this.$speed.pipe(
          switchMap((speed) => {
            // Emit every 100ms, adjusted by speed
            const intervalTime = 100 / speed;

            return interval(intervalTime).pipe(
              // Start from current playback value
              startWith(null),
              // Increment the playback value
              scan((acc) => {
                // Increment by a small amount adjusted for speed
                const newValue = acc + 0.1 * speed;
                // Ensure we don't exceed the total duration
                return this.totalDuration > 0
                  ? Math.min(newValue, this.totalDuration)
                  : newValue;
              }, this.$playbackValue.getValue()),
              // Stop if we reach the end
              tap((value) => {
                if (this.totalDuration > 0 && value >= this.totalDuration) {
                  this.pause();
                }
              })
            );
          })
        );
      }),
      distinctUntilChanged()
    );
  }

  play() {
    this.playPauseAction$.next(true);
  }

  pause() {
    this.playPauseAction$.next(false);
  }

  togglePlayPause() {
    const currentState = this.$isPlaying.getValue();
    this.playPauseAction$.next(!currentState);
  }

  changePlaybackValue(value: number) {
    this.$playbackValue.next(value);
  }

  changeSpeed(speed: number) {
    this.$speed.next(speed);
  }

  setTotalDuration(duration: number) {
    console.log('durarion is ', duration);
    this.totalDuration = duration;
  }

  get isPlaying$(): Observable<boolean> {
    return this.$isPlaying.asObservable();
  }

  get speed$(): Observable<number> {
    return this.$speed.asObservable();
  }
}
