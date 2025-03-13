import { Component } from '@angular/core';
import { SharedModule } from './shared/shared/shared.module';
import { FileUploadComponent } from './components/file-upload/file-upload.component';
import { RobotSessionViewComponent } from './components/robot-session-view/robot-session-view.component';
import { LogManagementComponent } from './components/log-management/log-management.component';

@Component({
  selector: 'app-root',
  imports: [
    SharedModule,
    FileUploadComponent,
    RobotSessionViewComponent,
    LogManagementComponent,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'], // corrected styleUrl to styleUrls
})
export class AppComponent {
  title = 'ion-reader';
}
