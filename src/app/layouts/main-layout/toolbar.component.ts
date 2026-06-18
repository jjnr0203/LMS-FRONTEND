import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-toolbar',
  imports: [ButtonModule, AvatarModule, CommonModule],
  template: `
    <header class="toolbar">
      <div class="toolbar-left">
        <span class="brand">LMS IPB</span>
      </div>
      <div class="toolbar-right">
        @if (profile(); as p) {
          <div class="user-info">
            @if (p.avatarUrl) {
              <p-avatar
                [image]="p.avatarUrl"
                shape="circle"
                styleClass="mr-2"
                size="normal"
              />
            } @else {
              <p-avatar
                [label]="getInitials(p.firstName, p.lastName)"
                shape="circle"
                styleClass="mr-2 avatar-fallback"
                size="normal"
              />
            }
            <div class="user-text">
              <span class="user-name">{{ p.firstName }} {{ p.lastName }}</span>
              <span class="user-role">{{ formatRoleName(p.roleName || role()) }}</span>
            </div>
          </div>
        }
        <p-button
          icon="pi pi-sign-out"
          severity="secondary"
          variant="text"
          (onClick)="logout()"
          pTooltip="Cerrar sesión"
        />
      </div>
    </header>

    <style>
      .toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        height: 64px;
        padding: 0 1.5rem;
        background: #ffffff;
        border-bottom: 1px solid #e2e8f0;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      }
      .brand {
        font-weight: 700;
        font-size: 1.25rem;
        color: #0f172a;
      }
      .toolbar-right {
        display: flex;
        align-items: center;
        gap: 1rem;
      }
      .user-info {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .user-text {
        display: flex;
        flex-direction: column;
        line-height: 1.2;
      }
      .user-name {
        font-weight: 600;
        font-size: 0.875rem;
        color: #1e293b;
      }
      .user-role {
        font-size: 0.75rem;
        color: #64748b;
      }
      .avatar-fallback {
        background: #3b82f6;
        color: #fff;
        font-weight: 600;
      }
    </style>
  `,
})
export class ToolbarComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  profile = this.authService.user;
  role = signal('');

  ngOnInit() {
    this.role.set(this.authService.role() ?? '');
    if (!this.profile()) {
      this.authService.getProfile().subscribe();
    }
  }

  formatRoleName(r?: string): string {
    if (!r) return 'Desconocido';
    const roles: Record<string, string> = {
      admin: 'Administrador',
      treasury: 'Tesorería',
      coordinator: 'Coordinador',
      teacher: 'Docente',
      student: 'Estudiante'
    };
    return roles[r.toLowerCase()] || r;
  }

  getInitials(fn: string, ln: string): string {
    return ((fn?.charAt(0) ?? '') + (ln?.charAt(0) ?? '')).toUpperCase() || 'U';
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => {
        this.authService.clearSession();
        this.router.navigate(['/login']);
      },
    });
  }
}
