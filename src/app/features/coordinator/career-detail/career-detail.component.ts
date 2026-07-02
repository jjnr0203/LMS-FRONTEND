import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CoordinatorService } from '../../../core/services/coordinator.service';
import { UserService } from '../../../core/services/user.service';
import { MessageService } from 'primeng/api';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { TableModule } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import { BadgeModule } from 'primeng/badge';
import { AccordionModule } from 'primeng/accordion';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-career-detail',
  standalone: true,
  imports: [
    CardModule,
    ButtonModule,
    ToastModule,
    TableModule,
    SelectModule,
    BadgeModule,
    AccordionModule,
    FormsModule,
  ],
  providers: [MessageService],
  templateUrl: './career-detail.component.html',
  styleUrl: './career-detail.component.scss',
})
export class CareerDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private coordinatorService = inject(CoordinatorService);
  private userService = inject(UserService);
  private messageService = inject(MessageService);

  career = signal<any>(null);
  curriculums = signal<any[]>([]);
  teachers = signal<any[]>([]);
  selectedTeacher: { [subjectId: string]: string } = {};
  selectedCurriculum = signal<any | null>(null);
  editingSubject = signal<string | null>(null);
  loading = signal(false);
  assigning = signal(false);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadData(id);
    }
  }

  loadData(careerId: string) {
    this.loading.set(true);

    this.userService.getUsers(1, 1000, 'teacher').subscribe({
      next: (res) => {
        const mapped = res.data.map((u: any) => ({
          ...u,
          fullName: `${u.firstName} ${u.lastName}`,
        }));
        this.teachers.set(mapped);
      },
    });

    this.coordinatorService.getCareerDetail(careerId).subscribe({
      next: (res) => {
        this.career.set(res.career);
        this.curriculums.set(res.curriculums);
        this.loading.set(false);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar el detalle de la carrera',
        });
        this.loading.set(false);
      },
    });
  }

  selectCurriculum(cur: any) {
    this.selectedCurriculum.set(
      this.selectedCurriculum()?.id === cur.id ? null : cur,
    );
    this.selectedTeacher = {};
    this.editingSubject.set(null);
  }

  startEdit(subjectId: string) {
    this.editingSubject.set(subjectId);
  }

  cancelEdit() {
    this.editingSubject.set(null);
  }

  assignTeacher(subjectId: string) {
    const teacherId = this.selectedTeacher[subjectId];
    if (!teacherId) return;

    const teacher = this.teachers().find((t) => t.id === teacherId);
    const teacherName = teacher ? `${teacher.firstName} ${teacher.lastName}` : '';

    this.assigning.set(true);
    this.coordinatorService.assignTeacher({
      teacherId,
      subjectId,
      curriculumId: this.selectedCurriculum()?.id,
    }).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Docente asignado a la materia',
        });
        this.selectedTeacher[subjectId] = '';
        this.editingSubject.set(null);
        this.updateSubject(subjectId, { teacherId, teacherName });
        this.assigning.set(false);
      },
      error: (err) => {
        this.assigning.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message ?? 'Error al asignar docente',
        });
      },
    });
  }

  removeTeacher(subjectId: string) {
    this.assigning.set(true);
    this.coordinatorService.unassignTeacher(
      subjectId,
      this.selectedCurriculum()?.id,
    ).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Docente retirado de la materia',
        });
        this.updateSubject(subjectId, { teacherId: null, teacherName: null });
        this.assigning.set(false);
      },
      error: (err) => {
        this.assigning.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message ?? 'Error al retirar docente',
        });
      },
    });
  }

  private updateSubject(subjectId: string, patch: Partial<{ teacherId: string | null; teacherName: string | null }>) {
    const updatedList = this.curriculums().map((cur) => ({
      ...cur,
      semesters: cur.semesters.map((sem: any) => ({
        ...sem,
        subjects: sem.subjects.map((sub: any) =>
          sub.id === subjectId ? { ...sub, ...patch } : sub,
        ),
      })),
    }));
    this.curriculums.set(updatedList);
    const selectedId = this.selectedCurriculum()?.id;
    if (selectedId) {
      const match = updatedList.find((c) => c.id === selectedId);
      if (match) this.selectedCurriculum.set(match);
    }
  }

  totalSubjects(cur: any): number {
    return cur.semesters?.reduce((sum: number, s: any) => sum + s.subjects.length, 0) || 0;
  }

  goBack() {
    this.router.navigate(['/coordinator']);
  }
}
