export const UI_MESSAGES = {
  common: {
    closeAction: 'Close'
  },
  adminDashboard: {
    createTaskSuccess: 'Task created successfully!',
    createTaskError: 'Failed to create task!',
    updateTaskSuccess: 'Task updated successfully!',
    updateTaskError: 'Failed to update task!',
    deleteTaskConfirm: 'Are you sure you want to delete this task?',
    deleteTaskSuccess: 'Task deleted successfully!',
    deleteTaskError: 'Failed to delete task!'
  },
  taskForm: {
    titleRequired: 'Title is required!',
    priorityRequired: 'Priority is required!',
    dueDateRequired: 'Due date is required!',
    assigneeRequired: 'Please assign this task to an employee!'
  },
  employeeDashboard: {
    statusUpdated: 'Status updated!'
  },
  taskHistory: {
    title: 'Task History',
    viewTooltip: 'View task history',
    loading: 'Loading task history...',
    empty: 'No history available for this task yet.',
    loadError: 'Failed to load task history.',
    unknownValue: '-'
  },
  login: {
    credentialsRequired: 'Please enter email and password!',
    invalidCredentials: 'Invalid email or password!'
  },
  register: {
    allFieldsRequired: 'All fields are required!',
    passwordsDoNotMatch: 'Passwords do not match!',
    passwordTooShort: 'Password must be at least 6 characters!',
    registrationSuccess: 'Registration successful! Please login.',
    registrationError: 'Registration failed. Try again.'
  }
} as const;
