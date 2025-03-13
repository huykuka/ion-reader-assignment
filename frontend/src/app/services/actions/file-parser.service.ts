import { Injectable } from '@angular/core';
import * as ion from 'ion-js';
import { IoFile } from '../../core/models/io-file.interface';
import { SignalsSimpleStoreService } from '../../core/services';

export interface FileParserState {
  parsing: boolean;
  file: IoFile | null;
  error: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class FileParserService extends SignalsSimpleStoreService<FileParserState> {
  /**
   * Parses Ion binary data into a JavaScript object
   * @param data - ArrayBuffer containing Ion binary data
   * @returns Promise resolving to parsed IoFile
   */
  parseIonData(data: ArrayBuffer): Promise<IoFile> {
    this.set('parsing', true);
    this.set('error', null);

    return new Promise((resolve, reject) => {
      // Validate input data
      if (!data || data.byteLength === 0) {
        const error = new Error('Invalid or empty data provided');
        this.set('error', error.message);
        this.set('parsing', false);
        reject(error);
        return;
      }

      try {
        // Create Ion reader from binary data
        const ionReader = ion.makeReader(data);

        // Validate reader creation
        if (!ionReader) {
          throw new Error('Failed to create Ion reader');
        }

        // Parse the data using our recursive parser
        const result = this.parseIonReader(ionReader);
        console.log('Parsed Ion data:', result);

        // Validate the result matches expected format
        if (this.isValidIoFile(result)) {
          resolve(result as IoFile);
        } else {
          throw new Error('Parsed data does not match expected IoFile format');
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown parsing error';
        console.error('Ion parsing error:', error);
        this.set('error', errorMessage);
        reject(error);
      } finally {
        this.set('parsing', false);
      }
    });
  }

  /**
   * Checks if the parsed result matches the expected IoFile structure
   * @param data - Data to validate
   * @returns Whether the data is a valid IoFile
   */
  private isValidIoFile(data: any): boolean {
    // Add validation logic based on your IoFile interface requirements
    // This is a basic check - enhance based on your specific IoFile structure
    return data !== null && typeof data === 'object';
  }

  /**
   * Recursively parses an Ion reader into JavaScript objects.
   * @param reader - Ion Reader instance.
   * @returns Parsed Ion data.
   */
  parseIonReader(reader: ion.Reader): any {
    try {
      const results: any[] = [];

      // Process each value in the current level
      while (reader.next() !== null) {
        const currentType = reader.type();

        // Handle null values
        if (currentType === ion.IonTypes.NULL) {
          results.push(null);
          continue;
        }

        try {
          // Process each type appropriately
          switch (currentType) {
            case ion.IonTypes.BOOL:
              results.push(reader.booleanValue());
              break;

            case ion.IonTypes.INT:
            case ion.IonTypes.FLOAT:
              results.push(reader.numberValue());
              break;

            case ion.IonTypes.DECIMAL:
              // Handle decimal values with null safety
              const decimalValue = reader.decimalValue();
              results.push(decimalValue ? decimalValue.toString() : null);
              break;

            case ion.IonTypes.TIMESTAMP:
              // Convert timestamp to string with null safety
              const timestampValue = reader.timestampValue();
              results.push(timestampValue ? timestampValue.toString() : null);
              break;

            case ion.IonTypes.SYMBOL:
              results.push(reader.stringValue());
              break;

            case ion.IonTypes.STRING:
              results.push(reader.stringValue());
              break;

            case ion.IonTypes.CLOB:
            case ion.IonTypes.BLOB:
              // Keep binary data for later use instead of using a placeholder
              const binaryValue = reader.uInt8ArrayValue();
              console.log(binaryValue);
              results.push(binaryValue);
              break;

            case ion.IonTypes.LIST:
              reader.stepIn();
              const list: any[] = [];

              // Process each item in the list
              while (reader.next() !== null) {
                const value = this.parseIonValue(reader);
                list.push(value);
              }

              reader.stepOut();
              results.push(list);
              break;

            case ion.IonTypes.SEXP:
              reader.stepIn();
              const sexp: any[] = [];

              // Process each item in the S-expression
              while (reader.next() !== null) {
                const value = this.parseIonValue(reader);
                sexp.push(value);
              }

              reader.stepOut();
              results.push(sexp);
              break;

            case ion.IonTypes.STRUCT:
              reader.stepIn();
              const obj: Record<string, any> = {};

              // Process each field in the struct
              while (reader.next() !== null) {
                const fieldName = reader.fieldName() || '';
                const value = this.parseIonValue(reader);
                obj[fieldName] = value;
              }

              reader.stepOut();
              results.push(obj);
              break;

            default:
              console.warn(`Skipping unsupported Ion type: ${currentType}`);
              // Skip this value but don't break parsing
              results.push(`[Unsupported Ion type: ${currentType}]`);
              break;
          }
        } catch (innerError) {
          console.warn(`Error parsing Ion type ${currentType}:`, innerError);
          // Add a placeholder for the error instead of breaking the entire parsing
          results.push(`[Error: Failed to parse Ion type ${currentType}]`);
        }
      }

      // Return appropriate result based on number of items
      if (results.length === 0) {
        return null;
      } else if (results.length === 1) {
        return results[0];
      } else {
        return results;
      }
    } catch (error) {
      console.error('Error in parseIonReader:', error);
      throw error;
    }
  }

  /**
   * Parses a single Ion value based on its type
   * @param reader - Ion Reader instance
   * @returns Parsed value
   */
  private parseIonValue(reader: ion.Reader): any {
    if (!reader) {
      console.warn('Null reader provided to parseIonValue');
      return null;
    }

    try {
      const currentType = reader.type();

      switch (currentType) {
        case ion.IonTypes.NULL:
          return null;

        case ion.IonTypes.BOOL:
          return reader.booleanValue();

        case ion.IonTypes.INT:
        case ion.IonTypes.FLOAT:
          return reader.numberValue();

        case ion.IonTypes.DECIMAL:
          const decimalValue = reader.decimalValue();
          return decimalValue ? decimalValue.toString() : null;

        case ion.IonTypes.TIMESTAMP:
          const timestampValue = reader.timestampValue();
          return timestampValue ? timestampValue.toString() : null;

        case ion.IonTypes.SYMBOL:
        case ion.IonTypes.STRING:
          return reader.stringValue();

        case ion.IonTypes.CLOB:
        case ion.IonTypes.BLOB:
          // Keep binary data for later use instead of using a placeholder
          const binaryValue = reader.uInt8ArrayValue();
          return binaryValue;

        case ion.IonTypes.LIST:
          reader.stepIn();
          const list: any[] = [];

          while (reader.next() !== null) {
            list.push(this.parseIonValue(reader));
          }

          reader.stepOut();
          return list;

        case ion.IonTypes.SEXP:
          reader.stepIn();
          const sexp: any[] = [];

          while (reader.next() !== null) {
            sexp.push(this.parseIonValue(reader));
          }

          reader.stepOut();
          return sexp;

        case ion.IonTypes.STRUCT:
          reader.stepIn();
          const obj: Record<string, any> = {};

          while (reader.next() !== null) {
            const fieldName = reader.fieldName() || '';
            obj[fieldName] = this.parseIonValue(reader);
          }

          reader.stepOut();
          return obj;

        default:
          console.warn(`Unsupported Ion type in parseIonValue: ${currentType}`);
          return `[Unsupported Ion type: ${currentType}]`;
      }
    } catch (error) {
      console.error('Error in parseIonValue:', error);
      return `[Error: ${error instanceof Error ? error.message : 'Unknown error'
        }]`;
    }
  }
}
