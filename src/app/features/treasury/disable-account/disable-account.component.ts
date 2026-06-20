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
    CommonModule,
    SelectModule,
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <p-toast />
    <p-confirmDialog />
    <div class="page-container">
      <!-- Dark Header -->
      <div class="page-header">
        <div class="header-content">
          <h1 class="title">Deshabilitar Cuenta</h1>
          <p class="description">
            Bloquea el acceso al sistema para un estudiante.
          </p>
        </div>
      </div>

      <!-- Content -->
      <div class="content-wrapper">
        <div class="data-card">
          <div class="alert">
            <i class="pi pi-exclamation-triangle" style="color:#eab308; font-size:1.25rem"></i>
            <span
              >Esta acción deshabilitará el acceso del estudiante al sistema. Solo funciona si la
              matrícula está en estado <strong>no paga</strong>.</span
            >
          </div>

          <form [formGroup]="form" (ngSubmit)="confirm()">
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
              label="Deshabilitar"
              severity="danger"
              [loading]="loading()"
              [disabled]="form.invalid"
            />
          </form>
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
      .alert {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        background: #fefce8;
        border: 1px solid #fde68a;
        border-radius: 6px;
        margin-bottom: 1.5rem;
        font-size: 0.875rem;
        color: #713f12;
      }
    `
  ]
})
export class DisableAccountComponent {
  private fb = inject(FormBuilder);
  private treasuryService = inject(TreasuryService);
  private userService = inject(UserService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  loading = signal(false);
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






