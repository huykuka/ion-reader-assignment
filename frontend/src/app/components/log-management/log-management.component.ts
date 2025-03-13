import { Component } from '@angular/core';
import { TopicDropdownComponent } from './topic-dropdown/topic-dropdown.component';
import { TopicMessageViewerComponent } from './topic-message-viewer/topic-message-viewer.component';
import { LogConsoleComponent } from './log-console/log-console.component';
import { SharedModule } from '../../shared/shared/shared.module';

@Component({
  selector: 'app-log-management',
  standalone: true,
  imports: [
    TopicDropdownComponent,
    TopicMessageViewerComponent,
    LogConsoleComponent,
    SharedModule,
  ],
  templateUrl: './log-management.component.html',
  styleUrls: ['./log-management.component.scss'],
})
export class LogManagementComponent {}
