import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import {
  TreasuryService,
  TreasuryDashboardStats,
} from '../../../core/services/treasury.service';

@Component({
  selector: 'app-treasury-dashboard',
  standalone: true,
  imports: [],
  templateUrl: './treasury-dashboard.component.html',
  styleUrl: './treasury-dashboard.component.scss',
})
export class TreasuryDashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private treasuryService = inject(TreasuryService);
  private router = inject(Router);

  user = this.authService.user;
  stats = signal<TreasuryDashboardStats | null>(null);

  ngOnInit() {
    this.treasuryService.getDashboardStats().subscribe({
      next: (res) => this.stats.set(res.stats),
      error: (err) => console.error('Error fetching treasury stats', err),
    });
  }

  goTo(route: string) {
    this.router.navigate([`/treasury/${route}`]);
  }
}
