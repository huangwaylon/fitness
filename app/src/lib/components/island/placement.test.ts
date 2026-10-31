import { describe, expect, it } from 'vitest';
import { GAP, NEAR, SNUG, TAIL_IN, spotBy, type Box } from './placement.ts';

// a 390 × 844 phone; a visitor at centre stage (head at y 418), the museum straight above it, the trees either side
const area: Box = { x0: 8, x1: 382, y0: 4, y1: 840 };
const visitor: Box = { x0: 163, x1: 227, y0: 418, y1: 525 };
const museum: Box = { x0: 128, x1: 262, y0: 315, y1: 393 };
const canopies: Box[] = [{ x0: 24, x1: 153, y0: 370, y1: 472 }, { x0: 237, x1: 366, y0: 370, y1: 472 }];
const villagers: Box[] = [{ x0: 99, x1: 185, y0: 563, y1: 680 }, { x0: 208, x1: 288, y0: 563, y1: 680 }];
const ribbon: Box = { x0: 44, x1: 228, y0: 84, y1: 140 };
const W = 270, H = 69;
const cx = (b: Box) => (b.x0 + b.x1) / 2;
/** How far the balloon's edge facing the speaker stands off it. */
const off = (p: { x: number; y: number; side: string }, s: Box) =>
  p.side === 'top' ? s.y0 - (p.y + H / 2) : p.side === 'bottom' ? p.y - H / 2 - s.y1 : p.side === 'left' ? s.x0 - (p.x + W / 2) : p.x - W / 2 - s.x1;

describe('a speech balloon by its speaker (NH’s rule)', () => {
  it('above the head, centred, a tail’s length off, when there is room', () => {
    const p = spotBy(W, H, visitor, area, [[ribbon]])!;
    expect(p.side).toBe('top');
    expect(p.x).toBe(cx(visitor));
    expect(off(p, visitor)).toBe(GAP);
  });

  it('the visitor under the museum: over the museum by their head, never floated up above it (the bug)', () => {
    const strict = [ribbon, museum, ...canopies, ...villagers];
    // placeBy's tiers: clear of every control, or of all but the museum, only snug by the head; then over the trees
    const tiers = [{ keep: strict, reach: SNUG }, { keep: [ribbon, ...canopies, ...villagers], reach: SNUG }, [ribbon, ...villagers], [ribbon]];
    const p = spotBy(W, H, visitor, area, tiers)!;
    expect(p.side).toBe('top');
    expect(off(p, visitor)).toBe(GAP); // right over the head
    // clear above the museum is 100px+ off: never taken while a looser tier fits by the head
    expect(p.y + H / 2).toBeGreaterThan(museum.y0);
    // a control just over the head: kept clear by a breath (within SNUG) before anything is covered
    const sign: Box = { x0: 180, x1: 210, y0: visitor.y0 - 16, y1: visitor.y0 - 6 };
    const r = spotBy(W, H, visitor, area, [{ keep: [sign], reach: SNUG }, []])!;
    expect(off(r, visitor)).toBe(GAP + 4);
  });

  it('slides along so it stays on screen, the tail still able to reach the speaker', () => {
    const edge: Box = { x0: 12, x1: 60, y0: 400, y1: 480 };
    const p = spotBy(W, H, edge, area, [[]])!;
    expect(p.x - W / 2).toBeGreaterThanOrEqual(area.x0);
    expect(Math.abs(cx(edge) - p.x)).toBeLessThanOrEqual(W / 2 - TAIL_IN);
  });

  it('no room above (the top of the scene): beside the head, else below the feet', () => {
    const high: Box = { x0: 40, x1: 100, y0: 40, y1: 140 };
    const p = spotBy(W, H, high, area, [[]])!;
    expect(p.side).toBe('right');
    expect(off(p, high)).toBe(GAP);
    // the tail points at the upper part of the figure
    expect(Math.abs(p.y - (high.y0 + 24))).toBeLessThanOrEqual(H / 2 - TAIL_IN);
    const wall: Box = { x0: 105, x1: 382, y0: 4, y1: 150 };
    const q = spotBy(W, H, high, area, [[wall]])!;
    expect(q.side).toBe('bottom');
    expect(off(q, high)).toBe(GAP);
  });

  it('never over what every tier keeps clear (the HUD); nothing near: none, a wider reach finds it further off', () => {
    const hud: Box = { x0: 0, x1: 390, y0: 300, y1: 560 };
    expect(spotBy(W, H, visitor, area, [[hud, ...villagers]], { reach: NEAR })).toBeNull();
    const p = spotBy(W, H, visitor, area, [[hud]], { reach: 600 })!;
    expect(p.y + H / 2 <= hud.y0 || p.y - H / 2 >= hud.y1).toBe(true);
  });

  it('a plate (free: no tail) may slide the whole width', () => {
    const pt: Box = { x0: 30, x1: 30, y0: 500, y1: 504 };
    const p = spotBy(120, 40, pt, area, [[{ x0: 0, x1: 100, y0: 440, y1: 500 }]], { sides: ['top', 'bottom'], free: true })!;
    expect(p.side).toBe('top');
    expect(p.x - 60).toBeGreaterThanOrEqual(100);
  });
});
