import { describe, expect, it, vi } from 'vitest';
import type { Live, LiveStatus } from '#lib/sync/live.ts';
import type { Who } from '#lib/types.ts';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
const { onPresence } = await import('./roomLife.ts');

/** A relay with only its status and its rejoins (sync/live.ts). */
function relay() {
  const status = new Set<(s: LiveStatus) => void>(), back = new Set<(w: Who) => void>();
  let st: LiveStatus = { connected: true, me: 'A', peer: false, here: [] };
  const live = {
    onStatus: (fn: (s: LiveStatus) => void) => (status.add(fn), fn(st), () => void status.delete(fn)),
    onRejoin: (fn: (w: Who) => void) => (back.add(fn), () => void back.delete(fn))
  } as unknown as Live;
  return { live, set: (here: Who[]) => ((st = { ...st, here }), status.forEach((f) => f(st))), rejoin: (w: Who) => back.forEach((f) => f(w)), subs: () => status.size + back.size };
}

describe('a room\'s presence (rooms/roomLife.ts onPresence)', () => {
  it('someone arriving, or one here saying hello again (a rejoin: their page has nothing of mine), is told where I am', () => {
    const r = relay(), heard: [readonly Who[], boolean][] = [];
    const off = onPresence(r.live, ['B', 'G'], (here, came) => heard.push([here, came]));
    r.set(['B']);
    r.set(['B']);
    // B's phone back on a new page while the room held its old socket: nobody new, but `came`
    r.rejoin('B');
    // (someone this room doesn't draw: nothing)
    r.rejoin('A');
    expect(heard).toEqual([[[], false], [['B'], true], [['B'], false], [['B'], true]]);
    off();
    expect(r.subs()).toBe(0);
  });
});
