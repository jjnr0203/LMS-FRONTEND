import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { MessageService } from 'primeng/api';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { DividerModule } from 'primeng/divider';

@Component({
  selector: 'app-reset-password',
  imports: [
    ReactiveFormsModule,
    PasswordModule,
    ButtonModule,
    ToastModule,
    InputGroupModule,
    InputGroupAddonModule,
    DividerModule,
    RouterLink,
  ],
  providers: [MessageService],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
})
export class ResetPasswordComponent implements OnInit {
  private formBuilder = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private messageService = inject(MessageService);

  isLoading = signal(false);
  token = signal('');

  form = this.formBuilder.group({
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]],
  });

  get password() {
    return this.form.controls.password;
  }
  get confirmPassword() {
    return this.form.controls.confirmPassword;
  }

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      if (params['token']) {
        this.token.set(params['token']);
      } else {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Enlace inválido o expirado' });
      }
    });
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    
    if (this.password.value !== this.confirmPassword.value) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Las contraseñas no coinciden' });
      return;
    }

    if (!this.token()) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No hay token válido' });
      return;
    }

    this.isLoading.set(true);
    const passwordValue = this.password.value!;

    this.authService.resetPassword(this.token(), passwordValue).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Contraseña actualizada correctamente' });
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error al restablecer la contraseña' });
      },
    });
  }
}
