// The bot (src/bot.ts GymBot; port of test_gymbot.py): a real Store and hacomono client over a fake Durable Object
// state (key-value storage and one alarm), the gym API answered by a stubbed fetch, LINE's push a mock.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('cloudflare:workers', () => ({
  DurableObject: class {
    ctx: unknown;
    env: unknown;
    constructor(ctx: unknown, env: unknown) {
      this.ctx = ctx;
      this.env = env;
    }
  }
}));

import { GymBot, MAX_BACKOFF_MINUTES } from '../src/bot.ts';
import type { Env } from '../src/env.ts';
import { CheckFailed, HacomonoError, PROGRAMS, RateLimited } from '../src/hacomono.ts';
import { Line, LineError } from '../src/line.ts';
import * as messages from '../src/messages.ts';
import { ANY, SKIP, type Rule } from '../src/store.ts';
import { CHECKS_KEPT, FAILURES_BEFORE_WARNING } from '../src/status.ts';
import { at, isoJst, type Day } from '../src/time.ts';
import { GROUP, NOON, NOW, inDays, today } from './fakeBot.ts';
import { DAYS_TO_CHECK } from '../src/config.ts';

const MIN = 60_000;
const INTERVAL = 15 * MIN;
const daysAhead = (n: number, clock: string): number => at(inDays(n), clock);
const tomorrowAt = (clock: string): number => daysAhead(1, clock);

/** A gym API response where only `starts` are reservable. Never empty (an empty one is an error). */
function schedule(...starts: number[]): object {
  const times = [{ start_at: isoJst(at(today(), '10:00')), is_reservable: false }];
  times.push(...starts.map((s) => ({ start_at: isoJst(s), is_reservable: true })));
  return { data: { reserve_schedule: { dates: [{ date: 'any', times }] } } };
}

/** The gym API: `responses[program key]` is a schedule, a Response, or an error to throw. */
let responses: Record<string, unknown>;
let ranges: [Day, Day][];
const down = (error: unknown = new HacomonoError('HTTP 500')) => {
  for (const p of PROGRAMS) responses[p.key] = error;
};
const up = (s: { training?: object; pilates?: object } = {}) => {
  for (const p of PROGRAMS) responses[p.key] = s[p.key] ?? schedule();
};

/** A Durable Object's state: a key-value map and one alarm. */
function fakeState(kv = new Map<string, unknown>()) {
  let alarm: number | null = null;
  let loading: Promise<unknown> = Promise.resolve();
  const storage = {
    get: async (k: string) => structuredClone(kv.get(k)),
    put: async (k: string, v: unknown) => void kv.set(k, structuredClone(v)),
    getAlarm: async () => alarm,
    setAlarm: async (t: number) => void (alarm = t),
    deleteAlarm: async () => void (alarm = null)
  };
  const ctx = {
    storage,
    blockConcurrencyWhile: (fn: () => Promise<unknown>) => (loading = fn())
  };
  return { ctx, kv, alarm: () => alarm, loaded: () => loading };
}

let state: ReturnType<typeof fakeState>;
let gym: GymBot;
let slept: number[];
let push: ReturnType<typeof vi.fn<Line['push']>>;
let reply: ReturnType<typeof vi.fn<Line['reply']>>;
let quota: ReturnType<typeof vi.fn<Line['quota']>>;
let webhookEndpoint: ReturnType<typeof vi.fn<Line['webhook']>>;
const URL_ = 'https://gym.example';

/** A bot over `state` (a fresh one: as after an eviction), with LINE mocked and the request spacing recorded. */
async function start(env: Partial<Env> = {}): Promise<GymBot> {
  const b = new GymBot(state.ctx as never, { MODE: 'bot', LINE_GROUP_ID: GROUP, LINE_CHANNEL_TOKEN: 't', URL: URL_, ...env } as Env);
  await state.loaded();
  b.line = { push, reply, memberName: vi.fn(async () => 'Bob'), quota, quotaUsed: vi.fn(async () => 42), webhook: webhookEndpoint } as unknown as Line;
  vi.spyOn(b, 'sleep').mockImplementation(async (ms) => void slept.push(ms));
  return b;
}

