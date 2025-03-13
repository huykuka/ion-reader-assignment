import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../shared/shared/shared.module';
import { TopicService } from '../../../services/state/topic.service';

@Component({
  selector: 'app-topic-message-viewer',
  standalone: true,
  imports: [CommonModule, SharedModule],
  templateUrl: './topic-message-viewer.component.html',
  styleUrls: ['./topic-message-viewer.component.scss'],
})
export class TopicMessageViewerComponent {
  topicService = inject(TopicService);

  // Computed values
  selectedTopic = computed(() => this.topicService.state().selectedTopic);
}
