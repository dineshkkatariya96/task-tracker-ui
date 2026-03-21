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
    private router: Router,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  register() {
    if (!this.name || !this.email || !this.password) {
      this.snackBar.open('All fields are required!', 'Close', { duration: 3000 });
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.snackBar.open('Passwords do not match!', 'Close', { duration: 3000 });
      return;
    }

    if (this.password.length < 6) {
      this.snackBar.open('Password must be at least 6 characters!', 'Close', { duration: 3000 });
      return;
    }

    this.loading = true;
    this.cdr.detectChanges();

    this.authService.register({
      name: this.name,
      email: this.email,
      password: this.password
    }).subscribe({
      next: () => {
        this.loading = false;
        this.cdr.detectChanges();
        this.snackBar.open('Registration successful! Please login.', 'Close', {
          duration: 3000
        });
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.loading = false;
        this.cdr.detectChanges();
        this.snackBar.open(
          err.error || 'Registration failed. Try again.',
          'Close',
          { duration: 4000 }
        );
      }
    });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
