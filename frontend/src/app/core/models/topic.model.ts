export interface Topic {
  topicName?: string;
  topicType?: string;
  frequency?: number;
  messages: TopicMessage[];
}

export interface TopicMessage {
  data?: {
    arguments?: any;
    level?: number;
    message?: string;
    state_id: any;
  };
  timestamp?: number;
}
