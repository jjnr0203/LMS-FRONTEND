import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { ButtonModule } from 'primeng/button';
import { PasswordModule } from 'primeng/password';
import { ToastModule } from 'primeng/toast';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { DividerModule } from 'primeng/divider';

@Component({
  selector: 'app-first-login',
  standalone: true,
  imports: [ReactiveFormsModule, ButtonModule, PasswordModule, ToastModule, InputGroupModule, InputGroupAddonModule, DividerModule],
  templateUrl: './first-login.html',
  providers: [MessageService]
})
export class FirstLogin {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private router = inject(Router);
  private messageService = inject(MessageService);

  loading = signal(false);

  form = this.fb.group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]]
  }, { validators: this.passwordsMatchValidator });

  passwordsMatchValidator(group: any) {
    const pass = group.get('newPassword')?.value;
    const confirm = group.get('confirmPassword')?.value;
    return pass === confirm ? null : { mismatch: true };
  }

  onSubmit() {
    if (this.form.invalid) return;

    this.loading.set(true);
    const currentPassword = this.form.value.currentPassword!;
    const newPassword = this.form.value.newPassword!;

    this.userService.changePassword({ currentPassword, newPassword }).subscribe({
      next: () => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Contraseña actualizada',
          detail: 'Por favor, inicia sesión con tu nueva contraseña.'
        });
        
        // Logout and redirect to login after 2 seconds
        setTimeout(() => {
          this.authService.logout().subscribe({
            next: () => this.router.navigate(['/login']),
            error: () => {
              this.authService.clearSession();
              this.router.navigate(['/login']);
            }
          });
        }, 2000);
      },
      error: (err) => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message || 'No se pudo actualizar la contraseña'
        });
      }
    });
  }
}
