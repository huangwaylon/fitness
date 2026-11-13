// The record (src/bot.ts ItsBot) over a fake storage: the lease (grant, renew, expiry, takeover, release), reports
// (events de-duplicated by run and seq, the Worker's receive time, the two rings, seen names), the append-only bookings
// (idempotent, pruned only long after the stay), what survives an eviction, and how few storage calls each takes.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import example from '../../contract-example.json';
import { EVENTS_KEPT, LEASE_SEC, RECENT_MINUTES, RECENT_SCANS_KEPT, RECENT_SCANS_SEC, SCANS_PER_REPORT, type BookingInput, type EventInput, type ItsSettingsInput, type ScanEntry } from '../../../app/src/lib/its/contract.ts';
import type { ItsBot } from '../src/bot.ts';
import { ACKS_KEPT, MAX_BOOKINGS, SEEN_KEPT, SEEN_REFRESH_MS } from '../src/rules.ts';
import { MIN, NOW, fakeState, quiet, report, start, type State } from './fakeBot.ts';

let state: State;
let bot: ItsBot;
let logs: ReturnType<typeof quiet>;
const RUN = '19283746';
const settingsInput = (): ItsSettingsInput => ({ ...example.settingsInput, baseUpdatedAt: null }) as ItsSettingsInput;
const booking = (seq: number, x: Partial<BookingInput> = {}): BookingInput => ({ ...example.bookingInput, id: `${RUN}:${seq}`, ...x }) as BookingInput;
const ev = (seq: number, kind: EventInput['kind'] = 'available', x: Partial<EventInput> = {}): EventInput => ({ seq, kind, ...x });
const logged = () => logs.log.mock.calls.flat().join('\n');
const warned = () => logs.warn.mock.calls.flat().join('\n');
const errored = () => logs.error.mock.calls.flat().join('\n');
/** POST /runner/bookings accepted: its RunnerConfig. */
async function post(list: BookingInput[]) {
  const r = await bot.bookings(list, RUN);
  if (!r.ok) throw new Error(`refused ${r.status} ${r.error}`);
  return r.config;
}

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
  logs = quiet();
  state = fakeState();
  bot = await start(state);
  await bot.putSettings(settingsInput(), 'A', 'r-test');
  await bot.run({ action: 'start' }, 'A', 'r-test');   // no token: nothing sent
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('the lease', () => {
  it('is granted when free, renewed by the holder’s reports, refused to another run while it counts', async () => {
    const c = await bot.claim({ runId: RUN, host: 'actions' });
    expect(c).toMatchObject({ ok: true, lease: { holder: RUN, host: 'actions', until: NOW + LEASE_SEC * 1000 } });
    vi.setSystemTime(NOW + 4 * MIN);
    const r = await bot.report(report());
    expect(r.lease?.until).toBe(NOW + 4 * MIN + LEASE_SEC * 1000);
    expect([r.stop, r.stopReason]).toEqual([false, null]);
    const other = await bot.claim({ runId: 'mbp2-1', host: 'local' });
    expect(other).toEqual({ ok: false, lease: r.lease });
    expect(logs.warn.mock.calls.flat().join('\n')).toContain('its claim run=mbp2-1 host=local ok=0 holder=19283746 holder_host=actions for=300s');
    // the other run's config and reports say lease_lost; its report doesn't become the runner shown
    expect((await bot.config('mbp2-1')).stopReason).toBe('lease_lost');
    const stray = await bot.report(report({ runId: 'mbp2-1', host: 'local', scans: 999 }));
    expect(stray.stopReason).toBe('lease_lost');
    expect(logs.warn.mock.calls.flat().join('\n')).toContain('its report no_lease run=mbp2-1 holder=19283746');
    expect((await bot.status()).runner?.scans).toBe(120);
  });

  it('claiming again is the same run’s renewal', async () => {
    await bot.claim({ runId: RUN, host: 'actions' });
    vi.setSystemTime(NOW + MIN);
    expect(await bot.claim({ runId: RUN, host: 'actions' })).toMatchObject({ ok: true, lease: { until: NOW + MIN + LEASE_SEC * 1000 } });
  });

  it('expires: another run takes it over, and the old holder is told lease_lost', async () => {
    await bot.claim({ runId: RUN, host: 'actions' });
    vi.setSystemTime(NOW + LEASE_SEC * 1000);
    const c = await bot.claim({ runId: '19283999', host: 'actions' });
    expect(c).toMatchObject({ ok: true, lease: { holder: '19283999' } });
    expect(warned()).toContain('its claim run=19283999 host=actions ok=1 took_over=19283746');
    const old = await bot.report(report());
    expect([old.stop, old.stopReason]).toEqual([true, 'lease_lost']);
    expect(old.lease?.holder).toBe('19283999');
  });

  it('an expired lease nobody took is still renewed by its holder’s report (logged renewed_late)', async () => {
    await bot.claim({ runId: RUN, host: 'actions' });
    vi.setSystemTime(NOW + 10 * MIN);
    const r = await bot.report(report());
    expect([r.stop, r.stopReason, r.lease?.holder, r.lease?.until]).toEqual([false, null, RUN, NOW + 10 * MIN + LEASE_SEC * 1000]);
    expect(warned()).toContain('its lease renewed_late run=19283746 late=300s');
    expect(logged()).toContain('lease=renewed');
    // in time: no such line
    logs.warn.mockClear();
    await bot.report(report());
    expect(warned()).not.toContain('renewed_late');
  });

  it('a lease released by run_end is not granted again by a later report of that run', async () => {
    await bot.claim({ runId: RUN, host: 'actions' });
    await bot.report(report({ events: [ev(1, 'run_end', { detail: 'time_up' })] }));
    const r = await bot.report(report());
    expect([r.stop, r.stopReason, r.lease]).toEqual([true, 'lease_lost', null]);
    expect(warned()).not.toContain('renewed_late');
  });

  it('is released by a run_end report, and a report without a claim is told to claim (lease_lost)', async () => {
    await bot.claim({ runId: RUN, host: 'actions' });
    const r = await bot.report(report({ events: [ev(9, 'run_end', { detail: 'time_up' })], phase: 'stopping' }));
    expect(r.lease).toBeNull();
    expect(logged()).toContain('lease=released');
    expect((await bot.status()).runner?.phase).toBe('stopping');   // the last report still shown
    expect((await bot.claim({ runId: 'next', host: 'actions' })).ok).toBe(true);
    await bot.report(report({ events: [ev(9, 'run_end')] }));   // released before: only the next run's lease remains
    expect((await bot.status()).lease?.holder).toBe('next');
    const unclaimed = await bot.report(report({ runId: 'another' }));
    expect(unclaimed.stopReason).toBe('lease_lost');
  });
});

