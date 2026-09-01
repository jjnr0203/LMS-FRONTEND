import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TreasuryService, MatriculaRow } from '../../../core/services/treasury.service';
import { UserService } from '../../../core/services/user.service';
import { MessageService, ConfirmationService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-tuition-list',
  imports: [
    TableModule,
    TagModule,
    ButtonModule,
    ToastModule,
    CardModule,
    DialogModule,
    ConfirmDialogModule,
    InputTextModule,
    SelectModule,
    IconFieldModule,
    InputIconModule,
    FormsModule,
    CommonModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './tuition-list.component.html',
  styleUrl: './tuition-list.component.scss',
})
export class TuitionListComponent implements OnInit {
  private treasuryService = inject(TreasuryService);
  private userService = inject(UserService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  profileModalVisible = false;
  selectedStudent: any = null;

  tuitions = signal<MatriculaRow[]>([]);
  loading = signal(true);
  searchTerm = '';
  searchVersion = signal(0);
  statusFilter = signal<string>('all');

  statusOptions = [
    { label: 'Todos', value: 'all' },
    { label: 'Matriculado', value: 'matriculado' },
    { label: 'Sin Matricular', value: 'pendiente' },
  ];

  filteredTuitions = computed(() => {
    this.searchVersion();
    const term = this.searchTerm.toLowerCase().trim();
    const status = this.statusFilter();

    return this.tuitions().filter((t) => {
      const matchesSearch =
        !term ||
        t.studentId.toLowerCase().includes(term) ||
        t.firstName.toLowerCase().includes(term) ||
        t.lastName.toLowerCase().includes(term) ||
        this.fullName(t).toLowerCase().includes(term);

      const matriculado = t.enrolled;
      const matchesStatus =
        status === 'all' ||
        (status === 'matriculado' && matriculado) ||
        (status === 'pendiente' && !matriculado);

      return matchesSearch && matchesStatus;
    });
  });

  ngOnInit() {
    this.load();
  }

  onSearchChange(value: string) {
    this.searchTerm = value;
    this.searchVersion.set(this.searchVersion() + 1);
  }

  load() {
    this.loading.set(true);
    this.treasuryService.getMatriculas().subscribe({
      next: (res) => {
        this.tuitions.set(res.data);
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

  fullName(row: MatriculaRow): string {
    return `${row.firstName} ${row.lastName}`;
  }

  statusLabel(enrolled: boolean, status: string): string {
    if (!enrolled) return 'Sin Matricular';
    switch (status) {
      case 'pago_total':
      case 'convenio':
        return 'Matriculado';
      case 'no_paga':
      case 'pendiente':
        return 'Pendiente';
      default:
        return 'Matriculado';
    }
  }

  statusSeverity(enrolled: boolean, status: string): 'success' | 'warn' | 'info' | 'secondary' {
    if (!enrolled) return 'secondary';
    switch (status) {
      case 'pago_total':
      case 'convenio':
        return 'success';
      case 'no_paga':
      case 'pendiente':
        return 'warn';
      default:
        return 'info';
    }
  }

  confirmEnroll(row: MatriculaRow) {
    this.confirmationService.confirm({
      message: `¿Matricular a ${this.fullName(row)}? Se creará una matrícula para el estudiante.`,
      header: 'Confirmar Matrícula',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, Matricular',
      rejectLabel: 'Cancelar',
      accept: () => this.doEnroll(row),
    });
  }

  doEnroll(row: MatriculaRow) {
    this.loading.set(true);
    this.treasuryService.enrollStudent(row.studentId).subscribe({
      next: (res) => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: res.message });
        this.load();
      },
      error: (err) => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message ?? 'No se pudo matricular al estudiante',
        });
      },
    });
  }

  openProfileModal(student: any) {
    this.selectedStudent = { ...student };
    this.profileModalVisible = true;
    this.userService.getUser(student.studentId, 'student').subscribe({
      next: (fullStudent) => {
        if (this.selectedStudent && this.selectedStudent.studentId === fullStudent.id) {
          this.selectedStudent = { ...this.selectedStudent, ...fullStudent };
        }
      },
      error: () => {},
    });
  }

  calculateAge(birthDate: string | Date | undefined): number | null {
    if (!birthDate) return null;
    const today = new Date();
    const birthDateObj = new Date(birthDate);
    let age = today.getFullYear() - birthDateObj.getFullYear();
    const m = today.getMonth() - birthDateObj.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDateObj.getDate())) {
      age--;
    }
    return age;
  }
}
