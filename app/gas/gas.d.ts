// Just enough of the Apps Script globals for app/gas/*.ts (no @types/google-apps-script dependency).
// The test fakes in fakes.ts implement exactly this surface.

declare namespace GAS {
  interface Range {
    getValues(): unknown[][];
    setValues(values: unknown[][]): Range;
    setNumberFormats(formats: string[][]): Range;
    setNumberFormat(format: string): Range;
    setFontWeight(weight: string): Range;
  }
  interface Sheet {
    getName(): string;
    getLastRow(): number;
    getMaxRows(): number;
    getRange(row: number, column: number, numRows?: number, numColumns?: number): Range;
    insertRowsAfter(afterPosition: number, howMany: number): Sheet;
    setFrozenRows(rows: number): void;
  }
  interface Spreadsheet {
    getSheetByName(name: string): Sheet | null;
    insertSheet(name: string): Sheet;
  }
  interface Lock {
    tryLock(timeoutMs: number): boolean;
    releaseLock(): void;
  }
  interface Cache {
    get(key: string): string | null;
    put(key: string, value: string, expirationSeconds?: number): void;
  }
  interface Properties {
    getProperty(key: string): string | null;
    setProperty(key: string, value: string): Properties;
  }
  interface TextOutput {
    setMimeType(mime: unknown): TextOutput;
  }
  interface PostEvent {
    postData?: { contents?: string; length?: number; type?: string };
  }
}

declare const SpreadsheetApp: { getActiveSpreadsheet(): GAS.Spreadsheet; flush(): void };
declare const PropertiesService: { getScriptProperties(): GAS.Properties };
declare const LockService: { getScriptLock(): GAS.Lock };
declare const CacheService: { getScriptCache(): GAS.Cache };
declare const ContentService: { createTextOutput(text: string): GAS.TextOutput; MimeType: { JSON: unknown } };
