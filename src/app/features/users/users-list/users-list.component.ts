import { Component, inject, OnInit, OnDestroy, signal, input, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';
import { UserService } from '../../../core/services/user.service';
import { HumanResourcesService } from '../../../core/services/human-resources.service';
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
import { HrCreateUserComponent } from '../../human-resources/create-user/hr-create-user.component';
import { MultiSelectModule } from 'primeng/multiselect';
import { AcademicService } from '../../../core/services/academic.service';
import { TeacherService } from '../../../core/services/teacher.service';
import { TabsModule } from 'primeng/tabs';
import { TooltipModule } from 'primeng/tooltip';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';

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
    HrCreateUserComponent,
    MultiSelectModule,
    TabsModule,
    TooltipModule,
    MenuModule,
    DatePipe,
    CommonModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './users-list.component.html',
  styleUrl: './users-list.component.scss',
})
export class UsersListComponent implements OnInit, OnDestroy {
  private userService = inject(UserService);
  private hrService = inject(HumanResourcesService);
  private route = inject(ActivatedRoute);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private formBuilder = inject(FormBuilder);
  private academicService = inject(AcademicService);
  private teacherService = inject(TeacherService);
  private cdr = inject(ChangeDetectorRef);

  users = signal<User[]>([]);
  totalRecords = signal(0);
  loading = signal(false);
  faculties = signal<any[]>([]);
  
  displayProfileModal = signal(false);
  selectedUser: any = null;
  teacherStats = signal<{ totalHours: number; careers: any[]; subjects: any[] } | null>(null);
  showCareersModal = signal(false);
  showSubjectsModal = signal(false);
  activeTab: string = '0';
  
  menuItems: MenuItem[] = [];
  selectedUserForMenu: any = null;

  @ViewChild('cvInput') cvInput!: ElementRef<HTMLInputElement>;
  @ViewChild('certInput') certInput!: ElementRef<HTMLInputElement>;

  isUploadingCv = signal(false);
  isUploadingCert = signal(false);

  private cvMenuCache = new Map<string, MenuItem[]>();
  private certMenuCache = new Map<string, MenuItem[]>();

  mode = input<'admin' | 'hr'>('admin');
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
  profileModalVisible = false;
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

  contactForm = this.formBuilder.group({
    address: [''],
    linkedIn: ['']
  });
  isEditingAddress = signal(false);
  isEditingLinkedIn = signal(false);
  savingContact = signal(false);

  addressMenu = [
    {
      label: 'Editar',
      icon: 'pi pi-pencil',
      command: () => {
        this.isEditingAddress.set(true);
      }
    }
  ];

  linkedInMenu = [
    {
      label: 'Editar',
      icon: 'pi pi-pencil',
      command: () => {
        this.isEditingLinkedIn.set(true);
      }
    }
  ];

