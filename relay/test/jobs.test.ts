// ボット → 定期処理 (src/jobs.ts, src/jobsKeeper.ts): the rings (a run a note, 24 kept, 14 Tokyo days counted; nightly a
// cell a day), the tick's outcomes, GitHub's runs compacted and each counted once across pages, its-bot's dispatch
// slots, the alert issues, gym-bot's checks; the keeper's copy (refreshed on the tick when 4 min old, behind a read
// when 5 min old, one at a time, the App's token narrowed to actions: read), and `GET /jobs`'s gate.
import { describe, expect, it, vi } from 'vitest';
import { alertsOf, dispatchRow, gymRow, jobsRoute, jobsStatus, noteDayRun, noteRun, NO_EXT, refreshExt, tickRuns, wfRow, KEY, type Ext } from '../src/jobs.ts';
import { JobsKeeper } from '../src/jobsKeeper.ts';
import { forgetTokens } from '../../its/worker/src/ghApp.ts';
import { JOBS, RUNS_KEPT, WORKFLOWS, parseJobs } from '../../app/src/lib/contract/jobs.ts';

const MIN = 60_000, H = 60 * MIN, DAY = 24 * H;
// 12:20 Tokyo, 2026-11-24
const NOW = Date.parse('2026-11-24T03:20:00.000Z');
const iso = (t: number) => new Date(t).toISOString().replace('.000', '');

/** A GitHub run (the fields read), `ago` before NOW. */
const gh = (id: number, ago: number, o: Partial<{ conclusion: string | null; status: string; event: string; login: string; ms: number }> = {}) => ({
  id, status: o.status ?? 'completed', conclusion: o.conclusion === undefined ? 'success' : o.conclusion, event: o.event ?? 'schedule',
  created_at: iso(NOW - ago), run_started_at: iso(NOW - ago), updated_at: iso(NOW - ago + (o.ms ?? 12_000)), triggering_actor: { login: o.login ?? 'huangwaylon' },
  head_commit: { message: 'ignored' }
});

describe('the rings', () => {
  it('a run a note, the newest first, 24 kept; ok and fail counted in their Tokyo day, idle not; 14 days kept', () => {
    let r = noteRun(undefined, { t: NOW - 20 * DAY, st: 'ok' }, NOW - 20 * DAY);
    for (let i = 30; i >= 0; i--) r = noteRun(r, { t: NOW - i * H, st: i % 10 === 0 ? 'fail' : i % 7 === 0 ? 'idle' : 'ok' }, NOW);
    expect(r.r).toHaveLength(RUNS_KEPT);
    expect(r.r[0]).toEqual({ t: NOW, st: 'fail' });
    // (the run 20 days ago aged out of the 14 days)
    expect(r.d.map((d) => d[0])).toEqual(['2026-11-23', '2026-11-24']);
    const total = r.d.reduce((a, d) => [a[0] + d[1], a[1] + d[2]], [0, 0]);
    expect(total).toEqual([31 - 4 - 4, 4]);
  });

  it('nightly: a cell a Tokyo day, the day’s later call replacing its run and its count', () => {
    let r = noteDayRun(undefined, { t: NOW - DAY, st: 'ok' }, NOW - DAY);
    r = noteDayRun(r, { t: NOW - 9 * H, st: 'run', c: 'islandprune' }, NOW);
    r = noteDayRun(r, { t: NOW - 8 * H, st: 'fail', c: 'tombprune' }, NOW);
    expect(r.r.map((x) => x.st)).toEqual(['fail', 'ok']);
    expect(r.d).toEqual([['2026-11-23', 1, 0], ['2026-11-24', 0, 1]]);
  });

  it('the tick’s outcomes: the tick ok, the weather not due idle, failed with its code; the places’ categories idle with nothing to do', () => {
    const r = tickRuns({ t: NOW, ms: 80, wx: { ok: false, fetched: true, fail: 'timeout' }, places: { ok: true, ai: 0 } });
    expect(r).toEqual({ tick: { t: NOW, st: 'ok', ms: 80 }, wx: { t: NOW, st: 'fail', c: 'timeout' }, places: { t: NOW, st: 'idle' } });
    expect(tickRuns({ t: NOW, ms: 1, wx: { ok: true, fetched: false }, places: null }).places).toEqual({ t: NOW, st: 'fail', c: 'threw' });
    expect(tickRuns({ t: NOW, ms: 1, wx: null, places: { ok: true, ai: 3, aiFail: 1 } })).toMatchObject({ wx: { st: 'fail' }, places: { st: 'warn', c: 'ai_fail:1' } });
  });
});

