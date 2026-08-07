import { Component, inject, signal, OnInit } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { User } from '../../core/models';
import { MessageService } from 'primeng/api';
import { CardModule } from 'primeng/card';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DividerModule } from 'primeng/divider';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MenuItem } from 'primeng/api';
import { MenuModule } from 'primeng/menu';
import { MessageModule } from 'primeng/message';

@Component({
  selector: 'app-profile',
  imports: [
    CardModule,
    AvatarModule,
    ButtonModule,
    ToastModule,
    InputTextModule,
    ReactiveFormsModule,
    CommonModule,
    DividerModule,
    ConfirmDialogModule,
    MenuModule,
    MessageModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private router = inject(Router);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  user = signal<any | null>(null);
  initials = signal('');
  savingProfile = signal(false);
  loading = signal(true);
  uploadingCv = signal(false);
  uploadingCert = signal(false);
  deletingCv = signal(false);
  deletingAvatar = signal(false);
  isDragOver = signal(false);

  private formBuilder = inject(FormBuilder);
  profileForm = this.formBuilder.group({
    address: [''],
    linkedIn: ['']
  });

  ngOnInit() {
    this.authService.getProfile().subscribe({
      next: (u) => {
        this.user.set(u);
        this.profileForm.patchValue({
          address: (u as any).address || '',
          linkedIn: (u as any).linkedIn || ''
        });
        this.initials.set(
          ((u.firstName?.charAt(0) ?? '') + (u.lastName?.charAt(0) ?? '')).toUpperCase() || 'U',
        );
      },
    });
  }

  formatRoleName(role?: string): string {
    if (!role) return 'Desconocido';
    const roles: Record<string, string> = {
      admin: 'Administrador',
      human_resources: 'Recursos Humanos',
      treasury: 'Tesorería',
      coordinator: 'Coordinador',
      teacher: 'Docente',
      student: 'Estudiante'
    };
    return roles[role.toLowerCase()] || role;
  }

  getFileName(url: string, index: number): string {
    if (!url) return `Certificado #${index + 1}`;
    // Intentar extraer el nombre original si Cloudinary lo guardó así
    // Ej: https://res.cloudinary.com/.../Dylan_Cruz_CV.pdf
    const parts = url.split('/');
    const lastPart = parts[parts.length - 1];
    if (lastPart) {
      // Decode URI para reemplazar %20 por espacios
      return decodeURIComponent(lastPart);
    }
    return `Certificado #${index + 1}`;
  }

  private certMenuCache = new Map<string, MenuItem[]>();

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

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.userService.uploadAvatar(file).subscribe({
        next: (res) => {
          this.user.set(res.user);
          this.authService.getProfile().subscribe(); // Update global auth state
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Avatar actualizado' });
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el avatar' });
        }
      });
    }
  }

  onDeleteAvatar(event: Event) {
    event.stopPropagation();
    this.confirmationService.confirm({
      message: '¿Estás seguro de que deseas eliminar tu foto de perfil?',
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.deletingAvatar.set(true);
        this.userService.updateUser(this.user().id, { avatarUrl: '' } as any).subscribe({
          next: (res: any) => {
            this.user.set(res.user);
            this.authService.getProfile().subscribe(); // Update global auth state
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Foto eliminada correctamente' });
            this.deletingAvatar.set(false);
          },
          error: () => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar la foto' });
            this.deletingAvatar.set(false);
          }
        });
      }
    });
  }

  onSaveProfile() {
    if (!this.user()) return;
    this.savingProfile.set(true);
    const data = this.profileForm.value;
    const isTeacher = this.user().roleName === 'teacher';
    
    // Asumiendo que userService o teacherService tiene un update
    // Usaremos userService.update(...) que asume el endpoint correcto
    this.userService.updateUser(this.user().id, data as any).subscribe({
      next: (res: any) => {
        this.authService.getProfile().subscribe(u => this.user.set(u));
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Datos actualizados' });
        this.savingProfile.set(false);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar' });
        this.savingProfile.set(false);
      }
    });
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
    
    const file = event.dataTransfer?.files?.[0];
    if (file && file.type === 'application/pdf') {
      this.handleCvUpload(file);
    } else {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Por favor, sube solo archivos PDF' });
    }
  }

  onCvSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file && file.type === 'application/pdf') {
      this.handleCvUpload(file);
    } else if (file) {
      this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Solo se permiten archivos PDF' });
    }
  }

  private handleCvUpload(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'El archivo excede el tamaño máximo (5MB)' });
      return;
    }

    this.uploadingCv.set(true);
    this.userService.uploadCv(file).subscribe({
      next: (res: any) => {
        this.authService.getProfile().subscribe(u => this.user.set(u));
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'CV subido correctamente' });
        this.uploadingCv.set(false);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al subir el CV' });
        this.uploadingCv.set(false);
      }
    });
  }

  onDeleteCv() {
    this.confirmationService.confirm({
      message: '¿Estás seguro de que deseas eliminar tu hoja de vida?',
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.deletingCv.set(true);
        this.userService.deleteCv().subscribe({
          next: () => {
            this.authService.getProfile().subscribe(u => this.user.set(u));
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'CV eliminado correctamente' });
            this.deletingCv.set(false);
          },
          error: () => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el CV' });
            this.deletingCv.set(false);
          }
        });
      }
    });
  }

  onCertSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file && file.type === 'application/pdf') {
      this.uploadingCert.set(true);
      this.userService.uploadCertificate(file).subscribe({
        next: (res: any) => {
          this.authService.getProfile().subscribe(u => this.user.set(u));
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Certificado subido correctamente' });
          this.uploadingCert.set(false);
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al subir el certificado' });
          this.uploadingCert.set(false);
        }
      });
    } else if (file) {
      this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Solo se permiten archivos PDF' });
    }
  }

  onDeleteCert(certUrl: string) {
    this.confirmationService.confirm({
      message: '¿Estás seguro de que deseas eliminar este certificado?',
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.userService.deleteCertificate(certUrl).subscribe({
          next: () => {
            this.authService.getProfile().subscribe(u => this.user.set(u));
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Certificado eliminado' });
          },
          error: () => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el certificado' });
          }
        });
      }
    });
  }

  viewCv(url: string) {
    window.open(url, '_blank');
  }

  goChangePassword() {
    this.router.navigate(['/perfil/cambiar-password']);
  }
}
