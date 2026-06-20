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
    <div class="page-container">
      <!-- Dark Header -->
      <div class="page-header">
        <div class="header-content">
          <h1 class="title">Registrar Abono</h1>
          <p class="description">
            Registra un nuevo abono para la matrícula de un estudiante.
          </p>
        </div>
      </div>

      <!-- Content -->
      <div class="content-wrapper">
        <div class="data-card">
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
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .page-container {
        display: flex;
        flex-direction: column;
        margin-top: -1.5rem;
        margin-left: -1.5rem;
        margin-right: -1.5rem;
      }
      .page-header {
        background: #064e3b;
        color: #ffffff;
        border-bottom: none;
        padding: 2.5rem 2rem 5rem 2rem;
        min-height: 250px;
        box-sizing: border-box;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
      }
      .title {
        font-size: 2.2rem;
        font-weight: 600;
        margin: 0 0 0.5rem 0;
        letter-spacing: -0.02em;
        color: #ffffff;
      }
      .description {
        color: #d1fae5;
        font-size: 0.95rem;
        line-height: 1.5;
        margin: 0;
      }
      .content-wrapper {
        padding: 0 2rem;
        margin-top: -3.5rem;
      }
      .data-card {
        background: #ffffff;
        border-radius: 6px;
        padding: 1.5rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        max-width: 1200px;
        margin: 0 auto;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }
      .data-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
      }
      .field {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
        margin-bottom: 1rem;
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
        border-radius: 6px;
        border: 1px solid #e2e8f0;
      }
    `
  ]
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






