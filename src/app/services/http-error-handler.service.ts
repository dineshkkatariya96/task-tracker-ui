import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DEFAULT_ERROR_MESSAGE, ERROR_MESSAGES } from '../constants/error-messages';
import { UI_MESSAGES } from '../constants/ui-messages';

@Injectable({
  providedIn: 'root'
})
export class HttpErrorHandlerService {
  constructor(private snackBar: MatSnackBar) {}

  handleHttpError(error: HttpErrorResponse): void {
    if (error.status === 401) {
      this.logError(error, 'Unauthorized request intercepted');
      return;
    }

    const message = this.resolveMessage(error);
    this.logError(error, message);
    this.snackBar.dismiss();
    this.snackBar.open(message, UI_MESSAGES.common.closeAction, {
      duration: 4000,
      panelClass: ['error-snackbar']
    });
  }

  handleUnknownError(error: unknown): void {
    console.error('Unexpected HTTP pipeline error', error);
    this.snackBar.dismiss();
    this.snackBar.open(DEFAULT_ERROR_MESSAGE, UI_MESSAGES.common.closeAction, {
      duration: 4000,
      panelClass: ['error-snackbar']
    });
  }

  private resolveMessage(error: HttpErrorResponse): string {
    const backendMessage = this.extractBackendMessage(error);
    if (backendMessage) {
      return backendMessage;
    }

    return ERROR_MESSAGES[error.status] ?? DEFAULT_ERROR_MESSAGE;
  }

  private extractBackendMessage(error: HttpErrorResponse): string | null {
    if (typeof error.error === 'string' && error.error.trim()) {
      return error.error.trim();
    }

    if (error.error && typeof error.error === 'object') {
      const body = error.error as Record<string, unknown>;
      const message = body['message'];
      if (typeof message === 'string' && message.trim()) {
        return message.trim();
      }
    }

    return null;
  }

  private logError(error: HttpErrorResponse, message: string): void {
    console.error('HTTP error intercepted', {
      status: error.status,
      url: error.url,
      message,
      error: error.error
    });
  }
}
