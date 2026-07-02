import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CoordinatorService } from '../../../core/services/coordinator.service';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { BadgeModule } from 'primeng/badge';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-careers-list',
  standalone: true,
  imports: [CardModule, ToastModule, BadgeModule],
  providers: [MessageService],
  templateUrl: './careers-list.component.html',
  styleUrl: './careers-list.component.scss',
})
export class CareersListComponent implements OnInit {
  private coordinatorService = inject(CoordinatorService);
  private messageService = inject(MessageService);
  private router = inject(Router);

  careers = signal<any[]>([]);
  loading = signal(false);

  ngOnInit() {
    this.loadCareers();
  }

  loadCareers() {
    this.loading.set(true);
    this.coordinatorService.getDashboard().subscribe({
      next: (res) => {
        this.careers.set(res.careers);
        this.loading.set(false);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las carreras',
        });
        this.loading.set(false);
      },
    });
  }

  goToCareer(id: string) {
    this.router.navigate(['/coordinator/carrera', id]);
  }
}
