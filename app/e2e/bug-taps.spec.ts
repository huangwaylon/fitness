// A tap on a bug where the 3D island draws it nets it (docs/design.md "Bugs"; the user: "they often scamper away when i
// tap them without being caught"). The causes this guards: a bug's tap box was its invisible sprite's, moved by its own
// transition from a flat offset at its spot's scale, 30–110 px off the model as a percher flew in to its trunk, so a tap
// on what's drawn startled it off; my villager in front of a bug took the tap; and a tarantula's rear (its first tap)
// showed nothing in 3D, so the second tap came while it was reared and it charged off every time.
import { expect, test, type Page } from './fixtures.ts';
import { is3d } from './island';

test.use({ viewport: { width: 393, height: 852 } });

type W3 = { modelAt(id: string, lift?: number): [number, number] | null; where(id: string): { x: number; y: number; z: number; hidden: boolean } | null };
type Fx3 = { live(name: string): { x: number; z: number }[] };
/** The 「！」s live over the bug (within 30 u of it): a villager's own 「！」 mark is a 'bang' part too (effects.ts mark),
 *  over its head wherever it stands (a partner surprised by the second roaming bug: two at the first look). */
const bangsAtBug = (page: Page) => page.evaluate(() => {
  const w = window as unknown as { __world3d: W3; __fx3: Fx3 };
  for (let n = 0; n < 60; n++) {
    const p = w.__world3d.where(`bug-${n}`);
    if (p) return w.__fx3.live('bang').filter((b) => Math.hypot(b.x - p.x, b.z + p.z) < 30).length;
  }
  return 0;
});

async function open(page: Page, q: string) {
  await page.addInitScript(() => ((window as { __cues?: string[] }).__cues = []));
  await page.goto(`?demo&${q}`);
  expect(await is3d(page)).toBe(true);
}
/** The bug's model on screen (client px): its id once it's placed, and where it's drawn now. */
async function drawn(page: Page): Promise<[number, number] | null> {
  return page.evaluate(() => {
    const w = (window as unknown as { __world3d: W3 }).__world3d;
    for (let n = 0; n < 60; n++) {
      const at = w.modelAt(`bug-${n}`);
      if (at) {
        const [x, y] = at;
        return x > 15 && x < innerWidth - 15 && y > 60 && y < innerHeight - 50 ? ([x, y] as [number, number]) : null;
      }
    }
    return null;
  });
}
const cues = (page: Page) => page.evaluate(() => (window as unknown as { __cues: string[] }).__cues.slice());

for (const [id, date] of [['robust-cicada', '2026-07-15T11:00'], ['golden-stag', '2026-07-15T21:00']] as const)
  test(`a ${id} flying in to its trunk: a tap where it's drawn nets it`, async ({ page }) => {
    test.slow();
    await open(page, `critter=${id}&date=${date}`);
    // the first moment it's on screen (still flying in, or landing)
    let at: [number, number] | null = null;
    await expect.poll(async () => (at = await drawn(page)), { timeout: 15_000, intervals: [50] }).not.toBeNull();
    await page.mouse.click(at![0], at![1]);
    await expect.poll(() => cues(page)).toContain('scene-catch');
    expect(await cues(page)).not.toContain('scene-bug-flee');
  });

test('a tarantula rears up in 3D under a 「！」 at the first tap; settled, a tap nets it', async ({ page }) => {
  test.slow();
  await open(page, 'critter=tarantula&date=2026-07-15T21:00');
  let at: [number, number] | null = null;
  await expect.poll(async () => (at = await drawn(page)), { timeout: 15_000 }).not.toBeNull();
  await page.waitForTimeout(800); // (under way)
  at = (await drawn(page))!;
  // its rear (REAR_MS, 1.6 s) watched in the page from before the tap, a look every 16 ms: the most 「！」s over it at
  // once and its highest point (a look a round trip from here came after it on a loaded runner, the front back down)
  const y0 = await page.evaluate(() => {
    const w = (window as unknown as { __world3d: W3; __fx3: Fx3; __rear?: { bangs: number; y: number; stop: () => void } });
    const bug = () => {
      for (let n = 0; n < 60; n++) {
        const p = w.__world3d.where(`bug-${n}`);
        if (p) return p;
      }
      return null;
    };
    // (bangsAtBug's count, here)
    const bangs = () => ((p) => (p ? w.__fx3.live('bang').filter((b) => Math.hypot(b.x - p.x, b.z + p.z) < 30).length : 0))(bug());
    const r = { bangs: 0, y: -Infinity, stop: () => clearInterval(id) };
    const id = setInterval(() => ((r.bangs = Math.max(r.bangs, bangs())), (r.y = Math.max(r.y, bug()?.y ?? -Infinity))), 16);
    w.__rear = r;
    return bug()?.y ?? NaN;
  });
  const rear = () => page.evaluate(() => ((r) => ({ bangs: r.bangs, y: r.y }))((window as unknown as { __rear: { bangs: number; y: number } }).__rear));
  await page.mouse.click(at[0], at[1]);
  // reared: the 「！」 over it (one) and its front lifted, on the 3D island (not only its invisible sprite)
  await expect.poll(async () => (await rear()).bangs).toBeGreaterThan(0);
  await expect.poll(async () => (await rear()).y).toBeGreaterThan(y0 + 1);
  expect((await rear()).bangs).toBe(1);
  await page.evaluate(() => (window as unknown as { __rear: { stop(): void } }).__rear.stop());
  expect(await cues(page)).not.toContain('scene-catch');
  // settled (the 「！」 gone): a tap nets it
  // (the expect's own time, 10 s on CI, not 4: the 「！」 goes in the island's next frame after REAR_MS, and drawn in
  // software GL that's ~1 a second, so it was still up at 4 s: gone at 4.8 s here, 1 left at 4 s on a loaded CI)
  await expect.poll(() => bangsAtBug(page)).toBe(0);
  at = (await drawn(page))!;
  await page.mouse.click(at[0], at[1]);
  await expect.poll(() => cues(page)).toContain('scene-catch');
  expect(await cues(page)).not.toContain('scene-bug-flee');
});

test('a bug in front of my villager: a tap on it nets it, not my villager', async ({ page }) => {
  test.slow();
  await open(page, 'critter=grasshopper&date=2026-07-15T11:00');
  let at: [number, number] | null = null;
  await expect.poll(async () => (at = await drawn(page)), { timeout: 15_000 }).not.toBeNull();
  await page.waitForTimeout(800);
  // my villager stood right at it (its button over the bug on screen; the grasshopper hops: again till it covers it)
  let tries = 0;
  const covered = async () => {
    const w = await page.evaluate(() => { const w = (window as unknown as { __world3d: W3 }).__world3d; for (let n = 0; n < 60; n++) { const p = w.where(`bug-${n}`); if (p) return [p.x, -p.z]; } return null; });
    await page.evaluate(([x, z]) => (window as unknown as { __world: { put(x: number, z: number): void } }).__world.put(x, z), [w![0], w![1] - [2, 6, 10][tries++ % 3]] as const);
    await page.waitForTimeout(150);
    at = await drawn(page);
    if (!at || !(await page.evaluate(([x, y]) => !!document.elementFromPoint(x, y)?.closest('button.vil'), at))) return false;
    await page.mouse.click(at[0], at[1]); // (at once: it hops)
    return true;
  };
  await expect.poll(covered, { timeout: 20_000, intervals: [100] }).toBe(true);
  await expect.poll(() => cues(page)).toContain('scene-catch');
  expect(await cues(page)).not.toContain('villager-tap');
});
