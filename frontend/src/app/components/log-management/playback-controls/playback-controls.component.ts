import { Component, inject, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../shared/shared/shared.module';
import { SessionService } from '../../../services';
import dayjs from 'dayjs';
import { PlaybackService } from '../../../services/actions/playback.service';
import { firstValueFrom } from 'rxjs';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'app-playback-controls',
  standalone: true,
  imports: [CommonModule, SharedModule],
  templateUrl: './playback-controls.component.html',
  styleUrls: ['./playback-controls.component.scss'],
})
export class PlaybackControlsComponent {
  sessionService = inject(SessionService);
  playbackService = inject(PlaybackService);

  // Computed values from playback service
  sessionState = computed(() => this.sessionService.getSession());
  startTime = computed(() => dayjs(this.sessionState()?.start_time).unix());
  endTime = computed(() => dayjs(this.sessionState()?.end_time).unix());

  // Track if playback is active
  isPlaying = false;

  // Selected speed for the dropdown
  selectedSpeed = { name: '1x', value: 1 };

  get sliderValue() {
    return this.playbackService.$playbackValue.getValue();
  }

  set sliderValue(value: number) {
    this.playbackService.changePlaybackValue(value);
  }

  totalTime = computed(() => {
    // Calculate the difference in seconds
    const diffInSeconds = this.endTime() - this.startTime();

    if (diffInSeconds <= 0) return 0;

    return diffInSeconds;
  });

  constructor() {
    // Subscribe to playback state changes
    this.playbackService.isPlaying$
      .pipe(untilDestroyed(this))
      .subscribe((playing) => {
        this.isPlaying = playing;
      });

    // Set the default speed
    this.selectedSpeed = this.playbackService.availableSpeeds[0];

    // Initialize the playback service with the default speed
    this.playbackService.changeSpeed(this.selectedSpeed.value);

    effect(() => {
      this.playbackService.setTotalDuration(this.totalTime());
    });
  }

  onSliderChange(event: any) {
    this.playbackService.changePlaybackValue(event.value);
  }

  onSpeedChange(event: any) {
    if (event && event.value) {
      this.selectedSpeed = event.value;
      this.playbackService.changeSpeed(event.value);
    }
  }

  onReset() {
    this.playbackService.reset();
  }

  async onPlay() {
    const isPlaying = await firstValueFrom(this.playbackService.isPlaying$);
    if (!isPlaying) {
      this.playbackService.play();
    } else {
      this.playbackService.pause();
    }
  }
}
