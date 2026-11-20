// マイ食品's own pictures (docs/food-data.md "Pictures": `food_custom` `img`, the relay's /img/<id>, route-mocked here):
// on `?demo`, A's 社食の日替わり定食 has a photo and B's おにぎり an illustration (`ig`). Their rows draw the picture, the
// amount shows it (the photo without the イメージ badge, the illustration with it), the enlarged view likewise (the
// photo without the 「生成」 line), and the day's entry once logged; a picture the relay doesn't answer keeps the tile.
import { expect, test, type Page } from './fixtures.ts';
import { openFood } from './hud.ts';

const RELAY_IMG = 'https://island-fund-relay.island-fund-relay.workers.dev/img/';
const A1 = 'de0000000000000000000000000000a1', B1 = 'de0000000000000000000000000000b1';
const dlg = (page: Page) => page.locator('dialog[open]');
const sheet = (page: Page) => page.locator('dialog[open] :is(.titlebar, [data-food-sheet])');
const slid = (page: Page) => dlg(page).evaluate((d) => Promise.all(d.getAnimations({ subtree: true }).map((a) => a.finished.catch(() => {}))));

/** A 384 px JPEG drawn in the page (a plate of colour: no file in the repo), as bytes. */
async function jpegOf(page: Page, colour: string): Promise<Buffer> {
  const b64 = await page.evaluate(async (c) => {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 384;
    const g = cv.getContext('2d')!;
    g.fillStyle = c;
    g.fillRect(0, 0, 384, 384);
    g.fillStyle = '#fff';
    g.beginPath();
    g.arc(192, 192, 120, 0, Math.PI * 2);
    g.fill();
    const b = await new Promise<Blob>((ok) => cv.toBlob((x) => ok(x!), 'image/jpeg', 0.8));
    const u = new Uint8Array(await b.arrayBuffer());
    let s = '';
    for (const x of u) s += String.fromCharCode(x);
    return btoa(s);
  }, colour);
  return Buffer.from(b64, 'base64');
}

/** ごはん opened at `date`, the relay's /img/ answered with A1's and B1's pictures (`serve`); the ids asked. */
async function openPictured(page: Page, date = '2026-11-04T12:30', serve = true) {
  const asked: string[] = [];
  if (serve) {
    const pics: Record<string, Buffer> = { [A1]: await jpegOf(page, '#c0603a'), [B1]: await jpegOf(page, '#4a8a5a') };
    await page.route(`${RELAY_IMG}*`, (r) => {
      const id = r.request().url().slice(RELAY_IMG.length);
      asked.push(id);
      const b = pics[id];
      return b ? r.fulfill({ status: 200, body: b, headers: { 'content-type': 'image/jpeg', 'access-control-allow-origin': '*' } }) : r.fulfill({ status: 404 });
    });
  }
  await openFood(page, { date });
  return asked;
}

test('a custom food\'s picture: its row, its amount (a photo: no イメージ; an illustration: イメージ), enlarged, the day\'s entry', async ({ page }) => {
  const asked = await openPictured(page);
  const s = sheet(page);
  await s.locator('[data-add=l]').tap();
  await slid(page);
  const a1 = s.locator('[data-food-customs] [data-custom=mdemoa1] [data-thumb]');
  const b1 = s.locator('[data-food-customs] [data-custom=mdemob1] [data-thumb]');
  await a1.scrollIntoViewIfNeeded(); // (drawn as it nears the screen)
  await expect(a1).toHaveAttribute('data-thumb', 'img', { timeout: 15_000 });
  await expect(b1).toHaveAttribute('data-thumb', 'img');
  expect([...new Set(asked)].sort()).toEqual([A1, B1]);
  // the illustration's amount: the badge
  await s.locator('[data-food-customs] [data-custom=mdemob1]').tap();
  await s.locator('[data-food-open-more]').tap(); // (the row opened in place: its 詳しく → the amount)
  const pic = s.locator('[data-food-pic]');
  await expect(pic.locator('[data-thumb]')).toHaveAttribute('data-thumb', 'img');
  await expect(pic.locator('.badge')).toHaveText('イメージ');
  await dlg(page).getByRole('button', { name: '戻る', exact: true }).tap();
  await slid(page);
  // the photo's: none, enlarged without the badge or the generated line
  await s.locator('[data-food-customs] [data-custom=mdemoa1]').tap();
  await s.locator('[data-food-open-more]').tap();
  await expect(pic.locator('[data-thumb]')).toHaveAttribute('data-thumb', 'img');
  await expect(pic.locator('.badge')).toHaveCount(0);
  await page.screenshot({ path: `/tmp/food-review/shots/photo-amount-${test.info().project.name}.png` });
  await pic.tap();
  const big = page.locator('[data-food-photo]');
  await expect(big.locator('[data-thumb]')).toHaveAttribute('data-thumb', 'img');
  await expect(big.getByRole('img', { name: '社食の日替わり定食の写真' })).toBeVisible();
  await expect(big.locator('.badge')).toHaveCount(0);
  await expect(big.locator('[data-photo-credit]')).toHaveCount(0);
  await page.screenshot({ path: `/tmp/food-review/shots/photo-big-${test.info().project.name}.png` });
  await page.keyboard.press('Escape');
  await expect(big).toHaveCount(0);
  // logged: the day's entry draws it from the live food
  await s.locator('[data-done]').tap();
  await s.locator('[data-food-finish]').tap(); // (back in the meal's search: 完了 → the day)
  const entry = s.locator('section[data-meal=l] [data-entry]').filter({ has: page.locator('[data-thumb][data-cat]') }).last();
  await entry.scrollIntoViewIfNeeded();
  await expect(entry.locator('[data-thumb]')).toHaveAttribute('data-thumb', 'img', { timeout: 15_000 });
  await page.screenshot({ path: `/tmp/food-review/shots/photo-day-${test.info().project.name}.png` });
});

test('by night, and with the relay not answering: the tile', async ({ page }) => {
  await openPictured(page, '2026-11-04T22:00');
  await expect(page.locator('html')).toHaveAttribute('data-tod', 'night');
  const s = sheet(page);
  await s.locator('[data-add=d]').tap();
  await slid(page);
  const a1 = s.locator('[data-food-customs] [data-custom=mdemoa1] [data-thumb]');
  await a1.scrollIntoViewIfNeeded();
  await expect(a1).toHaveAttribute('data-thumb', 'img', { timeout: 15_000 });
  await page.screenshot({ path: `/tmp/food-review/shots/photo-search-night-${test.info().project.name}.png` });
  await page.unrouteAll({ behavior: 'ignoreErrors' });
});

test('a picture the relay can\'t give (offline, gone): the category\'s tile, never a broken box', async ({ page }) => {
  await openPictured(page, '2026-11-04T12:30', false); // (the fixtures refuse /img/: no answer)
  const s = sheet(page);
  await s.locator('[data-add=l]').tap();
  await slid(page);
  const a1 = s.locator('[data-food-customs] [data-custom=mdemoa1] [data-thumb]');
  await a1.scrollIntoViewIfNeeded();
  await expect(a1).toHaveAttribute('data-thumb', 'cat');
  await page.screenshot({ path: `/tmp/food-review/shots/photo-search-day-tile-${test.info().project.name}.png` });
});
