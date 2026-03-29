import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { LoginRequest, LoginResponse, RegisterRequest } from '../models/user.model';
import { ActivityLogService } from './activity-log.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = 'http://localhost:8080/api/auth';

  private headers = new HttpHeaders({ 'Content-Type': 'application/json' });

  constructor(
    private http: HttpClient,
    private activityLogService: ActivityLogService
  ) {}

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(
      `${this.apiUrl}/login`,
      request,
      { headers: this.headers }
    ).pipe(
      tap(response => {
        localStorage.setItem('token', response.token);
        localStorage.setItem('role', response.role);
        localStorage.setItem('email', response.email);
        this.activityLogService.log('auth', 'Login completed', {
          status: 'success',
          details: {
            email: response.email,
            role: response.role
          }
        });
      })
    );
  }

  register(request: RegisterRequest): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/register`,
      request,
      { headers: this.headers, responseType: 'text' }
    );
  }

  logout(): void {
    this.activityLogService.log('auth', 'User logged out', {
      status: 'success',
      details: {
        email: localStorage.getItem('email'),
        role: localStorage.getItem('role')
      }
    });
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('email');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getRole(): string | null {
    return localStorage.getItem('role');
  }

  getEmail(): string | null {
    return localStorage.getItem('email');
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  isAdmin(): boolean {
    return localStorage.getItem('role') === 'ADMIN';
  }
}
