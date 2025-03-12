import { Component, inject } from '@angular/core';
import { SharedModule } from '../../../shared/shared/shared.module';
import { TopicService } from '../../../services/topic.service';

@Component({
  selector: 'app-topic-dropdown',
  imports: [SharedModule],
  templateUrl: './topic-dropdown.component.html',
  styleUrl: './topic-dropdown.component.scss',
})
export class TopicDropdownComponent {
  topicService = inject(TopicService);
}
