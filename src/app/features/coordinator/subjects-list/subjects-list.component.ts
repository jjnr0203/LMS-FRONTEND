import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CoordinatorService } from '../../../core/services/coordinator.service';
import { Subject } from '../../../core/models';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-subjects-list',
  imports: [CommonModule, TableModule, ToastModule],
  providers: [MessageService],
  template: `
    <p-toast />
    <div class="page-container">
      <!-- Dark Header -->
      <div class="page-header">
        <div class="header-content">
          <h1 class="title">Lista de Materias</h1>
          <p class="description">
            Visualiza todas las materias registradas en el sistema.
          </p>
        </div>
      </div>

      <!-- Content -->
      <div class="content-wrapper">
        <div class="data-card">
          <p-table
            [value]="subjects()"
            [loading]="loading()"
            [tableStyle]="{ 'min-width': '50rem' }"
            [paginator]="true"
            [rows]="10"
          >
            <ng-template pTemplate="header">
              <tr>
                <th>ID (UUID)</th>
                <th>Código</th>
                <th>Nombre</th>
                <th>Créditos</th>
                <th>Descripción</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-subject>
              <tr>
                <td>{{ subject.id }}</td>
                <td><strong>{{ subject.code }}</strong></td>
                <td>{{ subject.name }}</td>
                <td>{{ subject.credits }}</td>
                <td>{{ subject.description || 'Sin descripción' }}</td>
              </tr>
            </ng-template>
            <ng-template pTemplate="emptymessage">
              <tr>
                <td colspan="5">No se encontraron materias.</td>
              </tr>
            </ng-template>
          </p-table>
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
    `
  ]
})
export class SubjectsListComponent implements OnInit {
  private coordinatorService = inject(CoordinatorService);
  private messageService = inject(MessageService);

  subjects = signal<Subject[]>([]);
  loading = signal(false);

  ngOnInit() {
    this.loadSubjects();
  }

  loadSubjects() {
    this.loading.set(true);
    this.coordinatorService.getSubjects().subscribe({
      next: (res) => {
        this.subjects.set(res.subjects);
        this.loading.set(false);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las materias' });
        this.loading.set(false);
      },
    });
  }
}






