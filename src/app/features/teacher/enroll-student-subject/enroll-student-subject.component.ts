import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TeacherService } from '../../../core/services/teacher.service';
import { MessageService } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { CardModule } from 'primeng/card';
import { CommonModule } from '@angular/common';
import { SelectModule } from 'primeng/select';
import { UserService } from '../../../core/services/user.service';
import { CoordinatorService } from '../../../core/services/coordinator.service';

@Component({
  selector: 'app-enroll-student-subject',
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
    <div class="page-container">
      <!-- Dark Header -->
      <div class="page-header">
        <div class="header-content">
          <h1 class="title">Inscribir Alumno en Materia</h1>
          <p class="description">
            Inscribe a un estudiante en la lista de tu materia para que pueda ver y enviar tareas.
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

            <p-button type="submit" label="Inscribir" [loading]="loading()" [disabled]="form.invalid" />
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
export class EnrollStudentSubjectComponent {
  private fb = inject(FormBuilder);
  private teacherService = inject(TeacherService);
  private userService = inject(UserService);
  private coordinatorService = inject(CoordinatorService);
  private messageService = inject(MessageService);

  loading = signal(false);
  students = signal<any[]>([]);
  subjects = signal<any[]>([]);

  form = this.fb.nonNullable.group({
    studentId: ['', Validators.required],
    subjectId: ['', Validators.required],
  });

  constructor() {
    this.loadData();
  }

  loadData() {
    this.userService.getUsers(1, 1000, 'student').subscribe((res) => {
      const mapped = res.data.map((u) => ({ ...u, fullName: `${u.firstName} ${u.lastName} (${u.id})` }));
      this.students.set(mapped);
    });

    this.coordinatorService.getSubjects().subscribe((res) => {
      this.subjects.set(res.subjects);
    });
  }

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






