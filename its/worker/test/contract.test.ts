// The shared example (its/contract-example.json, the runner's tests read it too): every input in it passes this
// Worker's checks unchanged, and the Worker, fed the example's inputs, answers the example's config and status (the same
// shape; the same values where the example's own clock allows). And the checks' bounds on runner bodies.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import example from '../../contract-example.json';
import { LIMITS, MAX_NAME, MAX_SITE_NAME, SCANS_PER_REPORT, parseSettingsInput, type ItsSettings, type RunnerConfig } from '../../../app/src/lib/its/contract.ts';
import { parseBookings, parseClaim, parseReport, parseRunInput } from '../src/validate.ts';
import { NOW, fakeState, quiet, start } from './fakeBot.ts';

/** A value's shape: its keys and their types, arrays by their first element (null and absent told apart). */
function shape(x: unknown): unknown {
  if (Array.isArray(x)) return x.length ? [shape(x[0])] : [];
  if (x && typeof x === 'object') return Object.fromEntries(Object.entries(x).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => [k, shape(v)]));
  return x === null ? 'null' : typeof x;
}

/** The example's settings body less its allow-list: the settings its config and status show (none saved). */
const { search: _search, ...olderInput } = example.settingsInput;

describe('the example’s inputs', () => {
  it('pass the checks unchanged', () => {
    expect(parseSettingsInput(example.settingsInput, NOW)).toEqual({ ok: true, value: example.settingsInput });
    expect(parseRunInput(example.runInput)).toEqual({ ok: true, value: example.runInput });
    expect(parseClaim(example.claimInput)).toEqual({ ok: true, value: example.claimInput });
    expect(parseBookings([example.bookingInput])).toEqual({ ok: true, value: [example.bookingInput] });
    expect(parseReport(example.report)).toEqual({ ok: true, value: example.report });
  });
});

describe('the Worker on the example', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    quiet();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('answers the example’s config and status', async () => {
    const at = (t: number) => vi.setSystemTime(t);
    // the settings as saved before the example's edit, then started (no token: the schedule's run)
    const bot = await start(fakeState(), { COMMIT: 'abc1234' });
    at(example.config.settings.updatedAt!);
    await bot.putSettings({ ...olderInput, baseUpdatedAt: null } as never, 'A', 'r-test');
    await bot.run({ action: 'start' }, 'A', 'r-test');
    bot.rec.dispatch = null;   // the example's run came from the schedule
    at(example.status.lastPreflight);
    await bot.config(null);   // its preflight
    at(example.report.startedAt);
    expect((await bot.claim(example.claimInput as never)).ok).toBe(true);
    at(example.config.bookings[0].at);
    await bot.bookings([example.bookingInput as never], example.claimInput.runId);
    // the report's events arrive with the hold
    const { events, ...rest } = example.report;
    await bot.report({ ...rest, phase: 'scanning', events: [events[0]] } as never);
    at(example.status.events[0].t);
    await bot.report({ ...rest, events: [events[1]] } as never);
    at(example.config.lease.until - 300_000);
    const config: RunnerConfig = await bot.report(example.report as never);
    expect(shape(config)).toEqual(shape(example.config));
    expect(config).toEqual(example.config);
    at(example.status.runner.lastSeen);
    await bot.report(example.report as never);
    at(example.status.now);
    const status = await bot.status();
    // the example's push has two phones and a key (test/push.test.ts); this Worker has neither
    const { lease: _l, push: _p, ...want } = example.status;
    const { lease, push, ...got } = status;
    expect(got).toEqual(want);
    expect(push).toEqual({ A: 0, B: 0, vapidPublic: null, lastSentAt: null, lastOutcome: null });
    expect(lease).toEqual({ ...example.config.lease, until: example.status.runner.lastSeen + 300_000 });
    expect(status.settings).toEqual(example.config.settings as ItsSettings);
  });

  it('the status’s shape matches the example’s (every key, every type)', async () => {
    vi.setSystemTime(NOW);
    const bot = await start(fakeState(), { COMMIT: 'abc1234' });
    await bot.putSettings({ ...olderInput, baseUpdatedAt: null } as never, 'A', 'r-test');
    await bot.claim(example.claimInput as never);
    await bot.bookings([example.bookingInput as never], null);
    await bot.report(example.report as never);
    const s = await bot.status();
    const { dispatch: _d, control: _c, lastPreflight: _p, recentMinutes: _m, push: _push, ...exampleRest } = example.status;   // push: test/push.test.ts
    const { dispatch, control, lastPreflight, recentMinutes, push: _p2, ...rest } = s;
    expect([dispatch, control, lastPreflight]).toEqual([null, null, null]);   // no 開始, no preflight
    expect(shape(rest)).toEqual(shape(exampleRest));
    expect(shape(recentMinutes)).toEqual(shape(example.status.recentMinutes));
  });
});

