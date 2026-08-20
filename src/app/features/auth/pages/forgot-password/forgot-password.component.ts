import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { MessageService } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { DividerModule } from 'primeng/divider';

@Component({
  selector: 'app-forgot-password',
  imports: [
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    ToastModule,
    InputGroupModule,
    InputGroupAddonModule,
    DividerModule,
    RouterLink,
  ],
  providers: [MessageService],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
})
export class ForgotPasswordComponent {
  private formBuilder = inject(FormBuilder);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);

  isLoading = signal(false);

  form = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
  });

  get email() {
    return this.form.controls.email;
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const { email } = this.form.value;

    this.authService.forgotPassword(email!).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Si el correo existe, recibirá instrucciones.' });
        this.form.reset();
      },
      error: (err) => {
        this.isLoading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Ocurrió un error al procesar la solicitud' });
      },
    });
  }
}
