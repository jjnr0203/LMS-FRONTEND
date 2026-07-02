import { Component, inject, signal, OnInit } from '@angular/core';
import { TreasuryService } from '../../../core/services/treasury.service';
import { Tuition } from '../../../core/models';
import { MessageService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-tuition-list',
  imports: [TableModule, TagModule, ButtonModule, ToastModule, CardModule],
  providers: [MessageService],
  templateUrl: './tuition-list.component.html',
  styleUrl: './tuition-list.component.scss',
})
export class TuitionListComponent implements OnInit {
  private treasuryService = inject(TreasuryService);
  private messageService = inject(MessageService);

  tuitions = signal<Tuition[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.treasuryService.getTuitions().subscribe({
      next: (res) => {
        this.tuitions.set(res.tuitions);
        this.loading.set(false);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las matrículas',
        });
        this.loading.set(false);
      },
    });
  }

  statusLabel(s: string): string {
    return s === 'pago_total' ? 'Pagado Total' : s === 'pendiente' ? 'Pendiente' : 'No paga';
  }

  statusSeverity(s: string): 'success' | 'warn' | 'danger' {
    return s === 'pago_total' ? 'success' : s === 'pendiente' ? 'warn' : 'danger';
  }

  progressColor(s: string): string {
    return s === 'pago_total' ? '#22c55e' : s === 'pendiente' ? '#eab308' : '#ef4444';
  }
}






