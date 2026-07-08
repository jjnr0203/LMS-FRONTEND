import { Component, inject, signal, OnInit } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { User } from '../../core/models';
import { MessageService } from 'primeng/api';
import { CardModule } from 'primeng/card';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DividerModule } from 'primeng/divider';

@Component({
  selector: 'app-profile',
  imports: [
    CardModule,
    AvatarModule,
    ButtonModule,
    ToastModule,
    InputTextModule,
    ReactiveFormsModule,
    CommonModule,
    DividerModule,
  ],
  providers: [MessageService],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private router = inject(Router);
  private messageService = inject(MessageService);

  user = signal<User | null>(null);
  initials = signal('');

  ngOnInit() {
    this.authService.getProfile().subscribe({
      next: (u) => {
        this.user.set(u);
        this.initials.set(
          ((u.firstName?.charAt(0) ?? '') + (u.lastName?.charAt(0) ?? '')).toUpperCase() || 'U',
        );
      },
    });
  }

  formatRoleName(role?: string): string {
    if (!role) return 'Desconocido';
    const roles: Record<string, string> = {
      admin: 'Administrador',
      treasury: 'Tesorería',
      coordinator: 'Coordinador',
      teacher: 'Docente',
      student: 'Estudiante'
    };
    return roles[role.toLowerCase()] || role;
  }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.userService.uploadAvatar(file).subscribe({
        next: (res) => {
          this.user.set(res.user);
          this.authService.getProfile().subscribe(); // Update global auth state
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Avatar actualizado' });
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el avatar' });
        }
      });
    }
  }

  goChangePassword() {
    this.router.navigate(['/perfil/cambiar-password']);
  }
}
