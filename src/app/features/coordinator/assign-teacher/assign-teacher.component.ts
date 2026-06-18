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
  selector: 'app-assign-teacher',
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
    <p-card header="Asignar Docente a Materia">
      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <div class="grid">
          <div class="col-12 md:col-6">
            <div class="field">
              <label for="teacherId">Seleccione un Docente</label>
              <p-select
                id="teacherId"
                [options]="teachers()"
                formControlName="teacherId"
                optionLabel="fullName"
                optionValue="id"
                placeholder="Seleccione un docente"
                [filter]="true"
                filterBy="fullName"
                [showClear]="true"
              ></p-select>
              @if (teacherId.invalid && teacherId.touched) {
                <small class="p-error">Debe seleccionar un docente.</small>
              }
            </div>
          </div>
          <div class="col-12 md:col-6">
            <div class="field">
              <label for="subjectId">Seleccione la Materia</label>
              <p-select
                id="subjectId"
                [options]="subjects()"
                formControlName="subjectId"
                optionLabel="name"
                optionValue="id"
                placeholder="Seleccione una materia"
                [filter]="true"
                filterBy="name"
                [showClear]="true"
              ></p-select>
              @if (subjectId.invalid && subjectId.touched) {
                <small class="p-error">Debe seleccionar una materia.</small>
              }
            </div>
          </div>
        </div>

        <p-button type="submit" label="Asignar Docente" [loading]="loading()" [disabled]="form.invalid" />
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
export class AssignTeacherComponent {
  private fb = inject(FormBuilder);
  private coordinatorService = inject(CoordinatorService);
  private userService = inject(UserService);
  private messageService = inject(MessageService);

  loading = signal(false);
  teachers = signal<any[]>([]);
  subjects = signal<any[]>([]);

  form = this.fb.nonNullable.group({
    teacherId: ['', Validators.required],
    subjectId: ['', Validators.required],
  });

  constructor() {
    this.loadData();
  }

  loadData() {
    // Load Teachers
    this.userService.getUsers(1, 1000, 'teacher').subscribe((res) => {
      const mapped = res.data.map((u) => ({ ...u, fullName: `${u.firstName} ${u.lastName} (${u.id})` }));
      this.teachers.set(mapped);
    });

    // Load Subjects
    this.coordinatorService.getSubjects().subscribe((res) => {
      this.subjects.set(res.subjects);
    });
  }

  get teacherId() {
    return this.form.controls.teacherId;
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
    this.coordinatorService.assignTeacher(this.form.value as any).subscribe({
      next: (res) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: res.message ?? 'Docente asignado',
        });
        this.form.reset();
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message ?? 'Error al asignar docente',
        });
      },
    });
  }
}
