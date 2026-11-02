// The guest (docs/backend.md#the-guest): a third key, KEY_C (who `G`). The record leaves every からだ row (weight, body
// fat, BMI, lean mass) and the weight goal out of the guest's snapshot and deltas, keeps the activity, the ベル's rows
// and the rest, and takes from the guest only its finds, tallies, the tent's decor and its own cosmetic prefs. The room
// carries three villagers: presence for each, the guest's intents to both members (never to a phone before v3), and
// refuses what the guest may not do.
import { beforeEach, describe, expect, it } from 'vitest';
import { StoreCore } from '../src/store.ts';
import { RoomCore, type Held, type Meta, type RoomIO } from '../src/room.ts';
import { keyOwner } from '../src/auth.ts';
import { notifySecret } from '../src/notify.ts';
import { pushRoute, type PushRoom } from '../src/pushRoute.ts';
import { CLOSE, type Notice, type ServerMsg } from '../../app/src/lib/sync/live-protocol.ts';
import { memSql } from './sqlite.ts';

const KEY_A = 'a'.repeat(64);
const KEY_B = 'b'.repeat(64);
const KEY_C = 'c'.repeat(64);
const T0 = Date.parse('2026-11-02T03:00:00.000Z'); // 12:00 Tokyo

describe('the guest key', () => {
  it('is the guest (G), and the notify secret stays the two members’ own', async () => {
    expect(keyOwner(KEY_C, { KEY_A, KEY_B, KEY_C })).toBe('G');
    expect(keyOwner(KEY_C, { KEY_A, KEY_B })).toBeNull();
    expect(await notifySecret({ KEY_A, KEY_B, KEY_C })).toBe(await notifySecret({ KEY_A, KEY_B }));
  });
});