const pushes = () => push.mock.calls.map((c) => c[1]);
const retryKeys = () => push.mock.calls.map((c) => c[2]);
const sentText = () => pushes().flat().join('\n');
const setRule = (day: Day, rule: Rule) => gym.store.setRule(day, rule, today());
const saved = () => state.kv.get('state') as Record<string, unknown>;
const starts = (slots: { start: number }[]) => slots.map((s) => s.start);
const failed = (p: Promise<unknown>) => p.then(() => { throw new Error('no CheckFailed'); }, (e: CheckFailed) => e);

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  responses = {};
  ranges = [];
  slept = [];
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    const u = new URL(url);
    const program = PROGRAMS.find((p) => String(p.id) === u.searchParams.get('program_id'))!;
    const query = JSON.parse(u.searchParams.get('query')!);
    ranges.push([query.date_from, query.date_to]);
    const r = responses[program.key];
    if (r instanceof Error) throw r;
    return r instanceof Response ? r : Response.json(r);
  }));
  push = vi.fn<Line['push']>(async () => {});
  reply = vi.fn<Line['reply']>(async () => {});
  quota = vi.fn<Line['quota']>(async () => 200);
  webhookEndpoint = vi.fn<Line['webhook']>(async () => ({ endpoint: `${URL_}/line/webhook`, active: true }));
  state = fakeState();
  gym = await start();
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('what gets checked', () => {
  it('alerts on any time of day', async () => {
    up({ training: schedule(tomorrowAt('10:00'), tomorrowAt('21:30')) });
    expect(starts(await gym.runCheck())).toEqual([tomorrowAt('10:00'), tomorrowAt('21:30')]);
    expect(sentText()).toContain('10:00〜10:30');
    expect(sentText()).toContain('21:30〜22:00');
    expect(gym.lastCheck).toBe(NOW);
  });

  it('spaces out the requests', async () => {
    up();
    await gym.runCheck();
    expect(ranges).toHaveLength(2);
    expect(slept).toHaveLength(1);
    expect(slept[0]).toBeGreaterThanOrEqual(2000);
    expect(slept[0]).toBeLessThanOrEqual(5000);
  });

  it('checks only the next days by default', async () => {
    up({ training: schedule(daysAhead(DAYS_TO_CHECK, '12:00')) });
    expect(await gym.runCheck()).toEqual([]);
  });

  it('skips slots that already started', async () => {
    up({ training: schedule(NOW - 10 * MIN) });
    expect(await gym.runCheck()).toEqual([]);
  });

  it('skips a day set to 🔕', async () => {
    setRule(inDays(1), SKIP);
    up({ training: schedule(tomorrowAt('12:00')) });
    expect(await gym.runCheck()).toEqual([]);
  });

  it('limits a day to its time range', async () => {
    setRule(inDays(1), NOON);
    up({ training: schedule(tomorrowAt('10:00'), tomorrowAt('12:30'), tomorrowAt('15:00')) });
    expect(starts(await gym.runCheck())).toEqual([tomorrowAt('12:30')]);
  });

  it('extends the fetch to a range beyond the default days', async () => {
    const far = daysAhead(20, '18:00');
    setRule(inDays(20), ['18:00', '20:00']);
    up({ training: schedule(far, daysAhead(21, '18:00')) });
    expect(starts(await gym.runCheck())).toEqual([far]);
    expect(ranges[0]).toEqual([today(), inDays(20)]);
  });

  it('holds a day back until its check-from time, then alerts', async () => {
    const noon = tomorrowAt('12:00');
    gym.store.setCheckFrom(inDays(1), NOW + 60 * MIN, today());
    up({ training: schedule(noon) });
    expect(await gym.runCheck()).toEqual([]);
    vi.setSystemTime(NOW + 120 * MIN);
    expect(starts(await gym.runCheck())).toEqual([noon]);
    expect(gym.store.checkFrom(inDays(1))).toBeUndefined(); // passed, so forgotten
  });

  it('always fetches from today', async () => {
    for (let i = 0; i < DAYS_TO_CHECK; i++) setRule(inDays(i), SKIP);
    setRule(inDays(20), ANY);
    up();
    await gym.runCheck();
    expect(ranges[0]).toEqual([today(), inDays(20)]);
  });

  it('makes no requests with nothing to check', async () => {
    for (let i = 0; i < DAYS_TO_CHECK; i++) setRule(inDays(i), SKIP);
    expect(await gym.runCheck()).toEqual([]);
    expect(ranges).toEqual([]);
  });
});

