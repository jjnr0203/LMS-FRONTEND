import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
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
import { CardModule } from 'primeng/card';
import { CreateUserComponent } from '../../admin/create-user/create-user.component';
import { MultiSelectModule } from 'primeng/multiselect';
import { AcademicService } from '../../../core/services/academic.service';

@Component({
  selector: 'app-users-list',
  imports: [
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
    CardModule,
    CreateUserComponent,
    MultiSelectModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './users-list.component.html',
  styleUrl: './users-list.component.scss',
})
export class UsersListComponent implements OnInit, OnDestroy {
  private userService = inject(UserService);
  private route = inject(ActivatedRoute);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private formBuilder = inject(FormBuilder);
  private academicService = inject(AcademicService);

  users = signal<User[]>([]);
  totalRecords = signal(0);
  loading = signal(false);
  faculties = signal<any[]>([]);

  roleFilter: string = '';
  isStudentList = false;

  selectedRole: string | null = null;
  roleOptions = [
    { label: 'Administrador', value: 'admin' },
    { label: 'Coordinador', value: 'coordinator' },
    { label: 'Docente', value: 'teacher' },
    { label: 'Estudiante', value: 'student' },
    { label: 'Tesorería', value: 'treasury' },
    { label: 'Secretaría', value: 'secretary' },
  ];

  searchQuery = '';
  searchSubject = new Subject<string>();
  searchSubscription!: Subscription;

  createDialogVisible = false;
  editDialogVisible = false;
  selectedUserId: string | null = null;
  selectedUserRoleName: string | null = null;

  editForm = this.formBuilder.group({
    id: [{ value: '', disabled: true }],
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    birthDate: [''],
    facultyIds: [[] as string[]],
  });

  ngOnInit() {
    this.academicService.getFaculties().subscribe({
      next: (data) => this.faculties.set(data),
      error: (err) => console.error('Error loading faculties', err),
    });
    this.roleFilter = this.route.snapshot.data['roleFilter'] || '';
    this.isStudentList = this.roleFilter === 'student';

    this.route.queryParams.subscribe(params => {
      if (params['role']) {
        this.selectedRole = params['role'];
      }
      this.loadUsers(1, 10);
    });

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
    this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Usuario creado correctamente' });
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
      case 'secretary':
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
      case 'secretary': return 'Secretaría';
      default: return roleName;
    }
  }

  openEditDialog(user: User) {
    this.selectedUserId = user.id;
    this.selectedUserRoleName = user.roleName || null;
    this.editForm.patchValue({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone || '',
      birthDate: user.birthDate ? new Date(user.birthDate).toISOString().split('T')[0] : '',
      facultyIds: user.faculties ? user.faculties.map((f: any) => f.id) : [],
    });
    this.editDialogVisible = true;
  }

  onSaveEdit() {
    if (this.editForm.invalid || !this.selectedUserId) return;
    this.loading.set(true);
    const payload: Partial<User> = { ...this.editForm.value } as Partial<User>;
    if (!payload.birthDate) {
      delete payload.birthDate;
    }
    delete payload.id;
    
    this.userService.updateUser(this.selectedUserId, payload).subscribe({
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





