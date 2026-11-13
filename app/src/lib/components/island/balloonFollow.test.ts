import { describe, expect, it } from 'vitest';
import { aimOf, carry, followOf } from './balloonFollow.ts';

const box = { left: 100, top: 200, right: 160, bottom: 300 };

describe('a balloon through a camera move (balloonFollow)', () => {
  it('aims where the tail does: the head from above, the feet from below, the facing edge’s upper part beside', () => {
    expect(aimOf(box, 'top')).toEqual([130, 200]);
    expect(aimOf(box, 'bottom')).toEqual([130, 300]);
    expect(aimOf(box, 'left')).toEqual([100, 224]);
    expect(aimOf(box, 'right')).toEqual([160, 224]);
  });

  it('carries a point with its node: moved, and scaled about the node’s origin (a pinch zooms the speaker)', () => {
    const f0 = { x: 100, y: 300, kx: 1, ky: 1 };
    expect(carry([120, 250], f0, { ...f0, x: 140, y: 280 })).toEqual([160, 230]);
    // twice the size about its feet: the head twice as far above them
    expect(carry([120, 250], f0, { x: 100, y: 300, kx: 2, ky: 2 })).toEqual([140, 200]);
    // squashed upright only (a model's node)
    expect(carry([120, 250], f0, { x: 100, y: 300, kx: 1, ky: 0.5 })).toEqual([120, 275]);
  });

  it('a room’s speaker (a box from its camera) is asked again; an element outside every node can’t be followed', () => {
    const rect = (x: number, y: number) => ({ left: x, top: y, right: x + 60, bottom: y + 100 }) as DOMRect;
    let r = rect(100, 200);
    const room = { isConnected: true, getBoundingClientRect: () => r };
    const f = followOf(room, r, 'top')!;
    expect(f.aim).toEqual([130, 200]);
    r = rect(150, 180);
    expect(f.now()).toEqual([180, 180]);
    // (no DOM here: an Element of our own)
    const G = globalThis as { Element?: unknown };
    const had = G.Element;
    class El {
      isConnected = true;
      getBoundingClientRect = () => rect(100, 200);
    }
    G.Element = El;
    const el = new El();
    expect(followOf(el, box, 'top', () => null)).toBeNull();
    let fr = { x: 100, y: 300, kx: 1, ky: 1 };
    const g = followOf(el, box, 'top', () => () => fr)!;
    fr = { x: 110, y: 300, kx: 2, ky: 2 };
    expect(g.now()).toEqual([170, 100]);
    G.Element = had;
  });
});
