import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ImageDecodingService {
  private worker: Worker | null = null;
  private taskId = 0;
  private taskCallbacks = new Map<number, { resolve: Function, reject: Function }>();

  constructor() {
    this.initWorker();
  }

  /**
   * Initializes the Web Worker for image processing
   */
  private initWorker(): void {
    if (typeof Worker !== 'undefined') {
      // Create a new worker
      this.worker = new Worker(new URL('../../../assets/image-decoder.worker.js', import.meta.url), { type: 'module' });
      
      // Set up the message handler
      this.worker.onmessage = (event) => {
        const { id, success, result, error } = event.data;
        const callbacks = this.taskCallbacks.get(id);
        
        if (callbacks) {
          if (success) {
            callbacks.resolve(result);
          } else {
            callbacks.reject(new Error(error));
          }
          this.taskCallbacks.delete(id);
        }
      };
      
      // Handle worker errors
      this.worker.onerror = (error) => {
        console.error('Worker error:', error);
        // Attempt to restart the worker
        this.terminateWorker();
        this.initWorker();
      };
    }
  }

  /**
   * Terminates the Web Worker
   */
  private terminateWorker(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }

  /**
   * Sends a task to the worker and returns a promise
   * @param action The action to perform
   * @param data The data to process
   * @returns A promise that resolves with the result
   */
  private sendToWorker<T>(action: string, data: any): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        // Fallback to synchronous processing if worker is not available
        reject(new Error('Web Worker is not available'));
        return;
      }
      
      const id = this.taskId++;
      this.taskCallbacks.set(id, { resolve, reject });
      
      this.worker.postMessage({ id, action, data });
    });
  }

  /**
   * Converts a string representation of image data to a JPEG Blob
   * @param data The string representation of image data (can be Python-style byte string, base64, or binary string)
   * @returns The JPEG image as a Blob
   */
  convertToBGR8JpegImage(data: string): Promise<Blob> {
    // If worker is not available, fall back to synchronous processing
    if (!this.worker) {
      return this.convertToBGR8JpegImageSync(data);
    }
    
    return new Promise(async (resolve, reject) => {
      try {
        let type: string;
        
        // Determine the type of data
        if (typeof data === 'string') {
          if (data.startsWith("b'") && data.endsWith("'")) {
            type = 'pythonByteString';
          } else {
            // Try to determine if it's base64
            try {
              atob(data); // This will throw if not valid base64
              type = 'base64';
            } catch (e) {
              type = 'raw';
            }
          }
        } else {
          reject(new Error('Data must be a string'));
          return;
        }
        
        // Send to worker for processing
        const arrayBuffer = await this.sendToWorker<ArrayBuffer>('createBlob', {
          data,
          type
        });
        
        // Create a Blob from the ArrayBuffer
        const blob = new Blob([arrayBuffer], { type: 'image/jpeg' });
        resolve(blob);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Synchronous fallback method for image conversion
   * @param data The string representation of image data
   * @returns A Promise that resolves with the Blob
   */
  private convertToBGR8JpegImageSync(data: string): Promise<Blob> {
    return new Promise((resolve, reject) => {
      try {
        let binaryData: Uint8Array;
        
        if (typeof data === 'string') {
          if (data.startsWith("b'") && data.endsWith("'")) {
            // Handle Python-style byte string (b'...)
            binaryData = this.parsePythonByteString(data);
          } else {
            // Try to handle as base64
            try {
              const binaryString = atob(data);
              binaryData = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                binaryData[i] = binaryString.charCodeAt(i);
              }
            } catch (e) {
              // If not base64, treat as regular string
              binaryData = new TextEncoder().encode(data);
            }
          }
        } else {
          reject(new Error('Data must be a string'));
          return;
        }

        // Create a Blob and resolve
        const blob = new Blob([binaryData], { type: "image/jpeg" });
        resolve(blob);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Parses a Python-style byte string (e.g., b'\xff\xd8\xff\xe0...') into a Uint8Array
   * @param pythonByteString The Python byte string to parse
   * @returns A Uint8Array containing the binary data
   */
  private parsePythonByteString(pythonByteString: string): Uint8Array {
    // Remove the b' prefix and ' suffix
    const content = pythonByteString.slice(2, -1);

    // Use a regular expression to match all escape sequences
    const bytes: number[] = [];
    let i = 0;

    while (i < content.length) {
      if (content.substr(i, 2) === '\\x') {
        // Hex escape sequence (\xFF)
        const hex = content.substr(i + 2, 2);
        bytes.push(parseInt(hex, 16));
        i += 4;
      } else if (content.substr(i, 2) === '\\\\') {
        // Escaped backslash (\\)
        bytes.push(92); // ASCII for backslash
        i += 2;
      } else if (content.substr(i, 2) === "\\'") {
        // Escaped single quote (')
        bytes.push(39); // ASCII for single quote
        i += 2;
      } else if (content.substr(i, 2) === '\\n') {
        // Newline
        bytes.push(10); // ASCII for newline
        i += 2;
      } else if (content.substr(i, 2) === '\\r') {
        // Carriage return
        bytes.push(13); // ASCII for carriage return
        i += 2;
      } else if (content.substr(i, 2) === '\\t') {
        // Tab
        bytes.push(9); // ASCII for tab
        i += 2;
      } else if (content[i] === '\\') {
        // Other escape sequence
        bytes.push(content.charCodeAt(i + 1));
        i += 2;
      } else {
        // Regular character
        bytes.push(content.charCodeAt(i));
        i += 1;
      }
    }

    return new Uint8Array(bytes);
  }
}
