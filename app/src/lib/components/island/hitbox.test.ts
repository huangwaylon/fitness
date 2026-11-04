import { describe, expect, it } from 'vitest';
import { MIN_HIT, grow, inside, notBehind, pick } from './hitbox.ts';

describe('tap boxes (hitbox.ts)', () => {
  it('a small thing grows to a thumb’s size about its middle; a big one keeps its body, a little padded', () => {
    const small = grow({ left: 100, top: 200, width: 10, height: 8 });
    expect([small.r - small.l, small.b - small.t]).toEqual([MIN_HIT, MIN_HIT]);
    expect([(small.l + small.r) / 2, (small.t + small.b) / 2]).toEqual([105, 204]);
    const big = grow({ left: 0, top: 0, width: 80, height: 120 });
    expect(big).toEqual({ l: -4, t: -4, r: 84, b: 124 });
    expect(inside(big, 40, 123)).toBe(true); // its base
    expect(inside(big, 40, 130)).toBe(false);
  });
  it('of two under the finger, the one in front wins; level ones by the nearer middle', () => {
    const at = (x: number, y: number) => grow({ left: x - 5, top: y - 5, width: 10, height: 10 });
    const back = { box: at(100, 100), z: 300, id: 'back' }, front = { box: at(110, 100), z: 200, id: 'front' };
    expect(pick([back, front], 102, 100)?.id).toBe('front');
    const near = { box: at(100, 100), z: 200, id: 'near' };
    expect(pick([front, near], 102, 100)?.id).toBe('near');
    expect(pick([back], 400, 400)).toBeNull();
  });
});

describe('what a building hides (notBehind)', () => {
  // the user's shop: x 120…330, its front line z 1380
  const shows = notBehind({ x0: 120, x1: 330, y0: 1380 });
  it('before it or beside it shows; behind its front within its width is hidden', () => {
    expect(shows(225, 1300)).toBe(true); // a present on the lawn before it
    expect(shows(375, 1450)).toBe(true); // the river beside it
    expect(shows(225, 1450)).toBe(false); // inside, behind its wall
    expect(shows(225, 1560)).toBe(false); // behind it
  });
  it('at its edge it shows: its model stands a little inside its tiles', () => {
    expect(shows(125, 1450)).toBe(true);
    expect(shows(325, 1450)).toBe(true);
    expect(shows(225, 1385)).toBe(true);
  });
});
