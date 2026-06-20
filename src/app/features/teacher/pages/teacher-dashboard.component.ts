import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-container">
      <!-- Dark Header -->
      <div class="dashboard-header">
        <div class="header-content">
          <h1 class="title">Bienvenido de nuevo, <span>{{ user()?.firstName }}</span></h1>
          <p class="description">
            Aquí puedes gestionar tus materias, crear tareas y revisar calificaciones en tu rol de Docente.
          </p>
        </div>
      </div>

      <!-- Content -->
      <div class="stats-grid">
        <div class="stat-card welcome-card">
          <div class="stat-info">
            <h3>Panel de Docente</h3>
            <p>Utiliza el menú lateral para acceder a las opciones de gestión académica.</p>
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
        padding: 1.5rem;
        display: flex;
        align-items: center;
        gap: 1rem;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      }
      .welcome-card h3 {
        font-size: 1.5rem;
        color: #1e293b;
      }
      .welcome-card p {
        color: #64748b;
      }
    `
  ]
})
export class TeacherDashboardComponent {
  private authService = inject(AuthService);
  user = this.authService.user;
}





