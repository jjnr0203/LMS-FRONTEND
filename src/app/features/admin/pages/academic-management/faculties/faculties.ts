import { Component, OnInit, inject, ChangeDetectorRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { BadgeModule } from 'primeng/badge';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TagModule } from 'primeng/tag';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AcademicService } from '../../../../../core/services/academic.service';
import { Faculty } from '../../../../../core/models';

@Component({
  selector: 'app-faculties',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    CheckboxModule,
    ToastModule,
    TextareaModule,
    BadgeModule,
    SelectModule,
    ConfirmDialogModule,
    TagModule
  ],
  templateUrl: './faculties.html',
})
export class Faculties implements OnInit {
  private academicService = inject(AcademicService);
  private formBuilder = inject(FormBuilder);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private cdr = inject(ChangeDetectorRef);

  faculties: Faculty[] = [];
  displayDialog = false;
  facultyForm!: FormGroup;
  isEdit = false;
  currentId: string | null = null;
  submitted = signal(false);

  get hasEmptyRequiredFields() {
    if (!this.facultyForm) return true;
    const c = this.facultyForm.controls;
    return !c['name'].value || !c['code'].value;
  }

  filterLetters(event: any, form: FormGroup, controlName: string) {
    const value = event.target.value;
    const filteredValue = value.replace(/[^A-Za-zÁÉÍÓÚáéíóúñÑ ]/g, '');
    if (value !== filteredValue) {
      form.get(controlName)?.setValue(filteredValue);
    }
  }

  ngOnInit() {
    this.initForm();
    this.loadFaculties();
  }

  initForm() {
    this.facultyForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.maxLength(60), Validators.pattern(/^[A-Za-zÁÉÍÓÚáéíóúñÑ ]+$/)]],
      code: ['', [Validators.required, Validators.maxLength(8)]],
      description: ['', Validators.maxLength(150)],
      isActive: [false],
    });
  }

  loadFaculties() {
    this.academicService.getFaculties().subscribe({
      next: (data) => {
        this.faculties = data;
        this.cdr.detectChanges();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las facultades' });
        this.cdr.detectChanges();
      }
    });
  }

  openNew() {
    this.isEdit = false;
    this.currentId = null;
    this.submitted.set(false);
    this.facultyForm.reset({ isActive: false });
    this.displayDialog = true;
  }

  editFaculty(f: Faculty) {
    this.isEdit = true;
    this.currentId = f.id;
    this.facultyForm.patchValue({
      name: f.name,
      code: f.code,
      description: f.description || '',
      isActive: f.isActive,
    });
    this.submitted.set(false);
    this.displayDialog = true;
  }

  saveFaculty() {
    this.submitted.set(true);
    if (this.facultyForm.invalid) {
      this.facultyForm.markAllAsTouched();
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Por favor, corrija los errores en el formulario' });
      return;
    }

    const data = this.facultyForm.value;

    if (this.isEdit && this.currentId) {
      this.academicService.updateFaculty(this.currentId, data).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Facultad actualizada' });
          this.loadFaculties();
          this.displayDialog = false;
        },
        error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar' }),
      });
    } else {
      this.academicService.createFaculty(data).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Facultad creada' });
          this.loadFaculties();
          this.displayDialog = false;
        },
        error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear' }),
      });
    }
  }

  deleteFaculty(id: string) {
    this.confirmationService.confirm({
      message: '¿Está seguro de eliminar esta facultad?',
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.academicService.deleteFaculty(id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Facultad eliminada' });
            this.loadFaculties();
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar' }),
        });
      }
    });
  }
}
