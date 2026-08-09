import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { SecretaryService } from '../../../core/services/secretary.service';
import { MessageService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { CreateStudentComponent } from '../create-student/create-student.component';

@Component({
  selector: 'app-students-list',
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    ToastModule,
    TagModule,
    DialogModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    CreateStudentComponent,
  ],
  providers: [MessageService],
  templateUrl: './students-list.component.html',
  styleUrl: './students-list.component.scss',
})
export class StudentsListComponent implements OnInit, OnDestroy {
  private secretaryService = inject(SecretaryService);
  private messageService = inject(MessageService);

  students = signal<any[]>([]);
  totalRecords = signal(0);
  loading = signal(false);
  createDialogVisible = false;

  searchQuery = '';
  searchSubject = new Subject<string>();
  searchSubscription!: Subscription;

  ngOnInit() {
    this.loadStudents(1, 10);
    this.searchSubscription = this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => this.loadStudents(1, 10));
  }

  ngOnDestroy() {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

  loadStudents(page: number, limit: number) {
    this.loading.set(true);
    this.secretaryService.listStudents({ page, limit, search: this.searchQuery }).subscribe({
      next: (res) => {
        this.students.set(res.data);
        this.totalRecords.set(res.total ?? 0);
        this.loading.set(false);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los estudiantes' });
        this.loading.set(false);
      },
    });
  }

  onPageChange(event: any) {
    const page = (event.first ?? 0) / (event.rows ?? 10) + 1;
    const limit = event.rows ?? 10;
    this.loadStudents(page, limit);
  }

  onSearchChange(value: string) {
    this.searchQuery = value;
    this.searchSubject.next(value);
  }

  openCreateDialog() {
    this.createDialogVisible = true;
  }

  onStudentCreated() {
    this.createDialogVisible = false;
    this.loadStudents(1, 10);
  }

  getStatusSeverity(status: string | null): 'success' | 'warn' | 'danger' | 'info' | 'secondary' {
    switch (status) {
      case 'approved': return 'success';
      case 'pending': return 'warn';
      case 'rejected': return 'danger';
      default: return 'secondary';
    }
  }

  getStatusLabel(status: string | null): string {
    switch (status) {
      case 'approved': return 'Aprobada';
      case 'pending': return 'Pendiente';
      case 'rejected': return 'Rechazada';
      default: return 'Sin inscripción';
    }
  }
}
