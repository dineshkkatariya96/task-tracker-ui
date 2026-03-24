import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { User } from '../../../models/user.model';
import { UI_MESSAGES } from '../../../constants/ui-messages';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule
  ],
  templateUrl: './task-form.component.html',
  styleUrls: ['./task-form.component.scss']
})
export class TaskFormComponent implements OnInit {

  task = {
    title: '',
    description: '',
    priority: 'MEDIUM',
    dueDate: '',
    assigneeId: null as number | null
  };

  employees: User[] = [];
  isEdit = false;
  priorities = ['LOW', 'MEDIUM', 'HIGH'];

  constructor(
    public dialogRef: MatDialogRef<TaskFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit() {
    this.employees = this.data.employees || [];
    if (this.data.task) {
      this.isEdit = true;
      this.task = {
        title: this.data.task.title,
        description: this.data.task.description,
        priority: this.data.task.priority,
        dueDate: this.data.task.dueDate,
        assigneeId: null
      };
    }
  }

  save() {
    if (!this.task.title) {
      alert(UI_MESSAGES.taskForm.titleRequired);
      return;
    }
    if (!this.task.priority) {
      alert(UI_MESSAGES.taskForm.priorityRequired);
      return;
    }
    if (!this.task.dueDate) {
      alert(UI_MESSAGES.taskForm.dueDateRequired);
      return;
    }
    if (!this.task.assigneeId && !this.isEdit) {
      alert(UI_MESSAGES.taskForm.assigneeRequired);
      return;
    }

    const taskData = {
      title: this.task.title,
      description: this.task.description,
      priority: this.task.priority,
      dueDate: this.task.dueDate,
      assigneeId: this.task.assigneeId ? Number(this.task.assigneeId) : null
    };
    this.dialogRef.close(taskData);
  }

  cancel() {
    this.dialogRef.close();
  }
}
