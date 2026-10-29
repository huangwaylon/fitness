// Island Fund web app: the only reader and writer of the bound *Island Fund* spreadsheet (ADR 0015,
// docs/design/sheets-architecture.md). Bundled by `npm run gas:build` into app/apps-script/Code.js.
//
// CRITICAL: `doPost` must never throw. An uncaught error returns Google's HTML error page, which the client cannot
// tell apart from a network blip. Every reply is JSON: {ok:true, …} or {ok:false, error}.
//
// Never read `e.parameter`: a key in the query string lands in Google's request logs. Keys go in the body only.
// There is deliberately no `doGet`.
import { looseDate, parseShortcut } from '../src/lib/ingest/parse.ts';
import { parseInstant } from '../src/lib/scoring/dates.ts';
import { WORKOUT_TYPES } from '../src/lib/model/labels.ts';
import type { PersonId } from '../src/lib/types.ts';
import {
  DATE_RE, EVENT_TYPES, isMetricKey, isRec, MANUAL_ID_RE, MANUAL_WORKOUT_MIN, METRIC_BOUNDS, MONTH_RE, NUMERIC_COLUMNS, TABS,
  type ApiError, type EventReply, type Fail, type IngestReply, type PresenceReply, type SnapshotReply, type SnapshotRows, type TabName,
  type WhoamiReply
} from '../src/lib/ingest/sheet-api.ts';

export const MAX_BODY_CHARS = 1_000_000;
export const RATE_PER_MINUTE = 120;
const LOCK_WAIT_MS = 10_000;
const MIN_KEY_CHARS = 32;
const MAX_EVENT_DATA_CHARS = 20_000;

/** Every reply is one of the client contract's shapes (sheet-api.ts), so the server is compile-checked against it. */
type Reply = IngestReply | PresenceReply | EventReply | SnapshotReply | WhoamiReply;
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

  const me = personFor(body.key);
  if (!me) return fail('unauthorized');
  if (!underRateLimit(me)) return fail('busy');

  switch (body.action) {
    case 'ingest': return ingest(me, body, typeof post?.length === 'number' ? post.length : text.length);
    case 'presence': return presence(me, body);
    case 'event': return event(me, body);
    case 'snapshot': return snapshot(me, body);
    case 'whoami': return withLock((): WhoamiReply => { for (const t of Object.keys(TABS) as TabName[]) tab(t); return { ok: true, me }; });
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

function personFor(key: unknown): PersonId | null {
  if (typeof key !== 'string' || key.length < MIN_KEY_CHARS) return null;
  const props = PropertiesService.getScriptProperties();
  const a = props.getProperty('KEY_A');
  const b = props.getProperty('KEY_B');
  // Both comparisons always run; an unset or short property can never match.
  const isA = constantTimeEqual(key, a ?? '') && !!a && a.length >= MIN_KEY_CHARS;
  const isB = constantTimeEqual(key, b ?? '') && !!b && b.length >= MIN_KEY_CHARS;
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
    const r = fn();
    SpreadsheetApp.flush();
    return r;
  } finally {
    lock.releaseLock();
  }
}

/** Server timestamp for this request's rows: strictly later than any `at` written before (under the lock). */
function nextAt(): string {
  const props = PropertiesService.getScriptProperties();
  const last = Date.parse(props.getProperty('LAST_AT') ?? '') || 0;
  const at = new Date(Math.max(Date.now(), last + 1)).toISOString();
  props.setProperty('LAST_AT', at);
  return at;
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

function readRows(sh: GAS.Sheet, name: TabName): unknown[][] {
  const last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, TABS[name].length).getValues();
}

