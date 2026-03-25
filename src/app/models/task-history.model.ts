export interface TaskHistoryEntry {
  action: string;
  oldValue: string | null;
  newValue: string | null;
  performedBy: string;
  timestamp: string;
}
