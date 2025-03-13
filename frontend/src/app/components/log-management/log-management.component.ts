import { Component } from '@angular/core';
import { PlaybackControlsComponent } from './playback-controls/playback-controls.component';
import { TopicDropdownComponent } from './topic-dropdown/topic-dropdown.component';
import { TopicMessageViewerComponent } from './topic-message-viewer/topic-message-viewer.component';
import { SharedModule } from '../../shared/shared/shared.module';

@Component({
  selector: 'app-log-management',
  standalone: true,
  imports: [
    PlaybackControlsComponent,
    TopicDropdownComponent,
    TopicMessageViewerComponent,
    SharedModule,
  ],
  templateUrl: './log-management.component.html',
  styleUrls: ['./log-management.component.scss'],
})
export class LogManagementComponent {}
