import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { TextareaModule } from 'primeng/textarea';
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
    TextareaModule,
  ],
  templateUrl: './modalities.html',
})
export class Modalities implements OnInit {
  private academicService = inject(AcademicService);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  modalities: Modality[] = [];
  displayDialog = false;
  form!: FormGroup;
  isEdit = false;
  currentId: string | null = null;

  ngOnInit() {
    this.initForm();
    this.loadModalities();
  }

  initForm() {
    this.form = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      isActive: [true],
    });
  }

  loadModalities() {
    this.academicService.getModalities().subscribe({
      next: (data: Modality[]) => (this.modalities = data),
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las modalidades' }),
    });
  }

  openNew() {
    this.loadModalities();
    this.isEdit = false;
    this.currentId = null;
    this.form.reset({ isActive: true });
    this.displayDialog = true;
  }

  editModality(mod: Modality) {
    this.loadModalities();
    this.isEdit = true;
    this.currentId = mod.id;
    this.form.patchValue({
      name: mod.name,
      description: mod.description || '',
      isActive: mod.isActive,
    });
    this.displayDialog = true;
  }

  saveModality() {
    if (this.form.invalid) return;

    const data = this.form.value;

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
