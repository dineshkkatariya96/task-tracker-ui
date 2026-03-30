import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { routes } from './app.routes';
import { errorHandlingInterceptor } from './interceptors/error-handling.interceptor';
import { authInterceptor } from './interceptors/auth.interceptor';
import { activityLogInterceptor } from './interceptors/activity-log.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimationsAsync(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([errorHandlingInterceptor, authInterceptor, activityLogInterceptor]))
  ]
};
