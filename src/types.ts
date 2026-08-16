export type PriorityLevel = 'critical' | 'high' | 'medium' | 'low' | 'needs_review';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export type MessageCategory =
  | 'vehicle_breakdown'
  | 'driver_issue'
  | 'pickup_issue'
  | 'delivery_delay'
  | 'delivery_issue'
  | 'vendor_issue'
  | 'customer_escalation'
  | 'reschedule_request'
  | 'operational_exception'
  | 'delivery_confirmation'
  | 'routine_update'
  | 'other';

export interface TriageMessageItem {
  id: string;
  original_message: string;
  priority: PriorityLevel;
  category: MessageCategory;
  confidence: ConfidenceLevel;
  reason: string;
  evidence: string[];
  recommended_action: string;
  missing_information?: string[];
  requires_action: boolean;
  draft_reply: string;
  edited_reply?: string;
  resolved?: boolean;
  order_index?: number;
  user_notes?: string;
}

export interface BatchSummary {
  total_messages: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  needs_review_count: number;
  resolved_count?: number;
}

export interface TriageBatch {
  id: string;
  created_at: string;
  processed_at: string;
  message_count: number;
  status: 'completed' | 'failed' | 'processing';
  summary: BatchSummary;
  title?: string;
}

export interface DBStoredMessage {
  id: string;
  batch_id: string;
  source?: string;
  original_message: string;
  created_at: string;
  order_index: number;
}

export interface DBStoredTriageResult extends TriageMessageItem {
  batch_id: string;
  message_id: string;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  batch_id: string;
  event: string;
  details: string;
  created_at: string;
}

export interface FilterState {
  priority: PriorityLevel | 'all';
  category: MessageCategory | 'all';
  confidence: ConfidenceLevel | 'all';
  status: 'all' | 'pending' | 'resolved';
  searchQuery: string;
}

export type SortMode = 'priority' | 'original_order' | 'confidence' | 'status';
