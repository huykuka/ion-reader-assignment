import { Injectable, effect } from '@angular/core';
import { BehaviorSubject, Observable, Subject, interval, NEVER } from 'rxjs';
import {
  scan,
  startWith,
  switchMap,
  tap,
  distinctUntilChanged,
} from 'rxjs/operators';
import { Topic, TopicMessage } from '../../core/models/topic.model';
import { TopicService } from '../state/topic.service';

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

  // Stream for the current message based on playback position
  private $currentMessage = new BehaviorSubject<TopicMessage | null>(null);

  // Stream for the actual playback
  playback$: Observable<number>;

  // Total duration in seconds
  private totalDuration = 0;

  constructor(private topicService: TopicService) {
    // Initialize the playback stream
    this.playback$ = this.createPlaybackStream();

    // Subscribe to the playback stream to update the playback value
    this.playback$.subscribe((value) => {
      this.$playbackValue.next(value);
      this.updateCurrentMessage(value);
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

      // Update the message with the current playback position
      this.updateCurrentMessage(this.$playbackValue.getValue());
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

  reset() {
    this.playPauseAction$.next(false);
    this.$playbackValue.next(0);
  }

  togglePlayPause() {
    const currentState = this.$isPlaying.getValue();
    this.playPauseAction$.next(!currentState);
  }

  changePlaybackValue(value: number) {
    this.$playbackValue.next(value);
    this.updateCurrentMessage(value);
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
   * Find the message with the timestamp closest to the current playback position
   * @param topic The topic containing messages
   * @param playbackPosition The current playback position in seconds
   * @returns The message with the closest timestamp
   */
  findClosestMessage(
    topic: Topic | null,
    playbackPosition: number
  ): TopicMessage | null {
    if (!topic || !topic.messages || topic.messages.length === 0) {
      return null;
    }

    // Convert playback position to milliseconds (assuming playbackPosition is in seconds)
    const targetTimestamp = playbackPosition * 1000;

    // Find the message with the closest timestamp
    let closestMessage: TopicMessage | null = null;
    let minDifference = Number.MAX_VALUE;

    for (const message of topic.messages) {
      if (message.timestamp) {
        const difference = Math.abs(message.timestamp - targetTimestamp);
        if (difference < minDifference) {
          minDifference = difference;
          closestMessage = message;
        }
      }
    }

    return closestMessage;
  }

  /**
   * Get the current message based on playback position
   * @returns Observable of the current message
   */
  get currentMessage$(): Observable<TopicMessage | null> {
    return this.$currentMessage.asObservable();
  }

  /**
   * Update the current message based on the playback position
   * @param playbackPosition The current playback position
   */
  private updateCurrentMessage(playbackPosition: number): void {
    const selectedTopic = this.topicService.state().selectedTopic;
    const message = this.findClosestMessage(selectedTopic, playbackPosition);
    this.$currentMessage.next(message);
  }
}