describe('the record and the guest', () => {
  let now: number;
  let notices: Notice[];
  let store: StoreCore;
  beforeEach(() => {
    now = T0;
    notices = [];
    const db = memSql();
    store = new StoreCore({ sql: db.sql, tx: db.tx, keys: { KEY_A, KEY_B, KEY_C }, now: () => now, notify: (n) => notices.push(n) });
  });
  const call = (key: string, action: string, extra: object = {}) => store.handle({ key, action, ...extra }, 100) as Record<string, any>;
  const a = (action: string, extra: object = {}) => call(KEY_A, action, extra);
  const b = (action: string, extra: object = {}) => call(KEY_B, action, extra);
  const g = (action: string, extra: object = {}) => call(KEY_C, action, extra);
  const ev = (id: string, type: string, data: object) => ({ id, type, data });
  const tick = (ms = 1000) => (now += ms);

  /** A day of the members' data: activity, every からだ metric, a weight goal, goals, a buy, a void, a harvest. */
  function memberDay() {
    expect(a('ingest', {
      dates: 'Nov 1, 2026 at 7:11 AM', steps: '8564', exercise_minutes: '31', calories: '612', stand_minutes: '540',
      weight: '68.4', body_fat_percentage: '0.213', body_mass_index: '22.9', lean_body_mass: '53.8'
    })).toMatchObject({ ok: true, metrics: 8 });
    tick();
    expect(b('ingest', { dates: '2026年11月1日 7:55', steps: '9106', weight: '52.3', body_fat_percentage: '24.1' })).toMatchObject({ ok: true, metrics: 3 });
    tick();
    for (const [who, e] of [
      [a, ev('a1', 'pref', { key: 'goalWeight', value: 65 })],
      [b, ev('b1', 'pref', { key: 'goalWeight', value: 50, person: 'B' })],
      [a, ev('a2', 'pref', { key: 'moveGoal', value: 650 })],
      [b, ev('b2', 'pref', { key: 'stepsGoal', value: 9000, person: 'A' })],
      [a, ev('a3', 'spend', { spendId: 's1', item: 'snack', bells: 8 })],
      [b, ev('b3', 'spend_void', { spendId: 's1' })],
      [a, ev('a4', 'harvest', { week: '2026-10-26' })],
      [a, ev('a5', 'pref', { key: 'villagerName', value: 'ウェイ' })],
      [b, ev('b4', 'find', { kind: 'fish', id: 'sea-bass' })]
    ] as const) {
      expect(who('event', e), e.id).toMatchObject({ ok: true });
      tick();
    }
  }

  it('whoami answers G; the guest’s snapshot has the activity and the ベル’s rows, never a からだ row or the weight goal', () => {
    memberDay();
    expect(g('whoami')).toMatchObject({ ok: true, me: 'G' });
    const full = a('snapshot');
    const snap = g('snapshot');
    expect(snap).toMatchObject({ ok: true, me: 'G', rev: full.rev });
    const metrics = snap.rows.metrics as unknown[][];
    // the activity, both members', exactly as the members get it
    expect(metrics).toEqual((full.rows.metrics as unknown[][]).filter((r) => ['steps', 'exercise_min', 'move_kcal', 'stand_min'].includes(r[3] as string)));
    expect(metrics.map((r) => r[3]).sort()).toEqual(['exercise_min', 'move_kcal', 'stand_min', 'steps', 'steps']);
    // no からだ: no weight, body fat, BMI or lean mass anywhere in the reply, nor the weight goal
    const text = JSON.stringify(snap);
    for (const m of ['weight', 'body_fat_pct', 'bmi', 'lean_kg', 'goalWeight']) expect(text, m).not.toContain(m);
    for (const v of ['68.4', '52.3', '21.3', '22.9', '53.8', '24.1']) expect(text, v).not.toContain(v);
    // the events but the weight goals: the goals, the buy, its void, the harvest, a name, a find
    expect((snap.rows.events as unknown[][]).map((r) => r[2])).toEqual(['a2', 'b2', 'a3', 'b3', 'a4', 'a5', 'b4']);
    expect((full.rows.events as unknown[][]).map((r) => r[2])).toEqual(['a1', 'b1', 'a2', 'b2', 'a3', 'b3', 'a4', 'a5', 'b4']);
  });

  it('a delta (`since`) leaves them out too, the late ones included', () => {
    const since = g('snapshot').now;
    tick();
    memberDay();
    const d = g('snapshot', { since });
    expect(d.ok).toBe(true);
    expect((d.rows.metrics as unknown[][]).length).toBe(5);
    expect(JSON.stringify(d)).not.toMatch(/weight|body_fat_pct|bmi|lean_kg|goalWeight/);
  });

  it('takes the guest’s finds, tallies, tent decor and own cosmetic prefs, credited to G', () => {
    const tent = { sc: 't', id: 'dg1abc23', at: T0, item: 'f1234', x: 2, z: 3, f: 0, p: T0 };
    const r = g('events', { events: [
      ev('g1', 'find', { kind: 'bug', id: 'common-butterfly' }),
      ev('g2', 'tally', { date: '2026-11-02', counts: { 'bug:common-butterfly': 2 } }),
      ev('g3', 'decor', tent),
      ev('g4', 'pref', { key: 'villager', value: 'goldie' }),
      ev('g5', 'pref', { key: 'villagerName', value: 'ゆき' }),
      ev('g6', 'pref', { key: 'locale', value: 'en' })
    ] });
    expect(r.results.map((x: { ok: boolean }) => x.ok)).toEqual([true, true, true, true, true, true]);
    const rows = (a('snapshot').rows.events as unknown[][]).map((x) => [x[1], x[2], x[3]]);
    expect(rows).toEqual([['G', 'g1', 'find'], ['G', 'g2', 'tally'], ['G', 'g3', 'decor'], ['G', 'g4', 'pref'], ['G', 'g5', 'pref'], ['G', 'g6', 'pref']]);
    // the members hear of it (the push: their ずかん updates at once)
    expect(notices.at(-1)).toMatchObject({ what: 'event', who: 'G' });
    // a member's tally and the guest's of the same day are each their own row
    expect(a('event', ev('a9', 'tally', { date: '2026-11-02', counts: { 'bug:common-butterfly': 1 } })).ok).toBe(true);
    const tallies = (a('snapshot').rows.events as unknown[][]).filter((x) => x[3] === 'tally').map((x) => x[1]);
    expect(tallies).toEqual(['G', 'A']);
  });

  it('refuses everything else from the guest (forbidden), and keeps none of it', () => {
    memberDay();
    const before = a('snapshot').rows;
    expect(g('ingest', { dates: 'Nov 1, 2026', steps: '100' })).toEqual({ ok: false, error: 'forbidden' });
    expect(g('uploads')).toEqual({ ok: false, error: 'forbidden' });
    const refused = [
      ev('x1', 'spend', { spendId: 's2', item: 'dinner', bells: 15 }),
      ev('x2', 'spend_void', { spendId: 's1' }),
      ev('x3', 'harvest', { week: '2026-10-26' }),
      ev('x4', 'pref', { key: 'moveGoal', value: 500 }),
      ev('x5', 'pref', { key: 'stepsGoal', value: 8000, person: 'A' }),
      ev('x6', 'pref', { key: 'goalWeight', value: 60 }),
      ev('x7', 'pref', { key: 'villagerName', value: 'うめ', person: 'B' }),
      ev('x8', 'decor', { id: 'dabc1234', at: T0, item: 'tanuki', x: 100, z: 200, f: 0, p: T0 }),
      ev('x9', 'island', { date: '2026-11-02', taken: [], puts: [], shakes: [], watered: [], wishes: {} }),
      ev('x10', 'highfive', {})
    ];
    for (const e of refused) expect(g('event', e), e.id).toEqual({ ok: false, error: 'forbidden' });
    const batch = g('events', { events: refused.map((e) => ({ ...e, id: `${e.id}b` })) });
    expect(batch.results.every((x: { error?: string }) => x.error === 'forbidden')).toBe(true);
    expect(a('snapshot').rows).toEqual(before);
  });

  it('the export (every row) carries the guest’s rows with person G', async () => {
    g('event', ev('g1', 'find', { kind: 'fish', id: 'koi' }));
    const body = (await (store as unknown as { exportBody(f: boolean): Promise<{ body: string } | null> }).exportBody(true))!.body;
    const data = JSON.parse(JSON.parse(body).data);
    expect(data.rows.events.map((r: unknown[]) => [r[1], r[3]])).toEqual([['G', 'find']]);
  });
});

