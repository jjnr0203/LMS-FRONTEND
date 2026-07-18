import { Component, inject, signal, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { MessageService } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
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
    PasswordModule,
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
  faculties = signal<any[]>([]);

  roles = [
    { label: 'Coordinador', value: 'coordinator' },
    { label: 'Tesorería', value: 'treasury' },
    { label: 'Docente', value: 'teacher' },
    { label: 'Secretaría', value: 'secretary' },
  ];

  form = this.formBuilder.group({
    id: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    birthDate: [''],
    phone: [''],
    roleName: ['', Validators.required],
    facultyIds: [[] as string[]],
  });

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
  get password() { return this.form.controls.password; }
  get roleName() { return this.form.controls.roleName; }
  get birthDate() { return this.form.controls.birthDate; }
  get phone() { return this.form.controls.phone; }
  get facultyIds() { return this.form.controls.facultyIds; }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
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
