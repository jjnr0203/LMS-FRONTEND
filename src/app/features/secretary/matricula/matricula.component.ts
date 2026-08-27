import { NgTemplateOutlet } from '@angular/common';
import { Component, inject, OnInit, signal, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SecretaryService } from '../../../core/services/secretary.service';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { MultiSelectModule } from 'primeng/multiselect';

@Component({
  selector: 'app-matricula',
  imports: [
    ReactiveFormsModule,
    NgTemplateOutlet,
    ToastModule,
    CardModule,
    InputTextModule,
    SelectModule,
    ButtonModule,
    MultiSelectModule,
  ],
  providers: [MessageService],
  templateUrl: './matricula.component.html',
  styleUrl: './matricula.component.scss',
})
export class MatriculaComponent implements OnInit {
  private formBuilder = inject(FormBuilder);
  private secretaryService = inject(SecretaryService);
  private messageService = inject(MessageService);

  isModal = input<boolean>(false);
  student = input<any>(null);
  enrollmentCreated = output<void>();

  careers = signal<any[]>([]);
  terms = signal<any[]>([]);
  semesters = signal<any[]>([]);
  subjects = signal<any[]>([]);
  loading = signal(false);
  loadingSubjects = signal(false);
  studentNotFound = signal(false);

  private prefillApplied = false;

  form = this.formBuilder.group({
    studentId: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
    academicTermId: ['', Validators.required],
    careerId: ['', Validators.required],
    semester: [null as number | null, { validators: Validators.required, disabled: true }],
    subjectIds: [{ value: [] as string[], disabled: true }],
  });

  ngOnInit() {
    this.secretaryService.getCareers().subscribe({
      next: (data) => {
        this.careers.set(data);
        this.applyPreselectedStudent();
      },
    });
    this.secretaryService.getTerms().subscribe({
      next: (data) => {
        this.terms.set(data);
        this.applyPreselectedStudent();
      },
    });
  }

  private applyPreselectedStudent() {
    const student = this.student();
    if (!student || this.prefillApplied) return;
    if (this.careers().length === 0 || this.terms().length === 0) return;
    this.prefillApplied = true;
    this.form.controls.studentId.setValue(student.id);
    this.autofillFromStudent(student);
  }

  get studentId() {
    return this.form.controls.studentId;
  }
  get academicTermId() {
    return this.form.controls.academicTermId;
  }
  get careerId() {
    return this.form.controls.careerId;
  }
  get semester() {
    return this.form.controls.semester;
  }

  filterNumbers(event: any, controlName: string) {
    const value = event.target.value;
    const filteredValue = value.replace(/[^0-9]/g, '');
    if (value !== filteredValue) {
      this.form.get(controlName)?.setValue(filteredValue);
    }
  }

  onStudentIdChange() {
    const value = this.form.getRawValue().studentId ?? '';
    this.studentNotFound.set(false);
    if (value.length !== 10) return;
    this.secretaryService.listStudents({ page: 1, limit: 5, search: value }).subscribe({
      next: (res) => {
        const found = (res.data ?? []).find((s: any) => s.id === value);
        if (found) {
          this.autofillFromStudent(found);
        } else {
          this.studentNotFound.set(true);
        }
      },
      error: () => this.studentNotFound.set(true),
    });
  }

  private autofillFromStudent(student: any) {
    const active = this.terms().find((t: any) => t.isActive);
    if (active) this.form.controls.academicTermId.setValue(active.id);

    if (student.careerId) {
      this.form.controls.careerId.setValue(student.careerId);
      this.onCareerChange(student.careerId, 1);
    }
  }

  onCareerChange(careerId: string, autoLevel?: number) {
    this.form.controls.semester.disable();
    this.form.controls.semester.reset(null);
    this.form.controls.subjectIds.disable();
    this.form.controls.subjectIds.reset([]);
    this.semesters.set([]);
    this.subjects.set([]);
    if (!careerId) return;
    this.secretaryService.getSemestersByCareer(careerId).subscribe({
      next: (data) => {
        this.semesters.set(data);
        this.form.controls.semester.enable();
        if (autoLevel != null && data.some((s: any) => s.value === autoLevel)) {
          this.form.controls.semester.setValue(autoLevel);
          this.loadSubjects(careerId, autoLevel, true);
        }
      },
    });
  }

  onSemesterChange(semester: number) {
    this.form.controls.subjectIds.disable();
    this.form.controls.subjectIds.reset([]);
    this.subjects.set([]);
    if (!semester) return;
    const careerId = this.form.value.careerId!;
    this.loadSubjects(careerId, semester, false);
  }

  private loadSubjects(careerId: string, semester: number, selectAll: boolean) {
    this.loadingSubjects.set(true);
    this.secretaryService.getSubjectsByCareer(careerId, semester).subscribe({
      next: (data) => {
        this.subjects.set(data);
        this.form.controls.subjectIds.enable();
        if (selectAll) {
          this.form.controls.subjectIds.setValue(data.map((s: any) => s.id));
        }
        this.loadingSubjects.set(false);
      },
      error: () => this.loadingSubjects.set(false),
    });
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Por favor, corrija los errores en el formulario',
      });
      return;
    }
    this.loading.set(true);
    this.secretaryService
      .createEnrollment({
        studentId: this.form.value.studentId!,
        academicTermId: this.form.value.academicTermId!,
        careerId: this.form.value.careerId!,
        level: this.form.getRawValue().semester!,
        subjectIds: this.form.getRawValue().subjectIds ?? [],
      })
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Matrícula generada correctamente',
          });
          this.loading.set(false);
          if (this.isModal()) {
            this.enrollmentCreated.emit();
            return;
          }
          this.form.reset({ semester: null, subjectIds: [] });
          this.form.controls.semester.disable();
          this.form.controls.subjectIds.disable();
          this.semesters.set([]);
          this.subjects.set([]);
        },
        error: (err) => {
          this.loading.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err.error?.message ?? 'Error al generar matrícula',
          });
        },
      });
  }
}
