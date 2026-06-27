import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
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
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { BadgeModule } from 'primeng/badge';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { AccordionModule } from 'primeng/accordion';
import * as XLSX from 'xlsx';
import { AcademicService } from '../../../../../core/services/academic.service';
import { UserService } from '../../../../../core/services/user.service';
import { Career, Modality, Subject, User, Curriculum } from '../../../../../core/models';

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
    IconFieldModule,
    InputIconModule,
    AccordionModule,
  ],
  templateUrl: './careers.html',
})
export class Careers implements OnInit {
  private academicService = inject(AcademicService);
  private userService = inject(UserService);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private cdr = inject(ChangeDetectorRef);

  careers: Career[] = [];
  modalities: Modality[] = [];
  coordinators: User[] = [];

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

  get groupedSubjects(): { semester: number; subjects: Subject[] }[] {
    const map = new Map<number, Subject[]>();
    for (const s of this.subjects) {
      const sem = s.semester || 0;
      if (!map.has(sem)) map.set(sem, []);
      map.get(sem)!.push(s);
    }
    return Array.from(map.entries())
      .map(([semester, subjects]) => ({ semester, subjects }))
      .sort((a, b) => a.semester - b.semester);
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
  selectedBulkFile: File | null = null;
  bulkUploading = false;

  // --- Wizard: career → curriculum → subjects ---
  pendingWizardCurriculumId: string | null = null;
  wizardSemesters: number[] = [];

  ngOnInit() {
    this.initForms();
    this.loadCareers();
  }

  initForms() {
    this.careerForm = this.fb.group({
      name: ['', Validators.required],
      code: ['', Validators.required],
      durationSemesters: [1, [Validators.required, Validators.min(1)]],
      modalityIds: [[]],
      coordinatorId: [null],
      isActive: [true],
    });

    this.curriculumForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      isActive: [true],
    });

