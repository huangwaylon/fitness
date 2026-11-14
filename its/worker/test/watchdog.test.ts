// The watchdog (src/rules.ts watchOf, watchAlert; src/bot.ts watch; src/index.ts scheduled): when a missing runner is
// dispatched (active, no report for WATCH_QUIET_MS, no live lease, none on its way, GitHub showing no unfinished run),
// the backoff, no token (logged once, nothing sent), the push once per incident and its close on recovery or a stop;
// and that a quiet tick writes nothing. GitHub is a stubbed fetch; the push service pushKit's.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import example from '../../contract-example.json';
import { START_GRACE_SEC, type ItsPushPayload, type ItsSettings, type ItsSettingsInput, type ItsStatus } from '../../../app/src/lib/its/contract.ts';
import type { ItsBot } from '../src/bot.ts';
import { DISPATCH_URL, UNFINISHED, cancelUrl, runsUrl } from '../src/dispatch.ts';
import type { Env } from '../src/env.ts';
import worker from '../src/index.ts';
import { silentJobs } from '../src/push.ts';
import {
  WATCH_ALERT_MS, WATCH_COOLDOWN_MS, WATCH_DAY_CAP, WATCH_EVERY_MAX_MS, WATCH_EVERY_MS, WATCH_FAST_MS, WATCH_HUNG_MS, WATCH_LOOP_MS, WATCH_POLL_MS, WATCH_PUSH_MIN_MS, RESTART_DAY_CAP,
  WATCH_QUIET_MS, watchAlert, watchAt, watchOf,
  type ItsRecord, type RunnerRecord, type Watch,
} from '../src/rules.ts';
import { MIN, NOW, envOf, fakeState, page, quiet, report, start, type State } from './fakeBot.ts';
import { fakePushService, phoneKeys, vapidPair, type Phone } from './pushKit.ts';

const RUN = example.claimInput.runId;
const HOUR_ = 60 * MIN;
const HOST = 'push.example.test';