describe('alerting', () => {
  it('announces each slot time once, ever', async () => {
    const noon = tomorrowAt('12:00');
    up({ training: schedule(noon) });
    await gym.runCheck();
    await gym.runCheck(); // still open
    expect(pushes()).toHaveLength(1);
    expect(pushes()[0][0]).toBe('🟢 空きが出ました！');
    expect(sentText()).toContain('パーソナルトレーニング');

    up(); // booked
    await gym.runCheck();
    up({ training: schedule(noon) }); // free again
    await gym.runCheck();
    expect(pushes()).toHaveLength(1);

    up({ training: schedule(noon, tomorrowAt('13:00')) }); // a new time on the same day
    await gym.runCheck();
    expect(pushes()).toHaveLength(2);
    expect(pushes()[1].at(-1)).toContain('13:00〜13:30');
  });

  it('announces once per time, not per program', async () => {
    const noon = tomorrowAt('12:00'), one = tomorrowAt('13:00');
    up({ training: schedule(noon, one), pilates: schedule(one) });
    await gym.runCheck(); // both open at 13:00 together: one line naming both
    expect(sentText()).toContain('13:00〜13:30　💪 パーソナルトレーニング・🧘 マシンピラティス');
    up({ training: schedule(noon, one), pilates: schedule(noon, one) }); // pilates at 12:00: that time was announced
    await gym.runCheck();
    expect(pushes()).toHaveLength(1);
  });

  it('does not re-alert when a failed program comes back', async () => {
    const noon = tomorrowAt('12:00');
    up({ training: schedule(noon), pilates: schedule(noon) });
    await gym.runCheck();
    responses.pilates = new HacomonoError('HTTP 500');
    const e = await failed(gym.runCheck());
    expect(e).toBeInstanceOf(CheckFailed);
    expect(e.allFailed).toBe(false);
    expect(starts(e.found)).toEqual([noon]);
    up({ training: schedule(noon), pilates: schedule(noon) });
    await gym.runCheck();
    expect(pushes()).toHaveLength(1);
  });

  it('still alerts on what a partial check got', async () => {
    up({ training: schedule(tomorrowAt('12:00')) });
    responses.pilates = new HacomonoError('HTTP 500');
    expect(await failed(gym.runCheck())).toBeInstanceOf(CheckFailed);
    expect(pushes()).toHaveLength(1);
    expect(gym.store.isNotified(tomorrowAt('12:00'))).toBe(true);
  });

  it.each([[SKIP], [NOON]] as [Rule][])('does not re-alert after hiding then showing a day (%s)', async (hide) => {
    const three = tomorrowAt('15:00');
    up({ training: schedule(three) });
    await gym.runCheck();
    setRule(inDays(1), hide);
    await gym.runCheck();
    setRule(inDays(1), ANY);
    await gym.runCheck();
    expect(pushes()).toHaveLength(1);
  });

  it('alerts on a slot once the setting includes it', async () => {
    setRule(inDays(1), NOON);
    up({ training: schedule(tomorrowAt('15:00')) });
    await gym.runCheck();
    setRule(inDays(1), ANY);
    await gym.runCheck();
    expect(pushes()).toHaveLength(1);
    expect(sentText()).toContain('15:00〜15:30');
  });

  it('alerts again after a reset', async () => {
    up({ training: schedule(tomorrowAt('12:00')) });
    await gym.runCheck();
    gym.store.reset(inDays(1));
    await gym.runCheck();
    expect(pushes()).toHaveLength(2);
  });

  it('forgets past alerts and saves, even when the fetch fails', async () => {
    const future = tomorrowAt('12:00');
    gym.store.markNotified([NOW - 60 * MIN, future]);
    down();
    const e = await failed(gym.runCheck());
    expect(e.allFailed).toBe(true);
    expect(gym.store.notified()).toEqual([future]);
    expect(saved().notified).toEqual([isoJst(future)]);
  });

  it('counts an empty schedule as a failure', async () => {
    down(Response.json({ data: { reserve_schedule: { dates: [] } } }));
    responses.pilates = Response.json({ data: { reserve_schedule: { dates: [] } } });
    expect((await failed(gym.runCheck())).allFailed).toBe(true);
  });
});

