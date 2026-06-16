import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TeacherService } from '../../../core/services/teacher.service';
import { MessageService } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { CardModule } from 'primeng/card';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-grade-submission',
  imports: [
    ReactiveFormsModule,
    InputTextModule,
    InputNumberModule,
    ButtonModule,
    ToastModule,
    CardModule,
    CommonModule,
  ],
  providers: [MessageService],
  template: `
    <p-toast />
    <p-card header="Calificar Entrega">
      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <div class="grid">
          <div class="col-12">
            <div class="field">
              <label for="submissionId">ID de la Entrega (Submission)</label>
              <input
                id="submissionId"
                pInputText
                formControlName="submissionId"
                placeholder="UUID de la entrega"
              />
              @if (submissionId.invalid && submissionId.touched) {
                <small class="p-error">Requerido.</small>
              }
            </div>
          </div>
          <div class="col-12 md:col-6">
            <div class="field">
              <label for="grade">Nota</label>
              <p-inputNumber
                id="grade"
                formControlName="grade"
                [min]="0"
                [max]="100"
                [minFractionDigits]="0"
                [maxFractionDigits]="2"
              />
              @if (grade.invalid && grade.touched) {
                <small class="p-error">Debe ser entre 0 y 100.</small>
              }
            </div>
          </div>
          <div class="col-12 md:col-6">
            <div class="field">
              <label for="feedback">Retroalimentación (opcional)</label>
              <input id="feedback" pInputText formControlName="feedback" />
            </div>
          </div>
        </div>

        <p-button type="submit" label="Calificar" [loading]="loading()" [disabled]="form.invalid" />
      </form>
    </p-card>

    <style>
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
    </style>
  `,
})
export class GradeSubmissionComponent {
  private fb = inject(FormBuilder);
  private teacherService = inject(TeacherService);
  private messageService = inject(MessageService);

  loading = signal(false);

  form = this.fb.nonNullable.group({
    submissionId: ['', Validators.required],
    grade: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
    feedback: [''],
  });

  get submissionId() {
    return this.form.controls.submissionId;
  }
  get grade() {
    return this.form.controls.grade;
  }
  get feedback() {
    return this.form.controls.feedback;
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.teacherService.gradeSubmission(this.form.value as any).subscribe({
      next: (res) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: res.message ?? 'Calificación registrada',
        });
        this.form.reset({ grade: 0, feedback: '' });
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message ?? 'Error al calificar',
        });
      },
    });
  }
}
