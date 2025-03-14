import { Injectable } from '@angular/core';
import * as pako from 'pako';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

@Injectable({
  providedIn: 'root'
})
export class ModelProcessorService {

  constructor() { }

  /**
   * Decompresses binary data that may be compressed with gzip/zlib
   * @param data The compressed binary data
   * @returns Decompressed data or original data if decompression fails
   */
  decompressData(data: Uint8Array): Uint8Array {
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
  uint8ArrayToString(data: Uint8Array): string {
    return new TextDecoder().decode(data);
  }

  /**
   * Processes binary model data, decompresses it, and returns the OBJ string
   * @param data The binary model data
   * @returns OBJ format string or null if processing fails
   */
  processModelData(data: Uint8Array): string | null {
    try {
      // Decompress the data
      const decompressedData = this.decompressData(data);
      console.log('Decompressed data length:', decompressedData.length);

      // Convert to string
      const objString = this.uint8ArrayToString(decompressedData);

      // Validate if it's a proper OBJ format
      if (objString.includes('v ') && (objString.includes('f ') || objString.includes('vn '))) {
        console.log('Valid OBJ format detected');
        return objString;
      } else {
        console.warn('The data does not appear to be in OBJ format');
        return null;
      }
    } catch (error) {
      console.error('Error processing model data:', error);
      return null;
    }
  }

  /**
   * Loads an OBJ model from a string and adds it to the scene
   * @param objString The OBJ format string
   * @param scene The THREE.Scene to add the model to
   * @returns Promise that resolves with the loaded model or rejects with an error
   */
  loadObjModel(objString: string, scene: THREE.Scene): Promise<THREE.Group> {
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
          
          // Resolve with the loaded object
          resolve(object);
        },
        (xhr) => {
          // Progress callback
          console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
        },
        (error) => {
          console.error('Error loading OBJ model:', error);
          URL.revokeObjectURL(objectUrl);
          reject(error);
        }
      );
    });
  }
}
