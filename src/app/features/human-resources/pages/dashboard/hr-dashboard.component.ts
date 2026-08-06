import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { HumanResourcesService } from '../../../../core/services/human-resources.service';
import { CardModule } from 'primeng/card';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';

interface DashboardStats {
  users: {
    student: number;
    teacher: number;
    coordinator: number;
    treasury: number;
    admin: number;
    secretary: number;
    human_resources: number;
  };
}

@Component({
  selector: 'app-hr-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, CardModule, BadgeModule, ButtonModule],
  templateUrl: './hr-dashboard.component.html',
  styleUrls: ['./hr-dashboard.component.scss']
})
export class HrDashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private hrService = inject(HumanResourcesService);
  private router = inject(Router);

  user = this.authService.user;
  stats = signal<DashboardStats | null>(null);

  ngOnInit() {
    this.hrService.getDashboardStats().subscribe({
      next: (res) => {
        this.stats.set(res.stats);
      },
      error: (err) => console.error('Error fetching stats', err)
    });
  }

  getTotalStaff(): number {
    const s = this.stats();
    if (!s) return 0;
    return (s.users.teacher || 0) + (s.users.coordinator || 0) + (s.users.treasury || 0) + (s.users.secretary || 0);
  }

  goToStaff(roleFilter?: string) {
    if (roleFilter) {
      this.router.navigate(['/human-resources/staff'], { queryParams: { role: roleFilter } });
    } else {
      this.router.navigate(['/human-resources/staff']);
    }
  }
}
