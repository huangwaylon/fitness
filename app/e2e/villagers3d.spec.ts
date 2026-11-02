// The 3D villagers POC (/villagers3d, unlinked: lib/components/villager3d): NH's villager models with procedural
// motion on the 3D island. Smoke: the page loads, the three villagers render (their GLBs in, the canvas drawing), and a
// tap on the ground walks the chosen one there.
import { expect, test, type Page } from '@playwright/test';

type V3 = {
  ready(): boolean;
  ids(): Record<'A' | 'B' | 'G', string>;
  pos(s: 'A' | 'B' | 'G'): [number, number];
  state(s: 'A' | 'B' | 'G'): string | null;
  walking(s: 'A' | 'B' | 'G'): boolean;
  client(x: number, z: number, lift?: number): [number, number];
  stats(): { calls: number; tris: number; frames: number; anim: number[] };
};
const v3 = <R,>(page: Page, fn: (v: V3) => R) => page.evaluate(`(${fn.toString()})(window.__villagers3d)`) as Promise<R>;

test('the 3D villagers POC draws three villagers, and a tap on the ground walks the chosen one', { tag: '@render' }, async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('villagers3d/?demo&date=2026-11-04T12:00&a=goldie&b=anchovy&g=judy');
  await page.waitForFunction(() => (window as unknown as { __villagers3d?: V3 }).__villagers3d?.ready(), null, { timeout: 60_000 });
  await expect(page.locator('[data-v3d-ready]')).toBeAttached();
  expect(await v3(page, (v) => v.ids())).toEqual({ A: 'goldie', B: 'anchovy', G: 'judy' });
  // drawing: the island and the three villagers (their skinned meshes: ~4–5 k triangles each)
  await expect.poll(() => v3(page, (v) => v.stats().frames), { timeout: 20_000 }).toBeGreaterThan(5);
  const st = await v3(page, (v) => v.stats());
  expect(st.calls).toBeGreaterThan(10);
  expect(st.tris).toBeGreaterThan(12_000);
  // posed every frame (the motion's own JS, measured)
  expect(st.anim.length).toBeGreaterThan(0);

  // a tap on open lawn in front of ウェイ's villager: it walks there
  const [x0, z0] = await v3(page, (v) => v.pos('A'));
  const to: [number, number] = [x0 + 30, z0 - 50];
  const [cx, cy] = await page.evaluate(([x, z]) => (window as unknown as { __villagers3d: V3 }).__villagers3d.client(x, z), to);
  const panel = await page.locator('.panel').boundingBox();
  expect(cy).toBeLessThan(panel!.y);
  await page.mouse.click(cx, cy);
  await expect.poll(() => v3(page, (v) => v.state('A'))).toBe('walk');
  await expect.poll(() => v3(page, (v) => !v.walking('A') && v.state('A')), { timeout: 15_000 }).toBe('idle');
  const [x1, z1] = await v3(page, (v) => v.pos('A'));
  expect(Math.hypot(x1 - to[0], z1 - to[1])).toBeLessThan(20);
});
