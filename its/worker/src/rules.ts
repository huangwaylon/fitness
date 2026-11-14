// The record's rules, free of the Workers runtime (bot.ts holds the record and saves it): the lease, the events' two
// rings, the append-only bookings, the seen names, what a runner is told (RunnerConfig) and the page's verdict
// (ItsStatus). Every time is the Worker's clock (`now`), except the runner's own fields in its report.
import {
  AUTO_CONFIRM_MIN_DAYS, BOOKINGS_KEEP_DAYS, EVENTS_KEPT, HOLD_SEC, IMPORTANT_EVENTS, LATE_AFTER_SEC, LEASE_SEC, REASONS,
  RECENT_MINUTES, SCAN_MINUTE_CODES, SETTINGS_STALE_SEC, START_GRACE_SEC, daysUntil, normName, tokyoToday,
  type BookingEntry, type BookingInput, type BookingKind, type EventInput, type ItsEvent, type ItsHealth, type ItsSettings,
  type ItsStatus, type Lease, type Reason, type RunnerConfig, type RunnerReport, type ScanEntry, type ScanMinute, type Verdict,
} from '../../../app/src/lib/its/contract.ts';
import type { PushJob, PushLog, PushSub } from './push.ts';

export type Mode = 'on' | 'off';
/** The runner's last report as kept: the status's, plus the Worker's own receive times of its last good scan and solve
 *  (when `lastOkAt` / `solves.lastOkAt` last moved), so the verdict compares Worker times only, and since when this run
 *  has reported unsynced entries without a break (/health/its). Not shown. */
export type RunnerRecord = NonNullable<ItsStatus['runner']> & { okSeenAt: number | null; solveOkSeenAt: number | null; unsyncedSince: number | null };
export type Dispatch = NonNullable<ItsStatus['dispatch']>;
type Control = NonNullable<ItsStatus['control']>;

/** Everything the object keeps, one storage key per field (bot.ts KEYS). Lists are oldest first. */
export interface ItsRecord {
  settings: ItsSettings;
  bookings: BookingEntry[];
  runner: RunnerRecord | null;
  lease: Lease | null;
  dispatch: Dispatch | null;
  /** The last 開始 / 停止. */
  control: Control | null;
  events: { routine: ItsEvent[]; important: ItsEvent[] };
  /** Every facility name offered, with when it was last reported (the newest SEEN_KEPT kept). */
  seen: Record<string, number>;
  /** The highest event seq per run, the newest ACKS_KEPT runs: `[runId, seq]`. */
  acks: [string, number][];
  /** The last preflight (GET /runner/config without a runId). */
  preflight: number | null;
  /** The newest calendar read counted per run, `[runId, t]`, the newest ACKS_KEPT runs: a retried report repeats its
   *  `t`s, counted once. */
  scanned: [string, number][];
  /** The reports' calendar reads per minute (the status's recentMinutes), the last RECENT_MINUTES. */
  minutes: ScanMinute[];
  /** Web Push (push.ts): the phones subscribed, the outbox (the alarm sends it), the last outcome. */
  subs: PushSub[];
  pushq: PushJob[];
  pushlog: PushLog;
  /** The watchdog's state (watchOf): the open incident, or the last one's backoff and the day's count. */
  watch: Watch | null;
  /** The in-job restarts (a `run_start` event with detail `restart`) on a Tokyo day (RESTART_DAY_CAP), and when the
   *  last one at or past the cap landed (`spentAt`; a 開始 after it is one more run). */
  restarts: { day: string; n: number; spentAt?: number | null } | null;
}

/** The watchdog's state. `since`: when the open incident began (null: none open; `closedAt` when the last closed);
 *  `n`, `lastAt`, `failed`: its recoveries (a dispatch, or a cancel and the dispatch after it), the last's time, refused
 *  in a row: carried into an incident that opens within WATCH_COOLDOWN_MS of the last's close, so a runner that reports
 *  and dies keeps backing off; `noToken`, `alerted`: this incident's no_token line, its push; `counted`: it is in
 *  `starts` (once WATCH_PUSH_MIN_MS silent or a recovery tried: a blip the in-job restart fixes counts for nothing; absent:
 *  an older Worker's, counted at its open); `starts`: incidents counted within WATCH_LOOP_MS; `loopAlerted`: that run
 *  of incidents pushed; `day`, `dayN`: the Tokyo day and the recoveries on it; `cancelId`, `cancelAt`: the last GitHub
 *  run cancelled (hung: rules' watchOf) and when. */
