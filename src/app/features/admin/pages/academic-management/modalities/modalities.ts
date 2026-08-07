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
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TextareaModule } from 'primeng/textarea';
import { TagModule } from 'primeng/tag';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AcademicService } from '../../../../../core/services/academic.service';
import { Modality } from '../../../../../core/models';

@Component({
  selector: 'app-modalities',
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
    ConfirmDialogModule,
    TextareaModule,
    BadgeModule,
    TagModule,
  ],
  templateUrl: './modalities.html',
})
export class Modalities implements OnInit {
  private academicService = inject(AcademicService);
  private formBuilder = inject(FormBuilder);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private cdr = inject(ChangeDetectorRef);

  modalities: Modality[] = [];
  displayDialog = false;
  modalityForm!: FormGroup;
  isEdit = false;
  currentId: string | null = null;
  submitted = signal(false);

  get hasEmptyRequiredFields() {
    if (!this.modalityForm) return true;
    const c = this.modalityForm.controls;
    return !c['name'].value;
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
    this.loadModalities();
  }

  initForm() {
    this.modalityForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.maxLength(20), Validators.pattern(/^[A-Za-zÁÉÍÓÚáéíóúñÑ ]+$/)]],
      description: ['', Validators.maxLength(150)],
      isActive: [false],
    });
  }

  loadModalities() {
    this.academicService.getModalities().subscribe({
      next: (data) => {
        this.modalities = data;
        this.cdr.detectChanges();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las modalidades' });
        this.cdr.detectChanges();
      }
    });
  }

  openNew() {
    this.isEdit = false;
    this.currentId = null;
    this.submitted.set(false);
    this.modalityForm.reset({ isActive: false });
    this.displayDialog = true;
  }

  editModality(m: Modality) {
    this.isEdit = true;
    this.currentId = m.id;
    this.modalityForm.patchValue({
      name: m.name,
      description: m.description || '',
      isActive: m.isActive,
    });
    this.submitted.set(false);
    this.displayDialog = true;
  }

  saveModality() {
    this.submitted.set(true);
    if (this.modalityForm.invalid) {
      this.modalityForm.markAllAsTouched();
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Por favor, corrija los errores en el formulario' });
      return;
    }

    const data = this.modalityForm.value;

    if (this.isEdit && this.currentId) {
      this.academicService.updateModality(this.currentId, data).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Modalidad actualizada' });
          this.loadModalities();
          this.displayDialog = false;
        },
        error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar' }),
      });
    } else {
      this.academicService.createModality(data).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Modalidad creada' });
          this.loadModalities();
          this.displayDialog = false;
        },
        error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear' }),
      });
    }
  }

  deleteModality(id: string) {
    this.confirmationService.confirm({
      message: '¿Está seguro de eliminar esta modalidad?',
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.academicService.deleteModality(id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Modalidad eliminada' });
            this.loadModalities();
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar' }),
        });
      }
    });
  }
}
