import { Component, inject, signal, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';

function pastDateValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  const selectedDate = new Date(control.value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (selectedDate >= today) {
    return { invalidDate: true };
  }
  return null;
}

function ecuadorianCedulaValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  const cedula = control.value;
  
  if (cedula.length !== 10) return { invalidCedula: true };
  if (!/^\d{10}$/.test(cedula)) return { invalidCedula: true };
  
  const provincia = Number(cedula.substring(0, 2));
  if (provincia < 1 || provincia > 24) return { invalidCedula: true };
  
  const tercerDigito = Number(cedula.substring(2, 3));
  if (tercerDigito >= 6) return { invalidCedula: true };
  
  const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  const verificador = Number(cedula.substring(9, 10));
  
  let suma = 0;
  for (let i = 0; i < 9; i++) {
    let valor = Number(cedula.substring(i, i + 1)) * coeficientes[i];
    if (valor > 9) valor -= 9;
    suma += valor;
  }
  
  const digitoCalculado = (suma % 10 === 0) ? 0 : 10 - (suma % 10);
  
  if (digitoCalculado !== verificador) {
    return { invalidCedula: true };
  }
  
  return null;
}
import { AdminService } from '../../../core/services/admin.service';
import { MessageService } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { CardModule } from 'primeng/card';
import { MultiSelectModule } from 'primeng/multiselect';
import { AcademicService } from '../../../core/services/academic.service';

@Component({
  selector: 'app-create-user',
  imports: [
    ReactiveFormsModule,
    InputTextModule,
    SelectModule,
    ButtonModule,
    ToastModule,
    CardModule,
    MultiSelectModule,
  ],
  providers: [MessageService],
  templateUrl: 'create-user.component.html',
  styleUrl: 'create-user.component.scss',
})
export class CreateUserComponent {
  private formBuilder = inject(FormBuilder);
  private adminService = inject(AdminService);
  private messageService = inject(MessageService);
  private academicService = inject(AcademicService);

  isModal = input<boolean>(false);
  userCreated = output<void>();

  loading = signal(false);
  submitted = signal(false);
  faculties = signal<any[]>([]);

  roles = [
    { label: 'Administrador', value: 'admin' },
    { label: 'Recursos Humanos', value: 'human_resources' },
  ];

  form = this.formBuilder.group({
    id: ['', [Validators.required, Validators.pattern(/^\d{10}$/), ecuadorianCedulaValidator]],
    firstName: ['', [Validators.required, Validators.maxLength(20), Validators.pattern(/^[A-Za-zÁÉÍÓÚáéíóúñÑ ]+$/)]],
    lastName: ['', [Validators.required, Validators.maxLength(20), Validators.pattern(/^[A-Za-zÁÉÍÓÚáéíóúñÑ ]+$/)]],
    email: ['', [Validators.required, Validators.email, Validators.pattern(/^.+@.+\.com$/), Validators.maxLength(40)]],
    birthDate: ['', [Validators.required, pastDateValidator]],
    phone: ['', [Validators.pattern(/^[0-9]+$/), Validators.maxLength(10)]],
    roleName: ['', Validators.required],
    facultyIds: [[] as string[]],
  });

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

  constructor() {
    this.academicService.getFaculties().subscribe({
      next: (data) => this.faculties.set(data),
      error: (err) => console.error('Failed to load faculties', err),
    });
  }

  get id() { return this.form.controls.id; }
  get firstName() { return this.form.controls.firstName; }
  get lastName() { return this.form.controls.lastName; }
  get email() { return this.form.controls.email; }
  get roleName() { return this.form.controls.roleName; }
  get birthDate() { return this.form.controls.birthDate; }
  get phone() { return this.form.controls.phone; }
  get facultyIds() { return this.form.controls.facultyIds; }

  get hasEmptyRequiredFields() {
    const c = this.form.controls;
    return !c.id.value || !c.firstName.value || !c.lastName.value || !c.email.value || !c.roleName.value || !c.birthDate.value;
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
    const payload: any = { ...this.form.value };
    if (!payload.birthDate) {
      delete payload.birthDate;
    } else {
      payload.birthDate = new Date(payload.birthDate).toISOString();
    }
    if (!payload.phone) {
      delete payload.phone;
    }

    this.adminService.createUser(payload).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Usuario creado correctamente',
        });
        this.form.reset();
        this.loading.set(false);
        this.userCreated.emit();
      },
      error: (err) => {
        this.loading.set(false);
        const detail = err.error?.message ?? 'Error al crear usuario';
        this.messageService.add({ severity: 'error', summary: 'Error', detail });
      },
    });
  }
}
