import { Component } from '@angular/core';
import { SharedModule } from '../../shared/shared/shared.module';
import { PlaybackControlsComponent } from './playback-controls/playback-controls.component';

@Component({
  selector: 'app-toolbar',
  imports: [SharedModule, PlaybackControlsComponent],
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss'],
})
export class ToolbarComponent { }
