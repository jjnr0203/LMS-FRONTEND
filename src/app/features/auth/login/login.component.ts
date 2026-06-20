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
import { CarouselModule } from 'primeng/carousel';
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
    CarouselModule,
    CommonModule,
  ],
  providers: [MessageService],
  template: `
    <p-toast />
    <div class="grid grid-nogutter min-h-screen bg-surface-0 p-3 md:p-4">
      <!-- Left Column: Form -->
      <div class="col-12 md:col-5 lg:col-4 flex flex-column align-items-center justify-content-center bg-surface-0 px-5">
        <div class="w-full" style="max-width: 400px">
          
          <div class="flex align-items-center mb-6">
            <i class="pi pi-box text-4xl mr-3" style="color: #064e3b"></i>
            <span class="text-3xl font-bold" style="color: #064e3b">LMS IPB</span>
          </div>

          <div class="mb-5">
            <h2 class="text-3xl font-bold m-0 text-900 mb-2">Iniciar Sesión</h2>
            <p class="text-color-secondary m-0">¡Bienvenido de nuevo! Por favor, ingrese sus credenciales.</p>
          </div>

          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <div class="mb-4">
              <label for="id" class="block text-sm font-semibold text-700 mb-2">ID</label>
              <p-inputGroup>
                <p-inputGroupAddon>
                  <i class="pi pi-user" style="color: #064e3b;"></i>
                </p-inputGroupAddon>
                <input
                  id="id"
                  pInputText
                  formControlName="id"
                  placeholder="Ingrese su ID"
                  [class.ng-invalid]="id.invalid && id.touched"
                />
              </p-inputGroup>
              @if (id.invalid && id.touched) {
                <small class="p-error block mt-1">Este campo es requerido.</small>
              }
            </div>

            <div class="mb-4">
              <label for="password" class="block text-sm font-semibold text-700 mb-2">Contraseña</label>
              <p-inputGroup>
                <p-inputGroupAddon>
                  <i class="pi pi-lock" style="color: #064e3b;"></i>
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
              <a class="text-sm cursor-pointer hover:underline" style="color: #064e3b;">¿Olvidó su contraseña?</a>
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

          <p-divider align="center" type="solid" styleClass="mt-5 mb-4">
            <span class="text-sm text-color-secondary px-2">Soporte Técnico</span>
          </p-divider>

          <p class="text-center text-xs text-color-secondary m-0">&copy; 2026 LMS IPB. Todos los derechos reservados.</p>
        </div>
      </div>

      <!-- Right Column: Green Panel with Carousel -->
      <div class="hidden md:flex md:col-7 lg:col-8 flex-column align-items-center justify-content-center p-6 lg:p-8 border-round-3xl shadow-4" style="background: #064e3b;">
        <div class="text-center mb-6 w-full" style="max-width: 600px;">
          <h2 class="text-white text-5xl font-bold mb-3">La plataforma más sencilla para gestionar tu institución</h2>
          <p class="text-white-alpha-80 text-xl line-height-3">Administra estudiantes, docentes y calificaciones desde un solo lugar con nuestra interfaz moderna e intuitiva.</p>
        </div>
        

        
        <div class="flex gap-5 mt-8 opacity-60">
           <i class="pi pi-shield text-white text-3xl"></i>
           <i class="pi pi-server text-white text-3xl"></i>
           <i class="pi pi-database text-white text-3xl"></i>
           <i class="pi pi-globe text-white text-3xl"></i>
        </div>
      </div>

    </div>
  `,
  styles: [`
    /* Custom Carousel styling for dark background */
    ::ng-deep .p-carousel-indicators .p-carousel-indicator button {
      background-color: rgba(255,255,255,0.3) !important;
    }
    ::ng-deep .p-carousel-indicators .p-carousel-indicator.p-highlight button {
      background-color: #ffffff !important;
    }
  `]
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private messageService = inject(MessageService);

  isLoading = signal(false);
  suspendedMessage = signal('');

  slides = [
    { image: 'images/slide1.png' },
    { image: 'images/slide2.png' }
  ];

  form = this.fb.nonNullable.group({
    id: ['', Validators.required],
    password: ['', Validators.required],
  });

  get id() {
    return this.form.controls.id;
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
    const { id, password } = this.form.value;

    this.authService.login(id!, password!).subscribe({
      next: () => {
        this.isLoading.set(false);
        const role = this.authService.role();
        if (role === 'admin') this.router.navigate(['/admin']);
        else if (role === 'coordinator') this.router.navigate(['/coordinator']);
        else if (role === 'treasury') this.router.navigate(['/treasury']);
        else if (role === 'teacher') this.router.navigate(['/teacher']);
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
