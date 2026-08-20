import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
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
  isCollapsed = signal(window.innerWidth <= 768);
  currentUrl = signal(this.router.url);

  constructor() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.currentUrl.set(event.urlAfterRedirects);
    });
  }

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
      label: 'Panel',
      icon: 'pi pi-home',
      route: '/human-resources',
      roles: ['human_resources'],
    },
    {
      label: 'Personal Administrativo',
      icon: 'pi pi-users',
      route: '/human-resources/staff',
      roles: ['human_resources'],
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
      label: 'Configuración',
      icon: 'pi pi-cog',
      route: '/admin/institution',
      roles: ['admin'],
    },
    {
      label: 'Auditoría',
      icon: 'pi pi-history',
      route: '/admin/auditoria',
      roles: ['admin'],
    },
    {
      label: 'Respaldos',
      icon: 'pi pi-save',
      route: '/admin/respaldos',
      roles: ['admin'],
    },
    {
      label: 'Estudiantes',
      icon: 'pi pi-users',
      route: '/treasury/estudiantes-list',
      roles: ['treasury'],
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
    },
    {
      label: 'Panel',
      icon: 'pi pi-home',
      route: '/secretary',
      roles: ['secretary'],
    },
    {
      label: 'Estudiantes',
      icon: 'pi pi-users',
      route: '/secretary/estudiantes',
      roles: ['secretary'],
    },
    {
      label: 'Matrícula',
      icon: 'pi pi-calendar',
      route: '/secretary/matricula',
      roles: ['secretary'],
    },
    {
      label: 'Certificados',
      icon: 'pi pi-verified',
      route: '/secretary/certificados',
      roles: ['secretary'],
    }
  ]);

  filteredMenu = computed(() => {
    const currentRole = this.role() ?? '';
    return this.allMenu().filter((m) => m.roles.includes(currentRole));
  });

  isActive(route: string): boolean {
    const url = this.currentUrl();
    if (url.startsWith('/perfil')) {
      const roleMap: Record<string, string> = {
        'admin': '/admin',
        'human_resources': '/human-resources',
        'coordinator': '/coordinator',
        'teacher': '/teacher',
        'treasury': '/treasury',
        'secretary': '/secretary'
      };
      const mainRoute = roleMap[this.role() || ''];
      if (route === mainRoute) return true;
    }
    return url === route || url.startsWith(route + '/');
  }

  onItemClick(item: NavItem) {
    if (this.isCollapsed()) {
      this.isCollapsed.set(false);
      if (item.children) {
        item.expanded = true;
      } else if (item.route) {
        this.navigate(item.route);
        if (window.innerWidth <= 768) this.isCollapsed.set(true);
      }
    } else {
      if (item.children) {
        item.expanded = !item.expanded;
      } else if (item.route) {
        this.navigate(item.route);
        if (window.innerWidth <= 768) this.isCollapsed.set(true);
      }
    }
  }

  navigate(route: string) {
    this.router.navigateByUrl(route);
  }

  toggleSidebar() {
    this.isCollapsed.update(v => !v);
  }

  translateRole(roleName?: string): string {
    if (!roleName) return '';
    const map: Record<string, string> = {
      admin: 'Administrador',
      human_resources: 'Recursos Humanos',
      coordinator: 'Coordinador',
      teacher: 'Docente',
      student: 'Estudiante',
      treasury: 'Tesorería',
      secretary: 'Secretaría',
    };
    return map[roleName.toLowerCase()] || roleName;
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
