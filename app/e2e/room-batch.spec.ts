// A room's whole change at once (docs/design.md "Whose room", "Saved arrangements"): 全部片付ける after a confirmation,
// 取り消す bringing every piece back where it stood, and a saved arrangement (保存, 呼び出す after a confirmation, 取り消す);
// on the two phones (the demo's tabs: one browser, two players) and on a record (e2e/record.ts: the batch goes as one
// group, any player in any room).
import { expect, test, type Browser, type Page } from './fixtures.ts';
import { newRecord } from './record.ts';

test.use({ viewport: { width: 390, height: 844 } });

const Q = '?demo&date=2026-11-04T12:00&preview=0';
type Piece = { id: string; item: string; x: number; z: number; f: number; on?: string; l?: number };
type T = { stats(): { frames: number }; pieces(): Piece[]; fill(codes: string[], f?: number): number; still(): boolean; edit(): { undo: number } | null; saves(): (string | null)[]; surfaces(): { wall: string | null; floor: string | null; size: number } };
const tent = <R,>(page: Page, fn: (t: T) => R) => page.evaluate(`(${fn.toString()})(window.__tent)`) as Promise<R>;
/** The room as anyone sees it: each piece's item, tile, facing and light, in a fixed order (the ids are new after an undo). */
const seen = (page: Page) => tent(page, (t) => t.pieces().map((p) => `${p.item}@${p.x},${p.z}/${p.f}/${p.l ?? ''}`).sort());
const ready = (page: Page) => page.waitForFunction(() => ((window as unknown as { __tent?: { stats(): { frames: number } } }).__tent?.stats()?.frames ?? 0) > 0);

async function openRoom(page: Page, as: 'A' | 'B' | 'G', home: 'A' | 'B' | 'G') {
  await page.goto(`tent/${Q}&as=${as}${home !== 'A' ? `&home=${home}` : ''}`);
  await ready(page);
}
async function editing(page: Page) {
  await page.locator('[data-tent-edit-open]').click();
  await page.waitForFunction(() => (window as unknown as { __tent: { still(): boolean } }).__tent.still());
}

test('全部片付ける in うめ’s house from ウェイ’s phone: confirmed, empty on both phones; 取り消す brings every piece back where it stood', async ({ context }) => {
  await context.addInitScript(() => localStorage.removeItem('island-demo.tent.u'));
  const b = await context.newPage();
  await openRoom(b, 'B', 'B');
  const a = await context.newPage();
  await openRoom(a, 'A', 'B');
  expect(await tent(a, (t) => t.fill(['f7325', 'f1432', 'f4039', 'f4038', 'f1558'], 1))).toBe(5);
  const before = await seen(a);
  await b.bringToFront();
  await expect.poll(() => seen(b)).toEqual(before);
  await a.bringToFront();
  await editing(a);
  await expect(a.locator('[data-tent-undo]')).toHaveAttribute('aria-disabled', 'true');
  await a.locator('[data-tent-clear]').click();
  // the confirmation first: nothing gone yet; キャンセル keeps it all
  await expect(a.locator('[data-action="clear"]')).toBeVisible();
  expect(await tent(a, (t) => t.pieces().length)).toBe(5);
  await a.locator('[data-action="cancel"]').click();
  await expect(a.locator('[data-action="clear"]')).toHaveCount(0);
  expect(await tent(a, (t) => t.pieces().length)).toBe(5);
  await a.locator('[data-tent-clear]').click();
  await a.locator('[data-action="clear"]').click();
  await expect.poll(() => tent(a, (t) => t.pieces().length)).toBe(0);
  await expect(a.locator('[data-tent-count]')).toHaveText('0/60');
  await b.bringToFront();
  await expect.poll(() => tent(b, (t) => t.pieces().length)).toBe(0);
  // 取り消す: one step, every piece back (its tile, facing and light), on both
  await a.bringToFront();
  await a.locator('[data-tent-undo]').click();
  await expect.poll(() => seen(a)).toEqual(before);
  await expect(a.locator('[data-tent-undo]')).toHaveAttribute('aria-disabled', 'true');
  await b.bringToFront();
  await expect.poll(() => seen(b)).toEqual(before);
});

