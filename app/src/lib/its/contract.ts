// The ITS booker's contract (its/README.md): the settings the app's 保養所ボット page edits, what the runner reports,
// the bookings record and the status the page reads. The Worker (its/worker) owns the rules and imports this file; the
// app reads it; the Python runner (its/runner/remote.py) mirrors it by hand. Both languages test against
// its/contract-example.json and its/norm-cases.json, so change all four together. Dependency-free.

// ---- Settings (the page edits; PUT /its/settings) ----

/** Seconds between scan cycles (the runner's RETRY_DELAY). 15 s is the floor: the site's ~24 h IP bans come from the
 *  scan's request rate (its/SITE.md §2). */
export const INTERVALS_SEC = [15, 30, 60, 120, 300] as const;
export type IntervalSec = (typeof INTERVALS_SEC)[number];

export const MAX_DATES = 20;
export const MAX_DAYS_AHEAD = 400;  // a date further than this from today (Tokyo) is refused
/** @public (its/worker) */
export const MAX_HOTELS = 80;       // per list (skip, priority)
/** @public (its/worker) */
export const MAX_NAME = 80;         // a hotel name or priority substring, in characters
export const GUESTS_MIN = 1;
export const GUESTS_MAX = 6;

/** Who changed something: a member (the guest's key is refused). */
export type Member = 'A' | 'B';

export interface ItsSettings {
  v: 1;
  /** Stopped (the page's 停止, POST /its/run): no scanning; a running runner exits at its next safe point. */
  paused: boolean;
  intervalSec: IntervalSec;
  /** Stays to look for (the night of arrival), YYYY-MM-DD, sorted, unique. Dates before today (Tokyo) are dropped. */
  dates: string[];
  guests: number;
  /** Facilities never booked: exact match after normName on both sides. Skipping wins over priority. */
  skip: string[];
  /** Substrings tried first, in this order (the race, not a preference: one hotel is booked at a time). */
  priority: string[];
  /** Run the emailed leg (申込する → 確認) unattended, only for dates ≥ AUTO_CONFIRM_MIN_DAYS away. Off: a hold is taken
   *  and the site's mail is finished by hand. */
  autoConfirm: boolean;
  updatedAt: number | null;   // ms since epoch, the Worker's clock
  updatedBy: Member | null;
}

/** `PUT /its/settings`'s body: the editable fields (paused is POST /its/run's) and the `updatedAt` the edit started
 *  from; a different current `updatedAt` is a 409 with the current status (someone else saved). */
export type ItsSettingsInput = Omit<ItsSettings, 'v' | 'paused' | 'updatedAt' | 'updatedBy'> & { baseUpdatedAt: number | null };

/** @public (its/worker) */
export const DEFAULT_SETTINGS: ItsSettings = {
  v: 1, paused: true, intervalSec: 15, dates: [], guests: 2, skip: [], priority: [], autoConfirm: false, updatedAt: null, updatedBy: null,
};

/** `POST /its/run`: start (clear paused and dispatch a run now) or stop (set paused). Applies at once. */
export interface RunInput { action: 'start' | 'stop' }

/** Never auto-confirm a stay nearer than this many days (free web cancellation ends at D−10). Mirrors the runner's
 *  config.AUTO_CONFIRM_MIN_DAYS. */
export const AUTO_CONFIRM_MIN_DAYS = 11;

// ---- Bookings (the record: the Worker's, append-only) ----

/** One application step, never overwritten: `hold` (the 30-min hold taken and the mail sent: it also stops a second
 *  application at that facility for that date, forever), `confirming` (written *before* Chrome's 申込する: no ack, no
 *  commit), `confirmed` (予約確定, with the 申込受付番号: a real cancellation liability), `failed` (the leg ended without
 *  a number: a person must look). */
export type BookingKind = 'hold' | 'confirming' | 'confirmed' | 'failed';
export const BOOKING_KINDS: readonly BookingKind[] = ['hold', 'confirming', 'confirmed', 'failed'];