describe('reports', () => {
  beforeEach(async () => {
    await bot.claim({ runId: RUN, host: 'actions' });
  });

  it('take each event once (by run and seq), stamped with the Worker’s receive time; ackSeq says how far', async () => {
    let c = await bot.report(report({ events: [ev(1, 'run_start', { detail: 'dispatch' }), ev(2)] }));
    expect(c.ackSeq).toBe(2);
    vi.setSystemTime(NOW + 30_000);
    c = await bot.report(report({ events: [ev(2), ev(3, 'hold', { date: '2026-11-22', hotel: 'NAGU 勝浦' })] }));   // a retry
    expect(c.ackSeq).toBe(3);
    const s = await bot.status();
    expect(s.events.map((e) => [e.seq, e.kind, e.t])).toEqual([[3, 'hold', NOW + 30_000], [2, 'available', NOW], [1, 'run_start', NOW]]);
    expect(logged()).toContain('ev=1/2');
    expect(logged()).toContain('its event hold run=19283746 seq=3 date=2026-11-22 hotel="NAGU 勝浦"');
    // another run's seq 1 is its own
    await bot.report(report({ runId: 'other', events: [ev(1, 'error', { detail: 'x' })] }));
    expect((await bot.status()).events).toHaveLength(4);
    expect((await bot.config('other')).ackSeq).toBe(1);
  });

  it('keep EVENTS_KEPT of each class: routine ones never push out a hold or a ban', async () => {
    await bot.report(report({ events: [ev(1, 'hold', { date: '2026-11-22', hotel: 'A' }), ev(2, 'ban')] }));
    const many = Array.from({ length: 90 }, (_, i) => ev(3 + i));
    await bot.report(report({ events: many.slice(0, 50) }));
    await bot.report(report({ events: many.slice(50) }));
    const s = await bot.status();
    expect(s.events).toHaveLength(EVENTS_KEPT + 2);
    expect(s.events.filter((e) => e.kind === 'hold' || e.kind === 'ban')).toHaveLength(2);
    expect(s.events[0].seq).toBe(92);
  });

  it('collect the seen names, sorted, capped at SEEN_KEPT (the least recently offered go)', async () => {
    await bot.report(report({ seen: ['B', 'A'] }));
    expect((await bot.status()).seen).toEqual(['A', 'B']);
    vi.setSystemTime(NOW + MIN);
    await bot.report(report({ seen: Array.from({ length: SEEN_KEPT }, (_, i) => `h${i}`).concat('A') }));
    const seen = (await bot.status()).seen;
    expect(seen).toHaveLength(SEEN_KEPT);
    expect(seen).toContain('A');
    expect(seen).not.toContain('B');
  });

  it('a ban clears when the Worker sees lastOkAt move after it, whatever the runner’s clock says', async () => {
    const fast = NOW + 3600_000;   // the runner's clock an hour ahead
    await bot.report(report({ lastOkAt: fast }));
    vi.setSystemTime(NOW + MIN);
    await bot.report(report({ lastOkAt: fast, events: [ev(1, 'ban')] }));
    vi.setSystemTime(NOW + 2 * MIN);
    await bot.report(report({ lastOkAt: fast }));   // no good scan since: still banned
    expect((await bot.status()).reasons).toContain('banned');
    vi.setSystemTime(NOW + 3 * MIN);
    await bot.report(report({ lastOkAt: fast + 1 }));
    expect((await bot.status()).reasons).not.toContain('banned');
  });

  it('a ban clears only on a later good scan from a run that reported since: never by the shown runner switching runs', async () => {
    const at = (min: number) => vi.setSystemTime(NOW + min * MIN);
    await bot.report(report({ lastOkAt: NOW - MIN }));
    at(1);
    await bot.report(report({ lastOkAt: NOW - MIN, events: [ev(1, 'ban')] }));
    await bot.report(report({ lastOkAt: NOW - MIN, events: [ev(2, 'run_end')] }));   // releases the lease
    at(2);
    await bot.claim({ runId: 'run-b', host: 'local' });
    await bot.report(report({ runId: 'run-b', lastOkAt: NOW - 30_000 }));   // another run, its last good scan before the ban
    expect((await bot.status()).reasons).toContain('banned');
    at(3);
    await bot.report(report({ runId: 'run-b', lastOkAt: NOW - 30_000 }));   // its baseline, unmoved
    expect((await bot.status()).reasons).toContain('banned');
    await bot.report(report({ runId: 'run-b', lastOkAt: NOW - 30_000, events: [ev(1, 'run_end')] }));
    at(4);
    await bot.claim({ runId: RUN, host: 'actions' });
    await bot.report(report({ lastOkAt: NOW - MIN }));   // back to the banned run, unmoved
    expect((await bot.status()).reasons).toContain('banned');
    at(5);
    await bot.report(report({ lastOkAt: NOW + 4 * MIN }));   // a good scan since: cleared
    expect((await bot.status()).reasons).not.toContain('banned');
  });

  it('keep the acks of the newest ACKS_KEPT runs: an older run’s seq is forgotten', async () => {
    for (let i = 0; i <= ACKS_KEPT; i++) await bot.report(report({ runId: `run-${i}`, events: [ev(5)] }));
    expect((await bot.config('run-0')).ackSeq).toBe(0);
    expect((await bot.config('run-1')).ackSeq).toBe(5);
    expect((await bot.config(`run-${ACKS_KEPT}`)).ackSeq).toBe(5);
    expect(state.kv.get('acks')).toHaveLength(ACKS_KEPT);
  });

  it('write a seen name offered again only after SEEN_REFRESH_MS (its time then moves)', async () => {
    await bot.report(report({ seen: ['A'] }));
    const rows = () => (state.count.rows);
    let before = rows();
    vi.setSystemTime(NOW + SEEN_REFRESH_MS - 1);
    await bot.report(report({ seen: ['A'] }));
    expect(rows() - before).toBe(2);   // runner + lease
    before = rows();
    vi.setSystemTime(NOW + SEEN_REFRESH_MS);
    await bot.report(report({ seen: ['A'] }));
    expect(rows() - before).toBe(3);   // + seen
    expect(state.kv.get('seen')).toEqual({ A: NOW + SEEN_REFRESH_MS });
  });

  it('are shown as the runner, with the Worker’s receive time', async () => {
    vi.setSystemTime(NOW + 1000);
    await bot.report(report());
    const { runner } = await bot.status();
    const { v: _v, events: _e, seen: _s, ...rest } = report();
    expect(runner).toEqual({ ...rest, lastSeen: NOW + 1000 });
    expect(runner && 'settingsAt' in runner).toBe(false);   // an older runner's report: no new field appears
  });

  it('keep the applied settings’ time and the last IMAP check when the runner sends them', async () => {
    await bot.report(report({ settingsAt: NOW - MIN, mailOk: false }));
    expect((await bot.status()).runner).toMatchObject({ settingsAt: NOW - MIN, mailOk: false });
    await bot.report(report({ settingsAt: null, mailOk: null }));
    expect((await bot.status()).runner).toMatchObject({ settingsAt: null, mailOk: null });
  });

  it('time how long the shown run has had unsynced entries (for /health/its), restarting after a clean report', async () => {
    await bot.report(report({ unsynced: 1 }));
    vi.setSystemTime(NOW + 20 * MIN);
    await bot.report(report({ unsynced: 2 }));
    expect(bot.rec.runner?.unsyncedSince).toBe(NOW);
    expect(await bot.health()).toMatchObject({ unsynced: 2, unsyncedAgeSec: 20 * 60 });
    await bot.report(report({ unsynced: 0 }));
    expect(bot.rec.runner?.unsyncedSince).toBeNull();
    vi.setSystemTime(NOW + 21 * MIN);
    await bot.report(report({ unsynced: 1 }));
    expect(bot.rec.runner?.unsyncedSince).toBe(NOW + 21 * MIN);
    expect('unsyncedSince' in (await bot.status()).runner!).toBe(false);   // the Worker's own: never shown
  });
});

