export interface Topic {
  topicName?: string;
  topicType?: string;
  frequency?: number;
  messages: TopicMessage[];
}

export interface TopicMessage {
  data?: any;
  timestamp?: number;
}
