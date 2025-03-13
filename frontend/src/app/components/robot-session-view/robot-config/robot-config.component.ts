import { Component, computed, inject } from '@angular/core';
import { RobotStateService } from '../../../services';
import { SharedModule } from '../../../shared/shared/shared.module';

@Component({
  selector: 'app-robot-config',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './robot-config.component.html',
  styleUrl: './robot-config.component.scss',
})
export class RobotConfigComponent {
  robotStateService = inject(RobotStateService);

  configArray = computed(() => {
    const config = this.robotStateService.getRobotConfig();
    // Convert object to array of {key, value} objects
    // Preserve arrays with multiple values
    return Object.entries(config || {}).map(([key, value]) => {
      return {
        key,
        value: Array.isArray(value) && value.length === 1 ? value[0] : value,
        isMultiValue: Array.isArray(value) && value.length > 1,
      };
    });
  });
}
