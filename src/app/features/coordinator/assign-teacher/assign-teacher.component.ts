import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CoordinatorService } from '../../../core/services/coordinator.service';
import { MessageService } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { CardModule } from 'primeng/card';
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
    SelectModule,
  ],
  providers: [MessageService],
  templateUrl: './assign-teacher.component.html',
  styleUrl: './assign-teacher.component.scss',
})
export class AssignTeacherComponent {
  private formBuilder = inject(FormBuilder);
  private coordinatorService = inject(CoordinatorService);
  private userService = inject(UserService);
  private messageService = inject(MessageService);

  loading = signal(false);
  teachers = signal<any[]>([]);
  subjects = signal<any[]>([]);

  form = this.formBuilder.group({
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






