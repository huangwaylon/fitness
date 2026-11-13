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
/** The allow-list's cap (`search`): every facility the site may offer, the roster and the seen names. @public (its/worker) */
export const MAX_SEARCH = 200;
/** @public (its/worker) */
export const MAX_NAME = 80;         // a priority substring, in characters
/** A facility name as the site serves it (a booking's `hotel`, a seen name, a skipped name: matched whole, so never
 *  truncated), in characters. @public (its/worker) */
export const MAX_SITE_NAME = 200;
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
  /** Facilities never booked: exact match after normName on both sides. Skipping wins over priority and `search`. */
  skip: string[];
  /** The allow-list (the page's 探す): present, only these facilities are eligible (exact match after normName, as
   *  `skip`; a name in both is skipped), so a facility the site starts offering is not searched until a member switches
   *  it on. Absent (settings saved by an older page, or never): the skip-list rule, every facility not skipped. A PUT
   *  without it keeps the saved list (an older page doesn't know it); `[]` searches nothing. */
  search?: string[];
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

/** `POST /its/run`: start (clear paused and dispatch a run now) or stop (set paused). Applies at once; answers the
 *  status. */
export interface RunInput { action: 'start' | 'stop' }

/** Never auto-confirm a stay nearer than this many days (free web cancellation ends at D−10). Mirrors the runner's
 *  config.AUTO_CONFIRM_MIN_DAYS. */
export const AUTO_CONFIRM_MIN_DAYS = 11;

/** The site's hold: a 仮押さえ lapses this long after it was taken (a booking `hold`'s `at`, the Worker's receive time,
 *  is a few seconds late), free of charge. The runner's confirm leg and the page's deadline use it. @public (its/worker) */
export const HOLD_SEC = 1800;

// ---- Bookings (the record: the Worker's, append-only) ----

/** One application step, never overwritten: `hold` (the 30-min hold taken and the mail sent: it also stops a second
 *  application at that facility for that date, forever), `confirming` (written *before* Chrome's 申込する: no ack, no
 *  commit), `confirmed` (予約確定, with the 申込受付番号: a real cancellation liability), `failed` (the leg ended without
 *  a number: a person must look). A stay with a `confirmed` entry is done: the runner looks for that night no more (it
 *  is still in `dates` until a member removes it; the page says so on the date). */
export type BookingKind = 'hold' | 'confirming' | 'confirmed' | 'failed';
export const BOOKING_KINDS: readonly BookingKind[] = ['hold', 'confirming', 'confirmed', 'failed'];

export interface BookingEntry {
  /** `${runId}:${seq}`, the runner's (isId). The same id with the same content is a retry (ignored); with another kind,
   *  date, hotel, number or runId it is refused whole: 409 `{ok: false, error: 'id_conflict'}`. */
  id: string;
  kind: BookingKind;
  date: string;        // the stay, YYYY-MM-DD
  hotel: string;       // as the site serves it, ≤ MAX_SITE_NAME (never truncated)
  number?: string;     // 申込受付番号, on `confirmed`
  at: number;          // the Worker's receive time (ms)
  runId: string;
}

/** `POST /runner/bookings[?runId=]`'s body: ≤ MAX_BOOKINGS_PER_POST entries without the Worker's `at`; answers a
 *  RunnerConfig. Refused whole: 409 `id_conflict` (above); 507 `record_full` when the record is at its bound (entries
 *  that fit are kept, the rest are not: the runner keeps them unsynced and retries). @public (its/worker) */
export type BookingInput = Omit<BookingEntry, 'at'>;

/** Entries are kept until their stay is more than BOOKINGS_KEEP_DAYS past (reservations are liabilities until then). @public (its/worker) */
export const BOOKINGS_KEEP_DAYS = 60;

// ---- Runner ↔ Worker (Bearer ITS_RUNNER_TOKEN) ----

/** A run's id: `${GITHUB_RUN_ID}-${GITHUB_RUN_ATTEMPT}` on Actions (a re-run is a new id), or a local one; also the shape
 *  of a step or an error class. `?runId=` on GET /runner/config and POST /runner/bookings names the asking run (for its
 *  ackSeq and lease_lost). @public (its/worker) */
export const ID_RE = /^[A-Za-z0-9._:-]{1,64}$/;
/** @public (its/worker) */
export const isId = (x: unknown): x is string => typeof x === 'string' && ID_RE.test(x);

