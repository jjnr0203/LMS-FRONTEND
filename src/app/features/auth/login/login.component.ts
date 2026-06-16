import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { FormControl } from '@angular/forms';

import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-login',
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    InputTextModule, 
    PasswordModule, 
    ButtonModule,
    MessageModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private messageService = inject(MessageService);

  loginForm: FormGroup;
  isLoading = signal(false);

  constructor() {
    this.loginForm = this.fb.group({
      id: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(10)]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  get id(): FormControl { return this.loginForm.get('id') as FormControl; }
  get password(): FormControl { return this.loginForm.get('password') as FormControl; }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading.set(true);
      const { id, password } = this.loginForm.value;
      
      this.authService.login(id, password).subscribe({
        next: () => {
          this.isLoading.set(false);
          setTimeout(() => this.router.navigate(['/dashboard']), 500);
        },
        error: (err) => {
          this.isLoading.set(false);
          let errorMsg = 'Error al iniciar sesión';
          if (err.status === 401 || err.status === 404 || err.status === 400) {
             errorMsg = 'Credenciales inválidas';
          }
          this.messageService.add({ severity: 'error', summary: 'Error', detail: errorMsg });
        }
      });
    } else {
      this.loginForm.markAllAsTouched();
    }
  }
}
