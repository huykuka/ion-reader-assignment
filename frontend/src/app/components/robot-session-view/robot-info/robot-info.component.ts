import { Component, computed, inject } from '@angular/core';
import { RobotStateService } from '../../../services';
import { SharedModule } from '../../../shared/shared/shared.module';

@Component({
  selector: 'app-robot-info',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './robot-info.component.html',
  styleUrls: ['./robot-info.component.scss']
})
export class RobotInfoComponent {
  robotStateService = inject(RobotStateService);

  infoArray = computed(() => {
    const info = this.robotStateService.getRobotInfo();
    // Convert object to array of {key, value} objects
    // Preserve arrays with multiple values
    return Object.entries(info || {}).map(([key, value]) => {
      return { 
        key, 
        value: Array.isArray(value) && value.length === 1 ? value[0] : value,
        isMultiValue: Array.isArray(value) && value.length > 1
      };
    });
  });
}
