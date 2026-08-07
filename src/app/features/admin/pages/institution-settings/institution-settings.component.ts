import { Component, inject, signal, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { DividerModule } from 'primeng/divider';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { InstitutionService, InstitutionConfig } from '../../../../core/services/institution.service';

@Component({
  selector: 'app-institution-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ToastModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    DividerModule,
    ConfirmDialogModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './institution-settings.component.html',
  styleUrls: ['./institution-settings.component.scss'],
})
export class InstitutionSettingsComponent implements OnInit {
  private institutionService = inject(InstitutionService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  loading = signal(false);
  saving = signal(false);
  uploadingLogo = signal(false);
  deletingLogo = signal(false);
  currentLogoUrl = signal<string | null>(null);

  form: FormGroup = this.fb.group({
    name: [''],
    ruc: [''],
    slogan: [''],
    address: [''],
    phone: [''],
    mobile: [''],
    email: [''],
    website: [''],
  });

  ngOnInit(): void {
    this.loading.set(true);
    this.institutionService.getConfig().subscribe({
      next: (res) => {
        if (res.config) {
          this.form.patchValue({
            name: res.config.name ?? '',
            ruc: res.config.ruc ?? '',
            slogan: res.config.slogan ?? '',
            address: res.config.address ?? '',
            phone: res.config.phone ?? '',
            mobile: res.config.mobile ?? '',
            email: res.config.email ?? '',
            website: res.config.website ?? '',
          });
          this.currentLogoUrl.set(res.config.logoUrl ?? null);
        }
        this.loading.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading.set(false);
        this.cdr.markForCheck();
      },
    });
  }

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];
    this.uploadingLogo.set(true);
    this.institutionService.uploadLogo(file).subscribe({
      next: (res) => {
        this.currentLogoUrl.set(res.logoUrl);
        this.uploadingLogo.set(false);
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Logo actualizado correctamente' });
        this.cdr.markForCheck();
      },
      error: () => {
        this.uploadingLogo.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo subir el logo' });
        this.cdr.markForCheck();
      },
    });
  }

  save(): void {
    this.saving.set(true);
    const data: Partial<InstitutionConfig> = this.form.value;
    this.institutionService.updateConfig(data).subscribe({
      next: () => {
        this.saving.set(false);
        this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Configuración actualizada exitosamente' });
        this.cdr.markForCheck();
      },
      error: () => {
        this.saving.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar la configuración' });
        this.cdr.markForCheck();
      },
    });
  }

  onDeleteLogo(event: Event): void {
    event.stopPropagation();
    this.confirmationService.confirm({
      message: '¿Estás seguro de que deseas eliminar el logo de la institución?',
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.deletingLogo.set(true);
        // Actualizamos la configuración con logoUrl en null/vacío
        this.institutionService.updateConfig({ logoUrl: '' }).subscribe({
          next: () => {
            this.currentLogoUrl.set(null);
            this.deletingLogo.set(false);
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Logo eliminado correctamente' });
            this.cdr.markForCheck();
          },
          error: () => {
            this.deletingLogo.set(false);
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el logo' });
            this.cdr.markForCheck();
          }
        });
      }
    });
  }
}