/** The Worker's bounds on a request (the runner keeps under them): the body in bytes (413 past it), entries per post,
 *  events and seen names per report, an event's `hotel` (the offered names joined) and `detail`, a 申込受付番号,
 *  failuresByStep's keys. @public (its/worker) */
export const LIMITS = {
  body: 64 * 1024, bookingsPerPost: 50, eventsPerReport: 100, seenPerReport: 300, eventHotel: 2000, detail: 200, number: 40, steps: 30,
} as const;

/** `POST /runner/claim {runId, host}`: the lease, granted when it's free, expired, or already this runId's; renewed by
 *  every report; released by a `run_end` report. A runner that hasn't renewed within LEASE_SEC − 60 s takes no hold
 *  and files no application (it may keep scanning). @public (its/worker) */
export const LEASE_SEC = 300;
/** @public (its/worker) */
export interface Lease { holder: string; host: Host; until: number }
/** @public (its/worker) */
export type Host = 'actions' | 'local';
/** @public (its/worker) */
export const HOSTS: readonly Host[] = ['actions', 'local'];
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
  | 'error'          // anything else worth a look (`detail`: short, no tokens, no personal data)
  | 'prev_unclean';  // the Worker's own (seq 0, runId = the claiming run): a claim took over a lease its holder never
                     // released (`detail`: that run's id): it died or was cancelled mid-run; look at its log
export const EVENT_KINDS: readonly EventKind[] = ['run_start', 'run_end', 'available', 'filtered', 'hold', 'confirmed', 'human_needed', 'ban', 'solve_failed', 'error', 'prev_unclean'];
/** Never evicted by the routine ones: the ring keeps the last EVENTS_KEPT of each class. @public (its/worker) */
export const IMPORTANT_EVENTS: readonly EventKind[] = ['hold', 'confirmed', 'human_needed', 'ban', 'prev_unclean'];
/** @public (its/worker) */
export const EVENTS_KEPT = 40;

export interface ItsEvent {
  runId: string;
  seq: number;       // per run, from 1; the Worker ignores a (runId, seq) it has; 0: the Worker's own (prev_unclean)
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
/** @public (its/worker) */
export const PHASES: readonly Phase[] = ['starting', 'solving', 'scanning', 'draining', 'stopping'];

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
  runId: string;               // isId: `${GITHUB_RUN_ID}-${GITHUB_RUN_ATTEMPT}`, or a local id
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
  /** The `updatedAt` of the settings this run applies (null: the defaults, none received yet). Absent from an older
   *  runner. Older than the saved ones for SETTINGS_STALE_SEC: `settings_stale`. */
  settingsAt?: number | null;
  /** The last IMAP check (the confirm leg's mailbox): true ok, false failed (with auto-confirm on: `mail_failing`),
   *  null none yet. Absent from an older runner. */
  mailOk?: boolean | null;
  /** The calendar reads since the last acknowledged report, oldest first, at most SCANS_PER_REPORT (the newest kept).
   *  Absent from an older runner. */
  scansLog?: ScanEntry[];
  events: EventInput[];        // new since the last acknowledged report
  seen: string[];              // facility names the site offered this run
}
/** @public (its/worker) */
export const REPORT_EVERY_SEC = 30;
/** Saved settings a running run still hasn't applied after this long (four reports: two flickered): `settings_stale`. @public (its/worker) */
export const SETTINGS_STALE_SEC = 4 * REPORT_EVERY_SEC;

/** One calendar read, for the page's minute strip (the last hour, across runs). No date or facility: counts and codes.
 *  @public (its/worker) */
export interface ScanEntry {
  t: number;         // the runner's clock (ms), when the read ended; with the run's id, what a retried report repeats
  ok: boolean;
  code?: string;     // when !ok: the outcome code (timeout, http_503, session_dead, …), an isId
  ms: number;        // how long the read took
  avail: number;     // target dates showing a vacancy
}
/** @public (its/worker) */
export const SCANS_PER_REPORT = 30;
/** The status's `recentScans`: the last RECENT_SCANS_SEC by the Worker's clock, at most RECENT_SCANS_KEPT. @public (its/worker) */
export const RECENT_SCANS_SEC = 3600;
/** @public (its/worker) */
export const RECENT_SCANS_KEPT = 300;