describe('rules.ts watchOf: the tick’s decision', () => {
  const settings = { ...(example.config.settings as ItsSettings), paused: false };
  const runner = (lastSeen: number) => ({ runId: RUN, lastSeen }) as RunnerRecord;
  const rec = (x: Partial<ItsRecord> = {}): ItsRecord => ({
    settings, bookings: [], runner: runner(NOW - 7 * MIN), lease: null, dispatch: null, control: null, events: { routine: [], important: [] }, seen: {},
    acks: [], preflight: null, scanned: [], minutes: [], subs: [], pushq: [], pushlog: { lastSentAt: null, lastOutcome: null, done: [] }, watch: null, restarts: null, ...x,
  });
  // opened after the runner's last report (NOW − 7 min): a report after it would have closed it
  const incident = (x: Partial<Watch> = {}): Watch => ({ since: NOW - 6 * MIN, closedAt: null, n: 0, lastAt: null, failed: 0, noToken: false, alerted: false, counted: true, starts: [NOW - 6 * MIN], loopAlerted: false, day: '', dayN: 0, cancelId: null, cancelAt: null, ...x });
  const closed = (w: Watch) => ({ ...w, since: null, closedAt: NOW });
  const none = { dispatch: false, cancel: null, afterCancel: false, capped: false, crashLoop: false };

  it('inactive (MODE off, stopped, no date): nothing, an open incident closed (its backoff kept)', () => {
    for (const [r, mode] of [[rec(), 'off'], [rec({ settings: { ...settings, paused: true } }), 'on'], [rec({ settings: { ...settings, dates: ['2026-11-01'] } }), 'on']] as const) {
      expect(watchOf({ ...r, watch: incident({ n: 2 }) }, mode, NOW)).toEqual({ watch: closed(incident({ n: 2 })), why: 'inactive', ...none });
      expect(watchOf({ ...r, watch: null }, mode, NOW).watch).toBeNull();
    }
  });

  it('alive: a report within WATCH_QUIET_MS, or a live lease (whatever the report’s age)', () => {
    expect(watchOf(rec({ runner: runner(NOW - WATCH_QUIET_MS + 1000) }), 'on', NOW).why).toBe('alive');
    expect(watchOf(rec({ lease: { holder: RUN, host: 'actions', until: NOW + 1000 }, watch: incident() }), 'on', NOW)).toEqual({ watch: closed(incident()), why: 'alive', ...none });
  });

  it('missing: no report for WATCH_QUIET_MS, the lease expired or released, never a runner: dispatch', () => {
    const d = { watch: incident({ since: NOW, starts: [NOW] }), why: 'missing', ...none, dispatch: true };
    expect(watchOf(rec(), 'on', NOW)).toEqual(d);
    expect(watchOf(rec({ lease: { holder: RUN, host: 'actions', until: NOW - 1 } }), 'on', NOW)).toEqual(d);
    expect(watchOf(rec({ runner: null }), 'on', NOW)).toEqual(d);
  });

  it('on its way: an accepted dispatch or a preflight no report followed, within START_GRACE_SEC (a refused one isn’t)', () => {
    const grace = START_GRACE_SEC * 1000;
    const old = runner(NOW - 20 * MIN);
    expect(watchOf(rec({ runner: old, dispatch: { at: NOW - grace + 1000, ok: true, status: 204 } }), 'on', NOW).why).toBe('starting');
    expect(watchOf(rec({ dispatch: { at: NOW - MIN, ok: true, status: null } }), 'on', NOW).why).toBe('starting');
    expect(watchOf(rec({ preflight: NOW - MIN }), 'on', NOW).why).toBe('starting');
    expect(watchOf(rec({ dispatch: { at: NOW - MIN, ok: false, status: 401 } }), 'on', NOW)).toMatchObject({ why: 'missing', dispatch: true });
    expect(watchOf(rec({ runner: old, dispatch: { at: NOW - grace, ok: true, status: 204 } }), 'on', NOW).dispatch).toBe(true);
    // before the last report: not this one's
    expect(watchOf(rec({ preflight: NOW - 8 * MIN }), 'on', NOW).dispatch).toBe(true);
    // an open incident stays open meanwhile (its push clock runs), nothing dispatched
    expect(watchOf(rec({ preflight: NOW - MIN, watch: incident() }), 'on', NOW)).toEqual({ watch: incident(), why: 'missing', ...none });
  });

  it('backs off: 10, 20, 40, then every 60 min between its dispatches', () => {
    const due = (n: number, ago: number) => watchOf(rec({ watch: incident({ n, lastAt: NOW - ago }) }), 'on', NOW).dispatch;
    expect([due(1, WATCH_EVERY_MS - 1), due(1, WATCH_EVERY_MS)]).toEqual([false, true]);
    expect([due(2, 20 * MIN - 1), due(2, 20 * MIN)]).toEqual([false, true]);
    expect([due(3, 40 * MIN - 1), due(3, 40 * MIN)]).toEqual([false, true]);
    expect([due(4, WATCH_EVERY_MAX_MS - 1), due(9, WATCH_EVERY_MAX_MS)]).toEqual([false, true]);
  });

  it('an incident opening within WATCH_COOLDOWN_MS of the last’s close continues its backoff; later, afresh', () => {
    const last = { ...incident({ n: 3, lastAt: NOW - 30 * MIN, failed: 1 }), since: null, closedAt: NOW - WATCH_COOLDOWN_MS + 1000 };
    expect(watchOf(rec({ watch: last }), 'on', NOW)).toMatchObject({ watch: { since: NOW, n: 3, lastAt: NOW - 30 * MIN, failed: 1, starts: [NOW - 6 * MIN, NOW] }, dispatch: false });
    expect(watchOf(rec({ watch: { ...last, closedAt: NOW - WATCH_COOLDOWN_MS } }), 'on', NOW)).toMatchObject({ watch: { n: 0, lastAt: null, failed: 0 }, dispatch: true });
  });

  it(`the day’s cap: ${WATCH_DAY_CAP} dispatches a Tokyo day, then none (capped) till the next`, () => {
    const today = '2026-11-13';
    expect(watchOf(rec({ watch: incident({ day: today, dayN: WATCH_DAY_CAP - 1 }) }), 'on', NOW)).toMatchObject({ dispatch: true, capped: false });
    expect(watchOf(rec({ watch: incident({ day: today, dayN: WATCH_DAY_CAP }) }), 'on', NOW)).toMatchObject({ why: 'missing', dispatch: false, capped: true });
    expect(watchOf(rec({ watch: incident({ day: '2026-11-12', dayN: WATCH_DAY_CAP }) }), 'on', NOW)).toMatchObject({ dispatch: true, capped: false });
  });

  it('watchAlert: silent once (WATCH_ALERT_MS in, 2 refused, or capped); loop once per run of 3 incidents in 2 h', () => {
    expect(watchAlert(incident({ since: NOW - WATCH_ALERT_MS + 1 }), NOW, false)).toBeNull();
    expect(watchAlert(incident({ since: NOW - WATCH_ALERT_MS }), NOW, false)).toBe('silent');
    expect(watchAlert(incident({ since: NOW, failed: 2 }), NOW, false)).toBe('silent');
    expect(watchAlert(incident({ since: NOW }), NOW, true)).toBe('silent');
    expect(watchAlert(incident({ since: NOW - WATCH_ALERT_MS, alerted: true }), NOW, false)).toBeNull();
    const three = [NOW - WATCH_LOOP_MS + 1000, NOW - HOUR_, NOW];
    expect(watchAlert(incident({ since: NOW, starts: three }), NOW, false)).toBe('loop');
    expect(watchAlert(incident({ since: NOW, starts: three, loopAlerted: true }), NOW, false)).toBeNull();
    expect(watchAlert(incident({ since: NOW, starts: [NOW - WATCH_LOOP_MS, NOW - HOUR_, NOW] }), NOW, false)).toBeNull();
    expect(watchAlert(closed(incident({ since: NOW - HOUR_ })), NOW, false)).toBeNull();
  });

  it('the alarm’s threshold (WATCH_FAST_MS): missing at 90 s though the lease still runs; the cron’s threshold never closes its incident', () => {
    const lease = (renewed: number) => ({ holder: RUN, host: 'actions' as const, until: renewed + 5 * MIN });
    const r = (ago: number) => rec({ runner: runner(NOW - ago), lease: lease(NOW - ago) });
    expect(watchOf(r(WATCH_FAST_MS - 1000), 'on', NOW, WATCH_FAST_MS).why).toBe('alive');
    expect(watchOf(r(WATCH_FAST_MS), 'on', NOW, WATCH_FAST_MS)).toMatchObject({ why: 'missing', dispatch: true, cancel: null, watch: { since: NOW, counted: false, starts: [] } });
    expect(watchOf(r(WATCH_FAST_MS), 'on', NOW).why).toBe('alive');   // the cron's
    // opened by the alarm a minute ago; the cron's tick (6 min) keeps it open; news after it closes it
    const open = incident({ since: NOW - MIN, counted: false, starts: [] });
    expect(watchOf({ ...r(3 * MIN), watch: open }, 'on', NOW)).toMatchObject({ why: 'missing', watch: open });
    expect(watchOf({ ...r(30_000), watch: open }, 'on', NOW).why).toBe('alive');
    // a claim (the lease renewed, no report) is news too
    expect(watchOf({ ...rec({ runner: runner(NOW - 3 * MIN), lease: lease(NOW - 30_000) }), watch: open }, 'on', NOW).why).toBe('alive');
  });

  it('counted (the loop’s starts) once WATCH_PUSH_MIN_MS silent; the in-job restart’s preflight is on its way', () => {
    const open = incident({ since: NOW - 3 * MIN, counted: false, starts: [] });
    expect(watchOf(rec({ runner: runner(NOW - WATCH_PUSH_MIN_MS + 1000), watch: open }), 'on', NOW).watch).toMatchObject({ counted: false, starts: [] });
    expect(watchOf(rec({ runner: runner(NOW - WATCH_PUSH_MIN_MS), watch: open }), 'on', NOW).watch).toMatchObject({ counted: true, starts: [NOW - 3 * MIN] });
    expect(watchOf(rec({ runner: runner(NOW - 2 * MIN), preflight: NOW - 30_000 }), 'on', NOW, WATCH_FAST_MS).why).toBe('starting');
  });

  it('hung: the holder’s lease expired, nothing heard for WATCH_HUNG_MS (past main.py’s WORKER_LOST_SEC): its GitHub run (Actions ids only); never a recent one', () => {
    const H = WATCH_HUNG_MS;
    expect(H).toBeGreaterThan(15 * MIN + 2 * MIN);   // a runner rides out a 15-min Worker outage before it ends itself
    const held = (holder: string, renewed: number) => ({ holder, host: 'actions' as const, until: renewed + 5 * MIN });
    const gone = { runner: { runId: '777-1', lastSeen: NOW - H - MIN } as RunnerRecord, lease: held('777-1', NOW - H - MIN) };
    expect(watchOf(rec(gone), 'on', NOW, WATCH_FAST_MS)).toMatchObject({ why: 'missing', dispatch: true, cancel: 777 });
    // a 6-min (or 17-min) runner↔Worker outage: no cancel
    for (const ago of [6 * MIN, H - 1000]) {
      expect(watchOf(rec({ runner: { ...gone.runner, lastSeen: NOW - ago }, lease: held('777-1', NOW - ago) }), 'on', NOW, WATCH_FAST_MS).cancel).toBeNull();
    }
    expect(watchOf(rec({ ...gone, lease: held('local-1794', NOW - H - MIN) }), 'on', NOW).cancel).toBeNull();
    expect(watchOf(rec({ ...gone, lease: null }), 'on', NOW).cancel).toBeNull();   // released: it ended
    expect(watchOf(rec({ ...gone, lease: held('777-1', NOW - 4 * MIN) }), 'on', NOW, WATCH_FAST_MS).cancel).toBeNull();   // a claim 4 min ago
    // the restart's preflight within WATCH_HUNG_MS: not hung (and on its way); older: hung
    expect(watchOf(rec({ ...gone, preflight: NOW - 4 * MIN }), 'on', NOW, WATCH_FAST_MS)).toMatchObject({ why: 'starting', cancel: null });
    expect(watchOf(rec({ ...gone, preflight: NOW - H - 1000 }), 'on', NOW, WATCH_FAST_MS)).toMatchObject({ why: 'missing', cancel: 777 });
    // the same backoff and cap as a dispatch
    expect(watchOf(rec({ ...gone, watch: incident({ n: 1, lastAt: NOW - 5 * MIN }) }), 'on', NOW).cancel).toBeNull();
    expect(watchOf(rec({ ...gone, watch: incident({ day: '2026-11-13', dayN: WATCH_DAY_CAP }) }), 'on', NOW).cancel).toBeNull();
  });

  it('hung, but the holder has a hold or confirming younger than HOLD_SEC with no outcome: never cancelled', () => {
    const H = WATCH_HUNG_MS;
    const gone = { runner: { runId: '777-1', lastSeen: NOW - H - MIN } as RunnerRecord, lease: { holder: '777-1', host: 'actions' as const, until: NOW - H + 4 * MIN } };
    const entry = (kind: 'hold' | 'confirming' | 'confirmed' | 'failed', at: number, runId = '777-1') =>
      ({ id: `${runId}:${kind}:${at}`, kind, date: '2026-11-22', hotel: 'NAGU 勝浦', runId, at });
    for (const kind of ['hold', 'confirming'] as const) {
      expect(watchOf(rec({ ...gone, bookings: [entry(kind, NOW - 25 * MIN)] }), 'on', NOW).cancel).toBeNull();
      expect(watchOf(rec({ ...gone, bookings: [entry(kind, NOW - 31 * MIN)] }), 'on', NOW).cancel).toBe(777);   // lapsed
      expect(watchOf(rec({ ...gone, bookings: [entry(kind, NOW - 25 * MIN), entry('failed', NOW - 24 * MIN)] }), 'on', NOW).cancel).toBe(777);
      expect(watchOf(rec({ ...gone, bookings: [entry(kind, NOW - 25 * MIN, '555-1')] }), 'on', NOW).cancel).toBe(777);   // another run's
    }
  });

  it(`the day’s in-job restarts spent (${RESTART_DAY_CAP}): no dispatch, no cancel, the crash-loop push`, () => {
    const spent = { restarts: { day: '2026-11-13', n: RESTART_DAY_CAP } };
    expect(watchOf(rec(spent), 'on', NOW)).toMatchObject({ why: 'missing', dispatch: false, cancel: null, capped: true, crashLoop: true });
    expect(watchOf(rec({ restarts: { day: '2026-11-12', n: RESTART_DAY_CAP } }), 'on', NOW)).toMatchObject({ dispatch: true, crashLoop: false });
    expect(watchAlert(incident({ since: NOW }), NOW, true, WATCH_PUSH_MIN_MS, true)).toBe('loop');
    expect(watchAlert(incident({ since: NOW }), NOW, true, WATCH_PUSH_MIN_MS - 1, true)).toBeNull();
  });

  it('after a cancel (within WATCH_EVERY_MS): the dispatch is due at once, the same recovery', () => {
    const w = incident({ n: 1, lastAt: NOW - MIN, cancelId: 777, cancelAt: NOW - MIN, day: '2026-11-13', dayN: WATCH_DAY_CAP });
    expect(watchOf(rec({ watch: w }), 'on', NOW)).toMatchObject({ dispatch: true, afterCancel: true, cancel: null, capped: true });
    expect(watchOf(rec({ watch: { ...w, lastAt: NOW - WATCH_EVERY_MS, cancelAt: NOW - WATCH_EVERY_MS } }), 'on', NOW)).toMatchObject({ afterCancel: false, dispatch: false });
  });

  it('watchAt: WATCH_FAST_MS after the last report or claim, then every WATCH_POLL_MS; none while inactive', () => {
    expect(watchAt(rec({ runner: runner(NOW - 30_000) }), 'on', NOW)).toBe(NOW - 30_000 + WATCH_FAST_MS);
    expect(watchAt(rec({ runner: runner(NOW - 30_000), lease: { holder: RUN, host: 'actions', until: NOW + 5 * MIN - 10_000 } }), 'on', NOW)).toBe(NOW - 10_000 + WATCH_FAST_MS);
    expect(watchAt(rec(), 'on', NOW)).toBe(NOW + WATCH_POLL_MS);
    expect(watchAt(rec(), 'off', NOW)).toBeNull();
  });

  it('watchAlert: nothing under WATCH_PUSH_MIN_MS of silence (a restart that fixes it pushes nothing)', () => {
    expect(watchAlert(incident({ since: NOW, failed: 2 }), NOW, true, WATCH_PUSH_MIN_MS - 1)).toBeNull();
    expect(watchAlert(incident({ since: NOW, failed: 2 }), NOW, false, WATCH_PUSH_MIN_MS)).toBe('silent');
  });
});

