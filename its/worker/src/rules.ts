// The record's rules, free of the Workers runtime (bot.ts holds the record and saves it): the lease, the events' two
// rings, the append-only bookings, the seen names, what a runner is told (RunnerConfig) and the page's verdict
// (ItsStatus). Every time is the Worker's clock (`now`), except the runner's own fields in its report.
import {
  AUTO_CONFIRM_MIN_DAYS, BOOKINGS_KEEP_DAYS, EVENTS_KEPT, IMPORTANT_EVENTS, LATE_AFTER_SEC, LEASE_SEC, REASONS, START_GRACE_SEC,
  daysUntil, normName, tokyoToday,
  type BookingEntry, type BookingInput, type BookingKind, type EventInput, type ItsEvent, type ItsSettings, type ItsStatus,
  type Lease, type Reason, type RunnerConfig, type RunnerReport, type Verdict,
} from '../../../app/src/lib/its/contract.ts';

export type Mode = 'on' | 'off';
/** The runner's last report as kept: the status's, plus the Worker's own receive times of its last good scan and solve
 *  (when `lastOkAt` / `solves.lastOkAt` last moved), so the verdict compares Worker times only. Not shown. */
export type RunnerRecord = NonNullable<ItsStatus['runner']> & { okSeenAt: number | null; solveOkSeenAt: number | null };
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
}

export const SEEN_KEPT = 300;
/** A seen name offered again moves its time on the record at most this often (not a write per report for it). */
export const SEEN_REFRESH_MS = 24 * 3600_000;
export const ACKS_KEPT = 20;
/** The record's bound: past it new entries are refused (and logged), never old ones dropped early. */
export const MAX_BOOKINGS = 500;
/** A failed leg or a human_needed event counts for this long (unless a later 予約確定 for that stay settles it). */
const HUMAN_NEEDED_MS = 24 * 3600_000;
/** The site's hold lapses after 30 min: a hold that needs a person (auto-confirm off, or a near stay) counts till then. */
const HOLD_MS = 30 * 60_000;
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
  return { settings, bookings: rec.bookings, lease: rec.lease, stop: stopReason !== null, stopReason, ackSeq: ackOf(rec.acks, runId) };
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
  const { v: _v, events: _e, seen: _s, ...rest } = r;
  const same = prev?.runId === r.runId ? prev : null;
  const seenAt = (t: number | null, before: number | null | undefined, at: number | null | undefined) =>
    t === null ? null : same && before === t && at != null ? at : now;
  return {
    ...rest, lastSeen: now,
    okSeenAt: r.lastOkAt === null || !same ? null : same.lastOkAt === r.lastOkAt ? same.okSeenAt : now,
    solveOkSeenAt: seenAt(r.solves.lastOkAt, same?.solves.lastOkAt, same?.solveOkSeenAt),
  };
}

const stay = (date: string | undefined, hotel: string | undefined) => `${date ?? ''}|${normName(hotel ?? '')}`;

/** What waits for a person (the page's 要対応), each unless a later entry for that stay settled it: within
 *  HUMAN_NEEDED_MS, a failed leg or a human_needed event (settled by 予約確定) or a `confirming` past CONFIRM_GRACE_MS
 *  (by 予約確定 or failed); and a hold within the site's 30 min that the runner won't finish (auto-confirm off, or a stay
 *  nearer than AUTO_CONFIRM_MIN_DAYS; settled by any later step). */
function humanNeeded(rec: ItsRecord, now: number): boolean {
  const last = new Map<string, Partial<Record<BookingKind, number>>>();
  for (const b of rec.bookings) {
    const m = last.get(stay(b.date, b.hotel)) ?? {};
    m[b.kind] = Math.max(b.at, m[b.kind] ?? 0);
    last.set(stay(b.date, b.hotel), m);
  }
  const settled = (key: string, t: number, by: BookingKind[]) => by.some((k) => (last.get(key)?.[k] ?? -1) >= t);
  const recent = (t: number) => now - t <= HUMAN_NEEDED_MS;
  const auto = rec.settings.autoConfirm;
  return rec.bookings.some((b) => {
    const key = stay(b.date, b.hotel);
    switch (b.kind) {
      case 'failed': return recent(b.at) && !settled(key, b.at, ['confirmed']);
      case 'confirming': return recent(b.at) && now - b.at > CONFIRM_GRACE_MS && !settled(key, b.at, ['confirmed', 'failed']);
      case 'hold': return now - b.at < HOLD_MS && (!auto || daysUntil(b.date, now) < AUTO_CONFIRM_MIN_DAYS) && !settled(key, b.at, ['confirming', 'confirmed', 'failed']);
      default: return false;
    }
  }) || rec.events.important.some((e) => e.kind === 'human_needed' && recent(e.t) && !settled(stay(e.date, e.hotel), e.t, ['confirmed']));
}

/** Every reason that applies, in REASONS order, and the verdict (the first's). The runner-liveness ones apply only while
 *  a runner should be running (MODE on, not stopped, a date to look for). */
export function verdictOf(rec: ItsRecord, mode: Mode, now: number): Pick<ItsStatus, 'verdict' | 'reasons'> {
  const s = liveSettings(rec.settings, now);
  const active = mode === 'on' && !s.paused && s.dates.length > 0;
  const r = rec.runner;
  const d = rec.dispatch;
  const lastSeen = r?.lastSeen ?? 0;
  const sinceDispatch = d && lastSeen < d.at;   // no report since 開始
  const starting = active && !!sinceDispatch && now - d.at < START_GRACE_SEC * 1000;
  const ban = rec.events.important.findLast((e) => e.kind === 'ban');
  const solveFails = r ? rec.events.routine.filter((e) => e.kind === 'solve_failed' && e.runId === r.runId && e.t > (r.solveOkSeenAt ?? 0)).length : 0;
  const rules: Record<Reason, [boolean, Verdict]> = {
    mode_off: [mode === 'off', 'off'],
    paused: [s.paused, 'stopped'],
    no_dates: [!s.dates.length, 'idle'],
    dispatch_failed: [active && !!sinceDispatch && !d.ok, 'degraded'],
    starting: [starting, 'starting'],
    never_ran: [active && !starting && !r, 'late'],
    runner_silent: [active && !starting && !!r && now - r.lastSeen > LATE_AFTER_SEC * 1000, 'late'],
    banned: [!!ban && (r?.okSeenAt ?? 0) <= ban.t, 'failing'],
    scan_failing: [active && !!r && r.scanFailures >= SCAN_FAILING, 'failing'],
    solve_failing: [active && !!r && r.solves.failed >= SOLVE_FAILING && solveFails >= SOLVE_FAILING, 'degraded'],
    unsynced: [!!r && r.unsynced > 0, 'degraded'],
    human_needed: [humanNeeded(rec, now), 'degraded'],
  };
  const reasons = REASONS.filter((x) => rules[x][0]);
  return { verdict: reasons.length ? rules[reasons[0]][1] : 'healthy', reasons };
}

/** The runner as the page sees it (the Worker's own stamps left out). */
function shownRunner(r: RunnerRecord | null): ItsStatus['runner'] {
  if (!r) return null;
  const { okSeenAt: _o, solveOkSeenAt: _s, ...shown } = r;
  return shown;
}

/** The newest first: by receive time, then seq. */
const newestFirst = (a: ItsEvent, b: ItsEvent) => b.t - a.t || b.seq - a.seq;

export function statusOf(rec: ItsRecord, mode: Mode, sha: string | null, now: number): ItsStatus {
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
  };
}
