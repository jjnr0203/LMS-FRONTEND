import { Component, inject, OnInit, signal } from '@angular/core';
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

  careers = signal<any[]>([]);
  terms = signal<any[]>([]);
  semesters = signal<any[]>([]);
  subjects = signal<any[]>([]);
  loading = signal(false);
  loadingSubjects = signal(false);

  form = this.formBuilder.group({
    studentId: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
    academicTermId: ['', Validators.required],
    careerId: ['', Validators.required],
    semester: [null as number | null, { validators: Validators.required, disabled: true }],
    subjectIds: [{ value: [] as string[], disabled: true }],
  });

  ngOnInit() {
    this.secretaryService.getCareers().subscribe({
      next: (data) => this.careers.set(data),
    });
    this.secretaryService.getTerms().subscribe({
      next: (data) => this.terms.set(data),
    });
  }

  get studentId() { return this.form.controls.studentId; }
  get academicTermId() { return this.form.controls.academicTermId; }
  get careerId() { return this.form.controls.careerId; }
  get semester() { return this.form.controls.semester; }

  onCareerChange(careerId: string) {
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
      },
    });
  }

  onSemesterChange(semester: number) {
    this.form.controls.subjectIds.disable();
    this.form.controls.subjectIds.reset([]);
    this.subjects.set([]);
    if (!semester) return;
    const careerId = this.form.value.careerId!;
    this.loadingSubjects.set(true);
    this.secretaryService.getSubjectsByCareer(careerId, semester).subscribe({
      next: (data) => {
        this.subjects.set(data);
        this.form.controls.subjectIds.enable();
        this.loadingSubjects.set(false);
      },
      error: () => this.loadingSubjects.set(false),
    });
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.secretaryService.createEnrollment({
      studentId: this.form.value.studentId!,
      academicTermId: this.form.value.academicTermId!,
      careerId: this.form.value.careerId!,
      level: this.form.value.semester!,
      subjectIds: this.form.getRawValue().subjectIds ?? [],
    }).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Matrícula generada correctamente' });
        this.form.reset({ semester: null, subjectIds: [] });
        this.form.controls.semester.disable();
        this.form.controls.subjectIds.disable();
        this.semesters.set([]);
        this.subjects.set([]);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message ?? 'Error al generar matrícula' });
      },
    });
  }
}