// ---- The object, the cron ----

let state: State;
let bot: ItsBot;
let env: Env;
let logs: ReturnType<typeof quiet>;
let runs: unknown[];
let gh: ReturnType<typeof vi.fn>;

const at = (min: number) => vi.setSystemTime(NOW + min * MIN);
/** GitHub's list for `?status=` (the newest first, `per_page` a page). */
const runsAnswer = (url: string) => {
  const q = new URL(url).searchParams;
  const r = (runs as { status: string }[]).filter((x) => x.status === q.get('status'));
  return Response.json({ total_count: r.length, workflow_runs: r.slice(0, Number(q.get('per_page'))) });
};
const settingsInput = (): ItsSettingsInput => ({ ...example.settingsInput, baseUpdatedAt: null }) as ItsSettingsInput;
const tick = () => bot.watch();
const dispatches = () => gh.mock.calls.filter(([u]) => u === DISPATCH_URL).length;
const listed = () => gh.mock.calls.filter(([u]) => String(u).includes('/runs?')).length;
const allLogs = () => [logs.debug, logs.log, logs.warn, logs.error].flatMap((m) => m.mock.calls.map((c) => c.map(String).join(' '))).join('\n');
const status = async (): Promise<ItsStatus> => (await page(env, '/its/status')).json();

