import { Injectable, signal } from '@angular/core';
import * as pako from 'pako';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

export interface ModelProcessingState {
  isLoading: boolean;
  progress: number; // 0-100
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class ModelProcessorService {
  // Public state signals that components can subscribe to
  private _state = signal<ModelProcessingState>({
    isLoading: false,
    progress: 0,
    error: null
  });

  // Expose the state as a readonly signal
  public state = this._state.asReadonly();

  constructor() { }

  /**
   * Updates the processing state
   */
  private updateState(state: Partial<ModelProcessingState>): void {
    this._state.update(currentState => ({
      ...currentState,
      ...state
    }));
  }

  /**
   * Resets the processing state
   */
  private resetState(): void {
    this.updateState({
      isLoading: false,
      progress: 0,
      error: null
    });
  }

  /**
   * Decompresses binary data that may be compressed with gzip/zlib
   * @param data The compressed binary data
   * @returns Decompressed data or original data if decompression fails
   */
  private decompressData(data: Uint8Array): Uint8Array {
    try {
      // Try gzip decompression first
      const decompressedData = pako.inflate(data);
      console.log('Successfully decompressed with pako.inflate (gzip)');
      return decompressedData;
    } catch (error) {
      console.warn('Failed to decompress with pako.inflate, trying pako.ungzip', error);
      try {
        // Try raw deflate
        const decompressedData = pako.ungzip(data);
        console.log('Successfully decompressed with pako.ungzip');
        return decompressedData;
      } catch (error2) {
        console.warn('Failed to decompress with pako.ungzip, using original data', error2);
        // If both decompression methods fail, use the original data
        return data;
      }
    }
  }

  /**
   * Converts a Uint8Array to a string
   * @param data The binary data to convert
   * @returns String representation of the data
   */
  private uint8ArrayToString(data: Uint8Array): string {
    return new TextDecoder().decode(data);
  }

  /**
   * Processes binary model data, decompresses it, and returns the OBJ string
   * @param data The binary model data
   * @returns Promise that resolves with OBJ format string or rejects with error
   */
  processModelData(data: Uint8Array): Promise<string> {
    // Reset and start loading state
    this.resetState();
    this.updateState({ isLoading: true, progress: 10 });

    return new Promise((resolve, reject) => {
      try {
        // Simulate async processing
        setTimeout(() => {
          try {
            // Update progress
            this.updateState({ progress: 30 });
            
            // Decompress the data
            const decompressedData = this.decompressData(data);
            console.log('Decompressed data length:', decompressedData.length);
            
            // Update progress
            this.updateState({ progress: 60 });
            
            // Convert to string
            const objString = this.uint8ArrayToString(decompressedData);
            
            // Update progress
            this.updateState({ progress: 80 });
            
            // Validate if it's a proper OBJ format
            if (objString.includes('v ') && (objString.includes('f ') || objString.includes('vn '))) {
              console.log('Valid OBJ format detected');
              
              // Complete the loading
              this.updateState({ isLoading: false, progress: 100 });
              resolve(objString);
            } else {
              console.warn('The data does not appear to be in OBJ format');
              const error = 'Invalid OBJ format';
              this.updateState({ isLoading: false, error });
              reject(new Error(error));
            }
          } catch (error) {
            console.error('Error processing model data:', error);
            this.updateState({ 
              isLoading: false, 
              error: error instanceof Error ? error.message : 'Unknown error' 
            });
            reject(error);
          }
        }, 10); // Small timeout to make it asynchronous
      } catch (error) {
        console.error('Error in processModelData:', error);
        this.updateState({ 
          isLoading: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
        reject(error);
      }
    });
  }

  /**
   * Loads an OBJ model from a string and adds it to the scene
   * @param objString The OBJ format string
   * @param scene The THREE.Scene to add the model to
   * @returns Promise that resolves with the loaded model or rejects with an error
   */
  loadObjModel(objString: string, scene: THREE.Scene): Promise<THREE.Group> {
    // Start loading state for model loading
    this.updateState({ isLoading: true, progress: 0 });

    return new Promise((resolve, reject) => {
      // Create a blob from the OBJ string
      const blob = new Blob([objString], { type: 'text/plain' });
      const objectUrl = URL.createObjectURL(blob);

      // Create OBJ loader
      const loader = new OBJLoader();

      // Load the model
      loader.load(
        objectUrl,
        (object) => {
          console.log('OBJ model loaded successfully', object);
          
          // Update progress
          this.updateState({ progress: 80 });

          // Center the model
          const box = new THREE.Box3().setFromObject(object);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());

          // Normalize and center
          const maxDim = Math.max(size.x, size.y, size.z);
          const scale = 5 / maxDim;
          object.scale.set(scale, scale, scale);
          object.position.sub(center.multiplyScalar(scale));

          // Add to scene
          scene.add(object);

          // Clean up URL
          URL.revokeObjectURL(objectUrl);
          
          // Complete the loading
          this.updateState({ isLoading: false, progress: 100 });
          
          // Resolve with the loaded object
          resolve(object);
        },
        (xhr) => {
          // Progress callback
          if (xhr.lengthComputable) {
            const progress = Math.round((xhr.loaded / xhr.total) * 70); // Up to 70%
            this.updateState({ progress });
          }
        },
        (error) => {
          console.error('Error loading OBJ model:', error);
          URL.revokeObjectURL(objectUrl);
          this.updateState({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'Error loading model' 
          });
          reject(error);
        }
      );
    });
  }
}
