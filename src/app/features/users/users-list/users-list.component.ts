import { Component, inject, OnInit, signal } from '@angular/core';
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
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';

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
    InputTextModule,
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <p-toast />
    <p-confirmDialog />

    <div class="card">
      <div class="flex justify-content-between align-items-center mb-4">
        <h2>{{ isStudentList ? 'Lista de Estudiantes' : 'Lista de Usuarios' }}</h2>
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
            <td>{{ user.id }}</td>
            <td>{{ user.firstName }}</td>
            <td>{{ user.lastName }}</td>
            <td>{{ user.email }}</td>
            <td>
              <p-tag [value]="user.roleName" [severity]="getRoleSeverity(user.roleName)"></p-tag>
            </td>
            <td>
              <div class="flex gap-2">
                <p-button
                  icon="pi pi-pencil"
                  [rounded]="true"
                  [outlined]="true"
                  severity="info"
                  (click)="openEditDialog(user)"
                />
                <p-button
                  icon="pi pi-trash"
                  [rounded]="true"
                  [outlined]="true"
                  severity="danger"
                  (click)="confirmDelete(user)"
                />
              </div>
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="6">No se encontraron registros.</td>
          </tr>
        </ng-template>
      </p-table>
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
            <label for="firstName">Nombres</label>
            <input pInputText id="firstName" formControlName="firstName" />
          </div>
          <div class="flex flex-column gap-1">
            <label for="lastName">Apellidos</label>
            <input pInputText id="lastName" formControlName="lastName" />
          </div>
          <div class="flex flex-column gap-1">
            <label for="email">Email</label>
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
  `,
  styles: [
    `
      .card {
        background: #ffffff;
        padding: 2rem;
        border-radius: 10px;
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
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
    `,
  ],
})
export class UsersListComponent implements OnInit {
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
  }

  loadUsers(page: number, limit: number) {
    this.loading.set(true);
    this.userService.getUsers(page, limit, this.roleFilter).subscribe({
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
