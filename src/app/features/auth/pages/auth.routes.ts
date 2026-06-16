import { Routes } from '@angular/router';

export default [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('../login/login.component').then((m) => m.LoginComponent),
  },
] as Routes;
