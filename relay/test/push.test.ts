import { beforeEach, describe, expect, it } from 'vitest';
import type { Who } from '../../app/src/lib/sync/live-protocol.ts';
import type { PushMsg } from '../../app/src/lib/sync/push-protocol.ts';
import { MAX_SUBS, PushCore, quiet, tokyo, type PushIO, type StoredSub } from '../src/push.ts';
import { isPushPath, pushRoute, type PushRoom } from '../src/pushRoute.ts';

const KEY_A = 'a1'.repeat(16);
const KEY_B = 'b2'.repeat(16);
const P256DH = 'BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4';
const AUTH = 'BTBZMqHH6r4Tts7J_aSIgg';
const sub = (n: number | string) => ({ endpoint: `https://web.push.apple.com/Q${n}`, p256dh: P256DH, auth: AUTH });

/** 2026-11-01 at `h`:00 Tokyo (UTC+9). */
const at = (h: number, day = 1) => Date.UTC(2026, 10, day, h - 9);

let now: number;
let rows: StoredSub[];
let sentOn: Partial<Record<Who, string>>;
let delivered: { to: string; msg: PushMsg }[];
let status: (s: StoredSub) => number;
let core: PushCore;

function io(): PushIO {
  return {
    subs: (who) => rows.filter((r) => r.who === who).map((r) => ({ ...r })),
    putSub: (s) => void rows.push({ ...s }),
    dropSub: (e, who) => void (rows = rows.filter((r) => !(r.endpoint === e && (!who || r.who === who)))),
    sentOn: (who) => sentOn[who] ?? null,
    setSentOn: (who, d) => void (sentOn[who] = d),
    async send(s, msg) {
      const st = status(s);
      if (st >= 200 && st < 300) delivered.push({ to: s.endpoint, msg });
      return st;
    },
    now: () => now
  };
}

beforeEach(() => {
  now = at(15);
  rows = [];
  sentOn = {};
  delivered = [];
  status = () => 201;
  core = new PushCore(io());
});

describe('Tokyo time', () => {
  it('dates and hours in Tokyo, quiet from 22:00 to 08:00', () => {
    expect(tokyo(at(15))).toEqual({ date: '2026-11-01', hour: 15 });
    expect(tokyo(at(0, 2))).toEqual({ date: '2026-11-02', hour: 0 });
    expect(tokyo(Date.UTC(2026, 10, 1, 15))).toEqual({ date: '2026-11-02', hour: 0 }); // 15:00 UTC = midnight in Tokyo
    expect([21, 22, 23, 0, 7, 8].map(quiet)).toEqual([false, true, true, true, true, false]);
  });
});

