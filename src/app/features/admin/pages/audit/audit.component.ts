import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { DatePipe, JsonPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MessageService, MenuItem, ConfirmationService } from 'primeng/api';
import { MenuModule } from 'primeng/menu';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { FormsModule } from '@angular/forms';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { environment } from '../../../../environments/environment';

interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  entityName: string;
  entityId: string;
  oldValues: any;
  newValues: any;
  createdAt: string;
}

@Component({
  selector: 'app-audit',
  imports: [TableModule, TagModule, ButtonModule, DialogModule, ToastModule, MenuModule, SelectModule, DatePickerModule, FormsModule, ConfirmDialogModule, DatePipe, JsonPipe],
  providers: [MessageService, ConfirmationService],
  templateUrl: './audit.component.html',
  styleUrl: './audit.component.scss',
})
export class AuditComponent implements OnInit {
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  logs: AuditLog[] = [];
  totalRecords = 0;
  loading = true;
  detailsVisible = false;
  selectedLog: AuditLog | null = null;

  currentPage = 1;
  pageSize = 10;

  selectedModule: string | null = null;
  selectedAction: string | null = null;
  dateRange: Date[] | null = null;

  moduleOptions = [
    { label: 'Usuarios', value: 'users' },
    { label: 'Roles', value: 'roles' },
    { label: 'Facultades', value: 'faculties' },
    { label: 'Carreras', value: 'careers' },
    { label: 'Asignaturas', value: 'subjects' },
    { label: 'Matrículas', value: 'tuitions' },
    { label: 'Docentes', value: 'teachers' },
    { label: 'Estudiantes', value: 'students' },
  ];

  actionOptions = [
    { label: 'Creación (INSERT)', value: 'INSERT' },
    { label: 'Actualización (UPDATE)', value: 'UPDATE' },
    { label: 'Eliminación (DELETE)', value: 'DELETE' }
  ];

  ngOnInit(): void {
    // Initial fetch handled by onLazyLoad from p-table
  }

  fetchLogs(page: number, limit: number) {
    this.loading = true;
    let params: any = { page: String(page), limit: String(limit) };
    if (this.selectedModule) params.module = this.selectedModule;
    if (this.selectedAction) params.action = this.selectedAction;
    if (this.dateRange && this.dateRange[0]) {
      params.startDate = this.dateRange[0].toISOString();
      if (this.dateRange[1]) {
        params.endDate = this.dateRange[1].toISOString();
      }
    }

    this.http
      .get<{ items: AuditLog[]; total: number }>(`${environment.apiUrl}/admin/audit-logs`, { params })
      .subscribe({
        next: (res) => {
          this.logs = res.items ?? [];
          this.totalRecords = res.total ?? 0;
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error fetching audit logs:', err);
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
  }

  applyFilters() {
    this.currentPage = 1;
    this.fetchLogs(1, this.pageSize);
  }

  clearFilters() {
    this.selectedModule = null;
    this.selectedAction = null;
    this.dateRange = null;
    this.applyFilters();
  }

  onLazyLoad(event: any) {
    const page = Math.floor((event.first ?? 0) / (event.rows ?? 10)) + 1;
    this.currentPage = page;
    this.pageSize = event.rows ?? 10;
    this.fetchLogs(page, this.pageSize);
  }

  menuItems: MenuItem[] = [];

  showMenu(event: Event, menu: any, log: AuditLog) {
    this.menuItems = [
      {
        label: 'Ver Detalle',
        icon: 'pi pi-eye',
        command: () => this.showDetails(log)
      },
      {
        label: 'Eliminar Registro',
        icon: 'pi pi-trash',
        command: () => this.confirmDelete(log)
      }
    ];
    menu.toggle(event);
  }

  confirmDelete(log: AuditLog) {
    this.confirmationService.confirm({
      message: '¿Estás seguro de que deseas eliminar este registro de auditoría?',
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.http.delete(`${environment.apiUrl}/admin/audit-logs/${log.id}`).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Registro eliminado' });
            this.fetchLogs(this.currentPage, this.pageSize);
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el registro' })
        });
      }
    });
  }