/** One minute of calendar reads (the page's minute strip; a Tokyo minute is a UTC one), from every run that reported
 *  reads in it, by the reads' own time: every read of the hour, however many runs scan (RECENT_SCANS_KEPT holds 20
 *  minutes of two runs at 15 s). @public (its/worker) */
export interface ScanMinute {
  minute: number;    // the minute's start (ms, the runner's clock)
  n: number;         // reads
  ok: number;
  fail: number;      // n − ok
  avail: number;     // the most target dates showing a vacancy in one read
  /** Failures by outcome code (an isId), at most SCAN_MINUTE_CODES codes (the rest counted in `fail` only). */
  codes?: Record<string, number>;
}
/** The status's `recentMinutes`: the last RECENT_MINUTES minutes, the current one included. @public (its/worker) */
export const RECENT_MINUTES = 60;
/** @public (its/worker) */
export const SCAN_MINUTE_CODES = 8;

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
// Every member route answers the status; a 409 (PUT /its/settings from a stale draft) answers the bare current ItsStatus
// as its body. Other refusals are `{ok: false, error}` (400 with a SettingsError or a shape code, 401, 403, 405, 413).

export type Verdict = 'healthy' | 'starting' | 'idle' | 'degraded' | 'failing' | 'late' | 'stopped' | 'off';
/** @public (its/worker) */
export const VERDICTS: readonly Verdict[] = ['healthy', 'starting', 'idle', 'degraded', 'failing', 'late', 'stopped', 'off'];
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
  | 'human_needed'    // a hold or a failed leg waits for a person
  | 'mail_failing'    // auto-confirm is on and the runner's last IMAP check failed (holds wait for a person)
  | 'settings_stale'; // the running run hasn't applied the saved settings for SETTINGS_STALE_SEC
export const REASONS: readonly Reason[] = ['mode_off', 'paused', 'no_dates', 'dispatch_failed', 'starting', 'never_ran', 'runner_silent', 'banned', 'scan_failing', 'solve_failing', 'unsynced', 'human_needed', 'mail_failing', 'settings_stale'];
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
  /** 開始's GitHub dispatch: `status` 204 = accepted, 0 = no answer; `{ok: true, status: null}` = no token set, nothing
   *  sent (the schedule starts a run). */
  dispatch: { at: number; ok: boolean; status: number | null } | null;
  /** The last 開始 / 停止: who pressed it and when (Worker clock). Absent from an older Worker. */
  control?: { action: RunInput['action']; by: Member; at: number } | null;
  bookings: BookingEntry[];    // newest first
  events: ItsEvent[];          // newest first
  seen: string[];              // every facility name ever offered, sorted
  /** The last preflight (GET /runner/config without runId: a run deciding whether to start), Worker clock. Absent
   *  from an older Worker. */
  lastPreflight?: number | null;
  /** The calendar reads of the last RECENT_SCANS_SEC (by the Worker's receive time), oldest first, from every run that
   *  reported them. Absent from an older Worker. */
  recentScans?: ScanEntry[];
  /** The last RECENT_MINUTES minutes of reads, aggregated per minute, oldest first (minutes without a read left out):
   *  the strip's source once the page reads it (recentScans stays until then). Absent from an older Worker. */
  recentMinutes?: ScanMinute[];
  /** Web Push (the Push section below): counts and codes only, never an endpoint or its hash. Absent from an older
   *  Worker. */
  push?: ItsPushStatus;
}

// ---- Push (members; its/README.md "Push") ----
// A phone opts in from ボット → 保養所 (POST /its/push/subscribe); the Worker sends one notification per subscription
// for a hold the bot will confirm (normal), a hold that needs a person (high, while the hold lasts), and 予約確定.
// Every push route answers `{ok: true, push}` or the usual `{ok: false, error}`.

export type PushLang = 'ja' | 'en';
/** @public (its/worker) */
export const PUSH_LANGS: readonly PushLang[] = ['ja', 'en'];
/** The push services an endpoint may point at (https, the default port, this exact host): Apple's (iPhone, macOS
 *  Safari), and FCM for a desktop Chrome while developing. @public (its/worker) */
