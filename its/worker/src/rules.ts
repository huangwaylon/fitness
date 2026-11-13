// The record's rules, free of the Workers runtime (bot.ts holds the record and saves it): the lease, the events' two
// rings, the append-only bookings, the seen names, what a runner is told (RunnerConfig) and the page's verdict
// (ItsStatus). Every time is the Worker's clock (`now`), except the runner's own fields in its report.
import {
  BOOKINGS_KEEP_DAYS, EVENTS_KEPT, IMPORTANT_EVENTS, LATE_AFTER_SEC, LEASE_SEC, REASONS, START_GRACE_SEC,
  daysUntil, normName, tokyoToday,
  type BookingEntry, type BookingInput, type EventInput, type ItsEvent, type ItsSettings, type ItsStatus, type Lease,
  type Reason, type RunnerConfig, type RunnerReport, type Verdict,
} from '../../../app/src/lib/its/contract.ts';

export type Mode = 'on' | 'off';
export type RunnerRecord = NonNullable<ItsStatus['runner']>;
export type Dispatch = NonNullable<ItsStatus['dispatch']>;

/** Everything the object keeps, one storage key per field (bot.ts KEYS). Lists are oldest first. */
export interface ItsRecord {
  settings: ItsSettings;
  bookings: BookingEntry[];
  runner: RunnerRecord | null;
  lease: Lease | null;
  dispatch: Dispatch | null;
  events: { routine: ItsEvent[]; important: ItsEvent[] };
  /** Every facility name offered, with when it was last reported (the newest SEEN_KEPT kept). */
  seen: Record<string, number>;
  /** The highest event seq per run, the newest ACKS_KEPT runs: `[runId, seq]`. */
  acks: [string, number][];
}

export const SEEN_KEPT = 300;
const ACKS_KEPT = 20;
/** The record's bound: past it new entries are refused (and logged), never old ones dropped early. */
export const MAX_BOOKINGS = 500;
/** A failed leg or a human_needed event counts for this long (unless a later 予約確定 for that stay settles it). */
const HUMAN_NEEDED_MS = 24 * 3600_000;
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

/** New entries appended (an id already there is a retry: ignored), stamped with `now`; past MAX_BOOKINGS refused. */
export function addBookings(list: BookingEntry[], inputs: BookingInput[], now: number) {
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
  return { bookings: added.length || kept.length !== list.length ? [...kept, ...added] : list, added, refused };
}

/** The names offered, stamped `now`; past SEEN_KEPT the least recently offered go. Null: nothing new. */
export function addSeen(seen: Record<string, number>, names: string[], now: number): Record<string, number> | null {
  if (!names.length) return null;
  const next: Record<string, number> = { ...seen };
  let isNew = false;
  for (const n of names) {
    if (!(n in next)) isNew = true;
    next[n] = now;
  }
  // a name seen again only moves its time: saved with the next new name (the order only matters at the cap)
  if (!isNew) return null;
  const entries = Object.entries(next);
  if (entries.length <= SEEN_KEPT) return next;
  return Object.fromEntries(entries.sort((a, b) => b[1] - a[1]).slice(0, SEEN_KEPT));
}

/** The runner's report as kept (no events or seen: they have their own keys), with the receive time. */
export function runnerOf(r: RunnerReport, now: number): RunnerRecord {
  const { v: _v, events: _e, seen: _s, ...rest } = r;
  return { ...rest, lastSeen: now };
}

const stay = (date: string | undefined, hotel: string | undefined) => `${date ?? ''}|${normName(hotel ?? '')}`;

/** A failed leg (booking) or a human_needed event within HUMAN_NEEDED_MS that no later 予約確定 for that stay settled. */
function humanNeeded(rec: ItsRecord, now: number): boolean {
  const confirmed = new Map<string, number>();
  for (const b of rec.bookings) if (b.kind === 'confirmed') confirmed.set(stay(b.date, b.hotel), Math.max(b.at, confirmed.get(stay(b.date, b.hotel)) ?? 0));
  const open = (key: string, t: number) => now - t <= HUMAN_NEEDED_MS && (confirmed.get(key) ?? -1) < t;
  return rec.bookings.some((b) => b.kind === 'failed' && open(stay(b.date, b.hotel), b.at))
    || rec.events.important.some((e) => e.kind === 'human_needed' && open(stay(e.date, e.hotel), e.t));
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
  const solveFails = r ? rec.events.routine.filter((e) => e.kind === 'solve_failed' && e.runId === r.runId && e.t > (r.solves.lastOkAt ?? 0)).length : 0;
  const rules: Record<Reason, [boolean, Verdict]> = {
    mode_off: [mode === 'off', 'off'],
    paused: [s.paused, 'stopped'],
    no_dates: [!s.dates.length, 'idle'],
    dispatch_failed: [active && !!sinceDispatch && !d.ok, 'degraded'],
    starting: [starting, 'starting'],
    never_ran: [active && !starting && !r, 'late'],
    runner_silent: [active && !starting && !!r && now - r.lastSeen > LATE_AFTER_SEC * 1000, 'late'],
    banned: [!!ban && (r?.lastOkAt ?? 0) <= ban.t, 'failing'],
    scan_failing: [active && !!r && r.scanFailures >= SCAN_FAILING, 'failing'],
    solve_failing: [active && !!r && r.solves.failed >= SOLVE_FAILING && solveFails >= SOLVE_FAILING, 'degraded'],
    unsynced: [!!r && r.unsynced > 0, 'degraded'],
    human_needed: [humanNeeded(rec, now), 'degraded'],
  };
  const reasons = REASONS.filter((x) => rules[x][0]);
  return { verdict: reasons.length ? rules[reasons[0]][1] : 'healthy', reasons };
}

/** The newest first: by receive time, then seq. */
const newestFirst = (a: ItsEvent, b: ItsEvent) => b.t - a.t || b.seq - a.seq;

export function statusOf(rec: ItsRecord, mode: Mode, sha: string | null, now: number): ItsStatus {
  return {
    v: 1, now, mode, sha,
    ...verdictOf(rec, mode, now),
    settings: liveSettings(rec.settings, now),
    runner: rec.runner,
    lease: rec.lease,
    dispatch: rec.dispatch,
    bookings: pruneBookings(rec.bookings, now).reverse(),
    events: [...rec.events.routine, ...rec.events.important].sort(newestFirst),
    seen: Object.keys(rec.seen).sort(),
  };
}
