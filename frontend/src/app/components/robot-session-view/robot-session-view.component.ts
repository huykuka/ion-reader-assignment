import { Component } from '@angular/core';
import { RobotConfigComponent } from './robot-config/robot-config.component';
import { RobotInfoComponent } from './robot-info/robot-info.component';
import { SharedModule } from '../../shared/shared/shared.module';
import { SessionInfoComponent } from './session-info/session-info.component';

@Component({
  selector: 'app-robot-session-view',
  imports: [
    SharedModule,
    RobotConfigComponent,
    RobotInfoComponent,
    SessionInfoComponent,
  ],
  templateUrl: './robot-session-view.component.html',
  styleUrl: './robot-session-view.component.scss',
})
export class RobotSessionViewComponent {}
