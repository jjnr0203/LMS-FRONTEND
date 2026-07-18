import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SecretaryService } from '../../../core/services/secretary.service';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-certificados',
  imports: [
    ReactiveFormsModule,
    ToastModule,
    CardModule,
    InputTextModule,
    SelectModule,
    ButtonModule,
    TableModule,
    TagModule,
  ],
  providers: [MessageService],
  templateUrl: './certificados.component.html',
  styleUrl: './certificados.component.scss',
})
export class CertificadosComponent {
  private formBuilder = inject(FormBuilder);
  private secretaryService = inject(SecretaryService);
  private messageService = inject(MessageService);

  certificates = signal<any[]>([]);
  loading = signal(false);

  certificateTypes = [
    { label: 'Matrícula', value: 'matricula' },
    { label: 'Estudios', value: 'estudios' },
    { label: 'Notas', value: 'notas' },
    { label: 'Egreso', value: 'egreso' },
  ];

  form = this.formBuilder.group({
    studentId: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
    type: ['', Validators.required],
  });

  searchForm = this.formBuilder.group({
    studentId: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
  });

  get studentId() { return this.form.controls.studentId; }
  get type() { return this.form.controls.type; }

  generate() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.secretaryService.generateCertificate(this.form.value as any).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Certificado generado correctamente' });
        this.loading.set(false);
        this.searchCertificates();
      },
      error: (err) => {
        this.loading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message ?? 'Error al generar certificado' });
      },
    });
  }

  searchCertificates() {
    const studentId = this.searchForm.value.studentId || this.form.value.studentId;
    if (!studentId) return;
    this.secretaryService.listCertificates(studentId).subscribe({
      next: (res) => this.certificates.set(res.certificates),
      error: () => {},
    });
  }

  getTypeLabel(type: string): string {
    switch (type) {
      case 'matricula': return 'Matrícula';
      case 'estudios': return 'Estudios';
      case 'notas': return 'Notas';
      case 'egreso': return 'Egreso';
      default: return type;
    }
  }
}
