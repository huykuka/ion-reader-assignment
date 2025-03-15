import { Component, computed, effect, inject } from '@angular/core';
import { SharedModule } from '../../../shared/shared/shared.module';
import { Topic } from '../../../core/models/topic.model';
import { TopicService } from '../../../services/state/topic.service';
import { RobotStateService } from '../../../services';

@Component({
  selector: 'app-topic-dropdown',
  imports: [SharedModule],
  templateUrl: './topic-dropdown.component.html',
  styleUrl: './topic-dropdown.component.scss',
})
export class TopicDropdownComponent {
  topicService = inject(TopicService);
  robotStateService = inject(RobotStateService);
  currentTopic: Topic | null = null;

  // Computed values
  selectedTopic = computed(() => this.topicService.state().selectedTopic);
  topics = computed(() => this.topicService.state().topics);
  compressedTypes = computed(() => this.robotStateService.state().compressedTypes);

  constructor() {
    effect(() => {
      if (this.topics()) {
        this.topicService.setSelectedTopic(this.topics()![0]);
        this.currentTopic = this.topics()![0];
      }
    });
  }

  // Readable topics (filtering out binary/compressed topics)
  readableTopics = computed(() => {
    const topics = this.topicService.state().topics || [];
    return topics.filter((topic) => this.isHumanReadable(topic));
  });

  /**
   * Handle topic selection change
   */
  onTopicChange(topic: Topic): void {
    this.topicService.setSelectedTopic(topic);
  }

  /**
   * Check if a topic is human-readable
   * This is a simple implementation - you may need to adjust based on your actual data
   */
  private isHumanReadable(topic: Topic): boolean {
    // Check if topic has a type that indicates it's human-readable
    // This is a placeholder - adjust based on your actual topic types
    const nonReadableTypes = this.compressedTypes();
    return !nonReadableTypes.includes(topic.topicType || '');
  }
}
