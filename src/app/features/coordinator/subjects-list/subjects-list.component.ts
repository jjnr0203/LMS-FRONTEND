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
    <div class="card">
      <div class="flex justify-content-between align-items-center mb-4">
        <h2>Lista de Materias</h2>
      </div>

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
  `,
  styles: [
    `
      .card {
        background: #ffffff;
        padding: 2rem;
        border-radius: 10px;
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
      }
      .mb-4 { margin-bottom: 1.5rem; }
    `,
  ],
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