describe('goal pushes', () => {
  it("sends the partner's phones the goal notice, in each phone's language, and not my own", async () => {
    core.subscribe('A', sub(1), 'ja');
    core.subscribe('A', sub(2), 'en');
    core.subscribe('B', sub(3), 'ja');
    const r = await core.goal('B', { date: '2026-11-01', both: false, name: 'うめ' });
    expect(r).toEqual({ outcome: 'sent', sent: 2 });
    expect(delivered).toEqual([
      { to: sub(1).endpoint, msg: { v: 1, kind: 'goal', name: 'うめ', date: '2026-11-01', lang: 'ja' } },
      { to: sub(2).endpoint, msg: { v: 1, kind: 'goal', name: 'うめ', date: '2026-11-01', lang: 'en' } }
    ]);
  });

  it('says ふたりで ぜんぶ when the partner had met everything too', async () => {
    core.subscribe('B', sub(3), 'ja');
    await core.goal('A', { date: '2026-11-01', both: true, name: 'ウェイ' });
    expect(delivered[0].msg.kind).toBe('both');
  });

  it('pushes once a day per person; the next day again', async () => {
    core.subscribe('A', sub(1), 'ja');
    core.subscribe('B', sub(3), 'ja');
    expect((await core.goal('B', { date: '2026-11-01', both: false, name: 'うめ' })).outcome).toBe('sent');
    expect((await core.goal('B', { date: '2026-11-01', both: true, name: 'うめ' })).outcome).toBe('dup');
    expect((await core.goal('A', { date: '2026-11-01', both: true, name: 'ウェイ' })).outcome).toBe('sent'); // the other person's own day
    now = at(9, 2);
    expect((await core.goal('B', { date: '2026-11-02', both: false, name: 'うめ' })).outcome).toBe('sent');
    expect(delivered.map((d) => d.to)).toEqual([sub(1).endpoint, sub(3).endpoint, sub(1).endpoint]);
  });

  it('skips quiet hours (22:00–08:00 Tokyo) and does not deliver later', async () => {
    core.subscribe('A', sub(1), 'ja');
    for (const h of [22, 23]) {
      now = at(h);
      sentOn = {};
      expect((await core.goal('B', { date: '2026-11-01', both: false, name: 'うめ' })).outcome).toBe('quiet');
    }
    now = at(7, 2);
    expect((await core.goal('B', { date: '2026-11-02', both: false, name: 'うめ' })).outcome).toBe('quiet');
    now = at(9, 2);
    expect((await core.goal('B', { date: '2026-11-02', both: false, name: 'うめ' })).outcome).toBe('dup');
    expect(delivered).toEqual([]);
  });

  it("refuses a date that isn't today in Tokyo", async () => {
    core.subscribe('A', sub(1), 'ja');
    expect((await core.goal('B', { date: '2026-10-31', both: false, name: 'うめ' })).outcome).toBe('stale');
    expect((await core.goal('B', { date: '2026-11-02', both: false, name: 'うめ' })).outcome).toBe('stale');
    expect(sentOn).toEqual({});
  });

  it('is a no-op when the partner has no subscription (and spends the day)', async () => {
    expect(await core.goal('B', { date: '2026-11-01', both: false, name: 'うめ' })).toEqual({ outcome: 'none', sent: 0 });
    expect(sentOn.B).toBe('2026-11-01');
  });

  it('forgets subscriptions the push service says are gone (404, 410), keeps the rest', async () => {
    core.subscribe('A', sub(1), 'ja');
    core.subscribe('A', sub(2), 'ja');
    core.subscribe('A', sub(4), 'ja');
    status = (s) => (s.endpoint === sub(1).endpoint ? 410 : s.endpoint === sub(2).endpoint ? 404 : 201);
    expect(await core.goal('B', { date: '2026-11-01', both: false, name: 'うめ' })).toEqual({ outcome: 'sent', sent: 1 });
    expect(rows.map((r) => r.endpoint)).toEqual([sub(4).endpoint]);
  });

  it('every subscription gone: none; a push service down: failed, and the next report may try again', async () => {
    core.subscribe('A', sub(1), 'ja');
    status = () => 410;
    expect((await core.goal('B', { date: '2026-11-01', both: false, name: 'うめ' })).outcome).toBe('none');
    core.subscribe('A', sub(2), 'ja');
    sentOn = {};
    status = () => 503;
    expect((await core.goal('B', { date: '2026-11-01', both: false, name: 'うめ' })).outcome).toBe('failed');
    expect(rows).toHaveLength(1);
    status = () => 201;
    expect((await core.goal('B', { date: '2026-11-01', both: false, name: 'うめ' })).outcome).toBe('sent');
  });
});

describe('subscriptions', () => {
  it('re-subscribing an endpoint replaces it (and may move it to the other person)', () => {
    core.subscribe('A', sub(1), 'ja');
    core.subscribe('A', sub(1), 'en');
    expect(rows).toEqual([{ ...sub(1), who: 'A', lang: 'en', at: now }]);
    core.subscribe('B', sub(1), 'ja');
    expect(rows.map((r) => r.who)).toEqual(['B']);
  });

  it(`keeps the newest ${MAX_SUBS} per person`, () => {
    for (let i = 0; i < MAX_SUBS + 2; i++) {
      now += 1000;
      core.subscribe('A', sub(i), 'ja');
    }
    core.subscribe('B', sub('b'), 'ja');
    expect(rows.filter((r) => r.who === 'A').map((r) => r.endpoint)).toEqual([2, 3, 4, 5].map((i) => sub(i).endpoint));
    expect(rows.filter((r) => r.who === 'B')).toHaveLength(1);
  });

  it("unsubscribes only the person's own", () => {
    core.subscribe('A', sub(1), 'ja');
    core.unsubscribe('B', sub(1).endpoint);
    expect(rows).toHaveLength(1);
    core.unsubscribe('A', sub(1).endpoint);
    expect(rows).toHaveLength(0);
  });
});

