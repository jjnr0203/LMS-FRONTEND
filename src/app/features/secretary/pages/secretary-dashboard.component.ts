import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { SecretaryService } from '../../../core/services/secretary.service';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-secretary-dashboard',
  imports: [CardModule, ToastModule],
  providers: [MessageService],
  templateUrl: './secretary-dashboard.component.html',
  styleUrl: './secretary-dashboard.component.scss',
})
export class SecretaryDashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private secretaryService = inject(SecretaryService);
  private messageService = inject(MessageService);
  private router = inject(Router);

  user = this.authService.user;
  totalInscriptions = signal(0);
  pendingInscriptions = signal(0);
  totalCertificates = signal(0);
  loading = signal(false);

  modules = [
    { label: 'Estudiantes', icon: 'pi pi-users', route: '/secretary/estudiantes', color: '#3b82f6', bg: '#eff6ff' },
    { label: 'Matrícula', icon: 'pi pi-calendar', route: '/secretary/matricula', color: '#10b981', bg: '#ecfdf5' },
    { label: 'Certificados', icon: 'pi pi-verified', route: '/secretary/certificados', color: '#8b5cf6', bg: '#f5f3ff' },
  ];

  ngOnInit() {
    this.loadDashboard();
  }

  loadDashboard() {
    this.loading.set(true);
    this.secretaryService.getDashboard().subscribe({
      next: (res) => {
        this.totalInscriptions.set(res.totalInscriptions);
        this.pendingInscriptions.set(res.pendingInscriptions);
        this.totalCertificates.set(res.totalCertificates);
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

  navigateTo(route: string) {
    this.router.navigate([route]);
  }
}
