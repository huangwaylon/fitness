import { describe, expect, it } from 'vitest';
import { KEEP, panRange, roomPan, type PanBox } from './pan.ts';

/** NH's framing on a 393 × 852 phone: the room across the screen, the band under the top bar and over the HUD. */
const BOX: PanBox = { room: [10, 250, 383, 650], band: [0, 110, 393, 780] };
/** Frames at 30 a second from `t` till `step` is done (at most `n`): the last t. */
function run(p: ReturnType<typeof roomPan>, t = 1000, n = 400) {
  for (let i = 0; i < n; i++, t += 33) if (!p.step(t, BOX)) return t;
  return t;
}

describe('the two-finger pan (rooms/pan.ts)', () => {
  it('its range keeps KEEP of the room (or of the band, a room bigger than it) in view, and home always in it', () => {
    const [lo, hi] = panRange(10, 383, 0, 393);
    // (the room's right edge at least KEEP of its width in from the band's left)
    expect(383 + lo).toBeCloseTo(KEEP * 373);
    expect(10 + hi).toBeCloseTo(393 - KEEP * 373);
    // a room three screens wide (zoomed in): it may go till half the screen is left of it
    const [l2, h2] = panRange(-400, 800, 0, 393);
    expect(800 + l2).toBeCloseTo(KEEP * 393);
    expect(-400 + h2).toBeCloseTo(393 - KEEP * 393);
    // a room off the band already (a turn took it there): 0 is still in range
    const [l3, h3] = panRange(500, 700, 0, 393);
    expect(l3).toBeLessThanOrEqual(0);
    expect(h3).toBeGreaterThanOrEqual(0);
  });
  it('moves with the fingers inside the range, gives past it (a rubber band) and eases back once they lift', () => {
    const p = roomPan();
    p.hold(true);
    p.drag(40, -30, BOX);
    expect([p.x, p.y]).toEqual([40, -30]);
    expect(p.isHome()).toBe(false);
    // far past the bottom: under the fingers it gives less and less
    const [, hi] = panRange(250, 650, 110, 780);
    p.drag(0, 600, BOX);
    expect(p.y).toBeGreaterThan(hi);
    expect(p.y).toBeLessThan(hi + 160);
    // held: nothing eases
    expect(p.step(1000, BOX)).toBe(false);
    p.hold(false);
    expect(p.busy()).toBe(true);
    run(p);
    expect(p.y).toBeCloseTo(hi, 1);
    expect(p.x).toBe(40);
    // at rest inside: nothing to do (no frames)
    expect(p.busy()).toBe(false);
    expect(p.step(99_000, BOX)).toBe(false);
  });
  it('a lift on the move flings on, slowing as the island’s scroll does, and a touch stops it', () => {
    const p = roomPan();
    p.fling(0.5, 0);
    expect(p.busy()).toBe(true);
    let t = 1000;
    for (let i = 0; i < 10; i++, t += 33) p.step(t, BOX);
    const x10 = p.x;
    expect(x10).toBeGreaterThan(50);
    p.hold(true);
    expect(p.busy()).toBe(false);
    p.step(t + 33, BOX);
    expect(p.x).toBe(x10);
    // let go and flung hard: it stops within the rubber band, then settles inside the range
    p.hold(false);
    p.fling(5, 0);
    run(p);
    expect(p.x).toBeLessThanOrEqual(panRange(10, 383, 0, 393)[1] + 0.05);
    expect(p.busy()).toBe(false);
  });
  it('the zoom about the fingers keeps the point under them where it is', () => {
    const p = roomPan();
    p.hold(true);
    // the target's point at the band's middle + the pan; a finger 100 px right and 50 down of the target's home spot
    p.drag(20, 0, BOX);
    const fx = 100, fy = 50, ratio = 1.25;
    // where that screen point is in the picture: (f − pan) from the target; after the zoom, pan' + ratio·(f − pan) = f
    const before = [fx - p.x, fy - p.y];
    p.zoomAbout(ratio, fx, fy, BOX);
    expect(p.x + ratio * before[0]).toBeCloseTo(fx);
    expect(p.y + ratio * before[1]).toBeCloseTo(fy);
  });
  it('home: eased back over its time, then home exactly; clear: at once', () => {
    const p = roomPan();
    p.drag(60, 40, BOX);
    p.home(1000, 420);
    p.step(1210, BOX);
    expect(p.x).toBeGreaterThan(0);
    expect(p.x).toBeLessThan(60);
    p.step(1500, BOX);
    expect([p.x, p.y, p.isHome(), p.busy()]).toEqual([0, 0, true, false]);
    p.drag(30, 30, BOX);
    p.clear();
    expect([p.x, p.y, p.isHome()]).toEqual([0, 0, true]);
  });
});
