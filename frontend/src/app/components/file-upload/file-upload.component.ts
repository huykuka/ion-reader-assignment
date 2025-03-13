import { Component, inject } from '@angular/core';
import { SharedModule } from '../../shared/shared/shared.module';
import { RobotStateService, SessionService } from '../../services';
import { FileParserService } from '../../services/actions/file-parser.service';
import { IoFile } from '../../core/models';
import { TopicService } from '../../services/state/topic.service';

@Component({
  selector: 'app-file-upload',
  imports: [SharedModule],
  templateUrl: './file-upload.component.html',
  styleUrl: './file-upload.component.scss',
})
export class FileUploadComponent {
  fileParserService = inject(FileParserService);
  robotStateService = inject(RobotStateService);
  sessionService = inject(SessionService);
  topicService = inject(TopicService);

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
          .parseIonData(fileContent)
          .then((data) => {
            this.extractDataToState(data);
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

  private extractDataToState(data: IoFile) {
    const { botConfig, botInfo, sessionInfo } = data.metadata;
    const { topics } = data;
    botConfig ? this.robotStateService.setRobotConfig(botConfig) : null;
    botInfo ? this.robotStateService.setRobotInfo(botInfo) : null;
    sessionInfo ? this.sessionService.setSession(sessionInfo) : null;
    topics ? this.topicService.setTopics(topics) : null;
  }
}
