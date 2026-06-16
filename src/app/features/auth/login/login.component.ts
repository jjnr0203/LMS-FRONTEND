import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { MessageService } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { AvatarModule } from 'primeng/avatar';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { DividerModule } from 'primeng/divider';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    ToastModule,
    CardModule,
    MessageModule,
    AvatarModule,
    InputGroupModule,
    InputGroupAddonModule,
    DividerModule,
    CommonModule,
  ],
  providers: [MessageService],
  template: `
    <p-toast />
    <div class="grid grid-nogutter min-h-screen">
      <div class="col-6 flex flex-column align-items-center justify-content-center p-8" style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)">
        <div class="flex flex-column align-items-center text-center">
          <p-avatar icon="pi pi-graduation-cap" size="xlarge" shape="circle" styleClass="bg-primary text-white shadow-5 mb-3" />
          <h1 class="text-white text-5xl font-bold mb-2">LMS IPB</h1>
          <p class="text-white-alpha-70 text-lg mb-5">Plataforma Educativa</p>
          <p class="text-white-alpha-50 text-sm line-height-3 max-w-24rem">
            Sistema de gestión de aprendizaje para la comunidad educativa. Acceda a sus cursos, calificaciones y más.
          </p>
          <div class="flex gap-3 mt-5">
            <span class="pi pi-book text-white-alpha-40 text-4xl"></span>
            <span class="pi pi-chart-line text-white-alpha-40 text-4xl"></span>
            <span class="pi pi-users text-white-alpha-40 text-4xl"></span>
            <span class="pi pi-certificate text-white-alpha-40 text-4xl"></span>
          </div>
        </div>
      </div>

      <div class="col-6 flex flex-column align-items-center justify-content-center bg-surface-0 p-8">
        <div class="w-full" style="max-width: 400px">
          <div class="mb-5">
            <h2 class="text-2xl font-bold m-0 text-900">Bienvenido</h2>
            <p class="text-color-secondary mt-2 mb-0">Ingrese sus credenciales para acceder al sistema</p>
          </div>

          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <div class="mb-4">
              <label for="emailOrCedula" class="block text-sm font-semibold text-700 mb-2">Cédula o Correo</label>
              <p-inputGroup>
                <p-inputGroupAddon>
                  <i class="pi pi-user text-primary"></i>
                </p-inputGroupAddon>
                <input
                  id="emailOrCedula"
                  pInputText
                  formControlName="emailOrCedula"
                  placeholder="Ingrese su cédula o correo"
                  [class.ng-invalid]="emailOrCedula.invalid && emailOrCedula.touched"
                />
              </p-inputGroup>
              @if (emailOrCedula.invalid && emailOrCedula.touched) {
                <small class="p-error block mt-1">Este campo es requerido.</small>
              }
            </div>

            <div class="mb-4">
              <label for="password" class="block text-sm font-semibold text-700 mb-2">Contraseña</label>
              <p-inputGroup>
                <p-inputGroupAddon>
                  <i class="pi pi-lock text-primary"></i>
                </p-inputGroupAddon>
                <p-password
                  id="password"
                  formControlName="password"
                  [feedback]="false"
                  [toggleMask]="true"
                  placeholder="Ingrese su contraseña"
                  [styleClass]="(password.invalid && password.touched) ? 'ng-invalid w-full' : 'w-full'"
                  inputStyleClass="w-full"
                />
              </p-inputGroup>
              @if (password.invalid && password.touched) {
                <small class="p-error block mt-1">La contraseña es requerida.</small>
              }
            </div>

            <div class="flex justify-content-end mb-4">
              <a class="text-sm text-primary cursor-pointer hover:underline">¿Olvidó su contraseña?</a>
            </div>

            <p-button
              type="submit"
              label="Iniciar Sesión"
              icon="pi pi-arrow-right"
              iconPos="right"
              [loading]="isLoading()"
              [disabled]="form.invalid"
              styleClass="w-full p-2 shadow-2"
            />
          </form>

          @if (suspendedMessage()) {
            <p-message severity="warn" [text]="suspendedMessage()" styleClass="w-full mt-3" />
          }

          <p-divider align="center" type="solid">
            <span class="text-sm text-color-secondary px-2">LMS IPB</span>
          </p-divider>

          <p class="text-center text-xs text-color-secondary m-0">&copy; 2026 LMS IPB. Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private messageService = inject(MessageService);

  isLoading = signal(false);
  suspendedMessage = signal('');

  form = this.fb.nonNullable.group({
    emailOrCedula: ['', Validators.required],
    password: ['', Validators.required],
  });

  get emailOrCedula() {
    return this.form.controls.emailOrCedula;
  }
  get password() {
    return this.form.controls.password;
  }

  constructor() {
    if (this.route.snapshot.queryParams['suspended']) {
      this.suspendedMessage.set(
        'Su cuenta ha sido suspendida por falta de pago. Contacte a tesorería.',
      );
    }
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const { emailOrCedula, password } = this.form.value;

    this.authService.login(emailOrCedula!, password!).subscribe({
      next: () => {
        this.isLoading.set(false);
        const role = this.authService.role();
        if (role === 'admin') this.router.navigate(['/admin/users']);
        else if (role === 'coordinador') this.router.navigate(['/coordinador/estudiantes']);
        else if (role === 'tesoreria') this.router.navigate(['/tesoreria/matriculas']);
        else if (role === 'docente') this.router.navigate(['/docente/inscribir']);
        else this.router.navigate(['/perfil']);
      },
      error: (err) => {
        this.isLoading.set(false);
        let detail = 'Error al iniciar sesión';
        if (err.status === 401) detail = 'Credenciales inválidas';
        else if (err.status === 403) {
          detail = err.error?.message ?? 'Cuenta suspendida';
          this.suspendedMessage.set(detail);
        } else if (err.status === 400) detail = err.error?.message ?? 'Datos inválidos';
        this.messageService.add({ severity: 'error', summary: 'Error', detail });
      },
    });
  }
}
