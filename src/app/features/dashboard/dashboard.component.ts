import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

import { MenubarModule } from 'primeng/menubar';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { PopoverModule } from 'primeng/popover';
import { MenuItem } from 'primeng/api';
import { RouterModule, NavigationEnd } from '@angular/router';
import { filter, map, startWith } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MenubarModule, ButtonModule, CardModule, PopoverModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  @ViewChild('op') op: any;
  @ViewChild('profileBtn') profileBtn!: ElementRef;

  items: MenuItem[] | undefined;
  userRole: string = '';
  currentUser: any = null;
  initials: string = '';
  isHome$: Observable<boolean>;

  constructor(private authService: AuthService, private router: Router) {
    this.isHome$ = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map((event: any) => event.url === '/dashboard' || event.url === '/dashboard/'),
      startWith(this.router.url === '/dashboard' || this.router.url === '/dashboard/')
    );
  }

  ngOnInit() {
    this.userRole = this.authService.getRoleFromToken() || 'Invitado';

    this.authService.getProfile().subscribe({
      next: (user) => {
        this.currentUser = user;
        this.initials = this.getInitials(user.firstName, user.lastName);
        setTimeout(() => {
          if (this.op && this.profileBtn) {
            this.op.show(new MouseEvent('click'), this.profileBtn.nativeElement);
          }
        }, 300);
      },
      error: (err) => console.error('Error fetching profile', err)
    });

    this.items = [
      {
        label: 'Dashboard',
        icon: 'pi pi-home',
        command: () => this.router.navigate(['/dashboard'])
      },
      {
        label: 'Usuarios',
        icon: 'pi pi-users',
        command: () => this.router.navigate(['/dashboard/users'])
      },
      {
        label: 'Cursos',
        icon: 'pi pi-book',
        command: () => this.router.navigate(['/dashboard/courses'])
      }
    ];
  }

  getInitials(firstName: string, lastName: string): string {
    if (!firstName && !lastName) return 'U';
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  }

  onMenuClick(item: MenuItem) {
    if (item.command) {
      item.command({});
    }
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: () => {
        // Fallback en caso de error de red
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        this.router.navigate(['/login']);
      }
    });
  }
}
