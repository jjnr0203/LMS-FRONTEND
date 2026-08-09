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

@Component({
  selector: 'app-certificados',
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
  templateUrl: './certificados.component.html',
  styleUrl: './certificados.component.scss',
})
export class CertificadosComponent {
  private formBuilder = inject(FormBuilder);
  private secretaryService = inject(SecretaryService);
  private messageService = inject(MessageService);

  certificates = signal<any[]>([]);
  loading = signal(false);

  form = this.formBuilder.group({
    studentId: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
  });

  searchForm = this.formBuilder.group({
    studentId: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
  });

  get studentId() { return this.form.controls.studentId; }

  generate() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.secretaryService.generateCertificate({ studentId: this.form.value.studentId! }).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.certificate?.pdfUrl) {
          const url = res.certificate.pdfUrl;
          const downloadUrl = url.includes('/image/upload/')
            ? url.replace('/image/upload/', '/image/upload/fl_attachment/')
            : url;
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = `certificado-matricula-${res.certificate.studentId}.pdf`;
          document.body.appendChild(link);
          link.click();
          link.remove();
        }
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Certificado de matrícula generado correctamente' });
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
}
