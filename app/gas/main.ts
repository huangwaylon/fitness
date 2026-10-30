// Island Fund web app: the only reader and writer of the bound *Island Fund* spreadsheet (ADR 0015,
// docs/design/sheets-architecture.md). Bundled by `npm run gas:build` into app/apps-script/Code.js.
//
// CRITICAL: `doPost` must never throw. An uncaught error returns Google's HTML error page, which the client cannot
// tell apart from a network blip. Every reply is JSON: {ok:true, …} or {ok:false, error}.
//
// Never read `e.parameter`: a key in the query string lands in Google's request logs. Keys go in the body only.
// There is deliberately no `doGet`.
import { parseShortcut } from './parse.ts';
import { parseInstant } from '../src/lib/time/dates.ts';
import { WORKOUT_TYPES } from '../src/lib/contract/labels.ts';
import type { PersonId } from '../src/lib/types.ts';
import { LIMITS } from '../src/lib/config/rules.ts';
import {
  DATE_RE, EVENT_TYPES, GYM_LABEL_MAX_CHARS, isActivityMetric, isMetricKey, isRec, MANUAL_ID_RE, MANUAL_WORKOUT_MIN, NUMERIC_COLUMNS, PREF_KEYS, TABS, validMetricValue,
  type ApiError, type EventReply, type Fail, type HealthReply, type IngestReply, type GymReply, type SnapshotReply, type SnapshotRows,
  type TabName, type UploadsReply, type WhoamiReply
} from '../src/lib/contract/api.ts';

/** Set by `npm run gas:build` (a hash of the bundle); `dev` when main.ts runs unbundled (tests). */
declare const __BUILD__: string | undefined;
const BUILD: string = typeof __BUILD__ === 'string' ? __BUILD__ : 'dev';

export const MAX_BODY_CHARS = 1_000_000;
export const RATE_PER_MINUTE = 120;
const LOCK_WAIT_MS = 10_000;
const MIN_KEY_CHARS = 32;
/** Keys are `openssl rand -hex 32`; anything else is refused before any Properties read. */
const KEY_RE = /^[0-9a-fA-F]{32,128}$/;
/** How long the keys stay in CacheService. A rotated key keeps working for at most this long (google-setup.md §10). */
export const KEY_CACHE_SECONDS = 300;
/** Tabs whose rows the client caches; a hand change to any of them bumps `REV`. */
const SYNCED_TABS = ['metrics', 'workouts', 'presence', 'events'] as const satisfies readonly TabName[];
const MAX_EVENT_DATA_CHARS = 20_000;
/** `readTail` reads a tab backwards in chunks of this many rows, doubling each time. */
const TAIL_CHUNK = 256;
const DAY_MS = 86400_000;

/** Every reply is one of the client contract's shapes (src/lib/contract/api.ts), so the server is compile-checked against it. */
type Reply = IngestReply | GymReply | EventReply | SnapshotReply | WhoamiReply | HealthReply;
type Rec = Record<string, unknown>;

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
  // Keyless liveness and version probe for the monitor (runbook §5): no Properties, no lock, no sheet.
  if (body.action === 'health' && body.key === undefined) return { ok: true, build: BUILD };

  const me = personFor(body.key);
  if (!me) return fail('unauthorized');
  if (!underRateLimit(me)) return fail('busy');

  switch (body.action) {
    case 'ingest': return ingest(me, body, typeof post?.length === 'number' ? post.length : text.length);
    case 'gym': return gym(me, body);
    case 'event': return event(me, body);
    case 'snapshot': return snapshot(me, body);
    case 'uploads': return uploads(me);
    case 'whoami': return withLock((): WhoamiReply => { for (const t of Object.keys(TABS) as TabName[]) tab(t); return { ok: true, me, build: BUILD }; });
    default: return fail('bad_request');
  }
}

// ---------------------------------------------------------------- auth and limits

/** Compares every character of the longer string, so the time taken says nothing about where they differ. */
function constantTimeEqual(a: string, b: string): boolean {
  let diff = a.length ^ b.length;
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) diff |= (a.charCodeAt(i) | 0) ^ (b.charCodeAt(i) | 0);
  return diff === 0;
}

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

