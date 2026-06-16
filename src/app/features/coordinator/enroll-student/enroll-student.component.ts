import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CoordinatorService } from '../../../core/services/coordinator.service';
import { MessageService } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { CardModule } from 'primeng/card';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-enroll-student',
  imports: [
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    ToastModule,
    CardModule,
    CommonModule,
  ],
  providers: [MessageService],
  template: `
    <p-toast />
    <p-card header="Matricular Estudiante">
      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <div class="field">
          <label for="studentId">Cédula del Estudiante</label>
          <input id="studentId" pInputText formControlName="studentId" placeholder="0000000000" />
          @if (studentId.invalid && studentId.touched) {
            <small class="p-error">Debe tener exactamente 10 dígitos.</small>
          }
        </div>

        <p-button
          type="submit"
          label="Matricular"
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
    </style>
  `,
})
export class EnrollStudentComponent {
  private fb = inject(FormBuilder);
  private coordinatorService = inject(CoordinatorService);
  private messageService = inject(MessageService);

  loading = signal(false);

  form = this.fb.nonNullable.group({
    studentId: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
  });

  get studentId() {
    return this.form.controls.studentId;
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.coordinatorService.enrollStudent(this.form.value.studentId!).subscribe({
      next: (res) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: res.message ?? 'Estudiante matriculado',
        });
        this.form.reset();
        this.loading.set(false);
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
}
