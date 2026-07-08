import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { CoordinatorService } from '../../../core/services/coordinator.service';
import { UserService } from '../../../core/services/user.service';
import { AcademicService } from '../../../core/services/academic.service';
import { MessageService, ConfirmationService } from 'primeng/api';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { MultiSelectModule } from 'primeng/multiselect';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { AccordionModule } from 'primeng/accordion';
import { BadgeModule } from 'primeng/badge';
import { SelectModule } from 'primeng/select';

export interface TeacherAssignmentConfig {
  teacherId: string;
  modalityIds: string[];
  jornadaIds: string[];
}

@Component({
  selector: 'app-career-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AccordionModule,
    BadgeModule,
    ButtonModule,
    SkeletonModule,
    TableModule,
    DialogModule,
    SelectModule,
    MultiSelectModule,
    ToastModule,
    ConfirmDialogModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './career-detail.component.html',
  styleUrl: './career-detail.component.scss',
})
export class CareerDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private coordinatorService = inject(CoordinatorService);
  private userService = inject(UserService);
  private academicService = inject(AcademicService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);

  career = signal<any>(null);
  
  // Data lists for selects
  teachers = signal<any[]>([]);
  terms = signal<any[]>([]);
  modalities = signal<any[]>([]);
  jornadas = signal<any[]>([]);
  
  curriculums = signal<any[]>([]);
  careerName = signal<string>('');
  loading = signal<boolean>(true);

  // Filters
  searchQuery = signal<string>('');
  selectedSemesters = signal<number[]>([]);
  
  availableSemesters = computed(() => {
    const sems = new Set<number>();
    for (const cur of this.curriculums()) {
      for (const sem of cur.semesters || []) {
        sems.add(sem.semester);
      }
    }
    return Array.from(sems).sort((a, b) => a - b);
  });

  filteredCurriculums = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const sems = this.selectedSemesters();
    
    return this.curriculums().map(cur => {
      // Filter semesters
      let filteredSemesters = cur.semesters || [];
      if (sems.length > 0) {
        filteredSemesters = filteredSemesters.filter((sem: any) => sems.includes(sem.semester));
      }
      
      // Filter subjects within those semesters
      if (q) {
        filteredSemesters = filteredSemesters.map((sem: any) => ({
          ...sem,
          subjects: sem.subjects.filter((sub: any) => 
            sub.name.toLowerCase().includes(q) || 
            sub.code.toLowerCase().includes(q)
          )
        })).filter((sem: any) => sem.subjects.length > 0);
      }
      
      return {
        ...cur,
        semesters: filteredSemesters
      };
    });
  });
  
  selectedCurriculum = signal<any | null>(null);
  
  // Bulk Offer Modal State
  showOfferModal = signal(false);
  
  // Schedule Modal State
  displayScheduleModal = signal(false);
  scheduleModalData = signal<{
    subject: any;
    teacherId: string;
    teacherName: string;
    assignments: any[]; // The specific assignments for this teacher in this subject
  } | null>(null);
  
  assigning = signal(false);
  
  bulkOfferForm = {
    semester: 0,
    academicTermId: '',
    curriculumId: '',
    subjects: [] as any[],
    subjectConfigs: {} as Record<string, TeacherAssignmentConfig[]>
  };

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadData(id);
    }
  }

  loadData(careerId: string) {
    this.loading.set(true);

    forkJoin({
      teachers: this.userService.getUsers(1, 1000, 'teacher'),
      terms: this.coordinatorService.getTerms(),
      modalities: this.coordinatorService.getModalities(),
      jornadas: this.coordinatorService.getJornadas(),
      careerDetail: this.coordinatorService.getCareerDetail(careerId)
    }).subscribe({
      next: (res) => {
        const mappedTeachers = res.teachers.data.map((u: any) => ({
          ...u,
          fullName: `${u.firstName} ${u.lastName}`,
        }));
        this.teachers.set(mappedTeachers);

        this.terms.set(res.terms.filter((t: any) => t.isActive));
        if (this.terms().length > 0 && !this.bulkOfferForm.academicTermId) {
          this.bulkOfferForm.academicTermId = this.terms()[0].id;
        }

        const career = res.careerDetail.career;
        const curriculums = res.careerDetail.curriculums.map((cur: any) => {
          if (cur.semesters) {
            cur.semesters = cur.semesters.map((sem: any) => {
              if (sem.subjects) {
                sem.subjects = sem.subjects.map((sub: any) => {
                  if (sub.assignments && sub.assignments.length > 0) {
                    const groups = new Map<string, any>();
                    for (const assign of sub.assignments) {
                      if (!groups.has(assign.teacherId)) {
                        groups.set(assign.teacherId, {
                          teacherId: assign.teacherId,
                          teacherName: assign.teacherName,
                          modalityNames: new Set<string>(),
                          jornadaNames: new Set<string>(),
                          assignmentIds: []
                        });
                      }
                      const group = groups.get(assign.teacherId);
                      if (assign.modalityName) group.modalityNames.add(assign.modalityName);
                      if (assign.jornadaName) group.jornadaNames.add(assign.jornadaName);
                      group.assignmentIds.push(assign.id);
                    }
                    sub.groupedAssignments = Array.from(groups.values()).map(g => ({
                      ...g,
                      modalityNames: Array.from(g.modalityNames).join(', '),
                      jornadaNames: Array.from(g.jornadaNames).join(', ')
                    }));
                  } else {
                    sub.groupedAssignments = [];
                  }
                  return sub;
                });
              }
              return sem;
            });
          }
          return cur;
        });
        
        this.career.set(career);
        this.curriculums.set(curriculums);

        const careerMods = career.modalityIds || [];
        const careerJorns = career.jornadaIds || [];

        if (careerMods.length > 0) {
          this.modalities.set(res.modalities.filter((m: any) => careerMods.includes(m.id)));
        } else {
          this.modalities.set(res.modalities);
        }

        if (careerJorns.length > 0) {
          this.jornadas.set(res.jornadas.filter((j: any) => careerJorns.includes(j.id)));
        } else {
          this.jornadas.set(res.jornadas);
        }

        if (this.selectedCurriculum()) {
          const updatedCur = curriculums.find((c: any) => c.id === this.selectedCurriculum().id);
          this.selectedCurriculum.set(updatedCur || null);
        }

        this.loading.set(false);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar el detalle de la carrera',
        });
        this.loading.set(false);
      }
    });
  }

  selectCurriculum(cur: any) {
    this.selectedCurriculum.set(
      this.selectedCurriculum()?.id === cur.id ? null : cur,
    );
  }

  openBulkOfferModal(semester: number, subjects: any[], curriculumId: string) {
    const termId = this.bulkOfferForm.academicTermId || (this.terms().length > 0 ? this.terms()[0].id : '');
    
    this.bulkOfferForm = {
      semester,
      curriculumId,
      academicTermId: termId,
      subjects: [...subjects],
      subjectConfigs: {}
    };

    // Pre-load configs if we have a term selected
    this.updateConfigsFromTerm();
    
    this.showOfferModal.set(true);
  }

  updateConfigsFromTerm() {
    const termId = this.bulkOfferForm.academicTermId;
    if (!termId) return;

    for (const sub of this.bulkOfferForm.subjects) {
      const configsMap = new Map<string, TeacherAssignmentConfig>();
      
      if (sub.assignments && sub.assignments.length > 0) {
        const termAssignments = sub.assignments.filter((a: any) => a.academicTermId === termId);
        
        for (const assign of termAssignments) {
          if (!configsMap.has(assign.teacherId)) {
            configsMap.set(assign.teacherId, {
              teacherId: assign.teacherId,
              modalityIds: [],
              jornadaIds: []
            });
          }
          const config = configsMap.get(assign.teacherId)!;
          if (assign.modalityId && !config.modalityIds.includes(assign.modalityId)) {
            config.modalityIds.push(assign.modalityId);
          }
          if (assign.jornadaId && !config.jornadaIds.includes(assign.jornadaId)) {
            config.jornadaIds.push(assign.jornadaId);
          }
        }
      }
      
      this.bulkOfferForm.subjectConfigs[sub.id] = Array.from(configsMap.values());
    }
  }

  addTeacherConfig(subjectId: string) {
    if (!this.bulkOfferForm.subjectConfigs[subjectId]) {
      this.bulkOfferForm.subjectConfigs[subjectId] = [];
    }
    this.bulkOfferForm.subjectConfigs[subjectId].push({
      teacherId: '',
      modalityIds: [],
      jornadaIds: []
    });
  }

  removeTeacherConfig(subjectId: string, index: number) {
    this.bulkOfferForm.subjectConfigs[subjectId].splice(index, 1);
  }

  getAvailableTeachersForSubject(subjectId: string, currentTeacherId: string) {
    const configs = this.bulkOfferForm.subjectConfigs[subjectId] || [];
    const usedIds = configs.map(c => c.teacherId).filter(id => id !== currentTeacherId && id !== '');
    return this.teachers().filter(t => !usedIds.includes(t.id));
  }

  getAvailableModalitiesForSubject(subjectId: string, currentConfig: TeacherAssignmentConfig) {
    const configs = this.bulkOfferForm.subjectConfigs[subjectId] || [];
    
    // Get all modality IDs used by OTHER configs
    const usedModalityIds = new Set<string>();
    for (const c of configs) {
      if (c !== currentConfig) {
        c.modalityIds.forEach(id => usedModalityIds.add(id));
      }
    }
    
    // Only return modalities that are NOT used by other configs
    return this.modalities().filter(m => !usedModalityIds.has(m.id));
  }

  getAvailableJornadasForSubject(subjectId: string, currentConfig: TeacherAssignmentConfig) {
    const configs = this.bulkOfferForm.subjectConfigs[subjectId] || [];
    
    const usedJornadaIds = new Set<string>();
    for (const c of configs) {
      if (c !== currentConfig) {
        c.jornadaIds.forEach(id => usedJornadaIds.add(id));
      }
    }
    
    return this.jornadas().filter(j => !usedJornadaIds.has(j.id));
  }

  closeOfferModal() {
    this.showOfferModal.set(false);
  }

  saveBulkOffer() {
    if (!this.bulkOfferForm.academicTermId) {
      this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Debe seleccionar un Ciclo Académico.' });
      return;
    }

    const payloadSubjects: any[] = [];
    
    for (const sub of this.bulkOfferForm.subjects) {
      const configs = this.bulkOfferForm.subjectConfigs[sub.id] || [];
      const validConfigs = configs.filter(c => c.teacherId && c.modalityIds.length > 0 && c.jornadaIds.length > 0);
      
      if (validConfigs.length > 0) {
        payloadSubjects.push({
          subjectId: sub.id,
          assignments: validConfigs
        });
      }
    }

    if (payloadSubjects.length === 0) {
      this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Debe configurar al menos un docente con modalidades y jornadas para alguna materia.' });
      return;
    }

    this.assigning.set(true);

    this.coordinatorService.bulkAssignTeachers({
      curriculumId: this.bulkOfferForm.curriculumId,
      academicTermId: this.bulkOfferForm.academicTermId,
      subjects: payloadSubjects
    }).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Oferta académica del semestre guardada exitosamente',
        });
        
        const careerId = this.route.snapshot.paramMap.get('id');
        if (careerId) {
          this.loadData(careerId);
        }
        
        this.assigning.set(false);
        this.closeOfferModal();
      },
      error: (err) => {
        this.assigning.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message ?? 'Error al guardar la oferta',
        });
      },
    });
  }

  removeTeacher(subjectId: string, curriculumId?: string, assignmentIds?: string | string[]) {
    this.assigning.set(true);

    if (Array.isArray(assignmentIds)) {
      const requests = assignmentIds.map(id => this.coordinatorService.unassignTeacher(subjectId, curriculumId, id));
      forkJoin(requests).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Oferta retirada exitosamente' });
          const careerId = this.route.snapshot.paramMap.get('id');
          if (careerId) this.loadData(careerId);
          this.assigning.set(false);
        },
        error: (err) => {
          this.assigning.set(false);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al retirar la oferta' });
        }
      });
      return;
    }

    this.coordinatorService.unassignTeacher(
      subjectId,
      curriculumId,
      assignmentIds,
    ).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Oferta retirada exitosamente',
        });
        const careerId = this.route.snapshot.paramMap.get('id');
        if (careerId) {
          this.loadData(careerId);
        }
        this.assigning.set(false);
      },
      error: (err) => {
        this.assigning.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message ?? 'Error al retirar la oferta',
        });
      },
    });
  }

  totalSubjects(cur: any): number {
    return cur.semesters?.reduce((sum: number, s: any) => sum + s.subjects.length, 0) || 0;
  }

  totalCredits(cur: any): number {
    return cur.semesters?.reduce((sum: number, s: any) => sum + this.semesterCredits(s), 0) || 0;
  }

  semesterCredits(sem: any): number {
    return sem.subjects?.reduce((sum: number, sub: any) => sum + (sub.credits || 0), 0) || 0;
  }

  semesterHours(sem: any): number {
    return this.semesterCredits(sem) * 48;
  }

  getSemesterColor(semester: number): string {
    const colors = this.academicService.semesterColors();
    const found = colors.find(c => c.semester === semester);
    if (found) return found.color;
    const defaultColors = ['#312e81', '#1d4ed8', '#0ea5e9', '#059669', '#166534', '#65a30d', '#ca8a04', '#ea580c', '#b91c1c', '#be123c'];
    return defaultColors[(semester - 1) % defaultColors.length] || '#94a3b8';
  }

  goBack() {
    this.router.navigate(['/coordinator']);
  }

  // ---- SCHEDULES LOGIC ----
  openScheduleModal(subject: any, teacherId: string) {
    // Find the specific grouped assignment for this teacher
    const grouped = subject.groupedAssignments?.find((g: any) => g.teacherId === teacherId);
    if (!grouped) return;
    
    // Find all raw assignments for this teacher in this subject
    const rawAssignments = subject.assignments?.filter((a: any) => a.teacherId === teacherId) || [];
    
    // Prepare the data. For each raw assignment, we need to fetch its existing schedules.
    // We'll initialize them with an empty schedules array first.
    const assignmentsWithSchedules = rawAssignments.map((a: any) => ({
      ...a,
      schedules: [] // will be loaded from API
    }));

    this.scheduleModalData.set({
      subject,
      teacherId,
      teacherName: grouped.teacherName,
      assignments: assignmentsWithSchedules
    });

    this.displayScheduleModal.set(true);

    // Now fetch schedules for each assignment from the backend
    assignmentsWithSchedules.forEach((assign: any, index: number) => {
      this.coordinatorService.getSchedules(assign.id).subscribe({
        next: (schedules) => {
          this.scheduleModalData.update(data => {
            if (!data) return data;
            const updatedAssignments = [...data.assignments];
            updatedAssignments[index] = { ...updatedAssignments[index], schedules };
            return { ...data, assignments: updatedAssignments };
          });
        }
      });
    });
  }

  closeScheduleModal() {
    this.displayScheduleModal.set(false);
    this.scheduleModalData.set(null);
  }

  addScheduleLine(assignmentIndex: number) {
    this.scheduleModalData.update(data => {
      if (!data) return data;
      const updatedAssignments = [...data.assignments];
      const assign = updatedAssignments[assignmentIndex];
      assign.schedules = [...assign.schedules, { dayOfWeek: 'Lunes', startTime: '18:00', endTime: '22:00' }];
      return { ...data, assignments: updatedAssignments };
    });
  }

  removeScheduleLine(assignmentIndex: number, scheduleIndex: number) {
    this.scheduleModalData.update(data => {
      if (!data) return data;
      const updatedAssignments = [...data.assignments];
      const assign = updatedAssignments[assignmentIndex];
      const newSchedules = [...assign.schedules];
      newSchedules.splice(scheduleIndex, 1);
      assign.schedules = newSchedules;
      return { ...data, assignments: updatedAssignments };
    });
  }

  saveSchedules() {
    const data = this.scheduleModalData();
    if (!data) return;

    let totalSaved = 0;
    const totalToSave = data.assignments.length;
    
    // Save schedules for each assignment
    data.assignments.forEach(assign => {
      this.coordinatorService.saveSchedules(assign.id, assign.schedules).subscribe({
        next: () => {
          totalSaved++;
          if (totalSaved === totalToSave) {
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Horarios guardados correctamente'
            });
            this.closeScheduleModal();
          }
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudieron guardar los horarios'
          });
        }
      });
    });
  }
}
