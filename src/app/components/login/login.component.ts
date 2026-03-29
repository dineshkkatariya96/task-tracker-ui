import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';
import { ActivityLogService } from '../../services/activity-log.service';
import { UI_MESSAGES } from '../../constants/ui-messages';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSnackBarModule,
    MatIconModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {

  email = '';
  password = '';
  loading = false;

  constructor(
    private authService: AuthService,
    private activityLogService: ActivityLogService,
    private router: Router,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  login() {
    if (!this.email || !this.password) {
      this.activityLogService.log('auth', 'Login validation failed', {
        level: 'warn',
        status: 'failure',
        details: {
          email: this.email,
          reason: 'Missing email or password'
        }
      });
      this.snackBar.open(UI_MESSAGES.login.credentialsRequired, UI_MESSAGES.common.closeAction, {
        duration: 3000
      });
      return;
    }

    this.loading = true;
    this.cdr.detectChanges();
    this.activityLogService.log('auth', 'Login submitted', {
      status: 'started',
      details: {
        email: this.email
      }
    });

    this.authService.login({ email: this.email, password: this.password })
      .subscribe({
        next: (response) => {
          this.loading = false;
          this.cdr.detectChanges();
          if (response.role === 'ADMIN') {
            this.router.navigate(['/admin']);
          } else {
            this.router.navigate(['/employee']);
          }
        },
        error: (error) => {
          this.loading = false;
          this.cdr.detectChanges();
          this.activityLogService.log('auth', 'Login failed', {
            level: 'error',
            status: 'failure',
            details: {
              email: this.email,
              responseStatus: error.status
            }
          });
          this.snackBar.open(UI_MESSAGES.login.invalidCredentials, UI_MESSAGES.common.closeAction, {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  goToRegister() {
    this.activityLogService.log('auth', 'Registration screen requested', {
      status: 'success'
    });
    this.router.navigate(['/register']);
  }
}
