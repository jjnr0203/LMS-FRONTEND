import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AcademicService } from '../../../../../core/services/academic.service';
import { UserService } from '../../../../../core/services/user.service';
import { Career, Modality, Subject, User } from '../../../../../core/models';

@Component({
  selector: 'app-careers',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    MultiSelectModule,
    CheckboxModule,
    ToastModule,
  ],
  templateUrl: './careers.html',
})
export class Careers implements OnInit {
  private academicService = inject(AcademicService);
  private userService = inject(UserService);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  careers: Career[] = [];
  modalities: Modality[] = [];
  coordinators: User[] = [];
  subjects: Subject[] = [];
  
  displayDialog = false;
  displaySubjectsDialog = false;

  form!: FormGroup;
  subjectsForm!: FormGroup;

  isEdit = false;
  currentId: string | null = null;
  currentCareerForSubjects: Career | null = null;

  ngOnInit() {
    this.initForm();
    this.loadData();
  }

  initForm() {
    this.form = this.fb.group({
      name: ['', Validators.required],
      code: ['', Validators.required],
      durationSemesters: [1, [Validators.required, Validators.min(1)]],
      modalityId: [null],
      coordinatorId: [null],
      isActive: [true],
    });

    this.subjectsForm = this.fb.group({
      subjectIds: [[]]
    });
  }

  loadData() {
    this.academicService.getCareers().subscribe((data) => (this.careers = data));
    this.academicService.getModalities().subscribe((data) => (this.modalities = data.filter(m => m.isActive)));
    this.userService.getUsers(1, 100, 'coordinator').subscribe((res) => (this.coordinators = res.data));
    this.academicService.getSubjects().subscribe((data) => (this.subjects = data));
  }

  getModalityName(id: string | undefined): string {
    if (!id) return 'No asignada';
    return this.modalities.find(m => m.id === id)?.name || id;
  }

  getCoordinatorName(id: string | undefined): string {
    if (!id) return 'No asignado';
    const c = this.coordinators.find(u => u.id === id);
    return c ? `${c.firstName} ${c.lastName}` : id;
  }

  openNew() {
    this.loadData();
    this.isEdit = false;
    this.currentId = null;
    this.form.reset({ isActive: true, durationSemesters: 1 });
    this.displayDialog = true;
  }

  editCareer(c: Career) {
    this.loadData();
    this.isEdit = true;
    this.currentId = c.id;
    this.form.patchValue(c);
    this.displayDialog = true;
  }

  saveCareer() {
    if (this.form.invalid) return;
    const data = this.form.value;

    if (this.isEdit && this.currentId) {
      this.academicService.updateCareer(this.currentId, data).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Carrera actualizada' });
          this.loadData();
          this.displayDialog = false;
        },
        error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar' }),
      });
    } else {
      this.academicService.createCareer(data).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Carrera creada' });
          this.loadData();
          this.displayDialog = false;
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
            this.loadData();
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar' }),
        });
      }
    });
  }

  // Assign subjects logic
  openAssignSubjects(c: Career) {
    this.currentCareerForSubjects = c;
    this.academicService.getCareerSubjects(c.id).subscribe({
      next: (res) => {
        this.subjectsForm.patchValue({ subjectIds: res.subjectIds });
        this.displaySubjectsDialog = true;
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las materias asignadas' })
    });
  }

  saveAssignedSubjects() {
    if (!this.currentCareerForSubjects) return;
    const subjectIds = this.subjectsForm.value.subjectIds;
    this.academicService.assignCareerSubjects(this.currentCareerForSubjects.id, subjectIds).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Materias asignadas' });
        this.displaySubjectsDialog = false;
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron asignar las materias' })
    });
  }
}
