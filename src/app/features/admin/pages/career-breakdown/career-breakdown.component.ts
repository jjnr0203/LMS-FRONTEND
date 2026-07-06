import { Component, inject, signal, OnInit, ElementRef, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AcademicService } from '../../../../core/services/academic.service';
import { AccordionModule } from 'primeng/accordion';
import { TableModule } from 'primeng/table';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';

interface SubjectItem {
  id: string;
  code: string;
  name: string;
  credits: number;
  semester: number;
  modalityNames: string[];
  teacherName: string | null;
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

@Component({
  selector: 'app-career-breakdown',
  standalone: true,
  imports: [CommonModule, AccordionModule, TableModule, BadgeModule, ButtonModule, SkeletonModule],
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

  accordionEl = viewChild<ElementRef<HTMLElement>>('accordion');

  semesterColors = this.academicService.semesterColors;

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
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar el desglose de la carrera');
        this.loading.set(false);
        console.error('Error loading career breakdown', err);
      }
    });
  }

  allSubjects(cur: CurriculumBreakdown): SubjectItem[] {
    if (!cur.semesters || !Array.isArray(cur.semesters)) return [];
    const result: SubjectItem[] = [];
    for (const sem of cur.semesters) {
      if (sem.subjects && Array.isArray(sem.subjects)) {
        for (const sub of sem.subjects) {
          result.push(sub);
        }
      }
    }
    return result;
  }

  scrollToPanel() {
    setTimeout(() => {
      this.accordionEl()?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  }

  getSemesterColor(sem: number): string {
    const colors = this.semesterColors();
    const found = colors.find(c => c.semester === sem);
    if (found) return found.color;
    const fallbacks = ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#64748b', '#0f172a', '#0ea5e9', '#22c55e', '#f59e0b', '#ef4444'];
    return fallbacks[(sem - 1) % fallbacks.length] || '#0ea5e9';
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
