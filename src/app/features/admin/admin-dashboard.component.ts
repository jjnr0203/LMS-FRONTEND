import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';
import { AccordionModule } from 'primeng/accordion';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { AcademicService } from '../../core/services/academic.service';

interface CareerSubject {
  id: string;
  name: string;
  semester: number;
  modalityNames?: string[];
  teacherName?: string | null;
}

interface CareerDetail {
  id: string;
  name: string;
  coordinatorName: string | null;
  modalityNames: string[];
  durationSemesters: number;
  subjects: CareerSubject[];
}

interface AcademicGroup {
  id: string; // career.id + modality
  careerId: string;
  careerName: string;
  modalityName: string;
  coordinatorName: string | null;
  durationSemesters: number;
  subjects: CareerSubject[];
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
    careers: CareerDetail[];
  };
}

import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { computed } from '@angular/core';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, AccordionModule, CardModule, TableModule, BadgeModule, InputTextModule, SelectModule, InputNumberModule, ButtonModule, DialogModule, IconFieldModule, InputIconModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private academicService = inject(AcademicService);
  private http = inject(HttpClient);
  private router = inject(Router);
  
  user = this.authService.user;
  stats = signal<DashboardStats | null>(null);

  // Filters
  filterCareer = signal<string>('');
  filterModality = signal<string>('');
  filterSubject = signal<string>('');
  filterSemester = signal<number | null>(null);

  displayColorConfig = signal<boolean>(false);
  semestersToConfig = Array.from({length: 10}, (_, i) => i + 1);

  PREDEFINED_COLORS = [
    { label: 'Rojo', value: '#ef4444' },
    { label: 'Naranja', value: '#f97316' },
    { label: 'Ámbar', value: '#f59e0b' },
    { label: 'Verde', value: '#10b981' },
    { label: 'Esmeralda', value: '#059669' },
    { label: 'Cian', value: '#06b6d4' },
    { label: 'Azul', value: '#3b82f6' },
    { label: 'Índigo', value: '#6366f1' },
    { label: 'Violeta', value: '#8b5cf6' },
    { label: 'Rosa', value: '#ec4899' },
    { label: 'Gris', value: '#64748b' },
  ];

  // Extract all unique modalities for the dropdown
  availableModalities = computed(() => {
    const s = this.stats();
    if (!s) return [];
    const mods = new Set<string>();
    s.academic.careers.forEach(c => {
      c.modalityNames.forEach(m => mods.add(m));
    });
    return Array.from(mods).sort();
  });

  // Group careers by modality and filter their subjects
  academicGroups = computed<AcademicGroup[]>(() => {
    const s = this.stats();
    if (!s) return [];
    const groups: AcademicGroup[] = [];

    s.academic.careers.forEach(c => {
      if (!c.modalityNames || c.modalityNames.length === 0) {
        groups.push({
          id: c.id + '_none',
          careerId: c.id,
          careerName: c.name,
          modalityName: 'Sin Modalidad',
          coordinatorName: c.coordinatorName,
          durationSemesters: c.durationSemesters,
          subjects: c.subjects
        });
      } else {
        c.modalityNames.forEach(mName => {
          // Filter subjects that belong to this modality, or have no specific modalities, 
          // or we just include ones that have this modality if they have modalities defined.
          // Wait, if a subject has modalityNames, it should ONLY appear if it includes mName.
          // If a subject has NO modalityNames, we might show it or hide it? The user said: "no todas las materias seran para todas las modalidades".
          // Let's assume if it has NO modalities, it belongs to ALL modalities (or just show it). 
          // Best is to strictly match if it has them.
          const filteredSubjects = c.subjects.filter(subj => {
            if (!subj.modalityNames || subj.modalityNames.length === 0) return true; // fallback
            return subj.modalityNames.includes(mName);
          });

          groups.push({
            id: c.id + '_' + mName,
            careerId: c.id,
            careerName: c.name,
            modalityName: mName,
            coordinatorName: c.coordinatorName,
            durationSemesters: c.durationSemesters,
            subjects: filteredSubjects
          });
        });
      }
    });
    return groups;
  });

  // Apply filters
  filteredAcademicGroups = computed<AcademicGroup[]>(() => {
    let groups = this.academicGroups();
    
    const fCareer = this.filterCareer().toLowerCase().trim();
    if (fCareer) {
      groups = groups.filter(g => g.careerName.toLowerCase().includes(fCareer));
    }

    const fMod = this.filterModality();
    if (fMod) {
      groups = groups.filter(g => g.modalityName === fMod);
    }

    const fSubj = this.filterSubject().toLowerCase().trim();
    const fSem = this.filterSemester();

    if (fSubj || fSem) {
      groups = groups.map(g => {
        let filteredSubjs = g.subjects;
        if (fSubj) {
          filteredSubjs = filteredSubjs.filter(s => s.name.toLowerCase().includes(fSubj) || s.id.toLowerCase().includes(fSubj));
        }
        if (fSem) {
          filteredSubjs = filteredSubjs.filter(s => s.semester === fSem);
        }
        return { ...g, subjects: filteredSubjs };
      }).filter(g => g.subjects.length > 0); // Hide groups that have 0 subjects after filtering? 
      // User requested: "Si una carrera no tiene materias que coincidan, se ocultará."
    }

    return groups;
  });

  getSemesterColor(sem: number): string {
    const colors = this.academicService.semesterColors();
    const found = colors.find(c => c.semester === sem);
    if (found) return found.color;
    
    // Default fallback colors
    const fallbacks = ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#64748b', '#0f172a', '#0ea5e9', '#22c55e', '#f59e0b', '#ef4444'];
    return fallbacks[(sem - 1) % fallbacks.length] || '#0ea5e9';
  }

  saveColor(sem: number, color: string) {
    this.academicService.saveSemesterColor(sem, color).subscribe();
  }

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

  scrollToAcademic() {
    const el = document.getElementById('academic-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  getSubjectsBySemester(subjects: CareerSubject[]) {
    const grouped = new Map<number, CareerSubject[]>();
    for (const sub of subjects) {
      if (!grouped.has(sub.semester)) {
        grouped.set(sub.semester, []);
      }
      grouped.get(sub.semester)!.push(sub);
    }
    return Array.from(grouped.entries()).map(([semester, subjs]) => ({ semester, subjects: subjs })).sort((a, b) => a.semester - b.semester);
  }

  goToAcademic(tab: string) {
    this.router.navigate(['/admin/academic'], { queryParams: { tab } });
  }
}
