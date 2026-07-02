import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CoordinatorService } from '../../../core/services/coordinator.service';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { BadgeModule } from 'primeng/badge';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-coordinator-dashboard',
  standalone: true,
  imports: [CardModule, ToastModule, BadgeModule],
  providers: [MessageService],
  templateUrl: './coordinator-dashboard.component.html',
  styleUrl: './coordinator-dashboard.component.scss',
})
export class CoordinatorDashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private coordinatorService = inject(CoordinatorService);
  private messageService = inject(MessageService);
  private router = inject(Router);

  user = this.authService.user;
  careers = signal<any[]>([]);
  totalSubjects = signal(0);
  loading = signal(false);

  ngOnInit() {
    this.loadDashboard();
  }

  loadDashboard() {
    this.loading.set(true);
    this.coordinatorService.getDashboard().subscribe({
      next: (res) => {
        this.careers.set(res.careers);
        this.totalSubjects.set(res.totalSubjects);
        this.loading.set(false);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar el panel',
        });
        this.loading.set(false);
      },
    });
  }

  goToCareer(id: string) {
    this.router.navigate(['/coordinator/carrera', id]);
  }
}
