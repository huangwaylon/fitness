// The maps' drag-up sheet (map/sheet.svelte.ts): where a drag lets go, how far it's held, the scroller's pull, and the
// handles' taps and drags (vitest runs Svelte's server build: the state and the getters do).
import { describe, expect, it } from 'vitest';
import { DragSheet, FLICK, GIVE, MID, REACH, SLOP, held, pullOf, snap } from './sheet.svelte.ts';

const VH = 800;
describe('snap', () => {
  it('a drag past FLICK goes its way, wherever it is', () => {
    expect(snap(300, 300 + FLICK + 1, VH)).toBe('full');
    expect(snap(700, 700 - FLICK - 1, VH)).toBe('low');
    // (a long pull up from low still under MID: full all the same)
    expect(snap(100, 200, VH)).toBe('full');
  });
  it('a short one: the nearer, by MID of the screen', () => {
    expect(VH * MID).toBe(360);
    expect(snap(300, 330, VH)).toBe('low');
    expect(snap(370, 400, VH)).toBe('full');
    expect(snap(700, 680, VH)).toBe('full');
    expect(snap(370, 340, VH)).toBe('low');
  });
});

describe('held', () => {
  it('up to full, down to GIVE of the peek', () => {
    expect(held(900, 200, 700)).toBe(700);
    expect(held(10, 200, 700)).toBe(200 * GIVE);
    expect(held(400, 200, 700)).toBe(400);
  });
});

describe('pullOf', () => {
  it('waits out the slop, then down is the sheet’s and up the list’s', () => {
    expect([pullOf(0), pullOf(SLOP - 1), pullOf(1 - SLOP)]).toEqual(['wait', 'wait', 'wait']);
    expect([pullOf(SLOP), pullOf(-SLOP)]).toEqual(['sheet', 'list']);
  });
});

describe('DragSheet', () => {
  type P = Parameters<DragSheet['handle']['onpointerdown']>[0];
  const caught: number[] = [];
  const ev = (y: number, type = 'pointermove', own = false): P =>
    ({ pointerId: 1, clientY: y, type, target: { closest: () => (own ? {} : null) }, currentTarget: { setPointerCapture: (id: number) => caught.push(id) } }) as unknown as P;
  const make = (card = false) => {
    const seen: string[] = [];
    const s = new DragSheet<'peek' | 'card'>({ peek: () => 200, bar: () => 100, low: () => (card ? 'card' : 'peek'), height: (l) => (l === 'card' ? 320 : 200), onset: (x) => seen.push(x) });
    s.vh = VH;
    return { s, seen };
  };
  const drag = (h: DragSheet<'peek' | 'card'>['handle'], from: number, to: number) => {
    h.onpointerdown(ev(from, 'pointerdown'));
    for (let k = 1; k <= 4; k++) h.onpointermove(ev(from + ((to - from) * k) / 4));
    h.onpointerup(ev(to, 'pointerup'));
  };

  it('full = under the bar by REACH; a level’s own height when low', () => {
    const { s } = make(true);
    expect(s.full).toBe(VH - 100 - REACH);
    expect(s.height).toBe(200);
    s.set('card');
    expect(s.height).toBe(320);
    s.set('full');
    expect([s.height, s.raised]).toEqual([VH - 100 - REACH, true]);
  });
  it('a handle: held from the press, a tap toggles (full folds to the low state), a control’s press is the control’s', () => {
    const { s, seen } = make(true);
    caught.length = 0;
    s.handle.onpointerdown(ev(600, 'pointerdown'));
    expect(caught).toEqual([1]);
    s.handle.onpointerup(ev(600, 'pointerup'));
    expect(s.state).toBe('full');
    s.handle.onpointerdown(ev(600, 'pointerdown'));
    s.handle.onpointerup(ev(602, 'pointerup'));
    expect(seen).toEqual(['full', 'card']);
    s.handle.onpointerdown(ev(600, 'pointerdown', true));
    s.handle.onpointerup(ev(600, 'pointerup', true));
    expect(s.state).toBe('card');
  });
  it('a drag: its height as it goes, past FLICK its way, its click swallowed (a new press starts clean)', () => {
    const { s } = make();
    s.handle.onpointerdown(ev(600, 'pointerdown'));
    s.handle.onpointermove(ev(500));
    expect(s.drag).toBe(300);
    s.handle.onpointerup(ev(500, 'pointerup'));
    expect([s.state, s.drag]).toEqual(['full', null]);
    let stopped = 0;
    const click = { stopPropagation: () => stopped++, preventDefault: () => {} } as unknown as MouseEvent;
    s.swallow(click);
    s.swallow(click);
    expect(stopped).toBe(1);
    drag(s.handle, 100, 160);
    expect(s.state).toBe('peek');
    s.fresh();
    s.swallow(click);
    expect(stopped).toBe(1);
  });
  it('a list: only at the low sheet, held once it drags, a tap is its row’s (no toggle)', () => {
    const { s } = make();
    caught.length = 0;
    s.list.onpointerdown(ev(600, 'pointerdown'));
    expect(caught).toEqual([]);
    s.list.onpointerup(ev(600, 'pointerup'));
    expect(s.state).toBe('peek');
    drag(s.list, 600, 480);
    expect([s.state, caught]).toEqual(['full', [1]]);
    // the full list scrolls: its drags aren't the sheet's
    drag(s.list, 300, 500);
    expect(s.state).toBe('full');
  });
});
