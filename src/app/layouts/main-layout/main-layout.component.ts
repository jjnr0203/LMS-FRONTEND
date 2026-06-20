import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './sidebar.component';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, SidebarComponent],
  template: `
    <div class="layout">
      <div class="layout-body">
        <app-sidebar />
        <main class="layout-content">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: [
    `
      .layout {
        display: flex;
        flex-direction: column;
        height: 100vh;
        background: #f1f5f9;
      }
      .layout-body {
        display: flex;
        flex: 1;
        overflow: hidden;
      }
      .layout-content {
        flex: 1;
        padding: 1.5rem;
        overflow-y: auto;
      }
    `,
  ],
})
export class MainLayoutComponent {}
