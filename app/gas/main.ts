// Island Fund web app (docs/backend.md#the-record): since step 5 of the move to the relay, two jobs only.
// - Forward: an older app's requests and a Shortcut still posting to the /exec URL go on to the relay's record
//   (RECORD_API_URL), and its reply comes back as it is.
// - Export: the relay's cron POSTs every row of the record (signed); the bound spreadsheet's tabs are rewritten with
//   them, a one-way copy to look at and a backup. Nothing here is read back: an edit in the sheet goes nowhere.
// Bundled by `npm run gas:build` into app/apps-script/Code.js.
//
// CRITICAL: `doPost` must never throw. An uncaught error returns Google's HTML error page, which the client cannot
// tell apart from a network blip. Every reply is JSON: {ok:true, …} or {ok:false, error}.
//
// Never read `e.parameter`: a key in the query string lands in Google's request logs. Keys go in the body only.
// There is deliberately no `doGet`.
import { isRec, NUMERIC_COLUMNS, TABS, type ApiError, type Fail, type TabName } from '../src/lib/contract/api.ts';

/** Set by `npm run gas:build` (a hash of the bundle); `dev` when main.ts runs unbundled (tests). */
declare const __BUILD__: string | undefined;
const BUILD: string = typeof __BUILD__ === 'string' ? __BUILD__ : 'dev';

/** An export carries every row (~200 KB now; tens of MB is years away). */
export const MAX_BODY_CHARS = 20_000_000;
/** The relay's record (docs/backend.md#the-record). */
export const RECORD_API_URL = 'https://island-fund-relay.island-fund-relay.workers.dev/api';
/** What the server-to-server secret signs (relay/src/notify.ts): the same derivation as the relay's. */
const NOTIFY_LABEL = 'island-relay-notify/1';
/** An export signed further from now than this is refused. */
export const EXPORT_WINDOW_MS = 10 * 60_000;
const LOCK_WAIT_MS = 20_000;
/** How long the keys stay in CacheService (a rotated key is picked up within this). */
const KEY_CACHE_SECONDS = 300;
/** The tab that says what the spreadsheet is. */
export const ABOUT_TAB = 'README';
const ABOUT = [
  'This spreadsheet is a one-way export of Island Fund\'s record (the relay\'s IslandStore), rewritten after each change (within 15 minutes) and every night. Edits here are overwritten at the next export and never reach the app.',
  'このスプレッドシートは、しまの貯金箱の記録（リレーの IslandStore）を書き出した読み取り専用のコピーです。変更のたびに（15分以内）と毎晩、上書きされます。ここで編集しても次の書き出しで消え、アプリには届きません。'
];

type Rec = Record<string, unknown>;
type Reply = Rec & { ok: boolean };

const fail = (error: ApiError, detail?: string): Fail => (detail ? { ok: false, error, detail } : { ok: false, error });

export function doPost(e: GAS.PostEvent | undefined): GAS.TextOutput {
  let reply: Reply;
  try {
    reply = handle(e);
  } catch (err) {
    try { console.error(err); } catch { /* logging must not throw either */ }
    reply = fail('unavailable');
  }
  return ContentService.createTextOutput(JSON.stringify(reply)).setMimeType(ContentService.MimeType.JSON);
}

function handle(e: GAS.PostEvent | undefined): Reply {
  const post = e && e.postData;
  const text = post && typeof post.contents === 'string' ? post.contents : '';
  if (text.length > MAX_BODY_CHARS) return fail('too_large');
  if (!text) return fail('bad_request');
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return fail('bad_request');
  }
  if (!isRec(body)) return fail('bad_request');
  // Keyless liveness and version probe for the monitor (docs/ops/runbook.md §3): no Properties, no sheet.
  if (body.action === 'health' && body.key === undefined) return { ok: true, build: BUILD };
  if (body.action === 'export' && body.key === undefined) return exportRows(body);
  return forward(body);
}

// ---------------------------------------------------------------- the forward to the record

/**
 * JSON with every character past ASCII escaped as \uXXXX: Apps Script and the relay need not agree on how to encode
 * the rest (a Shortcut's "7:25 AM" has a narrow no-break space, U+202F).
 */
