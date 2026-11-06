// The editor's 3D preview (docs/island-layout.md "The editor"; the user: "add K.K.'s figure to the editor's 3D preview
// too, the 3d editor preview is missing a lot of things in general like pond … i also want the ability to pan in the
// 3d editor"): a pond put down on the plan is the island's pond there (its water, bed and stones), K.K. sits on his
// stool and goes with it when it's moved and turned, a drag on open ground pans the phone view (kept over the island)
// and ⌖ puts it back, a press on a piece is still the もようがえ's; and a still preview draws nothing.
import { expect, test, type Page } from './fixtures.ts';

test.use({ viewport: { width: 1440, height: 900 } });

type P = {
  frames(): number;
  shadowFrames(): number;
  cam(): { mode: string; x: number; z: number; zoom: number };
  groups(): string[];
  kk(): { x: number; z: number; yaw: number; shown: boolean; model: boolean } | null;
};
type E = { tileScreen(c: number, r: number): [number, number]; layout(): { objects: Map<string, { id: string; k: string; x: number; z: number; f: number }> } };
const DATE = '2026-11-04T12:00';
const pv = <R,>(page: Page, fn: (p: P) => R) => page.evaluate(`(${fn.toString()})(window.__preview3d)`) as Promise<R>;
const ed = <R,>(page: Page, fn: (e: E) => R) => page.evaluate(`(${fn.toString()})(window.__editor)`) as Promise<R>;
const kkModel = (page: Page) => page.evaluate(() => (window as unknown as { __villagers3?: { model(s: string): string | null } }).__villagers3?.model('kk') ?? null);

async function tileAt(page: Page, c: number, r: number) {
  return page.evaluate(([c, r]) => (window as unknown as { __editor: E }).__editor.tileScreen(c, r), [c, r] as const);
}
async function dragTile(page: Page, from: [number, number], to: [number, number]) {
  const a = await tileAt(page, ...from), b = await tileAt(page, ...to);
  await page.mouse.move(a[0], a[1]);
  await page.mouse.down();
  for (let i = 1; i <= 6; i++) await page.mouse.move(a[0] + ((b[0] - a[0]) * i) / 6, a[1] + ((b[1] - a[1]) * i) / 6);
  await page.mouse.up();
}

test("the plan's pond and K.K.'s stool in the preview: the pond the island's, K.K. on his stool, moved and turned with it", async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto(`editor/?demo&date=${DATE}`);
  await page.waitForFunction(() => (window as unknown as { __editor?: unknown; __preview3d?: unknown }).__editor && (window as unknown as { __preview3d?: unknown }).__preview3d);
  // the homes, the bridge and the stairs: the island's own groups; K.K. seated on his stool, NH's model of him
  await expect.poll(() => pv(page, (p) => p.groups().sort()), { timeout: 20_000 }).toEqual(expect.arrayContaining(['home:home-B', 'home:home-G', 'structure:bridge', 'structure:stairs']));
  await expect.poll(() => kkModel(page), { timeout: 20_000 }).toBe('kk-slider');
  const kk0 = (await pv(page, (p) => p.kk()))!;
  expect(kk0).toMatchObject({ shown: true, model: true });

  // a pond put down on the lawn: its water, bed and stones
  const before = new Set(await ed(page, (e) => [...e.layout().objects.keys()]));
  await page.locator('[data-kind="pond"]').click();
  const [gx, gy] = await tileAt(page, 12, 14);
  await page.mouse.move(gx, gy);
  await page.mouse.click(gx, gy);
  await page.keyboard.press('Escape');
  const pond = (await ed(page, (e) => [...e.layout().objects.values()].filter((o) => o.k === 'pond').map((o) => o.id))).find((id) => !before.has(id));
  expect(pond, 'the pond placed').toBeTruthy();
  await expect.poll(() => pv(page, (p) => p.groups())).toContain(`pond:${pond}`);

  // K.K.'s stool dragged a tile to the left (えらぶ): he sits on it there; R turns him with it
  await page.getByRole('button', { name: '選択' }).click();
  const st = (await ed(page, (e) => { const o = e.layout().objects.get('kk-slider')!; return [o.x, o.z] as [number, number]; }));
  await dragTile(page, st, [st[0] - 1, st[1]]);
  await expect.poll(() => ed(page, (e) => e.layout().objects.get('kk-slider')!.x)).toBe(st[0] - 1);
  await expect.poll(() => pv(page, (p) => p.kk()!.x)).toBe(kk0.x - 30);
  await page.keyboard.press('r');
  await expect.poll(() => pv(page, (p) => p.kk()!.yaw)).not.toBe(kk0.yaw);
});

