export type ActivityLogLevel = 'info' | 'warn' | 'error';
export type ActivityLogStatus = 'info' | 'success' | 'failure' | 'started';
export type ActivityLogSource = 'auth' | 'task' | 'user' | 'http' | 'router' | 'system';

export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  date: string;
  sessionId: string;
  actor: string;
  role: string | null;
  source: ActivityLogSource;
  action: string;
  level: ActivityLogLevel;
  status: ActivityLogStatus;
  details?: Record<string, unknown>;
}

export interface ActivityLogOptions {
  level?: ActivityLogLevel;
  status?: ActivityLogStatus;
  actor?: string | null;
  details?: unknown;
}
