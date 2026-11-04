import { describe, expect, it } from 'vitest';
import { SLOP, TAP_MS, gestures, isDrag, isTap, type Pointer } from './gesture.ts';

/** A recorder: what the rule told the room, in order. */
function rig() {
  const log: string[] = [];
  let dx = 0, dy = 0;
  const g = gestures({
    tap: (x, y) => log.push(`tap ${x},${y}`),
    start: () => log.push('start'),
    drag(x, y) {
      dx += x;
      dy += y;
      log.push('drag');
    },
    pinch: () => log.push('pinch'),
    end: () => log.push('end')
  });
  const p = (id: number, x: number, y: number, t: number, primary = id === 1): Pointer => ({ pointerId: id, clientX: x, clientY: y, timeStamp: 1000 + t, isPrimary: primary });
  return { g, log, p, turned: () => [dx, dy] };
}
const taps = (log: string[]) => log.filter((s) => s.startsWith('tap'));

describe('a tap or a drag (rooms/gesture.ts)', () => {
  it('the rule: within the slop (in CSS px, iOS points) and soon a tap; past it a drag', () => {
    expect(isTap(3, 4, 120)).toBe(true);
    expect(isTap(SLOP, 0, 120)).toBe(true);
    expect(isDrag(SLOP + 1, 0)).toBe(true);
    expect(isTap(SLOP + 1, 0, 120)).toBe(false);
    expect(isTap(0, 0, TAP_MS)).toBe(false);
    expect(SLOP).toBeGreaterThanOrEqual(8);
    expect(SLOP).toBeLessThanOrEqual(10);
  });
  it('a tap: down and up in place, soon, taps at the lift and turns nothing', () => {
    const { g, log, p } = rig();
    g.down(p(1, 100, 200, 1000));
    g.move(p(1, 102, 199, 1050));
    g.up(p(1, 103, 201, 1120));
    expect(log).toEqual(['tap 103,201']);
  });
  it('a jitter under the slop is still a tap (and turns nothing)', () => {
    const { g, log, p, turned } = rig();
    g.down(p(1, 100, 200, 0));
    for (let i = 0; i < 20; i++) g.move(p(1, 100 + ((i * 7) % 13) - 6, 200 + ((i * 5) % 11) - 5, i * 10));
    g.up(p(1, 104, 203, 250));
    expect([log, turned()]).toEqual([['tap 104,203'], [0, 0]]);
  });
  it('a drag: past the slop it turns (the slop’s way too) until the lift, and never taps, even back where it began', () => {
    const { g, log, p, turned } = rig();
    g.down(p(1, 100, 200, 0));
    g.move(p(1, 106, 200, 16));
    expect(log).toEqual([]);
    g.move(p(1, 115, 200, 32));
    g.move(p(1, 140, 210, 48));
    g.move(p(1, 100, 200, 64));
    g.up(p(1, 100, 200, 80));
    expect(log).toEqual(['start', 'drag', 'drag', 'drag', 'end']);
    expect(turned()).toEqual([0, 0]);
    expect(taps(log)).toEqual([]);
  });
  it('a slow drag (seconds, a px at a time) is a drag, not a long press', () => {
    const { g, log, p, turned } = rig();
    g.down(p(1, 0, 0, 0));
    for (let i = 1; i <= 60; i++) g.move(p(1, i, 0, i * 50));
    g.up(p(1, 60, 0, 3050));
    expect(log[0]).toBe('start');
    expect(log.at(-1)).toBe('end');
    expect(taps(log)).toEqual([]);
    expect(turned()).toEqual([60, 0]);
  });
  it('a long press held still is nothing (no tap, no turn)', () => {
    const { g, log, p } = rig();
    g.down(p(1, 50, 50, 0));
    g.move(p(1, 51, 50, 300));
    g.up(p(1, 51, 50, TAP_MS + 1));
    expect(log).toEqual([]);
    // (just under: a tap)
    g.down(p(1, 50, 50, 1000));
    g.up(p(1, 50, 50, 1000 + TAP_MS - 1));
    expect(log).toEqual(['tap 50,50']);
  });
  it('a cancelled pointer is nothing: no tap; a drag ends', () => {
    const { g, log, p } = rig();
    g.down(p(1, 0, 0, 0));
    g.cancel(p(1, 0, 0, 50));
    expect(log).toEqual([]);
    g.down(p(1, 0, 0, 100));
    g.move(p(1, 40, 0, 120));
    g.cancel(p(1, 40, 0, 140));
    expect(log).toEqual(['start', 'drag', 'end']);
    expect(g.count).toBe(0);
    // (its late up does nothing)
    g.up(p(1, 40, 0, 160));
    expect(log).toEqual(['start', 'drag', 'end']);
  });
  it('two fingers: a pinch, never a tap; the one left drags on from where it is; one end', () => {
    const { g, log, p, turned } = rig();
    g.down(p(1, 100, 100, 0));
    g.down(p(2, 200, 100, 30));
    g.move(p(2, 220, 100, 50));
    g.up(p(2, 220, 100, 80));
    g.move(p(1, 130, 100, 100));
    g.up(p(1, 130, 100, 120));
    expect(log).toEqual(['start', 'pinch', 'drag', 'end']);
    expect(turned()).toEqual([30, 0]);
  });
  it('a quick two-finger tap taps nothing', () => {
    const { g, log, p } = rig();
    g.down(p(1, 100, 100, 0));
    g.down(p(2, 140, 100, 10));
    g.up(p(1, 100, 100, 60));
    g.up(p(2, 140, 100, 70));
    expect(taps(log)).toEqual([]);
    expect(log).toEqual(['start', 'end']);
  });
  it('a new first finger forgets one whose up never came (its drag ended)', () => {
    const { g, log, p } = rig();
    g.down(p(1, 0, 0, 0));
    g.move(p(1, 50, 0, 20));
    g.down(p(3, 10, 10, 500, true));
    g.up(p(3, 10, 10, 560, true));
    expect(log).toEqual(['start', 'drag', 'end', 'tap 10,10']);
  });
  it('pending: one still finger’s place (the tent’s long press); none once it drags', () => {
    const { g, p } = rig();
    g.down(p(1, 5, 6, 0));
    expect(g.pending(1)).toEqual({ x: 5, y: 6 });
    expect(g.pending(2)).toBeNull();
    g.move(p(1, 50, 6, 10));
    expect(g.pending(1)).toBeNull();
  });
});
