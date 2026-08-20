import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./features/auth/pages/auth.routes'),
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./layouts/main-layout/main-layout.component').then((m) => m.MainLayoutComponent),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin'] },
    loadChildren: () => import('./features/admin/pages/admin.routes'),
  },
  {
    path: 'coordinator',
    loadComponent: () =>
      import('./layouts/main-layout/main-layout.component').then((m) => m.MainLayoutComponent),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['coordinator'] },
    loadChildren: () => import('./features/coordinator/pages/coordinator.routes'),
  },
  {
    path: 'treasury',
    loadComponent: () =>
      import('./layouts/main-layout/main-layout.component').then((m) => m.MainLayoutComponent),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['treasury'] },
    loadChildren: () => import('./features/treasury/pages/treasury.routes'),
  },
  {
    path: 'teacher',
    loadComponent: () =>
      import('./layouts/main-layout/main-layout.component').then((m) => m.MainLayoutComponent),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['teacher'] },
    loadChildren: () => import('./features/teacher/pages/teacher.routes'),
  },
  {
    path: 'secretary',
    loadComponent: () =>
      import('./layouts/main-layout/main-layout.component').then((m) => m.MainLayoutComponent),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['secretary'] },
    loadChildren: () => import('./features/secretary/pages/secretary.routes'),
  },
  {
    path: 'human-resources',
    loadComponent: () =>
      import('./layouts/main-layout/main-layout.component').then((m) => m.MainLayoutComponent),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['human_resources'] },
    loadChildren: () => import('./features/human-resources/pages/human-resources.routes'),
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
    ],
  },
  { path: '**', redirectTo: 'login' },
];
