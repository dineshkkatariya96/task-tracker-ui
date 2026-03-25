import { UI_MESSAGES } from './ui-messages';

export const TASK_STATUSES = ['OPEN', 'IN_PROGRESS', 'DONE', 'OVERDUE'] as const;

export const MESSAGES = {
  TASK: {
    STATUS_UPDATED: UI_MESSAGES.employeeDashboard.statusUpdated,
    STATUS_UPDATE_FAILED: 'Failed to update status!'
  }
} as const;
