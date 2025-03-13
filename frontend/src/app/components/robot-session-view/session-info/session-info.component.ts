import { Component, computed, inject } from '@angular/core';
import { SessionService } from '../../../services';
import { SharedModule } from '../../../shared/shared/shared.module';

@Component({
  selector: 'app-session-info',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './session-info.component.html',
  styleUrls: ['./session-info.component.scss'],
})
export class SessionInfoComponent {
  sessionService = inject(SessionService);

  sessionArray = computed(() => {
    const session = this.sessionService.getSession();
    // Convert object to array of {key, value} objects
    // Preserve arrays with multiple values
    return Object.entries(session || {}).map(([key, value]) => {
      return {
        key,
        value: Array.isArray(value) && value.length === 1 ? value[0] : value,
        isMultiValue: Array.isArray(value) && value.length > 1,
      };
    });
  });
}
