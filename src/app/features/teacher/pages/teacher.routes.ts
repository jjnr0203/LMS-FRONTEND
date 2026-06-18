import { Routes } from '@angular/router';
import { AuthGuard } from '../../../core/guards/auth.guard';
import { RoleGuard } from '../../../core/guards/role.guard';

export default [
  {
    path: '',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['teacher'] },
    children: [
      { path: '', redirectTo: 'inscribir', pathMatch: 'full' },
      {
        path: 'inscribir',
        loadComponent: () =>
          import('../enroll-student-subject/enroll-student-subject.component').then(
            (m) => m.EnrollStudentSubjectComponent,
          ),
      },
      {
        path: 'tareas',
        loadComponent: () =>
          import('../create-assignment/create-assignment.component').then(
            (m) => m.CreateAssignmentComponent,
          ),
      },
      {
        path: 'calificar',
        loadComponent: () =>
          import('../grade-submission/grade-submission.component').then(
            (m) => m.GradeSubmissionComponent,
          ),
      },
    ],
  },
] as Routes;
