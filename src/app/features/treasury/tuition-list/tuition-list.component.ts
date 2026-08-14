import { Component, inject, signal, OnInit } from '@angular/core';
import { TreasuryService, MatriculaRow } from '../../../core/services/treasury.service';
import { MessageService, ConfirmationService, MenuItem } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { CardModule } from 'primeng/card';
import { MenuModule } from 'primeng/menu';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

@Component({
  selector: 'app-tuition-list',
  imports: [TableModule, TagModule, ButtonModule, ToastModule, CardModule, MenuModule, ConfirmDialogModule],
  providers: [MessageService, ConfirmationService],
  templateUrl: './tuition-list.component.html',
  styleUrl: './tuition-list.component.scss',
})
export class TuitionListComponent implements OnInit {
  private treasuryService = inject(TreasuryService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  tuitions = signal<MatriculaRow[]>([]);
  loading = signal(true);
  menuItems: MenuItem[] = [];
  selectedRow: MatriculaRow | null = null;

  ngOnInit() {
    this.load();
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

  statusLabel(s: string): string {
    return s === 'pago_total'
      ? 'Pagado Total'
      : s === 'convenio'
        ? 'Convenio'
        : s === 'pendiente'
          ? 'Pendiente'
          : 'No paga';
  }

  statusSeverity(s: string): 'success' | 'warn' | 'danger' | 'info' {
    return s === 'pago_total'
      ? 'success'
      : s === 'convenio'
        ? 'info'
        : s === 'pendiente'
          ? 'warn'
          : 'danger';
  }

  showMenu(event: Event, menu: any, row: MatriculaRow) {
    event.stopPropagation();
    this.selectedRow = row;
    this.menuItems = [
      {
        label: 'Pago Completo',
        icon: 'pi pi-check-circle',
        command: () => this.confirmComplete(),
      },
      {
        label: 'Convenio',
        icon: 'pi pi-file-edit',
        command: () => this.confirmConvenio(),
      },
    ];
    menu.toggle(event);
  }

  confirmComplete() {
    const row = this.selectedRow;
    if (!row) {
      return;
    }
    this.confirmationService.confirm({
      message: `¿Marcar como pago completo a ${this.fullName(row)}? Se bloquearán los abonos de esta matrícula.`,
      header: 'Confirmar Pago Completo',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, Pagar Completo',
      rejectLabel: 'Cancelar',
      accept: () => this.doComplete(row),
    });
  }

  confirmConvenio() {
    const row = this.selectedRow;
    if (!row) {
      return;
    }
    this.confirmationService.confirm({
      message: `¿Crear convenio de 4 cuotas para ${this.fullName(row)}?`,
      header: 'Confirmar Convenio',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, Crear Convenio',
      rejectLabel: 'Cancelar',
      accept: () => this.doConvenio(row),
    });
  }

  doComplete(row: MatriculaRow) {
    this.loading.set(true);
    this.treasuryService.completePayment(row.studentId).subscribe({
      next: (res) => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: res.message });
        this.load();
      },
      error: (err) => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message ?? 'No se pudo marcar el pago completo',
        });
      },
    });
  }

  doConvenio(row: MatriculaRow) {
    this.loading.set(true);
    this.treasuryService.createConvenio(row.studentId).subscribe({
      next: (res) => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: res.message });
        this.load();
      },
      error: (err) => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message ?? 'No se pudo crear el convenio',
        });
      },
    });
  }
}
