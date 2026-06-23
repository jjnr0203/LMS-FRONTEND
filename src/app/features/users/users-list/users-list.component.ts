import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../core/models';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { CreateUserComponent } from '../../admin/create-user/create-user.component';

@Component({
  selector: 'app-users-list',
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    TagModule,
    ToastModule,
    ConfirmDialogModule,
    DialogModule,
    ReactiveFormsModule,
    FormsModule,
    InputTextModule,
    SelectModule,
    IconFieldModule,
    InputIconModule,
    CreateUserComponent,
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <p-toast />
    <p-confirmDialog />

    <div class="page-container">
      <!-- Dark Header -->
      <div class="page-header">
        <div class="header-content">
          <h1 class="title">{{ isStudentList ? 'Lista de Estudiantes' : 'Lista de Usuarios' }}</h1>
          <p class="description">
            {{ isStudentList ? 'Administra a todos los estudiantes registrados en la institución.' : 'Gestiona los accesos y roles de los usuarios de la plataforma.' }}
          </p>
        </div>
      </div>

      <!-- Main Content Card -->
      <div class="content-wrapper">
        <div class="data-card">
          <div class="flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
            <div class="flex align-items-center gap-3">
              <h3 class="m-0 text-xl font-medium text-800">Directorio</h3>
              @if (!isStudentList) {
                <p-button label="Crear Usuario" icon="pi pi-plus" (click)="openCreateDialog()" severity="success" size="small"></p-button>
              }
            </div>
            
            <div class="flex align-items-center gap-2">
              <p-iconField iconPosition="left" styleClass="w-20rem">
                <p-inputIcon styleClass="pi pi-search" />
                <input pInputText type="text" [(ngModel)]="searchQuery" (ngModelChange)="onSearchChange($event)" placeholder="Buscar por cédula o nombre..." class="w-full" />
              </p-iconField>
              @if (!isStudentList) {
                <p-select
                  [options]="roleOptions"
                  [(ngModel)]="selectedRole"
                  (onChange)="onRoleFilterChange()"
                  placeholder="Filtrar por Rol"
                  [showClear]="true"
                  styleClass="w-15rem"
                  optionLabel="label"
                  optionValue="value"
                ></p-select>
              }
            </div>
          </div>

          <p-table
            [value]="users()"
            [paginator]="true"
            [rows]="10"
            [totalRecords]="totalRecords()"
            [lazy]="true"
            (onLazyLoad)="onPageChange($event)"
            [loading]="loading()"
            [tableStyle]="{ 'min-width': '50rem' }"
            styleClass="p-datatable-sm"
          >
            <ng-template pTemplate="header">
              <tr>
                <th>ID / Cédula</th>
                <th>Nombres</th>
                <th>Apellidos</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Acciones</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-user>
              <tr>
                <td class="font-medium text-900">{{ user.id }}</td>
                <td>{{ user.firstName }}</td>
                <td>{{ user.lastName }}</td>
                <td>{{ user.email }}</td>
                <td>
                  <p-tag [value]="translateRole(user.roleName)" [severity]="getRoleSeverity(user.roleName)"></p-tag>
                </td>
                <td>
                  <div class="flex gap-2">
                    <p-button
                      icon="pi pi-pencil"
                      [rounded]="true"
                      [text]="true"
                      severity="info"
                      (click)="openEditDialog(user)"
                    />
                    <p-button
                      icon="pi pi-trash"
                      [rounded]="true"
                      [text]="true"
                      severity="danger"
                      (click)="confirmDelete(user)"
                    />
                  </div>
                </td>
              </tr>
            </ng-template>
            <ng-template pTemplate="emptymessage">
              <tr>
                <td colspan="6" class="text-center p-4 text-500">No se encontraron registros.</td>
              </tr>
            </ng-template>
          </p-table>
        </div>
      </div>
    </div>

    <!-- Edit Dialog -->
    <p-dialog
      header="Editar Usuario"
      [(visible)]="editDialogVisible"
      [modal]="true"
      [style]="{ width: '400px' }"
    >
      <form [formGroup]="editForm" (ngSubmit)="onSaveEdit()">
        <div class="flex flex-column gap-3 mt-3">
          <div class="flex flex-column gap-1">
            <label for="firstName" class="font-semibold text-sm">Nombres</label>
            <input pInputText id="firstName" formControlName="firstName" />
          </div>
          <div class="flex flex-column gap-1">
            <label for="lastName" class="font-semibold text-sm">Apellidos</label>
            <input pInputText id="lastName" formControlName="lastName" />
          </div>
          <div class="flex flex-column gap-1">
            <label for="email" class="font-semibold text-sm">Email</label>
            <input pInputText id="email" formControlName="email" type="email" />
          </div>
          <div class="flex justify-content-end mt-3 gap-2">
            <p-button
              label="Cancelar"
              icon="pi pi-times"
              [text]="true"
              severity="secondary"
              (click)="editDialogVisible = false"
            />
            <p-button
              label="Guardar"
              icon="pi pi-check"
              type="submit"
              [disabled]="editForm.invalid || loading()"
            />
          </div>
        </div>
      </form>
    </p-dialog>

    <!-- Create Dialog -->
    <p-dialog
      header="Crear Nuevo Usuario"
      [(visible)]="createDialogVisible"
      [modal]="true"
      [style]="{ width: '800px', 'max-width': '95vw' }"
      [closable]="true"
    >
      <app-create-user [isModal]="true" (userCreated)="onUserCreated()"></app-create-user>
    </p-dialog>
  `,
  styles: [
    `
      .page-container {
        display: flex;
        flex-direction: column;
        margin-top: -1.5rem;
        margin-left: -1.5rem;
        margin-right: -1.5rem;
      }

      .page-header {
        background: #064e3b;
        color: #ffffff;
        border-bottom: none;
        padding: 2.5rem 2rem 5rem 2rem;
        min-height: 250px;
        box-sizing: border-box;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
      }
      .title {
        font-size: 2.2rem;
        font-weight: 600;
        margin: 0 0 0.5rem 0;
        letter-spacing: -0.02em;
        color: #ffffff;
      }
      .description {
        color: #d1fae5;
        font-size: 0.95rem;
        line-height: 1.5;
        margin: 0;
      }

      .content-wrapper {
        padding: 0 2rem;
        margin-top: -3.5rem;
      }
      
      .data-card {
        background: #ffffff;
        border-radius: 6px;
        padding: 1.5rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        max-width: 1200px;
        margin: 0 auto;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }
      .data-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
      }

      .flex { display: flex; }
      .flex-column { flex-direction: column; }
      .justify-content-between { justify-content: space-between; }
      .justify-content-end { justify-content: flex-end; }
      .align-items-center { align-items: center; }
      .gap-1 { gap: 0.25rem; }
      .gap-2 { gap: 0.5rem; }
      .gap-3 { gap: 1rem; }
      .mt-3 { margin-top: 1rem; }
      .mb-4 { margin-bottom: 1.5rem; }
      .font-semibold { font-weight: 600; }
      .text-sm { font-size: 0.875rem; }
      .font-medium { font-weight: 500; }
      .text-900 { color: #111827; }
      .text-500 { color: #6b7280; }
      .text-center { text-align: center; }
      .p-4 { padding: 1rem; }
      .text-xl { font-size: 1.25rem; }
      .m-0 { margin: 0; }
      .w-15rem { width: 15rem; }
    `,
  ],
})
export class UsersListComponent implements OnInit, OnDestroy {
  private userService = inject(UserService);
  private route = inject(ActivatedRoute);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private fb = inject(FormBuilder);

  users = signal<User[]>([]);
  totalRecords = signal(0);
  loading = signal(false);

  roleFilter: string = '';
  isStudentList = false;

  selectedRole: string | null = null;
  roleOptions = [
    { label: 'Administrador', value: 'admin' },
    { label: 'Coordinador', value: 'coordinator' },
    { label: 'Docente', value: 'teacher' },
    { label: 'Estudiante', value: 'student' },
    { label: 'Tesorería', value: 'treasury' }
  ];

  searchQuery = '';
  searchSubject = new Subject<string>();
  searchSubscription!: Subscription;

  createDialogVisible = false;
  editDialogVisible = false;
  selectedUserId: string | null = null;

  editForm = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
  });

  ngOnInit() {
    this.roleFilter = this.route.snapshot.data['roleFilter'] || '';
    this.isStudentList = this.roleFilter === 'student';
    this.loadUsers(1, 10);

    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.loadUsers(1, 10);
    });
  }

  ngOnDestroy() {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

  loadUsers(page: number, limit: number) {
    this.loading.set(true);
    const roleToFilter = this.isStudentList ? 'student' : (this.selectedRole || '');
    this.userService.getUsers(page, limit, roleToFilter, this.searchQuery).subscribe({
      next: (res) => {
        this.users.set(res.data);
        this.totalRecords.set(res.pagination.total);
        this.loading.set(false);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los usuarios' });
        this.loading.set(false);
      },
    });
  }

  onPageChange(event: any) {
    const page = (event.first ?? 0) / (event.rows ?? 10) + 1;
    const limit = event.rows ?? 10;
    this.loadUsers(page, limit);
  }

  onRoleFilterChange() {
    this.loadUsers(1, 10);
  }

  onSearchChange(value: string) {
    this.searchSubject.next(value);
  }

  openCreateDialog() {
    this.createDialogVisible = true;
  }

  onUserCreated() {
    this.createDialogVisible = false;
    this.loadUsers(1, 10);
  }

  getRoleSeverity(roleName?: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    if (!roleName) return 'secondary';
    switch (roleName.toLowerCase()) {
      case 'admin':
        return 'danger';
      case 'coordinator':
        return 'warn';
      case 'teacher':
        return 'info';
      case 'student':
        return 'success';
      case 'treasury':
        return 'secondary';
      default:
        return 'secondary';
    }
  }

  translateRole(roleName?: string): string {
    if (!roleName) return '';
    switch (roleName.toLowerCase()) {
      case 'admin': return 'Administrador';
      case 'coordinator': return 'Coordinador';
      case 'teacher': return 'Docente';
      case 'student': return 'Estudiante';
      case 'treasury': return 'Tesorería';
      default: return roleName;
    }
  }

  openEditDialog(user: User) {
    this.selectedUserId = user.id;
    this.editForm.patchValue({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    });
    this.editDialogVisible = true;
  }

  onSaveEdit() {
    if (this.editForm.invalid || !this.selectedUserId) return;
    this.loading.set(true);
    this.userService.updateUser(this.selectedUserId, this.editForm.value).subscribe({
      next: (res) => {
        this.users.update((users) =>
          users.map((u) => (u.id === this.selectedUserId ? { ...u, ...res.user } : u))
        );
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Usuario actualizado' });
        this.editDialogVisible = false;
        this.loading.set(false);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar' });
        this.loading.set(false);
      },
    });
  }

  confirmDelete(user: User) {
    this.confirmationService.confirm({
      message: `¿Estás seguro que deseas eliminar a ${user.firstName} ${user.lastName}?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.loading.set(true);
        this.userService.deleteUser(user.id).subscribe({
          next: () => {
            this.users.update((users) => users.filter((u) => u.id !== user.id));
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Usuario eliminado' });
            this.loading.set(false);
          },
          error: () => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar' });
            this.loading.set(false);
          },
        });
      },
    });
  }
}





