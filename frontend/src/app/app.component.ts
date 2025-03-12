import { Component, inject } from '@angular/core';
import { SharedModule } from './shared/shared/shared.module';
import { FileParserService } from './services/file-parser.service';
import { IoFile } from './core/models';
import { RobotStateService, SessionService } from './services';

@Component({
  selector: 'app-root',
  imports: [SharedModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'], // corrected styleUrl to styleUrls
})
export class AppComponent {
  title = 'ion-reader';

  fileParserService = inject(FileParserService);
  robotStateService = inject(RobotStateService);
  sessionService = inject(SessionService);

  interval!: number;

  onUpload(event: any) {
    // Check if we have files from the upload event
    if (event.files && event.files.length > 0) {
      const file = event.files[0]; // Get the first file

      // Create a FileReader to read the file content
      const reader = new FileReader();

      // Define what happens when the file is loaded
      reader.onload = (e: any) => {
        const fileContent = e.target.result as ArrayBuffer;
        console.log('File loaded, processing ION data...');

        this.fileParserService
          .parseIonData<IoFile>(fileContent)
          .then((data) => {
            data.metadata.botConfig
              ? this.robotStateService.setRobotConfig(data.metadata.botConfig)
              : null;
            data.metadata.botInfo
              ? this.robotStateService.setRobotInfo(data.metadata.botInfo)
              : null;
            data.metadata.sessionInfo
              ? this.sessionService.setSession(data.metadata.sessionInfo)
              : null;
          })
          .catch((error) => {
            console.error('Error parsing ION data:', error);
          });
      };

      // Handle errors
      reader.onerror = (error) => {
        console.error('Error reading file:', error);
      };

      // Read the file as binary data
      reader.readAsArrayBuffer(file);
    }
  }
}
