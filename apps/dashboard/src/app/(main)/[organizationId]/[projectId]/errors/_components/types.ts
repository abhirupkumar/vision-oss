export interface RecentError {
  id: string;
  project_id: string;
  visitor_id: string;
  session_id: string;
  error_type: string;
  message: string;
  filename?: string;
  lineno?: number;
  colno?: number;
  stack?: string;
  fingerprint: string;
  url_path: string;
  hostname: string;
  browser?: string;
  os?: string;
  device?: string;
  country?: string;
  level: string;
  created_at: string;
}

export interface ErrorType {
  name: string;
  count: number;
  users: number;
  last_seen: string;
}

export interface ErrorByPage {
  name: string;
  errors: number;
  users: number;
}

export interface ErrorSummary {
  totalErrors: number;
  uniqueErrorTypes: number;
  affectedUsers: number;
  affectedSessions: number;
  errorRate: number;
}

export interface ErrorChartData {
  date: string;
  totalErrors: number;
  affectedUsers: number;
}