describe('push and the guest', () => {
  it('the guest’s key gets no notification and reports no goal (403)', async () => {
    const calls: string[] = [];
    const room: PushRoom = {
      pushSubscribe: () => void calls.push('sub'), pushUnsubscribe: () => void calls.push('unsub'),
      pushGoal: async () => (calls.push('goal'), { outcome: 'sent', sent: 1 })
    };
    const post = (path: string, body: object) => pushRoute(new Request(`https://x${path}`, { method: 'POST', headers: { Origin: 'https://huangwaylon.github.io' }, body: JSON.stringify(body) }), path, { KEY_A, KEY_B, KEY_C }, 'https://huangwaylon.github.io', () => room);
    const goal = await post('/push/goal', { key: KEY_C, date: '2026-11-02', both: false, name: 'ゆき' });
    expect(goal.status).toBe(403);
    const sub = await post('/push/subscribe', { key: KEY_C, sub: { endpoint: 'https://web.push.apple.com/x', keys: { p256dh: 'BA'.padEnd(87, 'A'), auth: 'A'.repeat(22) } }, lang: 'ja' });
    expect([400, 403]).toContain(sub.status);
    expect(calls).toEqual([]);
  });
});

class FakeSock {
  sent: ServerMsg[] = [];
  closed: { code?: number; reason?: string } | null = null;
  meta: Meta | null = null;
  send(d: string) {
    if (this.closed) throw new Error('closed');
    this.sent.push(JSON.parse(d));
  }
  close(code?: number, reason?: string) {
    this.closed = { code, reason };
  }
}

