import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { TaskService } from '../../../services/task.service';
import { UserService } from '../../../services/user.service';
import { AuthService } from '../../../services/auth.service';
import { Task } from '../../../models/task.model';
import { User } from '../../../models/user.model';
import { TaskFormComponent } from '../task-form/task-form.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
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
    TaskFormComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  tasks: Task[] = [];
  filteredTasks: Task[] = [];
  overdueTasks: Task[] = [];
  employees: User[] = [];
  displayedColumns = ['title', 'assignee', 'priority', 'status', 'dueDate', 'actions'];
  activeTab = 'all';
  selectedEmployeeId: number | null = null;

  constructor(
    private taskService: TaskService,
    private userService: UserService,
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
    this.loadTasks();
    this.loadEmployees();
    this.loadOverdueTasks();
  }

  loadTasks() {
    this.taskService.getAllTasks().subscribe({
      next: (tasks) => {
        this.tasks = tasks;
        this.filteredTasks = tasks;
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
      error: (err) => {
        console.error('Error loading overdue tasks:', err);
      }
    });
  }

  loadEmployees() {
    this.userService.getEmployeesOnly().subscribe({
      next: (users) => {
        this.employees = users;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading employees:', err);
      }
    });
  }

filterByEmployee() {
  console.log('Selected employee ID:', this.selectedEmployeeId);
  console.log('All tasks:', this.tasks);

  if (this.selectedEmployeeId === null) {
    this.filteredTasks = [...this.tasks];
  } else {
    const selectedEmployee = this.employees.find(
      e => e.id === Number(this.selectedEmployeeId)
    );
    console.log('Selected employee:', selectedEmployee);

    this.filteredTasks = this.tasks.filter(task => {
      console.log('Task assigneeName:', task.assigneeName,
                  'Employee name:', selectedEmployee?.name);
      return task.assigneeName === selectedEmployee?.name;
    });
  }

  console.log('Filtered tasks:', this.filteredTasks);
  this.cdr.detectChanges();
}

  openCreateTask() {
    const dialogRef = this.dialog.open(TaskFormComponent, {
      width: '500px',
      data: { employees: this.employees }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.taskService.createTask(result).subscribe({
          next: () => {
            this.loadTasks();
            this.snackBar.open('Task created successfully!', 'Close', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
          },
          error: (err) => {
            this.snackBar.open(
              err.error?.error || 'Failed to create task!',
              'Close',
              { duration: 4000, panelClass: ['error-snackbar'] }
            );
          }
        });
      }
    });
  }

  openEditTask(task: Task) {
    const dialogRef = this.dialog.open(TaskFormComponent, {
      width: '500px',
      data: { task, employees: this.employees }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.taskService.updateTask(task.id, result).subscribe({
          next: () => {
            this.loadTasks();
            this.snackBar.open('Task updated successfully!', 'Close', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
          },
          error: (err) => {
            this.snackBar.open(
              err.error?.error || 'Failed to update task!',
              'Close',
              { duration: 4000, panelClass: ['error-snackbar'] }
            );
          }
        });
      }
    });
  }

deleteTask(id: number) {
  if (confirm('Are you sure you want to delete this task?')) {
    this.taskService.deleteTask(id).subscribe({
      next: () => {
        this.loadTasks();
        this.snackBar.open('Task deleted successfully!', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      },
      error: () => {
        this.snackBar.open('Failed to delete task!', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }
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
    return this.activeTab === 'overdue' ? this.overdueTasks : this.filteredTasks;
  }
}