test('a saved arrangement: 保存 in the tent, the room rearranged, 呼び出す puts it back exactly on both phones, 取り消す the rearranged room', async ({ context }) => {
  await context.addInitScript(() => localStorage.removeItem('island-demo.tent'));
  const a = await context.newPage();
  await openRoom(a, 'A', 'A');
  const b = await context.newPage();
  await openRoom(b, 'B', 'A');
  await a.bringToFront();
  expect(await tent(a, (t) => t.fill(['f7341', 'f4081', 'f4053'], 3))).toBe(3);
  await editing(a);
  await a.locator('[data-tab="wall"]').click();
  await a.locator('[data-tent-items] [data-tent-item]').nth(3).click();
  const saved = await seen(a), wall = await tent(a, (t) => t.surfaces().wall);
  expect(wall).not.toBeNull();
  // 保存 in slot 1, named
  await a.locator('[data-tent-saves]').click();
  await expect(a.locator('[data-tent-slot]')).toHaveCount(3);
  await expect(a.locator('[data-tent-slot="1"]')).toHaveAttribute('data-filled', 'false');
  await a.locator('[data-tent-slot="1"] [data-slot-act="save"]').click();
  await a.locator('[data-tent-save-name]').fill('いつもの');
  await a.locator('[data-tent-save-ok]').click();
  await expect.poll(() => tent(a, (t) => t.saves())).toEqual(['いつもの', null, null]);
  // rearranged: everything away, another piece, the wallpaper back to the first
  await a.locator('[data-tent-clear]').click();
  await a.locator('[data-action="clear"]').click();
  await expect.poll(() => tent(a, (t) => t.pieces().length)).toBe(0);
  await a.locator('[data-tent-done]').click();
  expect(await tent(a, (t) => t.fill(['f1432']))).toBe(1);
  const changed = await seen(a);
  await editing(a);
  // 呼び出す, confirmed: the saved room on both phones, the wallpaper too
  await a.locator('[data-tent-saves]').click();
  await a.locator('[data-tent-slot="1"] [data-slot-act="load"]').click();
  await expect(a.locator('[data-tent-ask="load"]')).toContainText('今の部屋を「いつもの」に置き換えますか？');
  await a.locator('[data-tent-ask-ok]').click();
  await expect.poll(() => seen(a)).toEqual(saved);
  expect(await tent(a, (t) => t.surfaces().wall)).toBe(wall);
  await b.bringToFront();
  await expect.poll(() => tent(b, (t) => t.saves())).toEqual(['いつもの', null, null]);
  await expect.poll(() => seen(b)).toEqual(saved);
  await expect.poll(() => tent(b, (t) => t.surfaces().wall)).toBe(wall);
  // 取り消す: the rearranged room again, on both
  await a.bringToFront();
  await a.locator('[data-tent-undo]').click();
  await expect.poll(() => seen(a)).toEqual(changed);
  await b.bringToFront();
  await expect.poll(() => seen(b)).toEqual(changed);
});

// ---- on a record: the clear and its undo each one group the record keeps whole, from the guest in ウェイ's room ----

async function phone(browser: Browser, rec: ReturnType<typeof newRecord>, who: 'A' | 'B' | 'G', home: 'A' | 'B' | 'G') {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', serviceWorkers: 'block' });
  await context.addInitScript(() => localStorage.setItem('e2e.render', 'none'));
  await rec.pair(context, who);
  const page = await context.newPage();
  await page.goto(`tent/${home !== 'A' ? `?home=${home}` : ''}`);
  await ready(page);
  return page;
}

test('on the record: the guest clears ウェイ’s room and takes it back, each one batch kept whole; his phone opening later has it all', async ({ browser }) => {
  const rec = newRecord();
  const g = await phone(browser, rec, 'G', 'A');
  expect(await tent(g, (t) => t.fill(['f7325', 'f1432', 'f4039']))).toBe(3);
  const before = await seen(g);
  await expect.poll(() => rec.sent.length).toBe(3);
  await editing(g);
  await g.locator('[data-tent-clear]').click();
  await g.locator('[data-action="clear"]').click();
  await expect.poll(() => rec.sent.length).toBe(6);
  await g.locator('[data-tent-undo]').click();
  await expect.poll(() => rec.sent.length).toBe(9);
  // and saves the room in ウェイ's slot 2
  await g.locator('[data-tent-saves]').click();
  await g.locator('[data-tent-slot="2"] [data-slot-act="save"]').click();
  await g.locator('[data-tent-save-name]').fill('ゲストの');
  await g.locator('[data-tent-save-ok]').click();
  await expect.poll(() => rec.sent.length).toBe(10);
  for (const s of rec.sent) expect(s.ok, JSON.stringify(s)).toBe(true);
  expect(rec.sent.slice(3, 6).every((s) => s.data.rm === true && s.who === 'G')).toBe(true);
  expect(rec.sent[9]).toMatchObject({ who: 'G', type: 'room_save', data: { sc: 't', n: 2, name: 'ゲストの' } });
  await g.context().close();
  const a = await phone(browser, rec, 'A', 'A');
  await expect.poll(() => seen(a)).toEqual(before);
  await expect.poll(() => tent(a, (t) => t.saves())).toEqual([null, 'ゲストの', null]);
  await a.context().close();
});
