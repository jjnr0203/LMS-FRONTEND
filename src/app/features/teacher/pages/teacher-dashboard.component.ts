import { Component, inject } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  imports: [CardModule],
  templateUrl: './teacher-dashboard.component.html',
  styleUrl: './teacher-dashboard.component.scss',
})
export class TeacherDashboardComponent {
  private authService = inject(AuthService);
  user = this.authService.user;
}





