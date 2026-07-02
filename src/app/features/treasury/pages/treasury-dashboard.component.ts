import { Component, inject } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { ToastModule } from 'primeng/toast';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-treasury-dashboard',
  standalone: true,
  imports: [ToastModule, CardModule],
  templateUrl: './treasury-dashboard.component.html',
  styleUrl: './treasury-dashboard.component.scss',
})
export class TreasuryDashboardComponent {
  private authService = inject(AuthService);
  user = this.authService.user;
}





