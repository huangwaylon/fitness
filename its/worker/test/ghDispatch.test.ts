// Each workflow's last dispatch on the record (src/rules.ts noteDispatch, ghFailing, healthOf; src/bot.ts dispatchTick,
// run, watch) and the nightly flake hunt (src/dispatch.ts dispatchFlake): written only on a change or hourly, the
// identity used (the GitHub App's), /health/its's dispatches and `dispatch_failed`, the cron minting its own token when
// the object fails. Clock pinned, fetch stubbed (the App's mint answered: `ghs_app`).
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import example from '../../contract-example.json';
import type { ItsSettingsInput } from '../../../app/src/lib/its/contract.ts';
import type { ItsBot } from '../src/bot.ts';
import { FLAKE_DISPATCH_URL, dispatchFlake, flakeSlot, flakeTodayUrl, healthDispatchUrl, tokyoDayStart } from '../src/dispatch.ts';
import { forgetTokens } from '../src/ghApp.ts';
import { GH_BEAT_MS, ghFailing, noteDispatch, type GhDispatch } from '../src/rules.ts';
import worker from '../src/index.ts';
import { testKey } from './ghKey.ts';
import { MIN, NOW, envOf, fakeState, quiet, report, start, type State } from './fakeBot.ts';

const HOUR = 60 * MIN;
const T = Date.parse('2026-11-24T03:15:00Z');
const at = (iso: string) => Date.parse(`${iso}:00Z`);
let state: State;
let bot: ItsBot;
let logs: ReturnType<typeof quiet>;
let gh: ReturnType<typeof vi.fn<(url: string, init?: RequestInit) => Promise<Response>>>;
let status: (url: string) => number;
let pem: string;
/** its-bot's App secrets, with a throwaway key (ghKey.ts testKey). */
let app: { GH_APP_ID: string; GH_APP_INSTALLATION_ID: string; GH_APP_KEY_ITS: string };

beforeAll(async () => {
  ({ pem } = await testKey());
  app = { GH_APP_ID: '123', GH_APP_INSTALLATION_ID: '456', GH_APP_KEY_ITS: pem };
});

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(T);
  forgetTokens();
  logs = quiet();
  status = () => 204;
  gh = vi.fn(async (url: string) => {
    if (url.endsWith('/access_tokens')) return Response.json({ token: 'ghs_app', expires_at: new Date(Date.now() + HOUR).toISOString() }, { status: 201 });
    if (url.includes('/runs?')) return Response.json({ total_count: 0, workflow_runs: [] });
    return new Response(null, { status: status(url) });
  });
  vi.stubGlobal('fetch', gh);
  state = fakeState();
  bot = await start(state, app);
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const posted = () => gh.mock.calls.filter(([u, i]) => i?.method === 'POST' && !u.endsWith('/access_tokens')).map(([u]) => u.split('/workflows/')[1].split('.yml')[0]);
const authOf = (wf: string) => (gh.mock.calls.find(([u]) => u === healthDispatchUrl(wf))![1]!.headers as Record<string, string>).Authorization;

describe('noteDispatch and ghFailing', () => {
  const d = (x: Partial<GhDispatch> = {}): Record<string, GhDispatch> => ({ health: { st: 204, at: T, by: 'app', failAt: null, ...x } });

  it('a write on a new status or identity, or hourly; none for the same within the hour', () => {
    expect(noteDispatch({}, 'health', 204, 'app', T)).toEqual(d());
    expect(noteDispatch(d(), 'health', 204, 'app', T + 30 * MIN)).toBeNull();
    expect(noteDispatch(d(), 'health', 204, 'app', T + GH_BEAT_MS)).toEqual(d({ at: T + GH_BEAT_MS }));
    // (an older record's `pat`)
    expect(noteDispatch(d({ by: 'pat' }), 'health', 204, 'app', T + MIN)).toEqual(d({ at: T + MIN }));
    expect(noteDispatch(d(), 'health', 401, 'app', T + MIN)).toEqual(d({ st: 401, at: T + MIN, failAt: T + MIN }));
    // the refusal's time stays after a recovery
    expect(noteDispatch(d({ st: 401, failAt: T }), 'health', 204, 'app', T + MIN)).toEqual(d({ at: T + MIN, failAt: T }));
  });

  it('failing: a refusal within the hour, or one still the last status (its time kept hourly)', () => {
    expect(ghFailing(d(), T)).toBe(false);
    expect(ghFailing(d({ failAt: T - 59 * MIN }), T)).toBe(true);
    expect(ghFailing(d({ failAt: T - 61 * MIN }), T)).toBe(false);
    expect(ghFailing(d({ st: 0, at: T - 90 * MIN, failAt: T - 3 * HOUR }), T)).toBe(true);
    expect(ghFailing(d({ st: 0, at: T - 2 * HOUR, failAt: T - 3 * HOUR }), T)).toBe(false);
  });
});

