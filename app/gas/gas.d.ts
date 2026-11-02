// Just enough of the Apps Script globals for app/gas/*.ts (no @types/google-apps-script dependency).
// The test fakes in fakes.ts implement exactly this surface.

declare namespace GAS {
  interface Range {
    getValues(): unknown[][];
    setValues(values: unknown[][]): Range;
    setNumberFormats(formats: string[][]): Range;
    setNumberFormat(format: string): Range;
    setFontWeight(weight: string): Range;
    setNote(note: string): Range;
    getSheet(): Sheet;
  }
  interface Sheet {
    getName(): string;
    getLastRow(): number;
    getLastColumn(): number;
    getMaxRows(): number;
    getRange(row: number, column: number, numRows?: number, numColumns?: number): Range;
    insertRowsAfter(afterPosition: number, howMany: number): Sheet;
    deleteRow(rowPosition: number): Sheet;
    setFrozenRows(rows: number): void;
    /** Clears every value (formats stay). */
    clearContents(): Sheet;
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
    remove(key: string): void;
  }
  interface Properties {
    getProperty(key: string): string | null;
    setProperty(key: string, value: string): Properties;
    getProperties(): Record<string, string>;
    /** Sets the given properties; the others are kept. */
    setProperties(properties: Record<string, string>): Properties;
  }
  interface TextOutput {
    setMimeType(mime: unknown): TextOutput;
  }
  interface EditEvent {
    range?: Range;
  }
  interface HTTPResponse {
    getResponseCode(): number;
    getContentText(): string;
  }
  interface FetchOptions {
    method: 'post';
    contentType: string;
    payload: string;
    headers: Record<string, string>;
    muteHttpExceptions: boolean;
    followRedirects: boolean;
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
/** Byte values are signed (-128..127), as Java's. */
declare const Utilities: { computeHmacSha256Signature(value: string, key: string): number[] };
/** Needs the `script.external_request` scope; without it `fetch` throws. */
declare const UrlFetchApp: { fetch(url: string, options: GAS.FetchOptions): GAS.HTTPResponse };