export interface BookingEntry {
  id: string;          // `${runId}:${seq}`, the runner's; the Worker ignores a repeat (idempotent retries)
  kind: BookingKind;
  date: string;        // the stay, YYYY-MM-DD
  hotel: string;
  number?: string;     // 申込受付番号, on `confirmed`
  at: number;          // the Worker's receive time (ms)
  runId: string;
}

/** `POST /runner/bookings`'s body: entries without the Worker's `at`. @public (its/worker) */
export type BookingInput = Omit<BookingEntry, 'at'>;

/** Entries are kept until their stay is more than BOOKINGS_KEEP_DAYS past (reservations are liabilities until then). @public (its/worker) */
export const BOOKINGS_KEEP_DAYS = 60;

// ---- Runner ↔ Worker (Bearer ITS_RUNNER_TOKEN) ----

/** `POST /runner/claim {runId, host}`: the lease, granted when it's free, expired, or already this runId's; renewed by
 *  every report; released by a `run_end` report. A runner that hasn't renewed within LEASE_SEC − 60 s takes no hold
 *  and files no application (it may keep scanning). @public (its/worker) */
export const LEASE_SEC = 300;
/** @public (its/worker) */
export interface Lease { holder: string; host: Host; until: number }
/** @public (its/worker) */
export type Host = 'actions' | 'local';
/** @public (its/worker) */
export interface ClaimInput { runId: string; host: Host }
/** @public (its/worker) */
export type ClaimReply = { ok: true; lease: Lease; config: RunnerConfig } | { ok: false; lease: Lease };

export type EventKind =
  | 'run_start'      // a runner started (`detail`: schedule, dispatch, local)
  | 'run_end'        // it stopped (`detail`: time_up, paused, no_dates, mode_off, ban, lease_lost, error)
  | 'available'      // a target date's offered facilities changed (`hotel`: the names offered, ' / '-joined)
  | 'filtered'       // every facility offered was skipped or already held (sent when that set changes)
  | 'hold'           // a 30-minute hold was taken and the site's mail sent
  | 'confirmed'      // 予約確定 (`detail`: the 申込受付番号)
  | 'human_needed'   // a hold that needs a person (`detail`: why: near_date, auto_off, no_mail, leg_failed, bookings_unsynced, …)
  | 'ban'            // a 503 セキュリティアラート: ~24 h IP ban on this runner's address
  | 'solve_failed'   // Turnstile not solved this time
  | 'error';         // anything else worth a look (`detail`: short, no tokens, no personal data)
export const EVENT_KINDS: readonly EventKind[] = ['run_start', 'run_end', 'available', 'filtered', 'hold', 'confirmed', 'human_needed', 'ban', 'solve_failed', 'error'];
/** Never evicted by the routine ones: the ring keeps the last EVENTS_KEPT of each class. @public (its/worker) */
export const IMPORTANT_EVENTS: readonly EventKind[] = ['hold', 'confirmed', 'human_needed', 'ban'];
/** @public (its/worker) */
export const EVENTS_KEPT = 40;

export interface ItsEvent {
  runId: string;
  seq: number;       // per run, from 1; the Worker ignores a (runId, seq) it has
  t: number;         // the Worker's receive time (ms)
  kind: EventKind;
  date?: string;
  hotel?: string;
  detail?: string;   // ≤ 200 characters
}
/** @public (its/worker) */
export type EventInput = Omit<ItsEvent, 't' | 'runId'>;

/** @public (its/worker) */
export type Phase = 'starting' | 'solving' | 'scanning' | 'draining' | 'stopping';

/** The last thing that went wrong, for diagnosis from the page without the private log. @public (its/worker) */
export interface LastError {
  at: number;        // the runner's clock (ms)
  step: string;      // e.g. calendar_get, calendar_select, empty_create, solve, imap, worker
  status: number | null;   // HTTP status (0: transport failure) or null
  cls: string;       // the error class or outcome code (timeout, session_dead, http_503, …)
}

/** `POST /runner/report` (heartbeat every REPORT_EVERY_SEC while running, and at once after an important event).
 *  Counters are since the run started. @public (its/worker) */
