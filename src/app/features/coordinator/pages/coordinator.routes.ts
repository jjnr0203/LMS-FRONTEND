import { Routes } from '@angular/router';
import { AuthGuard } from '../../../core/guards/auth.guard';
import { RoleGuard } from '../../../core/guards/role.guard';

export default [
  {
    path: '',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['coordinator'] },
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./coordinator-dashboard.component').then((m) => m.CoordinatorDashboardComponent),
      },
      {
        path: 'materias-list',
        loadComponent: () =>
          import('../subjects-list/subjects-list.component').then((m) => m.SubjectsListComponent),
      },
      {
        path: 'materias',
        loadComponent: () =>
          import('../create-subject/create-subject.component').then(
            (m) => m.CreateSubjectComponent,
          ),
      },
      {
        path: 'asignar-docente',
        loadComponent: () =>
          import('../assign-teacher/assign-teacher.component').then(
            (m) => m.AssignTeacherComponent,
          ),
      },
      {
        path: 'matricular',
        loadComponent: () =>
          import('../enroll-student/enroll-student.component').then(
            (m) => m.EnrollStudentComponent,
          ),
      },
    ],
  },
] as Routes;
