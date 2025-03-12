import { Injectable } from '@angular/core';
import * as ion from 'ion-js';
import { IoFile } from '../core/models/io-file.interface';
import { SignalsSimpleStoreService } from '../core/services';

export interface FileParserState {
  parsing: boolean;
  file: IoFile | null;
  error: string | null;
}
@Injectable({
  providedIn: 'root',
})
export class FileParserService extends SignalsSimpleStoreService<FileParserState> {
  parseIonData(data: ArrayBuffer): Promise<IoFile> {
    this.set('parsing', true);
    return new Promise((resolve, reject) => {
      try {
        const ionReader = ion.makeReader(data);
        const result = ion.load(ionReader) as unknown as IoFile;
        resolve(result);
      } catch (error) {
        reject(error);
      } finally {
        this.set('parsing', false);
      }
    });
  }
}