describe('the room with three villagers (v3)', () => {
  let now = 0;
  let socks: FakeSock[];
  let held: Held;
  let room: RoomCore<FakeSock>;
  const io = (): RoomIO<FakeSock> => ({
    sockets: () => socks.filter((s) => !s.closed),
    meta: (s) => s.meta,
    setMeta: (s, m) => void (s.meta = m),
    keys: { KEY_A, KEY_B, KEY_C },
    now: () => now,
    save: () => {},
    hold: (h) => void (held = structuredClone(h))
  });
  beforeEach(() => {
    now = Date.UTC(2026, 10, 2, 3);
    socks = [];
    held = {};
    room = new RoomCore(io());
  });
  const join = (key: string, v = 3) => {
    const s = new FakeSock();
    socks.push(s);
    room.open(s);
    room.message(s, JSON.stringify({ v, kind: 'hello', key, since: 0, batch: true }));
    return s;
  };
  const say = (s: FakeSock, m: object, v = 3) => room.message(s, JSON.stringify({ v, ...m }));
  const bye = (s: FakeSock) => {
    s.close();
    room.close(s);
  };
  const of = (s: FakeSock, kind: string) => s.sent.filter((m) => m.kind === kind);

  it('welcomes the guest as G with who is here; both members hear it come and go', () => {
    const a = join(KEY_A), b = join(KEY_B);
    expect(a.sent[0]).toMatchObject({ kind: 'welcome', me: 'A', peer: false, here: [] });
    const g = join(KEY_C);
    expect(g.sent[0]).toMatchObject({ v: 3, kind: 'welcome', me: 'G', peer: true, here: ['A', 'B'] });
    expect(of(a, 'presence').at(-1)).toMatchObject({ who: 'G', on: true });
    expect(of(b, 'presence').at(-1)).toMatchObject({ who: 'G', on: true });
    const b2 = join(KEY_B); // B again (another tab): replaces, no flicker
    expect(b2.sent[0]).toMatchObject({ me: 'B', peer: true, here: ['A', 'G'] });
    bye(g);
    expect(of(a, 'presence').at(-1)).toMatchObject({ who: 'G', on: false });
    expect(of(b2, 'presence').at(-1)).toMatchObject({ who: 'G', on: false });
  });

  it('the guest speaks v3 only; a v2 member’s phone never hears of it', () => {
    const old = join(KEY_C, 2);
    expect(old.closed?.code).toBe(CLOSE.version);
    const a2 = join(KEY_A, 2);
    const g = join(KEY_C);
    expect(g.sent[0]).toMatchObject({ peer: true, here: ['A'] });
    expect(of(a2, 'presence')).toEqual([]);
    say(g, { kind: 'walk', to: [100, 900], c: 5 });
    say(g, { kind: 'say', text: 'こんにちは' });
    expect(a2.sent.filter((m) => m.kind !== 'welcome')).toEqual([]);
    // nor in a replay
    const a2b = join(KEY_A, 2);
    expect(a2b.sent.filter((m) => m.kind === 'replay').flatMap((m) => (m as { es: { who: string }[] }).es).some((e) => e.who === 'G')).toBe(false);
  });

  it('the guest’s walks, catches, phrases and tent go to both members; theirs reach the guest', () => {
    const a = join(KEY_A), b = join(KEY_B), g = join(KEY_C);
    for (const s of [a, b, g]) s.sent = [];
    say(g, { kind: 'walk', to: [100, 900], from: [90, 1000], s: now, ms: 900, c: 1 });
    say(g, { kind: 'catch', what: 'fish:koi', id: 'fresh:123', how: 'rod', c: 2 });
    say(g, { kind: 'say', text: 'つれた！' });
    say(g, { kind: 'tent', in: true, to: [0, 10] });
    say(g, { kind: 'drag', id: 'dg1abc23', x: 1, z: 2, f: 0 });
    say(g, { kind: 'decor', sc: 't', id: 'dg1abc23', at: now, item: 'f1234', x: 2, z: 3, f: 0, p: now, c: 3 });
    for (const s of [a, b]) expect(s.sent.map((m) => m.kind)).toEqual(['walk', 'catch', 'say', 'tent', 'drag', 'decor']);
    expect(g.sent.map((m) => m.kind)).toEqual(['ack', 'ack', 'ack']);
    expect(a.sent.every((m) => (m as { who?: string }).who === 'G')).toBe(true);
    say(a, { kind: 'walk', to: [120, 300], c: 9 });
    expect(b.sent.at(-1)).toMatchObject({ kind: 'walk', who: 'A' });
    expect(g.sent.at(-1)).toMatchObject({ kind: 'walk', who: 'A' });
    // a claim is first-wins among all three
    say(a, { kind: 'catch', what: 'fish:koi', id: 'fresh:123', how: 'rod', c: 10 });
    expect(a.sent.at(-1)).toMatchObject({ kind: 'ack', c: 10, ok: false });
  });

  it('refuses what the guest may not do: the island’s decor, world ops, emotes, nudges', () => {
    const a = join(KEY_A), g = join(KEY_C);
    a.sent = [];
    say(g, { kind: 'decor', id: 'dabc1234', at: now, item: 'tanuki', x: 100, z: 200, f: 0, p: now, c: 1 });
    say(g, { kind: 'world', op: 'watered', id: 'fl:1:2', c: 2 });
    say(g, { kind: 'emote', emote: 'glee' });
    say(g, { kind: 'saved' });
    expect(a.sent).toEqual([]);
    expect(of(g, 'ack').map((m) => (m as { ok: boolean }).ok)).toEqual([false, false]);
  });

  it('a high-five goes to whose villager was tapped, and is held for them while they’re away', () => {
    const a = join(KEY_A), g = join(KEY_C);
    a.sent = [];
    say(g, { kind: 'highfive', at: now - 5, to: 'A', c: 1 });
    expect(of(a, 'highfive')).toEqual([{ v: 3, kind: 'highfive', at: now - 5, to: 'A', who: 'G', t: expect.any(Number) }]);
    say(g, { kind: 'highfive', at: now - 4, to: 'B', c: 2 }); // B away: held for B
    say(a, { kind: 'highfive', at: now - 3.5, c: 6 }); // and A's to B: each pair its own
    expect(held).toEqual({ 'G>B': { from: 'G', to: 'B', at: now - 4, t: expect.any(Number) }, 'A>B': { from: 'A', to: 'B', at: now - 3.5, t: expect.any(Number) } });
    const b = join(KEY_B);
    expect(of(b, 'highfive')).toMatchObject([{ v: 3, kind: 'highfive', at: now - 4, who: 'G', to: 'B' }, { at: now - 3.5, who: 'A', to: 'B' }]);
    say(b, { kind: 'got', at: now - 4 });
    expect(Object.keys(held)).toEqual(['A>B']);
    g.sent = [];
    say(a, { kind: 'highfive', at: now - 3, to: 'G', c: 3 });
    expect(of(g, 'highfive')).toMatchObject([{ who: 'A', to: 'G' }]);
    expect(of(b, 'highfive')).toHaveLength(2); // B only heard its own
    say(a, { kind: 'highfive', at: now - 2, c: 4 }); // no `to`: the partner, as before
    expect(of(b, 'highfive').at(-1)).toMatchObject({ who: 'A', at: now - 2 });
    say(g, { kind: 'highfive', at: now - 1, c: 5 }); // the guest's must say whom
    expect(g.sent.at(-1)).toMatchObject({ kind: 'ack', c: 5, ok: false });
  });

  it('a record change reaches the guest too; the guest’s own write only phones that know of it', () => {
    const a2 = join(KEY_A, 2), b = join(KEY_B), g = join(KEY_C);
    expect(room.notify({ what: 'ingest', who: 'A', at: '2026-11-02T03:00:00.000Z', rev: 'e1' })).toBe(3);
    expect(room.notify({ what: 'event', who: 'G', at: '2026-11-02T03:00:01.000Z', rev: 'e1' })).toBe(2);
    expect(of(a2, 'changed')).toHaveLength(1);
    expect(of(b, 'changed')).toHaveLength(2);
    expect(of(g, 'changed')).toHaveLength(2);
  });
});