describe('the Worker’s own events and stamps', () => {
  it('a claim that takes over a lease its holder never released records prev_unclean (important, seq 0, the old run in detail)', async () => {
    await bot.claim({ runId: RUN, host: 'actions' });
    vi.setSystemTime(NOW + LEASE_SEC * 1000);
    await bot.claim({ runId: '19283999', host: 'actions' });
    const e = (await bot.status()).events.find((x) => x.kind === 'prev_unclean');
    expect(e).toEqual({ runId: '19283999', seq: 0, t: NOW + LEASE_SEC * 1000, kind: 'prev_unclean', detail: RUN });
    expect(bot.rec.events.important.map((x) => x.kind)).toContain('prev_unclean');
    expect(warned()).toContain('its claim run=19283999 host=actions ok=1 took_over=19283746 event=prev_unclean');
    // its seq 0 is no ack: the run's own events from seq 1 are taken
    expect((await bot.report(report({ runId: '19283999', events: [ev(1, 'run_start')] }))).ackSeq).toBe(1);
  });

  it('a claim after a clean release (run_end), or a run claiming again, records nothing', async () => {
    await bot.claim({ runId: RUN, host: 'actions' });
    await bot.claim({ runId: RUN, host: 'actions' });
    await bot.report(report({ events: [ev(1, 'run_end', { detail: 'time_up' })] }));
    await bot.claim({ runId: 'next', host: 'actions' });
    expect((await bot.status()).events.map((x) => x.kind)).not.toContain('prev_unclean');
  });

  it('a preflight (GET /runner/config without a runId) is stamped lastPreflight; a run’s own config read is not', async () => {
    expect((await bot.status()).lastPreflight).toBeNull();
    vi.setSystemTime(NOW + MIN);
    await bot.config(null);
    vi.setSystemTime(NOW + 2 * MIN);
    await bot.config(RUN);
    expect((await bot.status()).lastPreflight).toBe(NOW + MIN);
    expect(state.kv.get('preflight')).toBe(NOW + MIN);
    expect((await bot.health()).lastPreflightAgeSec).toBe(60);
  });
});

