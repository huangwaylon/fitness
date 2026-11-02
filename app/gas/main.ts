// Island Fund web app: the only reader and writer of the bound *Island Fund* spreadsheet (docs/backend.md). Bundled by `npm run gas:build` into app/apps-script/Code.js.
//
// CRITICAL: `doPost` must never throw. An uncaught error returns Google's HTML error page, which the client cannot
// tell apart from a network blip. Every reply is JSON: {ok:true, …} or {ok:false, error}.
//
// Never read `e.parameter`: a key in the query string lands in Google's request logs. Keys go in the body only.
// There is deliberately no `doGet`.
import { parseShortcut } from './parse.ts';
import { auditNotes, auditRow } from './audit.ts';
import { jstMs, parseInstant, ZONE_OFFSET_MS } from '../src/lib/time/dates.ts';
import { decorAccept, decorOpOf, type DecorEntry } from '../src/lib/contract/decor.ts';
import { tentAccept, tentOpOf, type TentEntry } from '../src/lib/contract/tent.ts';
import type { PersonId } from '../src/lib/types.ts';
import { validEventData } from '../src/lib/contract/record.ts';
import {
  eventSubject, EVENT_TYPES, isId, isMetricKey, isPersonId, isRec, NUMERIC_COLUMNS, TABS,
  type ApiError, type EventReply, type Fail, type HealthReply, type IngestReply, type SnapshotReply, type SnapshotRows,
  type TabName, type UploadsReply, type WhoamiReply
} from '../src/lib/contract/api.ts';
import type { Notice, NoticeWhat } from '../src/lib/sync/live-protocol.ts';

/** Set by `npm run gas:build` (a hash of the bundle); `dev` when main.ts runs unbundled (tests). */
declare const __BUILD__: string | undefined;
const BUILD: string = typeof __BUILD__ === 'string' ? __BUILD__ : 'dev';

export const MAX_BODY_CHARS = 1_000_000;
export const RATE_PER_MINUTE = 120;
const LOCK_WAIT_MS = 10_000;
const MIN_KEY_CHARS = 32;
/** Keys are `openssl rand -hex 32`; anything else is refused before any Properties read. */
const KEY_RE = /^[0-9a-fA-F]{32,128}$/;
/** How long the keys stay in CacheService. A rotated key keeps working for at most this long (docs/ops/runbook.md §4). */
export const KEY_CACHE_SECONDS = 300;
/** Tabs whose rows the client caches; a hand change to any of them bumps `REV`. */
const SYNCED_TABS = ['metrics', 'events'] as const satisfies readonly TabName[];
const MAX_EVENT_DATA_CHARS = 20_000;
/** `readTail` reads a tab backwards in chunks of this many rows, doubling each time. */
const TAIL_CHUNK = 256;
const DAY_MS = 86400_000;
/** The live relay's push endpoint (docs/backend.md#push). */
export const RELAY_NOTIFY_URL = 'https://island-fund-relay.island-fund-relay.workers.dev/notify';
/** What the notify secret signs; the relay derives the same (relay/src/notify.ts). */
const NOTIFY_LABEL = 'island-relay-notify/1';
/** After a notify that didn't land (no external-request scope yet, the relay down), none are tried for this long. */
export const NOTIFY_PAUSE_SECONDS = 600;

