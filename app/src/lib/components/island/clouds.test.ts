// The sky's clouds held and stepped by the island's frames (clouds.ts): no endless animation running at rest.
import { describe, expect, it } from 'vitest';
import { holdClouds, stepClouds } from './clouds.ts';

/** A cloud whose animation the browser makes late (WebKit: at the first style after the mount); its getAnimations()
 *  calls and playState reads counted (each flushes pending style). */
function cloud() {
  const anims: object[] = [];
  const asked = { n: 0, state: 0 };
  let state = 'running', cancel: (() => void) | null = null;
  const a = {
    get playState() { return (asked.state++, state); },
    currentTime: 0 as number | null,
    pause: () => void (state = 'paused'),
    play: () => void (state = 'running'),
    addEventListener: (type: string, fn: () => void) => void (type === 'cancel' && (cancel = fn))
  };
  return {
    el: { getAnimations: () => (asked.n++, [...anims]) } as unknown as Element,
    make: () => anims.push(a),
    a,
    asked,
    state: () => state,
    cancel: () => (anims.length = 0, cancel?.())
  };
}

describe('the clouds', () => {
  it('held once their animation is there, set to the frame time each 100 ms, asked for only till it is, let go on release', () => {
    const c = cloud();
    const release = holdClouds([c.el]);
    stepClouds(100);
    c.make();
    // (made between steps: taken up at the next step)
    stepClouds(150);
    expect(c.a.currentTime).toBe(0);
    stepClouds(5000);
    expect([c.state(), c.a.currentTime]).toEqual(['paused', 5000]);
    // (under 100 ms on: where it was, 0.2 px)
    stepClouds(5050);
    expect(c.a.currentTime).toBe(5000);
    stepClouds(5100);
    expect(c.a.currentTime).toBe(5100);
    // (no style flush a frame once it's there: getAnimations() till then, never a playState read)
    expect([c.asked.n, c.asked.state]).toEqual([2, 0]);
    // cancelled (its element out of the tree a while), then made again: asked for again at the next step
    c.cancel();
    c.make();
    stepClouds(5300);
    expect([c.asked.n, c.a.currentTime]).toEqual([3, 5300]);
    release();
    expect(c.state()).toBe('running');
    stepClouds(9000);
    expect(c.a.currentTime).toBe(5300);
  });
});
