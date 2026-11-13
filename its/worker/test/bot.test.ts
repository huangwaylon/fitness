// The record (src/bot.ts ItsBot) over a fake storage: the lease (grant, renew, expiry, takeover, release), reports
// (events de-duplicated by run and seq, the Worker's receive time, the two rings, seen names), the append-only bookings
// (idempotent, pruned only long after the stay), what survives an eviction, and how few storage calls each takes.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import example from '../../contract-example.json';
import { EVENTS_KEPT, LEASE_SEC, type BookingInput, type EventInput, type ItsSettingsInput } from '../../../app/src/lib/its/contract.ts';
import type { ItsBot } from '../src/bot.ts';
import { MAX_BOOKINGS, SEEN_KEPT } from '../src/rules.ts';
import { MIN, NOW, fakeState, quiet, report, start, type State } from './fakeBot.ts';

let state: State;
let bot: ItsBot;
let logs: ReturnType<typeof quiet>;
const RUN = '19283746';
const settingsInput = (): ItsSettingsInput => ({ ...example.settingsInput, baseUpdatedAt: null }) as ItsSettingsInput;
const booking = (seq: number, x: Partial<BookingInput> = {}): BookingInput => ({ ...example.bookingInput, id: `${RUN}:${seq}`, ...x }) as BookingInput;
const ev = (seq: number, kind: EventInput['kind'] = 'available', x: Partial<EventInput> = {}): EventInput => ({ seq, kind, ...x });
const logged = () => logs.log.mock.calls.flat().join('\n');

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
  logs = quiet();
  state = fakeState();
  bot = await start(state);
  await bot.putSettings(settingsInput(), 'A');
  await bot.run({ action: 'start' }, 'A');   // no token: nothing sent
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
    expect(logs.warn.mock.calls.flat().join('\n')).toContain('its claim run=mbp2-1 host=local ok=0 holder=19283746');
    // the other run's config and reports say lease_lost; its report doesn't become the runner shown
    expect((await bot.config('mbp2-1')).stopReason).toBe('lease_lost');
    const stray = await bot.report(report({ runId: 'mbp2-1', host: 'local', scans: 999 }));
    expect(stray.stopReason).toBe('lease_lost');
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
    expect(logged()).toContain('its claim run=19283999 host=actions ok=1 took_over=19283746');
    const old = await bot.report(report());
    expect([old.stop, old.stopReason]).toEqual([true, 'lease_lost']);
    expect(old.lease?.holder).toBe('19283999');
  });

  it('an expired lease nobody took is still renewed by its holder’s report', async () => {
    await bot.claim({ runId: RUN, host: 'actions' });
    vi.setSystemTime(NOW + 10 * MIN);
    const r = await bot.report(report());
    expect([r.stop, r.lease?.holder, r.lease?.until]).toEqual([false, RUN, NOW + 10 * MIN + LEASE_SEC * 1000]);
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

  it('are shown as the runner, with the Worker’s receive time', async () => {
    vi.setSystemTime(NOW + 1000);
    await bot.report(report());
    const { runner } = await bot.status();
    const { v: _v, events: _e, seen: _s, ...rest } = report();
    expect(runner).toEqual({ ...rest, lastSeen: NOW + 1000 });
  });
});

describe('bookings', () => {
  it('are appended once per id (a retry adds nothing), stamped with the Worker’s time, never changed', async () => {
    let c = await bot.bookings([booking(3)], RUN);
    expect(c.bookings).toEqual([{ ...booking(3), at: NOW }]);
    vi.setSystemTime(NOW + MIN);
    c = await bot.bookings([booking(3, { kind: 'failed' }), booking(5, { kind: 'confirming' })], RUN);
    expect(c.bookings.map((b) => [b.id, b.kind, b.at])).toEqual([['19283746:3', 'hold', NOW], ['19283746:5', 'confirming', NOW + MIN]]);
    const rows = state.count.rows;
    await bot.bookings([booking(3)], RUN);
    expect(state.count.rows).toBe(rows);   // nothing new: nothing written
    expect((await bot.status()).bookings.map((b) => b.id)).toEqual(['19283746:5', '19283746:3']);   // newest first
    expect(logged()).toContain('its booking confirming id=19283746:5 date=2026-11-22 hotel="NAGU 勝浦"');
  });

  it('are pruned only BOOKINGS_KEEP_DAYS after the stay: a reservation is kept till then', async () => {
    await bot.bookings([booking(1, { date: '2026-09-13', kind: 'confirmed', number: '123' }), booking(2, { date: '2026-09-14', kind: 'confirmed', number: '124' }), booking(3)], RUN);
    // 2026-11-13: 61 days after 09-13, 60 after 09-14 (kept, on the record)
    expect((await bot.status()).bookings.map((b) => b.id)).toEqual(['19283746:3', '19283746:2']);
    await bot.bookings([booking(4)], RUN);
    expect((state.kv.get('bookings') as { id: string }[]).map((b) => b.id)).toEqual(['19283746:2', '19283746:3', '19283746:4']);
    expect((await bot.config(RUN)).bookings.map((b) => b.id)).toEqual(['19283746:2', '19283746:3', '19283746:4']);
  });

  it('past MAX_BOOKINGS new entries are refused and logged as an error, none dropped', async () => {
    for (let i = 0; i < MAX_BOOKINGS; i += 50) await bot.bookings(Array.from({ length: 50 }, (_, j) => booking(i + j + 1)), RUN);
    const c = await bot.bookings([booking(9999)], RUN);
    expect(c.bookings).toHaveLength(MAX_BOOKINGS);
    expect(c.bookings[0].id).toBe('19283746:1');
    expect(logs.error).toHaveBeenCalled();
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
    await bot.bookings([booking(1)], RUN);
    const before = await bot.status();
    const again = await start(fakeState(new Map(state.kv)));
    expect(await again.status()).toEqual(before);
  });
});
