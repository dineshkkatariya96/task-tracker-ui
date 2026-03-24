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
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { TaskService } from '../../../services/task.service';
import { UserService } from '../../../services/user.service';
import { AuthService } from '../../../services/auth.service';
import { Task } from '../../../models/task.model';
import { User } from '../../../models/user.model';
import { TaskFormComponent } from '../task-form/task-form.component';
import { UI_MESSAGES } from '../../../constants/ui-messages';

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
    MatTooltipModule,
    MatDatepickerModule,
    MatNativeDateModule,
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
  selectedPriority: string | null = null;
  selectedStatus: string | null = null;
  selectedDueDate: string | null = null;

  priorities = ['HIGH', 'MEDIUM', 'LOW'];
  statuses = ['OPEN', 'IN_PROGRESS', 'DONE', 'OVERDUE'];

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

  clearFilters() {
    this.selectedEmployeeId = null;
    this.selectedPriority = null;
    this.selectedStatus = null;
    this.selectedDueDate = null;
    this.filteredTasks = [...this.tasks];
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
    const dialogRef = this.dialog.open(TaskFormComponent, {
      width: '500px',
      data: { employees: this.employees }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.taskService.createTask(result).subscribe({
          next: () => {
            this.loadTasks();
            this.snackBar.open(UI_MESSAGES.adminDashboard.createTaskSuccess, UI_MESSAGES.common.closeAction, {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
          },
          error: (err) => {
            this.snackBar.open(
              err.error?.error || UI_MESSAGES.adminDashboard.createTaskError,
              UI_MESSAGES.common.closeAction,
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
            this.snackBar.open(UI_MESSAGES.adminDashboard.updateTaskSuccess, UI_MESSAGES.common.closeAction, {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
          },
          error: (err) => {
            this.snackBar.open(
              err.error?.error || UI_MESSAGES.adminDashboard.updateTaskError,
              UI_MESSAGES.common.closeAction,
              { duration: 4000, panelClass: ['error-snackbar'] }
            );
          }
        });
      }
    });
  }

  deleteTask(id: number) {
    if (confirm(UI_MESSAGES.adminDashboard.deleteTaskConfirm)) {
      this.taskService.deleteTask(id).subscribe({
        next: () => {
          this.loadTasks();
          this.snackBar.open(UI_MESSAGES.adminDashboard.deleteTaskSuccess, UI_MESSAGES.common.closeAction, {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
        },
        error: () => {
          this.snackBar.open(UI_MESSAGES.adminDashboard.deleteTaskError, UI_MESSAGES.common.closeAction, {
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
