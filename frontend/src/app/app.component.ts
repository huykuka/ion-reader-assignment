import { Component } from '@angular/core';
import { SharedModule } from './shared/shared/shared.module';
import { RobotSessionViewComponent } from './components/robot-session-view/robot-session-view.component';
import { LogManagementComponent } from './components/log-management/log-management.component';
import { ToolbarComponent } from './components/toolbar/toolbar.component';

@Component({
  selector: 'app-root',
  imports: [
    SharedModule,
    ToolbarComponent,
    RobotSessionViewComponent,
    LogManagementComponent,
    ToolbarComponent,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'], // corrected styleUrl to styleUrls
})
export class AppComponent {
  title = 'ion-reader';
}