describe('the /push/* endpoints', () => {
  const ORIGIN = 'https://huangwaylon.github.io';
  let calls: unknown[][];
  const room: PushRoom = {
    pushSubscribe: (...a) => void calls.push(['subscribe', ...a]),
    pushUnsubscribe: (...a) => void calls.push(['unsubscribe', ...a]),
    pushGoal: async (...a) => (calls.push(['goal', ...a]), { outcome: 'sent' as const, sent: 1 })
  };
  const keys = { KEY_A, KEY_B };
  const post = (path: string, body: unknown, origin: string | null = ORIGIN, method = 'POST') =>
    pushRoute(
      new Request(`https://relay.example${path}`, {
        method,
        headers: { 'Content-Type': 'text/plain;charset=utf-8', ...(origin ? { Origin: origin } : {}) },
        ...(method === 'POST' ? { body: typeof body === 'string' ? body : JSON.stringify(body) } : {})
      }),
      path,
      keys,
      ORIGIN,
      () => room
    );

  beforeEach(() => {
    calls = [];
  });

  it('knows its paths', () => {
    expect(['/push/subscribe', '/push/unsubscribe', '/push/goal'].every(isPushPath)).toBe(true);
    expect(isPushPath('/push')).toBe(false);
  });

  it('subscribes with the key owner, the subscription as PushSubscription.toJSON() gives it, and CORS for the page', async () => {
    const res = await post('/push/subscribe', { key: KEY_B, sub: { endpoint: sub(1).endpoint, expirationTime: null, keys: { p256dh: P256DH, auth: AUTH } }, lang: 'ja' });
    expect(res.status).toBe(200);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe(ORIGIN);
    expect(await res.json()).toEqual({ ok: true });
    expect(calls).toEqual([['subscribe', 'B', sub(1), 'ja']]);
  });

  it('reports a goal and answers with the outcome', async () => {
    const res = await post('/push/goal', { key: KEY_A, date: '2026-11-01', both: true, name: 'ウェイ' });
    expect(await res.json()).toEqual({ ok: true, outcome: 'sent', sent: 1 });
    expect(calls).toEqual([['goal', 'A', { date: '2026-11-01', both: true, name: 'ウェイ' }]]);
  });

  it('unsubscribes', async () => {
    expect((await post('/push/unsubscribe', { key: KEY_A, endpoint: sub(1).endpoint })).status).toBe(200);
    expect(calls).toEqual([['unsubscribe', 'A', sub(1).endpoint]]);
  });

  it('refuses an unknown key (401), a bad body (400), a big one (413), another site or no origin (403), a GET (405)', async () => {
    expect((await post('/push/goal', { key: 'c3'.repeat(16), date: '2026-11-01', both: false, name: 'x' })).status).toBe(401);
    expect((await post('/push/goal', { key: KEY_A, date: 'today', both: false, name: 'x' })).status).toBe(400);
    expect((await post('/push/goal', { key: KEY_A, date: '2026-11-01', both: false, name: '' })).status).toBe(400);
    expect((await post('/push/goal', { key: KEY_A, date: '2026-11-01', both: false, name: 'a\u0000b' })).status).toBe(400);
    expect((await post('/push/goal', 'not json')).status).toBe(400);
    expect((await post('/push/subscribe', { key: KEY_A, sub: { ...sub(1), endpoint: 'https://evil.example/x' }, lang: 'ja' })).status).toBe(400);
    expect((await post('/push/subscribe', { key: KEY_A, sub: { ...sub(1), endpoint: 'http://web.push.apple.com/x' }, lang: 'ja' })).status).toBe(400);
    expect((await post('/push/subscribe', { key: KEY_A, sub: sub(1), lang: 'fr' })).status).toBe(400);
    expect((await post('/push/goal', { key: KEY_A, pad: 'x'.repeat(3000) })).status).toBe(413);
    expect((await post('/push/goal', { key: KEY_A, date: '2026-11-01', both: false, name: 'x' }, 'https://evil.example')).status).toBe(403);
    expect((await post('/push/goal', { key: KEY_A, date: '2026-11-01', both: false, name: 'x' }, null)).status).toBe(403);
    expect((await post('/push/goal', null, ORIGIN, 'GET')).status).toBe(405);
    expect(calls).toEqual([]);
  });

  it('answers a preflight for the page origin', async () => {
    const res = await post('/push/goal', null, 'http://localhost:5173', 'OPTIONS');
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:5173');
  });
});
