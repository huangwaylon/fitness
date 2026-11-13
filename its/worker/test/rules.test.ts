// The verdict (src/rules.ts verdictOf): each reason on its own, the order (the verdict is the first's), and which ones
// only count while a runner should be running.
import { describe, expect, it } from 'vitest';
import example from '../../contract-example.json';
import {
  DEFAULT_SETTINGS, LATE_AFTER_SEC, SETTINGS_STALE_SEC, START_GRACE_SEC,
  type BookingEntry, type ItsEvent, type ItsSettings,
} from '../../../app/src/lib/its/contract.ts';
import { CONFIRM_GRACE_MS, verdictOf, type ItsRecord, type Mode, type RunnerRecord } from '../src/rules.ts';
import { MIN, NOW } from './fakeBot.ts';

const HOUR = 60 * MIN;
const settings: ItsSettings = { ...(example.config.settings as ItsSettings) };
const { v: _v, events: _e, seen: _s, ...reported } = example.report;
const runner = (x: Partial<RunnerRecord> = {}): RunnerRecord => ({ ...(structuredClone(reported) as unknown as RunnerRecord), lastSeen: NOW - 10_000, lastOkAt: NOW - 20_000, okSeenAt: NOW - 10_000, solveOkSeenAt: NOW - 3 * 3600_000, ...x });
const event = (kind: ItsEvent['kind'], t: number, x: Partial<ItsEvent> = {}): ItsEvent => ({ runId: '19283746', seq: 1, t, kind, ...x });
const entry = (kind: BookingEntry['kind'], at: number, x: Partial<BookingEntry> = {}): BookingEntry =>
  ({ id: `r:${at}`, kind, date: '2026-11-22', hotel: 'NAGU 勝浦', at, runId: 'r', ...x });

/** A healthy record: running, reported 10 s ago; with changes. */
function rec(x: Partial<ItsRecord> = {}): ItsRecord {
  return { settings, bookings: [], runner: runner(), lease: null, dispatch: null, control: null, events: { routine: [], important: [] }, seen: {}, acks: [], preflight: null, scans: [], subs: [], pushq: [], pushlog: { lastSentAt: null, lastOutcome: null, done: [] }, ...x };
}
const verdict = (r: ItsRecord, mode: Mode = 'on', now = NOW) => verdictOf(r, mode, now);

