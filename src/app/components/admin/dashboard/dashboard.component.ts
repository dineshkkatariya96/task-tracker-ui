import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { interval, Subscription } from 'rxjs';
import { TaskService } from '../../../services/task.service';
import { UserService } from '../../../services/user.service';
import { AuthService } from '../../../services/auth.service';
import { Task } from '../../../models/task.model';
import { User } from '../../../models/user.model';
import { TaskHistoryComponent } from '../../shared/task-history/task-history.component';
import { UI_MESSAGES } from '../../../constants/ui-messages';
import { ActivityLogService } from '../../../services/activity-log.service';
import { TaskFormComponent } from '../task-form/task-form.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatDialogModule,
    MatSnackBarModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatToolbarModule,
    MatTooltipModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  readonly UI_MESSAGES = UI_MESSAGES;

  tasks: Task[] = [];
  filteredTasks: Task[] = [];
  overdueTasks: Task[] = [];
  employees: User[] = [];
  displayedColumns = ['title', 'assignee', 'priority', 'status', 'dueDate', 'actions'];
  activeTab = 'all';
  lastRefreshed: Date = new Date();

  selectedEmployeeId: number | null = null;
  selectedPriority: string | null = null;
  selectedStatus: string | null = null;
  selectedDueDate: string | null = null;

  priorities = ['HIGH', 'MEDIUM', 'LOW'];
  statuses = ['OPEN', 'IN_PROGRESS', 'DONE', 'OVERDUE'];

  private refreshSubscription!: Subscription;

  constructor(
    private taskService: TaskService,
    private userService: UserService,
    private authService: AuthService,
    private activityLogService: ActivityLogService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const token = localStorage.getItem('token');
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    this.activityLogService.log('task', 'Admin dashboard loaded', {
      status: 'success'
    });

    this.loadTasks();
    this.loadEmployees();
    this.loadOverdueTasks();

    this.refreshSubscription = interval(10000).subscribe(() => {
      this.loadTasks();
      this.loadOverdueTasks();
      this.lastRefreshed = new Date();
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy() {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  loadTasks() {
    this.taskService.getAllTasks().subscribe({
      next: (tasks) => {
        this.tasks = tasks;
        this.applyFilters();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading tasks:', err);
        if (err.status === 401) {
          this.router.navigate(['/login']);
        }
      }
    });
  }

  loadOverdueTasks() {
    this.taskService.getOverdueTasks().subscribe({
      next: (tasks) => {
        this.overdueTasks = tasks;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading overdue tasks:', err)
    });
  }

  loadEmployees() {
    this.userService.getEmployeesOnly().subscribe({
      next: (users) => {
        this.employees = users;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading employees:', err)
    });
  }

  applyFilters() {
    let result = [...this.tasks];

    if (this.selectedEmployeeId !== null) {
      const selectedEmployee = this.employees.find(
        e => e.id === Number(this.selectedEmployeeId)
      );
      result = result.filter(
        task => task.assigneeName === selectedEmployee?.name
      );
    }

    if (this.selectedPriority !== null) {
      result = result.filter(task => task.priority === this.selectedPriority);
    }

    if (this.selectedStatus !== null) {
      result = result.filter(task => task.status === this.selectedStatus);
    }

    if (this.selectedDueDate !== null && this.selectedDueDate !== '') {
      result = result.filter(task => task.dueDate === this.selectedDueDate);
    }

    this.filteredTasks = result;
    this.cdr.detectChanges();
  }

  onFiltersChanged() {
    this.applyFilters();
    this.activityLogService.log('task', 'Admin task filters updated', {
      status: 'success',
      details: {
        employeeId: this.selectedEmployeeId,
        priority: this.selectedPriority,
        statusFilter: this.selectedStatus,
        dueDate: this.selectedDueDate,
        resultCount: this.filteredTasks.length
      }
    });
  }

  clearFilters() {
    this.selectedEmployeeId = null;
    this.selectedPriority = null;
    this.selectedStatus = null;
    this.selectedDueDate = null;
    this.filteredTasks = [...this.tasks];
    this.activityLogService.log('task', 'Admin task filters cleared', {
      status: 'success'
    });
    this.cdr.detectChanges();
  }

  get activeFiltersCount(): number {
    let count = 0;
    if (this.selectedEmployeeId !== null) count++;
    if (this.selectedPriority !== null) count++;
    if (this.selectedStatus !== null) count++;
    if (this.selectedDueDate !== null && this.selectedDueDate !== '') count++;
    return count;
  }

  openCreateTask() {
    this.activityLogService.log('task', 'Create task dialog opened', {
      status: 'success'
    });

    const dialogRef = this.dialog.open(TaskFormComponent, {
      width: '500px',
      data: { employees: this.employees }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.activityLogService.log('task', 'Create task submitted', {
          status: 'started',
          details: result
        });
        this.taskService.createTask(result).subscribe({
          next: () => {
            this.loadTasks();
            this.snackBar.open(
              UI_MESSAGES.adminDashboard.createTaskSuccess,
              UI_MESSAGES.common.closeAction,
              { duration: 3000, panelClass: ['success-snackbar'] }
            );
          },
          error: (err) => {
            this.snackBar.open(
              err.error?.error || UI_MESSAGES.adminDashboard.createTaskError,
              UI_MESSAGES.common.closeAction,
              { duration: 4000, panelClass: ['error-snackbar'] }
            );
          }
        });
        return;
      }

      this.activityLogService.log('task', 'Create task dialog closed without saving', {
        level: 'warn',
        status: 'failure'
      });
    });
  }

  openEditTask(task: Task) {
    this.activityLogService.log('task', 'Edit task dialog opened', {
      status: 'success',
      details: {
        taskId: task.id,
        priority: task.priority,
        statusValue: task.status,
        dueDate: task.dueDate
      }
    });

    const dialogRef = this.dialog.open(TaskFormComponent, {
      width: '500px',
      data: { task, employees: this.employees }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.activityLogService.log('task', 'Edit task submitted', {
          status: 'started',
          details: {
            taskId: task.id,
            ...result
          }
        });
        this.taskService.updateTask(task.id, result).subscribe({
          next: () => {
            this.loadTasks();
            this.snackBar.open(
              UI_MESSAGES.adminDashboard.updateTaskSuccess,
              UI_MESSAGES.common.closeAction,
              { duration: 3000, panelClass: ['success-snackbar'] }
            );
          },
          error: (err) => {
            this.snackBar.open(
              err.error?.error || UI_MESSAGES.adminDashboard.updateTaskError,
              UI_MESSAGES.common.closeAction,
              { duration: 4000, panelClass: ['error-snackbar'] }
            );
          }
        });
        return;
      }

      this.activityLogService.log('task', 'Edit task dialog closed without saving', {
        level: 'warn',
        status: 'failure',
        details: {
          taskId: task.id
        }
      });
    });
  }

  deleteTask(id: number) {
    if (confirm(UI_MESSAGES.adminDashboard.deleteTaskConfirm)) {
      this.activityLogService.log('task', 'Task deletion confirmed', {
        status: 'started',
        details: {
          taskId: id
        }
      });
      this.taskService.deleteTask(id).subscribe({
        next: () => {
          this.loadTasks();
          this.snackBar.open(
            UI_MESSAGES.adminDashboard.deleteTaskSuccess,
            UI_MESSAGES.common.closeAction,
            { duration: 3000, panelClass: ['success-snackbar'] }
          );
        },
        error: () => {
          this.snackBar.open(
            UI_MESSAGES.adminDashboard.deleteTaskError,
            UI_MESSAGES.common.closeAction,
            { duration: 3000, panelClass: ['error-snackbar'] }
          );
        }
      });
      return;
    }

    this.activityLogService.log('task', 'Task deletion cancelled', {
      level: 'warn',
      status: 'failure',
      details: {
        taskId: id
      }
    });
  }

  openTaskHistory(task: Task) {
    this.activityLogService.log('task', 'Task history opened', {
      status: 'success',
      details: {
        taskId: task.id,
        statusValue: task.status
      }
    });

    this.dialog.open(TaskHistoryComponent, {
      width: '720px',
      maxWidth: '95vw',
      data: { taskId: task.id }
    });
  }

  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'HIGH': return 'warn';
      case 'MEDIUM': return 'accent';
      case 'LOW': return 'primary';
      default: return '';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'DONE': return 'primary';
      case 'IN_PROGRESS': return 'accent';
      case 'OVERDUE': return 'warn';
      default: return '';
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  showAllTasksTab() {
    this.activeTab = 'all';
    this.activityLogService.log('task', 'Admin switched to all tasks tab', {
      status: 'success'
    });
    this.loadTasks();
  }

  showOverdueTasksTab() {
    this.activeTab = 'overdue';
    this.activityLogService.log('task', 'Admin switched to overdue tasks tab', {
      status: 'success'
    });
    this.loadOverdueTasks();
  }

  get currentTasks(): Task[] {
    return this.activeTab === 'overdue' ? this.overdueTasks : this.filteredTasks;
  }
}
