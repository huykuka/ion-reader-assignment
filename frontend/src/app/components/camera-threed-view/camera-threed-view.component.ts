import { Component } from '@angular/core';
import { CameraViewComponent } from './camera-view/camera-view.component';
import { SharedModule } from '../../shared/shared/shared.module';
import { ThreedViewComponent } from "./threed-view/threed-view.component";

@Component({
  selector: 'app-camera-threed-view',
  standalone: true,
  imports: [CameraViewComponent, SharedModule, ThreedViewComponent],
  templateUrl: './camera-threed-view.component.html',
  styleUrls: ['./camera-threed-view.component.scss'],
})
export class CameraThreedViewComponent { }