function personFor(key: unknown): PersonId | null {
  if (typeof key !== 'string' || !KEY_RE.test(key)) return null;
  const { a, b } = keys();
  // Both comparisons always run; an unset or short property can never match.
  const isA = constantTimeEqual(key, a) && a.length >= MIN_KEY_CHARS;
  const isB = constantTimeEqual(key, b) && b.length >= MIN_KEY_CHARS;
  return isA && !isB ? 'A' : isB && !isA ? 'B' : null;
}

/** Per-key-per-minute counter. Not atomic (CacheService has no increment); good enough to stop a runaway loop. */
function underRateLimit(me: PersonId): boolean {
  try {
    const cache = CacheService.getScriptCache();
    const k = `rl:${me}:${Math.floor(Date.now() / 60000)}`;
    const n = Number(cache.get(k)) || 0;
    if (n >= RATE_PER_MINUTE) return false;
    cache.put(k, String(n + 1), 120);
    return true;
  } catch {
    return true; // a cache outage should not take the app down
  }
}

/**
 * Writes, and snapshot reads, run under the script lock. Reads take it too so a snapshot never sees half of a
 * request's rows: all rows of one request share one `at`, and a client that saw part of them would skip the rest
 * with `at > since`.
 */
function withLock<R extends Reply>(fn: () => R): R | Fail {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(LOCK_WAIT_MS)) return fail('busy');
  try {
    state = loadState();
    const r = fn();
    SpreadsheetApp.flush();
    return r;
  } finally {
    // Saved even when `fn` threw after an append: the rows it wrote keep their `at` below LAST_AT and their tab's
    // last row in ROWS, so the next request doesn't mistake them for a hand edit (a needless full resync).
    try {
      if (state) saveState(state);
    } finally {
      state = null;
      lock.releaseLock();
    }
  }
}

/**
 * The script's own bookkeeping in Script Properties, read once and written at most once per locked request:
 * - `LAST_AT`: the last server `at` handed out (they strictly increase).
 * - `ROWS`: JSON `{tab: last row}` of the synced tabs as this script last left them.
 * - `REV`: the data revision (sheets-architecture.md §2.1). Changes when the synced tabs were changed by hand.
 */
interface ServerState { lastAt: number; rows: Partial<Record<TabName, number>>; rev: string; revChanged: boolean; dirty: boolean }
let state: ServerState | null = null;

const newRev = (): string => `${Date.now().toString(36)}${Math.floor(Math.random() * 36 ** 4).toString(36).padStart(4, '0')}`;

function loadState(): ServerState {
  const p = PropertiesService.getScriptProperties().getProperties();
  let rows: ServerState['rows'] = {};
  try {
    const r = JSON.parse(p.ROWS ?? '{}');
    if (isRec(r)) rows = r as ServerState['rows'];
  } catch { /* re-learnt below */ }
  const rev = p.REV || newRev();
  return { lastAt: Date.parse(p.LAST_AT ?? '') || 0, rows, rev, revChanged: !p.REV, dirty: !p.REV };
}

function saveState(st: ServerState): void {
  if (!st.dirty) return;
  const out: Record<string, string> = { ROWS: JSON.stringify(st.rows) };
  if (st.lastAt) out.LAST_AT = new Date(st.lastAt).toISOString();
  // Only a bump of our own is written, so a concurrent `onEdit` bump (outside the lock) is never overwritten.
  if (st.revChanged) out.REV = st.rev;
  PropertiesService.getScriptProperties().setProperties(out);
}

function current(): ServerState {
  if (!state) throw new Error('not under the lock');
  return state;
}

/**
 * Compare a synced tab's last row with what this script last wrote. A difference means rows were added or deleted
 * by hand (or the tab was recreated), so cached clients can't catch up with `since`: bump `REV`. The first sight of
 * a tab (no `ROWS` entry yet) only learns it.
 */
function noteRows(name: TabName, lastRow: number): void {
  if (!(SYNCED_TABS as readonly string[]).includes(name)) return;
  const st = current();
  const known = st.rows[name];
  if (known === lastRow) return;
  if (known !== undefined) {
    st.rev = newRev();
    st.revChanged = true;
  }
  st.rows[name] = lastRow;
  st.dirty = true;
}

/** Server timestamp for this request's rows: strictly later than any `at` written before (under the lock). */
function nextAt(): string {
  const st = current();
  st.lastAt = Math.max(Date.now(), st.lastAt + 1);
  st.dirty = true;
  return new Date(st.lastAt).toISOString();
}

