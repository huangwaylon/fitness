// The editor on an iPhone 15 (docs/island-layout.md "The editor"; the user, 2026-11-25: "update the design of the editor
// such that it's usable on iphone15"): the plan full-bleed under a top bar, a tool dock, the selection's card; a tap
// selects and places, one finger drags the selection, paints or pans, two pinch; every shortcut a button (回す, 複製,
// 削除, 取り消す). Fingers are synthetic touch pointers (e2e/editor.ts fingers), taps the browser's own.
import { expect, test, type Page } from './fixtures.ts';
import { fingers, line } from './editor.ts';

test.use({ viewport: { width: 393, height: 852 }, hasTouch: true, isMobile: true });

type E = {
  tileScreen(c: number, r: number): [number, number];
  view(): { s: number; ox: number; oy: number };
  layout(): { objects: Map<string, { id: string; k: string; x: number; z: number; f: number }>; kind(c: number, r: number): string };
};
const DATE = '2026-11-04T12:00';
const ed = <R,>(page: Page, fn: (e: E, a: never) => R, arg?: unknown) => page.evaluate(`(${fn.toString()})(window.__editor, ${JSON.stringify(arg ?? null)})`) as Promise<R>;
const obj = (page: Page, id: string) => ed(page, (e, id: string) => { const o = e.layout().objects.get(id); return o ? { x: o.x, z: o.z, f: o.f } : null; }, id);
const count = (page: Page) => ed(page, (e) => e.layout().objects.size);
const at = (page: Page, c: number, r: number) => ed(page, (e, [c, r]: [number, number]) => e.tileScreen(c, r), [c, r]);

async function open(page: Page) {
  await page.goto(`editor/?demo&preview=0&date=${DATE}`);
  await expect(page.locator('[data-editor][data-layout="phone"]')).toBeVisible();
  await page.waitForFunction(() => (window as unknown as { __editor?: unknown }).__editor);
}