export interface Watch {
  since: number | null; closedAt: number | null; n: number; lastAt: number | null; failed: number; noToken: boolean; alerted: boolean;
  counted?: boolean; starts: number[]; loopAlerted: boolean; day: string; dayN: number; cancelId?: number | null; cancelAt?: number | null;
}

export const SEEN_KEPT = 300;
/** A seen name offered again moves its time on the record at most this often (not a write per report for it). */
export const SEEN_REFRESH_MS = 24 * 3600_000;
export const ACKS_KEPT = 20;
/** The record's bound: past it new entries are refused (and logged), never old ones dropped early. */
export const MAX_BOOKINGS = 500;
/** A failed leg or a human_needed event counts for this long (unless a later 予約確定 for that stay settles it). */
const HUMAN_NEEDED_MS = 24 * 3600_000;
/** The site's hold lapses after HOLD_SEC: a hold that needs a person (auto-confirm off, or a near stay) counts till
 *  then; a push for it is sent till then (push.ts). */
export const HOLD_MS = HOLD_SEC * 1000;
/** A 申込 leg in flight: a `confirming` without its `confirmed` / `failed` counts only after this. */
export const CONFIRM_GRACE_MS = 10 * 60_000;
const SCAN_FAILING = 3;
const SOLVE_FAILING = 3;

/** The settings as they stand today: dates before today (Tokyo) dropped. */
export function liveSettings(s: ItsSettings, now: number): ItsSettings {
  const today = tokyoToday(now);
  return s.dates.every((d) => d >= today) ? s : { ...s, dates: s.dates.filter((d) => d >= today) };
}

/** The lease is someone else's and still counts. */
export const leaseTaken = (lease: Lease | null, runId: string | null, now: number): boolean =>
  !!lease && lease.until > now && lease.holder !== runId;

/** Grants (or renews) the lease to `runId` when it's free, expired or already this run's; null: refused. */
export function claimLease(lease: Lease | null, runId: string, host: Lease['host'], now: number): Lease | null {
  return leaseTaken(lease, runId, now) ? null : { holder: runId, host, until: now + LEASE_SEC * 1000 };
}

const ackOf = (acks: ItsRecord['acks'], runId: string | null): number => acks.find(([r]) => r === runId)?.[1] ?? 0;

/** In-job restarts a Tokyo day (each a Turnstile solve, and the site bans on request rate): past it a preflight says
 *  run=0 (`restartsLeft` 0: no restart, no new run, no handoff), the watchdog only pushes and the verdict says
 *  restart_cap, till Tokyo's midnight or a 開始 (a deliberate action: one more run, `restartsLeft` 1, its own dispatch;
 *  the next restart counted spends it again). */
export const RESTART_DAY_CAP = 20;
export const restartsToday = (rec: Pick<ItsRecord, 'restarts'>, now: number): number =>
  rec.restarts?.day === tokyoToday(now) ? rec.restarts.n : 0;

/** The day's restarts are spent and no 開始 came since. */
const restartCapped = (rec: Pick<ItsRecord, 'restarts' | 'control'>, now: number): boolean =>
  restartsToday(rec, now) >= RESTART_DAY_CAP && !(rec.control?.action === 'start' && rec.control.at > (rec.restarts?.spentAt ?? 0));

const restartsLeft = (rec: Pick<ItsRecord, 'restarts' | 'control'>, now: number): number =>
  restartCapped(rec, now) ? 0 : Math.max(1, RESTART_DAY_CAP - restartsToday(rec, now));

/** The day's restarts after a report's new events (null: none among them). */
export function addRestarts(rec: Pick<ItsRecord, 'restarts'>, added: ItsEvent[], now: number): ItsRecord['restarts'] {
  const n = added.filter((e) => e.kind === 'run_start' && e.detail === 'restart').length;
  if (!n) return null;
  const total = restartsToday(rec, now) + n;
  const was = rec.restarts?.day === tokyoToday(now) ? rec.restarts.spentAt ?? null : null;
  return { day: tokyoToday(now), n: total, spentAt: total >= RESTART_DAY_CAP ? now : was };
}

/** What a runner is told: the settings, the record, the lease, and whether (and why) to stop. `mustHold` (a report's
 *  answer): a run that doesn't hold the lease is told lease_lost even when nobody else holds it (it claims first). */
