import { Component } from '@angular/core';
import { SharedModule } from './shared/shared/shared.module';
import * as ion from 'ion-js';

@Component({
  selector: 'app-root',
  imports: [SharedModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'], // corrected styleUrl to styleUrls
})
export class AppComponent {
  title = 'ion-reader';

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

        try {
          // Parse the ION data
          const ionReader = ion.makeReader(new Uint8Array(fileContent));
          const result = ion.load(ionReader) as any;
          console.log('Parsed ION data:', result);
        } catch (error) {
          console.error('Error parsing ION data:', error);
        }
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
