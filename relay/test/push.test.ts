// やること's reminders on the record (src/pusher.ts, src/remind.ts, src/pushRoute.ts; docs/todo.md "Reminders"): the
// phones' subscriptions (checks, moves, the cap, presence), the test push, and the schedule on a fake clock against a
// fake push service that verifies the VAPID JWT and decrypts each message as the phone would: a reminder sent once at
// its minute, to each of its people's phones; nothing for one done, removed or re-dated before; the new time after an
// edit; late past 10 min skipped and said; a 404/410 drops the phone; a 5xx tried again, never past the window.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StoreCore } from '../src/store.ts';
import { Pusher, type PushAnswer, type PushLine } from '../src/pusher.ts';
import { pushRoute, isPushPath } from '../src/pushRoute.ts';
import { payloadOf, remindersOf, whenOf } from '../src/remind.ts';
import { fireAt } from '../../app/src/lib/contract/todoDue.ts';
import { memSql } from './sqlite.ts';
import { fakePushService, phoneKeys, vapidPair, type Phone } from '../../its/worker/test/pushKit.ts';
import type { Vapid } from '../../its/worker/src/webpush.ts';

const KEY_A = 'a'.repeat(64);
const KEY_B = 'b'.repeat(64);
const KEY_C = 'c'.repeat(64);
const keyOf = { A: KEY_A, B: KEY_B, G: KEY_C } as const;
type W = 'A' | 'B' | 'G';
const tokyo = (s: string) => Date.parse(`${s}+09:00`);
const T0 = tokyo('2026-11-24T08:00');
const HOST = 'https://web.push.apple.com';

describe('the reminder’s text', () => {
  it('when, from the minute it fires, in each language', () => {
    expect(whenOf('2026-11-24T15:00', 'at', tokyo('2026-11-24T15:00'), 'ja')).toBe('今日 15:00');
    expect(whenOf('2026-11-24T15:00', 'b10', tokyo('2026-11-24T14:50'), 'ja')).toBe('15:00（10分後）');
    expect(whenOf('2026-11-24T00:30', 'b60', tokyo('2026-11-23T23:30'), 'ja')).toBe('明日 0:30');
    expect(whenOf('2026-11-24T09:30', 'eve', tokyo('2026-11-23T20:00'), 'ja')).toBe('明日 9:30');
    expect(whenOf('2026-11-24', 'eve', tokyo('2026-11-23T20:00'), 'ja')).toBe('明日');
    expect(whenOf('2026-11-24', 'am', tokyo('2026-11-24T08:00'), 'ja')).toBe('今日');
    expect(whenOf('2026-11-24T09:05', 'b60', tokyo('2026-11-24T08:05'), 'en')).toBe('9:05 (in 1 h)');
    expect(whenOf('2026-11-24', 'eve', tokyo('2026-11-23T20:00'), 'en')).toBe('Tomorrow');
    // (a due long past, read at its minute anyway: the date)
    expect(whenOf('2026-11-24', 'am', tokyo('2026-11-26T08:00'), 'ja')).toBe('11/24（火）');
  });

  it('the payload: the item’s text (cut at 80), {when} · {list}, the item’s tag and where a tap goes', () => {
    const [r] = remindersOf([{ id: 'dl', title: '家のこと', ord: 0, items: [{ id: 'di', text: 'x'.repeat(90), ord: 0, done: false, due: '2026-11-24T09:30', rem: 'eve', to: ['A'] }] }]);
    expect(payloadOf(r, 'ja')).toEqual({ v: 1, kind: 'todo', title: `${'x'.repeat(79)}…`, body: '明日 9:30 · 家のこと', tag: 'di', open: { to: 'todo', list: 'dl', item: 'di' } });
    expect(remindersOf([{ id: 'dl', title: 'L', ord: 0, items: [{ id: 'd1', text: 'a', ord: 0, done: true, due: '2026-11-24', rem: 'am', to: ['A'] }, { id: 'd2', text: 'b', ord: 0, done: false, due: '2026-11-24' }] }])).toEqual([]);
  });
});

