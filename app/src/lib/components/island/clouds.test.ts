// The sky's clouds and the island's little loops held and stepped by the island's frames (clouds.ts): no endless
// animation running at rest.
import { describe, expect, it } from 'vitest';
import { holdCloud, holdLoop, stepHeld } from './clouds.ts';

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
    const release = holdCloud(c.el);
    stepHeld(100);
    c.make();
    // (made between steps: taken up at the next step)
    stepHeld(150);
    expect(c.a.currentTime).toBe(0);
    stepHeld(5000);
    expect([c.state(), c.a.currentTime]).toEqual(['paused', 5000]);
    // (under 100 ms on: where it was, 0.2 px)
    stepHeld(5050);
    expect(c.a.currentTime).toBe(5000);
    stepHeld(5100);
    expect(c.a.currentTime).toBe(5100);
    // (no style flush a frame once it's there: getAnimations() till then, never a playState read)
    expect([c.asked.n, c.asked.state]).toEqual([2, 0]);
    // cancelled (its element out of the tree a while), then made again: asked for again at the next step
    c.cancel();
    c.make();
    stepHeld(5300);
    expect([c.asked.n, c.a.currentTime]).toEqual([3, 5300]);
    release();
    expect(c.state()).toBe('running');
    stepHeld(9000);
    expect(c.a.currentTime).toBe(5300);
  });
});

describe('the island\'s endless little loops (a twinkle, a glint, the foam, the ♪)', () => {
  it('held once there, set to each island frame\'s time, looked for at most each 500 ms till then, let go on release', () => {
    const c = cloud();
    const release = holdLoop(c.el);
    stepHeld(1000);
    stepHeld(1083);
    // (not there yet: looked for once in 500 ms, no style flush a frame)
    expect(c.asked.n).toBe(1);
    c.make();
    stepHeld(1166);
    expect(c.a.currentTime).toBe(0);
    stepHeld(1500);
    expect([c.state(), c.a.currentTime]).toEqual(['paused', 1500]);
    // (every frame: the island's 12 a second at rest, its 30 while it moves)
    stepHeld(1583);
    expect(c.a.currentTime).toBe(1583);
    stepHeld(1616);
    expect([c.a.currentTime, c.asked.n, c.asked.state]).toEqual([1616, 2, 0]);
    // cancelled (out of the tree a while) and made again: taken up again
    c.cancel();
    c.make();
    stepHeld(2200);
    expect([c.asked.n, c.a.currentTime]).toEqual([3, 2200]);
    release();
    expect(c.state()).toBe('running');
    stepHeld(3000);
    expect(c.a.currentTime).toBe(2200);
  });
  it('a cloud and a loop in one step: the cloud each 100 ms, the loop each frame', () => {
    const cl = cloud(), lp = cloud();
    cl.make();
    lp.make();
    const releases = [holdCloud(cl.el), holdLoop(lp.el)];
    stepHeld(20_000);
    stepHeld(20_040);
    expect([cl.a.currentTime, lp.a.currentTime]).toEqual([20_000, 20_040]);
    stepHeld(20_200);
    expect([cl.a.currentTime, lp.a.currentTime]).toEqual([20_200, 20_200]);
    for (const r of releases) r();
  });
});
