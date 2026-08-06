import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './sidebar.component';
import { FirstLogin } from '../../features/auth/first-login/first-login';
import { AuthService } from '../../core/services/auth.service';
import { inject } from '@angular/core';
import { DialogModule } from 'primeng/dialog';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, SidebarComponent, FirstLogin, DialogModule],
  templateUrl: 'main-layout.component.html',
  styleUrl: 'main-layout.component.scss',
})
export class MainLayoutComponent {
  authService = inject(AuthService);
}
