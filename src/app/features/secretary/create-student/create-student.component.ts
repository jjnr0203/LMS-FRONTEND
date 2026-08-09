import { Component, inject, signal, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SecretaryService } from '../../../core/services/secretary.service';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-create-student',
  imports: [ReactiveFormsModule, ToastModule, CardModule, InputTextModule, SelectModule, ButtonModule],
  providers: [MessageService],
  templateUrl: './create-student.component.html',
  styleUrl: './create-student.component.scss',
})
export class CreateStudentComponent {
  private formBuilder = inject(FormBuilder);
  private secretaryService = inject(SecretaryService);
  private messageService = inject(MessageService);

  isModal = input<boolean>(false);
  userCreated = output<void>();

  loading = signal(false);
  submitted = signal(false);
  careers = signal<any[]>([]);

  form = this.formBuilder.group({
    firstName: [
      '',
      [Validators.required, Validators.maxLength(20), Validators.pattern(/^[A-Za-zÁÉÍÓÚáéíóúñÑ ]+$/)],
    ],
    lastName: [
      '',
      [Validators.required, Validators.maxLength(20), Validators.pattern(/^[A-Za-zÁÉÍÓÚáéíóúñÑ ]+$/)],
    ],
    email: ['', [Validators.required, Validators.email]],
    studentId: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
    careerId: ['', Validators.required],
  });

  constructor() {
    this.secretaryService.getCareers().subscribe({
      next: (data) => this.careers.set(data),
      error: (err) => console.error('Failed to load careers', err),
    });
  }

  filterNumbers(event: any, controlName: string) {
    const value = event.target.value;
    const filteredValue = value.replace(/[^0-9]/g, '');
    if (value !== filteredValue) {
      this.form.get(controlName)?.setValue(filteredValue);
    }
  }

  filterLetters(event: any, controlName: string) {
    const value = event.target.value;
    const filteredValue = value.replace(/[^A-Za-zÁÉÍÓÚáéíóúñÑ ]/g, '');
    if (value !== filteredValue) {
      this.form.get(controlName)?.setValue(filteredValue);
    }
  }

  get firstName() { return this.form.controls.firstName; }
  get lastName() { return this.form.controls.lastName; }
  get email() { return this.form.controls.email; }
  get studentId() { return this.form.controls.studentId; }
  get careerId() { return this.form.controls.careerId; }

  get hasEmptyRequiredFields() {
    if (!this.form) return true;
    const c = this.form.controls;
    return !c.studentId.value || !c.firstName.value || !c.lastName.value || !c.email.value || !c.careerId.value;
  }

  onSubmit() {
    this.submitted.set(true);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Por favor, corrija los errores en el formulario',
      });
      return;
    }

    this.loading.set(true);
    this.secretaryService.createInscription(this.form.value as any).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Estudiante inscrito correctamente' });
        this.form.reset();
        this.submitted.set(false);
        this.loading.set(false);
        this.userCreated.emit();
      },
      error: (err) => {
        this.loading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message ?? 'Error al inscribir estudiante' });
      },
    });
  }
}
