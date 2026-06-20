import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

interface DashboardStats {
  student: number;
  teacher: number;
  coordinator: number;
  treasury: number;
  admin: number;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-container">
      <!-- Dark Header -->
      <div class="dashboard-header">
        <div class="header-content">
          <h1 class="title">Bienvenido de nuevo, <span>{{ user()?.firstName }}</span></h1>
          <p class="description">
            Aquí puedes ver el resumen general de los usuarios registrados en la plataforma.
          </p>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <!-- Students -->
        <div class="stat-card">
          <div class="stat-icon student-icon">
            <i class="pi pi-graduation-cap"></i>
          </div>
          <div class="stat-info">
            <h3>
              @if (stats()) {
                <span translate="no">{{ stats()!.student }}</span>
              } @else {
                <i class="pi pi-spin pi-spinner" style="font-size: 1.5rem; color: #cbd5e1;"></i>
              }
            </h3>
            <p>Total Estudiantes</p>
          </div>
        </div>

        <!-- Teachers -->
        <div class="stat-card">
          <div class="stat-icon teacher-icon">
            <i class="pi pi-briefcase"></i>
          </div>
          <div class="stat-info">
            <h3>
              @if (stats()) {
                <span translate="no">{{ stats()!.teacher }}</span>
              } @else {
                <i class="pi pi-spin pi-spinner" style="font-size: 1.5rem; color: #cbd5e1;"></i>
              }
            </h3>
            <p>Total Docentes</p>
          </div>
        </div>

        <!-- Coordinators -->
        <div class="stat-card">
          <div class="stat-icon coordinator-icon">
            <i class="pi pi-users"></i>
          </div>
          <div class="stat-info">
            <h3>
              @if (stats()) {
                <span translate="no">{{ stats()!.coordinator }}</span>
              } @else {
                <i class="pi pi-spin pi-spinner" style="font-size: 1.5rem; color: #cbd5e1;"></i>
              }
            </h3>
            <p>Coordinadores</p>
          </div>
        </div>

        <!-- Treasury -->
        <div class="stat-card">
          <div class="stat-icon treasury-icon">
            <i class="pi pi-wallet"></i>
          </div>
          <div class="stat-info">
            <h3>
              @if (stats()) {
                <span translate="no">{{ stats()!.treasury }}</span>
              } @else {
                <i class="pi pi-spin pi-spinner" style="font-size: 1.5rem; color: #cbd5e1;"></i>
              }
            </h3>
            <p>Tesorería</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .dashboard-container {
        display: flex;
        flex-direction: column;
        gap: 2rem;
        margin-top: -1.5rem;
        margin-left: -1.5rem;
        margin-right: -1.5rem;
      }

      /* Dark Header */
      .dashboard-header {
        background: #064e3b;
        color: #ffffff;
        border-bottom: none;
        padding: 2.5rem 2rem 5rem 2rem;
        min-height: 250px;
        box-sizing: border-box;
        display: flex;
        align-items: flex-start;
      }
      .title {
        font-size: 2.2rem;
        font-weight: 600;
        letter-spacing: -0.02em;
        color: #ffffff;
      }
      .title span {
        font-weight: 600;
        color: #ffffff;
      }
      .description {
        color: #d1fae5;
        font-size: 0.95rem;
        line-height: 1.5;
      }

      /* Stats Grid */
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1.5rem;
        padding: 0 2rem;
        margin-top: -3.5rem;
        justify-content: center;
        max-width: 1400px;
        margin-left: auto;
        margin-right: auto;
      }
      .stat-card {
        background: #ffffff;
        border-radius: 6px;
        padding: 1rem 1.5rem;
        display: flex;
        align-items: center;
        gap: 1.5rem;
        height: 110px;
        box-sizing: border-box;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }
      .stat-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      }
      .stat-icon {
        width: 48px;
        height: 48px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
      }
      .student-icon {
        background: #eff6ff;
        color: #3b82f6;
      }
      .teacher-icon {
        background: #fdf4ff;
        color: #d946ef;
      }
      .coordinator-icon {
        background: #ecfdf5;
        color: #10b981;
      }
      .treasury-icon {
        background: #fffbeb;
        color: #f59e0b;
      }
      .stat-info h3 {
        font-size: 1.75rem;
        font-weight: 700;
        color: #1e293b;
        margin: 0;
      }
      .stat-info p {
        color: #64748b;
        font-size: 0.85rem;
        font-weight: 500;
        margin: 0;
      }
    `
  ]
})
export class AdminDashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private http = inject(HttpClient);
  
  user = this.authService.user;
  stats = signal<DashboardStats | null>(null);

  ngOnInit() {
    this.http.get<{ stats: DashboardStats }>(`${environment.apiUrl}/admin/dashboard/stats`).subscribe({
      next: (res) => this.stats.set(res.stats),
      error: (err) => console.error('Error fetching stats', err)
    });
  }
}





