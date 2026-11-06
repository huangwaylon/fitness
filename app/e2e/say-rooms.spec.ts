// The phrases in a home's room (docs/design.md "Villager taps", "The tent"): the island's say button at the room's
// bottom right opens the same picker above it; a pick shows the phrase in a balloon over my villager in the room (by
// its head, through the room's camera), following it as it walks, gone after ~4 s. In the tent, うめ's house and for
// the guest alike; hidden in もようがえ. Who else sees it (only the phones in the same room): e2e/sync-harness.spec.ts.
//   SHOTS=<dir> npm run e2e -- say-rooms      also writes iPhone-sized screenshots to <dir>/say-room-*.png
import { expect, test, type Page } from './fixtures.ts';
import { sayOwn } from './say.ts';
import { balloonState, expectWhole } from './balloon.ts';

test.use({ viewport: { width: 393, height: 852 } });

const Q = '?demo&date=2026-11-04T12:00&critter=none&visitor=none&preview=0';
const picker = (page: Page) => page.getByRole('dialog', { name: 'なにを いう？' });
const sayBtn = (page: Page) => page.getByRole('button', { name: 'ひとこと いう' });
const balloon = (page: Page) => page.locator('[data-say="mine"]');
type T = { stats(): { frames: number }; still(): boolean; head(w: string): [number, number] | null; walking(w: string): boolean; tile(x: number, z: number): [number, number] };
const tent = <R,>(page: Page, fn: (t: T) => R) => page.evaluate(`(${fn.toString()})(window.__tent)`) as Promise<R>;
const shot = async (page: Page, name: string) => {
  if (process.env.SHOTS) await page.waitForTimeout(350), await page.screenshot({ path: `${process.env.SHOTS}/say-room-${name}.png` });
};

async function openRoom(page: Page, as: 'A' | 'B' | 'G', home: 'A' | 'B' | 'G', at = '2026-11-04T12:00') {
  await page.goto(`tent/${Q.replace('2026-11-04T12:00', at)}&as=${as}${home !== 'A' ? `&home=${home}` : ''}`);
  await page.waitForFunction(() => ((window as unknown as { __tent?: { stats(): { frames: number } } }).__tent?.stats()?.frames ?? 0) > 0);
  await expect(page.locator(`[data-room-home="${home}"]`)).toBeVisible();
  await expect(page.locator('html')).not.toHaveAttribute('data-door', /./, { timeout: 4000 });
}
const settle = (page: Page, who: string) => expect.poll(() => page.evaluate((w) => (window as unknown as { __tent: T }).__tent.walking(w), who), { timeout: 6000 }).toBe(false);

/** What of the button's or the picker's box overlaps another control on screen (their names). */
const overlapping = (page: Page, sel: string) =>
  page.evaluate((sel) => {
    const me = document.querySelector(sel)!, a = me.getBoundingClientRect();
    return [...document.querySelectorAll('button')].filter((b) => !me.contains(b) && b.checkVisibility()).filter((b) => {
      const o = b.getBoundingClientRect();
      return o.width && a.left < o.right && o.left < a.right && a.top < o.bottom && o.top < a.bottom;
    }).map((b) => b.getAttribute('aria-label') ?? b.textContent?.trim());
  }, sel);

/** The balloon by the speaker's head: above it (its foot within GAP + NEAR of the head), the head under its width,
 *  inside the screen and clear of every control. */
const byHead = (page: Page, who: string) =>
  page.evaluate((who) => {
    const b = document.querySelector('[data-say="mine"]')?.getBoundingClientRect();
    const h = (window as unknown as { __tent: T }).__tent.head(who);
    if (!b || !h) return null;
    const ctl = [...document.querySelectorAll('button')].filter((x) => x.checkVisibility()).map((x) => x.getBoundingClientRect()).filter((r) => r.width);
    const over = ctl.some((r) => b.left < r.right && r.left < b.right && b.top < r.bottom && r.top < b.bottom);
    return { above: h[1] - b.bottom, across: h[0] >= b.left && h[0] <= b.right, inside: b.left >= 0 && b.right <= innerWidth && b.top >= 0 && b.bottom <= innerHeight, over };
  }, who);