export interface RunnerReport {
  v: 1;
  runId: string;               // GITHUB_RUN_ID, or a local id
  runUrl: string | null;       // the Actions run's page
  sha: string | null;          // the code's commit
  host: Host;
  startedAt: number;
  deadline: number | null;     // when it stops taking holds (bounded runs)
  phase: Phase;
  scans: number;               // calendar reads
  scanFailures: number;        // consecutive failed reads now
  lastScanAt: number | null;
  lastOkAt: number | null;
  solves: { ok: number; failed: number; lastOkAt: number | null; lastSecs: number | null; lastSpot: 'centre' | 'left' | null };
  failuresByStep: Record<string, number>;
  lastError: LastError | null;
  unsynced: number;            // bookings entries not yet acknowledged by the Worker
  events: EventInput[];        // new since the last acknowledged report
  seen: string[];              // facility names the site offered this run
}
/** @public (its/worker) */
export const REPORT_EVERY_SEC = 30;

/** `GET /runner/config`, and the answer to claim/report: the latest settings (applied at the next cycle), the
 *  record, the lease, and whether to stop (paused, MODE off, no future date, or the lease is someone else's). @public (its/worker) */
export interface RunnerConfig {
  settings: ItsSettings;
  bookings: BookingEntry[];
  lease: Lease | null;
  stop: boolean;
  stopReason: 'paused' | 'mode_off' | 'no_dates' | 'lease_lost' | null;
  ackSeq: number;              // the highest event seq the Worker has for this runId
}

// ---- Status (GET /its/status, members) ----

export type Verdict = 'healthy' | 'starting' | 'idle' | 'degraded' | 'failing' | 'late' | 'stopped' | 'off';
export type Reason =
  | 'mode_off'        // the Worker's MODE = off
  | 'paused'          // stopped from the page
  | 'no_dates'        // no future date to look for
  | 'dispatch_failed' // 開始's GitHub dispatch was refused (the schedule still starts one)
  | 'starting'        // dispatched or scheduled, no report yet (within START_GRACE_SEC)
  | 'never_ran'       // no runner has reported yet
  | 'runner_silent'   // no report for LATE_AFTER_SEC while it should be running
  | 'banned'          // the last run hit the 503 ban (clears at the next good scan)
  | 'scan_failing'    // 3+ failed reads in a row
  | 'solve_failing'   // the last 3 solves failed
  | 'unsynced'        // the runner holds bookings the Worker hasn't got
  | 'human_needed';   // a hold or a failed leg waits for a person
export const REASONS: readonly Reason[] = ['mode_off', 'paused', 'no_dates', 'dispatch_failed', 'starting', 'never_ran', 'runner_silent', 'banned', 'scan_failing', 'solve_failing', 'unsynced', 'human_needed'];
/** Runs start every 30 min (schedule) and last ~5.5 h; silence past this while not stopped is `late`. */
export const LATE_AFTER_SEC = 45 * 60;
/** @public (its/worker) */
export const START_GRACE_SEC = 10 * 60;

export interface ItsStatus {
  v: 1;
  now: number;
  mode: 'on' | 'off';
  sha: string | null;          // the Worker's commit
  verdict: Verdict;
  reasons: Reason[];           // every reason that applies, in REASONS order; verdict = the first's
  settings: ItsSettings;
  /** The last report (null before any), with the Worker's receive time. */
  runner: (Omit<RunnerReport, 'v' | 'events' | 'seen'> & { lastSeen: number }) | null;
  lease: Lease | null;
  dispatch: { at: number; ok: boolean; status: number | null } | null;
  bookings: BookingEntry[];    // newest first
  events: ItsEvent[];          // newest first
  seen: string[];              // every facility name ever offered, sorted
}

// ---- Validation, shared by the Worker and the page ----

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
// C0/C1 controls and the bidi overrides/isolates: never in a name the Worker logs or the page shows
const BAD_CHARS = /[\u0000-\u001f\u007f-\u009f\u200e\u200f\u202a-\u202e\u2066-\u2069]/;