describe('the cron’s dispatches, recorded', () => {
  it('at :15 the three, recorded once by the App; :45 the same (nothing written); /health/its shows them', async () => {
    expect(await bot.dispatchTick(T)).toEqual([{ wf: 'health', st: 204 }, { wf: 'its-health', st: 204 }, { wf: 'places-pull', st: 204 }]);
    expect(authOf('health')).toBe('Bearer ghs_app');
    const rows = state.count.rows;
    vi.setSystemTime(T + 30 * MIN);
    await bot.dispatchTick(T + 30 * MIN);
    expect(state.count.rows).toBe(rows);
    expect(posted()).toHaveLength(6);
    const h = await bot.health();
    expect(h.dispatches).toEqual({
      health: { st: 204, ageSec: 1800, by: 'app', failAgeSec: null }, 'its-health': { st: 204, ageSec: 1800, by: 'app', failAgeSec: null }, 'places-pull': { st: 204, ageSec: 1800, by: 'app', failAgeSec: null },
    });
    expect(h.reasons).toEqual(['paused', 'no_dates']);
  });

  it('a refusal: written, one warn line, dispatch_failed in /health/its for the hour after its recovery (a healthy verdict degraded)', async () => {
    status = (u) => (u.includes('/places-pull.yml/') ? 403 : 204);
    await bot.dispatchTick(T);
    expect(logs.warn.mock.calls.flat()).toContain('its gh dispatch wf=places-pull status=403 by=app was=-');
    expect((await bot.health()).reasons).toEqual(['paused', 'no_dates', 'dispatch_failed']);
    status = () => 204;
    vi.setSystemTime(T + 30 * MIN);
    await bot.dispatchTick(T + 30 * MIN);
    expect((await bot.health()).dispatches['places-pull']).toEqual({ st: 204, ageSec: 0, by: 'app', failAgeSec: 1800 });
    expect((await bot.health()).reasons).toContain('dispatch_failed');
    vi.setSystemTime(T + 61 * MIN);
    expect((await bot.health()).reasons).toEqual(['paused', 'no_dates']);
    // the verdict: healthy → degraded; others kept
    bot.rec.gh = { health: { st: 0, at: Date.now(), by: 'app', failAt: Date.now() } };
    expect((await bot.health()).verdict).toBe('stopped');
    vi.setSystemTime(NOW);   // a healthy runner (the example's settings' dates are ahead of it)
    await bot.putSettings({ ...example.settingsInput, baseUpdatedAt: null } as ItsSettingsInput, 'A', 'r');
    await bot.run({ action: 'start' }, 'A', 'r');
    await bot.claim({ runId: example.claimInput.runId, host: 'actions' });
    await bot.report(report());
    bot.rec.gh = {};
    expect(await bot.health()).toMatchObject({ verdict: 'healthy', reasons: [] });
    bot.rec.gh = { health: { st: 0, at: NOW, by: 'app', failAt: NOW } };
    expect(await bot.health()).toMatchObject({ verdict: 'degraded', reasons: ['dispatch_failed'] });
  });

  it('the booker active: its-health at :00 and :30 too; idle: nothing then', async () => {
    const idle = at('2026-11-24T04:00');
    vi.setSystemTime(NOW);   // the example's settings' dates are ahead of it
    expect(await bot.dispatchTick(idle)).toEqual([]);
    await bot.putSettings({ ...example.settingsInput, baseUpdatedAt: null } as ItsSettingsInput, 'A', 'r');
    await bot.run({ action: 'start' }, 'A', 'r');
    gh.mockClear();
    expect(await bot.dispatchTick(idle)).toEqual([{ wf: 'its-health', st: 204 }]);
    expect(Object.keys(bot.rec.gh).sort()).toEqual(['its-health', 'its-runner']);
  });

  it('no identity: nothing sent, nothing recorded', async () => {
    bot = await start(fakeState(), {});
    expect(await bot.dispatchTick(T)).toEqual([]);
    expect(gh).not.toHaveBeenCalled();
    expect(bot.rec.gh).toEqual({});
  });
});