export const PUSH_HOSTS: readonly string[] = ['web.push.apple.com', 'fcm.googleapis.com'];
/** An endpoint's length bound (characters). @public (its/worker) */
export const PUSH_MAX_ENDPOINT = 512;
/** Subscriptions per member: a fifth replaces the member's least recently refreshed. @public (its/worker) */
export const PUSH_SUBS_PER_MEMBER = 4;
/** A subscription not refreshed (subscribe again) for this long is dropped; the page refreshes weekly. @public (its/worker) */
export const PUSH_KEEP_DAYS = 30;
/** POST /its/push/test: per endpoint, at most one this often and PUSH_TESTS_PER_DAY a Tokyo day (429 rate_limited). @public (its/worker) */
export const PUSH_TEST_EVERY_SEC = 30;
/** @public (its/worker) */
export const PUSH_TESTS_PER_DAY = 20;

/** `POST /its/push/subscribe`: the browser's PushSubscription (`toJSON()`'s endpoint and keys) and the language its
 *  notifications are written in. The endpoint is unique: one another member subscribed moves to this one. Refused:
 *  400 bad_push_endpoint (not https on PUSH_HOSTS, a port, userinfo, an IP, past PUSH_MAX_ENDPOINT), bad_push_keys
 *  (p256dh not a P-256 point, auth not 16 bytes, base64url), bad_push_lang; 503 push_off (the Worker has no VAPID
 *  key). @public (its/worker) */
export interface PushSubscribeInput { endpoint: string; keys: { p256dh: string; auth: string }; lang: PushLang }
/** `POST /its/push/unsubscribe` (forgets it if it is the caller's; ok either way) and `POST /its/push/test` (one
 *  notification to it, if it is the caller's: else 404 not_subscribed; 429 rate_limited). @public (its/worker) */
export interface PushEndpointInput { endpoint: string }

/** A push's outcome: ok (201/202), gone (404/410: the subscription deleted), config (401/403: the VAPID key or JWT
 *  refused, `reason` Apple's, e.g. BadJwtToken: kept, not retried), bug (400/413 or a message we couldn't build),
 *  retry (429/5xx/network: tried again until its TTL), expired (its TTL ran out first). @public (its/worker) */
export type PushOutcome = 'ok' | 'gone' | 'config' | 'bug' | 'retry' | 'expired';
/** @public (its/worker) */
export type PushKind = 'hold' | 'human_needed' | 'maybe_filed' | 'confirmed' | 'test';

/** A `human_needed` event's detail (the runner's outcome codes: its/runner/README.md "Outcome codes"; a leg may send
 *  others, e.g. apply_page_<status>), as the push and the page read it:
 *  - NOT_BOOKED_DETAILS: a definite non-booking where no action helps (the room went, the hold lapsed): no push.
 *  - MAYBE_FILED_DETAILS: the leg may have filed (the budget ran out after 申込する, or no completion page): the
 *    mailbox and the site decide; pushed as `maybe_filed` (申込済みの可能性).
 *  - any other: the hold waits for a person; pushed as `human_needed` (要対応) while the hold lasts. @public (its/worker) */
export const NOT_BOOKED_DETAILS: readonly string[] = ['room_taken', 'hold_expired'];
/** @public (its/worker) */
export const MAYBE_FILED_DETAILS: readonly string[] = ['submit_unknown', 'no_completion'];
/** The codes the runner sends today (README's list; the leg's are open-ended). @public (its/worker) */
export const HUMAN_NEEDED_DETAILS: readonly string[] = [
  'near_date', 'auto_off', 'no_mail', 'unmapped', 'fill_rejected', 'hold_expired', 'confirming_unacked', 'lease_stale',
  'not_wanted', 'browser_busy', 'no_completion', 'submit_unknown', 'leg_timeout', 'leg_error', 'room_taken', 'bad_booking',
  'id_conflict', 'run_ended',
];

/** `ItsStatus.push`, and every push route's `push`: live subscriptions per member, the VAPID public key the Worker signs
 *  with (`vapidPublic`: the page's applicationServerKey, read here at runtime, never built into the app: an
 *  uncompressed P-256 point, 65 bytes, base64url; null: push is off; a different one than a phone subscribed with: the
 *  pair was rotated, resubscribe), the last push answered ok, and the last attempt's outcome. @public (its/worker) */
export interface ItsPushStatus {
  A: number;
  B: number;
  vapidPublic: string | null;
  lastSentAt: number | null;
  lastOutcome: { at: number; kind: PushKind; code: PushOutcome; status: number; reason?: string } | null;
}