describe('when LINE fails', () => {
  it('retries a failed alert next check with the same retry key, kept across an eviction', async () => {
    up({ training: schedule(tomorrowAt('12:00')) });
    push.mockRejectedValueOnce(new LineError('timeout')).mockRejectedValueOnce(new LineError('429'));
    expect(await gym.runCheck()).toHaveLength(1); // the check itself still succeeds
    expect(gym.store.isNotified(tomorrowAt('12:00'))).toBe(false);
    gym = await start(); // evicted: the retry key is in storage
    expect(await gym.runCheck()).toHaveLength(1);
    expect(gym.store.isNotified(tomorrowAt('12:00'))).toBe(false);
    await gym.runCheck();
    expect(gym.store.isNotified(tomorrowAt('12:00'))).toBe(true);
    expect(gym.retry).toBeNull();
    expect(retryKeys()[0]).toBeTruthy();
    expect(new Set(retryKeys()).size).toBe(1);
    up({ training: schedule(tomorrowAt('12:00'), tomorrowAt('13:00')) }); // a different alert: a new key
    await gym.runCheck();
    expect(retryKeys().at(-1)).not.toBe(retryKeys()[0]);
  });

  it('marks new times without pushing on a manual check', async () => {
    up({ training: schedule(tomorrowAt('12:00')) });
    expect(await gym.runCheck(false)).toHaveLength(1);
    expect(gym.store.isNotified(tomorrowAt('12:00'))).toBe(true);
    await gym.runCheck();
    expect(pushes()).toEqual([]);
  });

  it('keeps the alert waiting without a group', async () => {
    gym = await start({ LINE_GROUP_ID: '' });
    gym.line = new Line('t') as never; // throws LINE_GROUP_ID isn't set before any request
    up({ training: schedule(tomorrowAt('12:00')) });
    expect(await gym.runCheck()).toHaveLength(1);
    expect(gym.store.isNotified(tomorrowAt('12:00'))).toBe(false);
  });

  it('does not report a failed push as the site being down', async () => {
    up({ training: schedule(tomorrowAt('12:00')) });
    push.mockRejectedValue(new LineError('429'));
    for (let i = 0; i <= FAILURES_BEFORE_WARNING; i++) expect(await gym.pollOnce()).toBeLessThanOrEqual(INTERVAL * 1.15);
    expect(gym.failures).toBe(0);
    expect(gym.siteDownSent).toBe(false);
  });

  it('keeps a retried notice’s retry key', async () => {
    push.mockRejectedValueOnce(new LineError('timeout'));
    expect(await gym.notify(messages.SITE_DOWN)).toBe(false);
    expect(await gym.notify(messages.SITE_DOWN)).toBe(true);
    expect(await gym.notify(messages.SITE_DOWN)).toBe(true); // a later outage: a new key
    expect(retryKeys()[0]).toBe(retryKeys()[1]);
    expect(retryKeys()[2]).not.toBe(retryKeys()[0]);
  });
});

