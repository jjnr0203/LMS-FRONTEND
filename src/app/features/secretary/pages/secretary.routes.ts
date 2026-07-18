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
        path: 'inscripciones',
        loadComponent: () =>
          import('../inscripciones/inscripciones.component').then((m) => m.InscripcionesComponent),
      },
      {
        path: 'matricula',
        loadComponent: () =>
          import('../matricula/matricula.component').then((m) => m.MatriculaComponent),
      },
      {
        path: 'historial',
        loadComponent: () =>
          import('../historial/historial-academico.component').then((m) => m.HistorialAcademicoComponent),
      },
      {
        path: 'certificados',
        loadComponent: () =>
          import('../certificados/certificados.component').then((m) => m.CertificadosComponent),
      },
    ],
  },
] as Routes;
