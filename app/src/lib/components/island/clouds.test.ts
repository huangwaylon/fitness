// The sky's clouds held and stepped by the island's frames (clouds.ts): no endless animation running at rest.
import { describe, expect, it } from 'vitest';
import { holdClouds, stepClouds } from './clouds.ts';

/** A cloud whose animation the browser makes late (WebKit: at the first style after the mount). */
function cloud() {
  const anims: { playState: string; currentTime: number | null; pause(): void; play(): void }[] = [];
  const a = { playState: 'running', currentTime: 0 as number | null, pause: () => void (a.playState = 'paused'), play: () => void (a.playState = 'running') };
  return { el: { getAnimations: () => anims } as unknown as Element, make: () => anims.push(a), a };
}

describe('the clouds', () => {
  it('held once their animation is there, set to the frame time each frame, let go on release', () => {
    const c = cloud();
    const release = holdClouds([c.el]);
    stepClouds(100);
    c.make();
    stepClouds(5000);
    expect([c.a.playState, c.a.currentTime]).toEqual(['paused', 5000]);
    stepClouds(5083);
    expect(c.a.currentTime).toBe(5083);
    release();
    expect(c.a.playState).toBe('running');
    stepClouds(9000);
    expect(c.a.currentTime).toBe(5083);
  });
});
