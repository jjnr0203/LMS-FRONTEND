import { Component, OnInit, signal, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators, FormControl } from '@angular/forms';
import { UserService, User } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { PasswordModule } from 'primeng/password';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Table } from 'primeng/table';

@Component({
  selector: 'app-users-list',
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule, TableModule, ButtonModule, DialogModule,
    InputTextModule, SelectModule, PasswordModule, ToastModule, ConfirmDialogModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './users-list.component.html',
  styleUrl: './users-list.component.scss'
})
export class UsersListComponent implements OnInit {
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  @ViewChild('dt') dt!: Table;

  users: User[] = [];
  totalRecords = 0;
  loading = signal(true);

  userDialog = signal(false);
  userForm!: FormGroup;
  isEditMode = signal(false);

  roles = [
    { label: 'Administrador', value: 'admin' },
    { label: 'Estudiante', value: 'student' },
    { label: 'Profesor', value: 'professor' }
  ];

  filterRoles = [
    { label: 'Todos', value: null },
    ...this.roles
  ];
  selectedRoleFilter: string | undefined;

  ngOnInit() {
    this.initForm();
  }

  get id(): FormControl { return this.userForm.get('id') as FormControl; }
  get firstName(): FormControl { return this.userForm.get('firstName') as FormControl; }
  get lastName(): FormControl { return this.userForm.get('lastName') as FormControl; }
  get email(): FormControl { return this.userForm.get('email') as FormControl; }
  get roleName(): FormControl { return this.userForm.get('roleName') as FormControl; }
  get password(): FormControl { return this.userForm.get('password') as FormControl; }

  initForm() {
    this.userForm = this.fb.group({
      id: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(10)]],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      roleName: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  loadUsers(event: any) {
    this.loading.set(true);
    const page = event.first ? (event.first / event.rows) + 1 : 1;
    const limit = event.rows || 10;

    this.userService.getUsers(page, limit, this.selectedRoleFilter).subscribe({
      next: (res) => {
        this.users = res.data;
        this.totalRecords = res.pagination.total;
        this.loading.set(false);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los usuarios' });
        this.loading.set(false);
      }
    });
  }

  onRoleFilterChange(event: any) {
    this.selectedRoleFilter = event.value;
    this.dt?.reset();
  }

  openNew() {
    this.isEditMode.set(false);
    this.userForm.reset();
    this.password.setValidators([Validators.required, Validators.minLength(6)]);
    this.password.updateValueAndValidity();
    this.password.enable();
    this.roleName.enable();
    this.id.enable();
    this.userDialog.set(true);
  }

  editUser(user: User) {
    this.isEditMode.set(true);
    this.userForm.reset({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      roleName: user.role
    });
    this.password.clearValidators();
    this.password.updateValueAndValidity();
    this.password.disable();
    this.roleName.disable();
    this.id.disable();
    this.userDialog.set(true);
  }

  deleteUser(user: User) {
    this.confirmationService.confirm({
      message: `¿Está seguro de que desea eliminar a ${user.firstName} ${user.lastName}?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.userService.deleteUser(user.id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Usuario eliminado' });
            this.loadUsers({ first: 0, rows: 10 });
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar' })
        });
      }
    });
  }

  hideDialog() {
    this.userDialog.set(false);
  }

  saveUser() {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    const formValue = this.userForm.getRawValue();

    if (this.isEditMode()) {
      const updateData = {
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        email: formValue.email
      };
      this.userService.updateUser(formValue.id, updateData).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Usuario actualizado' });
          this.userDialog.set(false);
          this.loadUsers({ first: 0, rows: 10 });
        },
        error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al actualizar usuario' })
      });
    } else {
      this.authService.register(formValue).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Usuario creado' });
          this.userDialog.set(false);
          this.loadUsers({ first: 0, rows: 10 });
        },
        error: (err) => {
          let errorDetail = 'Error al crear usuario';
          if (err.error?.message) {
            errorDetail = Array.isArray(err.error.message) ? err.error.message[0] : err.error.message;
          }
          this.messageService.add({ severity: 'error', summary: 'Error', detail: errorDetail });
        }
      });
    }
  }
}
