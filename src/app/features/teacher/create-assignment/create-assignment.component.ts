import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TeacherService } from '../../../core/services/teacher.service';
import { MessageService } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { CardModule } from 'primeng/card';
import { DatePickerModule } from 'primeng/datepicker';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-create-assignment',
  imports: [
    ReactiveFormsModule,
    InputTextModule,
    InputNumberModule,
    ButtonModule,
    ToastModule,
    CardModule,
    DatePickerModule,
    CommonModule,
  ],
  providers: [MessageService],
  template: `
    <p-toast />
    <div class="page-container">
      <!-- Dark Header -->
      <div class="page-header">
        <div class="header-content">
          <h1 class="title">Crear Tarea</h1>
          <p class="description">
            Configura una nueva tarea o evaluación para tus estudiantes.
          </p>
        </div>
      </div>

      <!-- Content -->
      <div class="content-wrapper">
        <div class="data-card">
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <div class="grid">
              <div class="col-12 md:col-6">
                <div class="field">
                  <label for="title">Título</label>
                  <input id="title" pInputText formControlName="title" />
                  @if (title.invalid && title.touched) {
                    <small class="p-error">Requerido.</small>
                  }
                </div>
              </div>
              <div class="col-12 md:col-6">
                <div class="field">
                  <label for="subjectId">ID de la Materia</label>
                  <input id="subjectId" pInputText formControlName="subjectId" />
                  @if (subjectId.invalid && subjectId.touched) {
                    <small class="p-error">Requerido.</small>
                  }
                </div>
              </div>
              <div class="col-12">
                <div class="field">
                  <label for="description">Descripción</label>
                  <input id="description" pInputText formControlName="description" />
                </div>
              </div>
              <div class="col-12 md:col-6">
                <div class="field">
                  <label for="dueDate">Fecha de Entrega</label>
                  <p-datePicker
                    id="dueDate"
                    formControlName="dueDate"
                    [showTime]="true"
                    dateFormat="yy-mm-dd"
                  />
                  @if (dueDate.invalid && dueDate.touched) {
                    <small class="p-error">Requerida.</small>
                  }
                </div>
              </div>
              <div class="col-12 md:col-6">
                <div class="field">
                  <label for="maxScore">Puntaje Máximo</label>
                  <p-inputNumber id="maxScore" formControlName="maxScore" [min]="1" [max]="100" />
                  @if (maxScore.invalid && maxScore.touched) {
                    <small class="p-error">Debe ser entre 1 y 100.</small>
                  }
                </div>
              </div>
            </div>

            <p-button
              type="submit"
              label="Crear Tarea"
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
    `
  ]
})
export class CreateAssignmentComponent {
  private fb = inject(FormBuilder);
  private teacherService = inject(TeacherService);
  private messageService = inject(MessageService);

  loading = signal(false);

  form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    description: [''],
    subjectId: ['', Validators.required],
    dueDate: [new Date(), Validators.required],
    maxScore: [10, [Validators.required, Validators.min(1), Validators.max(100)]],
  });

  get title() {
    return this.form.controls.title;
  }
  get subjectId() {
    return this.form.controls.subjectId;
  }
  get description() {
    return this.form.controls.description;
  }
  get dueDate() {
    return this.form.controls.dueDate;
  }
  get maxScore() {
    return this.form.controls.maxScore;
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const value = this.form.value;
    const payload = {
      ...value,
      dueDate: value.dueDate instanceof Date ? value.dueDate.toISOString() : value.dueDate,
    };

    this.teacherService.createAssignment(payload as any).subscribe({
      next: (res) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: res.message ?? 'Tarea creada',
        });
        this.form.reset();
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message ?? 'Error al crear tarea',
        });
      },
    });
  }
}






