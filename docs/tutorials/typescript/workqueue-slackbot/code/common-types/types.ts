export interface WorkqueueData {
  id: string;
  timestamp: string;
  channelName: string;
  channelId: string;
  userId: string;
  work: string;
  messageLink: string;
  status: WorkqueueStatus;
  claimantId?: string;
  // Add more properties as needed
}

export enum WorkqueueStatus {
  Backlog = 1,
  InProgress = 2,
  Done = 3,
}

export interface SlackCommandMessage {
  text: string;
  user: string;
  channel: string;
  response_url: string;
}