export function runnerConfig(rec: ItsRecord, mode: Mode, runId: string | null, now: number, mustHold = false): RunnerConfig {
  const settings = liveSettings(rec.settings, now);
  const stopReason: RunnerConfig['stopReason'] =
    mode === 'off' ? 'mode_off'
      : settings.paused ? 'paused'
        : !settings.dates.length ? 'no_dates'
          : leaseTaken(rec.lease, runId, now) || (mustHold && rec.lease?.holder !== runId) ? 'lease_lost'
            : null;
  const c: RunnerConfig = { settings, bookings: rec.bookings, lease: rec.lease, stop: stopReason !== null, stopReason, ackSeq: ackOf(rec.acks, runId) };
  return runId === null ? { ...c, restartsLeft: restartsLeft(rec, now) } : c;
}

/** A report's new events (seq above the run's ack: a retried report adds nothing twice), stamped with `now`, into
 *  their ring (important ones never evicted by routine ones). */
export function addEvents(rec: Pick<ItsRecord, 'events' | 'acks'>, runId: string, inputs: EventInput[], now: number) {
  let ack = ackOf(rec.acks, runId);
  const fresh: ItsEvent[] = [];
  for (const e of [...inputs].sort((a, b) => a.seq - b.seq)) {
    if (e.seq <= ack) continue;
    fresh.push({ runId, seq: e.seq, t: now, kind: e.kind, ...(e.date && { date: e.date }), ...(e.hotel && { hotel: e.hotel }), ...(e.detail && { detail: e.detail }) });
    ack = e.seq;
  }
  if (!fresh.length) return null;
  const ring = (old: ItsEvent[], important: boolean) =>
    [...old, ...fresh.filter((e) => IMPORTANT_EVENTS.includes(e.kind) === important)].slice(-EVENTS_KEPT);
  const acks: ItsRecord['acks'] = [...rec.acks.filter(([r]) => r !== runId), [runId, ack]];
  return { events: { routine: ring(rec.events.routine, false), important: ring(rec.events.important, true) }, acks: acks.slice(-ACKS_KEPT), added: fresh };
}

/** One of the Worker's own events (seq 0: no run's ack moves), into the important ring. */
export function addOwnEvent(events: ItsRecord['events'], e: Omit<ItsEvent, 'seq'>): ItsRecord['events'] {
  return { ...events, important: [...events.important, { ...e, seq: 0 }].slice(-EVENTS_KEPT) };
}

/** A report's reads not yet counted: after the run's newest counted (a retried report repeats its `t`s), oldest first;
 *  and `scanned` with the run's newest (null: nothing new). */
export function freshScans(scanned: ItsRecord['scanned'], runId: string, log: ScanEntry[]): { fresh: ScanEntry[]; scanned: ItsRecord['scanned'] | null } {
  const newest = scanned.find(([r]) => r === runId)?.[1] ?? -1;
  const fresh = log.filter((e) => e.t > newest).sort((a, b) => a.t - b.t);
  if (!fresh.length) return { fresh, scanned: null };
  return { fresh, scanned: [...scanned.filter(([r]) => r !== runId), [runId, fresh.at(-1)!.t] as [string, number]].slice(-ACKS_KEPT) };
}

const MINUTE_MS = 60_000;
/** The first minute of the window that ends with `now`'s minute. */
const windowStart = (now: number) => Math.floor(now / MINUTE_MS) * MINUTE_MS - (RECENT_MINUTES - 1) * MINUTE_MS;

/** `fresh` (freshScans) folded into their minutes; minutes before the window dropped. Null: nothing to write. */
export function addMinutes(minutes: ScanMinute[], fresh: ScanEntry[], now: number): ScanMinute[] | null {
  const from = windowStart(now);
  const kept = minutes.filter((m) => m.minute >= from);
  const add = fresh.filter((e) => e.t >= from);
  if (!add.length && kept.length === minutes.length) return null;
  const by = new Map(kept.map((m) => [m.minute, { ...m, ...(m.codes && { codes: { ...m.codes } }) }]));
  for (const e of add) {
    const minute = Math.floor(e.t / MINUTE_MS) * MINUTE_MS;
    const m = by.get(minute) ?? { minute, n: 0, ok: 0, fail: 0, avail: 0 };
    m.n++;
    if (e.ok) m.ok++;
    else {
      m.fail++;
      const code = e.code ?? 'error';
      if (m.codes?.[code] !== undefined || Object.keys(m.codes ?? {}).length < SCAN_MINUTE_CODES) m.codes = { ...m.codes, [code]: (m.codes?.[code] ?? 0) + 1 };
    }
    m.avail = Math.max(m.avail, e.avail);
    by.set(minute, m);
  }
  // a runner's clock far ahead can't grow it past the window either
  return [...by.values()].sort((a, b) => a.minute - b.minute).slice(0, RECENT_MINUTES + 1);
}

