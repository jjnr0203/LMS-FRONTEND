import { Component, OnInit, inject, ChangeDetectorRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { CheckboxModule } from 'primeng/checkbox';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { BadgeModule } from 'primeng/badge';
import { TagModule } from 'primeng/tag';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { AccordionModule } from 'primeng/accordion';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { PopoverModule } from 'primeng/popover';
import * as XLSX from 'xlsx';
import { AcademicService } from '../../../../../core/services/academic.service';
import { UserService } from '../../../../../core/services/user.service';
import { Career, Modality, Jornada, Faculty, User, Curriculum, Subject } from '../../../../../core/models';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-careers',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    MultiSelectModule,
    CheckboxModule,
    TextareaModule,
    ToastModule,
    ConfirmDialogModule,
    BadgeModule,
    TagModule,
    IconFieldModule,
    InputIconModule,
    AccordionModule,
    ProgressSpinnerModule,
    PopoverModule,
    SelectModule,
    MenuModule,
    TooltipModule
  ],
  templateUrl: './careers.html',
  styleUrls: ['./careers.scss'],
})
export class Careers implements OnInit {
  private academicService = inject(AcademicService);
  private userService = inject(UserService);
  private formBuilder = inject(FormBuilder);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private cdr = inject(ChangeDetectorRef);

  careers: Career[] = [];
  modalities: Modality[] = [];
  jornadas: Jornada[] = [];
  coordinators: User[] = [];
  faculties: Faculty[] = [];

  // --- Career dialog ---
  displayCareerDialog = false;
  careerForm!: FormGroup;
  isEditCareer = false;
  editCareerId: string | null = null;

  // --- Curriculum drill-down ---
  selectedCareer: Career | null = null;
  curriculums: Curriculum[] = [];

  // --- Subject drill-down ---
  selectedCurriculum: Curriculum | null = null;
  subjects: Subject[] = [];

  // --- Menus ---
  careerMenuItems: MenuItem[] = [];
  selectedCareerForMenu: any = null;
  
  curriculumMenuItems: MenuItem[] = [];
  selectedCurriculumForMenu: any = null;
  
  subjectMenuItems: MenuItem[] = [];
  selectedSubjectForMenu: any = null;

  searchQuery = signal<string>('');
  selectedSemesters = signal<number[]>([]);
  
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

  get availableSemesters() {
    const semSet = new Set<number>();
    this.subjects.forEach(s => semSet.add(s.semester || 0));
    return Array.from(semSet).sort((a, b) => a - b).map(s => ({ label: `Semestre ${s}`, value: s }));
  }

  get groupedSubjects(): { semester: number; subjects: Subject[]; totalCredits: number; totalHours: number }[] {
    const normalizeString = (str: string) => {
      if (!str) return '';
      return str.normalize('NFD').replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
    };
    
    const query = normalizeString(this.searchQuery());
    const selSems = this.selectedSemesters();
    
    const map = new Map<number, Subject[]>();
    for (const s of this.subjects) {
      const sem = s.semester || 0;
      
      if (selSems.length > 0 && !selSems.includes(sem)) continue;
      
      if (query) {
        const matchName = normalizeString(s.name).includes(query);
        const matchCode = normalizeString(s.code).includes(query);
        if (!matchName && !matchCode) continue;
      }
      
      if (!map.has(sem)) map.set(sem, []);
      map.get(sem)!.push(s);
    }
    return Array.from(map.entries())
      .map(([semester, subjects]) => {
        const totalCredits = subjects.reduce((acc, s) => acc + (s.credits || 0), 0);
        const totalHours = subjects.reduce((acc, s) => acc + (s.hours || 0), 0);
        return { semester, subjects, totalCredits, totalHours };
      })
      .sort((a, b) => a.semester - b.semester);
  }

  get possibleSuccessors(): Subject[] {
    const sem = this.subjectForm?.get('semester')?.value;
    if (!sem) return [];
    return this.subjects.filter(s => (s.semester || 0) > sem);
  }

  updateSemesterColor(semester: number, color: string) {
    const current = this.academicService.semesterColors();
    const idx = current.findIndex(c => c.semester === semester);
    const newColors = [...current];
    if (idx >= 0) {
      newColors[idx] = { ...newColors[idx], color };
    } else {
      newColors.push({ semester, color });
    }
    this.academicService.semesterColors.set(newColors);
    localStorage.setItem('lms_semester_colors', JSON.stringify(newColors));
  }