describe('verdictOf', () => {
  it('healthy: running and reporting', () => {
    expect(verdict(rec())).toEqual({ verdict: 'healthy', reasons: [] });
  });

  it('mode_off → off, paused → stopped, no_dates → idle; then a silent runner doesn’t count', () => {
    const silent = runner({ lastSeen: NOW - 2 * LATE_AFTER_SEC * 1000 });
    expect(verdict(rec({ runner: silent }), 'off')).toEqual({ verdict: 'off', reasons: ['mode_off'] });
    expect(verdict(rec({ runner: silent, settings: { ...settings, paused: true } }))).toEqual({ verdict: 'stopped', reasons: ['paused'] });
    expect(verdict(rec({ runner: silent, settings: { ...settings, dates: [] } }))).toEqual({ verdict: 'idle', reasons: ['no_dates'] });
    // dates all past count as none
    expect(verdict(rec({ settings: { ...settings, dates: ['2026-11-01'] } })).reasons).toEqual(['no_dates']);
    // a fresh record: stopped, nothing else
    expect(verdict(rec({ settings: DEFAULT_SETTINGS, runner: null }))).toEqual({ verdict: 'stopped', reasons: ['paused', 'no_dates'] });
  });

  it('starting: dispatched, no report since, within START_GRACE_SEC; then never_ran / runner_silent', () => {
    const d = { at: NOW - MIN, ok: true, status: 204 };
    expect(verdict(rec({ runner: null, dispatch: d }))).toEqual({ verdict: 'starting', reasons: ['starting'] });
    expect(verdict(rec({ runner: null, dispatch: d }), 'on', NOW + START_GRACE_SEC * 1000)).toEqual({ verdict: 'late', reasons: ['never_ran'] });
    expect(verdict(rec({ runner: null }))).toEqual({ verdict: 'late', reasons: ['never_ran'] });
    // a report after the dispatch: started
    expect(verdict(rec({ dispatch: { ...d, at: NOW - 20_000 } })).reasons).toEqual([]);
    const old = runner({ lastSeen: NOW - 3 * HOUR });
    expect(verdict(rec({ runner: old, dispatch: d }))).toEqual({ verdict: 'starting', reasons: ['starting'] });
    expect(verdict(rec({ runner: old }))).toEqual({ verdict: 'late', reasons: ['runner_silent'] });
    expect(verdict(rec({ runner: runner({ lastSeen: NOW - LATE_AFTER_SEC * 1000 + 1 }) })).reasons).toEqual([]);
  });

  it('dispatch_failed: the dispatch was refused and no report has come since', () => {
    const d = { at: NOW - MIN, ok: false, status: 403 };
    expect(verdict(rec({ runner: null, dispatch: d }))).toEqual({ verdict: 'degraded', reasons: ['dispatch_failed', 'starting'] });
    expect(verdict(rec({ dispatch: { ...d, at: NOW - HOUR } })).reasons).toEqual([]);   // reported since
    expect(verdict(rec({ runner: null, dispatch: d, settings: { ...settings, paused: true } })).reasons).toEqual(['paused']);
  });

  it('banned → failing, until the Worker receives a report whose lastOkAt moved after the ban', () => {
    const ban = event('ban', NOW - HOUR);
    const r = (okSeenAt: number | null, lastOkAt: number | null = okSeenAt) => rec({ runner: runner({ lastOkAt, okSeenAt }), events: { routine: [], important: [ban] } });
    expect(verdict(r(NOW - 2 * HOUR))).toEqual({ verdict: 'failing', reasons: ['banned'] });
    expect(verdict(r(null)).reasons).toEqual(['banned']);   // a new run, no good scan yet
    expect(verdict(r(NOW - MIN)).reasons).toEqual([]);
    // the runner's clock an hour fast: its lastOkAt reads after the ban, but the Worker saw it move before
    expect(verdict(r(NOW - 2 * HOUR, NOW)).reasons).toEqual(['banned']);
  });

  it('scan_failing → failing at 3 failed reads in a row', () => {
    expect(verdict(rec({ runner: runner({ scanFailures: 2 }) })).reasons).toEqual([]);
    expect(verdict(rec({ runner: runner({ scanFailures: 3 }) }))).toEqual({ verdict: 'failing', reasons: ['scan_failing'] });
  });

  it('solve_failing → degraded: 3 solve_failed events since the last solve', () => {
    const fails = (n: number, since: number) => Array.from({ length: n }, (_, i) => event('solve_failed', since + i * 1000, { seq: i + 1 }));
    const r = (n: number, seenAt: number | null, lastOkAt = seenAt) => rec({
      runner: runner({ solves: { ok: lastOkAt ? 1 : 0, failed: n, lastOkAt, lastSecs: 19, lastSpot: 'centre' }, solveOkSeenAt: seenAt }),
      events: { routine: fails(n, NOW - 10 * MIN), important: [] },
    });
    expect(verdict(r(3, null))).toEqual({ verdict: 'degraded', reasons: ['solve_failing'] });
    expect(verdict(r(2, null)).reasons).toEqual([]);
    expect(verdict(r(3, NOW - MIN)).reasons).toEqual([]);   // solved after them (the Worker saw it)
    // the runner's clock fast: its lastOkAt reads after them, the Worker's receive time doesn't
    expect(verdict(r(3, NOW - HOUR, NOW)).reasons).toEqual(['solve_failing']);
  });

  it('unsynced → degraded while the runner holds entries the Worker hasn’t got', () => {
    expect(verdict(rec({ runner: runner({ unsynced: 1 }) }))).toEqual({ verdict: 'degraded', reasons: ['unsynced'] });
  });

  it('human_needed → degraded: a human_needed event or a failed leg within 24 h, unless a later 予約確定 settles that stay', () => {
    const need = event('human_needed', NOW - HOUR, { date: '2026-11-22', hotel: 'NAGU 勝浦', detail: 'near_date' });
    expect(verdict(rec({ events: { routine: [], important: [need] } }))).toEqual({ verdict: 'degraded', reasons: ['human_needed'] });
    expect(verdict(rec({ runner: runner({ lastSeen: NOW + 24 * HOUR }), events: { routine: [], important: [need] } }), 'on', NOW + 24 * HOUR).reasons).toEqual([]);
    expect(verdict(rec({ bookings: [entry('failed', NOW - HOUR)] })).reasons).toEqual(['human_needed']);
    // settled: a confirmed for the same stay (the name compared as the runner does), after it
    const settled = [entry('failed', NOW - HOUR), entry('confirmed', NOW - MIN, { hotel: 'ＮＡＧＵ　勝浦', number: '1' })];
    expect(verdict(rec({ bookings: settled, events: { routine: [], important: [need] } })).reasons).toEqual([]);
    // another stay's confirmation doesn't
    expect(verdict(rec({ bookings: [entry('failed', NOW - HOUR), entry('confirmed', NOW - MIN, { date: '2026-11-21' })] })).reasons).toEqual(['human_needed']);
    // an earlier one doesn't either
    expect(verdict(rec({ bookings: [entry('confirmed', NOW - 2 * HOUR), entry('failed', NOW - HOUR)] })).reasons).toEqual(['human_needed']);
    // a hold the runner finishes itself (auto-confirm on, the stay ≥ 11 days away) is not
    const auto = { ...settings, autoConfirm: true, dates: ['2026-11-24'] };
    expect(verdict(rec({ settings: auto, bookings: [entry('hold', NOW - MIN, { date: '2026-11-24' })] })).reasons).toEqual([]);
  });

  it('human_needed: a hold within its 30 min that a person must finish (auto-confirm off, or a near stay)', () => {
    const hold = (at: number, x: Partial<BookingEntry> = {}) => entry('hold', at, x);
    expect(verdict(rec({ bookings: [hold(NOW - MIN)] })).reasons).toEqual(['human_needed']);   // auto-confirm off
    expect(verdict(rec({ bookings: [hold(NOW - 30 * MIN)] })).reasons).toEqual([]);           // lapsed
    const auto = { ...settings, autoConfirm: true, dates: ['2026-11-22', '2026-11-24'] };
    expect(verdict(rec({ settings: auto, bookings: [hold(NOW - MIN)] })).reasons).toEqual(['human_needed']);   // 9 days: near
    expect(verdict(rec({ settings: auto, bookings: [hold(NOW - MIN, { date: '2026-11-24' })] })).reasons).toEqual([]);
    // a later step for that stay settles it
    expect(verdict(rec({ bookings: [hold(NOW - 2 * MIN), entry('confirming', NOW - MIN)] })).reasons).toEqual([]);
  });

  it('human_needed: a confirming without its confirmed or failed past the grace (24 h window)', () => {
    const c = entry('confirming', NOW - CONFIRM_GRACE_MS - MIN);
    expect(verdict(rec({ bookings: [c] })).reasons).toEqual(['human_needed']);
    expect(verdict(rec({ bookings: [entry('confirming', NOW - MIN)] })).reasons).toEqual([]);   // in flight
    expect(verdict(rec({ bookings: [c, entry('confirmed', NOW - MIN, { number: '1' })] })).reasons).toEqual([]);
    expect(verdict(rec({ bookings: [entry('confirming', NOW - 25 * HOUR)] })).reasons).toEqual([]);
    // settled by a failed: that one's own rule then (till a 予約確定)
    expect(verdict(rec({ bookings: [c, entry('failed', NOW - MIN)] })).reasons).toEqual(['human_needed']);
  });

  it('mail_failing → degraded: the last IMAP check failed while auto-confirm is on (a running runner only)', () => {
    const auto = { ...settings, autoConfirm: true };
    expect(verdict(rec({ settings: auto, runner: runner({ mailOk: false }) }))).toEqual({ verdict: 'degraded', reasons: ['mail_failing'] });
    expect(verdict(rec({ runner: runner({ mailOk: false }) })).reasons).toEqual([]);   // auto-confirm off: holds wait for a person anyway
    for (const mailOk of [true, null, undefined]) expect(verdict(rec({ settings: auto, runner: runner({ mailOk }) })).reasons, String(mailOk)).toEqual([]);
    expect(verdict(rec({ settings: { ...auto, paused: true }, runner: runner({ mailOk: false }) })).reasons).toEqual(['paused']);
  });

  it('settings_stale → degraded: the run holding the lease still applies older settings SETTINGS_STALE_SEC after a save', () => {
    const saved = { ...settings, updatedAt: NOW - 3 * MIN };
    const lease = { holder: '19283746', host: 'actions' as const, until: NOW + 4 * MIN };
    const r = (settingsAt: number | null | undefined, x: Partial<ItsRecord> = {}) => rec({ settings: saved, lease, runner: runner({ settingsAt }), ...x });
    expect(verdict(r(NOW - 3 * HOUR))).toEqual({ verdict: 'degraded', reasons: ['settings_stale'] });
    expect(verdict(r(null)).reasons).toEqual(['settings_stale']);   // never got any
    expect(verdict(r(NOW - 3 * MIN)).reasons).toEqual([]);          // applied
    expect(verdict(r(undefined)).reasons).toEqual([]);              // an older runner says nothing
    // within four reports (two minutes) of the save: two cycles flickered
    expect(SETTINGS_STALE_SEC).toBe(120);
    expect(verdict(r(NOW - 3 * HOUR, { settings: { ...saved, updatedAt: NOW - 90_000 } })).reasons).toEqual([]);
    expect(verdict(r(NOW - 3 * HOUR, { settings: { ...saved, updatedAt: NOW - SETTINGS_STALE_SEC * 1000 } })).reasons).toEqual([]);
    // the run has ended (lease released) or someone else's holds it: nothing to apply them
    expect(verdict(r(NOW - 3 * HOUR, { lease: null })).reasons).toEqual([]);
    expect(verdict(r(NOW - 3 * HOUR, { lease: { ...lease, holder: 'other' } })).reasons).toEqual([]);
    expect(verdict(r(NOW - 3 * HOUR, { lease: { ...lease, until: NOW - 1 } })).reasons).toEqual([]);
  });

  it('lists every reason in REASONS order, the verdict the first’s', () => {
    const r = rec({
      runner: runner({ scanFailures: 5, unsynced: 2 }),
      events: { routine: [], important: [event('ban', NOW - HOUR), event('human_needed', NOW - HOUR)] },
      bookings: [],
    });
    r.runner!.okSeenAt = NOW - 2 * HOUR;
    expect(verdict(r)).toEqual({ verdict: 'failing', reasons: ['banned', 'scan_failing', 'unsynced', 'human_needed'] });
    expect(verdict(r, 'off').reasons).toEqual(['mode_off', 'banned', 'unsynced', 'human_needed']);
  });
});
