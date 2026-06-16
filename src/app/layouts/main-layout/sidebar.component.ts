import { Component, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CommonModule } from '@angular/common';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles: string[];
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterModule, CommonModule],
  template: `
    <aside class="sidebar">
      <nav>
        <ul class="nav-list">
          @for (item of filteredMenu(); track item.label) {
            <li
              class="nav-item"
              [class.active]="isActive(item.route)"
              (click)="navigate(item.route)"
            >
              <i [class]="item.icon"></i>
              <span>{{ item.label }}</span>
            </li>
          }
        </ul>
      </nav>
    </aside>

    <style>
      .sidebar {
        width: 250px;
        background: #ffffff;
        border-right: 1px solid #e2e8f0;
        padding: 1rem 0;
        overflow-y: auto;
      }
      .nav-list {
        list-style: none;
        margin: 0;
        padding: 0;
      }
      .nav-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1.5rem;
        color: #475569;
        cursor: pointer;
        transition: all 0.15s ease;
        border-left: 3px solid transparent;
        font-size: 0.9rem;
      }
      .nav-item i {
        font-size: 1.1rem;
        width: 1.25rem;
        text-align: center;
      }
      .nav-item:hover {
        background: #f1f5f9;
        color: #0f172a;
      }
      .nav-item.active {
        background: #eff6ff;
        color: #2563eb;
        border-left-color: #2563eb;
        font-weight: 600;
      }
    </style>
  `,
})
export class SidebarComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private role = this.authService.role();

  allMenu: NavItem[] = [
    { label: 'Usuarios', icon: 'pi pi-users', route: '/admin/users', roles: ['admin'] },
    {
      label: 'Registrar Estudiante',
      icon: 'pi pi-user-plus',
      route: '/coordinador/estudiantes',
      roles: ['coordinador'],
    },
    {
      label: 'Registrar Docente',
      icon: 'pi pi-user-plus',
      route: '/coordinador/docentes',
      roles: ['coordinador'],
    },
    {
      label: 'Crear Materia',
      icon: 'pi pi-book',
      route: '/coordinador/materias',
      roles: ['coordinador'],
    },
    {
      label: 'Matricular',
      icon: 'pi pi-pencil',
      route: '/coordinador/matricular',
      roles: ['coordinador'],
    },
    {
      label: 'Matrículas',
      icon: 'pi pi-table',
      route: '/tesoreria/matriculas',
      roles: ['tesoreria'],
    },
    {
      label: 'Registrar Abono',
      icon: 'pi pi-credit-card',
      route: '/tesoreria/abonos',
      roles: ['tesoreria'],
    },
    {
      label: 'Deshabilitar Cuenta',
      icon: 'pi pi-ban',
      route: '/tesoreria/deshabilitar',
      roles: ['tesoreria'],
    },
    {
      label: 'Inscribir Alumno',
      icon: 'pi pi-user-check',
      route: '/docente/inscribir',
      roles: ['docente'],
    },
    {
      label: 'Crear Tarea',
      icon: 'pi pi-file-edit',
      route: '/docente/tareas',
      roles: ['docente'],
    },
    {
      label: 'Calificar',
      icon: 'pi pi-check-circle',
      route: '/docente/calificar',
      roles: ['docente'],
    },
    {
      label: 'Perfil',
      icon: 'pi pi-user',
      route: '/perfil',
      roles: ['admin', 'coordinador', 'tesoreria', 'docente', 'estudiante'],
    },
  ];

  filteredMenu = signal<NavItem[]>(this.allMenu.filter((m) => m.roles.includes(this.role ?? '')));

  isActive(route: string): boolean {
    return this.router.url.startsWith(route);
  }

  navigate(route: string) {
    this.router.navigateByUrl(route);
  }
}
