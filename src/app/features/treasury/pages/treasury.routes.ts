import { Routes } from '@angular/router';
import { AuthGuard } from '../../../core/guards/auth.guard';
import { RoleGuard } from '../../../core/guards/role.guard';

export default [
  {
    path: '',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['treasury'] },
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./treasury-dashboard.component').then((m) => m.TreasuryDashboardComponent),
      },
      {
        path: 'matriculas',
        loadComponent: () =>
          import('../tuition-list/tuition-list.component').then((m) => m.TuitionListComponent),
      },
      {
        path: 'estudiantes-list',
        loadComponent: () =>
          import('../../users/users-list/users-list.component').then((m) => m.UsersListComponent),
        data: { roleFilter: 'student' },
      },
      {
        path: 'abonos',
        loadComponent: () =>
          import('../register-payment/register-payment.component').then(
            (m) => m.RegisterPaymentComponent,
          ),
      },
      {
        path: 'deshabilitar',
        loadComponent: () =>
          import('../disable-account/disable-account.component').then(
            (m) => m.DisableAccountComponent,
          ),
      },
    ],
  },
] as Routes;
