import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () =>
      import('./components/login/login.component')
        .then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./components/register/register.component')
        .then(m => m.RegisterComponent)
  },
  {
    path: 'admin',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./components/admin/dashboard/dashboard.component')
        .then(m => m.DashboardComponent)
  },
  {
    path: 'employee',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./components/employee/dashboard/dashboard.component')
        .then(m => m.DashboardComponent)
  }
];