  // --- Curriculum CRUD dialogs ---
  displayCurriculumDialog = false;
  curriculumForm!: FormGroup;
  isEditCurriculum = false;
  editCurriculumId: string | null = null;

  // --- Subject CRUD dialogs ---
  displaySubjectDialog = false;
  subjectForm!: FormGroup;
  isEditSubject = false;
  editSubjectId: string | null = null;
  subjectSemesters: number[] = [];

  // --- Bulk upload dialog ---
  displayBulkDialog = false;
  bulkUploading = false;
  selectedBulkFile: File | null = null;

  selectedSubjectForPrerequisites: any = null;
  possiblePrerequisites: any[] = [];
  filteredPossiblePrerequisites: any[] = [];
  selectedPrerequisiteIds: string[] = [];
  displayPrerequisitesDialog = false;

  deletingAllSubjects: boolean = false;

  // --- Wizard: career → curriculum → subjects ---
  pendingWizardCurriculumId: string | null = null;
  wizardSemesters: number[] = [];

  submittedCareer = signal(false);
  submittedCurriculum = signal(false);
  submittedSubject = signal(false);

  get hasEmptyRequiredCareer() {
    if (!this.careerForm) return true;
    const c = this.careerForm.controls;
    return !c['name'].value || !c['code'].value || !c['durationSemesters'].value || !c['facultyId'].value || c['modalityIds'].value?.length === 0 || c['jornadaIds'].value?.length === 0;
  }

  get hasEmptyRequiredCurriculum() {
    if (!this.curriculumForm) return true;
    const c = this.curriculumForm.controls;
    return !c['name'].value;
  }

  get hasEmptyRequiredSubject() {
    if (!this.subjectForm) return true;
    const c = this.subjectForm.controls;
    return !c['name'].value || !c['code'].value || !c['credits'].value || c['hours'].value === null || !c['semester'].value;
  }

  filterLetters(event: any, form: FormGroup, controlName: string) {
    const value = event.target.value;
    const filteredValue = value.replace(/[^A-Za-zÁÉÍÓÚáéíóúñÑ ]/g, '');
    if (value !== filteredValue) {
      form.get(controlName)?.setValue(filteredValue);
    }
  }

  filterNumbers(event: any, form: FormGroup, controlName: string) {
    const value = event.target.value;
    const filteredValue = value.replace(/[^0-9]/g, '');
    if (value !== filteredValue) {
      form.get(controlName)?.setValue(filteredValue);
    }
  }

  ngOnInit() {
    this.initForms();
    this.loadCareers();
    this.loadJornadas();
  }