describe('with the GitHub App', () => {

  it('every call carries the App’s token (minted once, kept in storage: a cold object mints none), recorded `app`', async () => {
    bot = await start(state, app);
    await bot.dispatchTick(T);
    expect(authOf('its-health')).toBe('Bearer ghs_app');
    expect(gh.mock.calls.filter(([u]) => u.endsWith('/access_tokens'))).toHaveLength(1);
    expect(bot.rec.gh.health.by).toBe('app');
    expect(state.kv.get('ghtoken')).toMatchObject({ token: 'ghs_app' });
    forgetTokens();
    bot = await start(state, app);
    vi.setSystemTime(T + 30 * MIN);
    status = () => 204;
    await bot.dispatchTick(T + 30 * MIN);
    expect(gh.mock.calls.filter(([u]) => u.endsWith('/access_tokens'))).toHaveLength(1);
    // 開始's dispatch too
    vi.setSystemTime(NOW);   // the example's settings' dates are ahead of it
    await bot.putSettings({ ...example.settingsInput, baseUpdatedAt: null } as ItsSettingsInput, 'A', 'r');
    await bot.run({ action: 'start' }, 'A', 'r');
    const run = gh.mock.calls.find(([u]) => u.includes('/its-runner.yml/dispatches'))!;
    expect((run[1]!.headers as Record<string, string>).Authorization).toBe('Bearer ghs_app');
    expect(bot.rec.gh['its-runner']).toMatchObject({ st: 204, by: 'app' });
  });

  it('a token GitHub refuses (401): dropped here and in storage, minted again and the tick sent once more', async () => {
    bot = await start(state, app);
    await bot.dispatchTick(T);
    const mints = () => gh.mock.calls.filter(([u]) => u.endsWith('/access_tokens')).length;
    expect(mints()).toBe(1);
    gh.mockClear();
    let refuse = true;
    status = () => (refuse ? 401 : 204);
    vi.setSystemTime(T + 30 * MIN);
    const tokens: string[] = [];
    gh.mockImplementation(async (url: string, init?: RequestInit) => {
      if (url.endsWith('/access_tokens')) return (refuse = false), Response.json({ token: 'ghs_new', expires_at: new Date(Date.now() + HOUR).toISOString() }, { status: 201 });
      if (url.includes('/runs?')) return Response.json({ total_count: 0, workflow_runs: [] });
      tokens.push((init!.headers as Record<string, string>).Authorization);
      return new Response(null, { status: status(url) });
    });
    expect(await bot.dispatchTick(T + 30 * MIN)).toEqual([{ wf: 'health', st: 204 }, { wf: 'its-health', st: 204 }, { wf: 'places-pull', st: 204 }]);
    expect(mints()).toBe(1);
    expect(tokens).toEqual(['Bearer ghs_app', 'Bearer ghs_app', 'Bearer ghs_app', 'Bearer ghs_new', 'Bearer ghs_new', 'Bearer ghs_new']);
    expect(state.kv.get('ghtoken')).toMatchObject({ token: 'ghs_new' });
    expect(bot.rec.gh.health).toMatchObject({ st: 204, by: 'app' });
    expect(logs.warn.mock.calls.flat()).toContain('its gh token refused status=401: dropped, minted again');
  });

  it('a bad key: nothing sent, nothing recorded, the mint’s failure one warn line', async () => {
    bot = await start(fakeState(), { ...app, GH_APP_KEY_ITS: 'not a key' });
    expect(await bot.dispatchTick(T)).toEqual([]);
    expect(posted()).toEqual([]);
    expect(bot.rec.gh).toEqual({});
    expect(logs.warn.mock.calls.flat()).toContain('gh-app mint failed code=key_bad status=0');
  });
});

