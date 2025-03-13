import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../shared/shared/shared.module';
import { TopicService } from '../../../services/state/topic.service';
import { PlaybackService } from '../../../services/actions/playback.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TopicMessage } from '../../../core/models/topic.model';

@UntilDestroy()
@Component({
  selector: 'app-topic-message-viewer',
  standalone: true,
  imports: [CommonModule, SharedModule],
  templateUrl: './topic-message-viewer.component.html',
  styleUrls: ['./topic-message-viewer.component.scss'],
})
export class TopicMessageViewerComponent {
  topicService = inject(TopicService);
  playbackService = inject(PlaybackService);

  // Current message being displayed
  currentMessage: TopicMessage | null = null;

  // Current playback position
  currentPlaybackPosition = 0;

  // Computed values
  selectedTopic = computed(() => this.topicService.state().selectedTopic);

  constructor() {
    // Subscribe to the current message from the playback service
    this.playbackService.currentMessage$
      .pipe(untilDestroyed(this))
      .subscribe((message) => {
        this.currentMessage = message;
      });

    // Subscribe to the playback position
    this.playbackService.$playbackValue
      .pipe(untilDestroyed(this))
      .subscribe((position) => {
        this.currentPlaybackPosition = position;
      });
  }
}
