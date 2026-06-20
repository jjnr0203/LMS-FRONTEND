import { Component, inject, signal, computed } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CommonModule } from '@angular/common';

interface NavItem {
  label: string;
  icon: string;
  route?: string;
  roles: string[];
  expanded?: boolean;
  children?: NavItem[];
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterModule, CommonModule],
  template: `
    <aside class="sidebar" [class.collapsed]="isCollapsed()">
      <div class="sidebar-header">
        <div class="logo">
          <i class="pi pi-box logo-icon"></i>
          @if (!isCollapsed()) {
            <span class="logo-text">LMS Pro</span>
          }
        </div>
        <button class="toggle-btn" (click)="toggleSidebar()">
          <i class="pi pi-bars"></i>
        </button>
      </div>

      <nav class="sidebar-nav">
        @if (!isCollapsed()) {
          <span class="nav-section-title">General</span>
        }
        <ul class="nav-list">
          @for (item of filteredMenu(); track item.label) {
            <li class="nav-item-container">
              <!-- Single Item or Parent Item -->
              <div
                class="nav-item"
                [class.active]="item.route && isActive(item.route)"
                [class.justify-center]="isCollapsed()"
                [title]="isCollapsed() ? item.label : ''"
                (click)="onItemClick(item)"
              >
                <i [class]="item.icon"></i>
                @if (!isCollapsed()) {
                  <span class="nav-label">{{ item.label }}</span>
                  @if (item.children) {
                    <i class="pi pi-chevron-down toggle-icon" [class.rotated]="item.expanded"></i>
                  }
                }
              </div>

              <!-- Children -->
              @if (item.children && item.expanded && !isCollapsed()) {
                <ul class="subnav-list">
                  @for (child of item.children; track child.label) {
                    <li
                      class="subnav-item"
                      [class.active]="child.route && isActive(child.route)"
                      (click)="onItemClick(child)"
                    >
                      <span class="subnav-indicator"></span>
                      <span class="nav-label">{{ child.label }}</span>
                    </li>
                  }
                </ul>
              }
            </li>
          }
        </ul>
      </nav>

      <div class="sidebar-footer">
        <div class="profile-card" [class.collapsed-profile]="isCollapsed()" (click)="navigate('/perfil')" [title]="isCollapsed() ? 'Ver Perfil' : ''">
          @if (user()?.avatarUrl) {
            <img [src]="user()?.avatarUrl" alt="Avatar" class="profile-avatar" />
          } @else {
            <div class="profile-avatar-placeholder">
              <i class="pi pi-user"></i>
            </div>
          }
          @if (!isCollapsed()) {
            <div class="profile-info">
              <span class="profile-name">{{ user()?.firstName }} {{ user()?.lastName }}</span>
              <span class="profile-role">{{ user()?.roleName | uppercase }}</span>
            </div>
            <i class="pi pi-sign-out logout-icon" (click)="logout($event)" title="Cerrar Sesión"></i>
          }
        </div>
      </div>
    </aside>
  `,
  styles: [
    `
      .sidebar {
        width: 260px;
        background: #ffffff;
        border-right: 1px solid #e2e8f0;
        display: flex;
        flex-direction: column;
        height: 100vh;
        transition: width 0.3s ease;
      }
      .sidebar.collapsed {
        width: 80px;
      }
      .sidebar-header {
        padding: 1.5rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .logo {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        overflow: hidden;
      }
      .logo-icon {
        font-size: 1.8rem;
        color: #064e3b;
        flex-shrink: 0;
      }
      .logo-text {
        font-size: 1.5rem;
        font-weight: 800;
        color: #064e3b;
        white-space: nowrap;
      }
      .toggle-btn {
        background: transparent;
        border: none;
        color: #64748b;
        font-size: 1.2rem;
        cursor: pointer;
        padding: 0.5rem;
        border-radius: 6px;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .toggle-btn:hover {
        background: #f1f5f9;
        color: #0f172a;
      }
      .sidebar-nav {
        flex: 1;
        overflow-y: auto;
        padding: 0 1rem;
        overflow-x: hidden;
      }
      .sidebar.collapsed .sidebar-nav {
        padding: 0 0.5rem;
      }
      .nav-section-title {
        display: block;
        font-size: 0.75rem;
        font-weight: 600;
        color: #94a3b8;
        text-transform: uppercase;
        margin-bottom: 0.75rem;
        padding-left: 0.5rem;
        letter-spacing: 0.05em;
        white-space: nowrap;
      }
      .nav-list, .subnav-list {
        list-style: none;
        margin: 0;
        padding: 0;
      }
      .nav-item-container {
        margin-bottom: 0.25rem;
      }
      .nav-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        color: #64748b;
        cursor: pointer;
        border-radius: 6px;
        transition: all 0.2s ease;
        font-size: 0.95rem;
        font-weight: 500;
        white-space: nowrap;
      }
      .sidebar.collapsed .nav-item {
        padding: 0.75rem;
        justify-content: center;
      }
      .nav-item i {
        font-size: 1.1rem;
        width: 1.25rem;
        text-align: center;
        flex-shrink: 0;
      }
      .nav-label {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .toggle-icon {
        font-size: 0.8rem !important;
        transition: transform 0.2s ease;
      }
      .toggle-icon.rotated {
        transform: rotate(-180deg);
      }
      .nav-item:hover {
        background: #f1f5f9;
        color: #0f172a;
      }
      .nav-item.active {
        background: #064e3b;
        color: #ffffff;
        box-shadow: 0 4px 6px -1px rgba(6, 78, 59, 0.2);
      }
      .subnav-list {
        margin-top: 0.25rem;
      }
      .subnav-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.6rem 1rem 0.6rem 2.5rem;
        color: #64748b;
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 0.85rem;
        font-weight: 500;
        white-space: nowrap;
      }
      .subnav-indicator {
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background: #cbd5e1;
        transition: all 0.2s ease;
        flex-shrink: 0;
      }
      .subnav-item:hover {
        color: #0f172a;
      }
      .subnav-item:hover .subnav-indicator {
        background: #064e3b;
      }
      .subnav-item.active {
        color: #064e3b;
        font-weight: 600;
      }
      .subnav-item.active .subnav-indicator {
        background: #064e3b;
        box-shadow: 0 0 0 2px rgba(6, 78, 59, 0.2);
      }
      
      .sidebar-footer {
        padding: 1.5rem 1rem;
      }
      .sidebar.collapsed .sidebar-footer {
        padding: 1rem 0.5rem;
      }
      .profile-card {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        background: #064e3b;
        padding: 0.5rem 0.75rem;
        border-radius: 6px;
        border: 1px solid #e2e8f0;
        cursor: pointer;
        transition: transform 0.2s ease, box-shadow 0.2s ease, padding 0.3s ease;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        overflow: hidden;
      }
      .profile-card.collapsed-profile {
        padding: 0.5rem;
        justify-content: center;
      }
      .profile-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
      }
      .profile-avatar {
        width: 40px;
        height: 40px;
        border-radius: 6px;
        object-fit: cover;
        border: 1px solid rgba(255,255,255,0.2);
        flex-shrink: 0;
      }
      .profile-avatar-placeholder {
        width: 40px;
        height: 40px;
        border-radius: 6px;
        background: #0f5132;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #ffffff;
        border: 2px solid #ffffff;
        flex-shrink: 0;
      }
      .profile-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      .profile-name {
        color: #ffffff;
        font-size: 0.85rem;
        font-weight: 600;
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
      }
      .profile-role {
        color: #d1fae5;
        font-size: 0.7rem;
        font-weight: 500;
        white-space: nowrap;
      }
      .logout-icon {
        color: #ffffff;
        transition: color 0.2s ease;
        flex-shrink: 0;
      }
      .logout-icon:hover {
        color: #ef4444;
      }
    `
  ],
})
export class SidebarComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  
  role = this.authService.role;
  user = this.authService.user;
  isCollapsed = signal(false);

  allMenu = signal<NavItem[]>([
    {
      label: 'Panel',
      icon: 'pi pi-home',
      route: '/admin',
      roles: ['admin'],
    },
    {
      label: 'Panel',
      icon: 'pi pi-home',
      route: '/coordinator',
      roles: ['coordinator'],
    },
    {
      label: 'Panel',
      icon: 'pi pi-home',
      route: '/teacher',
      roles: ['teacher'],
    },
    {
      label: 'Panel',
      icon: 'pi pi-home',
      route: '/treasury',
      roles: ['treasury'],
    },
    {
      label: 'Usuarios',
      icon: 'pi pi-users',
      roles: ['admin'],
      expanded: false,
      children: [
        { label: 'Ver Usuarios', icon: '', route: '/admin/users-list', roles: ['admin'] },
        { label: 'Crear Usuario', icon: '', route: '/admin/users', roles: ['admin'] },
      ]
    },
    {
      label: 'Estudiantes',
      icon: 'pi pi-users',
      roles: ['treasury'],
      expanded: false,
      children: [
        { label: 'Ver Estudiantes', icon: '', route: '/treasury/estudiantes-list', roles: ['treasury'] },
        { label: 'Registrar Estudiante', icon: '', route: '/treasury/estudiantes', roles: ['treasury'] },
      ]
    },
    {
      label: 'Materias',
      icon: 'pi pi-book',
      roles: ['coordinator'],
      expanded: false,
      children: [
        { label: 'Ver Materias', icon: '', route: '/coordinator/materias-list', roles: ['coordinator'] },
        { label: 'Crear Materia', icon: '', route: '/coordinator/materias', roles: ['coordinator'] },
      ]
    },
    {
      label: 'Asignaciones',
      icon: 'pi pi-link',
      roles: ['coordinator'],
      expanded: false,
      children: [
        { label: 'Asignar Docente', icon: '', route: '/coordinator/asignar-docente', roles: ['coordinator'] },
        { label: 'Matricular Alumno', icon: '', route: '/coordinator/matricular', roles: ['coordinator'] },
      ]
    },
    {
      label: 'Pagos',
      icon: 'pi pi-credit-card',
      roles: ['treasury'],
      expanded: false,
      children: [
        { label: 'Matrículas', icon: '', route: '/treasury/matriculas', roles: ['treasury'] },
        { label: 'Registrar Abono', icon: '', route: '/treasury/abonos', roles: ['treasury'] },
      ]
    },
    {
      label: 'Seguridad',
      icon: 'pi pi-shield',
      roles: ['treasury'],
      expanded: false,
      children: [
        { label: 'Deshabilitar Cuenta', icon: '', route: '/treasury/deshabilitar', roles: ['treasury'] },
      ]
    },
    {
      label: 'Gestión Académica',
      icon: 'pi pi-graduation-cap',
      roles: ['teacher'],
      expanded: false,
      children: [
        { label: 'Inscribir Alumno', icon: '', route: '/teacher/inscribir', roles: ['teacher'] },
        { label: 'Crear Tarea', icon: '', route: '/teacher/tareas', roles: ['teacher'] },
        { label: 'Calificar Tarea', icon: '', route: '/teacher/calificar', roles: ['teacher'] },
      ]
    }
  ]);

  filteredMenu = computed(() => {
    const currentRole = this.role() ?? '';
    return this.allMenu().filter((m) => m.roles.includes(currentRole));
  });

  isActive(route: string): boolean {
    return this.router.url === route || this.router.url.startsWith(route + '/');
  }

  onItemClick(item: NavItem) {
    if (this.isCollapsed()) {
      this.isCollapsed.set(false);
      if (item.children) {
        item.expanded = true;
      } else if (item.route) {
        this.navigate(item.route);
      }
    } else {
      if (item.children) {
        item.expanded = !item.expanded;
      } else if (item.route) {
        this.navigate(item.route);
      }
    }
  }

  navigate(route: string) {
    this.router.navigateByUrl(route);
  }

  toggleSidebar() {
    this.isCollapsed.update(v => !v);
  }

  logout(event: Event) {
    event.stopPropagation();
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
