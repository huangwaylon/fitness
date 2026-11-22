// The rooms' presence (roomLife.ts onPresence, showOthers; store/where.svelte.ts; seating.ts): one who leaves a room, goes
// to another place, or times out there lets go of their seat on my phone; my own outage removes nobody (the island's
// rule: null while disconnected, the relay's leave time + goneMs once connected); one back says where they are.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Relayed } from '#lib/contract/live-protocol.ts';
import type { Live, LiveStatus } from '#lib/sync/live.ts';
import type { Who } from '#lib/types.ts';
import { CONFIRM_MS, where } from '#lib/store/where.svelte.ts';
import { onPresence, showOthers } from './roomLife.ts';
import { createSeating, type RoomSeat } from './seating.ts';


const tent = (who: Who, inside: boolean, extra: object = {}) => ({ v: 3, kind: 'tent', in: inside, who, t: 1, ...extra }) as unknown as Relayed;

/** A relay whose status the test sets (connected or not, who's here, when each left). */
function fakeRelay() {
  let fn: ((s: LiveStatus) => void) | null = null;
  const relay = { onStatus: (f: (s: LiveStatus) => void) => ((fn = f), () => (fn = null)), serverNow: () => Date.now() } as unknown as Live;
  return { relay, set: (s: Partial<LiveStatus>) => fn?.({ connected: true, me: 'A', peer: false, here: [], ...s }) };
}
/** A room's engine as showOthers drives it: who's drawn where. */
function fakeEng() {
  const at = new Map<Who, readonly [number, number]>();
  return {
    at: (w: Who) => at.get(w) ?? null,
    villager: (w: Who, look: string | null) => void (look ? at.has(w) || at.set(w, [0, 0]) : at.delete(w)),
    put: (w: Who, p: readonly [number, number]) => void at.set(w, p)
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  where.reset();
});
afterEach(() => vi.useRealTimers());

describe('their seat on my phone', () => {
  const chair: RoomSeat = { id: 'c1', n: 0, lie: false, at: [0, 0], from: [0, 5] };
  /** B sitting on the chair in うめ's house (B), A's phone in there. */
  function sitting() {
    const seats = createSeating<RoomSeat>('A'), eng = fakeEng();
    const shown = () => showOthers(eng, ['B', 'G'], 'B', () => 'look', new Map([['B', [0, 0]], ['G', [0, 0]]]), undefined, seats.gone);
    where.presence('B', true);
    where.heard(tent('B', true, { sc: 'u', seat: 'c1', n: 0, s: 5 }));
    seats.heard('B', { in: true, seat: 'c1', n: 0, s: 5, t: 5 });
    shown();
    expect([seats.taken('c1', 0), eng.at('B')]).toEqual([true, [0, 0]]);
    return { seats, eng, shown };
  }

  it('free once they’re out: the island’s `in: false` (no `sc`), hidden and let go of', () => {
    const { seats, eng, shown } = sitting();
    where.heard(tent('B', false));
    shown();
    expect([seats.taken('c1', 0), seats.seated('B'), eng.at('B')]).toEqual([false, false, null]);
    expect(seats.tap([chair], [0, 9], () => 10, (_, then) => then(), () => {})).toBe('go');
    expect(seats.mine()?.id).toBe('c1');
  });

  it('free once they’re in another place (the tent, the museum)', () => {
    const { seats, shown } = sitting();
    where.heard(tent('B', true, { sc: 'm' }));
    shown();
    expect(seats.taken('c1', 0)).toBe(false);
  });

  it('free once where times them out (gone quiet inside, the relay’s leave time + goneMs)', () => {
    const { seats, shown } = sitting();
    where.presence('B', false, 1000);
    vi.advanceTimersByTime(999);
    shown();
    expect(seats.taken('c1', 0)).toBe(true);
    vi.advanceTimersByTime(1);
    // (the room's effect on where.inTent draws them again)
    shown();
    expect(seats.taken('c1', 0)).toBe(false);
  });
});

describe('my own outage in a room', () => {
  it('removes nobody: while I’m disconnected they stay, however long; connected, the relay’s leave time counts', () => {
    const { relay, set } = fakeRelay();
    const heard: [readonly Who[], boolean][] = [];
    const off = onPresence(relay, ['B'], (here, came) => heard.push([here, came]));
    set({ here: ['B'] });
    where.heard(tent('B', true));
    // my socket down 200 s: B stays inside on my phone
    set({ connected: false, here: [] });
    vi.advanceTimersByTime(200_000);
    expect(where.inTent.B).toBe(true);
    // back: B is here (their room answers my arrival at once, `came` on their phone too)
    set({ here: ['B'] });
    expect(heard.at(-1)).toEqual([['B'], true]);
    where.heard(tent('B', true));
    vi.advanceTimersByTime(CONFIRM_MS * 2);
    expect(where.inTent.B).toBe(true);
    // B's own socket gone (the relay says when): out at their leave time + goneMs
    set({ here: [], gone: { B: Date.now() - 1000 } });
    vi.advanceTimersByTime(where.goneMs - 1001);
    expect(where.inTent.B).toBe(true);
    vi.advanceTimersByTime(2);
    expect(where.inTent.B).toBe(false);
    off();
  });

  it('back from it with no word from them (their exit lost while I was away): out after CONFIRM_MS', () => {
    const { relay, set } = fakeRelay();
    onPresence(relay, ['B'], () => {});
    set({ here: ['B'] });
    where.heard(tent('B', true));
    set({ connected: false, here: [] });
    set({ here: ['B'] });
    vi.advanceTimersByTime(CONFIRM_MS);
    expect(where.inTent.B).toBe(false);
  });
});
