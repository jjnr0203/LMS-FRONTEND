import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsersListComponent } from '../../users/users-list/users-list.component';

@Component({
  selector: 'app-hr-user-list',
  standalone: true,
  imports: [CommonModule, UsersListComponent],
  template: `
    <div class="fadein animation-duration-300">
      <app-users-list [mode]="'hr'"></app-users-list>
    </div>
  `
})
export class HrUserListComponent {
}
