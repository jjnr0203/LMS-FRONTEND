import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import * as XLSX from 'xlsx';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { TextareaModule } from 'primeng/textarea';
import { BadgeModule } from 'primeng/badge';
import { ToastModule } from 'primeng/toast';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AcademicService } from '../../../../../core/services/academic.service';
import { UserService } from '../../../../../core/services/user.service';
import { Subject, User, Career, Modality, Curriculum } from '../../../../../core/models';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-subjects',
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
    TextareaModule,
    ToastModule,
    BadgeModule,
    IconFieldModule,
    InputIconModule,
    MenuModule,
    TagModule
  ],
  templateUrl: './subjects.html',
  styleUrls: ['./subjects.scss'],
})
export class Subjects implements OnInit {
  private academicService = inject(AcademicService);
  private userService = inject(UserService);
  private formBuilder = inject(FormBuilder);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private cdr = inject(ChangeDetectorRef);

  subjects: Subject[] = [];
  teachers: User[] = [];
  careers: Career[] = [];
  modalities: Modality[] = [];
  curriculums: Curriculum[] = [];
  availableModalities: Modality[] = [];
  availableSemesters: number[] = [];
  displayDialog = false;
  displayBulkDialog = false;
  selectedFile: File | null = null;
  bulkCareerId: string | null = null;
  bulkUploading = false;
  form!: FormGroup;
  isEdit = false;
  currentId: string | null = null;
  
  menuItems: MenuItem[] = [];
  selectedSubjectForMenu: any = null;

  ngOnInit() {
    this.initForm();
    this.loadData();
  }

  initForm() {
    this.form = this.formBuilder.group({
      name: ['', Validators.required],
      code: ['', Validators.required],
      credits: [1, [Validators.required, Validators.min(1)]],
      hours: [0, [Validators.required, Validators.min(0)]],
      teacherId: [null],
      careerId: [null],
      curriculumId: [{ value: null, disabled: true }],
      modalityIds: [{ value: [], disabled: true }],
      semester: [{ value: null, disabled: true }],
      description: [''],
    });

    this.form.get('careerId')?.valueChanges.subscribe((careerId) => {
      this.updateSemestersAndModalities(careerId);
      this.loadCurriculumsForCareer(careerId);
    });
  }

  loadCurriculumsForCareer(careerId: string | null) {
    if (!careerId) {
      this.curriculums = [];
      this.form.get('curriculumId')?.disable();
      this.form.get('curriculumId')?.setValue(null);
      return;
    }
    this.academicService.getCurriculumsByCareer(careerId).subscribe({
      next: (data) => {
        this.curriculums = data.filter(m => m.isActive);
        if (this.curriculums.length > 0) {
          this.form.get('curriculumId')?.enable();
        } else {
          this.form.get('curriculumId')?.disable();
        }
      },
    });
  }

  updateSemestersAndModalities(careerId: string | null) {
    if (!careerId) {
      this.availableSemesters = [];
      this.availableModalities = [];
      this.form.get('semester')?.disable();
      this.form.get('semester')?.setValue(null);
      this.form.get('modalityIds')?.disable();
      this.form.get('modalityIds')?.setValue([]);
      return;
    }
    const career = this.careers.find(c => c.id === careerId);
    if (career && career.durationSemesters > 0) {
      this.availableSemesters = Array.from({ length: career.durationSemesters }, (_, i) => i + 1);
      this.form.get('semester')?.enable();
    } else {
      this.availableSemesters = [];
      this.form.get('semester')?.disable();
      this.form.get('semester')?.setValue(null);
    }

    if (career && career.modalityIds && career.modalityIds.length > 0) {
      this.availableModalities = this.modalities.filter(m => career.modalityIds?.includes(m.id));
      this.form.get('modalityIds')?.enable();
    } else {
      this.availableModalities = [];
      this.form.get('modalityIds')?.disable();
      this.form.get('modalityIds')?.setValue([]);
    }
  }

  loadData() {
    this.academicService.getSubjects().subscribe((data) => {
      this.subjects = data;
      this.cdr.detectChanges();
    });
    this.userService.getUsers(1, 100, 'teacher').subscribe((res) => (this.teachers = res.data));
    this.academicService.getCareers().subscribe((data) => (this.careers = data));
    this.academicService.getModalities().subscribe((data) => (this.modalities = data.filter(m => m.isActive)));
  }

  getTeacherName(id: string | undefined): string {
    if (!id) return 'No asignado';
    const c = this.teachers.find(u => u.id === id);
    return c ? `${c.firstName} ${c.lastName}` : id;
  }