/** A bot, active (settings, 開始), its runner reporting at NOW then gone (its lease ends at NOW + 5 min). */
async function fresh(extra: Partial<Env> = {}) {
  state = fakeState();
  const e = { GH_DISPATCH_TOKEN: 'gh-token', ...extra };
  bot = await start(state, e);
  env = envOf(bot, e);
  await bot.putSettings(settingsInput(), 'A', 'r-test');
  await bot.run({ action: 'start' }, 'A', 'r-test');
  await bot.claim({ runId: RUN, host: 'actions' });
  await bot.report(report());
  gh.mockClear();
}

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
  logs = quiet();
  runs = [];
  gh = vi.fn(async (url: string) => (url.includes('/runs?') ? runsAnswer(url) : new Response(null, { status: 204 })));
  vi.stubGlobal('fetch', gh);
  await fresh();
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('bot.ts watch: dispatching a missing runner', () => {
  it('a runner reporting, then within WATCH_QUIET_MS of its last report: nothing asked, nothing written', async () => {
    const puts = state.count.puts;
    expect(await tick()).toBe('alive');
    at(5);
    expect(await tick()).toBe('alive');
    expect([gh.mock.calls.length, state.count.puts - puts]).toEqual([0, 0]);
  });

  it('silent past WATCH_QUIET_MS, no unfinished run on GitHub: dispatched, recorded as 開始’s is (starting)', async () => {
    runs = [{ id: 1, status: 'completed' }];
    at(7);
    expect(await tick()).toBe('dispatch_204');
    expect([listed(), dispatches()]).toEqual([UNFINISHED.length, 1]);
    expect(gh.mock.calls.slice(0, UNFINISHED.length).map(([u]) => u)).toEqual(UNFINISHED.map(runsUrl));
    const h = (gh.mock.calls[0][1] as RequestInit).headers as Record<string, string>;
    expect(h.Authorization).toBe('Bearer gh-token');
    expect(bot.rec.watch).toEqual({ since: NOW + 7 * MIN, closedAt: null, n: 1, lastAt: NOW + 7 * MIN, failed: 0, noToken: false, alerted: false, counted: true, starts: [NOW + 7 * MIN], loopAlerted: false, day: '2026-11-13', dayN: 1, cancelId: null, cancelAt: null });
    expect(state.kv.get('watch')).toEqual(bot.rec.watch);
    const s = await status();
    expect([s.dispatch, s.verdict]).toEqual([{ at: NOW + 7 * MIN, ok: true, status: 204 }, 'starting']);
    expect(allLogs()).toContain('its watchdog missing last_report=420s run=19283746 lease=expired n=0 incidents_2h=1');
    expect(allLogs()).toContain('its watchdog dispatch=204 n=1 failed=0 today=1 incident=0s runs=none');
  });

  it('then waits (backing off), and a report closes the incident', async () => {
    at(7);
    await tick();
    at(12);
    expect(await tick()).toBe('waiting');   // its own dispatch is on its way
    at(17);
    expect(await tick()).toBe('dispatch_204');
    at(27);
    expect(await tick()).toBe('waiting');   // 20 min after the second
    at(37);
    expect(await tick()).toBe('dispatch_204');
    expect(dispatches()).toBe(3);
    await bot.claim({ runId: 'next-1', host: 'actions' });
    await bot.report(report({ runId: 'next-1' }));
    expect(await tick()).toBe('alive');
    expect([bot.rec.watch?.since, bot.rec.watch?.closedAt, bot.rec.watch?.n]).toEqual([null, NOW + 37 * MIN, 3]);   // its backoff kept
    expect(state.kv.get('watch')).toEqual(bot.rec.watch);
    expect(allLogs()).toContain('its watchdog closed why=alive after=1800s dispatches=3 alerted=1');
  });

  it('a run of the workflow unfinished on GitHub (queued, waiting, in progress): nothing dispatched', async () => {
    runs = [{ id: 42, status: 'queued' }, { id: 41, status: 'completed' }];
    at(7);
    expect(await tick()).toBe('github_run');
    expect([listed(), dispatches(), bot.rec.watch?.n]).toEqual([2, 0, 0]);   // in_progress, then queued
    expect(allLogs()).toContain('its watchdog skip=github_run id=42 status=queued');
    runs = [{ id: 42, status: 'completed' }];
    at(12);
    expect(await tick()).toBe('dispatch_204');
  });

  it('GitHub’s list unreadable (refused, not JSON, no answer): dispatched anyway (the concurrency group queues it)', async () => {
    for (const [i, answer] of [() => new Response('nope', { status: 500 }), () => new Response('<html>', { status: 200 }), () => Promise.reject(new TypeError('net'))].entries()) {
      vi.setSystemTime(NOW + i * 60 * MIN);
      await fresh();
      gh.mockImplementationOnce(answer);
      at(i * 60 + 7);
      expect(await tick()).toBe('dispatch_204');
    }
    expect(allLogs()).toContain('its watchdog runs unknown status=500');
    expect(allLogs()).toContain('its watchdog runs unknown err=TypeError');
  });

  it('開始 just pressed, or a run’s preflight just seen: on its way, nothing dispatched or opened', async () => {
    at(20);
    await bot.run({ action: 'start' }, 'B', 'r-test');   // dispatched (a 204)
    gh.mockClear();
    at(25);
    expect(await tick()).toBe('starting');
    vi.setSystemTime(NOW);
    await fresh();
    at(20);
    await bot.config(null);   // a run's preflight
    at(25);
    expect(await tick()).toBe('starting');
    expect([gh.mock.calls.length, bot.rec.watch]).toEqual([0, null]);
  });

  it('a refused dispatch: dispatch_failed shown; two in a row push (Push below)', async () => {
    gh.mockImplementation(async (url: string) => (url.includes('/runs?') ? runsAnswer(url) : new Response('{"message":"Bad credentials"}', { status: 401 })));
    at(7);
    expect(await tick()).toBe('dispatch_401');
    expect((await status()).reasons).toContain('dispatch_failed');
    at(17);
    expect(await tick()).toBe('dispatch_401');
    expect(bot.rec.watch).toMatchObject({ n: 2, failed: 2, alerted: true });
    expect(allLogs()).toContain('its push skip no_vapid kind=runner_silent');
  });

  it('no GH_DISPATCH_TOKEN: nothing sent, logged once per incident, no dispatch recorded', async () => {
    await fresh({ GH_DISPATCH_TOKEN: undefined });
    const before = bot.rec.dispatch;
    for (const m of [7, 12, 17, 60]) {
      at(m);
      expect(await tick()).toBe('no_token');
    }
    expect(gh).not.toHaveBeenCalled();
    expect(bot.rec.dispatch).toEqual(before);
    expect(bot.rec.watch).toMatchObject({ n: 0, noToken: true });
    expect(allLogs().match(/its watchdog no_token/g)).toHaveLength(1);
    expect(allLogs().match(/its watchdog alert=silent .* no_token=1/g)).toHaveLength(1);
  });

  it('decides again after GitHub’s answer: a report or a 停止 that landed meanwhile dispatches nothing', async () => {
    gh.mockImplementationOnce(async (url: string) => {
      await bot.claim({ runId: 'next-1', host: 'actions' });
      await bot.report(report({ runId: 'next-1' }));
      return runsAnswer(url);
    });
    at(7);
    expect(await tick()).toBe('alive');
    expect([dispatches(), bot.rec.watch]).toEqual([0, null]);
    expect(allLogs()).toContain('its watchdog rechecked why=alive dispatch=0');
    vi.setSystemTime(NOW);
    await fresh();
    gh.mockImplementationOnce(async (url: string) => {
      await bot.run({ action: 'stop' }, 'B', 'r-test');
      return runsAnswer(url);
    });
    at(7);
    expect(await tick()).toBe('inactive');
    expect(dispatches()).toBe(0);
  });

  it('a runner that reports and dies, again and again: the backoff continues across incidents, one push, the day’s cap', async () => {
    const sent: number[] = [];
    let report5: number | null = null;
    for (let m = 7; m <= 7 + 12 * 60; m += 5) {
      at(m);
      if (report5 === m) {   // the dispatched run reports once, then dies
        await bot.claim({ runId: `r-${m}`, host: 'actions' });
        await bot.report(report({ runId: `r-${m}` }));
      }
      const before = dispatches();
      await tick();
      if (dispatches() > before) { sent.push(m); report5 = m + 5; }
    }
    const gaps = sent.slice(1).map((t, i) => t - sent[i]);
    expect(gaps.slice(0, 4)).toEqual([15, 20, 40, 60]);   // not one per 15 min
    expect(gaps.slice(4, WATCH_DAY_CAP - 1).every((g) => g === 60)).toBe(true);
    // the day's cap: the 12th before Tokyo's midnight (NOW + 649.7 min) is the last till then
    expect([sent.filter((m) => m < 650).length, sent[WATCH_DAY_CAP]]).toEqual([WATCH_DAY_CAP, 652]);
    expect(allLogs().match(/its watchdog alert=\w+/g)).toEqual(['its watchdog alert=loop']);   // one push, the 3rd incident
  });

  it('the day’s cap reached in a fresh incident: the push', async () => {
    at(7);
    await tick();
    bot.rec.watch = { ...bot.rec.watch!, since: null, closedAt: NOW, starts: [], dayN: WATCH_DAY_CAP };
    at(20);
    expect(await tick()).toBe('capped');
    expect(allLogs()).toMatch(/its watchdog alert=silent incident=0s .* today=12 /);
  });

  it('a stop (停止, MODE off) closes the incident; nothing dispatched while stopped', async () => {
    at(7);
    await tick();
    await bot.run({ action: 'stop' }, 'A', 'r-test');
    gh.mockClear();
    at(30);
    expect(await tick()).toBe('inactive');
    expect([gh.mock.calls.length, bot.rec.watch?.since]).toEqual([0, null]);
    expect(allLogs()).toContain('its watchdog closed why=inactive');
  });
});


