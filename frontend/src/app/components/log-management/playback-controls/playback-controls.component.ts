import { Component, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../shared/shared/shared.module';
import { computed } from '@angular/core';
import { SessionService } from '../../../services';
import dayjs from 'dayjs';
import { PlaybackService } from '../../../services/actions/playback.service';
import { distinctUntilChanged, firstValueFrom } from 'rxjs';
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

  slidervalue!: number;

  // Computed values from playback service
  sessionState = computed(() => this.sessionService.getSession());
  startTime = computed(() => dayjs(this.sessionState()?.start_time).unix());
  endTime = computed(() => dayjs(this.sessionState()?.end_time).unix());

  // Track if playback is active
  isPlaying = false;

  totalTime = computed(() => {
    // Calculate the difference in seconds
    const diffInSeconds = this.endTime() - this.startTime();
    console.log(diffInSeconds);

    if (diffInSeconds <= 0) return 0;

    return diffInSeconds;
  });

  constructor() {
    this.playbackService.$playbackValue
      .pipe(distinctUntilChanged(), untilDestroyed(this))
      .subscribe(console.log);

    // Subscribe to playback state changes
    this.playbackService.isPlaying$
      .pipe(untilDestroyed(this))
      .subscribe((playing) => {
        this.isPlaying = playing;
      });

    effect(() => {
      this.playbackService.setTotalDuration(this.totalTime());
    });
  }

  ngOnDestroy() {
    // Ensure playback is stopped when component is destroyed
    this.playbackService.pause();
  }

  onSliderChange(event: any) {
    this.playbackService.changePlaybackValue(event.value);
  }

  onSpeedChange(event: any) {
    this.playbackService.changeSpeed(event.value);
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