/** The status's recentMinutes: the window's, oldest first. */
const recentMinutes = (minutes: ScanMinute[], now: number): ScanMinute[] => minutes.filter((m) => m.minute >= windowStart(now));

/** Entries kept: until their stay is more than BOOKINGS_KEEP_DAYS past (a reservation is a liability till then). */
const pruneBookings = (list: BookingEntry[], now: number): BookingEntry[] =>
  list.filter((b) => daysUntil(b.date, now) >= -BOOKINGS_KEEP_DAYS);

/** Two entries say the same (all but the Worker's `at`). */
const sameEntry = (a: BookingInput, b: BookingInput) =>
  a.kind === b.kind && a.date === b.date && a.hotel === b.hotel && a.runId === b.runId && (a.number ?? null) === (b.number ?? null);

/** New entries appended, stamped with `now`: an id already there with the same content is a retry (ignored); with other
 *  content the whole post is refused (`conflict`: that id; nothing added). Past MAX_BOOKINGS refused (`refused`). */
export function addBookings(list: BookingEntry[], inputs: BookingInput[], now: number) {
  const byId = new Map<string, BookingInput>(list.map((b) => [b.id, b]));
  for (const b of inputs) {
    const had = byId.get(b.id);
    if (had && !sameEntry(had, b)) return { bookings: list, added: [], refused: 0, conflict: b.id };
    if (!had) byId.set(b.id, b);
  }
  const ids = new Set(list.map((b) => b.id));
  const kept = pruneBookings(list, now);
  const added: BookingEntry[] = [];
  let refused = 0;
  for (const b of inputs) {
    if (ids.has(b.id)) continue;
    ids.add(b.id);
    if (kept.length + added.length >= MAX_BOOKINGS) { refused++; continue; }
    added.push({ ...b, at: now });
  }
  return { bookings: added.length || kept.length !== list.length ? [...kept, ...added] : list, added, refused, conflict: null };
}

/** The names offered, stamped `now`; past SEEN_KEPT the least recently offered go. Null: nothing to write (no new name,
 *  and every one offered was stamped less than SEEN_REFRESH_MS ago: the order only matters at the cap). */
export function addSeen(seen: Record<string, number>, names: string[], now: number): Record<string, number> | null {
  if (!names.some((n) => !(n in seen) || now - seen[n] >= SEEN_REFRESH_MS)) return null;
  const next: Record<string, number> = { ...seen };
  for (const n of names) next[n] = now;
  const entries = Object.entries(next);
  if (entries.length <= SEEN_KEPT) return next;
  return Object.fromEntries(entries.sort((a, b) => b[1] - a[1]).slice(0, SEEN_KEPT));
}

/** The runner's report as kept (no events or seen: they have their own keys), with the receive time; `okSeenAt` /
 *  `solveOkSeenAt` become `now` when the run's lastOkAt / solves.lastOkAt moved since `prev` (the record's).
 *  `okSeenAt` (what clears a ban) is per run: a run's first report kept is its baseline (null: no good scan seen yet,
 *  whatever lastOkAt it carries, which may be from before the ban), so only a later move, from a run that reported
 *  since, counts; the shown runner switching runs never clears a ban. */
export function runnerOf(r: RunnerReport, now: number, prev: RunnerRecord | null): RunnerRecord {
  const { v: _v, events: _e, seen: _s, scansLog: _l, ...rest } = r;
  const same = prev?.runId === r.runId ? prev : null;
  const seenAt = (t: number | null, before: number | null | undefined, at: number | null | undefined) =>
    t === null ? null : same && before === t && at != null ? at : now;
  return {
    ...rest, lastSeen: now,
    okSeenAt: r.lastOkAt === null || !same ? null : same.lastOkAt === r.lastOkAt ? same.okSeenAt : now,
    solveOkSeenAt: seenAt(r.solves.lastOkAt, same?.solves.lastOkAt, same?.solveOkSeenAt),
    unsyncedSince: r.unsynced === 0 ? null : same && same.unsynced > 0 ? same.unsyncedSince : now,
  };
}

