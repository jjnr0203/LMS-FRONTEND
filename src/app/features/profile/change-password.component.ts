import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../core/services/user.service';
import { MessageService } from 'primeng/api';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { CardModule } from 'primeng/card';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-change-password',
  imports: [
    ReactiveFormsModule,
    PasswordModule,
    ButtonModule,
    ToastModule,
    CardModule,
    CommonModule,
  ],
  providers: [MessageService],
  template: `
    <p-toast />
    <p-card header="Cambiar Contraseña">
      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <div class="field">
          <label for="currentPassword">Contraseña Actual</label>
          <p-password
            id="currentPassword"
            formControlName="currentPassword"
            [feedback]="false"
            [toggleMask]="true"
          />
          @if (currentPassword.invalid && currentPassword.touched) {
            <small class="p-error">Requerida.</small>
          }
        </div>
        <div class="field">
          <label for="newPassword">Nueva Contraseña</label>
          <p-password id="newPassword" formControlName="newPassword" [toggleMask]="true" />
          @if (newPassword.invalid && newPassword.touched) {
            <small class="p-error">Mínimo 6 caracteres.</small>
          }
        </div>

        <div class="actions">
          <p-button label="Cancelar" severity="secondary" variant="text" (onClick)="cancel()" />
          <p-button
            type="submit"
            label="Cambiar Contraseña"
            [loading]="loading()"
            [disabled]="form.invalid"
          />
        </div>
      </form>
    </p-card>

    <style>
      .field {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
        margin-bottom: 1rem;
        max-width: 400px;
      }
      .field label {
        font-weight: 600;
        font-size: 0.85rem;
        color: #334155;
      }
      .actions {
        display: flex;
        gap: 0.75rem;
        margin-top: 1rem;
      }
    </style>
  `,
})
export class ChangePasswordComponent {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private messageService = inject(MessageService);
  private router = inject(Router);

  loading = signal(false);

  form = this.fb.nonNullable.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
  });

  get currentPassword() {
    return this.form.controls.currentPassword;
  }
  get newPassword() {
    return this.form.controls.newPassword;
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.userService.changePassword(this.form.value as any).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Contraseña actualizada',
        });
        this.form.reset();
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message ?? 'Error al cambiar contraseña',
        });
      },
    });
  }

  cancel() {
    this.router.navigate(['/perfil']);
  }
}
