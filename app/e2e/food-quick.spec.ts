// ごはん's one-tap adds (review 11-24 T2: drinks, oil, snacks and alcohol are the items most often left out; lib/food/quick.ts):
// on my day while I log it (today; a past day once I add to it, not one only looked at) a meal with entries (and おやつ
// always) has small chips, less a kind it already holds, on its protein chip's line (an empty おやつ's at its
// foot): 「＋飲み物」 「＋油」 (油・ドレッシング; 夜ごはん 「＋お酒」 too, おやつ 「＋間食」); a tap
// logs my usual of the kind (the food I log most, at my usual amount), else the kind's generic (ビール 350ml缶, 麦茶
// コップ1杯 …), its banner's 取り消す taking it out. Anyone else's day has none. On `?demo` (store/demo/rows.ts: no drinks
// in it), the clock pinned (hud.ts openFood). New sheet UI: taps, WebKit too.
import { expect, test, type Page } from './fixtures.ts';
import { openFood } from './hud.ts';

const dlg = (page: Page) => page.locator('dialog[open]');
const sheet = (page: Page) => page.locator('dialog[open] :is(.titlebar, [data-food-sheet])');
/** The open sheet's animations finished and its scroll still (a tap lands where it was aimed). */
async function settled(page: Page) {
  await dlg(page).evaluate((d) => Promise.all(d.getAnimations({ subtree: true }).map((a) => a.finished.catch(() => {}))));
  let last = -1;
  await expect.poll(async () => {
    const v = await dlg(page).locator('[data-food-sheet]').evaluate((e) => e.scrollTop);
    const still = v === last;
    last = v;
    return still;
  }).toBe(true);
}

test('one tap: the generic when I have none (ビール 350ml缶), 取り消す; my own usual once I have one; none on another’s day', async ({ page }) => {
  await openFood(page, { how: 'tap' });
  const s = sheet(page);
  const chips = (m: string) => s.locator(`section[data-meal=${m}] [data-quick-add]`);
  await expect(chips('b')).toHaveText(['＋飲み物', '＋油']); // (12:30: breakfast and lunch in)
  await expect(chips('d')).toHaveCount(0); // empty: its ＋ and copies only
  await expect(chips('s')).toHaveText(['＋飲み物', '＋間食']); // empty, but its 間食
  // a 28px pill (its hit 44: theme.css .hit44), on the protein chip's line; an empty meal's row as tall as the hit
  const pm = (await s.locator('section[data-meal=b] [data-meal-protein]').boundingBox())!;
  const box = (await chips('b').first().boundingBox())!;
  expect(box.height).toBeGreaterThanOrEqual(28);
  expect(Math.abs(box.y + box.height / 2 - (pm.y + pm.height / 2))).toBeLessThan(2);
  expect((await s.locator('section[data-meal=s] [data-quick-adds]').boundingBox())!.height).toBeGreaterThanOrEqual(44);

  // dinner logged (昨日と同じ): its chips, お酒 too; no お酒 of mine: the generic, at its portion
  await s.locator('section[data-meal=d] [data-copy=prev]').tap();
  await dlg(page).locator('.banner').getByRole('button', { name: '取り消す' }).waitFor();
  await expect(chips('d')).toHaveText(['＋飲み物', '＋油', '＋お酒']);
  const dinner = s.locator('section[data-meal=d] [data-entry]');
  const n = await dinner.count();
  const beer = s.locator('section[data-meal=d] [data-quick-add=alcohol]');
  await expect(beer).toHaveAttribute('aria-label', 'お酒を追加（ビール）');
  await beer.scrollIntoViewIfNeeded();
  await beer.tap();
  await expect(dinner).toHaveCount(n + 1, { timeout: 15_000 }); // (the catalog's first fetch)
  await expect(dinner.last()).toContainText('ビール');
  await expect(dinner.last()).toContainText('350ml缶');
  const banner = dlg(page).locator('.banner');
  await expect(banner).toContainText('「ビール」を夜ごはんに追加しました');
  await banner.getByRole('button', { name: '取り消す' }).tap();
  await expect(dinner).toHaveCount(n);

  // 牛乳 logged once (朝ごはん's search): now my usual 飲み物, at my amount
  await s.locator('[data-add=b]').tap();
  await s.locator('[data-food-q]').fill('牛乳');
  const milk = s.locator('[data-food-results]').getByRole('button', { name: /^牛乳/ }).first();
  await expect(milk).toBeVisible({ timeout: 15_000 });
  await milk.tap();
  await settled(page);
  await s.locator('[data-food-open-add]').tap();
  await s.locator('[data-food-finish]').tap();
  await expect(s.locator('.navbar h2')).toHaveText('ごはん');
  await expect(chips('b')).toHaveText(['＋油']); // (a drink in it now: no ＋飲み物)
  const drink = s.locator('section[data-meal=s] [data-quick-add=drink]');
  await expect(drink).toHaveAttribute('aria-label', '飲み物を追加（牛乳）');
  await drink.scrollIntoViewIfNeeded();
  await drink.tap();
  const snack = s.locator('section[data-meal=s] [data-entry]');
  await expect(snack.last()).toContainText('牛乳');
  await expect(snack.last()).toContainText('コップ1杯');
  await expect(banner).toContainText('「牛乳」をおやつに追加しました');
  await expect(chips('s')).toHaveText(['＋間食']);

  // yesterday, only looked at: none; once I open a meal's ＋ on it (logging it), its meals have them
  await s.locator('[data-nav=back]').tap();
  await expect(s.locator('section[data-meal=b] [data-entry]').first()).toBeVisible();
  await expect(s.locator('[data-quick-add]')).toHaveCount(0);
  await s.locator('[data-add=l]').tap();
  await s.getByRole('button', { name: '戻る' }).tap();
  await expect(s.locator('.navbar h2')).toHaveText('ごはん');
  await expect(chips('s').first()).toBeVisible();
  // today again: its own, as before
  await s.locator('[data-nav=today]').tap();
  await expect(chips('s')).toHaveText(['＋間食']);

  // うめ's day: read-only, no chips
  await s.locator('select[data-pick=who]').selectOption('B');
  await expect(s.locator('[data-food-summary]')).toHaveClass(/pB/);
  await expect(s.locator('[data-quick-add]')).toHaveCount(0);
});