/** The push routes (POST, a member's key, CORS as the other member routes) and their bodies. @public (its/worker) */
export const PUSH_ROUTES = { subscribe: '/its/push/subscribe', unsubscribe: '/its/push/unsubscribe', test: '/its/push/test' } as const;
/** Every push route's 200: the push status after it (the test's outcome in `lastOutcome`); a refusal is
 *  `{ok: false, error}` (400 a code above, 401, 403, 404 not_subscribed, 405, 413, 429 rate_limited, 503 push_off).
 *  @public (its/worker) */
export interface PushReply { ok: true; push: ItsPushStatus }

/** The decrypted message the service worker receives (JSON, ≤ 3000 bytes). Title and body are written by the Worker in
 *  the subscription's language (Tokyo times), so an older service worker shows a newer kind; `tag` collapses one
 *  stay's notifications (the hold's replaced by its 予約確定); `open` names the page to open. @public (its/worker) */
export interface ItsPushPayload {
  v: 1;
  kind: PushKind;
  id: string;          // the event's `${runId}:${seq}`, or `test`
  tag: string;
  title: string;
  body: string;
  open: 'its';
  date?: string;
  hotel?: string;
  /** The hold's lapse (ms): hold and human_needed. */
  expiresAt?: number;
  /** 申込受付番号: confirmed. */
  number?: string;
}

/** `GET /health/its` (Bearer ITS_HEALTH_TOKEN, for alerting from a public repo's workflow): codes and counts only, never
 *  a date, a facility or a name. Ages in whole seconds (null: never). `unsyncedAgeSec`: how long the shown run has
 *  reported unsynced entries without a break. @public (its/worker) */
export interface ItsHealth {
  verdict: Verdict;
  reasons: Reason[];
  lastSeenAgeSec: number | null;
  phase: Phase | null;
  unsynced: number;
  unsyncedAgeSec: number | null;
  lastPreflightAgeSec: number | null;
}

// ---- Validation, shared by the Worker and the page ----

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
// C0/C1 controls and the bidi overrides/isolates: never in a name the Worker logs or the page shows
const BAD_CHARS = /[\u0000-\u001f\u007f-\u009f\u200e\u200f\u202a-\u202e\u2066-\u2069]/;

/** Text the Worker keeps and logs and the page shows (a name, a detail): a non-empty string of at most `max`
 *  characters, no control or bidi character. @public (its/worker) */
export function isName(x: unknown, max: number = MAX_NAME): x is string {
  return typeof x === 'string' && x.length > 0 && x.length <= max && !BAD_CHARS.test(x);
}

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

function names(x: unknown, max: number, cap: number = MAX_HOTELS): string[] | null {
  if (!Array.isArray(x) || x.length > cap) return null;
  const out: string[] = [];
  const seen = new Set<string>();
  for (const n of x) {
    if (typeof n !== 'string') return null;
    const t = n.replace(/\s+/g, ' ').trim();
    if (!isName(t, max) || BAD_CHARS.test(n)) return null;
    const k = normName(t);
    if (!seen.has(k)) { seen.add(k); out.push(t); }
  }
  return out;
}

export type SettingsError = 'bad_shape' | 'bad_interval' | 'bad_date' | 'past_date' | 'far_date' | 'too_many_dates' | 'bad_guests' | 'bad_hotels';

/** Checks a `PUT /its/settings` body against today in Tokyo: dates come back sorted and unique (past ones refused, so
 *  a stale draft can't resurrect one), names trimmed and de-duplicated by normName, a skipped name dropped from
 *  priority (skipping wins). `search` is optional (an older page sends none: the value has none); kept as sent (a
 *  skipped name in it stays: skip wins when the runner matches). */
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
  const skip = names(o.skip, MAX_SITE_NAME);   // a site's name, matched whole
  const pri = names(o.priority, MAX_NAME);
  const search = o.search === undefined ? undefined : names(o.search, MAX_SITE_NAME, MAX_SEARCH);
  if (!skip || !pri || search === null) return { ok: false, error: 'bad_hotels' };
  const skipped = new Set(skip.map(normName));
  const priority = pri.filter((p) => !skipped.has(normName(p)));
  return {
    ok: true,
    value: { intervalSec: o.intervalSec as IntervalSec, dates, guests: o.guests as number, skip, priority, ...(search && { search }), autoConfirm: o.autoConfirm, baseUpdatedAt: o.baseUpdatedAt as number | null },
  };
}