describe('recent scans (the page’s minute strip)', () => {
  const scan = (t: number, x: Partial<ScanEntry> = {}): ScanEntry => ({ t, ok: true, ms: 800, avail: 0, ...x });
  const recent = async () => (await bot.status()).recentScans;
  beforeEach(async () => {
    await bot.claim({ runId: RUN, host: 'actions' });
  });

  it('appends a report’s scans, oldest first, in the report’s one put', async () => {
    expect(await recent()).toEqual([]);
    const puts = state.count.puts;
    await bot.report(report({ scansLog: [scan(NOW - 20_000), scan(NOW - 5000, { ok: false, code: 'timeout', ms: 20_000 })] }));
    expect(state.count.puts).toBe(puts + 1);
    vi.setSystemTime(NOW + 30_000);
    await bot.report(report({ scansLog: [scan(NOW + 10_000, { avail: 1 })] }));
    expect(await recent()).toEqual([scan(NOW - 20_000), scan(NOW - 5000, { ok: false, code: 'timeout', ms: 20_000 }), scan(NOW + 10_000, { avail: 1 })]);
  });

  it('a retried report (the same run, the same t) adds nothing; another run’s scans at the same t are its own', async () => {
    await bot.report(report({ scansLog: [scan(NOW - 1000)] }));
    await bot.report(report({ scansLog: [scan(NOW - 1000), scan(NOW)] }));
    await bot.report(report({ runId: 'stray-1', scansLog: [scan(NOW)] }));   // without the lease: its scans still count
    expect((await recent())?.map((s) => s.t)).toEqual([NOW - 1000, NOW, NOW]);
  });

  it('ages out by the Worker’s receive time after RECENT_SCANS_SEC, across runs (nothing cleared at a run’s end)', async () => {
    await bot.report(report({ scansLog: [scan(NOW)], events: [ev(1, 'run_end')] }));
    vi.setSystemTime(NOW + 30 * MIN);
    await bot.claim({ runId: 'next', host: 'actions' });
    await bot.report(report({ runId: 'next', scansLog: [scan(NOW + 30 * MIN)] }));
    expect((await recent())?.length).toBe(2);
    vi.setSystemTime(NOW + RECENT_SCANS_SEC * 1000 + 1);
    expect((await recent())?.map((s) => s.t)).toEqual([NOW + 30 * MIN]);   // on read, nothing written
    await bot.report(report({ runId: 'next' }));
    expect((state.kv.get('scans') as { log: unknown[] }[]).flatMap((b) => b.log)).toHaveLength(1);   // and dropped at the next write
  });

  it('keeps at most RECENT_SCANS_KEPT, the newest; an older runner’s report (no scansLog) changes nothing', async () => {
    for (let i = 0; i < 11; i++) {
      vi.setSystemTime(NOW + i * 30_000);
      await bot.report(report({ scansLog: Array.from({ length: SCANS_PER_REPORT }, (_, j) => scan(NOW + i * 30_000 + j * 1000)) }));
    }
    const all = (await recent())!;
    expect(all).toHaveLength(RECENT_SCANS_KEPT);
    expect(all.at(-1)!.t).toBe(NOW + 10 * 30_000 + (SCANS_PER_REPORT - 1) * 1000);
    const rows = state.count.rows;
    await bot.report(report());
    expect(state.count.rows - rows).toBe(2);   // runner + lease only
    expect((await recent())!).toHaveLength(RECENT_SCANS_KEPT);
    // what the page reads stays small: 240 entries ≈ 12 KB
    expect(JSON.stringify(all.slice(-240)).length).toBeLessThan(13_000);
  });

  it('never shows the scans in the runner’s last report', async () => {
    await bot.report(report({ scansLog: [scan(NOW)] }));
    expect('scansLog' in (await bot.status()).runner!).toBe(false);
  });
});