  ngOnInit() {
    this.academicService.getFaculties().subscribe({
      next: (data) => this.faculties.set(data),
      error: (err) => console.error('Error loading faculties', err),
    });

    if (this.mode() === 'hr') {
      this.roleOptions = [
        { label: 'Coordinador', value: 'coordinator' },
        { label: 'Docente', value: 'teacher' },
        { label: 'Tesorería', value: 'treasury' },
        { label: 'Secretaría', value: 'secretary' },
      ];
    } else {
      this.roleOptions = [
        { label: 'Administrador', value: 'admin' },
        { label: 'Recursos Humanos', value: 'human_resources' },
        { label: 'Coordinador', value: 'coordinator' },
        { label: 'Docente', value: 'teacher' },
        { label: 'Estudiante', value: 'student' },
        { label: 'Tesorería', value: 'treasury' },
        { label: 'Secretaría', value: 'secretary' },
      ];
    }

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
    const req = this.mode() === 'hr'
      ? this.hrService.getStaff({ page, limit, role: roleToFilter, search: this.searchQuery })
      : this.userService.getUsers(page, limit, roleToFilter, this.searchQuery);

    req.subscribe({
      next: (res: any) => {
        this.users.set(res.data);
        this.totalRecords.set(res.total ?? res.pagination?.total ?? 0);
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

  closeProfileModal() {
    this.displayProfileModal.set(false);
    this.profileModalVisible = false;
    this.selectedUser = null;
    this.teacherStats.set(null);
  }

  openCareersList() {
    this.showCareersModal.set(true);
  }

  openSubjectsList() {
    this.showSubjectsModal.set(true);
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
      case 'human_resources':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  // --- Document Upload / HR Methods ---
  triggerCvUpload() {
    this.cvInput.nativeElement.click();
  }

  onCvFileSelected(event: Event) {
    if (!this.selectedUser) return;
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.isUploadingCv.set(true);
      this.hrService.uploadUserCv(this.selectedUser.id, file).subscribe({
        next: (res) => {
          this.selectedUser.cvUrl = res.cvUrl;
          this.isUploadingCv.set(false);
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Hoja de vida subida' });
        },
        error: () => {
          this.isUploadingCv.set(false);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo subir la hoja de vida' });
        }
      });
    }
  }

  triggerCertUpload() {
    this.certInput.nativeElement.click();
  }

  onCertFileSelected(event: Event) {
    if (!this.selectedUser) return;
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.isUploadingCert.set(true);
      this.hrService.uploadUserCertificate(this.selectedUser.id, file).subscribe({
        next: (res) => {
          if (!this.selectedUser.certificates) this.selectedUser.certificates = [];
          this.selectedUser.certificates.push(res.certificateUrl);
          this.isUploadingCert.set(false);
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Certificado subido' });
        },
        error: () => {
          this.isUploadingCert.set(false);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo subir el certificado' });
        }
      });
    }
  }

  getCvMenu(cvUrl: string): MenuItem[] {
    if (this.cvMenuCache.has(cvUrl)) {
      return this.cvMenuCache.get(cvUrl)!;
    }
    const menu: MenuItem[] = [
      {
        label: 'Ver Documento',
        icon: 'pi pi-eye',
        command: () => window.open(cvUrl, '_blank')
      },
      {
        label: 'Eliminar',
        icon: 'pi pi-trash',
        command: () => this.onDeleteCv()
      }
    ];
    this.cvMenuCache.set(cvUrl, menu);
    return menu;
  }

  getCertMenu(certUrl: string): MenuItem[] {
    if (this.certMenuCache.has(certUrl)) {
      return this.certMenuCache.get(certUrl)!;
    }
    const menu = [
      {
        label: 'Ver Documento',
        icon: 'pi pi-eye',
        command: () => window.open(certUrl, '_blank')
      },
      {
        label: 'Eliminar',
        icon: 'pi pi-trash',
        command: () => this.onDeleteCert(certUrl)
      }
    ];
    this.certMenuCache.set(certUrl, menu);
    return menu;
  }

  private onDeleteCv() {
    if (!this.selectedUser) return;
    this.confirmationService.confirm({
      message: '¿Estás seguro de que quieres eliminar la hoja de vida de este usuario?',
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.hrService.deleteUserCv(this.selectedUser.id).subscribe({
          next: () => {
            this.selectedUser.cvUrl = null;
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Hoja de vida eliminada' });
          },
          error: () => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar' });
          }
        });
      }
    });
  }

  private onDeleteCert(certUrl: string) {
    if (!this.selectedUser) return;
    this.confirmationService.confirm({
      message: '¿Estás seguro de que quieres eliminar este certificado?',
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.hrService.deleteUserCertificate(this.selectedUser.id, certUrl).subscribe({
          next: () => {
            this.selectedUser.certificates = this.selectedUser.certificates.filter((c: string) => c !== certUrl);
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Certificado eliminado' });
          },
          error: () => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar' });
          }
        });
      }
    });
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
      case 'human_resources': return 'Recursos Humanos';
      default: return roleName;
    }
  }

  calculateAge(birthDate: string | Date | undefined): number | null {
    if (!birthDate) return null;
    const today = new Date();
    const birthDateObj = new Date(birthDate);
    let age = today.getFullYear() - birthDateObj.getFullYear();
    const m = today.getMonth() - birthDateObj.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDateObj.getDate())) {
      age--;
    }
    return age;
  }

  openEditDialog(user: User, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
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

  onSaveContact() {
    if (!this.selectedUser) return;
    this.savingContact.set(true);
    const updates = this.contactForm.value;
    
    this.userService.updateUser(this.selectedUser.id, updates as Partial<User>, this.selectedUser.roleName).subscribe({
      next: () => {
        this.selectedUser.address = updates.address;
        this.selectedUser.linkedIn = updates.linkedIn;
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Datos de contacto actualizados' });
        this.savingContact.set(false);
        this.isEditingAddress.set(false);
        this.isEditingLinkedIn.set(false);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar los datos' });
        this.savingContact.set(false);
      }
    });
  }

  onSaveEdit() {
    if (this.editForm.invalid || !this.selectedUserId) return;
    this.loading.set(true);
    const payload: Partial<User> = { ...this.editForm.value } as Partial<User>;
    if (!payload.birthDate) {
      delete payload.birthDate;
    }
    delete payload.id;
    
    this.userService.updateUser(this.selectedUserId, payload, this.selectedUserRoleName || this.selectedRole || '').subscribe({
      next: (res) => {
        this.users.update((users) =>
          users.map((u) => {
            if (u.id === this.selectedUserId) {
              const cleanedResUser = Object.fromEntries(Object.entries(res.user).filter(([_, v]) => v !== undefined));
              return { ...u, ...cleanedResUser };
            }
            return u;
          })
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

  confirmDelete(user: User, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.confirmationService.confirm({
      message: `¿Estás seguro que deseas eliminar a ${user.firstName} ${user.lastName}?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.loading.set(true);
        this.userService.deleteUser(user.id, user.roleName || this.selectedRole || '').subscribe({
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

  openProfileModal(user: any) {
    this.selectedUser = user;
    this.activeTab = '0'; // Reset to "Resumen" tab
    this.isEditingAddress.set(false);
    this.isEditingLinkedIn.set(false);
    this.contactForm.patchValue({
      address: user.address || '',
      linkedIn: user.linkedIn || ''
    });
    this.profileModalVisible = true;
    
    if (user.roleName === 'teacher' || user.roleName === 'Docente') {
      this.teacherStats.set(null);
      this.teacherService.getTeacherStats(user.id).subscribe({
        next: (stats) => this.teacherStats.set(stats),
        error: (err) => console.error('Error fetching teacher stats', err)
      });
    }

    this.userService.getUser(user.id).subscribe({
      next: (fullUser) => {
        if (this.selectedUser && this.selectedUser.id === fullUser.id) {
          this.selectedUser = { ...this.selectedUser, ...fullUser };
          this.cdr.markForCheck();
          this.cdr.detectChanges(); // Force UI update so image loads immediately
        }
      }
    });
  }

  viewCv(url: string) {
    window.open(url, '_blank');
  }

  getFileName(url: string, index: number): string {
    if (!url) return `Certificado ${index + 1}`;
    try {
      const parts = url.split('/');
      const lastPart = parts[parts.length - 1];
      const name = decodeURIComponent(lastPart.split('?')[0]);
      return name || `Certificado ${index + 1}`;
    } catch {
      return `Certificado ${index + 1}`;
    }
  }

  showMenu(event: Event, menu: any, user: any) {
    this.selectedUserForMenu = user;
    this.menuItems = [
      {
        label: 'Ver Perfil',
        icon: 'pi pi-eye',
        styleClass: 'action-view',
        command: () => this.openProfileModal(this.selectedUserForMenu)
      },
      {
        label: 'Editar',
        icon: 'pi pi-pencil',
        styleClass: 'action-edit',
        command: () => this.openEditDialog(this.selectedUserForMenu)
      },
      {
        separator: true
      },
      {
        label: 'Eliminar',
        icon: 'pi pi-trash',
        styleClass: 'action-delete',
        command: () => this.confirmDelete(this.selectedUserForMenu)
      }
    ];
    menu.toggle(event);
  }
}





