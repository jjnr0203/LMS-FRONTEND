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
  ],
  providers: [MessageService],
  template: `
    <p-toast />

    @if (user(); as u) {
      <div class="profile-grid">
        <p-card header="Mi Perfil">
          <div class="profile-header">
            <div class="avatar-container">
              @if (u.avatarUrl) {
                <p-avatar
                  [image]="u.avatarUrl"
                  shape="circle"
                  size="xlarge"
                />
              } @else {
                <p-avatar
                  [label]="initials()"
                  shape="circle"
                  size="xlarge"
                  styleClass="profile-avatar-fallback"
                />
              }
              <div class="avatar-overlay" (click)="fileInput.click()">
                <i class="pi pi-camera"></i>
              </div>
              <input type="file" #fileInput (change)="onFileSelected($event)" accept="image/*" style="display: none" />
            </div>
            <div>
              <h2>{{ u.firstName }} {{ u.lastName }}</h2>
              <p class="role-badge">{{ formatRoleName(u.roleName) }}</p>
              <p class="text-sm text-color-secondary">{{ u.email }}</p>
            </div>
          </div>

          <div class="info-grid">
            <div class="info-item">
              <label>Cédula</label>
              <span>{{ u.id }}</span>
            </div>
            <div class="info-item">
              <label>Estado</label>
              <span [style.color]="u.isActive ? '#22c55e' : '#ef4444'">
                {{ u.isActive ? 'Activo' : 'Inactivo' }}
              </span>
            </div>
            <div class="info-item">
              <label>Miembro desde</label>
              <span>{{ u.createdAt | date: 'shortDate' }}</span>
            </div>
          </div>

          <div class="actions">
            <p-button label="Cambiar Contraseña" icon="pi pi-key" (onClick)="goChangePassword()" />
          </div>
        </p-card>
      </div>
    }

    <style>
      .profile-grid {
        max-width: 700px;
      }
      .profile-header {
        display: flex;
        align-items: center;
        gap: 1.5rem;
        margin-bottom: 2rem;
      }
      .profile-header h2 {
        margin: 0;
      }
      .profile-avatar-fallback {
        background: #3b82f6;
        color: #fff;
        font-weight: 700;
      }
      .avatar-container {
        position: relative;
        cursor: pointer;
        border-radius: 50%;
        overflow: hidden;
        width: 64px;
        height: 64px;
      }
      .avatar-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.2s ease;
      }
      .avatar-container:hover .avatar-overlay {
        opacity: 1;
      }
      .role-badge {
        display: inline-block;
        background: #eff6ff;
        color: #1d4ed8;
        padding: 0.2rem 0.75rem;
        border-radius: 999px;
        font-size: 0.8rem;
        font-weight: 600;
        margin: 0.25rem 0;
      }
      .info-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
        margin-bottom: 1.5rem;
      }
      .info-item label {
        display: block;
        font-size: 0.75rem;
        color: #64748b;
        font-weight: 600;
      }
      .info-item span {
        font-size: 0.95rem;
        color: #1e293b;
      }
      .actions {
        display: flex;
        gap: 0.75rem;
      }
    </style>
  `,
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
