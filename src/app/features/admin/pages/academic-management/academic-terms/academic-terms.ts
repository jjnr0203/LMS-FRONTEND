import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { DatePickerModule } from 'primeng/datepicker'; // Aura renamed calendar to datepicker sometimes, but let's stick to standard if available. Aura: DatePicker?
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AcademicService } from '../../../../../core/services/academic.service';
import { AcademicTerm } from '../../../../../core/models';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-academic-terms',
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
    DatePipe,
  ],
  templateUrl: './academic-terms.html',
})
export class AcademicTerms implements OnInit {
  private academicService = inject(AcademicService);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService); // Inherits from parent
  private confirmationService = inject(ConfirmationService); // Inherits from parent
  private cdr = inject(ChangeDetectorRef);

  terms: AcademicTerm[] = [];
  displayDialog = false;
  termForm!: FormGroup;
  isEdit = false;
  currentTermId: string | null = null;

  ngOnInit() {
    this.initForm();
    this.loadTerms();
  }

  initForm() {
    this.termForm = this.fb.group({
      name: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      isActive: [false],
    });
  }

  loadTerms() {
    this.academicService.getTerms().subscribe({
      next: (data) => {
        this.terms = data;
        this.cdr.detectChanges();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los ciclos' });
        this.cdr.detectChanges();
      }
    });
  }

  openNew() {
    this.loadTerms();
    this.isEdit = false;
    this.currentTermId = null;
    this.termForm.reset({ isActive: false });
    this.displayDialog = true;
  }

  editTerm(term: AcademicTerm) {
    this.loadTerms();
    this.isEdit = true;
    this.currentTermId = term.id;
    this.termForm.patchValue({
      name: term.name,
      startDate: new Date(term.startDate).toISOString().split('T')[0], // format for html input type="date"
      endDate: new Date(term.endDate).toISOString().split('T')[0],
      isActive: term.isActive,
    });
    this.displayDialog = true;
  }

  saveTerm() {
    if (this.termForm.invalid) return;

    const data = this.termForm.value;
    // ensure date format is correct for backend
    data.startDate = new Date(data.startDate);
    data.endDate = new Date(data.endDate);

    if (this.isEdit && this.currentTermId) {
      this.academicService.updateTerm(this.currentTermId, data).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Ciclo actualizado' });
          this.loadTerms();
          this.displayDialog = false;
        },
        error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar' }),
      });
    } else {
      this.academicService.createTerm(data).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Ciclo creado' });
          this.loadTerms();
          this.displayDialog = false;
        },
        error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear' }),
      });
    }
  }

  deleteTerm(id: string) {
    this.confirmationService.confirm({
      message: '¿Está seguro de eliminar este ciclo académico?',
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.academicService.deleteTerm(id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Ciclo eliminado' });
            this.loadTerms();
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar' }),
        });
      }
    });
  }
}
