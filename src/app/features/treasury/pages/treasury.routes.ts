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
          import('../students-list/students-list.component').then(
            (m) => m.TreasuryStudentsListComponent,
          ),
      },
    ],
  },
] as Routes;