describe('GitHub', () => {
  it('a workflow’s runs compacted (start, outcome, duration, conclusion, trigger, id; a skipped one dropped); each counted once across reads, none past one under way', () => {
    const page1 = [gh(110, 5 * MIN, { conclusion: 'skipped' }), gh(105, 10 * MIN, { status: 'in_progress', conclusion: null }), gh(104, 40 * MIN, { conclusion: 'failure', event: 'workflow_dispatch' }), gh(103, 70 * MIN, { conclusion: 'cancelled' }), gh(102, 100 * MIN)];
    const a = wfRow(undefined, page1, NOW);
    expect(a.r[0]).toEqual({ t: NOW - 10 * MIN, st: 'run', by: 's', id: 105 });
    expect(a.r[1]).toEqual({ t: NOW - 40 * MIN, st: 'fail', ms: 12_000, c: 'failure', by: 'd', id: 104 });
    expect(a.r[2]).toMatchObject({ st: 'idle', c: 'cancelled' });
    expect(a.seen).toBe(104);
    expect(a.d).toEqual([['2026-11-24', 1, 1]]);
    // the next read: 105 ended, 106 new; 102–104 not counted again
    const page2 = [gh(106, 5 * MIN), { ...gh(105, 10 * MIN), status: 'completed' }, ...page1.slice(2)];
    const b = wfRow(a, page2, NOW);
    expect(b.seen).toBe(106);
    expect(b.d).toEqual([['2026-11-24', 3, 1]]);
    // a page that no longer reaches a day keeps that day’s count
    const c = wfRow(b, [gh(107, -2 * DAY)], NOW + 2 * DAY);
    expect(c.d).toEqual([['2026-11-24', 3, 1], ['2026-11-26', 1, 0]]);
  });

  it('its-bot’s dispatches: a cell per :15/:45 slot the pages cover, ok when a dispatch was created in its first 5 min (app: the bot), else none', () => {
    // NOW 03:20 UTC: the slot of 03:15 is ≥ 5 min old, so it is the newest
    const slot = Date.parse('2026-11-24T03:15:00Z');
    const health = [gh(9, NOW - slot - 20_000, { event: 'workflow_dispatch', login: 'island-fund-bot[bot]' }), gh(8, NOW - (slot - 28 * MIN)), gh(7, NOW - (slot - 60 * MIN) - 30_000, { event: 'workflow_dispatch' })];
    const pull = [gh(5, 3 * H)];
    const r = dispatchRow(undefined, [health, pull, []], NOW);
    // covered back to health's oldest (02:15:30): the 03:15, 02:45 slots (02:15 starts before it)
    expect(r.r).toEqual([{ t: slot, st: 'ok', c: 'app' }, { t: slot - 30 * MIN, st: 'fail', c: 'none' }]);
    expect(r.d).toEqual([['2026-11-24', 1, 1]]);
    // read again: nothing counted twice, an older slot kept
    const again = dispatchRow(r, [health.slice(0, 1), pull], NOW + 30 * MIN);
    expect(again.r[0]).toEqual({ t: slot + 30 * MIN, st: 'fail', c: 'none' });
    expect(again.d).toEqual([['2026-11-24', 1, 2]]);
  });

  it('the alert issues: open ones with an alert label or an Ops: title, no pull requests', () => {
    const at = iso(NOW - H);
    expect(alertsOf([
      { number: 3, title: 'Relay alert: no backup', created_at: at, labels: [{ name: 'alert' }] },
      { number: 4, title: 'Ops: places pull failing', created_at: at, labels: [] },
      { number: 5, title: 'A bug', created_at: at, labels: [{ name: 'bug' }] },
      { number: 6, title: 'Ops: a PR', created_at: at, labels: [], pull_request: {} }
    ])).toEqual([{ n: 3, title: 'Relay alert: no backup', label: 'alert', at: NOW - H }, { n: 4, title: 'Ops: places pull failing', label: 'ops', at: NOW - H }]);
    expect(alertsOf({ message: 'Bad credentials' })).toEqual([]);
  });
});

