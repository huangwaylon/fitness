// The online game's sync on this phone (online.svelte.ts) against a fake relay: what each hello says of the game, a
// move the outbox gave up on, and the turn's live view (sgv) sent only on change.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Intent, Relayed, SgAt } from '#lib/contract/live-protocol.ts';
import type { LiveStatus } from '#lib/sync/live.ts';

const h = vi.hoisted(() => ({
  sent: [] as object[],
  on: null as ((m: Relayed) => void) | null,
  drop: null as ((i: Intent) => void) | null,
  ack: null as ((i: Intent, ok: boolean, t: number) => void) | null,
  sgAt: null as (() => SgAt | null) | null,
  status: null as ((s: LiveStatus) => void) | null,
  logs: [] as unknown[][]
}));
vi.mock('#lib/components/rooms/roomRelay.ts', () => ({
  roomRelay: () => ({
    own: null,
    now: () => Date.now(),
    relay: {
      send: (i: object) => (h.sent.push(i), true),
      on: (f: (m: Relayed) => void) => ((h.on = f), () => {}),
      onAck: (f: (i: Intent, ok: boolean, t: number) => void) => ((h.ack = f), () => {}),
      onDrop: (f: (i: Intent) => void) => ((h.drop = f), () => {}),
      sgAt: (f: () => SgAt | null) => void (h.sgAt = f),
      onStatus: (f: (s: LiveStatus) => void) => ((h.status = f), () => {}),
      serverNow: () => Date.now()
    }
  })
}));
vi.mock('#lib/store/week.svelte.ts', () => ({ week: { model: { me: 'A' }, view: null, demo: false } }));
vi.mock('#lib/world/devHooks.ts', () => ({ hook: () => undefined }));
vi.mock('./invite.svelte.ts', () => ({ invite: { cur: null, answered: [] }, readAnswered: () => [] }));
vi.mock('#lib/sync/log.ts', () => ({ log: (...a: unknown[]) => void h.logs.push(a) }));

type Mod = typeof import('./online.svelte.ts');
let o: Mod;
const status = (here: ('A' | 'B' | 'G')[], connected = true) => h.status!({ connected, me: 'A', peer: here.includes('B'), here });
const frames = () => h.sent.filter((m) => (m as { kind: string }).kind === 'sgv');

