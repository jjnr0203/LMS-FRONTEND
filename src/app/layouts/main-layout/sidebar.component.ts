import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
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
  templateUrl: 'sidebar.component.html',
  styleUrl: 'sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
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
      route: '/admin/users-list',
      roles: ['admin'],
    },
    {
      label: 'Gestión Académica',
      icon: 'pi pi-sitemap',
      route: '/admin/academic',
      roles: ['admin'],
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
      label: 'Carreras',
      icon: 'pi pi-graduation-cap',
      route: '/coordinator/carreras',
      roles: ['coordinator'],
    },
    {
      label: 'Docentes',
      icon: 'pi pi-users',
      roles: ['coordinator'],
      expanded: false,
      children: [
        { label: 'Registrar Docente', icon: '', route: '/coordinator/registrar-docente', roles: ['coordinator'] },
        { label: 'Asignar Docente', icon: '', route: '/coordinator/asignar-docente', roles: ['coordinator'] },
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
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => {
        this.authService.clearSession();
        this.router.navigate(['/login']);
      }
    });
  }
}
