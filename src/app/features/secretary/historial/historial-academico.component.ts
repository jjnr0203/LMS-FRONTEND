import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SecretaryService } from '../../../core/services/secretary.service';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { AcademicHistory } from '../../../core/models';

@Component({
  selector: 'app-historial-academico',
  imports: [
    ReactiveFormsModule,
    ToastModule,
    CardModule,
    InputTextModule,
    ButtonModule,
    TableModule,
    TagModule,
  ],
  providers: [MessageService],
  templateUrl: './historial-academico.component.html',
  styleUrl: './historial-academico.component.scss',
})
export class HistorialAcademicoComponent {
  private formBuilder = inject(FormBuilder);
  private secretaryService = inject(SecretaryService);
  private messageService = inject(MessageService);

  history = signal<AcademicHistory | null>(null);
  loading = signal(false);

  form = this.formBuilder.group({
    studentId: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
  });

  get studentId() { return this.form.controls.studentId; }

  search() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.secretaryService.getAcademicHistory(this.form.value.studentId!).subscribe({
      next: (data) => {
        this.history.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.history.set(null);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message ?? 'Estudiante no encontrado' });
      },
    });
  }
}
