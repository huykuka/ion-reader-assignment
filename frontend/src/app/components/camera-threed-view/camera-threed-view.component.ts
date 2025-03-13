import { Component } from '@angular/core';
import { CameraViewComponent } from './camera-view/camera-view.component';

@Component({
  selector: 'app-camera-threed-view',
  standalone: true,
  imports: [CameraViewComponent],
  templateUrl: './camera-threed-view.component.html',
  styleUrls: ['./camera-threed-view.component.scss'],
})
export class CameraThreedViewComponent {}
