import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
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
import { ViewChild } from '@angular/core';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule, TableModule, ButtonModule, DialogModule,
    InputTextModule, SelectModule, PasswordModule, ToastModule, ConfirmDialogModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.scss']
})
export class UsersListComponent implements OnInit {
  @ViewChild('dt') dt!: Table;

  users: User[] = [];
  totalRecords: number = 0;
  loading: boolean = true;
  
  userDialog: boolean = false;
  userForm!: FormGroup;
  isEditMode: boolean = false;
  
  roles = [
    { label: 'Administrador', value: 'admin' },
    { label: 'Estudiante', value: 'student' },
    { label: 'Profesor', value: 'professor' }
  ];

  filterRoles = [
    { label: 'Todos', value: null },
    ...this.roles
  ];
  selectedRoleFilter: string | undefined = undefined;

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private fb: FormBuilder,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.initForm();
    // p-table con [lazy]="true" ya dispara (onLazyLoad) automáticamente al iniciar
  }

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
    this.loading = true;
    const page = event.first ? (event.first / event.rows) + 1 : 1;
    const limit = event.rows || 10;
    
    this.userService.getUsers(page, limit, this.selectedRoleFilter).subscribe({
      next: (res) => {
        this.users = res.data;
        this.totalRecords = res.pagination.total;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los usuarios' });
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onRoleFilterChange(event: any) {
    this.selectedRoleFilter = event.value;
    if (this.dt) {
      this.dt.reset(); // Vuelve a la página 1 y dispara loadUsers
    }
  }

  openNew() {
    this.isEditMode = false;
    this.userForm.reset();
    this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.userForm.get('password')?.updateValueAndValidity();
    this.userForm.get('password')?.enable();
    this.userForm.get('roleName')?.enable();
    this.userForm.get('id')?.enable(); // Can edit ID on create
    this.userDialog = true;
  }

  editUser(user: User) {
    this.isEditMode = true;
    this.userForm.reset({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      roleName: user.role
    });
    this.userForm.get('password')?.clearValidators();
    this.userForm.get('password')?.updateValueAndValidity();
    this.userForm.get('password')?.disable(); // Prevent validation
    this.userForm.get('roleName')?.disable(); // Prevent validation
    this.userForm.get('id')?.disable(); // Prevent changing cedula
    this.userDialog = true;
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
    this.userDialog = false;
  }

  saveUser() {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    const formValue = this.userForm.getRawValue();

    if (this.isEditMode) {
      const updateData = {
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        email: formValue.email
      };
      this.userService.updateUser(formValue.id, updateData).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Usuario actualizado' });
          this.userDialog = false;
          this.loadUsers({ first: 0, rows: 10 });
        },
        error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al actualizar usuario' })
      });
    } else {
      this.authService.register(formValue).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Usuario creado' });
          this.userDialog = false;
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