  initForms() {
    this.careerForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.maxLength(40), Validators.pattern(/^[A-Za-zÁÉÍÓÚáéíóúñÑ ]+$/)]],
      code: ['', [Validators.required, Validators.maxLength(8)]],
      durationSemesters: [1, [Validators.required, Validators.min(1), Validators.max(99)]],
      modalityIds: [[], Validators.required],
      jornadaIds: [[], Validators.required],
      coordinatorId: [null],
      facultyId: [null, Validators.required],
      isActive: [true],
    });

    this.curriculumForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.maxLength(15)]],
      description: ['', Validators.maxLength(70)],
      isActive: [true],
    });

    this.subjectForm = this.formBuilder.group({
      code: ['', [Validators.required, Validators.maxLength(7)]],
      name: ['', [Validators.required, Validators.maxLength(40)]],
      credits: [1, [Validators.required, Validators.min(1), Validators.max(9)]],
      hours: [0, [Validators.required, Validators.min(0), Validators.max(999)]],
      semester: [1, [Validators.required, Validators.min(1)]],
      successorIds: [[]],
      description: ['', Validators.maxLength(150)],
    });
  }

  // ──────────── DATA LOADING ────────────

  loadJornadas() {
    this.academicService.getJornadas().subscribe({
      next: (data) => {
        this.jornadas = data.filter((j) => j.isActive);
        this.cdr.markForCheck();
      },
      error: () => console.error('Error al cargar jornadas'),
    });
  }

  loadCareers() {
    this.academicService.getCareers().subscribe((data) => {
      setTimeout(() => {
        this.careers = data;
        this.cdr.markForCheck();
      });
    });
    this.academicService.getModalities().subscribe((data) => {
      setTimeout(() => {
        this.modalities = data.filter(m => m.isActive);
        this.cdr.markForCheck();
      });
    });
    this.academicService.getFaculties().subscribe((data) => {
      setTimeout(() => {
        this.faculties = data.filter(f => f.isActive);
        this.cdr.markForCheck();
      });
    });
    this.userService.getUsers(1, 100, 'coordinator').subscribe((res) => {
      setTimeout(() => {
        this.coordinators = res.data;
        this.cdr.markForCheck();
      });
    });
  }

  loadCurriculums(careerId: string) {
    this.academicService.getCurriculumsByCareer(careerId).subscribe((data) => {
      setTimeout(() => {
        this.curriculums = data;
        this.cdr.markForCheck();
      });
    });
  }

  loadSubjects(curriculumId: string) {
    if (!this.selectedCareer) return;

    this.academicService.getCareerBreakdown(this.selectedCareer.id).subscribe((res: any) => {
      const cur = res.curriculums.find((c: any) => c.id === curriculumId);
      if (!cur) {
        this.subjects = [];
        return;
      }

      const allSubjectsMap = new Map<string, any>();
      const flatSubjects: any[] = [];

      cur.semesters.forEach((sem: any) => {
        sem.subjects.forEach((sub: any) => {
          sub.successors = [];
          
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
              modalityNames: Array.from(g.modalityNames).join(' - '),
              jornadaNames: Array.from(g.jornadaNames).join(' - '),
            }));
          } else {
            sub.groupedAssignments = [];
          }

          // Use id for relationId to keep compatibility with the backend structure
          // The backend getCareerBreakdown returns id as relationId and subjectId as subjectId!
          // Wait! Let's map it safely.
          sub.relationId = sub.id; 
          sub.id = sub.subjectId;

          allSubjectsMap.set(sub.relationId, sub);
          flatSubjects.push(sub);
        });
      });

      flatSubjects.forEach((sub: any) => {
        if (sub.prerequisiteIds && sub.prerequisiteIds.length > 0) {
          sub.prerequisiteIds.forEach((preId: string) => {
            const prerequisite = allSubjectsMap.get(preId);
            if (prerequisite) {
              prerequisite.successors.push(sub);
            }
          });
        }
      });

      this.subjects = flatSubjects;
      this.cdr.markForCheck();
    });
  }

  // ──────────── CAREER SELECTION ────────────

  selectCareer(c: Career) {
    this.selectedCareer = c;
    this.selectedCurriculum = null;
    this.subjects = [];
    this.loadCurriculums(c.id);
  }

  backToCareers() {
    this.selectedCareer = null;
    this.selectedCurriculum = null;
    this.curriculums = [];
    this.subjects = [];
  }

  selectCurriculum(cu: Curriculum) {
    this.selectedCurriculum = cu;
    this.subjects = [];
    this.loadSubjects(cu.id);
  }

  backToCurriculums() {
    this.selectedCurriculum = null;
    this.subjects = [];
  }

  // ──────────── CAREER CRUD ────────────

  openNewCareer() {
    this.isEditCareer = false;
    this.editCareerId = null;
    this.careerForm.reset({ isActive: true, durationSemesters: 1 });
    this.loadJornadas();
    this.academicService.getModalities().subscribe((data) => {
      setTimeout(() => {
        this.modalities = data.filter(m => m.isActive);
        this.cdr.markForCheck();
      });
    });
    this.academicService.getFaculties().subscribe((data) => {
      setTimeout(() => {
        this.faculties = data.filter(f => f.isActive);
        this.cdr.markForCheck();
      });
    });
    this.submittedCareer.set(false);
    this.displayCareerDialog = true;
  }

  editCareer(c: Career) {
    this.isEditCareer = true;
    this.editCareerId = c.id;
    this.careerForm.patchValue(c);
    this.loadJornadas();
    this.academicService.getModalities().subscribe((data) => {
      setTimeout(() => {
        this.modalities = data.filter(m => m.isActive);
        this.cdr.markForCheck();
      });
    });
    this.academicService.getFaculties().subscribe((data) => {
      setTimeout(() => {
        this.faculties = data.filter(f => f.isActive);
        this.cdr.markForCheck();
      });
    });
    this.submittedCareer.set(false);
    this.displayCareerDialog = true;
  }

  saveCareer() {
    this.submittedCareer.set(true);
    if (this.careerForm.invalid) {
      this.careerForm.markAllAsTouched();
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Por favor, corrija los errores en el formulario' });
      return;
    }
    const data = this.careerForm.value;

    if (this.isEditCareer && this.editCareerId) {
      this.academicService.updateCareer(this.editCareerId, data).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Carrera actualizada' });
          this.loadCareers();
          this.displayCareerDialog = false;
        },
        error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar' }),
      });
    } else {
      this.academicService.createCareer(data).subscribe({
        next: (created) => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Carrera creada' });
          this.loadCareers();
          this.displayCareerDialog = false;
          this.wizardSemesters = Array.from({ length: created.durationSemesters }, (_, i) => i + 1);
          this.selectedCareer = created;
          this.curriculums = [];
          this.selectedCurriculum = null;
          this.subjects = [];
          this.pendingWizardCurriculumId = null;
          setTimeout(() => this.promptCreateCurriculum(), 300);
        },
        error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear' }),
      });
    }
  }

  deleteCareer(id: string) {
    this.confirmationService.confirm({
      message: '¿Está seguro de eliminar esta carrera?',
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.academicService.deleteCareer(id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Carrera eliminada' });
            this.loadCareers();
            if (this.selectedCareer?.id === id) this.backToCareers();
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar' }),
        });
      }
    });
  }

  // ──────────── CURRICULUM CRUD ────────────

  openNewCurriculum() {
    this.isEditCurriculum = false;
    this.editCurriculumId = null;
    this.curriculumForm.reset({ isActive: true });
    this.submittedCurriculum.set(false);
    this.displayCurriculumDialog = true;
  }

  editCurriculum(cu: Curriculum) {
    this.isEditCurriculum = true;
    this.editCurriculumId = cu.id;
    this.curriculumForm.patchValue(cu);
    this.submittedCurriculum.set(false);
    this.displayCurriculumDialog = true;
  }

  saveCurriculum() {
    this.submittedCurriculum.set(true);
    if (this.curriculumForm.invalid || !this.selectedCareer) {
      this.curriculumForm.markAllAsTouched();
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Por favor, corrija los errores en el formulario' });
      return;
    }
    const data = this.curriculumForm.value;

    if (this.isEditCurriculum && this.editCurriculumId) {
      this.academicService.updateCurriculum(this.editCurriculumId, data).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Malla actualizada' });
          this.loadCurriculums(this.selectedCareer!.id);
          this.displayCurriculumDialog = false;
        },
        error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar la malla' }),
      });
    } else {
      this.academicService.createCurriculum(this.selectedCareer.id, data).subscribe({
        next: (created) => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Malla creada' });
          this.loadCurriculums(this.selectedCareer!.id);
          this.displayCurriculumDialog = false;
          this.pendingWizardCurriculumId = created.id;
          setTimeout(() => this.promptAddSubjects(), 300);
        },
        error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear la malla' }),
      });
    }
  }

  deleteCurriculum(id: string) {
    this.confirmationService.confirm({
      message: '¿Está seguro de eliminar esta malla?',
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.academicService.deleteCurriculum(id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Malla eliminada' });
            if (this.selectedCareer) this.loadCurriculums(this.selectedCareer.id);
            if (this.selectedCurriculum?.id === id) this.backToCurriculums();
          },
          error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'No se pudo eliminar la malla' }),
        });
      }
    });
  }

  // ──────────── SUBJECT CRUD ────────────

  openNewSubject() {
    if (!this.selectedCareer) return;
    this.isEditSubject = false;
    this.editSubjectId = null;
    this.subjectSemesters = Array.from({ length: this.selectedCareer.durationSemesters }, (_, i) => i + 1);
    this.subjectForm.reset({ credits: 1, hours: 0, semester: 1 });
    this.subjectForm.get('successorIds')?.enable();
    this.submittedSubject.set(false);
    this.displaySubjectDialog = true;
  }

  editSubject(s: Subject) {
    this.isEditSubject = true;
    this.editSubjectId = s.id;
    if (this.selectedCareer) {
      this.subjectSemesters = Array.from({ length: this.selectedCareer.durationSemesters }, (_, i) => i + 1);
    }
    this.subjectForm.patchValue(s);
    this.subjectForm.get('successorIds')?.disable();
    this.submittedSubject.set(false);
    this.displaySubjectDialog = true;
  }

  saveSubject() {
    this.submittedSubject.set(true);
    if (this.subjectForm.invalid || !this.selectedCareer || !this.selectedCurriculum) {
      this.subjectForm.markAllAsTouched();
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Por favor, corrija los errores en el formulario' });
      return;
    }
    const raw = this.subjectForm.getRawValue();
    const data: any = {
      code: raw.code,
      name: raw.name,
      credits: Number(raw.credits),
      hours: Number(raw.hours) || 0,
      careerId: this.selectedCareer.id,
      curriculumId: this.selectedCurriculum.id,
      semester: raw.semester,
      description: raw.description || '',
    };

    if (this.isEditSubject && this.editSubjectId) {
      this.academicService.updateSubject(this.editSubjectId, data).subscribe({
        next: (res: any) => {
          const relationId = res?.relationId || this.editSubjectId;
          if (raw.successorIds && raw.successorIds.length > 0) {
            this.academicService.updateSubjectSuccessors(relationId, raw.successorIds).subscribe({
              next: () => {
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Materia actualizada' });
                this.loadSubjects(this.selectedCurriculum!.id);
                this.displaySubjectDialog = false;
              }
            });
          } else {
            this.academicService.updateSubjectSuccessors(relationId, []).subscribe();
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Materia actualizada' });
            this.loadSubjects(this.selectedCurriculum!.id);
            this.displaySubjectDialog = false;
          }
        },
        error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar la materia' }),
      });
    } else {
      this.academicService.createSubject(data).subscribe({
        next: (res: any) => {
          const relationId = res?.relationId || res?.id;
          if (relationId && raw.successorIds && raw.successorIds.length > 0) {
            this.academicService.updateSubjectSuccessors(relationId, raw.successorIds).subscribe();
          }

          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Materia creada' });
          this.loadSubjects(this.selectedCurriculum!.id);
          this.displaySubjectDialog = false;

          this.confirmationService.confirm({
            message: '¿Deseas agregar otra materia?',
            header: 'Agregar Otra',
            icon: 'pi pi-question-circle',
            acceptLabel: 'Sí, Agregar Otra',
            rejectLabel: 'No, Finalizar',
            rejectButtonStyleClass: 'p-button-success',
            accept: () => {
              this.subjectForm.reset({ credits: 1 });
              this.displaySubjectDialog = true;
            },
            reject: () => {},
          });
        },
        error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear la materia' }),
      });
    }
  }

  deleteAllSubjects() {
    this.confirmationService.confirm({
      message: '¿Está seguro de eliminar TODAS las materias del sistema? Esta acción no se puede deshacer.',
      header: 'Eliminar Todas las Materias',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, Eliminar Todo',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.deletingAllSubjects = true;
        this.academicService.deleteAllSubjects().subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Todas las materias han sido eliminadas' });
            this.subjects = [];
            this.deletingAllSubjects = false;
            this.loadCurriculums(this.selectedCareer!.id);
            this.cdr.markForCheck();
          },
          error: (err) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'No se pudieron eliminar las materias' });
            this.deletingAllSubjects = false;
          }
        });
      }
    });
  }

  deleteSubject(id: string) {
    this.confirmationService.confirm({
      message: '¿Está seguro de eliminar esta materia?',
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.academicService.deleteSubject(id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Materia eliminada' });
            if (this.selectedCurriculum) this.loadSubjects(this.selectedCurriculum.id);
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar la materia' }),
        });
      }
    });
  }

  // ──────────── WIZARD PROMPTS ────────────

  promptCreateCurriculum() {
    this.confirmationService.confirm({
      message: `¿Deseas crear una malla académica para "${this.selectedCareer?.name}"?`,
      header: 'Crear Malla',
      icon: 'pi pi-question-circle',
      acceptLabel: 'Sí, Crear',
      rejectLabel: 'Ahora no',
      accept: () => {
        this.curriculumForm.reset({ isActive: true });
        this.displayCurriculumDialog = true;
      },
    });
  }

  promptAddSubjects() {
    this.confirmationService.confirm({
      message: `¿Deseas agregar materias a la malla de "${this.selectedCareer?.name}"?`,
      header: 'Agregar Materias',
      icon: 'pi pi-question-circle',
      acceptLabel: 'Sí, Agregar',
      rejectLabel: 'Ahora no',
      accept: () => {
        this.displayBulkDialog = true;
      },
    });
  }

  // ──────────── BULK UPLOAD ────────────

  downloadTemplate() {
    const data = [
      { 'Código': 'MAT-101', 'Nombre': 'Cálculo I', 'Créditos': 4, 'Horas': 64, 'Semestre': 1, 'Sucesoras': '' },
      { 'Código': 'FIS-101', 'Nombre': 'Física I', 'Créditos': 4, 'Horas': 64, 'Semestre': 1, 'Sucesoras': '' },
      { 'Código': 'MAT-102', 'Nombre': 'Cálculo II', 'Créditos': 4, 'Horas': 64, 'Semestre': 2, 'Sucesoras': '' },
      { 'Código': 'FIS-102', 'Nombre': 'Física II', 'Créditos': 4, 'Horas': 64, 'Semestre': 2, 'Sucesoras': '' }
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Plantilla');
    XLSX.writeFile(wb, 'plantilla_materias.xlsx');
  }

  onBulkFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) this.selectedBulkFile = file;
  }

  processBulkUpload() {
    if (!this.selectedBulkFile || !this.selectedCareer || !this.selectedCurriculum) return;
    const careerId = this.selectedCareer.id;
    const curriculumId = this.selectedCurriculum.id;

    this.bulkUploading = true;
    const reader = new FileReader();
    reader.onload = (e) => {
      const bstr = e.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);

      if (!data || data.length === 0) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'El archivo está vacío o sin datos válidos' });
        return;
      }

      const payload: any[] = [];
      for (const row of data as any[]) {
        if (row['Código'] && row['Nombre'] && row['Créditos'] && row['Semestre']) {
          
          let successorCodes: string[] = [];
          if (row['Sucesoras']) {
            successorCodes = row['Sucesoras'].toString().split(',').map((c: string) => c.trim()).filter((c: string) => c);
          }

          payload.push({
            curriculumId,
            code: row['Código'].toString().trim(),
            name: row['Nombre'].toString().trim(),
            credits: parseInt(row['Créditos'], 10) || 0,
            semester: parseInt(row['Semestre'], 10) || 1,
            hours: parseInt(row['Horas'], 10) || 0,
            successorCodes
          });
        }
      }

      if (payload.length === 0) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se encontraron filas válidas en el archivo' });
        return;
      }

      this.academicService.bulkCreateSubjects(careerId, payload).subscribe({
        next: () => {
          this.bulkUploading = false;
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: `Se procesaron ${payload.length} materias correctamente` });
          this.loadSubjects(curriculumId);
          this.displayBulkDialog = false;
          this.selectedBulkFile = null;

          this.confirmationService.confirm({
            message: '¿Deseas agregar más materias manualmente?',
            header: 'Agregar Más',
            icon: 'pi pi-question-circle',
            acceptLabel: 'Sí, Manualmente',
            rejectLabel: 'No, Finalizar',
            rejectButtonStyleClass: 'p-button-success',
            accept: () => {
              this.subjectForm.reset({ credits: 1 });
              this.subjectSemesters = this.wizardSemesters.length > 0
                ? this.wizardSemesters
                : Array.from({ length: this.selectedCareer!.durationSemesters }, (_, i) => i + 1);
              this.displaySubjectDialog = true;
            },
            reject: () => {},
          });
        },
        error: () => {
          this.bulkUploading = false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo procesar el archivo' });
        },
      });
    };
    reader.readAsBinaryString(this.selectedBulkFile);
  }

  // ──────────── HELPERS ────────────

  getModalityList(ids: string[] | undefined): string[] {
    if (!ids || ids.length === 0) return [];
    return ids.map(id => this.modalities.find(m => m.id === id)?.name || id);
  }

  getSemesterColor(sem: number): string {
    const colors = this.academicService.semesterColors();
    const found = colors.find(c => c.semester === sem);
    if (found) return found.color;
    const fallbacks = ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#64748b', '#0f172a', '#0ea5e9', '#22c55e', '#f59e0b', '#ef4444'];
    return fallbacks[(sem - 1) % fallbacks.length] || '#0ea5e9';
  }

  getCoordinatorName(id: string | undefined): string {
    if (!id) return 'No asignado';
    const c = this.coordinators.find(u => u.id === id);
    return c ? `${c.firstName} ${c.lastName}` : id;
  }

  getModalityName(id: string): string {
    return this.modalities.find(m => m.id === id)?.name || id;
  }

  getJornadaName(id: string): string {
    return this.jornadas.find(j => j.id === id)?.name || id;
  }

  getFacultyName(id: string | undefined): string {
    if (!id) return 'No asignada';
    return this.faculties.find(f => f.id === id)?.name || id;
  }

  showCareerMenu(event: Event, menu: any, career: any) {
    this.selectedCareerForMenu = career;
    this.careerMenuItems = [
      { label: 'Ver Mallas', icon: 'pi pi-eye', styleClass: 'action-view', command: () => setTimeout(() => this.selectCareer(this.selectedCareerForMenu)) },
      { label: 'Editar', icon: 'pi pi-pencil', styleClass: 'action-edit', command: () => setTimeout(() => this.editCareer(this.selectedCareerForMenu)) },
      { label: 'Eliminar', icon: 'pi pi-trash', styleClass: 'action-delete', command: () => setTimeout(() => this.deleteCareer(this.selectedCareerForMenu.id)) }
    ];
    menu.toggle(event);
  }

  showCurriculumMenu(event: Event, menu: any, curriculum: any) {
    this.selectedCurriculumForMenu = curriculum;
    this.curriculumMenuItems = [
      { label: 'Ver Materias', icon: 'pi pi-eye', styleClass: 'action-view', command: () => setTimeout(() => this.selectCurriculum(this.selectedCurriculumForMenu)) },
      { label: 'Editar', icon: 'pi pi-pencil', styleClass: 'action-edit', command: () => setTimeout(() => this.editCurriculum(this.selectedCurriculumForMenu)) },
      { label: 'Eliminar', icon: 'pi pi-trash', styleClass: 'action-delete', command: () => setTimeout(() => this.deleteCurriculum(this.selectedCurriculumForMenu.id)) }
    ];
    menu.toggle(event);
  }

  showSubjectMenu(event: Event, menu: any, subject: any) {
    this.selectedSubjectForMenu = subject;
    menu.model = [
      { label: 'Vincular Sucesora', icon: 'pi pi-link', styleClass: 'action-view', command: () => setTimeout(() => this.openPrerequisitesDialog(this.selectedSubjectForMenu)) },
      { label: 'Editar', icon: 'pi pi-pencil', styleClass: 'action-edit', command: () => setTimeout(() => this.editSubject(this.selectedSubjectForMenu)) },
      { label: 'Eliminar', icon: 'pi pi-trash', styleClass: 'action-delete', command: () => setTimeout(() => this.deleteSubject(this.selectedSubjectForMenu.id)) }
    ];
    menu.toggle(event);
  }

  openPrerequisitesDialog(subject: any) {
    if (!this.selectedCurriculum) return;
    this.selectedSubjectForPrerequisites = subject;
    // We are managing SUCCESSORS. Pre-select current successors.
    this.selectedPrerequisiteIds = subject.successors ? subject.successors.map((s: any) => s.relationId) : [];
    this.displayPrerequisitesDialog = true;
    this.academicService.getPossiblePrerequisites(this.selectedCurriculum.id, subject.id).subscribe({
        next: (res) => {
          setTimeout(() => {
            this.possiblePrerequisites = res;
            this.filteredPossiblePrerequisites = res.filter((p: any) => p.semester > subject.semester);
            this.cdr.markForCheck();
          });
        },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las posibles sucesoras' })
    });
  }

  savePrerequisites() {
    if (!this.selectedSubjectForPrerequisites) return;
    const careerSubjectId = this.selectedSubjectForPrerequisites.relationId || this.selectedSubjectForPrerequisites.id;
    this.academicService.updateSubjectSuccessors(careerSubjectId, this.selectedPrerequisiteIds).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Sucesoras actualizadas correctamente' });
        this.displayPrerequisitesDialog = false;
        this.loadSubjects(this.selectedCurriculum!.id);
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron actualizar las sucesoras' })
    });
  }
}
