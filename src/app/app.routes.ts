import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) },
  { 
    path: 'dashboard', 
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [AuthGuard],
    children: [
      {
        path: 'users',
        loadComponent: () => import('./features/users/users-list/users-list.component').then(m => m.UsersListComponent)
      }
    ]
  },
  { path: '', redirectTo: '/login', pathMatch: 'full' }
];