/** A stay's key (its date and normName'd facility): bookings and events of one stay match by it. */
export const stayKey = (date: string | undefined, hotel: string | undefined) => `${date ?? ''}|${normName(hotel ?? '')}`;

/** What waits for a person (the page's 要対応), each unless a later entry for that stay settled it: within
 *  HUMAN_NEEDED_MS, a failed leg or a human_needed event (settled by 予約確定) or a `confirming` past CONFIRM_GRACE_MS
 *  (by 予約確定 or failed); and a hold within the site's 30 min that the runner won't finish (auto-confirm off, or a stay
 *  nearer than AUTO_CONFIRM_MIN_DAYS; settled by any later step). */
function humanNeeded(rec: ItsRecord, now: number): boolean {
  const last = new Map<string, Partial<Record<BookingKind, number>>>();
  for (const b of rec.bookings) {
    const m = last.get(stayKey(b.date, b.hotel)) ?? {};
    m[b.kind] = Math.max(b.at, m[b.kind] ?? 0);
    last.set(stayKey(b.date, b.hotel), m);
  }
  const settled = (key: string, t: number, by: BookingKind[]) => by.some((k) => (last.get(key)?.[k] ?? -1) >= t);
  const recent = (t: number) => now - t <= HUMAN_NEEDED_MS;
  const auto = rec.settings.autoConfirm;
  return rec.bookings.some((b) => {
    const key = stayKey(b.date, b.hotel);
    switch (b.kind) {
      case 'failed': return recent(b.at) && !settled(key, b.at, ['confirmed']);
      case 'confirming': return recent(b.at) && now - b.at > CONFIRM_GRACE_MS && !settled(key, b.at, ['confirmed', 'failed']);
      case 'hold': return now - b.at < HOLD_MS && (!auto || daysUntil(b.date, now) < AUTO_CONFIRM_MIN_DAYS) && !settled(key, b.at, ['confirming', 'confirmed', 'failed']);
      default: return false;
    }
  }) || rec.events.important.some((e) => e.kind === 'human_needed' && recent(e.t) && !settled(stayKey(e.date, e.hotel), e.t, ['confirmed']));
}

/** A runner should be running: MODE on, not stopped, a date to look for. */
function activeOf(rec: Pick<ItsRecord, 'settings'>, mode: Mode, now: number): boolean {
  const s = liveSettings(rec.settings, now);
  return mode === 'on' && !s.paused && s.dates.length > 0;
}

/** No report this long and no live lease: the runner is missing (a live one reports every 30 s; the lease lasts 300).
 *  The cron's; the alarm's is WATCH_FAST_MS. */
export const WATCH_QUIET_MS = 6 * 60_000;
/** The alarm's (bot.ts alarm): no report or claim this long, re-armed by every one. A crashed process restarting in its
 *  job preflights first (on its way); a job that ended shows no unfinished run on GitHub: dispatched at once. */
export const WATCH_FAST_MS = 90_000;
/** While missing, the alarm looks again this often (GitHub asked only when a recovery is due). */
export const WATCH_POLL_MS = 60_000;
/** Hung: the lease held and expired, nothing heard (report, claim, preflight) this long: longer than a runner rides out
 *  a Worker outage (main.py WORKER_LOST_SEC, 15 min) and the in-job restart's gaps. The holder's GitHub run, still in
 *  progress, is cancelled, unless it has a hold or `confirming` younger than HOLD_SEC with no outcome. */
export const WATCH_HUNG_MS = 18 * 60_000;
/** No push, and an incident not counted, under this much silence: a restart fixes it within minutes. */
export const WATCH_PUSH_MIN_MS = 5 * 60_000;
/** The watchdog's first wait between its recoveries, doubling per recovery up to WATCH_EVERY_MAX_MS: a run that dies
 *  at once is dispatched again 10, 20, 40, then every 60 min, never in a tight loop. */
export const WATCH_EVERY_MS = 10 * 60_000;
export const WATCH_EVERY_MAX_MS = 60 * 60_000;
/** The push: an incident this old, this many recoveries refused in a row, the day's cap reached, or
 *  WATCH_LOOP_INCIDENTS incidents within WATCH_LOOP_MS (a run that keeps dying); never under WATCH_PUSH_MIN_MS of silence. */