beforeEach(async () => {
  vi.useFakeTimers({ now: 1_800_000_000_000, toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date', 'performance'] });
  Object.assign(h, { sent: [], logs: [], on: null, drop: null, ack: null, sgAt: null, status: null });
  // (listen() runs in a browser only)
  vi.stubGlobal('window', globalThis);
  vi.resetModules();
  o = await import('./online.svelte.ts');
  o.listen();
  status(['B']);
  o.startOnline('A2B1', 's');
  o.sendMove({ a: 'roll' });
});
afterEach(() => {
  o.sendView(null);
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('online: this phone and the room', () => {
  it('each hello says the game held and how many of its moves (the room replays it from there, across midnight)', () => {
    expect(h.sgAt!()).toEqual({ g: o.online.cur.g, n: 2 });
  });

  it('a move the outbox gave up on leaves my log (those after it too), logged once', () => {
    o.sendMove({ a: 'fork', b: 1 });
    expect(o.online.cur.log).toHaveLength(3);
    const [, roll, fork] = h.sent as Intent[];
    h.drop!(fork);
    expect(o.online.cur.log.map((m) => m.a)).toEqual(['start', 'roll']);
    h.drop!(roll);
    expect(o.online.cur.log.map((m) => m.a)).toEqual(['start']);
    expect(h.logs.filter((l) => l[0] === 'sg.sync')).toEqual([['sg.sync', { why: 'drop', i: 2, held: 0 }, 2]]);
    // another game's, or not a move: nothing
    h.drop!({ kind: 'world', op: 'watered', id: 'fl:1:2' } as Intent);
    expect(o.online.cur.log).toHaveLength(1);
  });

  it('my turn’s view goes on change only, again after 30 s unchanged and when someone arrives; never every 2 s', () => {
    const v = { p: 'fork', v: null } as const;
    o.sendView(v);
    vi.advanceTimersByTime(300);
    o.sendView(v);
    vi.advanceTimersByTime(25_000);
    expect(frames()).toHaveLength(1);
    vi.advanceTimersByTime(6000);
    expect(frames()).toHaveLength(2);
    // the guest arrives: whole again at once; B still here: nothing more
    status(['B', 'G']);
    expect(frames()).toHaveLength(3);
    status(['B', 'G']);
    // me back after a drop: again
    status([], false);
    status(['B']);
    expect(frames()).toHaveLength(4);
    o.sendView({ p: 'home', v: null });
    vi.advanceTimersByTime(300);
    expect(frames()).toHaveLength(5);
  });

  it('a watcher sets a view heard again unchanged no more (no re-render)', () => {
    const g = o.online.cur.g;
    h.on!({ kind: 'sgv', g, i: 2, p: 'fork', s: '', v: 3, who: 'B', t: 1 } as Relayed);
    const first = o.online.view;
    h.on!({ kind: 'sgv', g, i: 2, p: 'fork', s: '', v: 3, who: 'B', t: 2 } as Relayed);
    expect(o.online.view).toBe(first);
    h.on!({ kind: 'sgv', g, i: 2, p: 'home', s: '', v: 3, who: 'B', t: 3 } as Relayed);
    expect(o.online.view).toMatchObject({ p: 'home' });
  });

  it('a mini-game’s moves one in flight: the next once it’s taken; a race lost (heard or refused) sent again at the new end', () => {
    const g = o.online.cur.g, moves = () => h.sent.filter((m) => (m as { kind: string }).kind === 'sg') as (Intent & { i: number; a: string; n?: number })[];
    o.sendMove({ a: 'mp', n: 1 });
    o.sendMove({ a: 'mp', n: 2 });
    expect(moves().map((m) => [m.i, m.a, m.n])).toEqual([[0, 'start', undefined], [1, 'roll', undefined], [2, 'mp', 1]]);
    expect(o.online.cur.log).toHaveLength(3);
    h.ack!(moves()[2], true, 5);
    expect(moves().map((m) => [m.i, m.n]).slice(3)).toEqual([[3, 2]]);
    // B's play took 3 first: heard, mine goes again at 4 (the old refusal after it: nothing more)
    const lost = moves()[3];
    h.on!({ kind: 'sg', g, i: 3, a: 'mp', n: 9, v: 3, who: 'B', t: 6 } as Relayed);
    expect(moves().map((m) => [m.i, m.n]).slice(4)).toEqual([[4, 2]]);
    h.ack!(lost, false, 7);
    expect(moves()).toHaveLength(5);
    expect(o.online.cur.log.map((m) => [m.i, m.who, m.n])).toEqual([[0, 'A', undefined], [1, 'A', undefined], [2, 'A', 1], [3, 'B', 9], [4, 'A', 2]]);
    // the room's stamp kept on what's heard (the mini-game's clock), not on the wire
    expect(o.online.cur.log[3].t).toBe(6);
    expect(moves().every((m) => !('t' in m))).toBe(true);
    // refused before the winner is heard: it waits for it, then goes
    h.ack!(moves()[4], false, 8);
    expect(o.online.cur.log).toHaveLength(4);
    expect(moves()).toHaveLength(5);
    h.on!({ kind: 'sg', g, i: 4, a: 'mc', v: 3, who: 'B', t: 9 } as Relayed);
    expect(moves().map((m) => [m.i, m.n]).slice(5)).toEqual([[5, 2]]);
    // a turn's move goes at once, as before
    o.sendMove({ a: 'roll' });
    expect(moves().at(-1)).toMatchObject({ i: 6, a: 'roll' });
  });
});