describe('polling', () => {
  const pollTimes = async (n: number) => {
    for (let i = 0; i < n; i++) await gym.pollOnce();
  };

  it('uses the chosen interval', async () => {
    gym.store.setInterval(60);
    up();
    const delay = await gym.pollOnce();
    expect(delay).toBeGreaterThanOrEqual(60 * MIN * 0.85);
    expect(delay).toBeLessThanOrEqual(60 * MIN * 1.15);
  });

  it('counts a partial failure as the site being up', async () => {
    down();
    await pollTimes(FAILURES_BEFORE_WARNING);
    expect(gym.failures).toBe(3);
    expect(gym.siteDownSent).toBe(true);
    up();
    responses.pilates = new HacomonoError('HTTP 500');
    expect(await gym.pollOnce()).toBeLessThanOrEqual(INTERVAL * 1.15);
    expect(gym.failures).toBe(0);
    expect(pushes()).toEqual([[messages.SITE_DOWN], [messages.SITE_BACK]]);
  });

  it('backs off doubling up to a cap, and honours Retry-After', async () => {
    down();
    const delays = [];
    for (let i = 0; i < 5; i++) delays.push(await gym.pollOnce());
    expect(delays.slice(0, 3).map((d) => Math.round(d / INTERVAL))).toEqual([1, 2, 4]);
    expect(delays.at(-1)).toBe(MAX_BACKOFF_MINUTES * MIN);
    down(new RateLimited(30 * 60));
    gym.failures = 0;
    expect(await gym.pollOnce()).toBe(30 * MIN); // longer than the first backoff
    down(new RateLimited(3 * 3600));
    expect(await gym.pollOnce()).toBe(MAX_BACKOFF_MINUTES * MIN); // capped
  });

  it('says nothing about the site with nothing to check', async () => {
    down();
    await pollTimes(FAILURES_BEFORE_WARNING);
    up();
    for (const day of gym.store.windows(Date.now()).keys()) setRule(day, SKIP);
    const asked = ranges.length;
    await gym.pollOnce();
    expect(pushes()).toEqual([[messages.SITE_DOWN]]);
    expect(gym.siteDownSent).toBe(true);
    expect(ranges).toHaveLength(asked);
  });

  it('warns once that the site is down, then says it is back', async () => {
    down();
    await pollTimes(FAILURES_BEFORE_WARNING + 2);
    expect(pushes()).toEqual([[messages.SITE_DOWN]]);
    up();
    await pollTimes(2);
    expect(pushes()).toEqual([[messages.SITE_DOWN], [messages.SITE_BACK]]);
    expect(gym.failures).toBe(0);
  });

  it('retries a failed warning', async () => {
    down();
    push.mockRejectedValue(new LineError('429'));
    await pollTimes(FAILURES_BEFORE_WARNING);
    expect(gym.siteDownSent).toBe(false);
    push.mockResolvedValue();
    await pollTimes(2); // still down: the warning goes out now, once
    expect(pushes().at(-1)).toEqual([messages.SITE_DOWN]);
    expect(push).toHaveBeenCalledTimes(2);
  });

  it('sends no recovery notice if the warning never went out', async () => {
    down();
    push.mockRejectedValue(new LineError('429'));
    await pollTimes(FAILURES_BEFORE_WARNING);
    push.mockReset();
    up();
    await gym.pollOnce();
    expect(push).not.toHaveBeenCalled();
  });

  it('retries a failed recovery notice', async () => {
    down();
    await pollTimes(FAILURES_BEFORE_WARNING);
    up();
    push.mockRejectedValueOnce(new LineError('500'));
    await gym.pollOnce();
    expect(gym.siteDownSent).toBe(true);
    await gym.pollOnce();
    expect(pushes().at(-1)).toEqual([messages.SITE_BACK]);
    expect(gym.siteDownSent).toBe(false);
  });

  it('keeps the failures and the warning across an eviction', async () => {
    down();
    await pollTimes(FAILURES_BEFORE_WARNING);
    await gym.alarm();
    gym = await start();
    expect(gym.failures).toBe(FAILURES_BEFORE_WARNING + 1);
    expect(gym.siteDownSent).toBe(true);
  });
});

