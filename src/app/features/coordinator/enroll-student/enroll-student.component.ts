import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CoordinatorService } from '../../../core/services/coordinator.service';
import { MessageService } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { CardModule } from 'primeng/card';
import { CommonModule } from '@angular/common';
import { SelectModule } from 'primeng/select';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-enroll-student',
  imports: [
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    ToastModule,
    CardModule,
    CommonModule,
    SelectModule,
  ],
  providers: [MessageService],
  template: `
    <p-toast />
    <p-card header="Matricular Estudiante">
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
  private userService = inject(UserService);
  private messageService = inject(MessageService);

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
