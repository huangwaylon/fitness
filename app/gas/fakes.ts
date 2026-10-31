// In-memory fakes of the Apps Script services app/gas/main.ts uses. Faithful where it matters:
// - getRange outside the sheet's max rows/columns throws (as in Sheets), so appends must grow the sheet;
// - a `YYYY-MM-DD` string written into a cell that is not plain-text formatted becomes a Date (Sheets' auto-typing);
// - getLastRow is the last row with any content.

const MAX_COLS = 26;
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export class FakeSheet {
  rows: unknown[][] = [];
  formats = new Map<string, string>();
  maxRows = 1000;
  frozen = 0;
  constructor(public name: string) {}

  getName() { return this.name; }
  getMaxRows() { return this.maxRows; }
  getLastRow() {
    for (let i = this.rows.length - 1; i >= 0; i--) if (this.rows[i]?.some((v) => v !== '' && v !== null && v !== undefined)) return i + 1;
    return 0;
  }
  insertRowsAfter(after: number, n: number) {
    if (after !== this.maxRows) throw new Error('fake only supports growing at the end');
    this.maxRows += n;
    return this;
  }
  setFrozenRows(n: number) { this.frozen = n; }
  getRange(row: number, col: number, numRows = 1, numCols = 1) {
    if (row < 1 || col < 1 || numRows < 1 || numCols < 1) throw new Error(`bad range ${row},${col},${numRows},${numCols}`);
    if (row + numRows - 1 > this.maxRows || col + numCols - 1 > MAX_COLS) {
      throw new Error('Exception: The coordinates of the range are outside the dimensions of the sheet.');
    }
    const sheet = this;
    const cells = (fn: (r: number, c: number, i: number, j: number) => void) => {
      for (let i = 0; i < numRows; i++) for (let j = 0; j < numCols; j++) fn(row + i, col + j, i, j);
    };
    const range = {
      getValues() {
        const out: unknown[][] = [];
        cells((r, c, i, j) => {
          (out[i] ??= [])[j] = sheet.rows[r - 1]?.[c - 1] ?? '';
        });
        return out;
      },
      setValues(values: unknown[][]) {
        if (values.length !== numRows || values.some((v) => v.length !== numCols)) throw new Error('setValues: dimensions do not match the range');
        cells((r, c, i, j) => {
          let v = values[i][j];
          if (v === null || v === undefined) v = '';
          if (typeof v === 'string' && DATE_ONLY.test(v) && sheet.formats.get(`${r}:${c}`) !== '@') v = new Date(`${v}T00:00:00+09:00`);
          (sheet.rows[r - 1] ??= [])[c - 1] = v;
        });
        return range;
      },
      setNumberFormat(f: string) { cells((r, c) => sheet.formats.set(`${r}:${c}`, f)); return range; },
      setNumberFormats(fs: string[][]) { cells((r, c, i, j) => sheet.formats.set(`${r}:${c}`, fs[i][j])); return range; },
      setFontWeight() { return range; },
      clearContent() { cells((r, c) => { if (sheet.rows[r - 1]) sheet.rows[r - 1][c - 1] = ''; }); return range; },
      getSheet() { return sheet; }
    };
    return range;
  }
  /** Data rows (without the header) as stored. */
  data() { return this.rows.slice(1, this.getLastRow()); }
}

interface FakeOptions { keyA?: string | null; keyB?: string | null }

export function makeGas(opts: FakeOptions = {}) {
  const sheets = new Map<string, FakeSheet>();
  const props = new Map<string, string>();
  if (opts.keyA !== null) props.set('KEY_A', opts.keyA ?? 'a'.repeat(64));
  if (opts.keyB !== null) props.set('KEY_B', opts.keyB ?? 'b'.repeat(64));
  // Values with their expiry (ms since epoch), honouring `put`'s expirationSeconds against the (fakeable) Date.
  const cache = new Map<string, { v: string; until: number }>();
  const state = { lockAvailable: true, lockHeld: false, flushes: 0, spreadsheetThrows: false, propReads: 0, propWrites: 0 };

  const globals = {
    SpreadsheetApp: {
      getActiveSpreadsheet() {
        if (state.spreadsheetThrows) throw new Error('Service Spreadsheets failed while accessing document');
        return {
          getSheetByName: (n: string) => sheets.get(n) ?? null,
          insertSheet: (n: string) => {
            if (sheets.has(n)) throw new Error(`A sheet with the name "${n}" already exists.`);
            const s = new FakeSheet(n);
            sheets.set(n, s);
            return s;
          }
        };
      },
      flush() { state.flushes++; }
    },
    PropertiesService: {
      getScriptProperties() {
        const p = {
          getProperty: (k: string) => { state.propReads++; return props.get(k) ?? null; },
          setProperty: (k: string, v: string) => { props.set(k, v); state.propWrites++; return p; },
          getProperties: () => { state.propReads++; return Object.fromEntries(props); },
          setProperties: (o: Record<string, string>) => { for (const [k, v] of Object.entries(o)) props.set(k, v); state.propWrites++; return p; }
        };
        return p;
      }
    },
    LockService: {
      getScriptLock: () => ({
        tryLock: () => {
          if (!state.lockAvailable || state.lockHeld) return false;
          state.lockHeld = true;
          return true;
        },
        releaseLock: () => { state.lockHeld = false; }
      })
    },
    CacheService: {
      getScriptCache: () => ({
        get: (k: string) => { const e = cache.get(k); return e && e.until > Date.now() ? e.v : null; },
        put: (k: string, v: string, seconds = 600) => { cache.set(k, { v, until: Date.now() + seconds * 1000 }); }
      })
    },
    ContentService: {
      MimeType: { JSON: 'application/json' },
      createTextOutput(text: string) {
        const out = { text, mime: '', setMimeType(m: string) { out.mime = m; return out; } };
        return out;
      }
    }
  };
  return { globals, sheets, props, cache, state };
}

export type Gas = ReturnType<typeof makeGas>;

/** Install the fakes as globals (for importing main.ts directly). */
export function install(gas: Gas): void {
  Object.assign(globalThis, gas.globals);
}
