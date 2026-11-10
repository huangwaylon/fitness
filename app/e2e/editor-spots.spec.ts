// The visitors' spots in the desktop editor (docs/island-layout.md "Derived, never hand-made", "The editor"): the
// guest's spot goes down next to a flower and Gulliver's beside a palm with no warning (their rules relaxed
// 2026-11-11); the plaza by the flower warns, naming the flower and marking its tile; the derived spots drawn dashed
// with their labels, the old 「ステージ」 never. The plan is a canvas: its labels are read from fillText.
import { expect, test, type Page } from './fixtures.ts';
import { Layout, type Obj } from '../src/lib/layout/model.ts';
import { beachOk, guestOk, plazaOk } from '../src/lib/layout/spots.ts';

test.use({ viewport: { width: 1440, height: 900 } });

type E = {
  tileScreen(c: number, r: number): [number, number];
  layout(): { objects: Map<string, Obj>; codes: Uint8Array; homes: Layout['homes'] };
  issues(): { code: string; ja: string; ids: string[]; tiles: [number, number][] }[];
  auto(): { k: string; label: string }[];
};
const ed = <R,>(page: Page, fn: (e: E) => R) => page.evaluate(`(${fn.toString()})(window.__editor)`) as Promise<R>;

/** The editor's layout, in this process (spots.ts's checks on it). */
async function layoutIn(page: Page): Promise<Layout> {
  const j = await ed(page, (e) => ({ codes: [...e.layout().codes], objects: [...e.layout().objects.values()], homes: e.layout().homes }));
  return new Layout(Uint8Array.from(j.codes), new Map(j.objects.map((o) => [o.id, o])), j.homes);
}
async function place(page: Page, k: string, c: number, r: number) {
  const n = await ed(page, (e) => e.layout().objects.size);
  await page.locator(`[data-kind="${k}"]`).click();
  const [x, y] = await page.evaluate(([c, r]) => (window as unknown as { __editor: E }).__editor.tileScreen(c, r), [c, r] as const);
  await page.mouse.move(x, y);
  await page.mouse.click(x, y);
  await expect.poll(() => ed(page, (e) => e.layout().objects.size)).toBe(n + 1);
  await page.keyboard.press('Escape');
}
const spotIssues = (page: Page) => ed(page, (e) => e.issues().filter((i) => i.code === 'visitor-spot'));

test('the guest next to a flower and Gulliver beside a palm: no warning; the plaza by the flower says why; the derived spots drawn, 「ステージ」 never', async ({ page }) => {
  await page.addInitScript(() => {
    const seen = ((window as unknown as { __texts: Set<string> }).__texts = new Set<string>());
    const fill = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function (t: string, x: number, y: number, w?: number) {
      seen.add(t);
      return w === undefined ? fill.call(this, t, x, y) : fill.call(this, t, x, y, w);
    };
  });
  await page.goto('editor/?demo&preview=0&date=2026-11-04T12:00');
  await expect(page.locator('[data-editor]')).toBeVisible();
  await page.waitForFunction(() => (window as unknown as { __editor?: unknown }).__editor);
  const texts = () => page.evaluate(() => [...(window as unknown as { __texts: Set<string> }).__texts]);
  // no marks down: where the visitors and the guest will stand, drawn
  await expect.poll(() => ed(page, (e) => e.auto().map((a) => a.label))).toEqual(['お客さん（自動）', 'ゲスト（自動）']);
  await expect.poll(texts).toEqual(expect.arrayContaining(['お客さん（自動）', 'ゲスト（自動）', 'ウェイ', 'うめ']));
  expect(await texts()).not.toContain('ステージ');

  // the guest's spot right beside a flower (the old 3 × 3 rule refused it)
  const l = await layoutIn(page);
  const flowers = [...l.objects.values()].filter((o) => o.k === 'flower');
  const by = flowers.flatMap((f) => [[f.x - 1, f.z], [f.x + 1, f.z]] as [number, number][]).find(([c, r]) => guestOk(l, c, r) && !plazaOk(l, c, r));
  expect(by).toBeDefined();
  const [gc, gr] = by!;
  await place(page, 'guest-spot', gc, gr);
  await expect.poll(() => ed(page, (e) => e.auto().map((a) => a.k))).toEqual(['plaza']);
  expect(await spotIssues(page)).toEqual([]);

  // Gulliver beside a palm: a beach tile, a palm diagonally behind his feet (put there when the island has none so near)
  const b = await layoutIn(page);
  const sand: [number, number][] = [];
  for (let r = 0; r < 40; r++) for (let c = 2; c < 18; c++) if (beachOk(b, c, r) && b.kind(c + 1, r + 2) === 'sand') sand.push([c, r]);
  const near = sand.find(([c, r]) => [...b.objects.values()].some((o) => o.k === 'palm' && Math.abs(o.x - c) <= 2 && o.z - r >= 1 && o.z - r <= 3));
  const [bc, br] = near ?? sand[0];
  if (!near) await place(page, 'palm', bc + 1, br + 2);
  await place(page, 'beach-spot', bc, br);
  expect(await spotIssues(page)).toEqual([]);

  // the plaza on the guest's tile: the flower beside it is in the way, named, its tile marked
  await place(page, 'plaza', gc, gr);
  const flower = flowers.find((f) => f.z === gr && Math.abs(f.x - gc) === 1)!;
  await expect.poll(async () => (await spotIssues(page)).map((i) => [i.ids.includes(flower.id), i.tiles.some(([c, r]) => c === flower.x && r === flower.z)])).toEqual([[true, true]]);
  await expect(page.locator('[data-issues]')).toContainText('横に花があります');
  expect(await texts()).not.toContain('ステージ');
});
