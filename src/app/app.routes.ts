import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./features/auth/pages/auth.routes'),
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./layouts/main-layout/main-layout.component').then((m) => m.MainLayoutComponent),
    canActivate: [AuthGuard],
    loadChildren: () => import('./features/admin/pages/admin.routes'),
  },
  {
    path: 'coordinador',
    loadComponent: () =>
      import('./layouts/main-layout/main-layout.component').then((m) => m.MainLayoutComponent),
    canActivate: [AuthGuard],
    loadChildren: () => import('./features/coordinator/pages/coordinator.routes'),
  },
  {
    path: 'tesoreria',
    loadComponent: () =>
      import('./layouts/main-layout/main-layout.component').then((m) => m.MainLayoutComponent),
    canActivate: [AuthGuard],
    loadChildren: () => import('./features/treasury/pages/treasury.routes'),
  },
  {
    path: 'docente',
    loadComponent: () =>
      import('./layouts/main-layout/main-layout.component').then((m) => m.MainLayoutComponent),
    canActivate: [AuthGuard],
    loadChildren: () => import('./features/teacher/pages/teacher.routes'),
  },
  {
    path: 'perfil',
    loadComponent: () =>
      import('./layouts/main-layout/main-layout.component').then((m) => m.MainLayoutComponent),
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/profile/profile.component').then((m) => m.ProfileComponent),
      },
      {
        path: 'cambiar-password',
        loadComponent: () =>
          import('./features/profile/change-password.component').then(
            (m) => m.ChangePasswordComponent,
          ),
      },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
