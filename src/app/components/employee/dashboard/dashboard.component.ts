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
    this.loadMyTasks();
    this.loadOverdueTasks();

    this.refreshSubscription = interval(10000).subscribe(() => {
      this.loadMyTasks();
      this.loadOverdueTasks();
      this.lastRefreshed = new Date();
    });
  }

  ngOnDestroy() {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  loadMyTasks() {
    this.taskService.getMyTasks().subscribe({
      next: (tasks) => {
        this.myTasks = tasks;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading my tasks:', err);
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
      error: (err) => {
        console.error('Error loading overdue tasks:', err)
      }
    });
  }

  updateStatus(task: Task, newStatus: string) {
    this.taskService.updateStatus(task.id, newStatus).subscribe({
      next: () => {
        task.status = newStatus;
        this.cdr.detectChanges();
        this.snackBar.open(MESSAGES.TASK.STATUS_UPDATED, 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      },
      error: () => {
        this.snackBar.open(MESSAGES.TASK.STATUS_UPDATE_FAILED, 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  openTaskHistory(task: Task) {
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

  get completedTasksCount(): number {
    return this.myTasks.filter(t => t.status === 'DONE').length;
  }

  get email(): string {
    return this.authService.getEmail() || '';
  }
}