export const WATCH_ALERT_MS = 15 * 60_000;
const WATCH_ALERT_FAILS = 2;
export const WATCH_LOOP_MS = 2 * 3600_000;
const WATCH_LOOP_INCIDENTS = 3;
/** An incident opening this soon after the last closed continues its backoff (≥ WATCH_EVERY_MAX_MS). */
export const WATCH_COOLDOWN_MS = 60 * 60_000;
/** The watchdog's recoveries per Tokyo day; past it, only the push. */
export const WATCH_DAY_CAP = 12;

/** The last sign of a runner: its report, or a claim or renewal of the lease. */
export const heardAt = (rec: Pick<ItsRecord, 'runner' | 'lease'>): number =>
  Math.max(rec.runner?.lastSeen ?? 0, rec.lease ? rec.lease.until - LEASE_SEC * 1000 : 0);

/** The GitHub run of a run id `${GITHUB_RUN_ID}-${GITHUB_RUN_ATTEMPT}` (null: not an Actions run). */
const githubRunOf = (runId: string | undefined): number | null => {
  const m = /^(\d{1,20})-\d{1,20}$/.exec(runId ?? '');
  return m ? Number(m[1]) : null;
};

/** The holder's hold or `confirming` younger than HOLD_MS with no later `confirmed` / `failed` for its stay: a run with
 *  one is never cancelled (its leg may be filing, its 30 min may still be used). */
function holdOpen(rec: ItsRecord, holder: string, now: number): boolean {
  const ended = (b: BookingEntry) => rec.bookings.some((x) => (x.kind === 'confirmed' || x.kind === 'failed') && x.at >= b.at && stayKey(x.date, x.hotel) === stayKey(b.date, b.hotel));
  return rec.bookings.some((b) => b.runId === holder && (b.kind === 'hold' || b.kind === 'confirming') && now - b.at < HOLD_MS && !ended(b));
}

/** An incident in `starts` (the loop's count), once. */
export const counted = (w: Watch): Watch => (w.counted !== false || w.since === null ? w : { ...w, counted: true, starts: [...w.starts, w.since] });

/** The watchdog's tick (bot.ts watch; `quietMs`: the cron's WATCH_QUIET_MS or the alarm's WATCH_FAST_MS): its state
 *  after it, why (a log code), whether to dispatch now (a token and GitHub permitting), which GitHub run to cancel if
 *  GitHub shows it in progress (`cancel`), whether the day's cap stopped it. Missing: active, nothing heard for
 *  `quietMs` and no lease renewed within it; an open incident closes only on news after it opened (a report, a claim),
 *  so the cron's longer threshold never closes the alarm's incident. A run is on its way after an accepted dispatch
 *  (開始's or the watchdog's) or a preflight that no report has followed, for START_GRACE_SEC: no dispatch then, and no
 *  incident opened (an open one stays open), unless hung (WATCH_HUNG_MS). A cancel and a dispatch share the backoff and
 *  the day's cap; the dispatch after a cancel (within WATCH_EVERY_MS) is the same recovery (`afterCancel`). */
