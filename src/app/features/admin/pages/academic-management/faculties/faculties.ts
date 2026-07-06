import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
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
  form!: FormGroup;
  isEdit = false;
  currentId: string | null = null;

  ngOnInit() {
    this.initForm();
    this.loadFaculties();
  }

  initForm() {
    this.form = this.formBuilder.group({
      name: ['', Validators.required],
      code: ['', Validators.required],
      description: [''],
      isActive: [true],
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
    this.form.reset({ isActive: true });
    this.displayDialog = true;
  }

  editFaculty(f: Faculty) {
    this.isEdit = true;
    this.currentId = f.id;
    this.form.patchValue({
      name: f.name,
      code: f.code,
      description: f.description || '',
      isActive: f.isActive,
    });
    this.displayDialog = true;
  }

  saveFaculty() {
    if (this.form.invalid) return;

    const data = this.form.value;

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
