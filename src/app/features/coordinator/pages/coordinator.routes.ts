import { Routes } from '@angular/router';
import { AuthGuard } from '../../../core/guards/auth.guard';
import { RoleGuard } from '../../../core/guards/role.guard';

export default [
  {
    path: '',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['coordinator'] },
    children: [
      { path: '', redirectTo: 'estudiantes', pathMatch: 'full' },
      {
        path: 'estudiantes',
        loadComponent: () =>
          import('../register-student/register-student.component').then(
            (m) => m.RegisterStudentComponent,
          ),
      },
      {
        path: 'docentes',
        loadComponent: () =>
          import('../register-teacher/register-teacher.component').then(
            (m) => m.RegisterTeacherComponent,
          ),
      },
      {
        path: 'materias',
        loadComponent: () =>
          import('../create-subject/create-subject.component').then(
            (m) => m.CreateSubjectComponent,
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
