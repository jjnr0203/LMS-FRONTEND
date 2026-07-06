import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { BadgeModule } from 'primeng/badge';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { TabsModule } from 'primeng/tabs';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AcademicService } from '../../../../../core/services/academic.service';
import { Permission } from '../../../../../core/models';

@Component({
  selector: 'app-permissions',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    CheckboxModule,
    SelectModule,
    TabsModule,
    ToastModule,
    TextareaModule,
    BadgeModule,
    FormsModule,
  ],
  templateUrl: './permissions.html',
})
export class Permissions implements OnInit {
  private academicService = inject(AcademicService);
  private formBuilder = inject(FormBuilder);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private cdr = inject(ChangeDetectorRef);

  permissions: Permission[] = [];
  displayDialog = false;
  form!: FormGroup;
  isEdit = false;
  currentId: string | null = null;

  // Role assignment
  roles: { id: string; name: string }[] = [];
  selectedRoleId: string | null = null;
  rolePermIds: Set<string> = new Set();

  activeSubTab: string | number | undefined = '0';

  ngOnInit() {
    this.initForm();
    this.loadPermissions();
    this.loadRoles();
  }

  initForm() {
    this.form = this.formBuilder.group({
      name: ['', Validators.required],
      code: ['', Validators.required],
      resource: ['', Validators.required],
      description: [''],
    });
  }

  loadPermissions() {
    this.academicService.getPermissions().subscribe({
      next: (data) => {
        this.permissions = data;
        this.cdr.detectChanges();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los permisos' });
        this.cdr.detectChanges();
      }
    });
  }

  loadRoles() {
    this.academicService.getPermissionRoles().subscribe({
      next: (data) => {
        this.roles = data;
        this.cdr.detectChanges();
      },
      error: () => console.error('Error loading roles'),
    });
  }

  onRoleChange() {
    this.rolePermIds = new Set();
    if (!this.selectedRoleId) return;
    this.academicService.getPermissionsByRole(this.selectedRoleId).subscribe({
      next: (res) => {
        this.rolePermIds = new Set(res.permissionIds);
        this.cdr.detectChanges();
      },
    });
  }

  toggleRolePerm(permId: string) {
    if (this.rolePermIds.has(permId)) {
      this.rolePermIds.delete(permId);
    } else {
      this.rolePermIds.add(permId);
    }
  }

  saveRoleAssignment() {
    if (!this.selectedRoleId) return;
    const ids = Array.from(this.rolePermIds);
    this.academicService.assignPermissionsToRole(this.selectedRoleId, ids).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Permisos asignados al rol' });
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron asignar los permisos' }),
    });
  }

  openNew() {
    this.isEdit = false;
    this.currentId = null;
    this.form.reset();
    this.displayDialog = true;
  }

  editPermission(p: Permission) {
    this.isEdit = true;
    this.currentId = p.id;
    this.form.patchValue({
      name: p.name,
      code: p.code,
      resource: p.resource,
      description: p.description || '',
    });
    this.displayDialog = true;
  }

  savePermission() {
    if (this.form.invalid) return;
    const data = this.form.value;

    if (this.isEdit && this.currentId) {
      this.academicService.updatePermission(this.currentId, data).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Permiso actualizado' });
          this.loadPermissions();
          this.displayDialog = false;
        },
        error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar' }),
      });
    } else {
      this.academicService.createPermission(data).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Permiso creado' });
          this.loadPermissions();
          this.displayDialog = false;
        },
        error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear' }),
      });
    }
  }

  deletePermission(id: string) {
    this.confirmationService.confirm({
      message: '¿Está seguro de eliminar este permiso?',
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.academicService.deletePermission(id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Permiso eliminado' });
            this.loadPermissions();
            if (this.selectedRoleId) this.onRoleChange();
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar' }),
        });
      }
    });
  }

  getResourceGroupedPerms(): { resource: string; perms: Permission[] }[] {
    const map = new Map<string, Permission[]>();
    for (const p of this.permissions) {
      const r = p.resource;
      if (!map.has(r)) map.set(r, []);
      map.get(r)!.push(p);
    }
    return Array.from(map.entries())
      .map(([resource, perms]) => ({ resource, perms }))
      .sort((a, b) => a.resource.localeCompare(b.resource));
  }
}