  confirmClearOld() {
    this.confirmationService.confirm({
      message: '¿Estás seguro de que deseas eliminar TODOS los registros con más de 3 meses de antigüedad? Esta acción no se puede deshacer.',
      header: 'Limpiar Registros Antiguos',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, limpiar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.http.delete(`${environment.apiUrl}/admin/audit-logs/clear/old`).subscribe({
          next: (res: any) => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: `Se han eliminado ${res.affected ?? ''} registros antiguos` });
            this.fetchLogs(1, this.pageSize);
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo limpiar los registros' })
        });
      }
    });
  }

  showDetails(log: AuditLog) {
    this.selectedLog = log;
    this.detailsVisible = true;
  }

  getSeverity(action: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    if (action === 'INSERT') return 'success';
    if (action === 'UPDATE') return 'warn';
    if (action === 'DELETE') return 'danger';
    return 'info';
  }

  getActionLabel(action: string): string {
    const map: Record<string, string> = {
      INSERT: 'Creación',
      UPDATE: 'Actualización',
      DELETE: 'Eliminación',
    };
    return map[action] ?? action;
  }

  getRoleSeverity(roleName?: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    if (!roleName) return 'secondary';
    switch (roleName.toLowerCase()) {
      case 'admin': return 'danger';
      case 'coordinator': return 'warn';
      case 'teacher': return 'info';
      case 'student': return 'success';
      case 'treasury': return 'secondary';
      case 'secretary': return 'secondary';
      case 'human_resources': return 'secondary';
      default: return 'secondary';
    }
  }

  translateRole(roleName?: string): string {
    if (!roleName) return 'Sistema';
    switch (roleName.toLowerCase()) {
      case 'admin': return 'Administrador';
      case 'coordinator': return 'Coordinador';
      case 'teacher': return 'Docente';
      case 'student': return 'Estudiante';
      case 'treasury': return 'Tesorería';
      case 'secretary': return 'Secretaría';
      case 'human_resources': return 'Recursos Humanos';
      default: return roleName;
    }
  }

  translateField(field: string): string {
    const dict: Record<string, string> = {
      id: 'ID (Identificador)',
      firstName: 'Nombre',
      first_name: 'Nombre',
      lastName: 'Apellido',
      last_name: 'Apellido',
      email: 'Correo Electrónico',
      phone: 'Teléfono',
      address: 'Dirección',
      birthDate: 'Fecha de Nacimiento',
      birth_date: 'Fecha de Nacimiento',
      isActive: 'Estado (Activo/Inactivo)',
      is_active: 'Estado (Activo/Inactivo)',
      roleId: 'ID de Rol',
      role_id: 'ID de Rol',
      password: 'Contraseña',
      name: 'Nombre',
      description: 'Descripción',
      code: 'Código',
      status: 'Estado',
      jornadaId: 'ID de Jornada',
      jornada_id: 'ID de Jornada',
      subjectId: 'ID de Asignatura',
      subject_id: 'ID de Asignatura',
      teacherId: 'Cédula de Docente',
      teacher_id: 'Cédula de Docente',
      assignedAt: 'Fecha de Asignación',
      assigned_at: 'Fecha de Asignación',
      modalityId: 'ID de Modalidad',
      modality_id: 'ID de Modalidad',
      curriculumId: 'ID de Malla Curricular',
      curriculum_id: 'ID de Malla Curricular',
      academicTermId: 'ID de Período Académico',
      academic_term_id: 'ID de Período Académico',
      careerId: 'ID de Carrera',
      career_id: 'ID de Carrera',
      studentId: 'Cédula de Estudiante',
      student_id: 'Cédula de Estudiante',
      userId: 'ID de Usuario',
      user_id: 'ID de Usuario',
      tuitionId: 'ID de Matrícula',
      tuition_id: 'ID de Matrícula',
      level: 'Nivel',
      semester: 'Semestre',
      credits: 'Créditos',
      type: 'Tipo',
      color: 'Color',
      capacity: 'Capacidad',
      startDate: 'Fecha de Inicio',
      start_date: 'Fecha de Inicio',
      endDate: 'Fecha de Fin',
      end_date: 'Fecha de Fin',
      prerequisites: 'Requisitos Previos',
    };
    return dict[field] || field;
  }

  translateModule(moduleName: string): string {
    const dict: Record<string, string> = {
      users: 'Usuarios',
      roles: 'Roles',
      faculties: 'Facultades',
      modalities: 'Modalidades',
      academic_shifts: 'Jornadas Académicas',
      academic_terms: 'Periodos Académicos',
      institution_config: 'Configuración Institucional',
      teachers: 'Docentes',
      teacher_faculties: 'Docentes - Facultades',
      students: 'Estudiantes',
      careers: 'Carreras',
      career_modalities: 'Carreras - Modalidades',
      career_jornadas: 'Carreras - Jornadas',
      curriculums: 'Mallas Curriculares',
      subjects: 'Asignaturas',
      career_subjects: 'Carreras - Asignaturas',
      coordinator_subject_colors: 'Colores de Asignaturas',
      teacher_subjects: 'Carga Horaria Docente',
      schedules: 'Horarios',
      tuitions: 'Matrículas',
      inscriptions: 'Inscripciones',
      enrollment_details: 'Detalles de Matrícula',
      enrollment_subjects: 'Asignaturas Matriculadas',
      certificates: 'Certificados',
      audit_logs: 'Auditoría',
      semester_colors: 'Colores de Semestre'
    };
    return dict[moduleName] ?? moduleName;
  }

  getChanges(log: AuditLog): { key: string, old: any, new: any }[] {
    const changes: { key: string, old: any, new: any }[] = [];
    if (!log) return changes;

    const oldObj = typeof log.oldValues === 'string' ? JSON.parse(log.oldValues) : (log.oldValues || {});
    const newObj = typeof log.newValues === 'string' ? JSON.parse(log.newValues) : (log.newValues || {});

    const ignoredKeys = new Set(['createdAt', 'updatedAt', 'deletedAt', 'created_at', 'updated_at', 'deleted_at', 'password']);

    if (log.action === 'INSERT') {
      for (const key of Object.keys(newObj)) {
        if (!ignoredKeys.has(key)) {
          changes.push({ key, old: null, new: newObj[key] });
        }
      }
    } else if (log.action === 'DELETE') {
      for (const key of Object.keys(oldObj)) {
        if (!ignoredKeys.has(key)) {
          changes.push({ key, old: oldObj[key], new: null });
        }
      }
    } else {
      // UPDATE
      const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);
      for (const key of allKeys) {
        if (ignoredKeys.has(key)) continue;
        
        let oldVal = oldObj[key];
        let newVal = newObj[key];

        // TypeORM sometimes omits fields from update payload if they are not explicitly updated
        // which makes newVal undefined while oldVal exists. If this is a partial update, it means no change.
        if (newVal === undefined) continue;
        
        // Normalize Dates to strings if they are ISO to compare accurately
        if (typeof oldVal === 'string' && typeof newVal === 'string') {
          // If both are dates but one has T00:00:00.000Z and the other is just YYYY-MM-DD
          if (oldVal.startsWith(newVal.split('T')[0]) || newVal.startsWith(oldVal.split('T')[0])) {
             if (new Date(oldVal).getTime() === new Date(newVal).getTime() ||
                 (oldVal.length <= 10 && newVal.startsWith(oldVal)) || 
                 (newVal.length <= 10 && oldVal.startsWith(newVal))) {
                continue;
             }
          }
        }

        if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
          changes.push({ key, old: oldVal, new: newVal });
        }
      }
    }
    return changes;
  }
}
