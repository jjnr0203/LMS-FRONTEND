import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CoordinatorService } from '../../../core/services/coordinator.service';
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
    <p-card header="Registrar Estudiante">
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
              />
              @if (password.invalid && password.touched) {
                <small class="p-error">Mínimo 6 caracteres.</small>
              }
            </div>
          </div>
        </div>

        <p-button
          type="submit"
          label="Registrar Estudiante"
          [loading]="loading()"
          [disabled]="form.invalid"
        />
      </form>
    </p-card>

    <style>
      .field {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
        margin-bottom: 1rem;
      }
      .field label {
        font-weight: 600;
        font-size: 0.85rem;
        color: #334155;
      }
    </style>
  `,
})
export class RegisterStudentComponent {
  private fb = inject(FormBuilder);
  private coordinatorService = inject(CoordinatorService);
  private messageService = inject(MessageService);

  loading = signal(false);

  form = this.fb.nonNullable.group({
    id: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
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

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.coordinatorService.registerStudent(this.form.value as any).subscribe({
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
