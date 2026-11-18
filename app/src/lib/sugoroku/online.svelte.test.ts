// The online game's sync on this phone (online.svelte.ts) against a fake relay: what each hello says of the game, a
// move the outbox gave up on, and the turn's live view (sgv) sent only on change.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Intent, Relayed, SgAt } from '#lib/contract/live-protocol.ts';
import type { LiveStatus } from '#lib/sync/live.ts';

const h = vi.hoisted(() => ({
  sent: [] as object[],
  on: null as ((m: Relayed) => void) | null,
  drop: null as ((i: Intent) => void) | null,
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
      onAck: () => () => {},
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

beforeEach(async () => {
  vi.useFakeTimers({ now: 1_800_000_000_000, toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date', 'performance'] });
  Object.assign(h, { sent: [], logs: [], on: null, drop: null, sgAt: null, status: null });
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
});
