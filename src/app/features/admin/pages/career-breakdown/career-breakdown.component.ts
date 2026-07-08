import { Component, inject, signal, computed, OnInit, ElementRef, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AcademicService } from '../../../../core/services/academic.service';
import { AccordionModule } from 'primeng/accordion';
import { TableModule } from 'primeng/table';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MultiSelectModule } from 'primeng/multiselect';
import { ColorPickerModule } from 'primeng/colorpicker';
import { FormsModule } from '@angular/forms';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

interface SubjectItem {
  id: string;
  name: string;
  code: string;
  semester: number;
  credits: number;
  hours?: number;
  modalityNames: string[];
  teacherName?: string;
}

interface SemesterGroup {
  semester: number;
  subjects: SubjectItem[];
}

interface CurriculumBreakdown {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  semesters: SemesterGroup[];
}

interface CareerInfo {
  id: string;
  code: string;
  name: string;
  durationSemesters: number;
  coordinatorName: string | null;
  modalityNames: string[];
  isActive: boolean;
}

interface CareerBreakdown {
  career: CareerInfo;
  curriculums: CurriculumBreakdown[];
}

import { SelectModule } from 'primeng/select';
import { PopoverModule } from 'primeng/popover';

@Component({
  selector: 'app-career-breakdown',
  standalone: true,
  imports: [CommonModule, AccordionModule, TableModule, BadgeModule, ButtonModule, SkeletonModule, InputTextModule, IconFieldModule, InputIconModule, FormsModule, MultiSelectModule, ColorPickerModule, RouterModule, SelectModule, PopoverModule],
  templateUrl: './career-breakdown.component.html',
  styleUrls: ['./career-breakdown.component.scss']
})
export class CareerBreakdownComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private academicService = inject(AcademicService);

  breakdown = signal<CareerBreakdown | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  careerId = signal<string>('');
  searchQuery = signal<string>('');
  selectedSemesters = signal<number[]>([]);
  expandedCurriculums = signal<string[]>([]);
  expandedSemesters = signal<number[]>([]);

  accordionEl = viewChild<ElementRef<HTMLElement>>('accordion');

  semesterColors = this.academicService.semesterColors;

  predefinedColors = [
    { name: 'Índigo', value: '#312e81' },
    { name: 'Azul Cobalto', value: '#1d4ed8' },
    { name: 'Azul Cielo', value: '#0ea5e9' },
    { name: 'Verde Esmeralda', value: '#059669' },
    { name: 'Verde Bosque', value: '#166534' },
    { name: 'Verde Oliva', value: '#65a30d' },
    { name: 'Amarillo Mostaza', value: '#ca8a04' },
    { name: 'Naranja Quemado', value: '#ea580c' },
    { name: 'Rojo Ladrillo', value: '#b91c1c' },
    { name: 'Rosa Carmín', value: '#be123c' },
    { name: 'Violeta', value: '#7e22ce' },
    { name: 'Púrpura Oscuro', value: '#4c1d95' },
    { name: 'Gris Pizarra', value: '#475569' },
    { name: 'Gris Carbón', value: '#334155' },
    { name: 'Marrón Tierra', value: '#78350f' }
  ];

  availableSemesters = computed(() => {
    const data = this.breakdown();
    if (!data || !data.curriculums) return [];
    const semSet = new Set<number>();
    data.curriculums.forEach((c: any) => c.semesters.forEach((s: any) => semSet.add(s.semester)));
    return Array.from(semSet).sort((a, b) => a - b).map(s => ({ label: `Semestre ${s}`, value: s }));
  });

  filteredBreakdown = computed(() => {
    const data = this.breakdown();
    if (!data) return null;
    
    const normalizeString = (str: string) => {
      if (!str) return '';
      return str.normalize('NFD').replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
    };

    const query = normalizeString(this.searchQuery());
    const selSems = this.selectedSemesters();

    const validCurriculums = data.curriculums.filter((c: any) => c.name && c.id).map((cur: any) => {
      let totalSubjects = 0;
      let totalCurriculumCredits = 0;
      const enhancedSemesters = cur.semesters
        .filter((sem: any) => selSems.length === 0 || selSems.includes(sem.semester))
        .map((sem: any) => {
          totalSubjects += sem.subjects.length;
          const totalHours = sem.subjects.reduce((acc: number, s: any) => acc + (s.hours || 0), 0);
          const totalCredits = sem.subjects.reduce((acc: number, s: any) => acc + (s.credits || 0), 0);
          totalCurriculumCredits += totalCredits;
          return { ...sem, totalHours, totalCredits };
        });
      return { ...cur, semesters: enhancedSemesters, totalSubjects, totalSemesters: enhancedSemesters.length, totalCredits: totalCurriculumCredits };
    });

    if (!query) {
      return { ...data, curriculums: validCurriculums };
    }

    const newCurriculums = validCurriculums.map((cur: any) => {
      let totalSubjects = 0;
      let totalCurriculumCredits = 0;
      const newSemesters = cur.semesters.map((sem: any) => {
        const filteredSubjects = sem.subjects.filter((sub: any) => 
          normalizeString(sub.name).includes(query) || normalizeString(sub.code).includes(query)
        );
        totalSubjects += filteredSubjects.length;
        const totalHours = filteredSubjects.reduce((acc: number, s: any) => acc + (s.hours || 0), 0);
        const totalCredits = filteredSubjects.reduce((acc: number, s: any) => acc + (s.credits || 0), 0);
        totalCurriculumCredits += totalCredits;
        return { ...sem, subjects: filteredSubjects, totalHours, totalCredits };
      }).filter((sem: any) => sem.subjects.length > 0);
      return { ...cur, semesters: newSemesters, totalSubjects, totalSemesters: newSemesters.length, totalCredits: totalCurriculumCredits };
    });

    return { ...data, curriculums: newCurriculums };
  });

  constructor() {
    this.careerId.set(this.route.snapshot.paramMap.get('careerId') || '');
  }

  ngOnInit() {
    const id = this.careerId();
    if (!id) {
      this.error.set('ID de carrera no válido');
      this.loading.set(false);
      return;
    }

    this.academicService.getCareerBreakdown(id).subscribe({
      next: (data) => {
        this.breakdown.set(data);
        const validCurriculums = data.curriculums.filter((c: any) => c.name && c.id);
        if (validCurriculums.length > 0) {
          // Do not auto-expand curriculums or semesters. Let the user open them.
          this.expandedCurriculums.set([]);
          this.expandedSemesters.set([]);
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar el desglose de la carrera');
        this.loading.set(false);
        console.error('Error loading career breakdown', err);
      }
    });
  }

  onSemestersChange(val: any) {
    this.expandedSemesters.set(val || []);
  }

  onCurriculumsChange(val: any) {
    this.expandedCurriculums.set(val || []);
  }

  scrollToPanel() {
    setTimeout(() => {
      this.accordionEl()?.nativeElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  }

  getSemesterColor(sem: number): string {
    const colors = this.semesterColors();
    const found = colors.find(c => c.semester === sem);
    if (found && found.color) return found.color;
    const fallbacks = ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#64748b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#06b6d4'];
    return fallbacks[(sem - 1) % fallbacks.length];
  }

  updateSemesterColor(semester: number, event: any) {
    const color = event?.value || event;
    if (color) {
      // Optimistic UI Update: change color instantly
      const currentColors = this.academicService.semesterColors();
      const existingIndex = currentColors.findIndex(c => c.semester === semester);
      const newColors = [...currentColors];
      
      if (existingIndex >= 0) {
        newColors[existingIndex] = { ...newColors[existingIndex], color };
      } else {
        newColors.push({ semester, color });
      }
      this.academicService.semesterColors.set(newColors);

      // Save to backend
      this.academicService.saveSemesterColor(semester, color).subscribe();
    }
  }

  reload() {
    this.loading.set(true);
    this.error.set(null);
    this.ngOnInit();
  }

  goBack() {
    this.router.navigate(['/admin']);
  }
}
