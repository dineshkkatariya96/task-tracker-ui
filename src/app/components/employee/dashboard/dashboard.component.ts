import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../../services/task.service';
import { AuthService } from '../../../services/auth.service';
import { Task } from '../../../models/task.model';

@Component({
  selector: 'app-employee-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatToolbarModule,
    MatSelectModule,
    MatFormFieldModule,
    MatSnackBarModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  myTasks: Task[] = [];
  overdueTasks: Task[] = [];
  activeTab = 'my';
  statuses = ['OPEN', 'IN_PROGRESS', 'DONE'];

  constructor(
    private taskService: TaskService,
    private authService: AuthService,
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
        console.error('Error loading overdue tasks:', err);
      }
    });
  }

  updateStatus(task: Task, newStatus: string) {
    this.taskService.updateStatus(task.id, newStatus).subscribe({
      next: () => {
        task.status = newStatus;
        this.cdr.detectChanges();
        this.snackBar.open('Status updated!', 'Close', { duration: 3000 });
      },
      error: (err) => {
        console.error('Error updating status:', err);
      }
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

  get currentTasks(): Task[] {
    return this.activeTab === 'overdue' ? this.overdueTasks : this.myTasks;
  }

  get completedTasksCount(): number {
    return this.myTasks.filter(t => t.status === 'DONE').length;
  }

  get email(): string {
    return this.authService.getEmail() || '';
  }
}
