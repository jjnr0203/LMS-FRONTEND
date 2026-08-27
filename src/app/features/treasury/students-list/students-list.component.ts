import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TreasuryService, MatriculaRow } from '../../../core/services/treasury.service';
import { UserService } from '../../../core/services/user.service';
import { SecretaryService } from '../../../core/services/secretary.service';
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

@Component({
  selector: 'app-treasury-students-list',
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
    ConfirmDialogModule,
    MenuModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './students-list.component.html',
  styleUrl: './students-list.component.scss',
})
export class TreasuryStudentsListComponent implements OnInit {
  private treasuryService = inject(TreasuryService);
  private userService = inject(UserService);
  private secretaryService = inject(SecretaryService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  students = signal<MatriculaRow[]>([]);
  loading = signal(true);
  searchTerm = '';
  searchVersion = signal(0);

  menuItems: MenuItem[] = [];
  selectedRow: MatriculaRow | null = null;

  profileModalVisible = false;
  selectedStudent: any = null;

  paymentModalVisible = false;
  certificateModalVisible = false;

  filteredStudents = computed(() => {
    this.searchVersion();
    const term = this.searchTerm.toLowerCase().trim();
    return this.students().filter((s) => {
      if (!term) return true;
      return (
        s.studentId.toLowerCase().includes(term) ||
        s.firstName.toLowerCase().includes(term) ||
        s.lastName.toLowerCase().includes(term) ||
        this.fullName(s).toLowerCase().includes(term)
      );
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
        this.students.set(res.data);
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

  fullName(row: MatriculaRow): string {
    return `${row.firstName} ${row.lastName}`;
  }

  getStatusSeverity(enrolled: boolean, status: string): 'success' | 'warn' | 'danger' | 'info' | 'secondary' {
    return enrolled ? 'success' : 'secondary';
  }

  getStatusLabel(enrolled: boolean, status: string): string {
    return enrolled ? 'Matriculado' : 'Sin Matricular';
  }

  getPagoLabel(enrolled: boolean, status: string, paidInstallments: number): string {
    if (!enrolled) return 'Sin Registro';
    if (status === 'pago_total' || paidInstallments >= 4) return 'Pagado';
    if (paidInstallments > 0) return 'En Proceso';
    return 'Sin Registro';
  }

  getPagoSeverity(
    enrolled: boolean,
    status: string,
    paidInstallments: number,
  ): 'success' | 'warn' | 'danger' | 'info' | 'secondary' {
    const label = this.getPagoLabel(enrolled, status, paidInstallments);
    switch (label) {
      case 'Pagado':
        return 'success';
      case 'En Proceso':
        return 'warn';
      case 'Sin Registro':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  showMenu(event: Event, menu: any, row: MatriculaRow) {
    event.stopPropagation();
    this.selectedRow = row;
    const items: MenuItem[] = [];

    if (!row.enrolled) {
      items.push({
        label: 'Matricular',
        icon: 'pi pi-graduation-cap',
        command: () => this.confirmMatricular(row),
      });
    } else if (row.status === 'pago_total') {
      items.push({
        label: 'Generar Certificado',
        icon: 'pi pi-file-pdf',
        command: () => this.openCertificateModal(row),
      });
    } else if (row.status === 'convenio') {
      if (row.paidInstallments > 0) {
        items.push({
          label: 'Registrar Abono',
          icon: 'pi pi-plus',
          command: () => this.confirmRegisterAbono(row),
        });
      } else {
        items.push({
          label: 'Registrar Pago',
          icon: 'pi pi-credit-card',
          command: () => this.openPaymentModal(row),
        });
      }
      items.push({
        label: 'Generar Certificado',
        icon: 'pi pi-file-pdf',
        command: () => this.openCertificateModal(row),
      });
    } else {
      items.push({
        label: 'Matricular',
        icon: 'pi pi-graduation-cap',
        command: () => this.confirmMatricular(row),
      });
    }

    items.push({
      label: 'Ver Perfil',
      icon: 'pi pi-eye',
      command: () => this.openProfileModal(row),
    });

    this.menuItems = items;
    menu.toggle(event);
  }

  openPaymentModal(row: MatriculaRow) {
    this.selectedRow = row;
    this.paymentModalVisible = true;
  }

  payByConvenio() {
    const studentId = this.selectedRow?.studentId;
    if (!studentId) return;
    this.paymentModalVisible = false;
    this.loading.set(true);
    this.treasuryService.createConvenio(studentId).subscribe({
      next: (res) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: res.message ?? 'Convenio registrado',
        });
        this.load();
      },
      error: (err) => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message ?? 'Error al registrar convenio',
        });
      },
    });
  }

  payTotal() {
    const studentId = this.selectedRow?.studentId;
    if (!studentId) return;
    this.paymentModalVisible = false;
    this.loading.set(true);
    this.treasuryService.completePayment(studentId).subscribe({
      next: (res) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: res.message ?? 'Pago total registrado',
        });
        this.load();
      },
      error: (err) => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message ?? 'Error al registrar pago total',
        });
      },
    });
  }

  confirmMatricular(row: MatriculaRow) {
    this.confirmationService.confirm({
      message: `¿Matricular a ${this.fullName(row)}? Se registrará la matrícula del estudiante.`,
      header: 'Confirmar Matrícula',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, Matricular',
      rejectLabel: 'Cancelar',
      accept: () => this.doMatricular(row.studentId),
    });
  }

  private doMatricular(studentId: string) {
    this.loading.set(true);
    this.treasuryService.matricular(studentId).subscribe({
      next: (res) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: res.message ?? 'Estudiante matriculado',
        });
        this.students.update((list) =>
          list.map((s) =>
            s.studentId === studentId
              ? { ...s, status: s.enrolled ? 'convenio' : 'no_paga' }
              : s,
          ),
        );
        this.load();
      },
      error: (err) => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message ?? 'Error al matricular',
        });
      },
    });
  }

  confirmRegisterAbono(row: MatriculaRow) {
    this.confirmationService.confirm({
      message: `¿Registrar abono para ${this.fullName(row)}? Se incrementará una cuota.`,
      header: 'Confirmar Abono',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, Registrar',
      rejectLabel: 'Cancelar',
      accept: () => this.doRegisterAbono(row.studentId),
    });
  }

  private doRegisterAbono(studentId: string) {
    this.loading.set(true);
    this.treasuryService.registerPayment(studentId).subscribe({
      next: (res) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: res.message ?? 'Abono registrado',
        });
        this.load();
      },
      error: (err) => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message ?? 'Error al registrar abono',
        });
      },
    });
  }

  openCertificateModal(row: MatriculaRow) {
    this.selectedRow = row;
    this.certificateModalVisible = true;
  }

  generateCertificateByType(type: 'matricula' | 'pago') {
    const student = this.selectedRow;
    if (!student) return;
    this.certificateModalVisible = false;
    this.loading.set(true);
    this.secretaryService
      .generateCertificate({ studentId: student.studentId, type })
      .subscribe({
        next: (res: any) => {
          this.loading.set(false);
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail:
              type === 'pago'
                ? 'Certificado de pago generado correctamente'
                : 'Certificado de matrícula generado correctamente',
          });
          const url = res.certificate?.pdfUrl;
          if (url) {
            const downloadUrl = url.includes('/image/upload/')
              ? url.replace('/image/upload/', '/image/upload/fl_attachment/')
              : url;
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `certificado-${type}-${student.studentId}.pdf`;
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