describe('the alarm', () => {
  it('runs a check and sets the next alarm an interval on', async () => {
    up({ training: schedule(tomorrowAt('12:00')) });
    await gym.alarm();
    expect(pushes()).toHaveLength(1);
    expect(state.alarm()).toBeGreaterThanOrEqual(NOW + INTERVAL * 0.85);
    expect(state.alarm()).toBeLessThanOrEqual(NOW + INTERVAL * 1.15);
    expect(saved().notified).toEqual([isoJst(tomorrowAt('12:00'))]);
  });

  it('does nothing, and sets no next alarm, unless MODE is bot', async () => {
    gym = await start({ MODE: 'off' });
    up({ training: schedule(tomorrowAt('12:00')) });
    await gym.alarm();
    await gym.ensureAlarm();
    await gym.wake();
    expect(ranges).toEqual([]);
    expect(state.alarm()).toBeNull();
  });

  it('never checks while stopped', async () => {
    gym.store.setPaused(true);
    await gym.alarm();
    await gym.ensureAlarm();
    expect(ranges).toEqual([]);
    expect(state.alarm()).toBeNull();
    expect(await gym.nextCheck()).toBeNull();
  });

  it('survives unexpected errors, the next alarm at the usual interval', async () => {
    vi.spyOn(gym, 'pollOnce').mockRejectedValue(new Error('boom'));
    await gym.alarm();
    expect(state.alarm()).toBe(NOW + INTERVAL);
    expect(console.error).toHaveBeenCalledWith('unexpected error in poll loop', expect.any(Error));
  });

  it('sets no next alarm when stopped during the check', async () => {
    vi.spyOn(gym, 'pollOnce').mockImplementation(async () => {
      gym.store.setPaused(true);
      await gym.wake();
      return INTERVAL;
    });
    await gym.alarm();
    expect(state.alarm()).toBeNull();
  });

  it('counts a new interval chosen during the check from the last check', async () => {
    vi.spyOn(gym, 'pollOnce').mockImplementation(async () => {
      gym.lastCheck = NOW;
      gym.store.setInterval(60);
      await gym.wake();
      return INTERVAL;
    });
    await gym.alarm();
    expect(state.alarm()).toBe(NOW + 60 * MIN);
  });
});

describe('wake (the check settings changed)', () => {
  it('stopping deletes the alarm', async () => {
    await state.ctx.storage.setAlarm(NOW + INTERVAL);
    gym.store.setPaused(true);
    await gym.wake();
    expect(state.alarm()).toBeNull();
  });

  it('restarting checks right away', async () => {
    gym.lastCheck = NOW - MIN;
    await gym.wake();
    expect(state.alarm()).toBe(NOW);
  });

  it('a new interval counts from the last check, or now if that has passed', async () => {
    await state.ctx.storage.setAlarm(NOW + INTERVAL);
    gym.lastCheck = NOW - 5 * MIN;
    gym.store.setInterval(60);
    await gym.wake();
    expect(state.alarm()).toBe(NOW + 55 * MIN);
    gym.store.setInterval(10);
    gym.lastCheck = NOW - 20 * MIN;
    await gym.wake();
    expect(state.alarm()).toBe(NOW);
  });

  it('ensureAlarm starts the checks only when none is set', async () => {
    await gym.ensureAlarm();
    expect(state.alarm()).toBe(NOW);
    await state.ctx.storage.setAlarm(NOW + INTERVAL);
    await gym.ensureAlarm();
    expect(state.alarm()).toBe(NOW + INTERVAL);
    expect(await gym.nextCheck()).toBe(NOW + INTERVAL);
  });
});

describe('state', () => {
  it('writes the state after a check only when it changed', async () => {
    up({ training: schedule(tomorrowAt('12:00')) });
    await gym.runCheck();
    expect(saved().notified).toEqual([isoJst(tomorrowAt('12:00'))]);
    expect(gym.store.dirty).toBe(false);
    state.kv.delete('state');
    await gym.runCheck(); // nothing changed
    expect(state.kv.has('state')).toBe(false);
  });

  it('loads the saved state', async () => {
    state = fakeState(new Map([['state', { version: 3, days: { [inDays(20)]: 'skip' } }]]));
    gym = await start();
    expect(gym.store.rule(inDays(20))).toBe(SKIP);
  });

  it.each([['not JSON'], [{ version: 2 }], [{ version: 3, days: { x: 'any' } }]])(
    'starts empty from a broken saved state, kept aside (%j)', async (broken) => {
      state = fakeState(new Map([['state', broken]]));
      gym = await start();
      expect(gym.store.rules()).toEqual([]);
      expect(state.kv.get('state.bad')).toEqual(broken);
      expect(console.error).toHaveBeenCalled();
    });

  it('imports a valid state (and starts the checks), refuses an invalid one', async () => {
    expect(await gym.putState({ version: 2 })).toEqual({ ok: false, error: 'unsupported state (version 3 expected)' });
    const json = { version: 3, interval_minutes: 30, paused: false, days: { [inDays(20)]: 'skip' }, check_from: {}, notified: [] };
    expect(await gym.putState(json)).toEqual({ ok: true });
    expect(saved()).toEqual(json);
    expect(await gym.getState()).toEqual(json);
    expect(state.alarm()).toBe(NOW);
  });

  it('handles a webhook event: the menu, then saves and makes sure the alarm is set', async () => {
    await gym.handle({ type: 'message', message: { type: 'text', text: 'メニュー' }, source: { groupId: GROUP }, replyToken: 'r1' });
    expect(reply).toHaveBeenCalledTimes(1);
    expect(reply.mock.calls[0][0]).toBe('r1');
    expect(state.alarm()).toBe(NOW);
  });
});

