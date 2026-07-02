import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TeacherService } from '../../../core/services/teacher.service';
import { MessageService } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { CardModule } from 'primeng/card';
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
    SelectModule,
  ],
  providers: [MessageService],
  templateUrl: './enroll-student-subject.component.html',
  styleUrl: './enroll-student-subject.component.scss',
})
export class EnrollStudentSubjectComponent {
  private formBuilder = inject(FormBuilder);
  private teacherService = inject(TeacherService);
  private userService = inject(UserService);
  private coordinatorService = inject(CoordinatorService);
  private messageService = inject(MessageService);

  loading = signal(false);
  students = signal<any[]>([]);
  subjects = signal<any[]>([]);

  form = this.formBuilder.group({
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






