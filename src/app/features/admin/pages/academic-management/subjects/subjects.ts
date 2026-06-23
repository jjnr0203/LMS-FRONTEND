import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AcademicService } from '../../../../../core/services/academic.service';
import { UserService } from '../../../../../core/services/user.service';
import { Subject, User } from '../../../../../core/models';

@Component({
  selector: 'app-subjects',
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
    TextareaModule,
    ToastModule,
  ],
  templateUrl: './subjects.html',
})
export class Subjects implements OnInit {
  private academicService = inject(AcademicService);
  private userService = inject(UserService);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  subjects: Subject[] = [];
  teachers: User[] = [];
  
  displayDialog = false;
  form!: FormGroup;
  isEdit = false;
  currentId: string | null = null;

  ngOnInit() {
    this.initForm();
    this.loadData();
  }

  initForm() {
    this.form = this.fb.group({
      name: ['', Validators.required],
      code: ['', Validators.required],
      credits: [1, [Validators.required, Validators.min(1)]],
      teacherId: [null],
      description: [''],
    });
  }

  loadData() {
    this.academicService.getSubjects().subscribe((data) => (this.subjects = data));
    this.userService.getUsers(1, 100, 'teacher').subscribe((res) => (this.teachers = res.data));
  }

  getTeacherName(id: string | undefined): string {
    if (!id) return 'No asignado';
    const c = this.teachers.find(u => u.id === id);
    return c ? `${c.firstName} ${c.lastName}` : id;
  }

  openNew() {
    this.loadData();
    this.isEdit = false;
    this.currentId = null;
    this.form.reset({ credits: 1 });
    this.displayDialog = true;
  }

  editSubject(s: Subject) {
    this.loadData();
    this.isEdit = true;
    this.currentId = s.id;
    this.form.patchValue(s);
    this.displayDialog = true;
  }

  saveSubject() {
    if (this.form.invalid) return;
    const data = this.form.value;

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
}