/** Every reply is one of the client contract's shapes (src/lib/contract/api.ts), so the server is compile-checked against it. */
type Reply = IngestReply | EventReply | SnapshotReply | WhoamiReply | HealthReply;
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
  // Keyless liveness and version probe for the monitor (docs/ops/runbook.md §3): no Properties, no lock, no sheet.
  if (body.action === 'health' && body.key === undefined) return { ok: true, build: BUILD };

  const me = personFor(body.key);
  if (!me) return fail('unauthorized');
  if (!underRateLimit(me)) return fail('busy');

  wrote = null;
  switch (body.action) {
    case 'ingest': return pushed(me, 'ingest', ingest(me, body, typeof post?.length === 'number' ? post.length : text.length));
    case 'event': return pushed(me, 'event', event(me, body));
    case 'snapshot': return snapshot(me, body);
    case 'uploads': return uploads(me);
    case 'whoami': return withLock((): WhoamiReply => { for (const t of Object.keys(TABS) as TabName[]) heal(tab(t), t); return { ok: true, me, build: BUILD }; });
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
function withLock<R>(fn: () => R): R | Fail {
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
 * - `TAILS`: JSON `{tab: at}`, the `at` of the last row this script appended to each synced tab.
 * - `REV`: the data revision (docs/backend.md#revision). Changes when the synced tabs were changed by hand.
 */
interface ServerState {
  lastAt: number;
  rows: Partial<Record<TabName, number>>;
  tails: Partial<Record<TabName, string>>;
  rev: string;
  revChanged: boolean;
  dirty: boolean;
}
let state: ServerState | null = null;

const newRev = (): string => `${Date.now().toString(36)}${Math.floor(Math.random() * 36 ** 4).toString(36).padStart(4, '0')}`;

/** A JSON object property, `{}` when unset or unreadable (it is re-learnt). */
function record(v: string | undefined): Rec {
  try {
    const r = JSON.parse(v ?? '{}');
    return isRec(r) ? r : {};
  } catch {
    return {};
  }
}

function loadState(): ServerState {
  const p = PropertiesService.getScriptProperties().getProperties();
  const rev = p.REV || newRev();
  return {
    lastAt: Date.parse(p.LAST_AT ?? '') || 0, rows: record(p.ROWS), tails: record(p.TAILS), rev, revChanged: !p.REV, dirty: !p.REV
  } as ServerState;
}

function saveState(st: ServerState): void {
  if (!st.dirty) return;
  const out: Record<string, string> = { ROWS: JSON.stringify(st.rows), TAILS: JSON.stringify(st.tails) };
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
 * by hand (or the tab was recreated), so cached clients can't catch up with `since`: bump `REV` and put the tab's
 * layout right (`heal`). The first sight of a tab (no `ROWS` entry yet) only learns it. True when the tab is exactly
 * as this script left it.
 */
function noteRows(sh: GAS.Sheet, name: TabName, lastRow: number): boolean {
  if (!(SYNCED_TABS as readonly string[]).includes(name)) return false;
  const st = current();
  const known = st.rows[name];
  if (known === lastRow) return true;
  if (known !== undefined) {
    st.rev = newRev();
    st.revChanged = true;
    heal(sh, name);
  }
  st.rows[name] = lastRow;
  st.dirty = true;
  return false;
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

// ---------------------------------------------------------------- the push to the live relay

/** The newest synced row this request appended, and the revision then (null: it wrote none). */
let wrote: { at: string; rev: string } | null = null;

/** After a write that appended synced rows, tell the relay (outside the lock), so open phones fetch at once. */
function pushed<R extends { ok: boolean }>(me: PersonId, what: NoticeWhat, reply: R): R {
  const w = wrote;
  wrote = null;
  if (reply.ok && w) notifyRelay({ what, who: me, at: w.at, rev: w.rev });
  return reply;
}

const hex = (bytes: number[]): string => bytes.map((b) => ((b + 256) % 256).toString(16).padStart(2, '0')).join('');

/**
 * POST the notice to the relay, signed (relay/src/notify.ts): secret = HMAC-SHA256(key "<KEY_A>:<KEY_B>", NOTIFY_LABEL),
 * signature = HMAC-SHA256(key secret, "<ms>.<body>"). A phone holds only its own key, so only the two servers can sign.
 * Best effort and never throws: the phones still poll. Until the script has the external-request scope, UrlFetchApp
 * throws; that (or any reply but 204) pauses notifying for NOTIFY_PAUSE_SECONDS, so a write pays for one cache read.
 * Returns the relay's status, or 0 when nothing was sent.
 */
function notifyRelay(n: Notice): number {
  let cache: GAS.Cache | null = null;
  try {
    cache = CacheService.getScriptCache();
    if (cache.get('relay:pause')) return 0;
    const { a, b } = keys();
    if (!a || !b) return 0;
    const secret = hex(Utilities.computeHmacSha256Signature(NOTIFY_LABEL, `${a.trim().toLowerCase()}:${b.trim().toLowerCase()}`));
    const body = JSON.stringify(n);
    const t = String(Date.now());
    const code = UrlFetchApp.fetch(RELAY_NOTIFY_URL, {
      method: 'post', contentType: 'application/json', payload: body, muteHttpExceptions: true, followRedirects: false,
      headers: { 'X-Island-Time': t, 'X-Island-Sig': hex(Utilities.computeHmacSha256Signature(`${t}.${body}`, secret)) }
    }).getResponseCode();
    if (code !== 204) cache.put('relay:pause', String(code), NOTIFY_PAUSE_SECONDS);
    return code;
  } catch {
    try { cache?.put('relay:pause', 'error', NOTIFY_PAUSE_SECONDS); } catch { /* best effort */ }
    return 0;
  }
}

/**
 * Run once from the script editor after adding the `script.external_request` scope (docs/ops/runbook.md#11-turn-on-the-push):
 * Google asks for the permission, then this sends a notice (nothing new: the phones' fetch finds no rows) and logs the
 * relay's answer, 204 when the push works.
 */
export function authorizeRelay(): void {
  try { CacheService.getScriptCache().remove('relay:pause'); } catch { /* best effort */ }
  const p = PropertiesService.getScriptProperties().getProperties();
  const at = new Date(Date.parse(p.LAST_AT ?? '') || Date.now()).toISOString();
  console.log(`relay notify: ${notifyRelay({ what: 'event', who: 'A', at, rev: p.REV || 'none' })} (204 = the push works)`);
}

// ---------------------------------------------------------------- sheet helpers

function tab(name: TabName): GAS.Sheet {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) heal((sh = ss.insertSheet(name)), name);
  return sh;
}

/** A column's number format: plain text, so Sheets never turns a pasted or written date into a Date, or a number. */
const formatOf = (name: TabName, col: string): string => (NUMERIC_COLUMNS[name].includes(col) ? '0.##' : '@');

/**
 * Put a tab's layout right: TABS' header in row 1 (bold, frozen; any column right of it unlabelled) and each
 * column's format. Runs when the tab is made, on `whoami` (pairing) and when a hand change is noticed (`noteRows`).
 */
function heal(sh: GAS.Sheet, name: TabName): void {
  const cols = TABS[name];
  const width = Math.max(sh.getLastColumn(), cols.length);
  const want = cols.concat(Array(width - cols.length).fill('') as never[]);
  const head = sh.getRange(1, 1, 1, width);
  if (head.getValues()[0].some((v, i) => String(v) !== want[i])) head.setValues([want]);
  sh.getRange(1, 1, 1, cols.length).setFontWeight('bold');
  sh.setFrozenRows(1);
  const max = sh.getMaxRows();
  cols.forEach((c, i) => sh.getRange(1, i + 1, max, 1).setNumberFormat(formatOf(name, c)));
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
  noteRows(sh, name, last);
  const chunks: unknown[][][] = [];
  for (let end = last, n = TAIL_CHUNK; end >= 2; n *= 2) {
    const first = Math.max(2, end - n + 1);
    const chunk = sh.getRange(first, 1, end - first + 1, TABS[name].length).getValues();
    chunks.unshift(chunk);
    end = first - 1;
    if (enough(chunk)) break;
  }
  if (chunks.length) learnTail(name, instant(chunks[chunks.length - 1].at(-1)![0]));
  return chunks.length === 1 ? chunks[0] : ([] as unknown[][]).concat(...chunks);
}

/** Remember the `at` of a synced tab's last row (`TAILS`), so a poll with nothing after it reads no rows. */
function learnTail(name: TabName, at: string): void {
  const st = current();
  if (!(SYNCED_TABS as readonly string[]).includes(name) || st.tails[name] === at) return;
  st.tails[name] = at;
  st.dirty = true;
}

/** `readTail`'s stop: the chunk starts at or before `at` (an ISO instant), so it holds every row after `at`. */
const reachesBack = (at: string) => (chunk: unknown[][]): boolean => instant(chunk[0][0]) <= at;

function appendRows(sh: GAS.Sheet, name: TabName, rows: unknown[][]): void {
  if (rows.length === 0) return;
  const cols = TABS[name];
  const last = sh.getLastRow();
  noteRows(sh, name, last);
  const start = Math.max(last, 1) + 1;
  const need = start + rows.length - 1 - sh.getMaxRows();
  if (need > 0) sh.insertRowsAfter(sh.getMaxRows(), need);
  const formats = cols.map((c) => formatOf(name, c));
  sh.getRange(start, 1, rows.length, cols.length).setNumberFormats(rows.map(() => formats)).setValues(rows);
  if ((SYNCED_TABS as readonly string[]).includes(name)) {
    const st = current();
    st.rows[name] = start + rows.length - 1;
    st.dirty = true;
    learnTail(name, text(rows[rows.length - 1][0]));
    wrote = { at: text(rows[rows.length - 1][0]), rev: st.rev };
  }
}

const isDate = (v: unknown): v is Date => Object.prototype.toString.call(v) === '[object Date]';

/** A cell as text. Defensive against hand-pasted rows that Sheets turned into Date cells. */
function text(v: unknown, kind: 'at' | 'date' | 'text' = 'text'): string {
  if (isDate(v)) {
    if (Number.isNaN(v.getTime())) return '';
    // Tokyo is UTC+9 with no DST; a pasted bare date is Tokyo midnight.
    return kind === 'date' ? new Date(v.getTime() + ZONE_OFFSET_MS).toISOString().slice(0, 10) : v.toISOString();
  }
  return v === null || v === undefined ? '' : String(v);
}

function num(v: unknown): number | null {
  if (v === '' || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

// ---------------------------------------------------------------- actions

const UPLOADS_SHOWN = 20;

/** The caller's last 20 ingest audit rows, newest first (docs/ops/runbook.md §6: what did the Shortcut send?). */
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

function ingest(me: PersonId, body: Rec, bytes: number): IngestReply {
  let parsed: ReturnType<typeof parseShortcut>;
  try {
    parsed = parseShortcut(body);
  } catch (err) {
    const msg = (err instanceof Error ? err.message : String(err)).slice(0, 300);
    // Audit the failure (best effort: a busy lock just skips the row).
    try {
      withLock(() => { appendRows(tab('uploads'), 'uploads', [auditRow(nextAt(), me, 'error', bytes, msg, body)]); });
    } catch { /* the reply matters more than the audit row */ }
    return fail('bad_request', msg);
  }
  // Rows about a day are only ever written from that day on (Health has no future), so every earlier row for the
  // body's days is after the day before its earliest one: a tail. One day of slack covers a
  // phone in a zone ahead of Tokyo. Each Shortcut run's 31-day body reads ~a month of rows, not the whole tab.
  const days = parsed.metrics.map((x) => x.date).sort();
  const from = days.length ? new Date(jstMs(days[0], 0, 0) - DAY_MS).toISOString() : '';
  return withLock((): IngestReply => {
    const at = nextAt();
    const mSheet = tab('metrics');
    // Every metric: Apple Health's current total is the truth, so a day's value is its LAST row so far, and any
    // different value is appended (up or down: a re-sync corrects an earlier value). The tail is in `at` order.
    const latest = new Map<string, number>();
    if (parsed.metrics.length) {
      for (const r of readTail(mSheet, 'metrics', reachesBack(from))) {
        const v = num(r[4]);
        if (v !== null) latest.set(`${text(r[1])}|${text(r[2], 'date')}|${text(r[3])}`, v);
      }
    }
    const newMetrics: unknown[][] = [];
    for (const m of parsed.metrics) {
      const k = `${me}|${m.date}|${m.metric}`;
      if (latest.get(k) !== m.value) {
        newMetrics.push([at, me, m.date, m.metric, m.value]);
        latest.set(k, m.value);
      }
    }

    appendRows(mSheet, 'metrics', newMetrics);
    const notes = auditNotes(parsed);
    appendRows(tab('uploads'), 'uploads', [auditRow(at, me, parsed.skipped ? 'partial' : 'ok', bytes, notes, body)]);

    return {
      ok: true, metrics: newMetrics.length,
      ...(parsed.skipped ? { skipped: parsed.skipped } : {}),
      ...(parsed.warnings.length ? { warnings: parsed.warnings } : {})
    };
  });
}

function event(me: PersonId, body: Rec): EventReply {
  const id = body.id;
  if (!isId(id)) return fail('bad_request');
  if (typeof body.type !== 'string' || !(EVENT_TYPES as readonly string[]).includes(body.type)) return fail('bad_request');
  // High-fives go over the relay only now (docs/backend.md#events). An older app still posts them: acknowledge it and
  // store nothing (no lock, no row, no notify), never `bad_request`, which that app would show as a failed save.
  if (body.type === 'highfive') return { ok: true };
  const data = body.data === undefined ? {} : body.data;
  if (!isRec(data)) return fail('bad_request');
  const json = JSON.stringify(data);
  if (json.length > MAX_EVENT_DATA_CHARS) return fail('too_large');
  // `person` (whose goal a `pref` sets): only `A` / `B`, only on the goal prefs.
  if (!eventSubject(body.type, data, me) || !validEventData(body.type, data, Date.now())) return fail('bad_request');
  const type = body.type;
  return withLock((): EventReply => {
    const sh = tab('events');
    const last = sh.getLastRow();
    noteRows(sh, 'events', last);
    // id, and for a void also type and data (columns 3–5); for a day row (a tally, an island day) also the person
    // (columns 2–5).
    // (a decor op also the person: columns 2–5, docs/backend.md#events `decor`)
    const daily = type === 'tally' || type === 'island' || type === 'decor';
    const rows = last >= 2 ? sh.getRange(2, daily ? 2 : 3, last - 1, type === 'spend_void' ? 3 : daily ? 4 : 1).getValues() : [];
    for (const r of rows) if (text(r[daily ? 1 : 0]) === id) return { ok: true, duplicate: true };
    if (type === 'decor') {
      const v = decorTarget(sh, rows, me, data);
      if (v === 'full') return fail('bad_request', data.sc === 't' ? 'tent full' : 'decor full');
      if (v === 'stale') return { ok: true, duplicate: true };
    } else if (daily) dropDaily(sh, rows, me, type, data.date as string);
    if (type === 'spend_void') {
      const v = voidTarget(rows, data.spendId as string);
      // A void must name a buy on the sheet; a second void of the same buy (the other phone got there first) changes
      // nothing, so it is acknowledged like a retry, not appended.
      if (v === 'missing') return fail('bad_request', 'no such spend');
      if (v === 'voided') return { ok: true, duplicate: true };
    }
    appendRows(sh, 'events', [[nextAt(), me, id, type, json]]);
    return { ok: true };
  });
}

/**
 * A tally and an island day are one row per person and day (docs/backend.md#tally, #shared-world): before the new one
 * is appended, delete `me`'s older rows of that `type` and `date`, from the events tab's `[person, id, type, data]`
 * rows (only rows whose data mentions the date are parsed). The rows below move up, still in `at` order, so a `since`
 * read stays a tail; the script records the new last row itself, so no revision bump. A phone that cached a deleted
 * row keeps it harmlessly: the model reads only a day's latest (model/tally.ts, model/state.ts islandDays).
 */
function dropDaily(sh: GAS.Sheet, rows: unknown[][], me: PersonId, type: string, date: string): void {
  const old: number[] = [];
  rows.forEach((r, i) => {
    if (text(r[2]) !== type || text(r[0]) !== me) return;
    const raw = text(r[3]);
    if (!raw.includes(date)) return;
    let d: unknown;
    try { d = JSON.parse(raw); } catch { return; }
    if (isRec(d) && d.date === date) old.push(i + 2);
  });
  if (!old.length) return;
  for (const row of old.reverse()) sh.deleteRow(row);
  const st = current();
  st.rows.events = sh.getLastRow();
  st.dirty = true;
}

/**
 * A `decor` op (contract/decor.ts) against the events tab's `[person, id, type, data]` rows, which hold each item's latest
 * op only: `stale` when a row of the same item beats it (a removal, or a later op: acknowledged, nothing appended),
 * `full` for a new item past DECOR_MAX (the tent's, `sc: 't'`: TENT_MAX, among the tent's own), else `append`, and the item's older rows are deleted first (the rows below move
 * up, still in `at` order, as a tally's). The sheet's decor stays one row per item ever placed.
 */
function decorTarget(sh: GAS.Sheet, rows: unknown[][], me: PersonId, d: Rec): 'append' | 'stale' | 'full' {
  // the island's ops and the tent's are kept apart (each its own ids, each its own cap)
  const tent = d.sc === 't';
  const parse = (x: Rec) => (tent ? tentOpOf(x) : decorOpOf(x));
  const e = { ...parse(d)!, who: me };
  const held: (DecorEntry | TentEntry)[] = [], at: number[] = [];
  rows.forEach((r, i) => {
    if (text(r[2]) !== 'decor' || !isPersonId(r[0])) return;
    let x: unknown;
    try { x = JSON.parse(text(r[3])); } catch { return; }
    const op = isRec(x) ? parse(x) : null;
    if (!op) return;
    held.push({ ...op, who: r[0] } as DecorEntry | TentEntry);
    at.push(i + 2);
  });
  const v = tent ? tentAccept(held as TentEntry[], e as TentEntry) : decorAccept(held as DecorEntry[], e as DecorEntry);
  if (v !== 'append') return v;
  const old = held.flatMap((h, i) => (h.id === e.id ? [at[i]] : []));
  if (!old.length) return v;
  for (const row of old.reverse()) sh.deleteRow(row);
  const st = current();
  st.rows.events = sh.getLastRow();
  st.dirty = true;
  return v;
}

/**
 * What a `spend_void` of `spendId` would undo, from the events tab's `[id, type, data]` rows: `missing` (no `spend` with
 * that id), `voided` (already undone) or `ok`. Only rows whose data mentions the id are parsed.
 */
function voidTarget(rows: unknown[][], spendId: string): 'missing' | 'voided' | 'ok' {
  let found = false;
  for (const r of rows) {
    const type = text(r[1]);
    if (type !== 'spend' && type !== 'spend_void') continue;
    const raw = text(r[2]);
    if (!raw.includes(spendId)) continue;
    let d: unknown;
    try { d = JSON.parse(raw); } catch { continue; }
    if (!isRec(d) || d.spendId !== spendId) continue;
    if (type === 'spend_void') return 'voided';
    found = true;
  }
  return found ? 'ok' : 'missing';
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
    // With `since`, only the tail after it is read (a poll reads a few hundred rows, not years of them), and nothing at
    // all when the tab is as this script left it and its last row is not after `since` (most polls).
    const pick = (name: TabName, keep: (r: unknown[]) => boolean, row: (r: unknown[], at: string) => unknown[]) => {
      const sh = tab(name);
      const tail = current().tails[name];
      if (since && tail && tail <= since && noteRows(sh, name, sh.getLastRow())) return [];
      return (since ? readTail(sh, name, reachesBack(since)) : readRows(sh, name))
        .map((r) => [r, instant(r[0])] as const).filter(([r, at]) => at > since && keep(r)).map(([r, at]) => row(r, at));
    };
    // Only what the client reads: rows of an event type or metric it doesn't know never leave the sheet.
    const rows = {
      metrics: pick('metrics', (r) => isPersonId(r[1]) && isMetricKey(r[3]), (r, at) => [at, r[1], text(r[2], 'date'), r[3], num(r[4]) ?? 0]),
      events: pick('events', (r) => isPersonId(r[1]) && (EVENT_TYPES as readonly unknown[]).includes(r[3]), (r, at) => [at, r[1], text(r[2]), r[3], text(r[4])])
    } as SnapshotRows;
    return { ok: true, me, now: new Date().toISOString(), rev: current().rev, rows };
  });
}
