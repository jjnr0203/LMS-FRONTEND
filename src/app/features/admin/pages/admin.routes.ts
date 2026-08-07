import { Routes } from '@angular/router';
import { AuthGuard } from '../../../core/guards/auth.guard';
import { RoleGuard } from '../../../core/guards/role.guard';

export default [
  {
    path: '',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin'] },
    children: [
      {
        path: '',
        loadComponent: () =>
          import('../admin-dashboard.component').then((m) => m.AdminDashboardComponent),
      },
      {
        path: 'users-list',
        loadComponent: () =>
          import('../../users/users-list/users-list.component').then((m) => m.UsersListComponent),
        data: { roleFilter: '' },
      },
      {
        path: 'users',
        loadComponent: () =>
          import('../create-user/create-user.component').then((m) => m.CreateUserComponent),
      },
      {
        path: 'academic',
        loadComponent: () =>
          import('./academic-management/academic-management').then((m) => m.AcademicManagement),
      },
      {
        path: 'desglose/:careerId',
        loadComponent: () =>
          import('./career-breakdown/career-breakdown.component').then((m) => m.CareerBreakdownComponent),
      },
      {
        path: 'institution',
        loadComponent: () =>
          import('./institution-settings/institution-settings.component').then(
            (m) => m.InstitutionSettingsComponent,
          ),
      },
    ],
  },
] as Routes;
