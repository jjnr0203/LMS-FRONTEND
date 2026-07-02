import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TeacherService } from '../../../core/services/teacher.service';
import { MessageService } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-grade-submission',
  imports: [
    ReactiveFormsModule,
    InputTextModule,
    InputNumberModule,
    ButtonModule,
    ToastModule,
    CardModule,
  ],
  providers: [MessageService],
  templateUrl: './grade-submission.component.html',
  styleUrl: './grade-submission.component.scss',
})
export class GradeSubmissionComponent {
  private formBuilder = inject(FormBuilder);
  private teacherService = inject(TeacherService);
  private messageService = inject(MessageService);

  loading = signal(false);

  form = this.formBuilder.group({
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






