import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../core/services/user.service';
import { MessageService } from 'primeng/api';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { CardModule } from 'primeng/card';
import { Router } from '@angular/router';

@Component({
  selector: 'app-change-password',
  imports: [
    ReactiveFormsModule,
    PasswordModule,
    ButtonModule,
    ToastModule,
    CardModule,
  ],
  providers: [MessageService],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.scss',
})
export class ChangePasswordComponent {
  private formBuilder = inject(FormBuilder);
  private userService = inject(UserService);
  private messageService = inject(MessageService);
  private router = inject(Router);

  loading = signal(false);

  form = this.formBuilder.group({
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
