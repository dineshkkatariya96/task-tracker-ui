import { CommonModule, DatePipe } from '@angular/common';
import { Component, Inject, Input, OnChanges, OnInit, Optional, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs';
import { TaskHistoryEntry } from '../../../models/task-history.model';
import { TaskService } from '../../../services/task.service';
import { UI_MESSAGES } from '../../../constants/ui-messages';
import { ActivityLogService } from '../../../services/activity-log.service';

interface TaskHistoryDialogData {
  taskId: number;
}

@Component({
  selector: 'app-task-history',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    MatButtonModule,
    MatDialogModule,
    MatCardModule,
    MatIconModule,
    MatListModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './task-history.component.html',
  styleUrls: ['./task-history.component.scss']
})
export class TaskHistoryComponent implements OnInit, OnChanges {
  @Input() taskId: number | null = null;

  history: TaskHistoryEntry[] = [];
  loading = false;
  errorMessage = '';
  readonly UI_MESSAGES = UI_MESSAGES;
  readonly messages = UI_MESSAGES.taskHistory;
  resolvedTaskId: number | null = null;

  constructor(
    private taskService: TaskService,
    private activityLogService: ActivityLogService,
    private cdr: ChangeDetectorRef,
    @Optional() @Inject(MAT_DIALOG_DATA) private data: TaskHistoryDialogData | null,
    @Optional() public dialogRef: MatDialogRef<TaskHistoryComponent> | null
  ) {}

  ngOnInit(): void {
    this.loadHistory(this.taskId ?? this.data?.taskId ?? null);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ('taskId' in changes && !changes['taskId'].firstChange) {
      this.loadHistory(this.taskId);
    }
  }

  formatValue(value: string | null): string {
    return value?.trim() ? value : this.messages.unknownValue;
  }

  private normalizeHistory(response: unknown): TaskHistoryEntry[] {
    const rawEntries = this.extractHistoryEntries(response);

    return rawEntries.map((entry) => {
      const item = entry as Record<string, unknown>;
      return {
        action: this.readString(item, ['action', 'actionType', 'type']),
        oldValue: this.readNullableString(item, ['oldValue', 'previousValue', 'fromValue', 'oldStatus']),
        newValue: this.readNullableString(item, ['newValue', 'currentValue', 'toValue', 'newStatus']),
        performedBy: this.readString(item, ['performedBy', 'performedByName', 'changedBy', 'actor', 'userName']),
        timestamp: this.readString(item, ['timestamp', 'createdAt', 'changedAt', 'performedAt', 'actionAt'])
      };
    });
  }

  private extractHistoryEntries(response: unknown): unknown[] {
    if (Array.isArray(response)) {
      return response;
    }

    if (response && typeof response === 'object') {
      const body = response as Record<string, unknown>;
      const candidates = [body['history'], body['data'], body['content'], body['items']];

      for (const candidate of candidates) {
        if (Array.isArray(candidate)) {
          return candidate;
        }
      }
    }

    return [];
  }

  private readString(source: Record<string, unknown>, keys: string[]): string {
    for (const key of keys) {
      const value = source[key];
      if (typeof value === 'string' && value.trim()) {
        return value;
      }
    }

    return this.messages.unknownValue;
  }

  private readNullableString(source: Record<string, unknown>, keys: string[]): string | null {
    for (const key of keys) {
      const value = source[key];
      if (typeof value === 'string') {
        return value;
      }
      if (value !== null && value !== undefined) {
        return String(value);
      }
    }

    return null;
  }

  private loadHistory(taskId: number | null): void {
    this.resolvedTaskId = taskId;

    if (taskId === null) {
      this.activityLogService.log('task', 'Task history requested without task id', {
        level: 'error',
        status: 'failure'
      });
      this.history = [];
      this.loading = false;
      this.errorMessage = this.messages.loadError;
      this.cdr.detectChanges();
      return;
    }

    this.activityLogService.log('task', 'Task history loading started', {
      status: 'started',
      details: {
        taskId
      }
    });
    this.loading = true;
    this.errorMessage = '';
    this.history = [];

    this.taskService.getTaskHistory(taskId)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
      next: (history) => {
        this.history = this.normalizeHistory(history);
        this.activityLogService.log('task', 'Task history loaded', {
          status: 'success',
          details: {
            taskId,
            entryCount: this.history.length
          }
        });
      },
      error: () => {
        this.history = [];
        this.errorMessage = this.messages.loadError;
        this.activityLogService.log('task', 'Task history load failed', {
          level: 'error',
          status: 'failure',
          details: {
            taskId
          }
        });
      }
    });
  }
}