    this.subjectForm = this.fb.group({
      code: ['', Validators.required],
      name: ['', Validators.required],
      credits: [1, [Validators.required, Validators.min(1)]],
      semester: [null, Validators.required],
      modalityIds: [[]],
      description: [''],
    });
  }

  // ──────────── DATA LOADING ────────────

  loadCareers() {
    this.academicService.getCareers().subscribe((data) => {
      this.careers = data;
      this.cdr.detectChanges();
    });
    this.academicService.getModalities().subscribe((data) => (this.modalities = data.filter(m => m.isActive)));
    this.userService.getUsers(1, 100, 'coordinator').subscribe((res) => (this.coordinators = res.data));
  }

  loadCurriculums(careerId: string) {
    this.academicService.getCurriculumsByCareer(careerId).subscribe((data) => {
      this.curriculums = data;
      this.cdr.detectChanges();
    });
  }

  loadSubjects(curriculumId: string) {
    this.academicService.getCurriculumSubjects(curriculumId).subscribe((data) => {
      this.subjects = data;
      this.cdr.detectChanges();
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
    this.displayCareerDialog = true;
  }

  editCareer(c: Career) {
    this.isEditCareer = true;
    this.editCareerId = c.id;
    this.careerForm.patchValue(c);
    this.displayCareerDialog = true;
  }

  saveCareer() {
    if (this.careerForm.invalid) return;
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
    this.displayCurriculumDialog = true;
  }

  editCurriculum(cu: Curriculum) {
    this.isEditCurriculum = true;
    this.editCurriculumId = cu.id;
    this.curriculumForm.patchValue(cu);
    this.displayCurriculumDialog = true;
  }

  saveCurriculum() {
    if (this.curriculumForm.invalid || !this.selectedCareer) return;
    const data = this.curriculumForm.value;

    if (this.isEditCurriculum && this.editCurriculumId) {
      this.academicService.updateCurriculum(this.editCurriculumId, data).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Curriculum updated' });
          this.loadCurriculums(this.selectedCareer!.id);
          this.displayCurriculumDialog = false;
        },
        error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Could not update curriculum' }),
      });
    } else {
      this.academicService.createCurriculum(this.selectedCareer.id, data).subscribe({
        next: (created) => {
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Curriculum created' });
          this.loadCurriculums(this.selectedCareer!.id);
          this.displayCurriculumDialog = false;
          this.pendingWizardCurriculumId = created.id;
          setTimeout(() => this.promptAddSubjects(), 300);
        },
        error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Could not create curriculum' }),
      });
    }
  }

  deleteCurriculum(id: string) {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete this curriculum?',
      header: 'Confirm Deletion',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.academicService.deleteCurriculum(id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Curriculum deleted' });
            if (this.selectedCareer) this.loadCurriculums(this.selectedCareer.id);
            if (this.selectedCurriculum?.id === id) this.backToCurriculums();
          },
          error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Could not delete curriculum' }),
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
    this.subjectForm.reset({ credits: 1 });
    this.displaySubjectDialog = true;
  }

  editSubject(s: Subject) {
    this.isEditSubject = true;
    this.editSubjectId = s.id;
    if (this.selectedCareer) {
      this.subjectSemesters = Array.from({ length: this.selectedCareer.durationSemesters }, (_, i) => i + 1);
    }
    this.subjectForm.patchValue(s);
    this.displaySubjectDialog = true;
  }

  saveSubject() {
    if (this.subjectForm.invalid || !this.selectedCareer || !this.selectedCurriculum) return;
    const raw = this.subjectForm.value;
    const data: any = {
      code: raw.code,
      name: raw.name,
      credits: raw.credits,
      careerId: this.selectedCareer.id,
      curriculumId: this.selectedCurriculum.id,
      semester: raw.semester,
      modalityIds: raw.modalityIds || [],
      description: raw.description || '',
    };

    if (this.isEditSubject && this.editSubjectId) {
      this.academicService.updateSubject(this.editSubjectId, data).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Materia actualizada' });
          this.loadSubjects(this.selectedCurriculum!.id);
          this.displaySubjectDialog = false;
        },
        error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar la materia' }),
      });
    } else {
      this.academicService.createSubject(data).subscribe({
        next: () => {
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
        this.academicService.deleteAllSubjects().subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Todas las materias fueron eliminadas' });
            this.subjects = [];
            this.loadCurriculums(this.selectedCareer!.id);
            this.cdr.detectChanges();
          },
          error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'No se pudieron eliminar las materias' }),
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
      message: `Do you want to create a curriculum for "${this.selectedCareer?.name}"?`,
      header: 'Create Curriculum',
      icon: 'pi pi-question-circle',
      acceptLabel: 'Yes, Create',
      rejectLabel: 'Not now',
      accept: () => {
        this.curriculumForm.reset({ isActive: true });
        this.displayCurriculumDialog = true;
      },
    });
  }

  promptAddSubjects() {
    this.confirmationService.confirm({
      message: `Do you want to add subjects to the curriculum of "${this.selectedCareer?.name}"?`,
      header: 'Add Subjects',
      icon: 'pi pi-question-circle',
      acceptLabel: 'Yes, Add',
      rejectLabel: 'Not now',
      accept: () => {
        this.displayBulkDialog = true;
      },
    });
  }

  // ──────────── BULK UPLOAD ────────────

  downloadTemplate() {
    const data = [
      { 'Código': 'MAT-101', 'Nombre': 'Cálculo I', 'Créditos': 4, 'Semestre': 1, 'Modalidades': 'Presencial, En Línea' },
      { 'Código': 'FIS-101', 'Nombre': 'Física I', 'Créditos': 4, 'Semestre': 1, 'Modalidades': 'Presencial' }
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
          let modalityIds: string[] = [];
          if (row['Modalidades']) {
            const modNames = row['Modalidades'].toString().split(',').map((s: string) => s.trim().toLowerCase());
            modalityIds = modNames
              .map((n: string) => this.modalities.find(m => m.name.toLowerCase() === n)?.id)
              .filter((id: string | undefined) => !!id) as string[];
          }

          payload.push({
            curriculumId,
            code: row['Código'].toString().trim(),
            name: row['Nombre'].toString().trim(),
            credits: parseInt(row['Créditos'], 10) || 0,
            semester: parseInt(row['Semestre'], 10) || 1,
            modalityIds,
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
}
