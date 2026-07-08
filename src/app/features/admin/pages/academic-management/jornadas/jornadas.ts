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
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TagModule } from 'primeng/tag';
import { AcademicService } from '../../../../../core/services/academic.service';
import { Jornada } from '../../../../../core/models';

@Component({
  selector: 'app-jornadas',
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
    ConfirmDialogModule,
    TagModule,
  ],
  templateUrl: './jornadas.html',
})
export class Jornadas implements OnInit {
  private academicService = inject(AcademicService);
  private formBuilder = inject(FormBuilder);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private cdr = inject(ChangeDetectorRef);

  jornadas: Jornada[] = [];
  displayDialog = false;
  form!: FormGroup;
  isEdit = false;
  currentId: string | null = null;

  ngOnInit() {
    this.initForm();
    this.loadJornadas();
  }

  initForm() {
    this.form = this.formBuilder.group({
      name: ['', Validators.required],
      description: [''],
      isActive: [true],
    });
  }

  loadJornadas() {
    this.academicService.getJornadas().subscribe({
      next: (data) => {
        this.jornadas = data;
        this.cdr.detectChanges();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las jornadas' });
        this.cdr.detectChanges();
      }
    });
  }

  openNew() {
    this.loadJornadas();
    this.isEdit = false;
    this.currentId = null;
    this.form.reset({ isActive: true });
    this.displayDialog = true;
  }

  editJornada(jor: Jornada) {
    this.loadJornadas();
    this.isEdit = true;
    this.currentId = jor.id;
    this.form.patchValue({
      name: jor.name,
      description: jor.description || '',
      isActive: jor.isActive,
    });
    this.displayDialog = true;
  }

  saveJornada() {
    if (this.form.invalid) return;

    const data = this.form.value;

    if (this.isEdit && this.currentId) {
      this.academicService.updateJornada(this.currentId, data).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Jornada actualizada' });
          this.loadJornadas();
          this.displayDialog = false;
        },
        error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar' }),
      });
    } else {
      this.academicService.createJornada(data).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Jornada creada' });
          this.loadJornadas();
          this.displayDialog = false;
        },
        error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear' }),
      });
    }
  }

  deleteJornada(id: string) {
    this.confirmationService.confirm({
      message: '¿Está seguro de eliminar esta jornada?',
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.academicService.deleteJornada(id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Jornada eliminada' });
            this.loadJornadas();
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar' }),
        });
      }
    });
  }
}
