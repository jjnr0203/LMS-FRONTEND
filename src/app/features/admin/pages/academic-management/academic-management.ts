import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabsModule } from 'primeng/tabs';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';

import { AcademicTerms } from './academic-terms/academic-terms';
import { Modalities } from './modalities/modalities';
import { Careers } from './careers/careers';
import { Faculties } from './faculties/faculties';
import { ActivatedRoute, Router } from '@angular/router';
import { OnInit, inject } from '@angular/core';

@Component({
  selector: 'app-academic-management',
  standalone: true,
  imports: [
    CommonModule,
    TabsModule,
    AcademicTerms,
    Modalities,
    Careers,
    Faculties,
    ToastModule,
    ConfirmDialogModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './academic-management.html',
  styleUrl: './academic-management.scss',
})
export class AcademicManagement implements OnInit {
  activeTab: string | number | undefined = '0';
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['tab']) {
        switch (params['tab']) {
          case 'terms': this.activeTab = '0'; break;
          case 'modalities': this.activeTab = '1'; break;
          case 'careers': this.activeTab = '2'; break;
          case 'subjects': this.activeTab = '2'; break;
          case 'faculties': this.activeTab = '3'; break;
        }
      }
    });
  }
  
  onTabChange(value: string | number | undefined) {
    if (value === undefined) return;
    let tabStr = 'terms';
    switch (value.toString()) {
      case '0': tabStr = 'terms'; break;
      case '1': tabStr = 'modalities'; break;
      case '2': tabStr = 'careers'; break;
      case '3': tabStr = 'faculties'; break;
    }
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: tabStr },
      queryParamsHandling: 'merge'
    });
  }
}
