import { Component, inject, ViewChild, ElementRef } from '@angular/core';
import { TopicService } from '../../../services/state/topic.service';
import { PlaybackService } from '../../../services/actions/playback.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TopicMessage } from '../../../core/models/topic.model';
import { SessionService } from '../../../services';
import dayjs from 'dayjs';
import { SharedModule } from '../../../shared/shared/shared.module';
import { rosoutAggTopic } from '../../../core/constants/constant';

@UntilDestroy()
@Component({
  selector: 'app-log-console',
  imports: [SharedModule],
  templateUrl: './log-console.component.html',
  styleUrls: ['./log-console.component.scss'],
})
export class LogConsoleComponent {
  @ViewChild('logTable') logTable!: ElementRef;
  @ViewChild('tableContainer') tableContainer!: ElementRef;

  topicService = inject(TopicService);
  playbackService = inject(PlaybackService);
  sessionService = inject(SessionService);

  // Current playback position
  currentPlaybackPosition = 0;

  // Messages to display
  visibleMessages: TopicMessage[] = [];

  // Track previous message count to determine when to scroll
  previousMessageCount = 0;

  // Auto-scroll flag
  shouldScrollToBottom = true;

  // Filter properties
  filterText = '';
  allMessages: TopicMessage[] = [];

  // Log level definitions
  logLevels = [
    { label: 'Debug', value: 1, style: 'secondary' },
    { label: 'Info', value: 2, style: 'info' },
    { label: 'Warn', value: 4, style: 'warning' },
    { label: 'Error', value: 8, style: 'danger' },
    { label: 'Fatal', value: 16, style: 'help' },
  ];

  // Selected log levels for filtering (empty means all levels are shown)
  selectedLogLevels: number[] = [];

  constructor() {
    // Subscribe to the playback position
    this.playbackService.$playbackValue
      .pipe(untilDestroyed(this))
      .subscribe((position) => {
        this.currentPlaybackPosition = position;
        this.previousMessageCount = this.visibleMessages.length;
        this.updateVisibleMessages();
      });
  }

  // Scroll to the bottom of the table
  scrollToBottom(): void {
    if (this.tableContainer) {
      const container = this.tableContainer.nativeElement;
      container.scrollTop = container.scrollHeight;
    }
  }

  // Toggle auto-scroll behavior
  toggleAutoScroll(): void {
    this.shouldScrollToBottom = !this.shouldScrollToBottom;
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
    }
  }

  // Update visible messages based on current playback position
  updateVisibleMessages(): void {
    const topics = this.topicService.state().topics || [];
    const rosoutTopic = topics.find(
      (topic) => topic.topicName === rosoutAggTopic
    );

    if (!rosoutTopic) {
      this.allMessages = [];
      this.visibleMessages = [];
      return;
    }

    const messages = rosoutTopic.messages || [];
    const sessionStartTime = this.sessionService.getSession()?.start_time;

    if (!sessionStartTime) {
      this.allMessages = [];
      this.visibleMessages = [];
      return;
    }

    const targetTimestamp =
      this.currentPlaybackPosition * 1000 +
      dayjs.utc(sessionStartTime).valueOf();

    // Filter messages by timestamp (only show messages up to current playback position)
    this.allMessages = messages.filter((msg) => {
      if (!msg.timestamp) return false;
      const messageTimestamp = dayjs(msg.timestamp).valueOf();
      return messageTimestamp <= targetTimestamp;
    });

    // Limit the number of messages to prevent performance issues
    if (this.allMessages.length > 1000) {
      this.allMessages = this.allMessages.slice(this.allMessages.length - 1000);
    }

    // Apply any active filters
    this.applyFilters();

    // Check if we should auto-scroll to the bottom
    if (
      this.shouldScrollToBottom &&
      this.visibleMessages.length > this.previousMessageCount
    ) {
      // Use setTimeout to ensure the DOM has updated before scrolling
      setTimeout(() => this.scrollToBottom(), 0);
    }
  }

  // Apply text and log level filters
  applyFilters(): void {
    // Start with all messages
    let filteredMessages = [...this.allMessages];

    // Apply text filter if any
    if (this.filterText.trim()) {
      const searchTerm = this.filterText.toLowerCase();
      filteredMessages = filteredMessages.filter((msg) => {
        const messageText = this.getMessageText(msg).toLowerCase();
        return messageText.includes(searchTerm);
      });
    }

    // Apply log level filter if any levels are selected
    if (this.selectedLogLevels.length > 0) {
      filteredMessages = filteredMessages.filter((msg) => {
        const level = msg.data?.level || 0;
        return this.selectedLogLevels.includes(level);
      });
    }

    this.visibleMessages = filteredMessages;
  }

  // Toggle a log level in the filter
  toggleLogLevel(level: number): void {
    const index = this.selectedLogLevels.indexOf(level);
    if (index === -1) {
      // Add the level to selected levels
      this.selectedLogLevels.push(level);
    } else {
      // Remove the level from selected levels
      this.selectedLogLevels.splice(index, 1);
    }
    this.applyFilters();
  }

  // Clear all filters
  clearFilters(): void {
    this.filterText = '';
    this.selectedLogLevels = [];
    this.applyFilters();
  }

  // Get message text from data
  getMessageText(message: TopicMessage): string {
    if (!message.data) return '';

    if (typeof message.data === 'string') {
      return message.data;
    }

    // Handle different message formats based on ROS message structure
    // Use optional chaining and check for the 'message' property which is in the model
    if (message.data.message) {
      return message.data.message;
    }

    return JSON.stringify(message?.data?.msg);
  }

  // Get message severity class for styling
  getMessageSeverityClass(message: TopicMessage): string {
    if (!message.data) return '';

    const level = message.data.level || 0;

    // Common ROS log levels: DEBUG=1, INFO=2, WARN=4, ERROR=8, FATAL=16
    switch (level) {
      case 1:
        return 'text-gray-500'; // Debug
      case 2:
        return 'text-blue-600'; // Info
      case 4:
        return 'text-yellow-600'; // Warn
      case 8:
        return 'text-red-600'; // Error
      case 16:
        return 'text-purple-600 font-bold'; // Fatal
      default:
        return '';
    }
  }
}
