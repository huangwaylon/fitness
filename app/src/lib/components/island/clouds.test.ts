// The sky's clouds held and stepped by the island's frames (clouds.ts): no endless animation running at rest.
import { describe, expect, it } from 'vitest';
import { holdClouds, stepClouds } from './clouds.ts';

/** A cloud whose animation the browser makes late (WebKit: at the first style after the mount). */
function cloud() {
  const anims: { playState: string; currentTime: number | null; pause(): void; play(): void }[] = [];
  const a = { playState: 'running', currentTime: 0 as number | null, pause: () => void (a.playState = 'paused'), play: () => void (a.playState = 'running') };
  const asked = { n: 0 };
  return { el: { getAnimations: () => (asked.n++, [...anims]) } as unknown as Element, make: () => anims.push(a), a, asked };
}

describe('the clouds', () => {
  it('held once their animation is there, set to the frame time each 100 ms, asked for only till it is, let go on release', () => {
    const c = cloud();
    const release = holdClouds([c.el]);
    stepClouds(100);
    c.make();
    stepClouds(5000);
    expect([c.a.playState, c.a.currentTime]).toEqual(['paused', 5000]);
    // (under 100 ms on: where it was, 0.2 px)
    stepClouds(5050);
    expect(c.a.currentTime).toBe(5000);
    stepClouds(5100);
    expect(c.a.currentTime).toBe(5100);
    // (no style flush a frame once it's there)
    expect(c.asked.n).toBe(2);
    // cancelled (its element out of the tree a while): asked for again
    c.a.playState = 'idle';
    stepClouds(5300);
    expect([c.asked.n, c.a.currentTime]).toEqual([3, 5300]);
    release();
    expect(c.a.playState).toBe('running');
    stepClouds(9000);
    expect(c.a.currentTime).toBe(5300);
  });
});
