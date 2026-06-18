import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TreasuryService } from '../../../core/services/treasury.service';
import { Tuition } from '../../../core/models';
import { MessageService } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { CardModule } from 'primeng/card';
import { CommonModule } from '@angular/common';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-register-payment',
  imports: [
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    ToastModule,
    CardModule,
    CommonModule,
    TagModule,
    SelectModule,
  ],
  providers: [MessageService],
  template: `
    <p-toast />
    <p-card header="Registrar Abono">
      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <div class="field">
          <label for="studentId">Seleccione el Estudiante</label>
          <p-select
            id="studentId"
            [options]="students()"
            formControlName="studentId"
            optionLabel="fullName"
            optionValue="id"
            placeholder="Seleccione un estudiante"
            [filter]="true"
            filterBy="fullName"
            [showClear]="true"
          ></p-select>
          @if (studentId.invalid && studentId.touched) {
            <small class="p-error">Debe seleccionar un estudiante.</small>
          }
        </div>

        <p-button
          type="submit"
          label="Registrar Abono"
          [loading]="loading()"
          [disabled]="form.invalid"
        />
      </form>

      @if (result(); as r) {
        <div class="result-card">
          <h3>Resultado</h3>
          <p>
            <strong>Estado:</strong>
            <p-tag [value]="statusLabel(r.status)" [severity]="statusSeverity(r.status)" />
          </p>
          <p><strong>Cuotas pagadas:</strong> {{ r.paidInstallments }} / 4</p>
        </div>
      }
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
      .result-card {
        margin-top: 1.5rem;
        padding: 1rem;
        background: #f8fafc;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
      }
    </style>
  `,
})
export class RegisterPaymentComponent {
  private fb = inject(FormBuilder);
  private treasuryService = inject(TreasuryService);
  private userService = inject(UserService);
  private messageService = inject(MessageService);

  loading = signal(false);
  result = signal<Tuition | null>(null);
  students = signal<any[]>([]);

  form = this.fb.nonNullable.group({
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

  statusLabel(s: string): string {
    return s === 'pago_total' ? 'Pagado Total' : s === 'pendiente' ? 'Pendiente' : 'No paga';
  }

  statusSeverity(s: string): 'success' | 'warn' | 'danger' {
    return s === 'pago_total' ? 'success' : s === 'pendiente' ? 'warn' : 'danger';
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.result.set(null);
    this.treasuryService.registerPayment(this.form.value.studentId!).subscribe({
      next: (res) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: res.message ?? 'Abono registrado',
        });
        this.result.set(res.tuition);
        this.form.reset();
        this.loading.set(false);
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
}