describe('recent minutes (the strip, aggregated: every read of the hour, however many run)', () => {
  const scan = (t: number, x: Partial<ScanEntry> = {}): ScanEntry => ({ t, ok: true, ms: 800, avail: 0, ...x });
  const minutes = async () => (await bot.status()).recentMinutes;
  const M0 = Math.floor(NOW / MIN) * MIN;   // a Tokyo minute is a UTC minute (+9 h)
  beforeEach(async () => {
    await bot.claim({ runId: RUN, host: 'actions' });
  });

  it('one entry per minute of the reads’ own time: counts, failures by code, the most vacancies; across runs', async () => {
    expect(await minutes()).toEqual([]);
    const puts = state.count.puts;
    await bot.report(report({ scansLog: [scan(M0 + 1000), scan(M0 + 20_000, { ok: false, code: 'timeout' }), scan(M0 + 40_000, { avail: 2 }), scan(M0 + 61_000, { ok: false, code: 'http_503' })] }));
    expect(state.count.puts).toBe(puts + 1);
    await bot.report(report({ runId: 'other-1', scansLog: [scan(M0 + 5000, { ok: false, code: 'timeout' }), scan(M0 + 6000, { avail: 1 })] }));
    expect(await minutes()).toEqual([
      { minute: M0, n: 5, ok: 3, fail: 2, avail: 2, codes: { timeout: 2 } },
      { minute: M0 + MIN, n: 1, ok: 0, fail: 1, avail: 0, codes: { http_503: 1 } },
    ]);
    // a retried report adds nothing
    await bot.report(report({ scansLog: [scan(M0 + 40_000, { avail: 2 })] }));
    expect((await minutes())![0].n).toBe(5);
  });

  it('keeps every read of the hour past RECENT_SCANS_KEPT (two runs at 15 s: 480 an hour), bounded at RECENT_MINUTES', async () => {
    for (let i = 0; i < 120; i++) {   // 2 h of reports every 60 s, 8 reads each from two runs
      vi.setSystemTime(M0 + i * MIN);
      for (const run of [RUN, 'other-1']) await bot.report(report({ runId: run, scansLog: [0, 15, 30, 45].map((s) => scan(M0 + i * MIN + s * 1000)) }));
    }
    const all = (await minutes())!;
    expect(all).toHaveLength(RECENT_MINUTES);
    expect(all.every((m) => m.n === 8)).toBe(true);
    expect(all.at(-1)!.minute).toBe(M0 + 119 * MIN);
    expect(all.reduce((n, m) => n + m.n, 0)).toBe(480);
    expect((await bot.status()).recentScans).toHaveLength(RECENT_SCANS_KEPT);   // the older field, as before
    expect((state.kv.get('minutes') as unknown[]).length).toBeLessThanOrEqual(RECENT_MINUTES + 1);
    expect(JSON.stringify(all).length).toBeLessThan(5000);
    // read later: aged out on read, nothing written
    vi.setSystemTime(M0 + 180 * MIN);
    expect(await minutes()).toEqual([]);
  });

  it('caps the failure codes per minute', async () => {
    await bot.report(report({ scansLog: Array.from({ length: 12 }, (_, i) => scan(M0 + i * 1000, { ok: false, code: `c${i}` })) }));
    const [m] = (await minutes())!;
    expect(Object.keys(m.codes!)).toHaveLength(8);
    expect(m.fail).toBe(12);
  });
});