export function watchOf(rec: ItsRecord, mode: Mode, now: number, quietMs = WATCH_QUIET_MS): {
  watch: Watch | null; why: 'inactive' | 'alive' | 'starting' | 'missing'; dispatch: boolean; cancel: number | null; afterCancel: boolean; capped: boolean; crashLoop: boolean;
} {
  const w = rec.watch;
  const quiet = { dispatch: false, cancel: null, afterCancel: false, capped: false, crashLoop: false };
  const close = (why: 'inactive' | 'alive') => ({ watch: w?.since != null ? { ...w, since: null, closedAt: now } : w, why, ...quiet });
  if (!activeOf(rec, mode, now)) return close('inactive');
  const lastSeen = rec.runner?.lastSeen ?? 0;
  const lease = rec.lease;
  const heard = heardAt(rec);
  const alive = w?.since != null ? heard > w.since
    : now - lastSeen < quietMs || (leaseTaken(lease, null, now) && now - heard < quietMs);
  if (alive) return close('alive');
  const fresh = (t: number | null | undefined) => t != null && t > lastSeen && now - t < START_GRACE_SEC * 1000;
  const onItsWay = (!!rec.dispatch?.ok && fresh(rec.dispatch.at)) || fresh(rec.preflight);
  const silent = now - Math.max(heard, rec.preflight ?? 0);
  // hung: the holder never released its lease, it expired, and nothing was heard since: its run, if GitHub lists it
  const hung = !!lease && lease.until <= now && silent > WATCH_HUNG_MS && !holdOpen(rec, lease.holder, now) ? githubRunOf(lease.holder) : null;
  if (w?.since == null && onItsWay && hung === null) return { watch: w, why: 'starting', ...quiet };
  let watch = w!;
  if (w?.since == null) {
    const warm = w?.closedAt != null && now - w.closedAt < WATCH_COOLDOWN_MS;
    const starts = (w?.starts ?? []).filter((t) => now - t < WATCH_LOOP_MS);
    watch = {
      since: now, closedAt: null, n: warm ? w!.n : 0, lastAt: warm ? w!.lastAt : null, failed: warm ? w!.failed : 0, noToken: false, alerted: false,
      counted: false, starts, loopAlerted: starts.length > 0 && !!w?.loopAlerted, day: w?.day ?? '', dayN: w?.dayN ?? 0,
      cancelId: w?.cancelId ?? null, cancelAt: w?.cancelAt ?? null,
    };
  }
  if (now - heard >= WATCH_PUSH_MIN_MS) watch = counted(watch);
  const crashLoop = restartCapped(rec, now);
  const capped = dayCount(watch, now) >= WATCH_DAY_CAP || crashLoop;
  const wait = Math.min(WATCH_EVERY_MS * 2 ** Math.max(0, watch.n - 1), WATCH_EVERY_MAX_MS);
  const due = !capped && (watch.lastAt === null || now - watch.lastAt >= wait);
  const afterCancel = watch.cancelAt != null && watch.cancelAt === watch.lastAt && now - watch.cancelAt < WATCH_EVERY_MS;
  return { watch, why: 'missing', dispatch: !onItsWay && !crashLoop && (due || afterCancel), cancel: due ? hung : null, afterCancel, capped, crashLoop };
}

/** When the alarm should look next for the watchdog (bot.ts arm): WATCH_FAST_MS after the last sign of a runner, or
 *  WATCH_POLL_MS from now once that has passed; null while no runner should run. */
export function watchAt(rec: ItsRecord, mode: Mode, now: number): number | null {
  if (!activeOf(rec, mode, now)) return null;
  const due = heardAt(rec) + WATCH_FAST_MS;
  return due > now ? due : now + WATCH_POLL_MS;
}

/** The watchdog's recoveries on `now`'s Tokyo day. */
export const dayCount = (w: Watch, now: number): number => (w.day === tokyoToday(now) ? w.dayN : 0);

/** The open incident's push is due: 'silent' (old enough, its recoveries refused, or the day's cap reached), 'loop'
 *  (WATCH_LOOP_INCIDENTS counted within WATCH_LOOP_MS, or the day's restarts spent: a crash loop), else null; never
 *  with under WATCH_PUSH_MIN_MS of silence (`quietFor`: a restart that fixes it within minutes pushes nothing). Once
 *  per incident, and once per run of incidents (an incident within WATCH_LOOP_MS of a pushed one pushes nothing:
 *  `loopAlerted` carries). */
export function watchAlert(w: Watch, now: number, capped: boolean, quietFor = Infinity, crashLoop = false): 'silent' | 'loop' | null {
  if (w.since === null || w.loopAlerted || quietFor < WATCH_PUSH_MIN_MS) return null;
  if (crashLoop) return 'loop';
  if (!w.alerted && (now - w.since >= WATCH_ALERT_MS || w.failed >= WATCH_ALERT_FAILS || capped)) return 'silent';
  if (w.starts.filter((t) => now - t < WATCH_LOOP_MS).length >= WATCH_LOOP_INCIDENTS) return 'loop';
  return null;
}

/** Every reason that applies, in REASONS order, and the verdict (the first's). The runner-liveness ones apply only while
 *  a runner should be running (MODE on, not stopped, a date to look for). */