/** A real calendar date (2026-02-30 is not). */
export function isDate(s: unknown): s is string {
  if (typeof s !== 'string' || !DATE_RE.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

/** Today in Tokyo (the site's calendar), YYYY-MM-DD, whatever the phone's zone. */
export function tokyoToday(nowMs: number): string {
  return new Date(nowMs + 9 * 3600_000).toISOString().slice(0, 10);
}

/** Whole days from Tokyo's today to `date` (0 = tonight). */
export function daysUntil(date: string, nowMs: number): number {
  return Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${tokyoToday(nowMs)}T00:00:00Z`)) / 86_400_000);
}

/** A hotel name as the runner compares it (book_hotels._norm_hotel, less its HTML unescape: typed names carry no
 *  entities; its/norm-cases.json pins both): NFKC, which folds the compatibility ideographs the site serves
 *  (祥 U+FA1A), every whitespace removed, lower-cased (casefold for these scripts). */
export function normName(s: string): string {
  return s.normalize('NFKC').replace(/\s+/g, '').toLowerCase();
}

function names(x: unknown): string[] | null {
  if (!Array.isArray(x) || x.length > MAX_HOTELS) return null;
  const out: string[] = [];
  const seen = new Set<string>();
  for (const n of x) {
    if (typeof n !== 'string' || BAD_CHARS.test(n)) return null;
    const t = n.replace(/\s+/g, ' ').trim();
    if (!t || t.length > MAX_NAME) return null;
    const k = normName(t);
    if (!seen.has(k)) { seen.add(k); out.push(t); }
  }
  return out;
}

export type SettingsError = 'bad_shape' | 'bad_interval' | 'bad_date' | 'past_date' | 'far_date' | 'too_many_dates' | 'bad_guests' | 'bad_hotels';

/** Checks a `PUT /its/settings` body against today in Tokyo: dates come back sorted and unique (past ones refused, so
 *  a stale draft can't resurrect one), names trimmed and de-duplicated by normName, a skipped name dropped from
 *  priority (skipping wins). */
export function parseSettingsInput(x: unknown, nowMs: number): { ok: true; value: ItsSettingsInput } | { ok: false; error: SettingsError } {
  if (typeof x !== 'object' || x === null || Array.isArray(x)) return { ok: false, error: 'bad_shape' };
  const o = x as Record<string, unknown>;
  if (typeof o.autoConfirm !== 'boolean') return { ok: false, error: 'bad_shape' };
  if (o.baseUpdatedAt !== null && !(typeof o.baseUpdatedAt === 'number' && Number.isFinite(o.baseUpdatedAt))) return { ok: false, error: 'bad_shape' };
  if (!INTERVALS_SEC.includes(o.intervalSec as IntervalSec)) return { ok: false, error: 'bad_interval' };
  if (!Array.isArray(o.dates) || !o.dates.every(isDate)) return { ok: false, error: 'bad_date' };
  const dates = [...new Set(o.dates as string[])].sort();
  if (dates.length > MAX_DATES) return { ok: false, error: 'too_many_dates' };
  if (dates.some((d) => daysUntil(d, nowMs) < 0)) return { ok: false, error: 'past_date' };
  if (dates.some((d) => daysUntil(d, nowMs) > MAX_DAYS_AHEAD)) return { ok: false, error: 'far_date' };
  if (!Number.isInteger(o.guests) || (o.guests as number) < GUESTS_MIN || (o.guests as number) > GUESTS_MAX) return { ok: false, error: 'bad_guests' };
  const skip = names(o.skip);
  const pri = names(o.priority);
  if (!skip || !pri) return { ok: false, error: 'bad_hotels' };
  const skipped = new Set(skip.map(normName));
  const priority = pri.filter((p) => !skipped.has(normName(p)));
  return { ok: true, value: { intervalSec: o.intervalSec as IntervalSec, dates, guests: o.guests as number, skip, priority, autoConfirm: o.autoConfirm, baseUpdatedAt: o.baseUpdatedAt as number | null } };
}