describe('the alarm: the push outbox and the fast watchdog, one alarm', () => {
  const ALARM_RUN = '777-1';
  const cancels = () => gh.mock.calls.filter(([u]) => String(u).includes('/cancel') || String(u).includes('/force-cancel')).map(([u]) => u);
  const answerCancel = () => gh.mockImplementation(async (url: string) => (url.includes('/runs?') ? runsAnswer(url) : new Response(null, { status: String(url).includes('cancel') ? 202 : 204 })));

  it('every report and claim re-arms it to WATCH_FAST_MS after; the outbox’s earlier send wins; firing does both duties', async () => {
    expect(state.alarms.at(-1)).toBe(NOW + WATCH_FAST_MS);
    at(0.5);
    await bot.report(report());
    expect(state.alarms.at(-1)).toBe(NOW + 30_000 + WATCH_FAST_MS);
    const job = { key: 'k', ep: 'nobody', kind: 'test' as const, id: 'test', urgency: 'high' as const, until: NOW + HOUR_, tries: 0, next: NOW + 40_000 };
    bot.rec.pushq = [job];
    await bot.claim({ runId: RUN, host: 'actions' });
    expect(state.alarms.at(-1)).toBe(NOW + 40_000);
    vi.setSystemTime(NOW + 40_000);
    await bot.alarm();
    expect(bot.rec.pushq).toEqual([]);   // sent (here: dropped, no such phone)
    expect(allLogs()).toContain('its push dropped why=no_vapid kind=test');
    expect(state.alarms.at(-1)).toBe(NOW + 30_000 + WATCH_FAST_MS);   // the watchdog's look
    expect(gh).not.toHaveBeenCalled();
  });

  it('fires with no report since: the decision at 90 s (a job that ended: dispatched); then polls; never a second dispatch', async () => {
    vi.setSystemTime(NOW + WATCH_FAST_MS);
    await bot.alarm();
    expect([dispatches(), bot.rec.watch?.n]).toEqual([1, 1]);
    expect(allLogs()).toContain('its watchdog missing last_report=90s run=19283746 lease=expired n=0 incidents_2h=0 fast=1');
    expect(state.alarms.at(-1)).toBe(NOW + WATCH_FAST_MS + WATCH_POLL_MS);
    for (const m of [2.5, 3.5, 5, 6]) {   // the alarm's polls and the cron's ticks: its dispatch is on its way
      at(m);
      await (m % 1 ? bot.alarm() : tick());
    }
    expect(dispatches()).toBe(1);
    await bot.claim({ runId: 'next-1', host: 'actions' });
    await bot.report(report({ runId: 'next-1' }));
    expect(state.alarms.at(-1)).toBe(NOW + 6 * MIN + WATCH_FAST_MS);
    expect(await tick()).toBe('alive');
  });

  it('the alarm and the cron at once: one decision after the other, one dispatch', async () => {
    at(7);
    const ctrl = { cron: '*/5 * * * *', scheduledTime: NOW, noRetry() {} } as ScheduledController;
    await Promise.all([bot.alarm(), worker.scheduled(ctrl, env), bot.alarm()]);
    expect(dispatches()).toBe(1);
  });

  it('the in-job restart: its preflight is on its way (GitHub not even asked); a live job GitHub lists is never dispatched behind', async () => {
    at(1);
    await bot.config(null);   // the wrapper's preflight before the restart
    vi.setSystemTime(NOW + WATCH_FAST_MS);
    await bot.alarm();
    expect([gh.mock.calls.length, bot.rec.watch]).toEqual([0, null]);
    vi.setSystemTime(NOW);
    await fresh();
    runs = [{ id: 19283746, status: 'in_progress' }];
    vi.setSystemTime(NOW + WATCH_FAST_MS);
    await bot.alarm();
    expect([dispatches(), cancels()]).toEqual([0, []]);
    expect(allLogs()).toContain('its watchdog skip=github_run id=19283746 status=in_progress');
  });

  it('a silence the restart fixes within minutes: no push, not counted (three in 2 h: no loop push)', async () => {
    runs = [{ id: 1, status: 'in_progress' }];
    for (const base of [0, 20, 40]) {
      at(base);
      await bot.report(report());
      at(base + 1.5);
      await bot.alarm();
      at(base + 3);
      await bot.alarm();
      expect(bot.rec.watch?.since).toBe(NOW + (base + 1.5) * MIN);
      await bot.claim({ runId: RUN, host: 'actions' });
      await bot.report(report());
      await bot.alarm();
    }
    expect(bot.rec.watch).toMatchObject({ since: null, starts: [], alerted: false, loopAlerted: false });
    expect(allLogs()).not.toContain('alert=');
  });

  it('hung: the holder silent past WATCH_HUNG_MS, its lease expired, its run in progress: cancelled, recorded; dispatched once GitHub shows it finished', async () => {
    await fresh();
    bot.rec.lease = null;   // released by the run before
    await bot.claim({ runId: ALARM_RUN, host: 'actions' });
    await bot.report(report({ runId: ALARM_RUN }));
    gh.mockClear();
    answerCancel();
    runs = [{ id: 900, status: 'in_progress' }, { id: 777, status: 'in_progress' }];   // another run’s gate, the hung one
    for (const m of [1.5, 5.5, 10, 17.5]) {   // a Worker outage the runner rides out (main.py WORKER_LOST_SEC)
      at(m);
      expect(await bot.alarm()).toBeUndefined();
    }
    expect(cancels()).toEqual([]);   // heard within the threshold: never
    at(18.5);
    await bot.alarm();
    expect(cancels()).toEqual([cancelUrl(777)]);
    expect(bot.rec.watch).toMatchObject({ n: 1, dayN: 1, lastAt: NOW + 18.5 * MIN, cancelId: 777, cancelAt: NOW + 18.5 * MIN, counted: true });
    expect(state.kv.get('watch')).toEqual(bot.rec.watch);
    expect(allLogs()).toMatch(/its watchdog cancel run=777 status=202 holder=777-1 silent=1110s n=1 failed=0 today=1/);
    at(19.5);
    await bot.alarm();   // still cancelling: nothing
    expect([cancels().length, dispatches()]).toEqual([1, 0]);
    runs = [{ id: 900, status: 'completed' }, { id: 777, status: 'completed' }];
    at(20.5);
    await bot.alarm();
    expect(dispatches()).toBe(1);
    expect(bot.rec.watch).toMatchObject({ n: 1, dayN: 1, lastAt: NOW + 20.5 * MIN, cancelAt: null });
    expect(allLogs()).toContain('after_cancel=1');
    at(22);
    await bot.alarm();
    expect(dispatches()).toBe(1);   // on its way
  });

  it('a cancel that didn’t end it: force-cancelled after the backoff; refused twice: the push', async () => {
    bot.rec.lease = null;
    await bot.claim({ runId: ALARM_RUN, host: 'actions' });
    await bot.report(report({ runId: ALARM_RUN }));
    gh.mockClear();
    runs = [{ id: 777, status: 'in_progress' }];
    gh.mockImplementation(async (url: string) => (url.includes('/runs?') ? runsAnswer(url) : new Response('{}', { status: 500 })));
    at(18.5);
    await bot.alarm();
    at(23);
    await bot.alarm();
    expect(cancels()).toEqual([cancelUrl(777)]);
    at(28.5);
    await bot.alarm();
    expect(cancels()).toEqual([cancelUrl(777), cancelUrl(777, true)]);
    expect(bot.rec.watch).toMatchObject({ n: 2, failed: 2, alerted: true });
  });

  it('a hung holder with a young hold on the record: never cancelled', async () => {
    bot.rec.lease = null;
    await bot.claim({ runId: ALARM_RUN, host: 'actions' });
    await bot.bookings([{ id: `${ALARM_RUN}:1`, kind: 'hold', date: '2026-11-22', hotel: 'NAGU 勝浦', runId: ALARM_RUN }], ALARM_RUN);
    await bot.report(report({ runId: ALARM_RUN }));
    runs = [{ id: 777, status: 'in_progress' }];
    answerCancel();
    at(20);
    await bot.alarm();
    expect(cancels()).toEqual([]);
    at(31);
    await bot.alarm();
    expect(cancels()).toEqual([cancelUrl(777)]);   // the hold lapsed
  });

  it(`the in-job restarts counted per Tokyo day; ${RESTART_DAY_CAP} spent: the preflight says restartsLeft 0, the watchdog dispatches nothing and pushes (loop)`, async () => {
    expect((await bot.config(null)).restartsLeft).toBe(RESTART_DAY_CAP);
    for (let i = 1; i <= RESTART_DAY_CAP; i++) await bot.report(report({ events: [{ seq: i, kind: 'run_start', detail: i % 2 ? 'restart' : 'schedule' }] }));
    expect(bot.rec.restarts).toEqual({ day: '2026-11-13', n: RESTART_DAY_CAP / 2, spentAt: null });
    for (let i = RESTART_DAY_CAP + 1; i <= RESTART_DAY_CAP * 2; i++) await bot.report(report({ events: [{ seq: i, kind: 'run_start', detail: 'restart' }] }));
    await bot.report(report({ events: [{ seq: 1, kind: 'run_start', detail: 'restart' }] }));   // a retried report: counted once
    expect(bot.rec.restarts?.n).toBe(RESTART_DAY_CAP * 1.5);
    expect(state.kv.get('restarts')).toEqual(bot.rec.restarts);
    expect(allLogs()).toContain(`its restart run=${RUN} today=${RESTART_DAY_CAP}`);
    const c = await bot.config(null);
    expect(c.restartsLeft).toBe(0);
    expect('restartsLeft' in (await bot.config(RUN))).toBe(false);   // a run's own reads: as before
    gh.mockClear();
    at(7);
    expect(await tick()).toBe('capped');
    expect(dispatches()).toBe(0);
    expect(allLogs()).toMatch(/its watchdog alert=loop .* restarts=30/);
    const s = await status();
    expect([s.verdict, s.reasons[0]]).toEqual(['late', 'restart_cap']);
    // 開始: a deliberate action passes the cap: one run (its own dispatch, not the watchdog's), restartsLeft 1
    at(8);
    gh.mockClear();
    await bot.run({ action: 'start' }, 'A', 'r-test');
    expect([dispatches(), (await bot.config(null)).restartsLeft, bot.rec.watch?.dayN ?? 0]).toEqual([1, 1, 0]);
    expect((await status()).reasons).not.toContain('restart_cap');
    expect(allLogs()).toContain('restart_cap=bypassed');
    // that run's next restart spends it again
    at(9);
    await bot.report(report({ events: [{ seq: 100, kind: 'run_start', detail: 'restart' }] }));
    expect([(await bot.config(null)).restartsLeft, (await status()).reasons[0]]).toEqual([0, 'restart_cap']);
    vi.setSystemTime(NOW + 12 * HOUR_);   // the next Tokyo day
    expect((await bot.config(null)).restartsLeft).toBe(RESTART_DAY_CAP);
    expect((await status()).reasons).not.toContain('restart_cap');
  });

  it('without GH_DISPATCH_TOKEN the alarm is the outbox’s alone (the cron watches)', async () => {
    await fresh({ GH_DISPATCH_TOKEN: undefined });
    const n = state.alarms.length;
    await bot.report(report());
    vi.setSystemTime(NOW + 10 * MIN);
    await bot.alarm();
    expect([state.alarms.length - n, bot.rec.watch]).toEqual([0, null]);
  });
});