/**
 * Simple trigger: a hand edit of a synced tab in the spreadsheet UI bumps `REV`. (Script writes don't fire it.)
 * Row inserts and deletes are also caught by `noteRows`; `resync` is the manual fallback.
 */
export function onEdit(e: GAS.EditEvent | undefined): void {
  try {
    const name = e && e.range ? e.range.getSheet().getName() : '';
    if ((SYNCED_TABS as readonly string[]).includes(name)) resync();
  } catch { /* a trigger must not fail the user's edit */ }
}

/** Run from the script editor after fixing rows by hand: every client drops its cache on its next snapshot. */
export function resync(): void {
  PropertiesService.getScriptProperties().setProperty('REV', newRev());
}

// ---------------------------------------------------------------- sheet helpers

function tab(name: TabName): GAS.Sheet {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    const cols = TABS[name];
    // Plain-text format on the text columns first, so pasted or written dates stay strings.
    const max = sh.getMaxRows();
    cols.forEach((c, i) => { if (!NUMERIC_COLUMNS[name].includes(c)) sh!.getRange(1, i + 1, max, 1).setNumberFormat('@'); });
    sh.getRange(1, 1, 1, cols.length).setValues([[...cols]]).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

/** The tab's data rows. */
function readRows(sh: GAS.Sheet, name: TabName): unknown[][] {
  return readTail(sh, name, () => false);
}

/**
 * The tab's last rows, read backwards in doubling chunks (256, 512, …) until `enough(chunk)` says the chunk just read
 * (the oldest so far) reaches back far enough; returned in sheet order. The app only appends, with strictly increasing
 * `at`, so "every row after `at` X" is a tail: a chunk whose first row is at or before X ends the read
 * (`reachesBack`). A hand-pasted row out of order bumps REV (`noteRows`, `onEdit`), and the client then refetches
 * everything, so a tail read never has to cope with one.
 */
function readTail(sh: GAS.Sheet, name: TabName, enough: (chunk: unknown[][]) => boolean): unknown[][] {
  const last = sh.getLastRow();
  noteRows(name, last);
  const chunks: unknown[][][] = [];
  for (let end = last, n = TAIL_CHUNK; end >= 2; n *= 2) {
    const first = Math.max(2, end - n + 1);
    const chunk = sh.getRange(first, 1, end - first + 1, TABS[name].length).getValues();
    chunks.unshift(chunk);
    end = first - 1;
    if (enough(chunk)) break;
  }
  return chunks.length === 1 ? chunks[0] : ([] as unknown[][]).concat(...chunks);
}

/** `readTail`'s stop: the chunk starts at or before `at` (an ISO instant), so it holds every row after `at`. */
const reachesBack = (at: string) => (chunk: unknown[][]): boolean => instant(chunk[0][0]) <= at;

function appendRows(sh: GAS.Sheet, name: TabName, rows: unknown[][]): void {
  if (rows.length === 0) return;
  const cols = TABS[name];
  const last = sh.getLastRow();
  noteRows(name, last);
  // A tab's first data row (re)writes its header as TABS has it, so a tab left empty under an older schema (presence
  // was 5 columns until 2026-10-30) is relabelled; the extra '' clears one stale column of a wider old header.
  if (last <= 1) sh.getRange(1, 1, 1, cols.length + 1).setValues([[...cols, '']]);
  const start = Math.max(last, 1) + 1;
  const need = start + rows.length - 1 - sh.getMaxRows();
  if (need > 0) sh.insertRowsAfter(sh.getMaxRows(), need);
  const formats = cols.map((c) => (NUMERIC_COLUMNS[name].includes(c) ? '0.##' : '@'));
  sh.getRange(start, 1, rows.length, cols.length).setNumberFormats(rows.map(() => formats)).setValues(rows);
  if ((SYNCED_TABS as readonly string[]).includes(name)) {
    const st = current();
    st.rows[name] = start + rows.length - 1;
    st.dirty = true;
  }
}

const isDate = (v: unknown): v is Date => Object.prototype.toString.call(v) === '[object Date]';

/** A cell as text. Defensive against hand-pasted rows that Sheets turned into Date cells. */
function text(v: unknown, kind: 'at' | 'date' | 'text' = 'text'): string {
  if (isDate(v)) {
    if (Number.isNaN(v.getTime())) return '';
    // Tokyo is UTC+9 with no DST; a pasted bare date is Tokyo midnight.
    return kind === 'date' ? new Date(v.getTime() + 9 * 3600_000).toISOString().slice(0, 10) : v.toISOString();
  }
  return v === null || v === undefined ? '' : String(v);
}

function num(v: unknown): number | null {
  if (v === '' || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

// ---------------------------------------------------------------- actions

/**
 * The shape of an ingest body for the `uploads` audit: each field's type, list length and first item (40 chars), never
 * the key. Enough to see what a Shortcut really sends without storing the whole body twice.
 */
function bodyShape(body: Rec): string {
  const first = (v: unknown) => JSON.stringify(v)?.slice(0, 40) ?? '';
  const parts = Object.entries(body).filter(([k]) => k !== 'key').map(([k, v]) => {
    if (Array.isArray(v)) return `${k}:array[${v.length}] ${first(v[0])}`;
    if (typeof v === 'string') {
      const lines = v.split('\n');
      return `${k}:text[${lines.length}] ${first(lines[0])}`;
    }
    if (isRec(v)) return `${k}:object{${Object.keys(v).join(',').slice(0, 80)}}`;
    return `${k}:${typeof v} ${first(v)}`;
  });
  return parts.join('; ').slice(0, 2000);
}

const UPLOADS_SHOWN = 20;

/** The caller's last 20 ingest audit rows, newest first (runbook §5: what did the Shortcut send?). */
function uploads(me: PersonId): UploadsReply {
  return withLock((): UploadsReply => {
    let mine = 0;
    const rows = readTail(tab('uploads'), 'uploads', (chunk) => (mine += chunk.filter((r) => text(r[1]) === me).length) >= UPLOADS_SHOWN)
      .filter((r) => text(r[1]) === me)
      .slice(-UPLOADS_SHOWN)
      .reverse()
      .map((r) => ({ at: instant(r[0]), status: text(r[2]), bytes: num(r[3]) ?? 0, notes: text(r[4]) }));
    return { ok: true, rows };
  });
}

/** An `uploads` audit row: the body's shape, never the body itself. */
const auditRow = (at: string, me: PersonId, status: string, bytes: number, notes: string, body: Rec): unknown[] =>
  [at, me, status, bytes, `${notes.slice(0, 300)} | ${bodyShape(body)}`];

function ingest(me: PersonId, body: Rec, bytes: number): IngestReply {
  let parsed: ReturnType<typeof parseShortcut>;
  try {
    parsed = parseShortcut(body);
  } catch (err) {
    const msg = (err instanceof Error ? err.message : String(err)).slice(0, 300);
    // Audit the failure (best effort: a busy lock just skips the row).
    try {
      withLock((): GymReply => { appendRows(tab('uploads'), 'uploads', [auditRow(nextAt(), me, 'error', bytes, msg, body)]); return { ok: true }; });
    } catch { /* the reply matters more than the audit row */ }
    return fail('bad_request', msg);
  }
  // Rows about a day are only ever written from that day on (Health has no future), so every earlier row for the
  // body's days (or its workouts' days) is after the day before its earliest one: a tail. One day of slack covers a
  // phone in a zone ahead of Tokyo. Each Shortcut run's 31-day body reads ~a month of rows, not the whole tab.
  const days = [...parsed.metrics, ...parsed.workouts].map((x) => x.date).sort();
  const from = days.length ? new Date(Date.parse(`${days[0]}T00:00:00+09:00`) - DAY_MS).toISOString() : '';
  return withLock((): IngestReply => {
    const at = nextAt();
    const mSheet = tab('metrics');
    const latest = new Map<string, number>();
    // Steps and minutes: the highest row so far, and only a higher value is appended (a day only goes up).
    // Weight (ADR 0020): the LAST row so far, and any different value is appended (a weight goes down too).
    if (parsed.metrics.length) {
      for (const r of readTail(mSheet, 'metrics', reachesBack(from))) {
        const k = `${text(r[1])}|${text(r[2], 'date')}|${text(r[3])}`;
        const v = num(r[4]);
        if (v === null) continue;
        if (!isActivityMetric(r[3]) || v > (latest.get(k) ?? -Infinity)) latest.set(k, v);
      }
    }
    const newMetrics: unknown[][] = [];
    for (const m of parsed.metrics) {
      const k = `${me}|${m.date}|${m.metric}`;
      const cur = latest.get(k);
      if (cur === undefined || (isActivityMetric(m.metric) ? m.value > cur : m.value !== cur)) {
        newMetrics.push([at, me, m.date, m.metric, m.value]);
        latest.set(k, m.value);
      }
    }

    const wSheet = tab('workouts');
    const seen = new Set<string>();
    if (parsed.workouts.length) for (const r of readTail(wSheet, 'workouts', reachesBack(from))) seen.add(`${text(r[1])}|${text(r[2])}`);
    const newWorkouts: unknown[][] = [];
    for (const w of parsed.workouts) {
      const k = `${me}|${w.id}`;
      if (seen.has(k)) continue;
      seen.add(k);
      newWorkouts.push([at, me, w.id, w.date, w.type, w.start, w.end, w.durationMin, w.avgHr ?? '']);
    }

    appendRows(mSheet, 'metrics', newMetrics);
    appendRows(wSheet, 'workouts', newWorkouts);
    const notes = [
      ...parsed.warnings,
      parsed.skipped ? `${parsed.skipped} items skipped` : '',
      parsed.unknownTypes.length ? `unknown workout types: ${parsed.unknownTypes.join(', ')}` : ''
    ].filter(Boolean).join('; ');
    appendRows(tab('uploads'), 'uploads', [auditRow(at, me, parsed.skipped ? 'partial' : 'ok', bytes, notes, body)]);

    return {
      ok: true, metrics: newMetrics.length, workouts: newWorkouts.length,
      ...(parsed.skipped ? { skipped: parsed.skipped } : {}),
      ...(parsed.unknownTypes.length ? { unknownTypes: parsed.unknownTypes } : {}),
      ...(parsed.warnings.length ? { warnings: parsed.warnings } : {})
    };
  });
}

/**
 * A gym arrival from the iOS Arrive automation: `{key, action:'gym', place?, at?}` (ADR 0021). The key is the person;
 * `place` is only a label for きろく; `at` is the true arrival time (the model ignores one too far from the server `at`).
 */
function gym(me: PersonId, body: Rec): GymReply {
  if (body.place !== undefined && body.place !== null && typeof body.place !== 'string') return fail('bad_request');
  const label = typeof body.place === 'string' ? body.place.trim() : '';
  if (label.length > GYM_LABEL_MAX_CHARS) return fail('bad_request');
  let arrivedAt: string | null = null;
  if (body.at !== undefined && body.at !== null && body.at !== '') {
    // An ISO 8601 instant with its offset (the automation's Current Date, formatted ISO 8601).
    const ms = typeof body.at === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/.test(body.at) ? Date.parse(body.at) : NaN;
    if (Number.isNaN(ms)) return fail('bad_request');
    arrivedAt = new Date(ms).toISOString();
  }
  return withLock((): GymReply => {
    const at = nextAt();
    appendRows(tab('presence'), 'presence', [[at, me, label, arrivedAt ?? at]]);
    return { ok: true };
  });
}

function event(me: PersonId, body: Rec): EventReply {
  const id = body.id;
  if (typeof id !== 'string' || id.length === 0 || id.length > 128) return fail('bad_request');
  if (typeof body.type !== 'string' || !(EVENT_TYPES as readonly string[]).includes(body.type)) return fail('bad_request');
  const data = body.data === undefined ? {} : body.data;
  if (!isRec(data)) return fail('bad_request');
  const json = JSON.stringify(data);
  if (json.length > MAX_EVENT_DATA_CHARS) return fail('too_large');
  if (!validEventData(body.type, data)) return fail('bad_request');
  const type = body.type;
  return withLock((): EventReply => {
    const sh = tab('events');
    const last = sh.getLastRow();
    noteRows('events', last);
    if (last >= 2) {
      const ids = sh.getRange(2, 3, last - 1, 1).getValues();
      for (const r of ids) if (text(r[0]) === id) return { ok: true, duplicate: true };
    }
    appendRows(sh, 'events', [[nextAt(), me, id, type, json]]);
    return { ok: true };
  });
}

const isInt = (v: unknown, lo: number, hi: number): boolean => typeof v === 'number' && Number.isInteger(v) && v >= lo && v <= hi;
const isId = (v: unknown): boolean => typeof v === 'string' && v.length > 0 && v.length <= 128;

/**
 * Shape checks per event type. Only the shape: who may edit what, which weeks are still open, whether the wallet covers a
 * spend and the full menu/value rules stay read-time rules in the model (`model/state.ts`), so the sheet stays a dumb log.
 */
function validEventData(type: string, d: Rec): boolean {
  switch (type) {
    case 'spend':
      // A buy from the shared wallet (ADR 0022): no pot.
      return (isId(d.spendId) || (typeof d.spendId === 'number' && Number.isFinite(d.spendId))) && d.pot === undefined &&
        isInt(d.bells, 1, LIMITS.bellsMax) && typeof d.item === 'string' && d.item.length <= LIMITS.menuIdMaxChars &&
        typeof d.label === 'string' && d.label.trim().length > 0 && d.label.trim().length <= LIMITS.spendLabelMaxChars;
    case 'pref':
      return (PREF_KEYS as readonly unknown[]).includes(d.key) && d.value !== undefined;
    case 'harvest':
      return typeof d.week === 'string' && DATE_RE.test(d.week);
    case 'metric_set':
      // Steps and minutes: integers in bounds; weight: 20–300 kg with at most one decimal (ADR 0020).
      return typeof d.date === 'string' && DATE_RE.test(d.date) && isMetricKey(d.metric) && validMetricValue(d.metric, d.value);
    case 'workout_edit':
      return isId(d.id) && (d.strength !== undefined || d.excluded !== undefined) &&
        (d.strength === undefined || d.strength === null || typeof d.strength === 'boolean') &&
        (d.excluded === undefined || typeof d.excluded === 'boolean');
    case 'workout_add':
      return typeof d.id === 'string' && MANUAL_ID_RE.test(d.id) && typeof d.date === 'string' && DATE_RE.test(d.date) &&
        typeof d.type === 'string' && WORKOUT_TYPES.includes(d.type) && // the model drops any other type (round 7 L7)
        isInt(d.durationMin, MANUAL_WORKOUT_MIN.min, MANUAL_WORKOUT_MIN.max) &&
        (d.strength === undefined || d.strength === null || typeof d.strength === 'boolean');
    case 'spend_void':
      return isId(d.spendId) || (typeof d.spendId === 'number' && Number.isFinite(d.spendId));
    default:
      return true;
  }
}

/**
 * A row's server `at` as ISO UTC with milliseconds, so it compares as text with `since`. Defensive against a
 * hand-pasted `at` (a Date cell, no milliseconds, another offset or none: Tokyo); unreadable text is kept as is.
 */
function instant(v: unknown): string {
  // Fast path: the script's own `at` (`2026-11-02T07:15:00.000Z`), nearly every cell a snapshot reads.
  if (typeof v === 'string' && v.length === 24 && v.charCodeAt(23) === 90 && v.charCodeAt(10) === 84) return v;
  const s = text(v, 'at');
  try {
    return new Date(parseInstant(s)).toISOString();
  } catch {
    return s;
  }
}

function snapshot(me: PersonId, body: Rec): SnapshotReply {
  let since = '';
  if (typeof body.since === 'string' && body.since) {
    // An unreadable `since` would compare as text and silently hide rows: refuse it.
    try {
      since = new Date(parseInstant(body.since)).toISOString();
    } catch {
      return fail('bad_request');
    }
  } else if (body.since !== undefined && body.since !== null && body.since !== '') return fail('bad_request');
  return withLock((): SnapshotReply => {
    // With `since`, only the tail after it is read (a poll reads a few hundred rows, not years of them).
    const pick = (name: TabName, row: (r: unknown[], at: string) => unknown[]) =>
      (since ? readTail(tab(name), name, reachesBack(since)) : readRows(tab(name), name))
        .map((r) => [r, instant(r[0])] as const).filter(([, at]) => at > since).map(([r, at]) => row(r, at));
    const rows = {
      metrics: pick('metrics', (r, at) => [at, text(r[1]), text(r[2], 'date'), text(r[3]), num(r[4]) ?? 0]),
      workouts: pick('workouts', (r, at) => [
        at, text(r[1]), text(r[2]), text(r[3], 'date'), text(r[4]), text(r[5], 'at'), text(r[6], 'at'), num(r[7]) ?? 0, num(r[8])
      ]),
      presence: pick('presence', (r, at) => [at, text(r[1]), text(r[2]), text(r[3], 'at')]),
      events: pick('events', (r, at) => [at, text(r[1]), text(r[2]), text(r[3]), text(r[4])])
    } as SnapshotRows;
    return { ok: true, me, now: new Date().toISOString(), rev: current().rev, rows };
  });
}