test('the tent: the say button bottom right, clear of the room’s controls; the picker above it; a phrase over my villager’s head, following its walk, gone after a few seconds', async ({ page }) => {
  await openRoom(page, 'A', 'A');
  await settle(page, 'A');
  await expect(sayBtn(page)).toBeVisible();
  const r = (await sayBtn(page).boundingBox())!;
  expect([r.width, r.height]).toEqual([44, 44]);
  expect(Math.round(393 - (r.x + r.width))).toBe(8);
  expect(852 - (r.y + r.height)).toBeGreaterThanOrEqual(16);
  expect(await overlapping(page, '[data-say-open]')).toEqual([]);
  await shot(page, 'button-day');
  await sayBtn(page).click();
  await expect(picker(page)).toBeVisible();
  // above the button, its right edge at the button's, clear of the room's controls
  // (once its pop is over)
  await expect.poll(async () => Math.abs(((b) => b.x + b.width)((await picker(page).boundingBox())!) - (393 - 12))).toBeLessThan(2);
  const p = (await picker(page).boundingBox())!;
  expect(p.y + p.height).toBeLessThanOrEqual(r.y);
  expect(await overlapping(page, '[data-say-picker]')).toEqual([]);
  await shot(page, 'picker-day');
  // (nothing of mine kept yet: the field at once)
  await picker(page).locator('[data-say-field]').fill('やっほー！');
  await picker(page).locator('[data-say-field]').press('Enter');
  await expect(picker(page)).toHaveCount(0);
  await expect(balloon(page)).toHaveText(/やっほー！/);
  await expect(balloon(page).locator('.who')).toHaveText('ウェイ');
  await expect(balloon(page)).toHaveClass(/placed/);
  const at = (await byHead(page, 'A'))!;
  expect(at.above).toBeGreaterThanOrEqual(0);
  expect(at.above).toBeLessThanOrEqual(12 + 40 + 12);
  expect(at, JSON.stringify(at)).toMatchObject({ across: true, inside: true, over: false });
  await shot(page, 'balloon-day');
  // gone after a few seconds
  await expect(balloon(page)).toHaveCount(0, { timeout: 6000 });
  // it follows a walk: a phrase said as my villager sets off across the room stands by its head where it went
  const head0 = (await tent(page, (t) => t.head('A')))!;
  const [fx, fy] = await tent(page, (t) => t.tile(6, 5));
  await expect.poll(() => page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.matches('[data-room]'), [fx, fy])).toBe(true);
  await page.mouse.click(fx, fy);
  await expect.poll(() => tent(page, (t) => t.walking('A'))).toBe(true);
  await sayOwn(page, 'がんばろう！');
  await expect(balloon(page)).toHaveText(/がんばろう！/);
  await settle(page, 'A');
  const head1 = (await tent(page, (t) => t.head('A')))!;
  expect(Math.abs(head1[0] - head0[0])).toBeGreaterThan(40);
  await expect.poll(() => byHead(page, 'A').then((b) => b && b.across && b.above >= 0 && b.above <= 64), { timeout: 2500 }).toBe(true);
});

test('the say button hides in もようがえ and under ハニワくん’s letter; a tap on the room with the picker open only closes it', async ({ page }) => {
  await openRoom(page, 'A', 'A');
  await settle(page, 'A');
  const mine = () => page.evaluate(() => (window as unknown as { __tent: { mine(): [number, number] } }).__tent.mine());
  const was = await mine();
  await sayBtn(page).click();
  await expect(picker(page)).toBeVisible();
  // a back tile, clear of the picker (it stands over the room's front), once it's the room's under the finger
  const [fx, fy] = await tent(page, (t) => t.tile(1, 1));
  await expect.poll(() => page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.matches('[data-room]'), [fx, fy])).toBe(true);
  await page.mouse.click(fx, fy);
  await expect(picker(page)).toHaveCount(0);
  await page.waitForTimeout(400); // (proving nobody walks)
  expect(await tent(page, (t) => t.walking('A'))).toBe(false);
  expect(await mine()).toEqual(was);
  await page.locator('[data-tent-edit-open]').click();
  await expect(sayBtn(page)).toHaveCount(0);
  await page.locator('[data-tent-done]').click();
  await expect(sayBtn(page)).toBeVisible();
  await page.locator('[data-tent-hha]').click();
  await expect(sayBtn(page)).toHaveCount(0);
});

test('うめ’s house: the say button there too; her own words over her villager', async ({ page }) => {
  await openRoom(page, 'B', 'B');
  await settle(page, 'B');
  await expect(sayBtn(page)).toBeVisible();
  expect(await overlapping(page, '[data-say-open]')).toEqual([]);
  await sayOwn(page, 'おうちへ ようこそ');
  await expect(balloon(page).locator('.text')).toHaveText('おうちへ ようこそ');
  await expect(balloon(page).locator('.who')).toHaveText('うめ');
  expect(await byHead(page, 'B')).toMatchObject({ across: true, inside: true, over: false });
});

test('the guest says things in a room too', async ({ page }) => {
  await openRoom(page, 'G', 'B');
  await settle(page, 'G');
  await sayOwn(page, 'おつかれさま！');
  await expect(balloon(page)).toHaveText(/おつかれさま！/);
  expect(await byHead(page, 'G')).toMatchObject({ across: true, inside: true, over: false });
});

test('at night: the button, the picker and a balloon in the tent', async ({ page }) => {
  await openRoom(page, 'A', 'A', '2026-11-04T22:00');
  await settle(page, 'A');
  await shot(page, 'button-night');
  await sayOwn(page, 'おやすみ〜');
  await sayBtn(page).click();
  await expect(picker(page).locator('[data-say-recent]')).toHaveText(['おやすみ〜']);
  await shot(page, 'picker-night');
  await picker(page).getByRole('button', { name: 'おやすみ〜' }).click();
  await expect(balloon(page)).toHaveClass(/placed/);
  expect(await byHead(page, 'A')).toMatchObject({ across: true, inside: true, over: false });
  await shot(page, 'balloon-night');
});

test('the tent: while a drag turns the camera my villager’s balloon stays whole (its box, not only its text) by its head', async ({ page }) => {
  await openRoom(page, 'A', 'A');
  await settle(page, 'A');
  await sayOwn(page, 'やっほー！');
  await expect(balloon(page)).toHaveClass(/placed/);
  await page.waitForTimeout(300); // (its pop-in)
  const head = async () => ((h) => ({ x: h[0], y: h[1] }))((await tent(page, (t) => t.head('A')))!);
  const near = (await balloonState(page, '[data-say="mine"]', await head()))!.dist + 8;
  const [cx, cy] = await tent(page, (t) => t.tile(6, 5)), h1 = await head();
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  for (let i = 1; i <= 6; i++) await page.mouse.move(cx + i * 15, cy);
  await page.waitForTimeout(100);
  // (the camera turned: the head moved on screen)
  const h0 = await head();
  expect(Math.hypot(h0.x - h1.x, h0.y - h1.y)).toBeGreaterThan(10);
  await expectWhole(page, '[data-say="mine"]', h0, near);
  await page.mouse.up();
});