describe('health (codes only)', () => {
  it('says the verdict, the reasons, ages and counts, and never a date, a facility or a name', async () => {
    expect(await bot.health()).toEqual({ verdict: 'starting', reasons: ['starting'], lastSeenAgeSec: null, phase: null, unsynced: 0, unsyncedAgeSec: null, lastPreflightAgeSec: null });
    await bot.claim({ runId: RUN, host: 'actions' });
    await bot.report(report({ events: [ev(1, 'hold', { date: '2026-11-22', hotel: 'NAGU 勝浦' })], seen: ['NAGU 勝浦'] }));
    vi.setSystemTime(NOW + 90_500);
    const h = await bot.health();
    expect(h).toEqual({ verdict: 'healthy', reasons: [], lastSeenAgeSec: 90, phase: 'scanning', unsynced: 0, unsyncedAgeSec: null, lastPreflightAgeSec: null });
    expect(JSON.stringify(h)).not.toMatch(/2026|NAGU|勝浦|19283746/);
  });
});

describe('bookings', () => {
  it('are appended once per id (a retry adds nothing), stamped with the Worker’s time, never changed', async () => {
    let c = await post([booking(3)]);
    expect(c.bookings).toEqual([{ ...booking(3), at: NOW }]);
    vi.setSystemTime(NOW + MIN);
    c = await post([booking(3), booking(5, { kind: 'confirming' })]);
    expect(c.bookings.map((b) => [b.id, b.kind, b.at])).toEqual([['19283746:3', 'hold', NOW], ['19283746:5', 'confirming', NOW + MIN]]);
    const rows = state.count.rows;
    await post([booking(3)]);
    expect(state.count.rows).toBe(rows);   // nothing new: nothing written
    expect((await bot.status()).bookings.map((b) => b.id)).toEqual(['19283746:5', '19283746:3']);   // newest first
    expect(logged()).toContain('its booking confirming id=19283746:5 date=2026-11-22 hotel="NAGU 勝浦"');
  });

  it('an id reused for other content is refused whole (409 id_conflict, logged), never taken as a retry', async () => {
    await post([booking(3)]);
    const rows = state.count.rows;
    for (const other of [{ kind: 'confirmed', number: '1' }, { date: '2026-11-21' }, { hotel: 'リソル' }] as const) {
      expect(await bot.bookings([booking(4), booking(3, other)], RUN)).toEqual({ ok: false, status: 409, error: 'id_conflict' });
    }
    expect(await bot.bookings([booking(6), booking(6, { kind: 'failed' })], RUN)).toMatchObject({ status: 409 });   // within one post
    expect(state.count.rows).toBe(rows);
    expect((await bot.config(RUN)).bookings.map((b) => b.id)).toEqual(['19283746:3']);
    expect(errored()).toContain('its bookings refused id_conflict run=19283746 id=19283746:3 had=hold/2026-11-22/"NAGU 勝浦" got=confirmed/2026-11-22/"NAGU 勝浦"');
  });

  it('are pruned only BOOKINGS_KEEP_DAYS after the stay: a reservation is kept till then', async () => {
    await post([booking(1, { date: '2026-09-13', kind: 'confirmed', number: '123' }), booking(2, { date: '2026-09-14', kind: 'confirmed', number: '124' }), booking(3)]);
    // 2026-11-13: 61 days after 09-13, 60 after 09-14 (kept, on the record)
    expect((await bot.status()).bookings.map((b) => b.id)).toEqual(['19283746:3', '19283746:2']);
    await post([booking(4)]);
    expect((state.kv.get('bookings') as { id: string }[]).map((b) => b.id)).toEqual(['19283746:2', '19283746:3', '19283746:4']);
    expect((await bot.config(RUN)).bookings.map((b) => b.id)).toEqual(['19283746:2', '19283746:3', '19283746:4']);
  });

  it('past MAX_BOOKINGS new entries are refused (507 record_full, logged as an error: the runner stays unsynced), none dropped', async () => {
    for (let i = 0; i < MAX_BOOKINGS - 1; i += 50) await post(Array.from({ length: Math.min(50, MAX_BOOKINGS - 1 - i) }, (_, j) => booking(i + j + 1)));
    // the last place taken, the next refused
    expect(await bot.bookings([booking(9998), booking(9999)], RUN)).toEqual({ ok: false, status: 507, error: 'record_full' });
    const c = await bot.config(RUN);
    expect(c.bookings).toHaveLength(MAX_BOOKINGS);
    expect([c.bookings[0].id, c.bookings.at(-1)!.id]).toEqual(['19283746:1', '19283746:9998']);
    expect(errored()).toContain('its bookings refused record_full run=19283746 n=1 kept=');
    // a retry of what was kept is still a retry; the refused one is refused again
    expect(await bot.bookings([booking(9998), booking(9999)], RUN)).toMatchObject({ status: 507 });
  });
});

