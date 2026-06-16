import { Routes } from '@angular/router';
import { AuthGuard } from '../../../core/guards/auth.guard';
import { RoleGuard } from '../../../core/guards/role.guard';

export default [
  {
    path: '',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['tesoreria'] },
    children: [
      { path: '', redirectTo: 'matriculas', pathMatch: 'full' },
      {
        path: 'matriculas',
        loadComponent: () =>
          import('../tuition-list/tuition-list.component').then((m) => m.TuitionListComponent),
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
