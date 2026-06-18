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
    { label: 'Crear Usuario', icon: 'pi pi-user-plus', route: '/admin/users', roles: ['admin'] },
    { label: 'Lista de Usuarios', icon: 'pi pi-users', route: '/admin/users-list', roles: ['admin'] },
    {
      label: 'Registrar Estudiante',
      icon: 'pi pi-user-plus',
      route: '/treasury/estudiantes',
      roles: ['treasury'],
    },
    {
      label: 'Lista de Estudiantes',
      icon: 'pi pi-users',
      route: '/treasury/estudiantes-list',
      roles: ['treasury'],
    },
    {
      label: 'Lista de Materias',
      icon: 'pi pi-list',
      route: '/coordinator/materias-list',
      roles: ['coordinator'],
    },
    {
      label: 'Crear Materia',
      icon: 'pi pi-book',
      route: '/coordinator/materias',
      roles: ['coordinator'],
    },
    {
      label: 'Asignar Docente',
      icon: 'pi pi-link',
      route: '/coordinator/asignar-docente',
      roles: ['coordinator'],
    },
    {
      label: 'Matricular',
      icon: 'pi pi-pencil',
      route: '/coordinator/matricular',
      roles: ['coordinator'],
    },
    {
      label: 'Matrículas',
      icon: 'pi pi-table',
      route: '/treasury/matriculas',
      roles: ['treasury'],
    },
    {
      label: 'Registrar Abono',
      icon: 'pi pi-credit-card',
      route: '/treasury/abonos',
      roles: ['treasury'],
    },
    {
      label: 'Deshabilitar Cuenta',
      icon: 'pi pi-ban',
      route: '/treasury/deshabilitar',
      roles: ['treasury'],
    },
    {
      label: 'Inscribir Alumno',
      icon: 'pi pi-user-check',
      route: '/teacher/inscribir',
      roles: ['teacher'],
    },
    {
      label: 'Crear Tarea',
      icon: 'pi pi-file-edit',
      route: '/teacher/tareas',
      roles: ['teacher'],
    },
    {
      label: 'Calificar',
      icon: 'pi pi-check-circle',
      route: '/teacher/calificar',
      roles: ['teacher'],
    },
    {
      label: 'Perfil',
      icon: 'pi pi-user',
      route: '/perfil',
      roles: ['admin', 'coordinator', 'treasury', 'teacher', 'student'],
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
