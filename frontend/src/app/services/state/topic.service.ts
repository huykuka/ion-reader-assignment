import { Injectable } from '@angular/core';
import { Topic } from '../../core/models/topic.model';
import { SignalsSimpleStoreService } from '../../core/services';

interface TopicState {
  topics: Topic[] | null;
  selectedTopic: Topic | null;
}

@Injectable({
  providedIn: 'root',
})
export class TopicService extends SignalsSimpleStoreService<TopicState> {
  constructor() {
    super();
  }

  setTopics(topics: Topic[]) {
    this.setState({
      ...this.state,
      topics,
    });
  }

  setSelectedTopic(topic: Topic | null) {
    this.setState({
      ...this.state,
      selectedTopic: topic,
    });
  }
}
