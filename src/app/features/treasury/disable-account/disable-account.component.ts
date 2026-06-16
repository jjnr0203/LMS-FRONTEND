import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TreasuryService } from '../../../core/services/treasury.service';
import { MessageService, ConfirmationService } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { CardModule } from 'primeng/card';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-disable-account',
  imports: [
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    ToastModule,
    ConfirmDialogModule,
    CardModule,
    CommonModule,
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <p-toast />
    <p-confirmDialog />
    <p-card header="Deshabilitar Cuenta">
      <div class="alert">
        <i class="pi pi-exclamation-triangle" style="color:#eab308; font-size:1.25rem"></i>
        <span
          >Esta acción deshabilitará el acceso del estudiante al sistema. Solo funciona si la
          matrícula está en estado <strong>no paga</strong>.</span
        >
      </div>

      <form [formGroup]="form" (ngSubmit)="confirm()">
        <div class="field">
          <label for="studentId">Cédula del Estudiante</label>
          <input id="studentId" pInputText formControlName="studentId" placeholder="0000000000" />
          @if (studentId.invalid && studentId.touched) {
            <small class="p-error">Debe tener exactamente 10 dígitos.</small>
          }
        </div>

        <p-button
          type="submit"
          label="Deshabilitar"
          severity="danger"
          [loading]="loading()"
          [disabled]="form.invalid"
        />
      </form>
    </p-card>

    <style>
      .field {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
        margin-bottom: 1rem;
        max-width: 400px;
      }
      .field label {
        font-weight: 600;
        font-size: 0.85rem;
        color: #334155;
      }
      .alert {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        background: #fefce8;
        border: 1px solid #fde68a;
        border-radius: 8px;
        margin-bottom: 1.5rem;
        font-size: 0.875rem;
        color: #713f12;
      }
    </style>
  `,
})
export class DisableAccountComponent {
  private fb = inject(FormBuilder);
  private treasuryService = inject(TreasuryService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  loading = signal(false);

  form = this.fb.nonNullable.group({
    studentId: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
  });

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