it('gym-bot’s checks: idle, ok, warn, fail by the programs’ outcomes, each counted once', () => {
  const s = { checks: [
    { t: NOW - 5 * MIN, ms: 900, r: { training: 'ok', pilates: 'timeout' } },
    { t: NOW - 20 * MIN, ms: 800, r: { training: 'http_5xx', pilates: 'http_5xx' } },
    { t: NOW - 35 * MIN, ms: 10, idle: true },
    { t: NOW - 50 * MIN, ms: 700, r: { training: 'ok', pilates: 'ok' } }
  ] };
  const r = gymRow(undefined, s, NOW);
  expect(r.r.map((x) => [x.st, x.c])).toEqual([['warn', 'timeout'], ['fail', 'http_5xx'], ['idle', undefined], ['ok', undefined]]);
  expect(r.d).toEqual([['2026-11-24', 1, 2]]);
  expect(gymRow(r, s, NOW).d).toEqual(r.d);
});

/** GitHub and gym-bot answering: each workflow's page, the issues, gym's status; `calls` the URLs asked. */
function fakeNet(o: { status?: number } = {}) {
  const calls: string[] = [];
  const f = vi.fn(async (u: string | URL | Request, init?: RequestInit) => {
    const url = String(u);
    calls.push(url);
    if (url.includes('/access_tokens')) return Response.json({ token: 'ghs_test', expires_at: iso(NOW + H) }, { status: 201 });
    expect((init?.headers as Record<string, string>).Authorization).toBe('Bearer ghs_test');
    if (o.status) return new Response('{}', { status: o.status });
    if (url.includes('/issues')) return Response.json([{ number: 9, title: 'Gym alert', created_at: iso(NOW - H), labels: [{ name: 'gym-alert' }] }]);
    return Response.json({ total_count: 1, workflow_runs: [gh(1, 10 * MIN)] });
  });
  return { f: f as unknown as typeof fetch, calls };
}

describe('the keeper', () => {
  function keeper(net = fakeNet(), app = true) {
    const kv = new Map<string, unknown>();
    const storage = { get: async (k: string) => kv.get(k), put: async (k: string, v: unknown) => void kv.set(k, structuredClone(v)) } as unknown as DurableObjectStorage;
    let now = NOW;
    const later: Promise<unknown>[] = [];
    // (a key made at once: the mint's JWT is ghApp.test's; the fetch answers any)
    const k = new JobsKeeper({
      storage, now: () => now, fetch: net.f, app: app ? { appId: '1', installationId: '2', key: PEM } : {},
      gym: async () => Response.json({ checks: [{ t: NOW - MIN, ms: 5, r: { training: 'ok' } }] }),
      nightlyAges: () => ({ ledgercheck: 9.3, tombprune: -1 }), syncedAt: () => NOW - 20 * MIN, waitUntil: (p) => void later.push(p)
    });
    return { k, kv, net, later, at: (t: number) => (now = t), settle: () => Promise.all(later.splice(0)) };
  }

  it('the tick keeps its outcomes in one key, then reads GitHub (the App’s token narrowed to actions: read) and gym-bot; again only 4 min on', async () => {
    forgetTokens();
    const t = keeper();
    await t.k.tick({ t: NOW, ms: 50, wx: { ok: true, fetched: true }, places: { ok: true } });
    await t.settle();
    expect([...t.kv.keys()].sort()).toEqual(['gh_token_jobs', KEY.ext, KEY.tick].sort());
    const mint = t.net.calls.find((u) => u.includes('/access_tokens'));
    expect(mint).toBeDefined();
    expect(t.net.calls.filter((u) => u.includes('/actions/workflows/'))).toHaveLength(WORKFLOWS.length);
    const body = parseJobs(JSON.parse(JSON.stringify(await t.k.read())))!;
    expect(body.jobs.map((j) => j.id)).toEqual(JOBS.map((j) => j.id));
    expect(body.ext).toEqual({ at: NOW, by: 'app', err: null });
    expect(body.alerts).toEqual([{ n: 9, title: 'Gym alert', label: 'gym-alert', at: NOW - H }]);
    const row = (id: string) => body.jobs.find((j) => j.id === id)!;
    expect(row('tick').runs).toEqual([{ t: NOW, st: 'ok', ms: 50 }]);
    expect(row('health').runs[0]).toMatchObject({ st: 'ok', id: 1 });
    expect(row('gym').runs).toEqual([{ t: NOW - MIN, st: 'ok', ms: 5 }]);
    expect(row('nightly').x).toEqual({ ledgercheck: 9.3, tombprune: -1 });
    expect(row('places-pull').x).toEqual({ syncedAt: NOW - 20 * MIN });
    // 3 min on: the tick doesn't ask GitHub again; 5 min on, a read does, behind its answer
    const n = t.net.calls.length;
    t.at(NOW + 3 * MIN);
    await t.k.tick({ t: NOW + 3 * MIN, ms: 50, wx: null, places: null });
    await t.settle();
    await t.k.read();
    await t.settle();
    expect(t.net.calls.length).toBe(n);
    t.at(NOW + 5 * MIN);
    const before = (await t.k.read()).ext.at;
    expect(before).toBe(NOW);
    await t.settle();
    expect(t.net.calls.length).toBeGreaterThan(n);
    expect((t.kv.get(KEY.ext) as Ext).at).toBe(NOW + 5 * MIN);
  });

  it('one refresh at a time; GitHub refusing keeps the old rows with its code; no App: no_token, GitHub never asked', async () => {
    forgetTokens();
    const t = keeper(fakeNet({ status: 403 }));
    await Promise.all([t.k.refresh(0), t.k.refresh(0)]);
    expect(t.net.calls.filter((u) => u.includes('/health.yml'))).toHaveLength(1);
    expect((t.kv.get(KEY.ext) as Ext)).toMatchObject({ err: 'gh_403', alerts: [] });
    expect((t.kv.get(KEY.ext) as Ext).rows.gym?.r).toHaveLength(1);
    const none = keeper(fakeNet(), false);
    await none.k.refresh(0);
    expect(none.net.calls).toEqual([]);
    expect((none.kv.get(KEY.ext) as Ext)).toMatchObject({ by: null, err: 'no_token' });
  });

  it('the nightly cell and the backup’s run', async () => {
    const t = keeper();
    await t.k.nightly({ ran: [], failed: [], left: [] }, NOW);
    expect(t.kv.has(KEY.nightly)).toBe(false);
    await t.k.nightly({ ran: ['tombprune'], failed: ['tombprune'], left: ['tombprune'] }, NOW);
    await t.k.backup({ ok: true, st: 'ok', botsBad: true, by: 'app' }, NOW - 1000);
    await t.k.backup({ ok: false, st: 'no_token', botsBad: false }, NOW);
    const body = await t.k.read();
    expect(body.jobs.find((j) => j.id === 'nightly')!.runs).toEqual([{ t: NOW, st: 'fail', ms: 0, c: 'tombprune' }]);
    expect(body.jobs.find((j) => j.id === 'backup')!.runs.map((r) => [r.st, r.c])).toEqual([['idle', 'no_token'], ['warn', 'bots']]);
  });
});

