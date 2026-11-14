// The watchdog (src/rules.ts watchOf, watchAlert; src/bot.ts watch; src/index.ts scheduled): when a missing runner is
// dispatched (active, no report for WATCH_QUIET_MS, no live lease, none on its way, GitHub showing no unfinished run),
// the backoff, no token (logged once, nothing sent), the push once per incident and its close on recovery or a stop;
// and that a quiet tick writes nothing. GitHub is a stubbed fetch; the push service pushKit's.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import example from '../../contract-example.json';
import { START_GRACE_SEC, type ItsPushPayload, type ItsSettings, type ItsSettingsInput, type ItsStatus } from '../../../app/src/lib/its/contract.ts';
import type { ItsBot } from '../src/bot.ts';
import { DISPATCH_URL, UNFINISHED, runsUrl } from '../src/dispatch.ts';
import type { Env } from '../src/env.ts';
import worker from '../src/index.ts';
import { silentJobs } from '../src/push.ts';
import {
  WATCH_ALERT_MS, WATCH_COOLDOWN_MS, WATCH_DAY_CAP, WATCH_EVERY_MAX_MS, WATCH_EVERY_MS, WATCH_LOOP_MS, WATCH_QUIET_MS, watchAlert, watchOf,
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
    acks: [], preflight: null, scanned: [], minutes: [], subs: [], pushq: [], pushlog: { lastSentAt: null, lastOutcome: null, done: [] }, watch: null, ...x,
  });
  const incident = (x: Partial<Watch> = {}): Watch => ({ since: NOW - 30 * MIN, closedAt: null, n: 0, lastAt: null, failed: 0, noToken: false, alerted: false, starts: [NOW - 30 * MIN], loopAlerted: false, day: '', dayN: 0, ...x });
  const closed = (w: Watch) => ({ ...w, since: null, closedAt: NOW });

  it('inactive (MODE off, stopped, no date): nothing, an open incident closed (its backoff kept)', () => {
    for (const [r, mode] of [[rec(), 'off'], [rec({ settings: { ...settings, paused: true } }), 'on'], [rec({ settings: { ...settings, dates: ['2026-11-01'] } }), 'on']] as const) {
      expect(watchOf({ ...r, watch: incident({ n: 2 }) }, mode, NOW)).toEqual({ watch: closed(incident({ n: 2 })), why: 'inactive', dispatch: false, capped: false });
      expect(watchOf({ ...r, watch: null }, mode, NOW).watch).toBeNull();
    }
  });

  it('alive: a report within WATCH_QUIET_MS, or a live lease (whatever the report’s age)', () => {
    expect(watchOf(rec({ runner: runner(NOW - WATCH_QUIET_MS + 1000) }), 'on', NOW).why).toBe('alive');
    expect(watchOf(rec({ lease: { holder: RUN, host: 'actions', until: NOW + 1000 }, watch: incident() }), 'on', NOW)).toEqual({ watch: closed(incident()), why: 'alive', dispatch: false, capped: false });
  });

  it('missing: no report for WATCH_QUIET_MS, the lease expired or released, never a runner: dispatch', () => {
    const d = { watch: incident({ since: NOW, starts: [NOW] }), why: 'missing', dispatch: true, capped: false };
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
    expect(watchOf(rec({ preflight: NOW - MIN, watch: incident() }), 'on', NOW)).toEqual({ watch: incident(), why: 'missing', dispatch: false, capped: false });
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
    expect(watchOf(rec({ watch: last }), 'on', NOW)).toMatchObject({ watch: { since: NOW, n: 3, lastAt: NOW - 30 * MIN, failed: 1, starts: [NOW - 30 * MIN, NOW] }, dispatch: false });
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
});

// ---- The object, the cron ----

let state: State;
let bot: ItsBot;
let env: Env;
let logs: ReturnType<typeof quiet>;
let runs: unknown[];
let gh: ReturnType<typeof vi.fn>;

const at = (min: number) => vi.setSystemTime(NOW + min * MIN);
/** GitHub's list for `?status=` (the newest first, one a page). */
const runsAnswer = (url: string) => {
  const r = (runs as { status: string }[]).filter((x) => x.status === new URL(url).searchParams.get('status'));
  return Response.json({ total_count: r.length, workflow_runs: r.slice(0, 1) });
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
    expect(bot.rec.watch).toEqual({ since: NOW + 7 * MIN, closedAt: null, n: 1, lastAt: NOW + 7 * MIN, failed: 0, noToken: false, alerted: false, starts: [NOW + 7 * MIN], loopAlerted: false, day: '2026-11-13', dayN: 1 });
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
