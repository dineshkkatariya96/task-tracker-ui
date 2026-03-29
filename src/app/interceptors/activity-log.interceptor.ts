import {
  HttpErrorResponse,
  HttpEvent,
  HttpEventType,
  HttpInterceptorFn
} from '@angular/common/http';
import { inject } from '@angular/core';
import { tap } from 'rxjs';
import { LOG_SUCCESSFUL_READ_REQUEST } from './activity-log.tokens';
import { ActivityLogService } from '../services/activity-log.service';

export const activityLogInterceptor: HttpInterceptorFn = (req, next) => {
  const activityLogService = inject(ActivityLogService);
  const startedAt = performance.now();
  const shouldLogSuccess = req.method !== 'GET' || req.context.get(LOG_SUCCESSFUL_READ_REQUEST);

  return next(req).pipe(
    tap({
      next: (event: HttpEvent<unknown>) => {
        if (event.type !== HttpEventType.Response || !shouldLogSuccess) {
          return;
        }

        activityLogService.log('http', 'HTTP request completed', {
          status: 'success',
          details: {
            method: req.method,
            url: req.urlWithParams,
            responseStatus: event.status,
            durationMs: Math.round(performance.now() - startedAt),
            requestBody: req.body
          }
        });
      },
      error: (error: unknown) => {
        if (error instanceof HttpErrorResponse) {
          activityLogService.log('http', 'HTTP request failed', {
            level: 'error',
            status: 'failure',
            details: {
              method: req.method,
              url: req.urlWithParams,
              responseStatus: error.status,
              durationMs: Math.round(performance.now() - startedAt),
              requestBody: req.body,
              errorMessage: extractErrorMessage(error)
            }
          });
          return;
        }

        activityLogService.log('http', 'HTTP request failed', {
          level: 'error',
          status: 'failure',
          details: {
            method: req.method,
            url: req.urlWithParams,
            durationMs: Math.round(performance.now() - startedAt),
            requestBody: req.body,
            errorMessage: 'Unknown error'
          }
        });
      }
    })
  );
};

function extractErrorMessage(error: HttpErrorResponse): string {
  if (typeof error.error === 'string' && error.error.trim()) {
    return error.error.trim();
  }

  if (error.error && typeof error.error === 'object') {
    const body = error.error as Record<string, unknown>;
    const message = body['message'] ?? body['error'];
    if (typeof message === 'string' && message.trim()) {
      return message.trim();
    }
  }

  return error.message;
}
