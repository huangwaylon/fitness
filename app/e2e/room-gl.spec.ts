// A room's WebGL context lost (iOS taking a backgrounded room's memory back) and given back: the room draws again by
// itself (world3d/stage.ts watchContext: three restores what it can, the engine asks a frame), no failure shown.
import { expect, test } from './fixtures.ts';
import { roomUp, type Room } from './rooms.ts';

test.use({ viewport: { width: 393, height: 852 } });

for (const room of ['tent', 'shop', 'museum'] as Room[]) {
  test(`the ${room}: a lost WebGL context, given back, is drawn again by itself`, { tag: '@logic' }, async ({ page }) => {
    await page.goto(`${room}?demo&date=2026-11-04T12:00`);
    await roomUp(page, room, { frames: 1 });
    type R = { stats(): { frames: number }; still(): boolean };
    const r = <T,>(fn: (h: R) => T) => page.evaluate(`(${fn.toString()})(window.__${room})`) as Promise<T>;
    const ext = (act: 'lose' | 'back' | 'lost') => page.evaluate((act) => {
      // (the extension kept: a lost context gives none)
      const w = window as unknown as { __lose?: WEBGL_lose_context }, gl = document.querySelector('canvas')!.getContext('webgl2')!;
      const e = (w.__lose ??= gl.getExtension('WEBGL_lose_context')!);
      if (act === 'lose') e.loseContext();
      if (act === 'back') e.restoreContext();
      return gl.isContextLost();
    }, act);
    // (at rest: no frame coming of its own, the walk-in over)
    await expect.poll(() => r((h) => h.still()), { timeout: 15_000 }).toBe(true);
    await ext('lose');
    await expect.poll(() => ext('lost')).toBe(true);
    const f0 = await r((h) => h.stats().frames);
    await ext('back');
    await expect.poll(() => ext('lost')).toBe(false);
    await expect.poll(() => r((h) => h.stats().frames)).toBeGreaterThan(f0);
    await expect(page.locator('.fail')).toHaveCount(0);
  });
}
