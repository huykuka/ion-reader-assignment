import { Component, inject } from '@angular/core';
import { SharedModule } from '../../../shared/shared/shared.module';
import { RobotStateService, SessionService } from '../../../services';
import { FileParserService } from '../../../services/actions/file-parser.service';
import { IoFile } from '../../../core/models';
import { TopicService } from '../../../services/state/topic.service';
import { PlaybackService } from '../../../services/actions/playback.service';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-file-upload',
  imports: [SharedModule],
  templateUrl: './file-upload.component.html',
  styleUrl: './file-upload.component.scss',
  providers: [MessageService]
})
export class FileUploadComponent {
  fileParserService = inject(FileParserService);
  robotStateService = inject(RobotStateService);
  sessionService = inject(SessionService);
  topicService = inject(TopicService);
  playbackService = inject(PlaybackService);
  messageService = inject(MessageService);

  interval!: number;
  isUploading = false;

  async onUpload(event: any) {
    // Check if we have files from the upload event
    if (event.files && event.files.length > 0) {
      const file = event.files[0]; // Get the first file
      this.isUploading = true;

      try {
        // If playback is active, handle it gracefully
        await this.playbackService.handleNewFileUpload();

        // Create a FileReader to read the file content
        const fileContent = await this.readFileAsArrayBuffer(file);

        // Parse the file data
        const data = await this.fileParserService.parseIonData(fileContent);

        // Extract data to state
        this.extractDataToState(data);

        // Show success message
        this.messageService.add({
          severity: 'success',
          summary: 'File Loaded',
          detail: `Successfully loaded ${file.name}`,
          life: 3000
        });
      } catch (error) {
        console.error('Error processing file:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to process the file. Please try again.',
          life: 5000
        });
      } finally {
        this.isUploading = false;
      }
    }
  }

  /**
   * Read file as ArrayBuffer using Promise
   */
  private readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e: any) => {
        resolve(e.target.result as ArrayBuffer);
      };

      reader.onerror = (error) => {
        console.error('Error reading file:', error);
        reject(error);
      };

      reader.readAsArrayBuffer(file);
    });
  }

  private extractDataToState(data: IoFile) {
    const { botConfig, botInfo, sessionInfo, botModel, compressedTypes } = data.metadata;
    const { topics } = data;
    botConfig ? this.robotStateService.setRobotConfig(botConfig) : null;
    botInfo ? this.robotStateService.setRobotInfo(botInfo) : null;
    sessionInfo ? this.sessionService.setSession(sessionInfo) : null;
    topics ? this.topicService.setTopics(topics) : null;
    botModel ? this.robotStateService.set('botModel', botModel) : null;
    compressedTypes ? this.robotStateService.set('compressedTypes', compressedTypes) : null;
  }
}