test('the phone view pans with a drag on open ground (kept over the island), ⌖ puts it back; a still preview draws nothing', async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 659 });
  await page.goto(`editor/?demo&view=phone&date=${DATE}`);
  await page.waitForFunction(() => (window as unknown as { __preview3d?: unknown }).__preview3d);
  await expect.poll(() => kkModel(page), { timeout: 20_000 }).toBe('kk-slider');
  // (still: once settled, no frame is drawn)
  let was = -1;
  await expect.poll(async () => {
    const n = await pv(page, (p) => p.frames()), still = n === was;
    was = n;
    return still;
  }, { intervals: [700], timeout: 20_000 }).toBe(true);
  await page.waitForTimeout(800);
  expect(await pv(page, (p) => p.frames())).toBe(was);

  const c0 = await pv(page, (p) => p.cam());
  expect(c0).toMatchObject({ mode: 'phone', x: 195, z: 300 });
  // a drag up and to the left: the ground follows the finger (the front comes into view, the east side)
  await page.mouse.move(250, 450);
  await page.mouse.down();
  for (let i = 1; i <= 8; i++) await page.mouse.move(250 - i * 10, 450 - i * 20);
  await page.mouse.up();
  const c1 = await pv(page, (p) => p.cam());
  expect(c1.z).toBeLessThan(c0.z - 50);
  expect(c1.x).toBeGreaterThan(c0.x + 30);
  // far off to the side: it stops at the island's edge
  for (let k = 0; k < 4; k++) {
    await page.mouse.move(20, 300);
    await page.mouse.down();
    for (let i = 1; i <= 6; i++) await page.mouse.move(20 + i * 60, 300);
    await page.mouse.up();
  }
  const c2 = await pv(page, (p) => p.cam());
  expect(c2.x).toBeGreaterThanOrEqual(-120);
  expect(c2.x).toBeLessThan(c1.x);
  await page.locator('[data-recentre]').click();
  await expect.poll(() => pv(page, (p) => p.cam())).toMatchObject({ x: 195, z: 300, zoom: 1 });
});

test("the phone view's もようがえ: a press on a piece picks it up (no pan), a drag on open water pans with it held", async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 659 });
  await page.goto(`editor/?demo&view=phone&edit&date=${DATE}&cam=120`);
  await page.waitForFunction(() => (window as unknown as { __islandEdit?: unknown; __preview3d?: unknown }).__islandEdit && (window as unknown as { __preview3d?: unknown }).__preview3d);
  // the tape deck on the front lawn, where the stage has it on screen (its foot, a little up its body)
  const at = (await page.evaluate(() => (window as unknown as { __layout: { pos(id: string): [number, number] | null } }).__layout.pos('tape-deck')))!;
  const cam0 = await pv(page, (p) => p.cam());
  const scr = await page.evaluate(([x, z]) => (window as unknown as { __islandEdit: { screenOf(x: number, z: number): [number, number] | null } }).__islandEdit.screenOf(x, z), at);
  expect(scr, 'the tape deck on screen').not.toBeNull();
  const [sx, sy] = [scr![0], scr![1] - 6];
  await page.mouse.move(sx, sy);
  await page.mouse.down();
  for (let i = 1; i <= 6; i++) await page.mouse.move(sx, sy - i * 12);
  await page.mouse.up();
  expect(await pv(page, (p) => p.cam())).toEqual(cam0);
  await expect.poll(() => page.evaluate(() => (window as unknown as { __islandEdit: { sel(): { id: string } | null } }).__islandEdit.sel()?.id ?? null)).toBe('tape-deck');
  // with it held, a drag on open water (the sea off the west shore: nothing stands there) pans; it stays held
  await page.mouse.move(8, 200);
  await page.mouse.down();
  for (let i = 1; i <= 6; i++) await page.mouse.move(8, 200 + i * 12);
  await page.mouse.up();
  expect((await pv(page, (p) => p.cam())).z).toBeGreaterThan(cam0.z + 20);
  expect(await page.evaluate(() => (window as unknown as { __islandEdit: { sel(): { id: string } | null } }).__islandEdit.sel()?.id ?? null)).toBe('tape-deck');
});

test("the orbit view's turn and zoom redraw the frame, not the shadow map (its sun and shadow camera stay put)", async ({ page }) => {
  await page.goto(`editor/?demo&date=${DATE}`);
  await page.waitForFunction(() => (window as unknown as { __preview3d?: unknown }).__preview3d);
  await expect.poll(() => kkModel(page), { timeout: 20_000 }).toBe('kk-slider');
  await expect.poll(() => pv(page, (p) => p.cam().mode)).toBe('orbit');
  // (settled: no frame drawn)
  let was = -1;
  await expect.poll(async () => {
    const n = await pv(page, (p) => p.frames()), still = n === was;
    was = n;
    return still;
  }, { intervals: [700], timeout: 20_000 }).toBe(true);
  const s0 = await pv(page, (p) => p.shadowFrames());
  const box = (await page.locator('[data-preview] canvas').boundingBox())!;
  const [cx, cy] = [box.x + box.width / 2, box.y + box.height / 2];
  // a turn (a left drag) and a zoom (the wheel)
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  for (let i = 1; i <= 6; i++) await page.mouse.move(cx + i * 15, cy);
  await page.mouse.up();
  await page.mouse.wheel(0, -200);
  await expect.poll(() => pv(page, (p) => p.frames())).toBeGreaterThan(was + 2);
  expect(await pv(page, (p) => p.shadowFrames())).toBe(s0);
});
