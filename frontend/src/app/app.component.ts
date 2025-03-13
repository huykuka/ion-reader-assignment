import { Component } from '@angular/core';
import { SharedModule } from './shared/shared/shared.module';
import { RobotSessionViewComponent } from './components/robot-session-view/robot-session-view.component';
import { LogManagementComponent } from './components/log-management/log-management.component';
import { ToolbarComponent } from './components/toolbar/toolbar.component';
import { CameraThreedViewComponent } from './components/camera-threed-view/camera-threed-view.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    SharedModule,
    ToolbarComponent,
    RobotSessionViewComponent,
    LogManagementComponent,
    CameraThreedViewComponent,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'], // corrected styleUrl to styleUrls
})
export class AppComponent {
  title = 'ion-reader';
}
