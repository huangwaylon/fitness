// The editor's edits as a phone's 3D island shows them (the user: "I've made many edits to the world via the editor,
// but some aren't reflected: trees or bushes are sometimes missing"): a default oak moved, a bush placed, a copy pasted
// and taken back with ⌘Z, each reaching the other phone (the demo's other tab, over the relay) where the editor put
// it and drawn there as a model: never missing (a plain oak's look, `oak`, had no model: it stood as nothing).
import { expect, test, type Page } from '@playwright/test';
import { is3d } from './island';

test.use({ viewport: { width: 1440, height: 900 } });

type E = {
  tileScreen(c: number, r: number): [number, number];
  layout(): { objects: Map<string, { id: string; k: string; x: number; z: number; f: number; s?: string }> };
  undrawn(): unknown[] | null;
};
const DATE = '2026-11-04T12:00';
const ed = <R,>(page: Page, fn: (e: E) => R) => page.evaluate(`(${fn.toString()})(window.__editor)`) as Promise<R>;
const objs = (page: Page) => ed(page, (e) => [...e.layout().objects.values()].map((o) => ({ ...o })));

async function clickTile(page: Page, c: number, r: number, mods: ('Shift')[] = []) {
  const [x, y] = await page.evaluate(([c, r]) => (window as unknown as { __editor: E }).__editor.tileScreen(c, r), [c, r] as const);
  await page.mouse.move(x, y);
  for (const m of mods) await page.keyboard.down(m);
  await page.mouse.click(x, y);
  for (const m of mods) await page.keyboard.up(m);
}
async function dragTile(page: Page, from: [number, number], to: [number, number]) {
  const a = await page.evaluate(([c, r]) => (window as unknown as { __editor: E }).__editor.tileScreen(c, r), from);
  const b = await page.evaluate(([c, r]) => (window as unknown as { __editor: E }).__editor.tileScreen(c, r), to);
  await page.mouse.move(a[0], a[1]);
  await page.mouse.down();
  for (let i = 1; i <= 6; i++) await page.mouse.move(a[0] + ((b[0] - a[0]) * i) / 6, a[1] + ((b[1] - a[1]) * i) / 6);
  await page.mouse.up();
}

test("the editor's move, placement, paste and undo show the same on a phone, every tree and bush a model", async ({ context }) => {
  test.setTimeout(90_000);
  const editor = await context.newPage(), phone = await context.newPage();
  await phone.setViewportSize({ width: 393, height: 659 });
  await phone.goto(`?demo&as=B&date=${DATE}&critter=none`);
  expect(await is3d(phone), 'the phone draws the island in 3D').toBe(true);
  await editor.goto(`editor/?demo&preview=0&check&date=${DATE}`);
  await editor.waitForFunction(() => (window as unknown as { __editor?: unknown }).__editor);
  await editor.bringToFront();

  // a default oak, moved a tile to the left (えらぶ: drag it)
  const oak = (await objs(editor)).find((o) => o.id === 'oak-m1')!;
  const oakAt = (await phone.evaluate(() => (window as unknown as { __layout: { pos(id: string): [number, number] | null } }).__layout.pos('oak-m1')))!;
  await dragTile(editor, [oak.x, oak.z], [oak.x - 1, oak.z]);
  await expect.poll(async () => (await objs(editor)).find((o) => o.id === 'oak-m1')?.x).toBe(oak.x - 1);

  // a bush placed on the lawn
  const before = new Set((await objs(editor)).map((o) => o.id));
  await editor.locator('[data-kind="bush"]').click();
  await clickTile(editor, 4, 20);
  await expect.poll(async () => (await objs(editor)).length).toBe(before.size + 1);
  await editor.keyboard.press('Escape');
  const bush = (await objs(editor)).find((o) => !before.has(o.id))!;
  expect(bush.k).toBe('bush');

  // copied and pasted beside it, then the paste taken back
  await clickTile(editor, bush.x, bush.z);
  await editor.keyboard.press('Meta+c');
  const [px, py] = await editor.evaluate(() => (window as unknown as { __editor: E }).__editor.tileScreen(6, 20));
  await editor.mouse.move(px, py);
  await editor.keyboard.press('Meta+v');
  await expect.poll(async () => (await objs(editor)).length).toBe(before.size + 2);
  const pasted = (await objs(editor)).find((o) => !before.has(o.id) && o.id !== bush.id)!;
  await editor.keyboard.press('Meta+z');
  await expect.poll(async () => (await objs(editor)).some((o) => o.id === pasted.id)).toBe(false);
  // the 3D check in the editor: nothing undrawn
  await expect.poll(() => ed(editor, (e) => e.undrawn())).toEqual([]);

  // the phone holds the very same objects…
  const want = (await objs(editor)).map((o) => [o.id, o.k, o.x, o.z, o.f, o.s ?? null]).sort();
  await expect
    .poll(() => phone.evaluate(() => {
      const L = (window as unknown as { __layout: { ids(k: string): string[]; obj(id: string): { id: string; k: string; x: number; z: number; f: number; s?: string } } }).__layout;
      const ks = ['oak', 'cedar', 'palm', 'bamboo', 'bush', 'hedge', 'flower', 'goal-tree', 'home', 'spot', 'rock', 'flat-rock', 'garden-rock', 'streetlamp', 'garden-lantern', 'campfire', 'log-stool', 'campsite-sign',
        'park-bench', 'log-bench', 'hammock', 'rod-stand', 'pump', 'shishiodoshi', 'pullup', 'firewood', 'beach-chair', 'sandcastle', 'snowboy', 'tape-deck', 'board', 'bridge', 'stairs', 'museum', 'shop'];
      return ks.flatMap((k) => L.ids(k)).map((id) => { const o = L.obj(id); return [o.id, o.k, o.x, o.z, o.f, o.s ?? null]; }).sort();
    }), { timeout: 10_000 })
    .toEqual(want);
  // …and its 3D island draws every tree and bush as a model, the moved oak where it went, the paste nowhere
  await expect
    .poll(() => phone.evaluate((pastedId) => {
      const L = (window as unknown as { __layout: { ids(k: string): string[] } }).__layout;
      const W = (window as unknown as { __world3d: { where(id: string): { hidden: boolean; model: string } | null } }).__world3d;
      const missing = ['oak', 'cedar', 'palm', 'bamboo', 'bush', 'hedge'].flatMap((k) => L.ids(k)).filter((id) => { const w = W.where(id); return !w || w.hidden; });
      return { missing, pasted: W.where(pastedId) };
    }, pasted.id), { timeout: 15_000 })
    .toEqual({ missing: [], pasted: null });
  const at = await phone.evaluate((ids) => ids.map((id) => (window as unknown as { __world3d: { where(id: string): { x: number; model: string } | null } }).__world3d.where(id)), ['oak-m1', bush.id]);
  expect(at[0]?.model).toMatch(/oak/);
  expect(at[1]?.model).toMatch(/bush/);
  // the oak drawn where the phone's layout has it: a tile (30u) left of where it stood (three's x is the world's)
  const pos = await phone.evaluate(() => (window as unknown as { __layout: { pos(id: string): [number, number] | null } }).__layout.pos('oak-m1'));
  expect(at[0]!.x).toBeCloseTo(pos![0], 0);
  expect(pos![0]).toBe(oakAt[0] - 30);
});