function appendRows(sh: GAS.Sheet, name: TabName, rows: unknown[][]): void {
  if (rows.length === 0) return;
  const cols = TABS[name];
  const start = Math.max(sh.getLastRow(), 1) + 1;
  const need = start + rows.length - 1 - sh.getMaxRows();
  if (need > 0) sh.insertRowsAfter(sh.getMaxRows(), need);
  const formats = cols.map((c) => (NUMERIC_COLUMNS[name].includes(c) ? '0.##' : '@'));
  sh.getRange(start, 1, rows.length, cols.length).setNumberFormats(rows.map(() => formats)).setValues(rows);
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

function ingest(me: PersonId, body: Rec, bytes: number): IngestReply {
  let parsed: ReturnType<typeof parseShortcut>;
  try {
    parsed = parseShortcut(body);
  } catch (err) {
    const msg = (err instanceof Error ? err.message : String(err)).slice(0, 300);
    // Audit the failure (best effort: a busy lock just skips the row).
    try {
      withLock((): PresenceReply => { appendRows(tab('uploads'), 'uploads', [[nextAt(), me, 'error', bytes, msg]]); return { ok: true }; });
    } catch { /* the reply matters more than the audit row */ }
    return fail('bad_request', msg);
  }
  return withLock((): IngestReply => {
    const at = nextAt();
    const mSheet = tab('metrics');
    const latest = new Map<string, number>();
    for (const r of readRows(mSheet, 'metrics')) {
      const k = `${text(r[1])}|${text(r[2], 'date')}|${text(r[3])}`;
      const v = num(r[4]);
      if (v !== null && v > (latest.get(k) ?? -Infinity)) latest.set(k, v);
    }
    const newMetrics: unknown[][] = [];
    for (const m of parsed.metrics) {
      const k = `${me}|${m.date}|${m.metric}`;
      const cur = latest.get(k);
      if (cur === undefined || m.value > cur) {
        newMetrics.push([at, me, m.date, m.metric, m.value]);
        latest.set(k, m.value);
      }
    }

    const wSheet = tab('workouts');
    const seen = new Set<string>();
    if (parsed.workouts.length) for (const r of readRows(wSheet, 'workouts')) seen.add(`${text(r[1])}|${text(r[2])}`);
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
      parsed.skipped ? `${parsed.skipped} items skipped` : '',
      parsed.unknownTypes.length ? `unknown workout types: ${parsed.unknownTypes.join(', ')}` : ''
    ].filter(Boolean).join('; ');
    appendRows(tab('uploads'), 'uploads', [[at, me, parsed.skipped ? 'partial' : 'ok', bytes, notes.slice(0, 300)]]);

    return {
      ok: true, metrics: newMetrics.length, workouts: newWorkouts.length,
      ...(parsed.skipped ? { skipped: parsed.skipped } : {}),
      ...(parsed.unknownTypes.length ? { unknownTypes: parsed.unknownTypes } : {})
    };
  });
}

function presence(me: PersonId, body: Rec): PresenceReply {
  const place = typeof body.place === 'string' ? body.place.trim() : '';
  if (!place || place.length > 100) return fail('bad_request');
  if (body.event !== 'arrive' && body.event !== 'leave') return fail('bad_request');
  let eventAt: string | null = null;
  if (body.at !== undefined && body.at !== null && body.at !== '') {
    const iso = looseDate(body.at);
    if (!iso) return fail('bad_request');
    eventAt = new Date(Date.parse(iso)).toISOString();
  }
  const ev = body.event;
  return withLock((): PresenceReply => {
    const at = nextAt();
    appendRows(tab('presence'), 'presence', [[at, me, place, ev, eventAt ?? at]]);
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
  if (!validEditData(body.type, data)) return fail('bad_request');
  const type = body.type;
  return withLock((): EventReply => {
    const sh = tab('events');
    const last = sh.getLastRow();
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
 * Shape checks for the edit events (history-and-editing.md §4.1). Only the shape: who may edit what and which weeks
 * are still open stay read-time rules in the model (`model/state.ts`), so the sheet stays a dumb log.
 */
function validEditData(type: string, d: Rec): boolean {
  switch (type) {
    case 'metric_set':
      return typeof d.date === 'string' && DATE_RE.test(d.date) && isMetricKey(d.metric) &&
        isInt(d.value, 0, METRIC_BOUNDS[d.metric]);
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
    case 'transfer_undo':
      return typeof d.month === 'string' && MONTH_RE.test(d.month);
    default:
      return true;
  }
}

/**
 * A row's server `at` as ISO UTC with milliseconds, so it compares as text with `since`. Defensive against a
 * hand-pasted `at` (a Date cell, no milliseconds, another offset or none: Tokyo); unreadable text is kept as is.
 */
function instant(v: unknown): string {
  const s = text(v, 'at');
  try {
    return new Date(parseInstant(s)).toISOString();
  } catch {
    return s;
  }
}

function snapshot(me: PersonId, body: Rec): SnapshotReply {
  if (body.since !== undefined && body.since !== null && typeof body.since !== 'string') return fail('bad_request');
  const since = typeof body.since === 'string' && body.since ? instant(body.since) : '';
  return withLock((): SnapshotReply => {
    const pick = (name: TabName, row: (r: unknown[], at: string) => unknown[]) =>
      readRows(tab(name), name).map((r) => [r, instant(r[0])] as const).filter(([, at]) => at > since).map(([r, at]) => row(r, at));
    const rows = {
      metrics: pick('metrics', (r, at) => [at, text(r[1]), text(r[2], 'date'), text(r[3]), num(r[4]) ?? 0]),
      workouts: pick('workouts', (r, at) => [
        at, text(r[1]), text(r[2]), text(r[3], 'date'), text(r[4]), text(r[5], 'at'), text(r[6], 'at'), num(r[7]) ?? 0, num(r[8])
      ]),
      presence: pick('presence', (r, at) => [at, text(r[1]), text(r[2]), text(r[3]), text(r[4], 'at')]),
      events: pick('events', (r, at) => [at, text(r[1]), text(r[2]), text(r[3]), text(r[4])])
    } as SnapshotRows;
    return { ok: true, me, now: new Date().toISOString(), rows };
  });
}
