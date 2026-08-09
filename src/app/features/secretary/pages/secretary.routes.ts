import { Routes } from '@angular/router';
import { AuthGuard } from '../../../core/guards/auth.guard';
import { RoleGuard } from '../../../core/guards/role.guard';

export default [
  {
    path: '',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['secretary'] },
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./secretary-dashboard.component').then((m) => m.SecretaryDashboardComponent),
      },
      {
        path: 'estudiantes',
        loadComponent: () =>
          import('../students-list/students-list.component').then((m) => m.StudentsListComponent),
      },
      {
        path: 'matricula',
        loadComponent: () =>
          import('../matricula/matricula.component').then((m) => m.MatriculaComponent),
      },
      {
        path: 'certificados',
        loadComponent: () =>
          import('../certificados/certificados.component').then((m) => m.CertificadosComponent),
      },
    ],
  },
] as Routes;
