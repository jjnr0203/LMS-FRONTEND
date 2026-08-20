import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { AdminService } from '../../../../core/services/admin.service';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-backups',
  imports: [CommonModule, ButtonModule, CardModule, ToastModule],
  providers: [MessageService],
  templateUrl: './backups.component.html',
  styleUrl: './backups.component.scss'
})
export class BackupsComponent {
  private adminService = inject(AdminService);
  private messageService = inject(MessageService);

  isDownloading = signal(false);

  downloadBackup() {
    this.isDownloading.set(true);
    this.adminService.downloadBackup().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
        link.download = `backup-${dateStr}.sql`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Respaldo descargado correctamente'
        });
        this.isDownloading.set(false);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo generar el respaldo'
        });
        this.isDownloading.set(false);
      }
    });
  }
}
