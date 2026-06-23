import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabsModule } from 'primeng/tabs';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';

import { AcademicTerms } from './academic-terms/academic-terms';
import { Modalities } from './modalities/modalities';
import { Careers } from './careers/careers';
import { Subjects } from './subjects/subjects';

@Component({
  selector: 'app-academic-management',
  standalone: true,
  imports: [
    CommonModule,
    TabsModule,
    AcademicTerms,
    Modalities,
    Careers,
    Subjects,
    ToastModule,
    ConfirmDialogModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './academic-management.html',
  styleUrl: './academic-management.scss',
})
export class AcademicManagement {
  activeTab = 'terms';
}
