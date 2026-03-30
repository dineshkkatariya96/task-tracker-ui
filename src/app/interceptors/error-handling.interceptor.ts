import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { EMPTY, catchError } from 'rxjs';
import { HttpErrorHandlerService } from '../services/http-error-handler.service';

export const errorHandlingInterceptor: HttpInterceptorFn = (req, next) => {
  const httpErrorHandlerService = inject(HttpErrorHandlerService);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        httpErrorHandlerService.handleHttpError(error);
      } else {
        httpErrorHandlerService.handleUnknownError(error);
      }

      return EMPTY;
    })
  );
};