export function verdictOf(rec: ItsRecord, mode: Mode, now: number): Pick<ItsStatus, 'verdict' | 'reasons'> {
  const s = liveSettings(rec.settings, now);
  const active = activeOf(rec, mode, now);
  const r = rec.runner;
  const d = rec.dispatch;
  const lastSeen = r?.lastSeen ?? 0;
  const sinceDispatch = d && lastSeen < d.at;   // no report since 開始
  const starting = active && !!sinceDispatch && now - d.at < START_GRACE_SEC * 1000;
  const ban = rec.events.important.findLast((e) => e.kind === 'ban');
  // the run that holds the lease still applies settings older than the saved ones
  const saved = rec.settings.updatedAt;
  const holds = !!r && rec.lease?.holder === r.runId && rec.lease.until > now;
  const stale = holds && saved !== null && (r.settingsAt ?? -1) < saved && now - saved > SETTINGS_STALE_SEC * 1000;
  const solveFails = r ? rec.events.routine.filter((e) => e.kind === 'solve_failed' && e.runId === r.runId && e.t > (r.solveOkSeenAt ?? 0)).length : 0;
  const rules: Record<Reason, [boolean, Verdict]> = {
    mode_off: [mode === 'off', 'off'],
    paused: [s.paused, 'stopped'],
    no_dates: [!s.dates.length, 'idle'],
    restart_cap: [active && restartCapped(rec, now), 'late'],
    dispatch_failed: [active && !!sinceDispatch && !d.ok, 'degraded'],
    starting: [starting, 'starting'],
    never_ran: [active && !starting && !r, 'late'],
    runner_silent: [active && !starting && !!r && now - r.lastSeen > LATE_AFTER_SEC * 1000, 'late'],
    banned: [!!ban && (r?.okSeenAt ?? 0) <= ban.t, 'failing'],
    scan_failing: [active && !!r && r.scanFailures >= SCAN_FAILING, 'failing'],
    solve_failing: [active && !!r && r.solves.failed >= SOLVE_FAILING && solveFails >= SOLVE_FAILING, 'degraded'],
    unsynced: [!!r && r.unsynced > 0, 'degraded'],
    human_needed: [humanNeeded(rec, now), 'degraded'],
    mail_failing: [active && !!r && s.autoConfirm && r.mailOk === false, 'degraded'],
    settings_stale: [active && stale, 'degraded'],
  };
  const reasons = REASONS.filter((x) => rules[x][0]);
  return { verdict: reasons.length ? rules[reasons[0]][1] : 'healthy', reasons };
}

/** The runner as the page sees it (the Worker's own stamps left out). */
function shownRunner(r: RunnerRecord | null): ItsStatus['runner'] {
  if (!r) return null;
  const { okSeenAt: _o, solveOkSeenAt: _s, unsyncedSince: _u, ...shown } = r;
  return shown;
}

/** The newest first: by receive time, then seq. */
const newestFirst = (a: ItsEvent, b: ItsEvent) => b.t - a.t || b.seq - a.seq;

/** The status but its push (bot.ts adds it: the VAPID key is the Worker's env). */
export function statusOf(rec: ItsRecord, mode: Mode, sha: string | null, now: number): Omit<ItsStatus, 'push'> {
  return {
    v: 1, now, mode, sha,
    ...verdictOf(rec, mode, now),
    settings: liveSettings(rec.settings, now),
    runner: shownRunner(rec.runner),
    lease: rec.lease,
    dispatch: rec.dispatch,
    control: rec.control,
    bookings: pruneBookings(rec.bookings, now).reverse(),
    events: [...rec.events.routine, ...rec.events.important].sort(newestFirst),
    seen: Object.keys(rec.seen).sort(),
    lastPreflight: rec.preflight,
    recentMinutes: recentMinutes(rec.minutes, now),
  };
}

const ageSec = (t: number | null | undefined, now: number): number | null => (t == null ? null : Math.max(0, Math.floor((now - t) / 1000)));

/** /health/its: the verdict and a few ages and counts, never a date, a facility or a name (a public repo's workflow
 *  reads it). */
export function healthOf(rec: ItsRecord, mode: Mode, now: number): ItsHealth {
  const r = rec.runner;
  return {
    ...verdictOf(rec, mode, now),
    lastSeenAgeSec: ageSec(r?.lastSeen, now),
    phase: r?.phase ?? null,
    unsynced: r?.unsynced ?? 0,
    unsyncedAgeSec: r && r.unsynced > 0 ? ageSec(r.unsyncedSince, now) : null,
    lastPreflightAgeSec: ageSec(rec.preflight, now),
  };
}
