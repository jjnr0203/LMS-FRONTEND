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
import { TabsModule } from 'primeng/tabs';

export interface TeacherAssignmentConfig {
  teacherId: string;
  modalityId: string;
  jornadaId: string;
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
    InputTextModule,
    TabsModule
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
  filterTeacher = signal('');
  filterSubject = signal('');
  filterSemester = signal('');
  filterModality = signal('');
  filterJornada = signal('');
  removingSubjectId = signal<string | null>(null);
  removingTeacherId = signal<string | null>(null);
  
  bulkOfferForm = {
    semester: 0,
    academicTermId: '',
    curriculumId: '',
    subjects: [] as any[],
    subjectConfigs: {} as Record<string, TeacherAssignmentConfig[]>
  };

  teacherLoads = computed(() => {
    const termId = this.bulkOfferForm.academicTermId;
    const loads = new Map<string, any>();
    for (const cur of this.filteredCurriculums()) {
      for (const sem of cur.semesters || []) {
        for (const sub of sem.subjects || []) {
          for (const assign of sub.assignments || []) {
            if (termId && assign.academicTermId !== termId) continue;
            
            if (!loads.has(assign.teacherId)) {
              loads.set(assign.teacherId, {
                teacherId: assign.teacherId,
                teacherName: assign.teacherName,
                subjectsMap: new Map<string, any>(),
                totalHours: 0
              });
            }
            const load = loads.get(assign.teacherId)!;
            const pair = `${assign.modalityName || 'Sin Modalidad'} - ${assign.jornadaName || 'Sin Jornada'}`;
            const key = `${sub.name}|${pair}|${sem.semester}`;
            load.subjectsMap.set(key, { name: sub.name, pair: pair, semester: sem.semester });
            
            for (const sched of assign.schedules || []) {
              const start = sched.startTime;
              const end = sched.endTime;
              if (start && end) {
                const sSplit = start.split(':');
                const eSplit = end.split(':');
                const startMins = parseInt(sSplit[0]) * 60 + parseInt(sSplit[1]);
                const endMins = parseInt(eSplit[0]) * 60 + parseInt(eSplit[1]);
                const diff = (endMins - startMins) / 60;
                if (diff > 0) load.totalHours += diff;
              }
            }
          }
        }
      }
    }
    return Array.from(loads.values()).map(l => {
      const list = Array.from(l.subjectsMap.values());
      return {
        ...l,
        subjectCount: l.subjectsMap.size,
        subjectsList: list
      };
    }).sort((a, b) => b.totalHours - a.totalHours);
  });

  filteredTeacherLoads = computed(() => {
    const t = this.filterTeacher().toLowerCase().trim();
    const s = this.filterSubject().toLowerCase().trim();
    const sem = this.filterSemester().toLowerCase().trim();
    const m = this.filterModality().toLowerCase().trim();
    const j = this.filterJornada().toLowerCase().trim();
    
    let loads = this.teacherLoads().map(load => {
      let filteredSubjects = load.subjectsList;

      if (s) {
        filteredSubjects = filteredSubjects.filter((sub: any) => sub.name.toLowerCase().includes(s));
      }
      if (sem) {
        filteredSubjects = filteredSubjects.filter((sub: any) => sub.semester.toString() === sem || `semestre ${sub.semester}`.includes(sem));
      }
      if (m) {
        filteredSubjects = filteredSubjects.filter((sub: any) => {
          const parts = sub.pair.toLowerCase().split(' - ');
          return parts[0] && parts[0].trim() === m;
        });
      }
      if (j) {
        filteredSubjects = filteredSubjects.filter((sub: any) => {
          const parts = sub.pair.toLowerCase().split(' - ');
          return parts[1] && parts[1].trim() === j;
        });
      }

      return {
        ...load,
        subjectsList: filteredSubjects,
        subjectCount: filteredSubjects.length
      };
    });

    if (s || sem || m || j) {
      loads = loads.filter(l => l.subjectsList.length > 0);
    }

    if (t) {
      loads = loads.filter(l => l.teacherName.toLowerCase().includes(t));
    }

    return loads;
  });

  filterAvailableSemesters = computed(() => {
    const sems = new Set<number>();
    for (const load of this.teacherLoads()) {
      for (const sub of load.subjectsList) {
        if (sub.semester) sems.add(Number(sub.semester));
      }
    }
    return Array.from(sems).sort((a, b) => a - b).map(v => ({ label: `Semestre ${v}`, value: v.toString() }));
  });