describe('the pusher', () => {
  let now: number;
  let db: ReturnType<typeof memSql>;
  let store: StoreCore;
  let pusher: Pusher;
  let vapid: Vapid;
  let lines: [number, PushLine][];
  let phones: Phone[];
  let answer: (endpoint: string) => Response;
  let svc: ReturnType<typeof fakePushService>;
  let n = 0;

  const make = (v: Vapid | null = vapid) => new Pusher({
    sql: db.sql, now: () => now, vapid: v, deps: () => ({ hosts: ['web.push.apple.com'], fetch: svc.fetch }),
    todos: () => store.todoLists(), log: (l, d) => lines.push([l, d])
  });
  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    now = T0;
    vi.setSystemTime(now);
    db = memSql();
    store = new StoreCore({ sql: db.sql, tx: db.tx, keys: { KEY_A, KEY_B, KEY_C }, now: () => now, notify: () => {} });
    vapid = await vapidPair();
    lines = [];
    phones = [];
    answer = () => new Response(null, { status: 201 });
    svc = fakePushService(vapid.publicKey, phones, (e) => answer(e));
    pusher = make();
  });
  const clock = (t: number) => {
    now = t;
    vi.setSystemTime(t);
  };
  const phone = async (who: W, name = who) => {
    const p = { ...(await phoneKeys()), endpoint: `${HOST}/3/device/${name}${++n}` };
    phones.push(p);
    expect(await pusher.subscribe(who, { endpoint: p.endpoint, keys: { p256dh: p.p256dh, auth: p.auth }, lang: 'ja' })).toMatchObject({ ok: true, push: { on: true } });
    return p;
  };
  const send = (who: W, data: object) => store.handle({ key: keyOf[who], action: 'event', id: `e${++n}`, type: 'todo', data }, 100) as Record<string, unknown>;
  const list = () => send('A', { id: 'dlist01', at: now, title: '家のこと', ord: 0 });
  const item = (extra: object, who: W = 'A', id = 'ditem01') => send(who, { id, at: now + ++n, list: 'dlist01', text: '歯医者', ord: 0, done: 0, ...extra });
  const tick = async (t: number) => {
    clock(t);
    return pusher.tick(t);
  };
  const delivered = () => svc.delivered.map((d) => [d.endpoint.replace(/^.*\//, ''), (d.message as { body: string }).body]);

  it('subscribe: push off, a bad endpoint, keys or lang refused; an endpoint moves to whoever subscribes it; 5 a person', async () => {
    const k = await phoneKeys();
    const sub = (who: W, x: object = {}) => pusher.subscribe(who, { endpoint: `${HOST}/3/device/x`, keys: { p256dh: k.p256dh, auth: k.auth }, lang: 'ja', ...x });
    expect(await make(null).subscribe('A', { endpoint: `${HOST}/x`, keys: { p256dh: k.p256dh, auth: k.auth }, lang: 'ja' })).toEqual({ ok: false, status: 503, error: 'push_off' });
    for (const endpoint of ['http://web.push.apple.com/x', 'https://evil.example/x', 'https://web.push.apple.com:8443/x', 'https://u:p@web.push.apple.com/x', 5])
      expect(await sub('A', { endpoint }), String(endpoint)).toMatchObject({ ok: false, status: 400, error: 'bad_push_endpoint' });
    expect(await sub('A', { keys: { p256dh: k.p256dh, auth: 'short' } })).toMatchObject({ error: 'bad_push_keys' });
    expect(await sub('A', { keys: undefined })).toMatchObject({ error: 'bad_push_keys' });
    expect(await sub('A', { lang: 'fr' })).toMatchObject({ error: 'bad_push_lang' });
    expect(await sub('A')).toEqual({ ok: true, push: { vapidPublic: vapid.publicKey, on: true, subs: { A: true, B: false, G: false } } });
    expect(await sub('G')).toEqual({ ok: true, push: { vapidPublic: vapid.publicKey, on: true, subs: { A: false, B: false, G: true } } });
    expect(lines.at(-1)).toEqual([1, { op: 'subscribe', who: 'G', ep: expect.stringMatching(/^[0-9a-f]{6}$/), lang: 'ja', moved: true, replaced: 0 }]);
    // the state: `on` only for the caller's own endpoint
    expect(await pusher.state('A', `${HOST}/3/device/x`)).toMatchObject({ ok: true, push: { on: false } });
    expect(await pusher.state('G')).toMatchObject({ ok: true, push: { on: false, subs: { G: true } } });
    // a sixth of a person's replaces their least recently refreshed
    const bs: Phone[] = [];
    for (let i = 0; i < 6; i++) {
      clock(now + 1000);
      bs.push(await phone('B'));
    }
    expect((await pusher.state('B', bs[0].endpoint)).ok && (await pusher.state('B', bs[0].endpoint) as { push: { on: boolean } }).push.on).toBe(false);
    expect(lines.at(-1)?.[1]).toMatchObject({ replaced: 1 });
    // 30 days unrefreshed: gone from presence
    clock(now + 31 * 86_400_000);
    expect(pusher.presence()).toEqual({ A: false, B: false, G: false });
  });

  it('unsubscribe forgets only the caller’s own; test: its own only, 5 s apart, a gone phone dropped', async () => {
    const a = await phone('A');
    expect(await pusher.unsubscribe('B', a.endpoint)).toMatchObject({ ok: true, push: { subs: { A: true } } });
    expect(await pusher.test('B', a.endpoint)).toEqual({ ok: false, status: 404, error: 'not_subscribed' });
    expect(await pusher.test('A', a.endpoint)).toMatchObject({ ok: true });
    expect(svc.delivered.at(-1)?.message).toMatchObject({ v: 1, kind: 'test', title: 'テスト通知', tag: 'todo-test', open: { to: 'todo' } });
    expect(svc.delivered.at(-1)?.urgency).toBe('high');
    expect(await pusher.test('A', a.endpoint)).toEqual({ ok: false, status: 429, error: 'rate_limited' });
    clock(now + 5000);
    answer = () => new Response(null, { status: 410 });
    expect(await pusher.test('A', a.endpoint)).toEqual({ ok: false, status: 502, error: 'push_failed' });
    expect(pusher.presence().A).toBe(false);
    const b = await phone('B');
    expect(await pusher.unsubscribe('B', b.endpoint)).toMatchObject({ ok: true, push: { on: false, subs: { B: false } } });
    expect(await make(null).test('B', b.endpoint)).toEqual({ ok: false, status: 503, error: 'push_off' });
  });

  it('a reminder fires once at its minute, to each phone of each of its people; nothing for no subscription, no reminder', async () => {
    list();
    item({ due: '2026-11-24T15:00', rem: 'b10', to: ['A', 'G'] });
    item({ due: '2026-11-24T16:00' }, 'A', 'ditem02');
    expect(pusher.next()).toBeNull(); // no phone yet
    await phone('A');
    await phone('A');
    await phone('G');
    await phone('B');
    const fire = fireAt('2026-11-24T15:00', 'b10')!;
    expect(pusher.next()).toBe(fire);
    expect(await tick(fire - 60_000)).toEqual({ sent: 0, failed: 0 });
    expect(await tick(fire)).toEqual({ sent: 3, failed: 0 });
    expect(delivered().map((d) => d[1])).toEqual(['15:00（10分後） · 家のこと', '15:00（10分後） · 家のこと', '15:00（10分後） · 家のこと']);
    expect(delivered().map((d) => d[0].replace(/\d+$/, '')).sort()).toEqual(['A', 'A', 'G']);
    expect(svc.delivered[0].message).toMatchObject({ kind: 'todo', title: '歯医者', tag: 'ditem01', open: { to: 'todo', list: 'dlist01', item: 'ditem01' } });
    expect(lines.filter((l) => l[1].op === 'send')).toHaveLength(3);
    expect(JSON.stringify(lines)).not.toContain('歯医者');
    expect(JSON.stringify(lines)).not.toContain('web.push');
    // the ledger: a re-arm or another tick never sends it again
    expect(pusher.next()).toBeNull();
    expect(await tick(fire + 1000)).toEqual({ sent: 0, failed: 0 });
  });

  it('re-read at its minute: done, removed or re-dated before it, nothing then; an edited time fires again at the new one', async () => {
    list();
    await phone('A');
    const f1 = fireAt('2026-11-24T10:00', 'at')!;
    item({ due: '2026-11-24T10:00', rem: 'at', to: ['A'] });
    item({ due: '2026-11-24T10:00', rem: 'at', to: ['A'], done: 1 });
    expect(pusher.next()).toBeNull();
    expect(await tick(f1)).toEqual({ sent: 0, failed: 0 });
    // re-dated: the new minute only
    item({ due: '2026-11-24T11:00', rem: 'at', to: ['A'] });
    const f2 = fireAt('2026-11-24T11:00', 'at')!;
    expect(pusher.next()).toBe(f2);
    expect(await tick(f2)).toMatchObject({ sent: 1 });
    // sent, then the time edited later: it fires again at the new time
    item({ due: '2026-11-24T12:00', rem: 'at', to: ['A'] });
    const f3 = fireAt('2026-11-24T12:00', 'at')!;
    expect(pusher.next()).toBe(f3);
    // removed before it
    send('A', { id: 'ditem01', at: now + 99_999, rm: true });
    expect(pusher.next()).toBeNull();
    expect(await tick(f3)).toEqual({ sent: 0, failed: 0 });
    // the reminder addressed to someone else: not this phone
    item({ due: '2026-11-24T13:00', rem: 'at', to: ['B'] }, 'A', 'ditem03');
    expect(pusher.next()).toBeNull();
    expect(svc.delivered).toHaveLength(1);
  });

  it('more than 10 min late: skipped, said once; an op that came 5 min late still fires', async () => {
    list();
    await phone('A');
    const f = fireAt('2026-11-24T10:00', 'at')!;
    item({ due: '2026-11-24T10:00', rem: 'at', to: ['A'] });
    expect(await tick(f + 11 * 60_000)).toEqual({ sent: 0, failed: 0 });
    expect(lines.at(-1)).toEqual([2, { op: 'skip', code: 'late', who: 'A', ep: expect.any(String), rem: 'at', lateS: 660 }]);
    const said = lines.length;
    await tick(f + 12 * 60_000);
    expect(lines.length).toBe(said);
    // a reminder whose minute is 5 min past when it arrives (a queued op): sent at once
    clock(fireAt('2026-11-24T11:00', 'at')! + 5 * 60_000);
    item({ due: '2026-11-24T11:00', rem: 'at', to: ['A'] }, 'A', 'ditem02');
    expect(pusher.next()).toBe(fireAt('2026-11-24T11:00', 'at'));
    expect(await tick(now)).toMatchObject({ sent: 1 });
    // a reminder set on a time long past: nothing, no line (before the phone? never said)
    item({ due: '2026-11-20T11:00', rem: 'at', to: ['A'] }, 'A', 'ditem03');
    expect(pusher.next()).toBeNull();
  });

  it('a 404/410 drops the phone; a 5xx tried again 30 s later, then 60 s, never past 10 min; a 403 not retried', async () => {
    list();
    const a1 = await phone('A');
    await phone('B');
    item({ due: '2026-11-24T10:00', rem: 'at', to: ['A', 'B'] });
    const f = fireAt('2026-11-24T10:00', 'at')!;
    answer = (e) => new Response(null, { status: e === a1.endpoint ? 410 : 503 });
    expect(await tick(f)).toEqual({ sent: 0, failed: 2 });
    expect(pusher.presence()).toEqual({ A: false, B: true, G: false });
    expect(lines.filter((l) => l[1].op === 'drop')).toHaveLength(1);
    expect(pusher.next()).toBe(f + 30_000);
    expect(await tick(f + 30_000)).toEqual({ sent: 0, failed: 1 });
    expect(pusher.next()).toBe(f + 90_000);
    answer = () => new Response(null, { status: 201 });
    expect(await tick(f + 90_000)).toEqual({ sent: 1, failed: 0 });
    expect(pusher.next()).toBeNull();
    // always 503: given up once the next try would be past the window
    item({ due: '2026-11-24T11:00', rem: 'at', to: ['B'] }, 'A', 'ditem02');
    const g = fireAt('2026-11-24T11:00', 'at')!;
    answer = () => new Response(null, { status: 503 });
    let t = g, tries = 0;
    while (pusher.next() !== null && tries < 20) {
      t = pusher.next()!;
      await tick(t);
      tries++;
    }
    expect(t - g).toBeLessThanOrEqual(600_000);
    expect(lines.at(-1)?.[1]).toMatchObject({ op: 'send', code: 'expired' });
    // a 403 (the VAPID key refused): an error line, not retried
    item({ due: '2026-11-24T12:00', rem: 'at', to: ['B'] }, 'A', 'ditem03');
    answer = () => new Response('{"reason":"BadJwtToken"}', { status: 403 });
    await tick(fireAt('2026-11-24T12:00', 'at')!);
    expect(lines.at(-1)).toEqual([3, expect.objectContaining({ op: 'send', code: 'config', status: 403, reason: 'BadJwtToken' })]);
    expect(pusher.next()).toBeNull();
  });

  it('push off: nothing scheduled', async () => {
    list();
    await phone('A');
    item({ due: '2026-11-24T10:00', rem: 'at', to: ['A'] });
    expect(make(null).next()).toBeNull();
  });
});

describe('the push routes', () => {
  const ORIGIN = 'https://island-fund.pages.dev';
  const OK: PushAnswer = { ok: true, push: { vapidPublic: null, on: false, subs: { A: false, B: false, G: false } } };
  const env = (op = vi.fn(async (): Promise<PushAnswer> => OK)) => ({ allowed: ORIGIN, roleOf: (k: string) => (k === KEY_C ? ('G' as const) : null), op });
  const req = (path: string, init: RequestInit & { key?: string } = {}) => new Request(`https://relay${path}`, {
    method: 'POST', ...init, headers: { Origin: ORIGIN, ...(init.key ? { Authorization: `Bearer ${init.key}` } : {}), ...(init.headers as object) }
  });

  it('routes the four paths; any key (the guest’s here); CORS; the object’s answer as the reply', async () => {
    expect(['/api/push', '/api/push/subscribe', '/api/push/unsubscribe', '/api/push/test'].every(isPushPath)).toBe(true);
    expect(isPushPath('/api/push/nope')).toBe(false);
    const e = env();
    const r = await pushRoute(req('/api/push/subscribe', { key: KEY_C, body: '{"endpoint":"x"}' }), '/api/push/subscribe', e);
    expect([r.status, r.headers.get('Access-Control-Allow-Origin'), await r.json()]).toEqual([200, ORIGIN, { ok: true, push: { vapidPublic: null, on: false, subs: { A: false, B: false, G: false } } }]);
    expect(e.op).toHaveBeenCalledWith('subscribe', 'G', { endpoint: 'x' });
    const refused = env(vi.fn(async (): Promise<PushAnswer> => ({ ok: false, status: 429, error: 'rate_limited' })));
    const r2 = await pushRoute(req('/api/push/test', { key: KEY_C, body: '{}' }), '/api/push/test', refused);
    expect([r2.status, await r2.json()]).toEqual([429, { ok: false, error: 'rate_limited' }]);
  });

  it('refuses: another origin, a preflight answered, no key, not JSON, too big, an object’s failure', async () => {
    expect((await pushRoute(req('/api/push', { headers: { Origin: 'https://evil.example' }, key: KEY_C, body: '{}' }), '/api/push', env())).status).toBe(403);
    expect((await pushRoute(req('/api/push', { method: 'OPTIONS' }), '/api/push', env())).status).toBe(204);
    expect((await pushRoute(req('/api/push', { method: 'GET' }), '/api/push', env())).status).toBe(405);
    expect((await pushRoute(req('/api/push', { key: KEY_A, body: '{}' }), '/api/push', env())).status).toBe(401);
    expect((await pushRoute(req('/api/push', { key: KEY_C, body: 'nope' }), '/api/push', env())).status).toBe(400);
    expect((await pushRoute(req('/api/push', { key: KEY_C, body: '[1]' }), '/api/push', env())).status).toBe(400);
    expect((await pushRoute(req('/api/push', { key: KEY_C, body: JSON.stringify({ x: 'y'.repeat(5000) }) }), '/api/push', env())).status).toBe(413);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const r = await pushRoute(req('/api/push', { key: KEY_C, body: '{}' }), '/api/push', env(vi.fn(async (): Promise<PushAnswer> => { throw new TypeError('reset'); })));
    expect([r.status, await r.json()]).toEqual([503, { ok: false, error: 'unavailable' }]);
  });
});
