import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { ActivityLogService } from './services/activity-log.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnDestroy {
  title = 'task-tracker-ui';
  private readonly navigationSubscription: Subscription;
  private readonly onWindowError = (event: ErrorEvent) => {
    this.activityLogService.log('system', 'Unhandled application error', {
      level: 'error',
      status: 'failure',
      details: {
        message: event.message,
        path: event.filename,
        line: event.lineno,
        column: event.colno
      }
    });
  };
  private readonly onUnhandledRejection = (event: PromiseRejectionEvent) => {
    this.activityLogService.log('system', 'Unhandled promise rejection', {
      level: 'error',
      status: 'failure',
      details: {
        reason: this.describeReason(event.reason)
      }
    });
  };

  constructor(
    private router: Router,
    private activityLogService: ActivityLogService
  ) {
    this.activityLogService.log('system', 'Application started', {
      status: 'success',
      details: {
        path: window.location.pathname
      }
    });

    this.navigationSubscription = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.activityLogService.log('router', 'Route changed', {
          status: 'success',
          details: {
            path: event.urlAfterRedirects
          }
        });
      });

    window.addEventListener('error', this.onWindowError);
    window.addEventListener('unhandledrejection', this.onUnhandledRejection);
  }

  ngOnDestroy(): void {
    this.navigationSubscription.unsubscribe();
    window.removeEventListener('error', this.onWindowError);
    window.removeEventListener('unhandledrejection', this.onUnhandledRejection);
  }

  private describeReason(reason: unknown): string {
    if (typeof reason === 'string' && reason.trim()) {
      return reason.trim();
    }

    if (reason instanceof Error) {
      return reason.message;
    }

    return 'Unknown rejection reason';
  }
}
