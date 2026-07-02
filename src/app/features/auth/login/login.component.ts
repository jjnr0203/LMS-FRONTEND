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
  ],
  providers: [MessageService],
  templateUrl: 'login.component.html',
  styleUrl: 'login.component.scss',
})
export class LoginComponent {
  private formBuilder = inject(FormBuilder);
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

  form = this.formBuilder.group({
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
