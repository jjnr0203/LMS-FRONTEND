import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';
import { CardModule } from 'primeng/card';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

interface CareerDetail {
  id: string;
  code: string;
  name: string;
  coordinatorName: string | null;
  modalityNames: string[];
  durationSemesters: number;
  isActive: boolean;
  activeCurriculums: { id: string; name: string }[];
  facultyId: string | null;
}

interface DashboardStats {
  users: {
    student: number;
    teacher: number;
    coordinator: number;
    treasury: number;
    admin: number;
  };
  academic: {
    totalCareers: number;
    totalSubjects: number;
    totalFaculties: number;
    faculties: { id: string; code: string; name: string }[];
    careers: CareerDetail[];
  };
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, CardModule, BadgeModule, InputTextModule, SelectModule, ButtonModule, IconFieldModule, InputIconModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private http = inject(HttpClient);
  private router = inject(Router);

  user = this.authService.user;
  stats = signal<DashboardStats | null>(null);
  selectedFacultyId = signal<string | null>(null);

  filterCareer = signal<string>('');
  filterModality = signal<string>('');

  availableModalities = computed(() => {
    const s = this.stats();
    if (!s) return [];
    const mods = new Set<string>();
    s.academic.careers.forEach(c => {
      c.modalityNames.forEach(m => mods.add(m));
    });
    return Array.from(mods).sort();
  });

  filteredCareers = computed(() => {
    const s = this.stats();
    if (!s) return [];

    const facId = this.selectedFacultyId();
    let careers = s.academic.careers;

    if (facId) {
      careers = careers.filter(c => c.facultyId === facId);
    }

    const fCareer = this.filterCareer().toLowerCase().trim();
    if (fCareer) {
      careers = careers.filter(c => c.name.toLowerCase().includes(fCareer) || c.code.toLowerCase().includes(fCareer));
    }

    const fMod = this.filterModality();
    if (fMod) {
      careers = careers.filter(c => c.modalityNames.includes(fMod));
    }

    return careers;
  });

  ngOnInit() {
    this.http.get<{ stats: DashboardStats }>(`${environment.apiUrl}/admin/dashboard/stats`).subscribe({
      next: (res) => {
        this.stats.set(res.stats);
      },
      error: (err) => console.error('Error fetching stats', err)
    });
  }

  getTotalUsers(): number {
    const s = this.stats();
    if (!s) return 0;
    return s.users.student + s.users.teacher + s.users.coordinator + s.users.treasury + s.users.admin;
  }

  goToUsers(roleFilter?: string) {
    if (roleFilter) {
      this.router.navigate(['/admin/users-list'], { queryParams: { role: roleFilter } });
    } else {
      this.router.navigate(['/admin/users-list']);
    }
  }

  goToAcademic(tab: string) {
    this.router.navigate(['/admin/academic'], { queryParams: { tab } });
  }

  selectFaculty(facultyId: string) {
    this.selectedFacultyId.set(facultyId);
    this.filterCareer.set('');
    this.filterModality.set('');
  }

  clearFaculty() {
    this.selectedFacultyId.set(null);
  }

  goToCareerBreakdown(careerId: string) {
    this.router.navigate(['/admin/desglose', careerId]);
  }
}
