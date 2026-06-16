import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TeacherService } from '../../../core/services/teacher.service';
import { MessageService } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { CardModule } from 'primeng/card';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-enroll-student-subject',
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
    <p-card header="Inscribir Alumno en Materia">
      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <div class="grid">
          <div class="col-12 md:col-6">
            <div class="field">
              <label for="studentId">Cédula del Estudiante</label>
              <input
                id="studentId"
                pInputText
                formControlName="studentId"
                placeholder="0000000000"
              />
              @if (studentId.invalid && studentId.touched) {
                <small class="p-error">Debe tener exactamente 10 dígitos.</small>
              }
            </div>
          </div>
          <div class="col-12 md:col-6">
            <div class="field">
              <label for="subjectId">ID de la Materia</label>
              <input
                id="subjectId"
                pInputText
                formControlName="subjectId"
                placeholder="UUID de la materia"
              />
              @if (subjectId.invalid && subjectId.touched) {
                <small class="p-error">Requerido.</small>
              }
            </div>
          </div>
        </div>

        <p-button type="submit" label="Inscribir" [loading]="loading()" [disabled]="form.invalid" />
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
export class EnrollStudentSubjectComponent {
  private fb = inject(FormBuilder);
  private teacherService = inject(TeacherService);
  private messageService = inject(MessageService);

  loading = signal(false);

  form = this.fb.nonNullable.group({
    studentId: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
    subjectId: ['', Validators.required],
  });

  get studentId() {
    return this.form.controls.studentId;
  }
  get subjectId() {
    return this.form.controls.subjectId;
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.teacherService.enrollStudent(this.form.value as any).subscribe({
      next: (res) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: res.message ?? 'Alumno inscrito',
        });
        this.form.reset();
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message ?? 'Error al inscribir',
        });
      },
    });
  }
}
