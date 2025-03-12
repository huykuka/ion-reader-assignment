import { Injectable } from '@angular/core';
import * as ion from 'ion-js';

@Injectable({
  providedIn: 'root',
})
export class FileParserService {
  parseIonData<T>(data: ArrayBuffer): Promise<T> {
    return new Promise((resolve, reject) => {
      try {
        const ionReader = ion.makeReader(data);
        const result = ion.load(ionReader) as T;
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  }
}
