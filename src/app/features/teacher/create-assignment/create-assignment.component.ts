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
  templateUrl: 'create-assignment.component.html',
  imports: [
    ReactiveFormsModule,
    InputTextModule,
    InputNumberModule,
    ButtonModule,
    ToastModule,
    CardModule,
    DatePickerModule,
  ],
  providers: [MessageService],
})
export class CreateAssignmentComponent {
  private formBuilder = inject(FormBuilder);
  private teacherService = inject(TeacherService);
  private messageService = inject(MessageService);

  loading = signal(false);

  form = this.formBuilder.group({
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