const asciiJson = (v: unknown): string => JSON.stringify(v).replace(/[^\x20-\x7e]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`);

/**
 * POST the request to the record as it came (the key stays in the body: HTTPS, never a URL) and hand back its reply.
 * Anything but a JSON reply from it is `unavailable`, so the app retries.
 */
function forward(body: Rec): Reply {
  try {
    const res = UrlFetchApp.fetch(RECORD_API_URL, {
      method: 'post', contentType: 'text/plain', payload: asciiJson(body), muteHttpExceptions: true, followRedirects: false, headers: { 'X-Island-Via': 'gas' }
    });
    if (res.getResponseCode() !== 200) return fail('unavailable', `record ${res.getResponseCode()}`);
    const r: unknown = JSON.parse(res.getContentText());
    return isRec(r) && typeof r.ok === 'boolean' ? (r as Reply) : fail('unavailable');
  } catch {
    return fail('unavailable');
  }
}

// ---------------------------------------------------------------- the export from the record

/** KEY_A and KEY_B, from CacheService when possible (Properties reads have a daily quota). */
function keys(): { a: string; b: string } {
  let cache: GAS.Cache | null = null;
  try {
    cache = CacheService.getScriptCache();
    const hit = cache.get('keys');
    if (hit) {
      const k = JSON.parse(hit) as { a?: unknown; b?: unknown };
      if (typeof k.a === 'string' && typeof k.b === 'string') return { a: k.a, b: k.b };
    }
  } catch { /* fall through to Properties */ }
  const props = PropertiesService.getScriptProperties();
  const k = { a: props.getProperty('KEY_A') ?? '', b: props.getProperty('KEY_B') ?? '' };
  try { cache?.put('keys', JSON.stringify(k), KEY_CACHE_SECONDS); } catch { /* best effort */ }
  return k;
}

const hex = (bytes: number[]): string => bytes.map((b) => ((b + 256) % 256).toString(16).padStart(2, '0')).join('');

/** Compares every character of the longer string, so the time taken says nothing about where they differ. */
function constantTimeEqual(a: string, b: string): boolean {
  let diff = a.length ^ b.length;
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) diff |= (a.charCodeAt(i) | 0) ^ (b.charCodeAt(i) | 0);
  return diff === 0;
}

/** Whether `sig` is the relay's signature of `data` at `t` (relay/src/store.ts exportBody), within the window. */
function signedByRelay(t: unknown, sig: unknown, data: string): boolean {
  if (typeof t !== 'string' || !/^\d{13}$/.test(t) || typeof sig !== 'string' || !/^[0-9a-f]{64}$/.test(sig)) return false;
  if (Math.abs(Date.now() - Number(t)) > EXPORT_WINDOW_MS) return false;
  const { a, b } = keys();
  if (!a || !b) return false;
  const secret = hex(Utilities.computeHmacSha256Signature(NOTIFY_LABEL, `${a.trim().toLowerCase()}:${b.trim().toLowerCase()}`));
  return constantTimeEqual(sig, hex(Utilities.computeHmacSha256Signature(`${t}.${data}`, secret)));
}

/** A column's number format: plain text, so Sheets never turns a written date into a Date, or a number. */
const formatOf = (name: TabName, col: string): string => (NUMERIC_COLUMNS[name].includes(col) ? '0.##' : '@');

/** Rewrite a tab: its header (bold, frozen, with the read-only note) and `rows`, nothing else. */
function rewrite(ss: GAS.Spreadsheet, name: TabName, rows: unknown[][]): number {
  const cols = TABS[name];
  const sh = ss.getSheetByName(name) ?? ss.insertSheet(name);
  sh.clearContents();
  const need = rows.length + 1 - sh.getMaxRows();
  if (need > 0) sh.insertRowsAfter(sh.getMaxRows(), need);
  const all = [cols.slice() as unknown[], ...rows.map((r) => cols.map((_, i) => (r[i] === undefined || r[i] === null ? '' : r[i])))];
  const formats = cols.map((c) => formatOf(name, c));
  sh.getRange(1, 1, all.length, cols.length).setNumberFormats(all.map(() => formats)).setValues(all);
  sh.getRange(1, 1, 1, cols.length).setFontWeight('bold');
  sh.getRange(1, 1).setNote(ABOUT[0]);
  sh.setFrozenRows(1);
  return rows.length;
}

/**
 * `{action: 'export', t, sig, data}` from the relay's cron: `data` the record as JSON text (`{rows: {metrics, events,
 * uploads}, rev, upto, at}`), signed with the server-to-server secret. Every tab is rewritten under the lock (an
 * export racing another waits), and README says what the spreadsheet is and when it was written.
 */
function exportRows(body: Rec): Reply {
  if (typeof body.data !== 'string' || !signedByRelay(body.t, body.sig, body.data)) return fail('unauthorized');
  let d: unknown;
  try {
    d = JSON.parse(body.data);
  } catch {
    return fail('bad_request');
  }
  if (!isRec(d) || !isRec(d.rows)) return fail('bad_request');
  const rows = d.rows;
  const lists = (['metrics', 'events', 'uploads'] as const).map((t) => [t, rows[t]] as const);
  if (lists.some(([, l]) => !Array.isArray(l) || (l as unknown[]).some((r) => !Array.isArray(r)))) return fail('bad_request');
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(LOCK_WAIT_MS)) return fail('busy');
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const written: Record<string, number> = {};
    for (const [t, l] of lists) written[t] = rewrite(ss, t, l as unknown[][]);
    const about = ss.getSheetByName(ABOUT_TAB) ?? ss.insertSheet(ABOUT_TAB);
    about.clearContents();
    const lines: unknown[][] = [
      [ABOUT[0], ''], [ABOUT[1], ''], ['', ''],
      ['exported at', String(d.at ?? '')], ['newest row', String(d.upto ?? '')], ['revision', String(d.rev ?? '')],
      ['rows', `metrics ${written.metrics}, events ${written.events}, uploads ${written.uploads}`]
    ];
    about.getRange(1, 1, lines.length, 2).setNumberFormats(lines.map(() => ['@', '@'])).setValues(lines);
    SpreadsheetApp.flush();
    return { ok: true, written };
  } finally {
    lock.releaseLock();
  }
}
