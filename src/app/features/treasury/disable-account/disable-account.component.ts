import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { TreasuryService, OverdueStudent } from '../../../core/services/treasury.service';
import { ConfirmationService, MessageService, MenuItem } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MenuModule } from 'primeng/menu';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-disable-account',
  imports: [
    TableModule,
    ButtonModule,
    ToastModule,
    CardModule,
    TagModule,
    ConfirmDialogModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    MenuModule,
    FormsModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './disable-account.component.html',
  styleUrl: './disable-account.component.scss',
})
export class DisableAccountComponent implements OnInit {
  private treasuryService = inject(TreasuryService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  students = signal<OverdueStudent[]>([]);
  loading = signal(true);
  searchTerm = '';
  searchVersion = signal(0);
  menuItems: MenuItem[] = [];

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
    this.treasuryService.getOverdueStudents().subscribe({
      next: (res) => {
        this.students.set(res.data);
        this.loading.set(false);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los estudiantes con deuda',
        });
        this.loading.set(false);
      },
    });
  }

  fullName(row: OverdueStudent): string {
    return `${row.firstName} ${row.lastName}`;
  }

  showMenu(event: Event, menu: any, row: OverdueStudent) {
    event.stopPropagation();
    this.menuItems = [
      {
        label: 'Deshabilitar Cuenta',
        icon: 'pi pi-ban',
        styleClass: 'text-red-500',
        command: () => this.confirmDisable(row),
      },
    ];
    menu.toggle(event);
  }

  confirmDisable(row: OverdueStudent) {
    this.confirmationService.confirm({
      message: `¿Está seguro de deshabilitar la cuenta de ${this.fullName(row)} (${row.studentId})? Esta acción no se puede deshacer fácilmente.`,
      header: 'Confirmar Deshabilitación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, Deshabilitar',
      rejectLabel: 'Cancelar',
      accept: () => this.doDisable(row.studentId),
    });
  }

  private doDisable(studentId: string) {
    this.loading.set(true);
    this.treasuryService.disableAccount(studentId).subscribe({
      next: (res) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: res.message ?? 'Cuenta deshabilitada',
        });
        this.load();
      },
      error: (err) => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message ?? 'Error al deshabilitar',
        });
      },
    });
  }
}
