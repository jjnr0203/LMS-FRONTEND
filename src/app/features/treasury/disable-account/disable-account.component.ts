import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TreasuryService } from '../../../core/services/treasury.service';
import { MessageService, ConfirmationService } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { CardModule } from 'primeng/card';
import { SelectModule } from 'primeng/select';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-disable-account',
  imports: [
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    ToastModule,
    ConfirmDialogModule,
    CardModule,
    SelectModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './disable-account.component.html',
  styleUrl: './disable-account.component.scss',
})
export class DisableAccountComponent {
  private formBuilder = inject(FormBuilder);
  private treasuryService = inject(TreasuryService);
  private userService = inject(UserService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  loading = signal(false);
  students = signal<any[]>([]);

  form = this.formBuilder.group({
    studentId: ['', Validators.required],
  });

  constructor() {
    this.loadData();
  }

  loadData() {
    this.userService.getUsers(1, 1000, 'student').subscribe((res) => {
      const mapped = res.data.map((u) => ({ ...u, fullName: `${u.firstName} ${u.lastName} (${u.id})` }));
      this.students.set(mapped);
    });
  }

  get studentId() {
    return this.form.controls.studentId;
  }

  confirm() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.confirmationService.confirm({
      message: `¿Está seguro de deshabilitar la cuenta del estudiante con cédula ${this.form.value.studentId}? Esta acción no se puede deshacer fácilmente.`,
      header: 'Confirmar Deshabilitación',
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.onSubmit(),
    });
  }

  onSubmit() {
    this.loading.set(true);
    this.treasuryService.disableAccount(this.form.value.studentId!).subscribe({
      next: (res) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: res.message ?? 'Cuenta deshabilitada',
        });
        this.form.reset();
        this.loading.set(false);
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






