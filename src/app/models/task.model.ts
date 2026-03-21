export interface Task {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string;
  overdue: boolean;
  assigneeName: string;
  createdByName: string;
}

export interface TaskRequest {
  title: string;
  description: string;
  priority: string;
  dueDate: string;
  assigneeId: number;
}
