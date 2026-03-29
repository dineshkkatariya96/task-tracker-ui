import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ActivityLogService } from '../services/activity-log.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');
  const router = inject(Router);
  const activityLogService = inject(ActivityLogService);

  let authReq = req;

  if (token) {
    authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        activityLogService.log('auth', 'Session expired or unauthorized request intercepted', {
          level: 'warn',
          status: 'failure',
          details: {
            url: req.urlWithParams
          }
        });
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('email');
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