describe('storage', () => {
  it('reads everything in one call at start; a status read touches nothing; each change is one put', async () => {
    const s2 = fakeState(new Map(state.kv));
    const b2 = await start(s2);
    expect(s2.count).toEqual({ gets: 1, puts: 0, rows: 0 });
    await b2.status();
    await b2.config(RUN);
    expect(s2.count).toEqual({ gets: 1, puts: 0, rows: 0 });
    await b2.claim({ runId: RUN, host: 'actions' });
    expect(s2.count).toMatchObject({ puts: 1, rows: 1 });
    await b2.report(report());                                   // runner + lease
    expect(s2.count).toMatchObject({ puts: 2, rows: 3 });
    await b2.report(report({ events: [ev(1)], seen: ['X'] }));   // + events, acks, seen
    expect(s2.count).toMatchObject({ puts: 3, rows: 8 });
    await b2.report(report({ events: [ev(1)], seen: ['X'] }));   // nothing new: runner + lease only
    expect(s2.count).toMatchObject({ puts: 4, rows: 10 });
  });

  it('keeps everything across an eviction', async () => {
    await bot.claim({ runId: RUN, host: 'actions' });
    await bot.report(report({ events: [ev(1, 'hold', { date: '2026-11-22', hotel: 'A' })], seen: ['A'] }));
    await post([booking(1)]);
    await bot.run({ action: 'stop' }, 'B', 'r-test');
    const before = await bot.status();
    expect(before.control).toEqual({ action: 'stop', by: 'B', at: NOW });
    const again = await start(fakeState(new Map(state.kv)));
    expect(await again.status()).toEqual(before);
  });
});

describe('a put that throws', () => {
  it('acknowledges nothing: the record in memory stays as it was, the call fails', async () => {
    await bot.claim({ runId: RUN, host: 'actions' });
    const put = state.ctx.storage.put;
    state.ctx.storage.put = async () => { throw new Error('storage down'); };
    await expect(bot.bookings([booking(1)], RUN)).rejects.toThrow('storage down');
    await expect(bot.report(report({ events: [ev(1, 'hold', { date: '2026-11-22', hotel: 'A' })], seen: ['A'] }))).rejects.toThrow();
    await expect(bot.run({ action: 'stop' }, 'B', 'r-test')).rejects.toThrow();
    state.ctx.storage.put = put;
    const c = await bot.config(RUN);
    expect([c.bookings, c.ackSeq, c.settings.paused]).toEqual([[], 0, false]);
    const s = await bot.status();
    expect([s.events, s.seen, s.control]).toEqual([[], [], { action: 'start', by: 'A', at: NOW }]);
    // the retry is taken
    expect((await post([booking(1)])).bookings).toHaveLength(1);
  });
});
