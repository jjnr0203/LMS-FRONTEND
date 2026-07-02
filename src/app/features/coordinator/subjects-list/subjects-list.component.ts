import { Component, inject, OnInit, signal } from '@angular/core';
import { CoordinatorService } from '../../../core/services/coordinator.service';
import { Subject } from '../../../core/models';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { CardModule } from 'primeng/card';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-subjects-list',
  imports: [TableModule, ToastModule, CardModule],
  providers: [MessageService],
  templateUrl: './subjects-list.component.html',
  styleUrl: './subjects-list.component.scss',
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






