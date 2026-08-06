import { Routes } from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () =>
      import('./dashboard/hr-dashboard.component').then((m) => m.HrDashboardComponent),
  },
  {
    path: 'staff',
    loadComponent: () =>
      import('../user-list/hr-user-list.component').then((m) => m.HrUserListComponent),
  },
  {
    path: 'create-staff',
    loadComponent: () =>
      import('../create-user/hr-create-user.component').then((m) => m.HrCreateUserComponent),
  },
] as Routes;