describe('the push: once per incident', () => {
  let vapid: Awaited<ReturnType<typeof vapidPair>>;
  let phones: Phone[];
  let service: ReturnType<typeof fakePushService>;

  beforeEach(async () => {
    vapid = await vapidPair();
    phones = await Promise.all([1, 2].map(async (n) => ({ ...(await phoneKeys()), endpoint: `https://${HOST}/p/${n}` })));
    await fresh({ VAPID_PUBLIC: vapid.publicKey, VAPID_PRIVATE: vapid.privateKey });
    service = fakePushService(vapid.publicKey, phones);
    bot.pushDeps = { hosts: [HOST], fetch: service.fetch };
    for (const [i, p] of phones.entries()) await bot.subscribe({ endpoint: p.endpoint, keys: { p256dh: p.p256dh, auth: p.auth }, lang: i ? 'en' : 'ja' }, i ? 'B' : 'A', 'r-test');
  });

  it(`WATCH_ALERT_MS into the incident: one push per phone (high, an hour), never again; a new incident pushes again`, async () => {
    gh.mockResolvedValue(new Response(null, { status: 204 }));   // GitHub never says (list unreadable): dispatch
    at(7);
    await tick();
    at(17);
    await tick();
    expect(bot.rec.pushq).toEqual([]);
    at(22);
    expect(await tick()).toBe('waiting');
    expect(bot.rec.pushq.map((j) => [j.kind, j.id, j.urgency, j.until])).toEqual([
      ['runner_silent', `watch:${NOW + 7 * MIN}`, 'high', NOW + 82 * MIN], ['runner_silent', `watch:${NOW + 7 * MIN}`, 'high', NOW + 82 * MIN],
    ]);
    expect(state.alarms.at(-1)).toBe(NOW + 22 * MIN);
    await bot.alarm();
    const shown = service.delivered.map((d) => d.message as ItsPushPayload);
    expect(shown.map((m) => [m.kind, m.title, m.body, m.tag]).sort()).toEqual([
      ['runner_silent', 'ITS bot stopped', 'the runner can’t be kept running: check Actions', 'its-runner_silent'],
      ['runner_silent', '保養所ボットが止まっています', 'ランナーを再起動できていません：Actionsを確認', 'its-runner_silent'],
    ]);
    expect(service.delivered.map((d) => d.urgency)).toEqual(['high', 'high']);
    // a close drops what is still queued
    at(23);
    await bot.run({ action: 'stop' }, 'A', 'r-test');
    bot.rec.pushq = silentJobs(NOW + 7 * MIN, bot.rec.subs, NOW + 23 * MIN);
    expect(await tick()).toBe('inactive');
    expect(bot.rec.pushq).toEqual([]);
    await bot.run({ action: 'start' }, 'A', 'r-test');
    for (const m of [27, 40, 90]) {
      at(m);
      await tick();
    }
    expect([bot.rec.pushq, service.delivered.length]).toEqual([[], 2]);
    expect(allLogs().match(/its watchdog alert=/g)).toHaveLength(1);
    // recovered; missing again within 2 h of the last incident: no push (that run of incidents pushed); later: a push
    await bot.claim({ runId: 'next-1', host: 'actions' });
    await bot.report(report({ runId: 'next-1' }));
    await tick();
    at(110);
    await tick();
    at(126);
    await tick();
    expect(bot.rec.pushq).toEqual([]);
    await bot.claim({ runId: 'next-2', host: 'actions' });
    await bot.report(report({ runId: 'next-2' }));
    await tick();
    at(240);
    await tick();
    at(256);
    await tick();
    expect(bot.rec.pushq.map((j) => j.id)).toEqual([`watch:${NOW + 240 * MIN}`, `watch:${NOW + 240 * MIN}`]);
  });
});

describe('index.ts scheduled', () => {
  const ctrl = { cron: '*/5 * * * *', scheduledTime: NOW, noRetry() {} } as ScheduledController;

  it('runs the watchdog', async () => {
    at(7);
    await worker.scheduled(ctrl, env);
    expect(dispatches()).toBe(1);
  });

  it('a throw is logged, not thrown (the next tick tries again)', async () => {
    bot.watch = () => Promise.reject(new RangeError('boom'));
    await expect(worker.scheduled(ctrl, env)).resolves.toBeUndefined();
    expect(allLogs()).toContain('its watchdog failed err=RangeError');
  });
});
