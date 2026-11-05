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
import { CLOSE, type Notice, type ServerMsg } from '../../app/src/lib/contract/live-protocol.ts';
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

  /** A day of the members' data: activity, every からだ metric, the weight and body fat goals, goals, a buy, a void, a harvest. */
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
      [a, ev('a6', 'pref', { key: 'goalBodyFat', value: 18.5 })],
      [b, ev('b5', 'pref', { key: 'goalBodyFat', value: 23, person: 'B' })],
      [a, ev('a2', 'pref', { key: 'moveGoal', value: 650 })],
      [b, ev('b2', 'pref', { key: 'stepsGoal', value: 9000, person: 'A' })],
      [a, ev('a3', 'spend', { spendId: 's1', item: 'snack', bells: 40 })],
      [b, ev('b3', 'spend_void', { spendId: 's1' })],
      [a, ev('a4', 'harvest', { week: '2026-10-26' })],
      [a, ev('a5', 'pref', { key: 'villagerName', value: 'ウェイ' })],
      [b, ev('b4', 'find', { kind: 'fish', id: 'sea-bass' })],
      [a, ev('a7', 'pref', { key: 'goalBmi', value: 23.4 })],
      [b, ev('b6', 'pref', { key: 'goalLean', value: 41.2, person: 'B' })],
      [a, ev('a8', 'pref', { key: 'exerciseGoal', value: 45 })],
      [b, ev('b7', 'pref', { key: 'standGoal', value: 150, person: 'A' })]
    ] as const) {
      expect(who('event', e), e.id).toMatchObject({ ok: true });
      tick();
    }
  }

  it('whoami answers G; the guest’s snapshot has the activity and the ベル’s rows, never a からだ row or a からだ goal', () => {
    memberDay();
    expect(g('whoami')).toMatchObject({ ok: true, me: 'G' });
    const full = a('snapshot');
    const snap = g('snapshot');
    expect(snap).toMatchObject({ ok: true, me: 'G', rev: full.rev });
    const metrics = snap.rows.metrics as unknown[][];
    // the activity, both members', exactly as the members get it
    expect(metrics).toEqual((full.rows.metrics as unknown[][]).filter((r) => ['steps', 'exercise_min', 'move_kcal', 'stand_min'].includes(r[3] as string)));
    expect(metrics.map((r) => r[3]).sort()).toEqual(['exercise_min', 'move_kcal', 'stand_min', 'steps', 'steps']);
    // no からだ: no weight, body fat, BMI or lean mass anywhere in the reply, nor the weight or body fat goal
    const text = JSON.stringify(snap);
    for (const m of ['weight', 'body_fat_pct', 'bmi', 'lean_kg', 'goalWeight', 'goalBodyFat', 'goalBmi', 'goalLean']) expect(text, m).not.toContain(m);
    for (const v of ['68.4', '52.3', '21.3', '22.9', '53.8', '24.1', '18.5', '23.4', '41.2']) expect(text, v).not.toContain(v);
    // the events but the からだ goals: the activity goals, the buy, its void, the harvest, a name, a find
    expect((snap.rows.events as unknown[][]).map((r) => r[2])).toEqual(['a2', 'b2', 'a3', 'b3', 'a4', 'a5', 'b4', 'a8', 'b7']);
    expect((full.rows.events as unknown[][]).map((r) => r[2])).toEqual(['a1', 'b1', 'a6', 'b5', 'a2', 'b2', 'a3', 'b3', 'a4', 'a5', 'b4', 'a7', 'b6', 'a8', 'b7']);
  });

  it('a delta (`since`) leaves them out too, the late ones included', () => {
    const since = g('snapshot').now;
    tick();
    memberDay();
    const d = g('snapshot', { since });
    expect(d.ok).toBe(true);
    expect((d.rows.metrics as unknown[][]).length).toBe(5);
    expect(JSON.stringify(d)).not.toMatch(/weight|body_fat_pct|bmi|lean_kg|goalWeight|goalBodyFat|goalBmi|goalLean/);
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
      ev('x1', 'spend', { spendId: 's2', item: 'dinner', bells: 70 }),
      ev('x2', 'spend_void', { spendId: 's1' }),
      ev('x3', 'harvest', { week: '2026-10-26' }),
      ev('x4', 'pref', { key: 'moveGoal', value: 500 }),
      ev('x5', 'pref', { key: 'stepsGoal', value: 8000, person: 'A' }),
      ev('x6', 'pref', { key: 'goalWeight', value: 60 }),
      ev('x6f', 'pref', { key: 'goalBodyFat', value: 20 }),
      ev('x6b', 'pref', { key: 'goalBmi', value: 22 }),
      ev('x6l', 'pref', { key: 'goalLean', value: 50 }),
      ev('x6e', 'pref', { key: 'exerciseGoal', value: 30 }),
      ev('x6s', 'pref', { key: 'standGoal', value: 100, person: 'A' }),
      ev('x7', 'pref', { key: 'villagerName', value: 'うめ', person: 'B' }),
      ev('x7w', 'pref', { key: 'weatherMode', value: 'game' }), // the island's weather: the members'
      ev('x8', 'decor', { id: 'dabc1234', at: T0, item: 'tanuki', x: 100, z: 200, f: 0, p: T0 }),
      ev('x9', 'island', { date: '2026-11-02', taken: [], puts: [], shakes: [], watered: [], wishes: {} })
    ];
    for (const e of refused) expect(g('event', e), e.id).toEqual({ ok: false, error: 'forbidden' });
    const batch = g('events', { events: refused.map((e) => ({ ...e, id: `${e.id}b` })) });
    expect(batch.results.every((x: { error?: string }) => x.error === 'forbidden')).toBe(true);
    expect(a('snapshot').rows).toEqual(before);
  });

  it('the dump (every row) carries the guest’s rows with person G', () => {
    g('event', ev('g1', 'find', { kind: 'fish', id: 'koi' }));
    expect(store.dump().rows.events.map((r) => [r[1], r[3]])).toEqual([['G', 'find']]);
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
  const join = (key: string) => {
    const s = new FakeSock();
    socks.push(s);
    room.open(s);
    room.message(s, JSON.stringify({ v: 3, kind: 'hello', key, since: 0 }));
    return s;
  };
  const say = (s: FakeSock, m: object) => room.message(s, JSON.stringify({ v: 3, ...m }));
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

  it('a line’s steps (`fish`) go live to everyone here, never kept, never replayed', () => {
    const a = join(KEY_A), g = join(KEY_C);
    for (const s of [a, g]) s.sent = [];
    say(a, { kind: 'fish', ph: 'cast', id: 'hook:fish', pt: [150, -60], from: [150, 20], s: now });
    say(a, { kind: 'fish', ph: 'nibble', pt: [150, -60] });
    say(a, { kind: 'fish', ph: 'bite', pt: [150, -60], extra: 1 });
    say(a, { kind: 'fish', ph: 'gone' }); // not a step: dropped
    say(a, { kind: 'fish', ph: 'off', pt: [1e9, 0] }); // off the world: dropped
    say(a, { kind: 'fish', ph: 'reel' });
    expect(g.sent.map((m) => (m as { ph?: string }).ph)).toEqual(['cast', 'nibble', 'bite', 'reel']);
    expect(g.sent[2]).toEqual({ v: 3, kind: 'fish', ph: 'bite', pt: [150, -60], who: 'A', t: expect.any(Number) });
    expect(a.sent).toEqual([]); // (nothing to ack: presence only)
    const b = join(KEY_B);
    expect(b.sent.filter((m) => m.kind === 'replay').flatMap((m) => (m as { es: { kind: string }[] }).es).some((e) => e.kind === 'fish')).toBe(false);
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
    say(g, { kind: 'fish', ph: 'cast', id: 'fresh:pond:4320', pt: [80, 1200], from: [80, 1240], s: now });
    for (const s of [a, b]) expect(s.sent.map((m) => m.kind)).toEqual(['walk', 'catch', 'say', 'tent', 'drag', 'decor', 'fish']);
    expect(a.sent.at(-1)).toMatchObject({ kind: 'fish', ph: 'cast', id: 'fresh:pond:4320', pt: [80, 1200], from: [80, 1240], who: 'G' });
    expect(g.sent.map((m) => m.kind)).toEqual(['ack', 'ack', 'ack']);
    expect(a.sent.every((m) => (m as { who?: string }).who === 'G')).toBe(true);
    say(a, { kind: 'walk', to: [120, 300], c: 9 });
    expect(b.sent.at(-1)).toMatchObject({ kind: 'walk', who: 'A' });
    expect(g.sent.at(-1)).toMatchObject({ kind: 'walk', who: 'A' });
    // a claim is first-wins among all three
    say(a, { kind: 'catch', what: 'fish:koi', id: 'fresh:123', how: 'rod', c: 10 });
    expect(a.sent.at(-1)).toMatchObject({ kind: 'ack', c: 10, ok: false });
  });

  it('refuses what the guest may not do: the island’s decor, world ops, nudges', () => {
    const a = join(KEY_A), g = join(KEY_C);
    a.sent = [];
    say(g, { kind: 'decor', id: 'dabc1234', at: now, item: 'tanuki', x: 100, z: 200, f: 0, p: now, c: 1 });
    say(g, { kind: 'world', op: 'watered', id: 'fl:1:2', c: 2 });
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

  it('a record change reaches the guest too, and the guest’s own write every phone', () => {
    const a = join(KEY_A), b = join(KEY_B), g = join(KEY_C);
    // (an ingest that brought activity rows: the record says the guest may hear of it)
    expect(room.notify({ what: 'ingest', who: 'A', at: '2026-11-02T03:00:00.000Z', rev: 'e1' }, true)).toBe(3);
    expect(room.notify({ what: 'event', who: 'G', at: '2026-11-02T03:00:01.000Z', rev: 'e1' })).toBe(3);
    for (const s of [a, b, g]) expect(of(s, 'changed')).toHaveLength(2);
  });
});

// The island's layout (docs/island-layout.md "Ops"): the outdoors (`sc` o, c, r) the members' alone; a home's look
// (`h`) and its room its owner's alone (`u` うめ's, `v` the guest's; the tent's room `t` all three). The record and the
// room both refuse the rest.
describe('the layout’s permissions', () => {
  let now: number;
  let store: StoreCore;
  beforeEach(() => {
    now = T0;
    const db = memSql();
    store = new StoreCore({ sql: db.sql, tx: db.tx, keys: { KEY_A, KEY_B, KEY_C }, now: () => now, notify: () => {} });
  });
  const call = (key: string, e: object) => store.handle({ key, action: 'event', ...e }, 100) as Record<string, any>;
  let n = 0;
  const ev = (data: object) => ({ id: `l${++n}`, type: 'decor', data });
  const obj = (at = T0) => ({ sc: 'o', id: 'oak-m1', at, k: 'oak', x: 3, z: 20, f: 0 });
  const chunk = { sc: 'c', id: 'c0x0', at: T0, g: '4'.repeat(64) };
  const reset = { sc: 'r', id: 'reset', at: T0 + 50 };
  const look = (who: string) => ({ sc: 'h', id: `h${who}`, at: T0, m: 'tent-n' });
  const room = (sc: string) => ({ sc, id: 'dpiece123', at: T0, item: 'f1234', x: 2, z: 3, f: 0, p: T0 });
  const rows = () => (store.handle({ key: KEY_A, action: 'snapshot' }, 100) as Record<string, any>).rows.events as unknown[][];

  it('the record: the guest never writes the outdoors, only its own home', () => {
    const forbidden = { ok: false, error: 'forbidden' };
    for (const d of [obj(), chunk, reset, look('A'), look('B'), room('u')]) expect(call(KEY_C, ev(d)), JSON.stringify(d)).toEqual(forbidden);
    for (const d of [look('G'), room('v'), room('t'), { ...look('G'), at: T0 + 1, f: 2 }]) expect(call(KEY_C, ev(d)), JSON.stringify(d)).toMatchObject({ ok: true });
    // turning a home is its look: the owner's alone
    expect(call(KEY_A, ev({ ...look('G'), at: T0 + 2, f: 3 }))).toEqual(forbidden);
    expect(rows().map((r) => r[1])).toEqual(['G', 'G', 'G']);
  });

  it('the record: the members write the outdoors; each only their own home', () => {
    for (const [key, d] of [[KEY_A, obj()], [KEY_B, chunk], [KEY_A, look('A')], [KEY_B, look('B')], [KEY_B, room('u')]] as const)
      expect(call(key, ev(d)), JSON.stringify(d)).toMatchObject({ ok: true });
    for (const [key, d] of [[KEY_A, look('B')], [KEY_B, look('A')], [KEY_A, look('G')], [KEY_B, look('G')], [KEY_A, room('u')], [KEY_A, room('v')], [KEY_B, room('v')]] as const)
      expect(call(key, ev(d)), JSON.stringify(d)).toEqual({ ok: false, error: 'forbidden' });
  });

  it('the record keeps each id’s latest op; a reset drops the ops it voids', () => {
    expect(call(KEY_A, ev(obj(T0 + 10)))).toMatchObject({ ok: true });
    expect(call(KEY_B, ev(obj(T0 + 5)))).toMatchObject({ ok: true, duplicate: true });
    expect(call(KEY_A, ev(chunk))).toMatchObject({ ok: true });
    expect(call(KEY_A, ev(look('A')))).toMatchObject({ ok: true });
    expect(rows().length).toBe(3);
    expect(call(KEY_B, ev(reset))).toMatchObject({ ok: true });
    // the object's and the chunk's ops are gone, the home's look and the reset stay
    expect(rows().map((r) => JSON.parse(r[4] as string).sc).sort()).toEqual(['h', 'r']);
    // an op older than the reset is void: acknowledged, not kept
    expect(call(KEY_A, ev(obj(T0 + 20)))).toMatchObject({ ok: true, duplicate: true });
    expect(call(KEY_A, ev(obj(T0 + 60)))).toMatchObject({ ok: true });
    expect(rows().length).toBe(3);
  });

  it('the record refuses a malformed layout op', () => {
    for (const d of [{ ...obj(), k: 'Oak!' }, { ...obj(), x: 130 }, { ...chunk, g: 'z' }, { ...look('A'), m: '' }, { ...obj(), extra: 1 }])
      expect(call(KEY_A, ev(d)).ok, JSON.stringify(d)).toBe(false);
  });
});

describe('the room and the layout', () => {
  let now = 0;
  let socks: FakeSock[];
  let room: RoomCore<FakeSock>;
  beforeEach(() => {
    now = Date.UTC(2026, 10, 2, 3);
    socks = [];
    room = new RoomCore({
      sockets: () => socks.filter((s) => !s.closed), meta: (s) => s.meta, setMeta: (s, m) => void (s.meta = m),
      keys: { KEY_A, KEY_B, KEY_C }, now: () => now, save: () => {}, hold: () => {}
    });
  });
  const join = (key: string) => {
    const s = new FakeSock();
    socks.push(s);
    room.open(s);
    room.message(s, JSON.stringify({ v: 3, kind: 'hello', key, since: 0 }));
    return s;
  };
  const say = (s: FakeSock, m: object) => room.message(s, JSON.stringify({ v: 3, ...m }));

  it('relays a member’s outdoor op live (never replayed: the record keeps it); refuses the guest’s', () => {
    const a = join(KEY_A), b = join(KEY_B), g = join(KEY_C);
    for (const s of [a, b, g]) s.sent = [];
    say(a, { kind: 'decor', sc: 'o', id: 'oak-m1', at: now, k: 'oak', x: 3, z: 20, f: 0, c: 1 });
    say(a, { kind: 'drag', sc: 'o', id: 'oak-m1', x: 120, z: 500, f: 0 });
    expect(b.sent.map((m) => m.kind)).toEqual(['decor', 'drag']);
    expect(g.sent.map((m) => m.kind)).toEqual(['decor', 'drag']);
    expect(a.sent.at(-1)).toMatchObject({ kind: 'ack', c: 1, ok: true });
    say(g, { kind: 'decor', sc: 'o', id: 'oak-m1', at: now + 1, k: 'oak', x: 4, z: 20, f: 0, c: 2 });
    say(g, { kind: 'decor', sc: 'c', id: 'c0x0', at: now + 1, g: '4'.repeat(64), c: 3 });
    say(g, { kind: 'decor', sc: 'h', id: 'hA', at: now + 1, m: 'tent-n', c: 4 });
    expect(g.sent.filter((m) => m.kind === 'ack').map((m) => (m as { ok: boolean }).ok)).toEqual([false, false, false]);
    expect(b.sent.map((m) => m.kind)).toEqual(['decor', 'drag']);
    // a phone opening later hears none of it from the room
    const late = join(KEY_B);
    const replayed = late.sent.filter((m) => m.kind === 'replay').flatMap((m) => (m as { es: { kind: string; sc?: string }[] }).es);
    expect(replayed.some((e) => e.kind === 'decor' && e.sc === 'o')).toBe(false);
  });

  it('a home’s room is its owner’s: the guest’s own goes through, うめ’s doesn’t', () => {
    const a = join(KEY_A), g = join(KEY_C);
    a.sent = [];
    const piece = { id: 'dpiece123', at: now, item: 'f1234', x: 2, z: 3, f: 0, p: now };
    say(g, { kind: 'decor', sc: 'v', ...piece, c: 1 });
    say(g, { kind: 'decor', sc: 'u', ...piece, c: 2 });
    say(g, { kind: 'decor', sc: 'h', id: 'hG', at: now, m: 'house', w: 'NBLog.A', c: 3 });
    expect(a.sent.map((m) => (m as { sc?: string }).sc)).toEqual(['v', 'h']);
    expect(g.sent.filter((m) => m.kind === 'ack').map((m) => (m as { ok: boolean }).ok)).toEqual([true, false, true]);
  });
});
