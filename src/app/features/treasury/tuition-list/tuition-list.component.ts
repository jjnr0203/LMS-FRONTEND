import { Component, inject, signal, OnInit } from '@angular/core';
import { TreasuryService } from '../../../core/services/treasury.service';
import { Tuition } from '../../../core/models';
import { MessageService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { CardModule } from 'primeng/card';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tuition-list',
  imports: [TableModule, TagModule, ButtonModule, ToastModule, CardModule, CommonModule],
  providers: [MessageService],
  template: `
    <p-toast />
    <div class="page-container">
      <!-- Dark Header -->
      <div class="page-header">
        <div class="header-content">
          <h1 class="title">Listado de Matrículas</h1>
          <p class="description">
            Visualiza el estado de las matrículas y los pagos de cada estudiante.
          </p>
        </div>
      </div>

      <!-- Content -->
      <div class="content-wrapper">
        <div class="data-card">
          <p-table
            [value]="tuitions()"
            [loading]="loading()"
            [paginator]="true"
            [rows]="15"
            [tableStyle]="{ 'min-width': '50rem' }"
          >
            <ng-template pTemplate="header">
              <tr>
                <th>Cédula Estudiante</th>
                <th>Estado</th>
                <th>Cuotas</th>
                <th>Progreso</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-t>
              <tr>
                <td>{{ t.studentId }}</td>
                <td>
                  <p-tag [value]="statusLabel(t.status)" [severity]="statusSeverity(t.status)" />
                </td>
                <td>{{ t.paidInstallments }} / 4</td>
                <td>
                  <div class="progress-bar">
                    <div
                      class="progress-fill"
                      [style.width.%]="(t.paidInstallments / 4) * 100"
                      [style.background]="progressColor(t.status)"
                    ></div>
                  </div>
                </td>
              </tr>
            </ng-template>
            <ng-template pTemplate="emptymessage">
              <tr>
                <td colspan="4" class="text-center">No hay matrículas registradas.</td>
              </tr>
            </ng-template>
          </p-table>

          <div class="legend">
            <span><span class="dot" style="background:#ef4444"></span> No paga</span>
            <span><span class="dot" style="background:#eab308"></span> Pendiente</span>
            <span><span class="dot" style="background:#22c55e"></span> Pagado total</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .page-container {
        display: flex;
        flex-direction: column;
        margin-top: -1.5rem;
        margin-left: -1.5rem;
        margin-right: -1.5rem;
      }
      .page-header {
        background: #064e3b;
        color: #ffffff;
        border-bottom: none;
        padding: 2.5rem 2rem 5rem 2rem;
        min-height: 250px;
        box-sizing: border-box;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
      }
      .title {
        font-size: 2.2rem;
        font-weight: 600;
        margin: 0 0 0.5rem 0;
        letter-spacing: -0.02em;
        color: #ffffff;
      }
      .description {
        color: #d1fae5;
        font-size: 0.95rem;
        line-height: 1.5;
        margin: 0;
      }
      .content-wrapper {
        padding: 0 2rem;
        margin-top: -3.5rem;
      }
      .data-card {
        background: #ffffff;
        border-radius: 6px;
        padding: 1.5rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        max-width: 1200px;
        margin: 0 auto;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }
      .data-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
      }
      .progress-bar {
        width: 120px;
        height: 8px;
        background: #e2e8f0;
        border-radius: 6px;
        overflow: hidden;
      }
      .progress-fill {
        height: 100%;
        border-radius: 6px;
        transition: width 0.3s ease;
      }
      .legend {
        display: flex;
        gap: 1.5rem;
        margin-top: 1rem;
        font-size: 0.8rem;
        color: #64748b;
      }
      .dot {
        display: inline-block;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        margin-right: 0.3rem;
        vertical-align: middle;
      }
    `
  ]
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






