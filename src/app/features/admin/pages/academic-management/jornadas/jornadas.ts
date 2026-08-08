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
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TagModule } from 'primeng/tag';
import { AcademicService } from '../../../../../core/services/academic.service';
import { Jornada } from '../../../../../core/models';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';

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
    MenuModule
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
  jornadaForm!: FormGroup;
  isEdit = false;
  currentId: string | null = null;
  submitted = signal(false);
  menuItems: MenuItem[] = [];
  selectedJornadaForMenu: any = null;

  get hasEmptyRequiredFields() {
    if (!this.jornadaForm) return true;
    const c = this.jornadaForm.controls;
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
    this.loadJornadas();
  }

  initForm() {
    this.jornadaForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.maxLength(20), Validators.pattern(/^[A-Za-zÁÉÍÓÚáéíóúñÑ ]+$/)]],
      description: ['', Validators.maxLength(150)],
      isActive: [false],
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
    this.isEdit = false;
    this.currentId = null;
    this.submitted.set(false);
    this.jornadaForm.reset({ isActive: false });
    this.displayDialog = true;
  }

  editJornada(j: Jornada) {
    this.isEdit = true;
    this.currentId = j.id;
    this.jornadaForm.patchValue({
      name: j.name,
      description: j.description || '',
      isActive: j.isActive,
    });
    this.submitted.set(false);
    this.displayDialog = true;
  }

  saveJornada() {
    this.submitted.set(true);
    if (this.jornadaForm.invalid) {
      this.jornadaForm.markAllAsTouched();
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Por favor, corrija los errores en el formulario' });
      return;
    }

    const data = this.jornadaForm.value;

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

  showMenu(event: Event, menu: any, jornada: any) {
    this.selectedJornadaForMenu = jornada;
    this.menuItems = [
      {
        label: 'Editar',
        icon: 'pi pi-pencil',
        styleClass: 'action-edit',
        command: () => this.editJornada(this.selectedJornadaForMenu)
      },
      {
        label: 'Eliminar',
        icon: 'pi pi-trash',
        styleClass: 'action-delete',
        command: () => this.deleteJornada(this.selectedJornadaForMenu.id)
      }
    ];
    menu.toggle(event);
  }
}
