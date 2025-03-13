import { TestBed } from '@angular/core/testing';
import * as ion from 'ion-js';
import { FileParserService } from './file-parser.service';
import { IoFile } from '../../core/models/io-file.interface';
import { RobotConfig, RobotInfo } from '../../core/models/robot.model';
import { SessionInformation } from '../../core/models/session.model';

describe('FileParserService', () => {
  let service: FileParserService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FileParserService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('parseIonData', () => {
    it('should reject with error for empty data', async () => {
      const emptyBuffer = new ArrayBuffer(0);

      await expectAsync(
        service.parseIonData(emptyBuffer)
      ).toBeRejectedWithError('Invalid or empty data provided');
      expect(service['state']().parsing).toBeFalse();
      expect(service['state']().error).toEqual(
        'Invalid or empty data provided'
      );
    });

    it('should reject with error for null data', async () => {
      await expectAsync(
        service.parseIonData(null as any)
      ).toBeRejectedWithError('Invalid or empty data provided');
      expect(service['state']().parsing).toBeFalse();
      expect(service['state']().error).toEqual(
        'Invalid or empty data provided'
      );
    });

    it('should handle errors during parsing', async () => {
      // Create a valid buffer but with invalid Ion data
      const invalidBuffer = new ArrayBuffer(10);
      const view = new Uint8Array(invalidBuffer);
      // Fill with some random data that's not valid Ion
      for (let i = 0; i < view.length; i++) {
        view[i] = i;
      }

      await expectAsync(service.parseIonData(invalidBuffer)).toBeRejected();
      expect(service['state']().parsing).toBeFalse();
      expect(service['state']().error).toBeTruthy();
    });

    it('should successfully parse valid Ion data', async () => {
      // Create a spy on the parseIonReader method to avoid actual Ion parsing
      const mockResult: IoFile = {
        metadata: {
          botConfig: {
            BOTTYPE: 'TestBot',
            LIDAR_MODEL: 'TestLidar',
            ENABLE_IMU: true,
          } as RobotConfig,
          botInfo: {
            botID: 'test-bot-id',
            botName: 'TestBot',
            enterpriseName: 'TestEnterprise',
          } as RobotInfo,
          sessionInfo: {
            sessionCode: 'test-session',
            session_id: 'test-id',
            start_time: '2023-01-01T00:00:00Z',
          } as SessionInformation,
        },
        topics: [],
      };

      spyOn<any>(service, 'parseIonReader').and.returnValue(mockResult);
      spyOn<any>(service, 'isValidIoFile').and.returnValue(true);

      // Create a minimal valid Ion buffer (just needs to pass the initial checks)
      const validBuffer = new ArrayBuffer(10);
      spyOn(ion, 'makeReader').and.returnValue({} as any);

      const result = await service.parseIonData(validBuffer);

      expect(result).toEqual(mockResult);
      expect(service['state']().parsing).toBeFalse();
      expect(service['state']().error).toBeNull();
      expect(service['parseIonReader']).toHaveBeenCalled();
    });
  });

  describe('isValidIoFile', () => {
    it('should return false for null data', () => {
      expect(service['isValidIoFile'](null)).toBeFalse();
    });

    it('should return false for non-object data', () => {
      expect(service['isValidIoFile']('string')).toBeFalse();
      expect(service['isValidIoFile'](123)).toBeFalse();
      expect(service['isValidIoFile'](true)).toBeFalse();
    });

    it('should return true for object data', () => {
      expect(service['isValidIoFile']({})).toBeTrue();
      expect(service['isValidIoFile']({ metadata: {} })).toBeTrue();
    });
  });

  describe('parseIonReader', () => {
    it('should handle null values', () => {
      const mockReader = createMockReader([
        { type: ion.IonTypes.NULL, value: null },
      ]);

      const result = service.parseIonReader(mockReader);
      expect(result).toBeNull();
    });

    it('should handle boolean values', () => {
      const mockReader = createMockReader([
        { type: ion.IonTypes.BOOL, value: true },
      ]);

      const result = service.parseIonReader(mockReader);
      expect(result).toBeTrue();
    });

    it('should handle number values', () => {
      const mockReader = createMockReader([
        { type: ion.IonTypes.INT, value: 42 },
      ]);

      const result = service.parseIonReader(mockReader);
      expect(result).toBe(42);
    });

    it('should handle string values', () => {
      const mockReader = createMockReader([
        { type: ion.IonTypes.STRING, value: 'test' },
      ]);

      const result = service.parseIonReader(mockReader);
      expect(result).toBe('test');
    });

    it('should handle binary data (BLOB)', () => {
      const binaryData = new Uint8Array([1, 2, 3, 4, 5]);
      const mockReader = createMockReader([
        { type: ion.IonTypes.BLOB, value: binaryData, isBinary: true },
      ]);

      const result = service.parseIonReader(mockReader);
      expect(result).toEqual(binaryData);
    });

    it('should handle binary data (CLOB)', () => {
      const binaryData = new Uint8Array([65, 66, 67, 68]); // ASCII for "ABCD"
      const mockReader = createMockReader([
        { type: ion.IonTypes.CLOB, value: binaryData, isBinary: true },
      ]);

      const result = service.parseIonReader(mockReader);
      expect(result).toEqual(binaryData);
    });

    it('should handle multiple values', () => {
      const mockReader = createMockReader([
        { type: ion.IonTypes.INT, value: 1 },
        { type: ion.IonTypes.INT, value: 2 },
        { type: ion.IonTypes.INT, value: 3 },
      ]);

      const result = service.parseIonReader(mockReader);
      expect(result).toEqual([1, 2, 3]);
    });

    it('should handle list values', () => {
      const mockListReader = createMockReader([
        { type: ion.IonTypes.INT, value: 1 },
        { type: ion.IonTypes.INT, value: 2 },
      ]);

      const mockReader = createMockReader([
        {
          type: ion.IonTypes.LIST,
          value: null,
          stepIn: () => {
            // Return the list reader when stepping in
            mockReader.next = mockListReader.next;
            mockReader.type = mockListReader.type;
            mockReader.numberValue = mockListReader.numberValue;
          },
          stepOut: () => {
            // Reset the reader when stepping out
            mockReader.next = () => null;
          },
        },
      ]);

      const result = service.parseIonReader(mockReader);
      expect(result).toEqual([1, 2]);
    });

    it('should handle struct values', () => {
      let fieldNameIndex = 0;
      const fieldNames = ['key1', 'key2'];

      const mockStructReader = createMockReader([
        { type: ion.IonTypes.INT, value: 1 },
        { type: ion.IonTypes.STRING, value: 'value' },
      ]);

      const mockReader = createMockReader([
        {
          type: ion.IonTypes.STRUCT,
          value: null,
          stepIn: () => {
            // Return the struct reader when stepping in
            mockReader.next = mockStructReader.next;
            mockReader.type = mockStructReader.type;
            mockReader.numberValue = mockStructReader.numberValue;
            mockReader.stringValue = mockStructReader.stringValue;
            mockReader.fieldName = () => fieldNames[fieldNameIndex++];
          },
          stepOut: () => {
            // Reset the reader when stepping out
            mockReader.next = () => null;
          },
        },
      ]);

      const result = service.parseIonReader(mockReader);
      expect(result).toEqual({ key1: 1, key2: 'value' });
    });

    it('should handle errors in parsing', () => {
      const mockReader = {
        next: () => true,
        type: () => ion.IonTypes.INT,
        numberValue: () => {
          throw new Error('Test error');
        },
      } as any;

      const result = service.parseIonReader(mockReader);
      expect(result).toContain('[Error:');
    });
  });

  describe('parseIonValue', () => {
    it('should handle null reader', () => {
      const result = service['parseIonValue'](null as any);
      expect(result).toBeNull();
    });

    it('should handle errors during parsing', () => {
      const mockReader = {
        type: () => {
          throw new Error('Test error');
        },
      } as any;

      const result = service['parseIonValue'](mockReader);
      expect(result).toContain('[Error:');
    });
  });
});

/**
 * Helper function to create a mock Ion reader with predefined values
 */
function createMockReader(
  values: Array<{
    type: any;
    value: any;
    stepIn?: Function;
    stepOut?: Function;
    isBinary?: boolean;
  }>
) {
  let index = -1;

  return {
    next: () => {
      index++;
      return index < values.length ? {} : null;
    },
    type: () => values[index]?.type,
    booleanValue: () => values[index]?.value,
    numberValue: () => values[index]?.value,
    stringValue: () => values[index]?.value,
    decimalValue: () => values[index]?.value,
    timestampValue: () => values[index]?.value,
    uInt8ArrayValue: () =>
      values[index]?.isBinary ? values[index]?.value : new Uint8Array(),
    fieldName: () => '',
    stepIn: values[index]?.stepIn || (() => {}),
    stepOut: values[index]?.stepOut || (() => {}),
  } as any;
}
