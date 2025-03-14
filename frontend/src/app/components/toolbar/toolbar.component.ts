import { Component } from '@angular/core';
import { SharedModule } from '../../shared/shared/shared.module';
import { FileUploadComponent } from './file-upload/file-upload.component';
import { PlaybackControlsComponent } from './playback-controls/playback-controls.component';

@Component({
  selector: 'app-toolbar',
  imports: [SharedModule, FileUploadComponent, PlaybackControlsComponent],
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss'],
})
export class ToolbarComponent {}
