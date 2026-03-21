import { Component } from '@angular/core';
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
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  login() {
    if (!this.email || !this.password) {
      this.snackBar.open('Please enter email and password!', 'Close', {
        duration: 3000
      });
      return;
    }

    this.loading = true;
    this.authService.login({ email: this.email, password: this.password })
      .subscribe({
        next: (response) => {
          this.loading = false;
          if (response.role === 'ADMIN') {
            this.router.navigate(['/admin']);
          } else {
            this.router.navigate(['/employee']);
          }
        },
        error: () => {
          this.loading = false;
          this.snackBar.open('Invalid email or password!', 'Close', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }
}