describe('the runner’s bodies’ bounds', () => {
  const report = () => structuredClone(example.report) as Record<string, unknown>;

  it('caps a report’s events and seen names, a post’s bookings', () => {
    const ev = (n: number) => Array.from({ length: n }, (_, i) => ({ seq: i + 1, kind: 'available' }));
    expect(parseReport({ ...report(), events: ev(LIMITS.eventsPerReport) }).ok).toBe(true);
    expect(parseReport({ ...report(), events: ev(LIMITS.eventsPerReport + 1) })).toEqual({ ok: false, error: 'bad_report_events' });
    expect(parseReport({ ...report(), seen: Array(LIMITS.seenPerReport + 1).fill('A') })).toEqual({ ok: false, error: 'bad_report_seen' });
    const b = (n: number) => Array.from({ length: n }, (_, i) => ({ ...example.bookingInput, id: `r:${i}` }));
    expect(parseBookings(b(LIMITS.bookingsPerPost)).ok).toBe(true);
    expect(parseBookings(b(LIMITS.bookingsPerPost + 1))).toEqual({ ok: false, error: 'too_many_bookings' });
  });

  it('refuses control and bidi characters, bad dates, kinds and shapes', () => {
    const bad = (x: object) => parseReport({ ...report(), ...x }).ok;
    expect(bad({ events: [{ seq: 1, kind: 'hold', hotel: 'a\u202eb' }] })).toBe(false);
    expect(bad({ events: [{ seq: 1, kind: 'hold', detail: 'x'.repeat(201) }] })).toBe(false);
    expect(bad({ events: [{ seq: 0, kind: 'hold' }] })).toBe(false);
    expect(bad({ events: [{ seq: 1, kind: 'party' }] })).toBe(false);
    expect(bad({ events: [{ seq: 1, kind: 'hold', date: '2026-02-30' }] })).toBe(false);
    expect(bad({ seen: ['a\nb'] })).toBe(false);
    expect(bad({ runUrl: 'https://evil.example/x' })).toBe(false);
    expect(bad({ runUrl: 'javascript:alert(1)' })).toBe(false);
    expect(bad({ sha: '<b>' })).toBe(false);
    expect(bad({ v: 2 })).toBe(false);
    expect(bad({ scans: -1 })).toBe(false);
    expect(bad({ failuresByStep: { 'a b': 1 } })).toBe(false);
    expect(bad({ lastError: { at: 1, step: 'x', status: 'x', cls: 'y' } })).toBe(false);
    expect(bad({ solves: { ok: 1, failed: 0, lastOkAt: null, lastSecs: null, lastSpot: 'top' } })).toBe(false);
    expect(bad({ lastError: null, runUrl: null, sha: null, deadline: null })).toBe(true);
    expect(parseBookings([{ ...example.bookingInput, hotel: '' }]).ok).toBe(false);
    expect(parseBookings([{ ...example.bookingInput, number: 5 }]).ok).toBe(false);
    expect(parseBookings({}).ok).toBe(false);
    expect(parseClaim({ runId: '1', host: 'cloud' }).ok).toBe(false);
  });

  it('takes a site’s facility name longer than a typed one (never truncated), up to MAX_SITE_NAME', () => {
    const long = 'あ'.repeat(MAX_NAME + 1);
    expect(parseBookings([{ ...example.bookingInput, hotel: long }]).ok).toBe(true);
    expect(parseReport({ ...report(), seen: [long] }).ok).toBe(true);
    expect(parseBookings([{ ...example.bookingInput, hotel: 'あ'.repeat(MAX_SITE_NAME + 1) }]).ok).toBe(false);
    expect(parseSettingsInput({ ...example.settingsInput, skip: [long] }, NOW).ok).toBe(true);   // matched whole
    expect(parseSettingsInput({ ...example.settingsInput, priority: [long] }, NOW)).toEqual({ ok: false, error: 'bad_hotels' });
  });

  it('takes settingsAt and mailOk; a lagging runner’s report without them (or scansLog) is not refused: null, null, []', () => {
    const r = parseReport({ ...report(), settingsAt: 1794540000000, mailOk: false });
    expect(r.ok && [r.value.settingsAt, r.value.mailOk]).toEqual([1794540000000, false]);
    const nulls = parseReport({ ...report(), settingsAt: null, mailOk: null });
    expect(nulls.ok && [nulls.value.settingsAt, nulls.value.mailOk]).toEqual([null, null]);
    const { settingsAt: _s, mailOk: _m, scansLog: _l, ...lagging } = report();
    const old = parseReport(lagging);
    expect(old.ok && [old.value.settingsAt, old.value.mailOk, old.value.scansLog]).toEqual([null, null, []]);
    expect(parseReport({ ...report(), settingsAt: '1' })).toEqual({ ok: false, error: 'bad_report_times' });
    expect(parseReport({ ...report(), mailOk: 'no' })).toEqual({ ok: false, error: 'bad_report_mail' });
  });

  it('takes the example’s report whole; scansLog capped at SCANS_PER_REPORT, each entry checked', () => {
    expect(parseReport(report())).toEqual({ ok: true, value: example.report });
    const scan = { t: 1, ok: true, ms: 800, avail: 0 };
    const log = (n: number) => Array.from({ length: n }, (_, i) => ({ ...scan, t: i + 1 }));
    expect(parseReport({ ...report(), scansLog: log(SCANS_PER_REPORT) }).ok).toBe(true);
    const bad = (scansLog: unknown) => parseReport({ ...report(), scansLog });
    expect(bad(log(SCANS_PER_REPORT + 1))).toEqual({ ok: false, error: 'bad_report_scans' });
    for (const x of [{ ...scan, ok: 1 }, { ...scan, t: -1 }, { ...scan, avail: 1.5 }, { ...scan, ms: 'x' }, { ...scan, code: 'a b' }, { ...scan, code: 5 }, null]) {
      expect(bad([x]), JSON.stringify(x)).toEqual({ ok: false, error: 'bad_report_scans' });
    }
    expect(bad({})).toEqual({ ok: false, error: 'bad_report_scans' });
    // a fractional duration is rounded; a field it doesn't know is dropped
    const r = parseReport({ ...report(), scansLog: [{ ...scan, ms: 812.6, date: '2026-11-22' }] });
    expect(r.ok && r.value.scansLog).toEqual([{ ...scan, ms: 813 }]);
  });

  it('drops fields it doesn’t know', () => {
    const r = parseReport({ ...report(), extra: 'x', events: [{ seq: 1, kind: 'hold', secret: 'y' }] });
    expect(r.ok && Object.keys(r.value)).not.toContain('extra');
    expect(r.ok && r.value.events[0]).toEqual({ seq: 1, kind: 'hold' });
  });
});