  filterAvailableModalities = computed(() => {
    const mods = new Set<string>();
    for (const load of this.teacherLoads()) {
      for (const sub of load.subjectsList) {
        const parts = sub.pair.split(' - ');
        if (parts[0] && parts[0] !== 'Sin Modalidad') mods.add(parts[0].trim());
      }
    }
    return Array.from(mods).sort().map(v => ({ label: v, value: v.toLowerCase() }));
  });

  filterAvailableJornadas = computed(() => {
    const jors = new Set<string>();
    for (const load of this.teacherLoads()) {
      for (const sub of load.subjectsList) {
        const parts = sub.pair.split(' - ');
        if (parts.length > 1 && parts[1] && parts[1] !== 'Sin Jornada') jors.add(parts[1].trim());
      }
    }
    return Array.from(jors).sort().map(v => ({ label: v, value: v.toLowerCase() }));
  });

  calendarDays = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
  calendarHours = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];

  calendarEvents = computed(() => {
    const events: any[] = [];
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#14b8a6'];
    let colorIndex = 0;
    const subjectColors = new Map<string, string>();

    for (const cur of this.filteredCurriculums()) {
      for (const sem of cur.semesters || []) {
        for (const sub of sem.subjects || []) {
          for (const assign of sub.assignments || []) {
            for (const sched of assign.schedules || []) {
              if (sched.dayOfWeek && sched.startTime && sched.endTime) {
                if (!subjectColors.has(sub.name)) {
                   subjectColors.set(sub.name, colors[colorIndex % colors.length]);
                   colorIndex++;
                }

                const sSplit = sched.startTime.split(':');
                const eSplit = sched.endTime.split(':');
                const startMins = parseInt(sSplit[0]) * 60 + parseInt(sSplit[1]);
                const endMins = parseInt(eSplit[0]) * 60 + parseInt(eSplit[1]);
                
                const dayStartMins = 7 * 60; // 07:00
                const dayEndMins = 22 * 60; // 22:00
                const totalDayMins = dayEndMins - dayStartMins;

                const topPercent = ((startMins - dayStartMins) / totalDayMins) * 100;
                const heightPercent = ((endMins - startMins) / totalDayMins) * 100;

                events.push({
                  id: sched.id || Math.random().toString(),
                  dayOfWeek: sched.dayOfWeek,
                  subjectName: sub.name,
                  teacherName: assign.teacherName,
                  startTime: sched.startTime,
                  endTime: sched.endTime,
                  top: topPercent + '%',
                  height: heightPercent + '%',
                  color: subjectColors.get(sub.name)
                });
              }
            }
          }
        }
      }
    }
    return events;
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadData(id);
    }
  }

  loadData(careerId: string) {
    this.loading.set(true);

    this.coordinatorService.getCareerDetail(careerId).subscribe({
      next: (careerDetailRes) => {
        const career = careerDetailRes.career;
        const facultyIds = career.facultyId ? [career.facultyId] : [];

        forkJoin({
          teachers: this.userService.getUsers(1, 1000, 'teacher', undefined, facultyIds),
          terms: this.coordinatorService.getTerms(),
          modalities: this.coordinatorService.getModalities(),
          jornadas: this.coordinatorService.getJornadas(),
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

            const curriculums = careerDetailRes.curriculums.map((cur: any) => {
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
                          pairs: new Set<string>(),
                          assignmentIds: []
                        });
                      }
                      const group = groups.get(assign.teacherId);
                      const pair = `${assign.modalityName || 'Sin Modalidad'} - ${assign.jornadaName || 'Sin Jornada'}`;
                      group.pairs.add(pair);
                      group.assignmentIds.push(assign.id);
                    }
                    sub.groupedAssignments = Array.from(groups.values()).map(g => ({
                      ...g,
                      displayPairs: Array.from(g.pairs).join(' ; ')
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
              detail: 'No se pudieron cargar los datos asociados a la carrera',
            });
            this.loading.set(false);
          }
        });
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
      const configsMap: TeacherAssignmentConfig[] = [];
      
      if (sub.assignments && sub.assignments.length > 0) {
        const termAssignments = sub.assignments.filter((a: any) => a.academicTermId === termId);
        
        for (const assign of termAssignments) {
            configsMap.push({
              teacherId: assign.teacherId,
              modalityId: assign.modalityId || '',
              jornadaId: assign.jornadaId || ''
            });
        }
      }
      this.bulkOfferForm.subjectConfigs[sub.id] = configsMap;
    }
  }

  addTeacherConfig(subjectId: string) {
    if (!this.bulkOfferForm.subjectConfigs[subjectId]) {
      this.bulkOfferForm.subjectConfigs[subjectId] = [];
    }
    this.bulkOfferForm.subjectConfigs[subjectId].push({
      teacherId: '',
      modalityId: '',
      jornadaId: ''
    });
  }

  removeTeacherConfig(subjectId: string, index: number) {
    this.bulkOfferForm.subjectConfigs[subjectId].splice(index, 1);
  }

  getAvailableTeachersForSubject(subjectId: string, currentTeacherId: string) {
    // Permitimos seleccionar al mismo docente múltiples veces para diferentes combinaciones
    return this.teachers();
  }

  getAvailableModalitiesForSubject(subjectId: string, currentConfig: TeacherAssignmentConfig) {
    const configs = this.bulkOfferForm.subjectConfigs[subjectId] || [];
    
    const usedModalityIds = new Set<string>();
    for (const c of configs) {
      if (c !== currentConfig && c.modalityId) {
        usedModalityIds.add(c.modalityId);
      }
    }
    
    return this.modalities().filter(m => !usedModalityIds.has(m.id));
  }

  getAvailableJornadasForSubject(subjectId: string, currentConfig: TeacherAssignmentConfig) {
    const configs = this.bulkOfferForm.subjectConfigs[subjectId] || [];
    
    const usedJornadaIds = new Set<string>();
    for (const c of configs) {
      if (c !== currentConfig && c.jornadaId) {
        usedJornadaIds.add(c.jornadaId);
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
      const validConfigs = configs.filter(c => c.teacherId && c.modalityId && c.jornadaId);
      
      if (validConfigs.length > 0) {
        // Transformar al payload que espera el backend (arrays de 1 elemento)
        const payloadAssignments = validConfigs.map(c => ({
          teacherId: c.teacherId,
          modalityIds: [c.modalityId],
          jornadaIds: [c.jornadaId]
        }));

        payloadSubjects.push({
          subjectId: sub.id,
          assignments: payloadAssignments
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

  removeTeacher(subjectId: string, curriculumId?: string, assignmentIds?: string | string[], teacherId?: string) {
    if (teacherId) {
      this.removingTeacherId.set(teacherId);
    } else {
      this.removingSubjectId.set(subjectId);
    }

    if (Array.isArray(assignmentIds)) {
      const requests = assignmentIds.map(id => this.coordinatorService.unassignTeacher(subjectId, curriculumId, id));
      forkJoin(requests).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Oferta retirada exitosamente' });
          const careerId = this.route.snapshot.paramMap.get('id');
          if (careerId) this.loadData(careerId);
          this.removingSubjectId.set(null);
          this.removingTeacherId.set(null);
        },
        error: (err) => {
          this.removingSubjectId.set(null);
          this.removingTeacherId.set(null);
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
        this.removingSubjectId.set(null);
        this.removingTeacherId.set(null);
      },
      error: (err) => {
        this.removingSubjectId.set(null);
        this.removingTeacherId.set(null);
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
    return defaultColors[(semester - 1) % defaultColors.length] || '#9e9e9e';
  }

  getSubjectColorClasses(name: string) {
    const themes = [
      { bg: 'bg-blue-100', text: 'text-blue-900', subtext: 'text-blue-700' },
      { bg: 'bg-green-100', text: 'text-green-900', subtext: 'text-green-700' },
      { bg: 'bg-orange-100', text: 'text-orange-900', subtext: 'text-orange-700' },
      { bg: 'bg-cyan-100', text: 'text-cyan-900', subtext: 'text-cyan-700' },
      { bg: 'bg-purple-100', text: 'text-purple-900', subtext: 'text-purple-700' },
      { bg: 'bg-teal-100', text: 'text-teal-900', subtext: 'text-teal-700' },
      { bg: 'bg-pink-100', text: 'text-pink-900', subtext: 'text-pink-700' },
      { bg: 'bg-indigo-100', text: 'text-indigo-900', subtext: 'text-indigo-700' },
      { bg: 'bg-yellow-100', text: 'text-yellow-900', subtext: 'text-yellow-800' },
      { bg: 'bg-red-100', text: 'text-red-900', subtext: 'text-red-700' }
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return themes[Math.abs(hash) % themes.length];
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