describe('/status', () => {
  const runtime = () => state.kv.get('runtime') as Record<string, unknown>;

  it('records each check, newest first: the trigger, the outcome per program, open and new, the push', async () => {
    up({ training: schedule(tomorrowAt('12:00')) });
    responses.pilates = new RateLimited(null);
    await failed(gym.runCheck());
    vi.setSystemTime(NOW + MIN);
    up({ training: schedule(tomorrowAt('12:00'), tomorrowAt('13:00')) });
    await gym.runCheck(false);
    expect(gym.checks).toEqual([
      { t: NOW + MIN, by: 'tap', ms: 0, r: { training: 'ok', pilates: 'ok' }, open: 2, fresh: 1, push: 'held' },
      { t: NOW, by: 'alarm', ms: 0, r: { training: 'ok', pilates: 'rate_limited' }, open: 1, fresh: 1, push: 'ok' },
    ]);
    expect(runtime().checks).toEqual(gym.checks); // saved with the check
    up({ training: schedule(tomorrowAt('14:00')) });
    push.mockRejectedValueOnce(new LineError('429'));
    await gym.runCheck();
    expect(gym.checks[0]).toMatchObject({ open: 1, fresh: 1, push: 'failed' });
    await gym.runCheck();
    expect(gym.checks[0]).toMatchObject({ fresh: 1, push: 'ok' });
    await gym.runCheck();
    expect(gym.checks[0]).toMatchObject({ open: 1, fresh: 0, push: 'none' });
  });

  it('records an alarm with nothing to check as idle, and keeps the newest CHECKS_KEPT across an eviction', async () => {
    for (let i = 0; i < DAYS_TO_CHECK; i++) setRule(inDays(i), SKIP);
    for (let i = 0; i < CHECKS_KEPT + 3; i++) {
      vi.setSystemTime(NOW + i * MIN);
      await gym.alarm();
    }
    expect(ranges).toEqual([]);
    expect(gym.checks).toHaveLength(CHECKS_KEPT);
    expect(gym.checks[0]).toEqual({ t: NOW + (CHECKS_KEPT + 2) * MIN, by: 'alarm', ms: 0, idle: true, open: 0, fresh: 0, push: 'none' });
    gym = await start();
    expect(gym.checks).toHaveLength(CHECKS_KEPT);
    expect(gym.checks[0].t).toBe(NOW + (CHECKS_KEPT + 2) * MIN);
  });

  it('keeps the last good check and the last error', async () => {
    up();
    await gym.runCheck();
    expect([gym.lastOk, gym.lastError]).toEqual([NOW, null]);
    vi.setSystemTime(NOW + MIN);
    responses.pilates = new HacomonoError('HTTP 502');
    await failed(gym.runCheck());
    expect([gym.lastOk, gym.lastError]).toEqual([NOW, { t: NOW + MIN, code: 'http_5xx' }]);
    vi.setSystemTime(NOW + 2 * MIN);
    up({ training: schedule(tomorrowAt('12:00')) });
    push.mockRejectedValueOnce(new LineError('429'));
    await gym.runCheck();
    expect([gym.lastOk, gym.lastError]).toEqual([NOW + 2 * MIN, { t: NOW + 2 * MIN, code: 'push_failed' }]);
    gym = await start();
    expect([gym.lastOk, gym.lastError]).toEqual([NOW + 2 * MIN, { t: NOW + 2 * MIN, code: 'push_failed' }]);
  });

  it('reads LINE’s quota and webhook on the alarm after a push that went out, not after one that failed', async () => {
    await gym.alarm(); // the first read
    vi.setSystemTime(NOW + MIN);
    up({ training: schedule(tomorrowAt('12:00')) });
    push.mockRejectedValueOnce(new LineError('500'));
    await gym.alarm();
    expect(quota).toHaveBeenCalledTimes(1);
    quota.mockResolvedValue(null);
    webhookEndpoint.mockResolvedValue({ endpoint: 'https://elsewhere/line/webhook', active: true });
    await gym.alarm(); // the retried alert goes out
    expect(quota).toHaveBeenCalledTimes(2);
    expect(gym.lineFacts).toEqual({ used: 42, limit: null, webhookOk: false, asOf: NOW + MIN });
    expect(runtime().line).toEqual(gym.lineFacts);
    webhookEndpoint.mockResolvedValue({ endpoint: `${URL_}/line/webhook`, active: false });
    down();
    gym.failures = FAILURES_BEFORE_WARNING - 1;
    await gym.alarm(); // a notice goes out
    expect(pushes().at(-1)).toEqual([messages.SITE_DOWN]);
    expect(quota).toHaveBeenCalledTimes(3);
    expect(gym.lineFacts.webhookOk).toBe(false);
    await gym.alarm(); // no push
    expect(quota).toHaveBeenCalledTimes(3);
  });

  it('reads them on an alarm once they are an hour old; a failure keeps the old values', async () => {
    for (let i = 0; i < DAYS_TO_CHECK; i++) setRule(inDays(i), SKIP); // idle alarms: no push
    await gym.alarm();
    expect(quota).toHaveBeenCalledTimes(1);
    vi.setSystemTime(NOW + 60 * MIN);
    await gym.alarm();
    expect(quota).toHaveBeenCalledTimes(1);
    vi.setSystemTime(NOW + 61 * MIN);
    quota.mockRejectedValueOnce(new LineError('500'));
    await gym.alarm();
    expect(quota).toHaveBeenCalledTimes(2);
    expect(gym.lineFacts).toEqual({ used: 42, limit: 200, webhookOk: true, asOf: NOW });
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining("could not read LINE's quota"));
    await gym.alarm(); // still old: tried again
    expect(gym.lineFacts.asOf).toBe(NOW + 61 * MIN);
  });

  it('getStatus: the payload, from memory, never writing or setting an alarm', async () => {
    gym = await start({ COMMIT: 'abc1234' });
    up({ training: schedule(tomorrowAt('12:00')) });
    await gym.alarm();
    await state.ctx.storage.deleteAlarm();
    state.kv.clear();
    const s = await gym.getStatus();
    expect(s).toEqual({
      v: 1, now: NOW, mode: 'bot', sha: 'abc1234', verdict: 'broken', reasons: ['no_alarm'], intervalMin: 15,
      paused: false, nextCheck: null, lastCheck: NOW, lastOk: NOW, lastError: null, failures: 0, siteDownSent: false,
      retryPending: false, checks: gym.checks, line: { used: 42, limit: 200, webhookOk: true, asOf: NOW },
    });
    expect(state.kv.size).toBe(0);
    expect(state.alarm()).toBeNull();
    await state.ctx.storage.setAlarm(NOW + INTERVAL);
    expect(await gym.getStatus()).toMatchObject({ verdict: 'healthy', reasons: [], nextCheck: NOW + INTERVAL });
    const text = JSON.stringify(await gym.getStatus());
    expect(text).not.toContain(GROUP);
    expect(text).not.toContain(isoJst(tomorrowAt('12:00')));
  });

  it('getStatus: stopped and off', async () => {
    gym.store.setPaused(true);
    expect(await gym.getStatus()).toMatchObject({ verdict: 'stopped', paused: true, nextCheck: null });
    gym = await start({ MODE: 'off', LINE_GROUP_ID: '' });
    expect(await gym.getStatus()).toMatchObject({ verdict: 'off', reasons: ['mode_off', 'no_group'], mode: 'off' });
  });
});
