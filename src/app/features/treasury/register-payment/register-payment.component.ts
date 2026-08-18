import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { TreasuryService, MatriculaRow } from '../../../core/services/treasury.service';
import { ConfirmationService, MessageService, MenuItem } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MenuModule } from 'primeng/menu';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-register-payment',
  imports: [
    TableModule,
    ButtonModule,
    ToastModule,
    CardModule,
    ConfirmDialogModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    MenuModule,
    FormsModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './register-payment.component.html',
  styleUrl: './register-payment.component.scss',
})
export class RegisterPaymentComponent implements OnInit {
  private treasuryService = inject(TreasuryService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  tuitions = signal<MatriculaRow[]>([]);
  loading = signal(true);
  searchTerm = '';
  searchVersion = signal(0);
  menuItems: MenuItem[] = [];
  selectedRow: MatriculaRow | null = null;

  filteredTuitions = computed(() => {
    this.searchVersion();
    const term = this.searchTerm.toLowerCase().trim();
    return this.tuitions().filter((t) => {
      if (!term) return true;
      return (
        t.studentId.toLowerCase().includes(term) ||
        t.firstName.toLowerCase().includes(term) ||
        t.lastName.toLowerCase().includes(term) ||
        this.fullName(t).toLowerCase().includes(term)
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

  confirmRegisterPayment(row: MatriculaRow) {
    this.confirmationService.confirm({
      message: `¿Registrar abono para ${this.fullName(row)}? Se incrementará una cuota.`,
      header: 'Confirmar Abono',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, Registrar',
      rejectLabel: 'Cancelar',
      accept: () => this.doRegisterPayment(row.studentId),
    });
  }

  private doRegisterPayment(studentId: string) {
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

  confirmConvenio(row: MatriculaRow) {
    this.confirmationService.confirm({
      message: `¿Crear convenio para ${this.fullName(row)}? Se establecerá un plan de 4 cuotas.`,
      header: 'Confirmar Convenio',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, Crear Convenio',
      rejectLabel: 'Cancelar',
      accept: () => this.doCreateConvenio(row.studentId),
    });
  }

  private doCreateConvenio(studentId: string) {
    this.loading.set(true);
    this.treasuryService.createConvenio(studentId).subscribe({
      next: (res) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: res.message ?? 'Convenio creado',
        });
        this.load();
      },
      error: (err) => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message ?? 'Error al crear convenio',
        });
      },
    });
  }

  confirmCompletePayment(row: MatriculaRow) {
    this.confirmationService.confirm({
      message: `¿Marcar pago total para ${this.fullName(row)}? Se cubrirán las 4 cuotas de la matrícula.`,
      header: 'Confirmar Pago Total',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, Pagar Total',
      rejectLabel: 'Cancelar',
      accept: () => this.doCompletePayment(row.studentId),
    });
  }

  private doCompletePayment(studentId: string) {
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

  isPaid(row: MatriculaRow): boolean {
    return row.status === 'pago_total';
  }

  showMenu(event: Event, menu: any, row: MatriculaRow) {
    event.stopPropagation();
    this.selectedRow = row;
    this.menuItems = [
      {
        label: 'Registrar Abono',
        icon: 'pi pi-plus',
        command: () => this.confirmRegisterPayment(row),
      },
      {
        label: 'Convenio',
        icon: 'pi pi-file-edit',
        command: () => this.confirmConvenio(row),
      },
      {
        label: 'Pago Total',
        icon: 'pi pi-check-circle',
        command: () => this.confirmCompletePayment(row),
      },
    ];
    menu.toggle(event);
  }
}
