import { Component } from '@angular/core';
import { TopicDropdownComponent } from './topic-dropdown/topic-dropdown.component';

@Component({
  selector: 'app-log-management',
  imports: [TopicDropdownComponent],
  templateUrl: './log-management.component.html',
  styleUrl: './log-management.component.scss',
})
export class LogManagementComponent {}
