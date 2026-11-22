import { describe, expect, it, vi } from 'vitest';

/** The sockets made, each counting its starts and stops. */
const made = vi.hoisted(() => [] as { url: string; starts: number; stops: number }[]);
vi.mock('#lib/world/devHooks.ts', () => ({ hook: (n: string) => ({ relay: 'ws://127.0.0.1:9/room', key: 'k' })[n] ?? null }));
vi.mock('#lib/sync/live.ts', () => ({
  LIVE_URL: '',
  liveRelay: () => null,
  createLive: (o: { url: string }) => {
    const m = { url: o.url, starts: 0, stops: 0 };
    made.push(m);
    return { start: () => void m.starts++, stop: () => void m.stops++, send: () => true };
  }
}));
const { replayWalk, testRelay } = await import('./roomRelay.ts');

const eng = () => ({ put: vi.fn(), walk: vi.fn(() => 0) });

describe('a walk heard in a room', () => {
  it('plays on from where it is by now while under way', () => {
    const e = eng();
    replayWalk(e, { v: 3, t: 0, kind: 'tent', who: 'B', in: true, from: [0, 0], via: [[5, 0]], to: [5, 5], s: 1000, ms: 2000 }, 1500);
    expect(e.walk).toHaveBeenCalledWith('B', [[5, 0], [5, 5]], { from: [0, 0], ago: 500, ms: 2000 });
    expect(e.put).not.toHaveBeenCalled();
  });
  it("is at its end once it's over, turned the way its last leg went (the engine's walk, over), or put with no walk to it", () => {
    const e = eng();
    replayWalk(e, { v: 3, t: 0, kind: 'tent', who: 'B', in: true, from: [0, 0], via: [[-5, 0]], to: [-5, 5], s: 1000, ms: 2000 }, 9000);
    replayWalk(e, { v: 3, t: 0, kind: 'tent', who: 'G', in: true, to: [1, 2] }, 3000);
    expect(e.walk.mock.calls).toEqual([['B', [[-5, 0], [-5, 5]], { from: [0, 0], ago: 8000, ms: 2000 }]]);
    expect(e.put.mock.calls).toEqual([['G', [1, 2]]]);
  });
});

describe('the e2e test relay', () => {
  it('is one socket per page (no two hellos of one key replacing each other): open while any user has it started', () => {
    const island = testRelay()!, room = testRelay()!, sg = testRelay()!;
    expect(made).toHaveLength(1);
    island.start();
    room.start();
    room.start(); // (a second start of the same user: nothing)
    sg.start();
    expect(made[0].starts).toBe(1);
    room.stop();
    room.stop();
    island.stop();
    expect(made[0].stops).toBe(0); // (すごろく still has it)
    expect(island.send({ kind: 'saved' })).toBe(true); // (the rest is the one socket's)
    sg.stop();
    expect(made[0].stops).toBe(1);
    room.start(); // (a room opened again: the socket again)
    expect(made[0].starts).toBe(2);
  });
});