  getCareerName(id: string | undefined): string {
    if (!id) return 'Sin asignar';
    const c = this.careers.find(c => c.id === id);
    return c ? c.name : id;
  }

  getModalityName(id: string): string {
    return this.modalities.find(m => m.id === id)?.name || id;
  }

  getSemesterColor(sem: number): string {
    const colors = this.academicService.semesterColors();
    const found = colors.find(c => c.semester === sem);
    if (found) return found.color;
    
    // Default fallback colors
    const fallbacks = ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#64748b', '#0f172a', '#0ea5e9', '#22c55e', '#f59e0b', '#ef4444'];
    return fallbacks[(sem - 1) % fallbacks.length] || '#0ea5e9';
  }

  openNew() {
    this.loadData();
    this.isEdit = false;
    this.currentId = null;
    this.form.reset({ credits: 1, hours: 0 });
    this.form.get('careerId')?.enable();
    this.displayDialog = true;
  }

  editSubject(s: Subject) {
    this.loadData();
    this.isEdit = true;
    this.currentId = s.id;
    this.form.patchValue(s);
    
    if (s.careerId) {
      this.updateSemestersAndModalities(s.careerId);
      this.loadCurriculumsForCareer(s.careerId);
      this.form.get('semester')?.setValue(s.semester);
      if (s.curriculumId) {
        this.form.get('curriculumId')?.setValue(s.curriculumId);
      }
      this.form.get('careerId')?.disable();
    } else {
      this.form.get('careerId')?.enable();
    }
    
    this.displayDialog = true;
  }

  saveSubject() {
    if (this.form.invalid) return;
    const raw = this.form.getRawValue();
    const data: any = {
      code: raw.code,
      name: raw.name,
      credits: raw.credits,
      hours: raw.hours || 0,
      teacherId: raw.teacherId,
      description: raw.description,
      modalityIds: raw.modalityIds,
      careerId: raw.careerId,
      semester: raw.semester,
    };
    if (raw.curriculumId) data.curriculumId = raw.curriculumId;

    if (this.isEdit && this.currentId) {
      this.academicService.updateSubject(this.currentId, data).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Materia actualizada' });
          this.loadData();
          this.displayDialog = false;
        },
        error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar' }),
      });
    } else {
      this.academicService.createSubject(data).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Materia creada' });
          this.loadData();
          this.displayDialog = false;
        },
        error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear' }),
      });
    }
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
            this.loadData();
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar' }),
        });
      }
    });
  }

  openBulkUpload() {
    this.bulkCareerId = null;
    this.selectedFile = null;
    this.displayBulkDialog = true;
  }

  downloadTemplate() {
    const data = [
      { 'Código': 'MAT-101', 'Nombre': 'Cálculo I', 'Créditos': 4, 'Semestre': 1, 'Modalidades': 'Presencial, En Línea' },
      { 'Código': 'FIS-101', 'Nombre': 'Física I', 'Créditos': 4, 'Semestre': 1, 'Modalidades': 'Presencial' }
    ];
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Plantilla');
    XLSX.writeFile(wb, 'plantilla_materias.xlsx');
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  processBulkUpload() {
    if (!this.selectedFile || !this.bulkCareerId) return;
    const careerId = this.bulkCareerId;

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
              .filter((id: string | undefined) => !!id);
          }

          payload.push({
            code: row['Código'].toString().trim(),
            name: row['Nombre'].toString().trim(),
            credits: parseInt(row['Créditos'], 10) || 0,
            semester: parseInt(row['Semestre'], 10) || 1,
            modalityIds
          });
        }
      }

      this.academicService.bulkCreateSubjects(careerId, payload).subscribe({
        next: () => {
          this.bulkUploading = false;
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Materias procesadas y asignadas correctamente' });
          this.loadData();
          this.displayBulkDialog = false;
        },
        error: () => {
          this.bulkUploading = false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo procesar el archivo' });
        },
      });
    };
    reader.readAsBinaryString(this.selectedFile);
  }

  showMenu(event: Event, menu: any, subject: any) {
    this.selectedSubjectForMenu = subject;
    this.menuItems = [
      {
        label: 'Editar',
        icon: 'pi pi-pencil',
        styleClass: 'action-edit',
        command: () => this.editSubject(this.selectedSubjectForMenu)
      },
      {
        label: 'Eliminar',
        icon: 'pi pi-trash',
        styleClass: 'action-delete',
        command: () => this.deleteSubject(this.selectedSubjectForMenu.id)
      }
    ];
    menu.toggle(event);
  }
}
