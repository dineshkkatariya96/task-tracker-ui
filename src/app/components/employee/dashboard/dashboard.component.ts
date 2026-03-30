import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { interval, Subscription } from 'rxjs';
import { TaskService } from '../../../services/task.service';
import { AuthService } from '../../../services/auth.service';
import { Task } from '../../../models/task.model';
import { TaskHistoryComponent } from '../../shared/task-history/task-history.component';
import { UI_MESSAGES } from '../../../constants/ui-messages';
import { MESSAGES, TASK_STATUSES } from '../../../constants/app.constants';
import { ActivityLogService } from '../../../services/activity-log.service';

@Component({
  selector: 'app-employee-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDialogModule,
    MatToolbarModule,
    MatSelectModule,
    MatFormFieldModule,
    MatSnackBarModule,
    MatTooltipModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  readonly UI_MESSAGES = UI_MESSAGES;

  myTasks: Task[] = [];
  overdueTasks: Task[] = [];
  activeTab = 'my';
  statuses = TASK_STATUSES.filter(s => s !== 'OVERDUE');
  private refreshSubscription!: Subscription;
  lastRefreshed: Date = new Date();

  constructor(
    private taskService: TaskService,
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

    this.activityLogService.log('task', 'Employee dashboard loaded', {
      status: 'success'
    });

    this.loadMyTasks();

    this.refreshSubscription = interval(10000).subscribe(() => {
      this.loadMyTasks();
      this.lastRefreshed = new Date();
    });
  }

  ngOnDestroy() {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  loadMyTasks() {
    this.taskService.getMyTasks().subscribe((tasks) => {
      this.myTasks = tasks;
      this.overdueTasks = tasks.filter((task) => task.overdue || task.status === 'OVERDUE');
      this.cdr.detectChanges();
    });
  }

  loadOverdueTasks() {
    this.loadMyTasks();
  }

  updateStatus(task: Task, newStatus: string) {
    if (task.status === newStatus) {
      this.activityLogService.log('task', 'Task status update skipped', {
        level: 'warn',
        status: 'failure',
        details: {
          taskId: task.id,
          statusValue: newStatus
        }
      });
      return;
    }

    this.activityLogService.log('task', 'Task status update submitted', {
      status: 'started',
      details: {
        taskId: task.id,
        previousStatus: task.status,
        newStatus
      }
    });

    this.taskService.updateStatus(task.id, newStatus).subscribe({
      next: () => {
        task.status = newStatus;
        task.overdue = newStatus === 'OVERDUE';
        this.overdueTasks = this.myTasks.filter((item) => item.overdue || item.status === 'OVERDUE');
        this.loadMyTasks();
        this.cdr.detectChanges();
        this.snackBar.open(MESSAGES.TASK.STATUS_UPDATED, 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
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

  showMyTasksTab() {
    this.activeTab = 'my';
    this.activityLogService.log('task', 'Employee switched to my tasks tab', {
      status: 'success'
    });
    this.loadMyTasks();
  }

  showOverdueTasksTab() {
    this.activeTab = 'overdue';
    this.activityLogService.log('task', 'Employee switched to overdue tasks tab', {
      status: 'success'
    });
    this.loadOverdueTasks();
  }

  get completedTasksCount(): number {
    return this.myTasks.filter(t => t.status === 'DONE').length;
  }

  get email(): string {
    return this.authService.getEmail() || '';
  }
}