test('the phone layout: the plan full-bleed, the bar, the dock, every control a finger wide, nothing past 393 px', async ({ page }) => {
  await open(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(393);
  const plan = (await page.locator('[data-plan]').boundingBox())!;
  expect([plan.x, plan.width, plan.height]).toEqual([0, 393, 852]);
  await expect(page.locator('.tools, .side')).toHaveCount(0);
  for (const sel of ['[data-dock]', '[data-undo]', '[data-redo]', '[data-show3d]']) {
    for (const b of await page.locator(sel).evaluateAll((es) => es.map((e) => e.getBoundingClientRect()))) {
      expect(b.height, sel).toBeGreaterThanOrEqual(44);
      expect(b.width, sel).toBeGreaterThanOrEqual(44);
      expect(b.right, sel).toBeLessThanOrEqual(393);
    }
  }
  // the palette and 島 as sheets over the plan; ✕ closes
  await page.locator('[data-dock="place"]').tap();
  await expect(page.locator('[data-sheet="palette"] [data-kind="oak"]')).toBeVisible();
  await page.locator('[data-sheet-close]').tap();
  await page.locator('[data-dock="island"]').tap();
  await expect(page.locator('[data-sheet="island"] [data-issues]')).toBeVisible();
  await expect(page.locator('[data-sheet="island"] [data-island-size]')).toBeVisible();
});

test('a tap selects, a finger drags it, 回す, 複製, 削除, 取り消す; the move kept after a reload', async ({ page }) => {
  await open(page);
  const b0 = (await obj(page, 'bench-mae'))!;
  await page.touchscreen.tap(...(await at(page, b0.x, b0.z)));
  await expect(page.locator('[data-card] [data-inspect]')).toContainText('ベンチ');
  // one finger on the selected bench moves it two across and one forward
  await fingers(page, line(await at(page, b0.x, b0.z), await at(page, b0.x + 2, b0.z - 1)));
  await expect.poll(() => obj(page, 'bench-mae')).toMatchObject({ x: b0.x + 2, z: b0.z - 1 });
  await page.locator('[data-card] [data-turn]').tap();
  await expect.poll(async () => (await obj(page, 'bench-mae'))?.f).toBe((b0.f + 1) % 4);
  // 複製: a copy beside it, selected; 削除 takes the copy; 取り消す brings it back
  const n = await count(page);
  await page.locator('[data-card] [data-duplicate]').tap();
  await expect.poll(() => count(page)).toBe(n + 1);
  await page.locator('[data-card] [data-delete]').tap();
  await expect.poll(() => count(page)).toBe(n);
  await expect(page.locator('[data-card] [data-inspect]')).toHaveCount(0);
  await page.locator('[data-undo]').tap();
  await expect.poll(() => count(page)).toBe(n + 1);
  await page.locator('[data-undo]').tap();
  await expect.poll(() => count(page)).toBe(n);
  // a drag that starts off the selection pans (the bench stays)
  const v0 = await ed(page, (e) => e.view().ox);
  await fingers(page, line([200, 400], [260, 400]));
  await expect.poll(() => ed(page, (e) => e.view().ox)).toBeCloseTo(v0 + 60, 0);
  // the island's record has it: kept as the editor opens again
  await page.reload();
  await page.waitForFunction(() => (window as unknown as { __editor?: unknown }).__editor);
  await expect.poll(() => obj(page, 'bench-mae')).toMatchObject({ x: b0.x + 2, z: b0.z - 1, f: (b0.f + 1) % 4 });
});

test('置く: picked from the sheet, a tap puts it down; 塗る: one finger paints; two fingers pinch and paint nothing', async ({ page }) => {
  await open(page);
  await page.locator('[data-dock="place"]').tap();
  await page.locator('[data-kind="oak"]').tap();
  await expect(page.locator('[data-sheet]')).toHaveCount(0);
  await expect(page.locator('[data-card] [data-placing="oak"]')).toBeVisible();
  const n = await count(page);
  await page.touchscreen.tap(...(await at(page, 12, 20)));
  await expect.poll(() => count(page)).toBe(n + 1);
  // a tap on the river (a tile of it in the open plan) can't
  const river = await ed(page, (e) => {
    for (let r = 0; r < 156; r++) for (let c = 0; c < 20; c++) {
      const [x, y] = e.tileScreen(c, r);
      if (e.layout().kind(c, r) === 'river' && y > 140 && y < 600 && x > 20 && x < 370) return [x, y] as [number, number];
    }
    return null;
  });
  await page.touchscreen.tap(...river!);
  await expect(page.getByRole('status')).toContainText('置けません');
  expect(await count(page)).toBe(n + 1);

  await page.locator('[data-dock="paint"]').tap();
  await page.locator('[data-card] [data-brush="sand"]').tap();
  const kind = (c: number, r: number) => ed(page, (e, [c, r]: [number, number]) => e.layout().kind(c, r), [c, r]);
  expect(await kind(5, 14)).toBe('grass');
  await fingers(page, line(await at(page, 5, 14), await at(page, 7, 14)));
  await expect.poll(() => kind(6, 14)).toBe('sand');
  expect(await kind(5, 14)).toBe('sand');
  // two fingers: the zoom grows about their middle, no tile painted
  const s0 = await ed(page, (e) => e.view().s), [mx, my] = await at(page, 4, 18);
  const row = () => Promise.all([2, 3, 4, 5, 6].map((c) => kind(c, 18)));
  const was = await row();
  await fingers(page, Array.from({ length: 7 }, (_, i) => [[mx - 30 - i * 12, my], [mx + 30 + i * 12, my + 4]]));
  await expect.poll(() => ed(page, (e) => e.view().s)).toBeGreaterThan(s0 * 1.8);
  expect(await row()).toEqual(was);
});

test('川: a tap on a knot picks it and 点を消す takes it away; a finger drags a knot a tile at a time; ✕ leaves the river as it was', async ({ page }) => {
  await open(page);
  await page.locator('[data-dock="river"]').tap();
  await expect(page.locator('[data-river-tool]')).toBeVisible();
  await expect(page.locator('.dock')).toHaveCount(0);
  await page.waitForFunction(() => (window as unknown as { __river?: unknown }).__river);
  type R = { knots(): { c: number; r: number }[]; knotScreen(k: number): [number, number]; tileScreen(c: number, r: number): [number, number] };
  const rv = <T,>(fn: (r: R, a: never) => T, a?: unknown) => page.evaluate(`(${fn.toString()})(window.__river, ${JSON.stringify(a ?? null)})`) as Promise<T>;
  const k0 = await rv((r) => r.knots());
  // the staircase's middle knot (5: 12, 24) picked by a tap, then taken away
  await page.touchscreen.tap(...(await rv((r) => r.knotScreen(5))));
  await page.locator('[data-river-drop]').tap();
  await expect.poll(() => rv((r) => r.knots().length)).toBe(k0.length - 1);
  // 取り消す, then knot 5 dragged a tile up (back) with one finger
  await page.locator('[data-river-undo]').tap();
  await expect.poll(() => rv((r) => r.knots().length)).toBe(k0.length);
  const from = await rv((r) => r.knotScreen(5)), to = await rv((r) => r.tileScreen(12, 25));
  await fingers(page, line(from, to));
  await expect.poll(() => rv((r) => r.knots()[5])).toEqual({ c: 12, r: 25 });
  await page.locator('[data-river-cancel]').tap();
  await expect(page.locator('[data-river-tool]')).toHaveCount(0);
  await expect(page.locator('.dock')).toBeVisible();
});