it('refreshExt with no gym binding reads GitHub only', async () => {
  const net = fakeNet();
  const e = await refreshExt(NO_EXT, { now: NOW, fetch: net.f, token: 'ghs_test' });
  expect(e.rows.gym).toBeUndefined();
  expect(e.rows.dispatch).toBeDefined();
  expect(jobsStatus({ ext: e, nightlyAges: {}, syncedAt: null, now: NOW }).jobs).toHaveLength(JOBS.length);
});

describe('GET /jobs', () => {
  const ORIGIN = 'https://island-fund.pages.dev';
  const route = (key: string | null, method = 'GET', origin = ORIGIN) => jobsRoute(
    new Request('https://relay/jobs', { method, headers: { Origin: origin, ...(key ? { Authorization: `Bearer ${key}` } : {}) } }),
    { allowed: ORIGIN, roleOf: (k) => (k === 'member' ? 'A' : k === 'guest' ? 'G' : null), read: async () => JSON.stringify({ ok: true }) }
  );
  it('a member’s and the guest’s key read it; none 401; another origin 403; a preflight; GET only', async () => {
    expect((await route('member')).status).toBe(200);
    const g = await route('guest');
    expect(g.status).toBe(200);
    expect(g.headers.get('Cache-Control')).toBe('private, no-store');
    expect(g.headers.get('Access-Control-Allow-Origin')).toBe(ORIGIN);
    expect((await route(null)).status).toBe(401);
    expect((await route('member', 'GET', 'https://evil.example')).status).toBe(403);
    expect((await route(null, 'OPTIONS')).status).toBe(204);
    expect((await route('member', 'POST')).status).toBe(405);
  });
});

// An RSA key (GitHub App keys are RSA, PKCS#8 PEM: ghApp.ts), made once for the mint's JWT.
const PEM = await (async () => {
  const k = (await crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify'])) as CryptoKeyPair;
  const der = new Uint8Array((await crypto.subtle.exportKey('pkcs8', k.privateKey)) as ArrayBuffer);
  return `-----BEGIN PRIVATE KEY-----\n${btoa(String.fromCharCode(...der)).replace(/(.{64})/g, '$1\n')}\n-----END PRIVATE KEY-----\n`;
})();
