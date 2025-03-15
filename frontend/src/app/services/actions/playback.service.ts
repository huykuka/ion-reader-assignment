import { Injectable, effect, inject } from '@angular/core';
import { BehaviorSubject, Observable, Subject, interval, NEVER } from 'rxjs';
import {
  scan,
  startWith,
  switchMap,
  tap,
  distinctUntilChanged
} from 'rxjs/operators';
import { TopicMessage } from '../../core/models/topic.model';
import { TopicService } from '../state/topic.service';
import { SessionService } from '../state/session.service';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

// Extend dayjs with the UTC plugin
dayjs.extend(utc);

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

  private manualPositionChange = false;
  // Stream for playback status (playing or paused)
  private $isPlaying = new BehaviorSubject<boolean>(false);

  // Stream for playback speed
  private $speed = new BehaviorSubject<number>(1);

  // Stream for play/pause actions
  private playPauseAction$ = new Subject<boolean>();

  // Stream for the current message based on playback position
  private $currentMessage = new BehaviorSubject<TopicMessage | null>(null);

  // Stream for the actual playback
  playback$: Observable<number>;

  // Total duration in seconds
  private totalDuration = 0;

  topicService = inject(TopicService);
  sessionService = inject(SessionService);

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

    // Use effect to watch for topic changes
    effect(() => {
      // Access the selectedTopic to create a dependency

      // Clear the current message when topic changes
      this.$currentMessage.next(null);
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
                // If there was a manual position change, use that value instead
                if (this.manualPositionChange) {
                  this.manualPositionChange = false;
                  return this.$playbackValue.getValue();
                }

                // Increment by a small amount adjusted for speed
                const newValue = acc + 0.1 * speed;

                // If we've exceeded the total duration, return exactly the total duration
                if (this.totalDuration > 0 && newValue > this.totalDuration) {
                  return this.totalDuration;
                }

                // Otherwise return the new value
                return newValue;
              }, this.$playbackValue.getValue()),
              // Stop if we reach the end
              tap((value) => {
                if (this.totalDuration > 0 && value >= this.totalDuration) {
                  this.$playbackValue.next(this.totalDuration);
                  // Then pause
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

  reset() {
    this.playPauseAction$.next(false);
    this.$playbackValue.next(0);
  }

  togglePlayPause() {
    const currentState = this.$isPlaying.getValue();
    this.playPauseAction$.next(!currentState);
  }

  changePlaybackValue(value: number) {
    this.manualPositionChange = true;
    this.$playbackValue.next(value);
  }

  changeSpeed(speed: number) {
    this.$speed.next(speed);
  }

  setTotalDuration(duration: number) {
    this.totalDuration = duration;
  }

  get isPlaying$(): Observable<boolean> {
    return this.$isPlaying.asObservable();
  }

  get speed$(): Observable<number> {
    return this.$speed.asObservable();
  }

  /**
   * Handle a new file upload during playback
   * This method gracefully stops playback and resets the state
   * @returns A promise that resolves when the playback has been properly stopped
   */
  handleNewFileUpload(): Promise<void> {
    // Store the current playback state
    const wasPlaying = this.$isPlaying.getValue();
    
    // Pause playback immediately
    this.pause();
    
    // Reset the playback position
    this.$playbackValue.next(0);
    
    // Clear any current message
    this.$currentMessage.next(null);
    
    // Return a promise that resolves after a short delay to ensure all operations are complete
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, 100);
    });
  }
}
