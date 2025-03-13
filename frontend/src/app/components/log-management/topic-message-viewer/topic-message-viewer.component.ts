import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../shared/shared/shared.module';
import { TopicService } from '../../../services/state/topic.service';
import { PlaybackService } from '../../../services/actions/playback.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Topic, TopicMessage } from '../../../core/models/topic.model';
import dayjs from 'dayjs';
import { SessionService } from '../../../services';

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
  sessionService = inject(SessionService);

  // Current message being displayed
  currentMessage: TopicMessage | null = null;

  // Current playback position
  currentPlaybackPosition = 0;

  // Computed values
  selectedTopic = computed(() => this.topicService.state().selectedTopic);

  constructor() {
    // Subscribe to the playback position
    this.playbackService.$playbackValue
      .pipe(untilDestroyed(this))
      .subscribe((position) => {
        this.currentPlaybackPosition = position;
        this.currentMessage = this.findClosestMessage(
          this.selectedTopic(),
          this.currentPlaybackPosition
        );
      });
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
    const targetTimestamp =
      playbackPosition * 1000 +
      dayjs.utc(this.sessionService.getSession()?.start_time).valueOf();

    // Find the message with the closest timestamp
    let closestMessage: TopicMessage | null = null;
    let minDifference = Number.MAX_VALUE;

    for (const message of topic.messages) {
      if (message.timestamp) {
        const messageTimestamp = dayjs(message.timestamp).valueOf();
        const difference = Math.abs(messageTimestamp - targetTimestamp);
        if (difference < minDifference) {
          minDifference = difference;
          closestMessage = message;
        }
      }
    }

    return closestMessage;
  }
}