describe('the nightly flake hunt', () => {
  const NIGHT = at('2026-11-25T19:30');   // a Wednesday: no Kalori window

  it('ticks from 19:30 UTC (04:30 Tokyo) for 2 h; asks for the runs since Tokyo’s midnight', () => {
    expect([at('2026-11-25T19:25'), NIGHT, at('2026-11-25T21:25'), at('2026-11-25T21:30')].map(flakeSlot)).toEqual([null, NIGHT, NIGHT, null]);
    expect(tokyoDayStart(NIGHT)).toBe(at('2026-11-25T15:00'));
    expect(flakeTodayUrl(NIGHT)).toBe('https://api.github.com/repos/huangwaylon/fitness/actions/workflows/e2e-flake-hunt.yml/runs?created=%3E%3D2026-11-25T15%3A00%3A00Z&per_page=1');
  });

  it('sent on main when none ran today nor is unfinished; skipped when one did or is', async () => {
    expect(await dispatchFlake('tok', NIGHT)).toBe('sent status=204');
    const send = gh.mock.calls.find(([u]) => u === FLAKE_DISPATCH_URL)!;
    expect(JSON.parse(String(send[1]!.body))).toEqual({ ref: 'main' });
    gh.mockImplementation(async (url: string) => Response.json({ total_count: url.includes('created=') ? 1 : 0, workflow_runs: [] }));
    expect(await dispatchFlake('tok', NIGHT)).toBe('skip why=today');
    gh.mockImplementation(async (url: string) => Response.json({ total_count: url.includes('status=in_progress') ? 1 : 0, workflow_runs: [] }));
    expect(await dispatchFlake('tok', NIGHT)).toBe('skip why=in_progress');
    gh.mockImplementation(async () => new Response('', { status: 500 }));
    expect(await dispatchFlake('tok', NIGHT)).toBe('unknown asked=today');
    expect(await dispatchFlake(undefined, NIGHT)).toBe('no_token');
    expect(await dispatchFlake('tok', at('2026-11-25T18:30'))).toBeNull();
  });

  it('by the object: recorded; the night’s later ticks ask GitHub nothing once it was accepted', async () => {
    vi.setSystemTime(NIGHT);
    expect(await bot.dispatchTick(NIGHT)).toEqual([{ wf: 'e2e-flake-hunt', st: 204 }]);
    gh.mockClear();
    vi.setSystemTime(NIGHT + 5 * MIN);
    expect(await bot.dispatchTick(NIGHT + 5 * MIN)).toEqual([]);
    expect(gh).not.toHaveBeenCalled();
    // the next night asks again (a Thursday)
    vi.setSystemTime(NIGHT + 24 * HOUR);
    expect(await bot.dispatchTick(NIGHT + 24 * HOUR)).toEqual([{ wf: 'e2e-flake-hunt', st: 204 }]);
  });
});

describe('index.ts scheduled', () => {
  it('the object failing with no App: nothing sent', async () => {
    const env = envOf(bot, {});
    bot.dispatchTick = () => Promise.reject(new RangeError('boom'));
    await worker.scheduled({ cron: '*/5 * * * *', scheduledTime: T, noRetry() {} } as ScheduledController, env);
    expect(gh).not.toHaveBeenCalled();
    expect(logs.error.mock.calls.map((c) => c[0])).toContain('its dispatch tick failed err=RangeError fallback=none');
  });

  it('the object failing: the tick’s dispatches go anyway with the App’s token, minted without the object’s store', async () => {
    const env = envOf(bot, app);
    bot.dispatchTick = () => Promise.reject(new RangeError('boom'));
    await worker.scheduled({ cron: '*/5 * * * *', scheduledTime: T, noRetry() {} } as ScheduledController, env);
    expect(posted()).toEqual(['health', 'its-health', 'places-pull']);
    expect(authOf('health')).toBe('Bearer ghs_app');
    expect(logs.error.mock.calls.map((c) => c[0])).toContain('its dispatch tick failed err=RangeError fallback=app');
  });
});
