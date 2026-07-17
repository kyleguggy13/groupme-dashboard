export interface RawGroupMeMessage {
  id?: string | number;
  user_id?: string | number;
  sender_id?: string | number;
  name?: string;
  created_at?: string | number;
  favorited_by?: unknown;
  reactions?: unknown;
  event?: unknown;
  [key: string]: unknown;
}

export interface SanitizedMessage {
  source_message_id: string;
  source_user_id: string;
  occurred_at: string;
  favorite_count: number;
  reaction_counts: Record<string, number>;
}

export interface SanitizedEvent {
  source_event_id: string;
  event_type: string;
  occurred_at: string;
  actor_source_user_id: string | null;
  display_value: string | null;
}

export interface DetectedMember {
  source_user_id: string;
  display_name: string;
  message_count: number;
}

export interface ImportPreview {
  rowCount: number;
  messageCount: number;
  eventCount: number;
  skippedCount: number;
  minDate: string | null;
  maxDate: string | null;
  members: DetectedMember[];
  warnings: string[];
}

export type ImportWorkerResponse =
  | { type: "progress"; progress: number; rows: number }
  | { type: "message-batch"; messages: SanitizedMessage[]; events: SanitizedEvent[] }
  | { type: "complete"; preview: ImportPreview }
  | { type: "error"; error: string };
