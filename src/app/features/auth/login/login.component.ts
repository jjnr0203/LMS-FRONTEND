import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-login',
  standalone: true,
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
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private messageService: MessageService
  ) {
    this.loginForm = this.fb.group({
      id: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(10)]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      const { id, password } = this.loginForm.value;
      
      this.authService.login(id, password).subscribe({
        next: () => {
          this.isLoading = false;
          setTimeout(() => this.router.navigate(['/dashboard']), 500);
        },
        error: (err) => {
          this.isLoading = false;
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
