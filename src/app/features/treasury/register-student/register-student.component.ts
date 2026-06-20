import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TreasuryService } from '../../../core/services/treasury.service';
import { MessageService } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { CardModule } from 'primeng/card';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register-student',
  imports: [
    ReactiveFormsModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    ToastModule,
    CardModule,
    CommonModule,
  ],
  providers: [MessageService],
  template: `
    <p-toast />
    <div class="page-container">
      <!-- Dark Header -->
      <div class="page-header">
        <div class="header-content">
          <h1 class="title">Registrar Estudiante</h1>
          <p class="description">
            Crea un nuevo perfil de estudiante en el sistema para que pueda acceder a los servicios educativos de la institución.
          </p>
        </div>
      </div>

      <!-- Main Content Card -->
      <div class="content-wrapper">
        <div class="data-card">
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <div class="grid">
              <div class="col-12 md:col-6">
                <div class="field">
                  <label for="id">Cédula (10 dígitos)</label>
                  <input id="id" pInputText formControlName="id" placeholder="0000000000" />
                  @if (id.invalid && id.touched) {
                    <small class="p-error">Debe tener exactamente 10 dígitos.</small>
                  }
                </div>
              </div>
              <div class="col-12 md:col-6">
                <div class="field">
                  <label for="email">Correo Electrónico</label>
                  <input id="email" pInputText formControlName="email" type="email" />
                  @if (email.invalid && email.touched) {
                    <small class="p-error">Correo inválido.</small>
                  }
                </div>
              </div>
              <div class="col-12 md:col-6">
                <div class="field">
                  <label for="firstName">Nombres</label>
                  <input id="firstName" pInputText formControlName="firstName" />
                  @if (firstName.invalid && firstName.touched) {
                    <small class="p-error">Requerido.</small>
                  }
                </div>
              </div>
              <div class="col-12 md:col-6">
                <div class="field">
                  <label for="lastName">Apellidos</label>
                  <input id="lastName" pInputText formControlName="lastName" />
                  @if (lastName.invalid && lastName.touched) {
                    <small class="p-error">Requerido.</small>
                  }
                </div>
              </div>
              <div class="col-12 md:col-6">
                <div class="field">
                  <label for="password">Contraseña</label>
                  <p-password
                    id="password"
                    formControlName="password"
                    [feedback]="false"
                    [toggleMask]="true"
                    styleClass="w-full"
                    inputStyleClass="w-full"
                  />
                  @if (password.invalid && password.touched) {
                    <small class="p-error">Mínimo 6 caracteres.</small>
                  }
                </div>
              </div>
              <div class="col-12 md:col-6">
                <div class="field">
                  <label for="birthDate">Fecha de Nacimiento (Opcional)</label>
                  <input id="birthDate" type="date" pInputText formControlName="birthDate" />
                </div>
              </div>
              <div class="col-12 md:col-6">
                <div class="field">
                  <label for="phone">Teléfono (Opcional)</label>
                  <input id="phone" type="tel" pInputText formControlName="phone" />
                </div>
              </div>
            </div>

            <div class="mt-4 flex justify-content-end">
              <p-button
                type="submit"
                label="Registrar Estudiante"
                icon="pi pi-check"
                [loading]="loading()"
                [disabled]="form.invalid"
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .page-container {
        display: flex;
        flex-direction: column;
        margin-top: -1.5rem;
        margin-left: -1.5rem;
        margin-right: -1.5rem;
      }
      .page-header {
        background: #064e3b;
        color: #ffffff;
        border-bottom: none;
        padding: 2.5rem 2rem 5rem 2rem;
        min-height: 250px;
        box-sizing: border-box;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
      }
      .title {
        font-size: 2.2rem;
        font-weight: 600;
        margin: 0 0 0.5rem 0;
        letter-spacing: -0.02em;
        color: #ffffff;
      }
      .description {
        color: #d1fae5;
        font-size: 0.95rem;
        line-height: 1.5;
        margin: 0;
      }
      .content-wrapper {
        padding: 0 2rem;
        margin-top: -3.5rem;
      }
      .data-card {
        background: #ffffff;
        border-radius: 6px;
        padding: 1.5rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        max-width: 1200px;
        margin: 0 auto;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }
      .data-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
      }
      .field {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
        margin-bottom: 1.5rem;
      }
      .field label {
        font-weight: 600;
        font-size: 0.85rem;
        color: #334155;
      }
      .mt-4 { margin-top: 2rem; }
      .flex { display: flex; }
      .justify-content-end { justify-content: flex-end; }
    `
  ],
})
export class RegisterStudentComponent {
  private fb = inject(FormBuilder);
  private treasuryService = inject(TreasuryService);
  private messageService = inject(MessageService);

  loading = signal(false);

  form = this.fb.nonNullable.group({
    id: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    birthDate: [''],
    phone: [''],
  });

  get id() {
    return this.form.controls.id;
  }
  get firstName() {
    return this.form.controls.firstName;
  }
  get lastName() {
    return this.form.controls.lastName;
  }
  get email() {
    return this.form.controls.email;
  }
  get password() {
    return this.form.controls.password;
  }
  get birthDate() {
    return this.form.controls.birthDate;
  }
  get phone() {
    return this.form.controls.phone;
  }

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

    this.treasuryService.registerStudent(payload).subscribe({
      next: (res) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: res.message ?? 'Estudiante registrado',
        });
        this.form.reset();
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message ?? 'Error al registrar',
        });
      },
    });
  }
}






