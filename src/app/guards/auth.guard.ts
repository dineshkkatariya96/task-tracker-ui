import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ActivityLogService } from '../services/activity-log.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const activityLogService = inject(ActivityLogService);

  if (authService.isLoggedIn()) {
    return true;
  }

  activityLogService.log('auth', 'Protected route access denied', {
    level: 'warn',
    status: 'failure',
    details: {
      path: state.url
    }
  });
  router.navigate(['/login']);
  return false;
};
