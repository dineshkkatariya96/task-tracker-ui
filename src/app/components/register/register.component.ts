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
import { finalize } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ActivityLogService } from '../../services/activity-log.service';
import { UI_MESSAGES } from '../../constants/ui-messages';

@Component({
  selector: 'app-register',
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
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {

  name = '';
  email = '';
  password = '';
  confirmPassword = '';
  loading = false;
  hidePassword = true;

  constructor(
    private authService: AuthService,
    private activityLogService: ActivityLogService,
    private router: Router,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  register() {
    if (!this.name || !this.email || !this.password) {
      this.activityLogService.log('auth', 'Registration validation failed', {
        level: 'warn',
        status: 'failure',
        details: {
          email: this.email,
          reason: 'Missing required fields'
        }
      });
      this.snackBar.open(UI_MESSAGES.register.allFieldsRequired, UI_MESSAGES.common.closeAction, { duration: 3000 });
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.activityLogService.log('auth', 'Registration validation failed', {
        level: 'warn',
        status: 'failure',
        details: {
          email: this.email,
          reason: 'Passwords do not match'
        }
      });
      this.snackBar.open(UI_MESSAGES.register.passwordsDoNotMatch, UI_MESSAGES.common.closeAction, { duration: 3000 });
      return;
    }

    if (this.password.length < 6) {
      this.activityLogService.log('auth', 'Registration validation failed', {
        level: 'warn',
        status: 'failure',
        details: {
          email: this.email,
          reason: 'Password too short'
        }
      });
      this.snackBar.open(UI_MESSAGES.register.passwordTooShort, UI_MESSAGES.common.closeAction, { duration: 3000 });
      return;
    }

    this.loading = true;
    this.cdr.detectChanges();
    this.activityLogService.log('auth', 'Registration submitted', {
      status: 'started',
      details: {
        email: this.email,
        name: this.name
      }
    });

    this.authService.register({
      name: this.name,
      email: this.email,
      password: this.password
    }).pipe(
      finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: () => {
        this.activityLogService.log('auth', 'Registration completed', {
          status: 'success',
          details: {
            email: this.email
          }
        });
        this.snackBar.open(UI_MESSAGES.register.registrationSuccess, UI_MESSAGES.common.closeAction, {
          duration: 3000
        });
        this.router.navigate(['/login']);
      }
    });
  }

  goToLogin() {
    this.activityLogService.log('auth', 'Login screen requested', {
      status: 'success'
    });
    this.router.navigate(['/login']);
  }
}
