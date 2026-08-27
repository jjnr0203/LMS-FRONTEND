import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { SecretaryService } from '../../../core/services/secretary.service';
import { UserService } from '../../../core/services/user.service';
import { MessageService, ConfirmationService, MenuItem } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MenuModule } from 'primeng/menu';
import { CreateStudentComponent } from '../create-student/create-student.component';
import { MatriculaComponent } from '../matricula/matricula.component';

@Component({
  selector: 'app-students-list',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    ToastModule,
    TagModule,
    DialogModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    ConfirmDialogModule,
    MenuModule,
    CreateStudentComponent,
    MatriculaComponent,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './students-list.component.html',
  styleUrl: './students-list.component.scss',
})
export class StudentsListComponent implements OnInit, OnDestroy {
  private secretaryService = inject(SecretaryService);
  private userService = inject(UserService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private formBuilder = inject(FormBuilder);

  students = signal<any[]>([]);
  totalRecords = signal(0);
  loading = signal(false);
  createDialogVisible = false;

  searchQuery = '';
  searchSubject = new Subject<string>();
  searchSubscription!: Subscription;

  menuItems: MenuItem[] = [];
  selectedStudentForMenu: any = null;

  matriculaDialogVisible = false;

  profileModalVisible = false;
  selectedStudent: any = null;

  editDialogVisible = false;
  selectedStudentId: string | null = null;

  editForm = this.formBuilder.group({
    id: [{ value: '', disabled: true }],
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    birthDate: [''],
  });

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
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los estudiantes',
        });
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

  getStatusSeverity(enrolled: boolean, tuitionStatus: string | null): 'success' | 'warn' | 'danger' | 'info' | 'secondary' {
    if (!enrolled) return 'secondary';
    switch (tuitionStatus) {
      case 'pago_total':
      case 'convenio':
        return 'success';
      case 'no_paga':
      case 'pendiente':
        return 'warn';
      default:
        return 'success';
    }
  }

  getStatusLabel(enrolled: boolean, tuitionStatus: string | null): string {
    if (!enrolled) return 'Sin Matricular';
    switch (tuitionStatus) {
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
  showMenu(event: Event, menu: any, student: any) {
    this.selectedStudentForMenu = student;
    const actionItems: MenuItem[] = [];
    if (!student.enrolled) {
      actionItems.push({
        label: 'Matricular',
        icon: 'pi pi-graduation-cap',
        command: () => this.openMatriculaDialog(this.selectedStudentForMenu),
      });
    } else if (student.tuitionStatus === 'pago_total' || student.tuitionStatus === 'convenio') {
      actionItems.push({
        label: 'Certificado de Matrícula',
        icon: 'pi pi-file-pdf',
        command: () => this.generateEnrollmentCertificate(this.selectedStudentForMenu),
      });
    }
    this.menuItems = [
      {
        label: 'Ver Perfil',
        icon: 'pi pi-eye',
        styleClass: 'action-view',
        command: () => this.openProfileModal(this.selectedStudentForMenu),
      },
      {
        label: 'Editar',
        icon: 'pi pi-pencil',
        styleClass: 'action-edit',
        command: () => this.openEditDialog(this.selectedStudentForMenu),
      },
      ...actionItems,
      { separator: true },
      {
        label: 'Eliminar',
        icon: 'pi pi-trash',
        styleClass: 'action-delete',
        command: () => this.confirmDelete(this.selectedStudentForMenu),
      },
    ];
    menu.toggle(event);
  }
  generateEnrollmentCertificate(student: any) {
    this.loading.set(true);
    this.secretaryService.generateCertificate({ studentId: student.id }).subscribe({
      next: (res: any) => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Certificado de matrícula generado correctamente',
        });
        const url = res.certificate?.pdfUrl;
        if (url) {
          const downloadUrl = url.includes('/image/upload/')
            ? url.replace('/image/upload/', '/image/upload/fl_attachment/')
            : url;
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = `certificado-matricula-${student.id}.pdf`;
          document.body.appendChild(link);
          link.click();
          link.remove();
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message ?? 'Error al generar certificado',
        });
      },
    });
  }

  openProfileModal(student: any) {
    this.selectedStudent = { ...student };
    this.profileModalVisible = true;
    this.userService.getUser(student.id, 'student').subscribe({
      next: (fullStudent) => {
        if (this.selectedStudent && this.selectedStudent.id === fullStudent.id) {
          this.selectedStudent = { ...this.selectedStudent, ...fullStudent };
        }
      },
      error: () => {},
    });
  }

  openMatriculaDialog(student: any) {
    this.selectedStudentForMenu = student;
    this.matriculaDialogVisible = true;
  }

  confirmEnroll(student: any) {
    this.confirmationService.confirm({
      message: `¿Matricular a ${student.firstName} ${student.lastName}? Se creará una matrícula para el estudiante.`,
      header: 'Confirmar Matrícula',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, Matricular',
      rejectLabel: 'Cancelar',
      accept: () => this.doEnroll(student),
    });
  }

  doEnroll(student: any) {
    this.loading.set(true);
    this.secretaryService.enrollStudent(student.id).subscribe({
      next: (res) => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: res.message });
        this.loadStudents(1, 10);
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

  onEnrollmentCreated() {
    this.matriculaDialogVisible = false;
    this.messageService.add({
      severity: 'success',
      summary: 'Éxito',
      detail: 'Matrícula generada correctamente',
    });
    this.loadStudents(1, 10);
  }

  openEditDialog(student: any) {
    this.selectedStudentId = student.id;
    this.editForm.patchValue({
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      phone: student.phone || '',
      birthDate: student.birthDate ? new Date(student.birthDate).toISOString().split('T')[0] : '',
    });
    this.editDialogVisible = true;
  }

  onSaveEdit() {
    if (this.editForm.invalid || !this.selectedStudentId) return;
    this.loading.set(true);
    const payload: any = { ...this.editForm.value };
    if (!payload.birthDate) {
      delete payload.birthDate;
    }
    delete payload.id;

    this.userService.updateUser(this.selectedStudentId, payload, 'student').subscribe({
      next: (res: any) => {
        const updated = res?.user ?? res;
        this.students.update((list) =>
          list.map((s) => (s.id === this.selectedStudentId ? { ...s, ...updated } : s)),
        );
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Estudiante actualizado',
        });
        this.editDialogVisible = false;
        this.loading.set(false);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo actualizar el estudiante',
        });
        this.loading.set(false);
      },
    });
  }

  confirmDelete(student: any) {
    this.confirmationService.confirm({
      message: `¿Estás seguro que deseas eliminar a ${student.firstName} ${student.lastName}?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.loading.set(true);
        this.userService.deleteUser(student.id, 'student').subscribe({
          next: () => {
            this.students.update((list) => list.filter((s) => s.id !== student.id));
            this.totalRecords.update((t) => Math.max(0, t - 1));
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Estudiante eliminado',
            });
            this.loading.set(false);
          },
          error: () => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo eliminar el estudiante',
            });
            this.loading.set(false);
          },
        });
      },
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
