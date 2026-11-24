// iOS asking for the location again (components/map/askAgain.ts, docs/travel.md "Maps"): a launch whose permission reads
// 'prompt' after an earlier launch had a fix says once, after that fix, where to make the answer stick; never again on
// this phone, and never when the permission reads 'granted'. Hermetic: the Permissions API and the watch faked (each
// launch's answer from sessionStorage `e2e.perm`), the relay route-fulfilled, no map drawn.
import { expect, test, type BrowserContext, type Page } from './fixtures.ts';
import { islandUp } from './island.ts';
import { fromMenu } from './hud.ts';
import { newRecord } from './record.ts';
import { fixturePlaces, routePlaces } from './places.ts';

test.use({ viewport: { width: 393, height: 852 } });
const view = (p: Page) => p.locator('dialog[open] [data-places]');
const note = (p: Page) => view(p).locator('[data-map-note]');
const AGAIN = '毎回たずねられる場合は 設定の Safari › 位置情報 を「許可」に';

async function phone(page: Page, context: BrowserContext) {
  await context.addInitScript(() => {
    localStorage.setItem('e2e.render', 'none');
    const query = navigator.permissions.query.bind(navigator.permissions);
    navigator.permissions.query = (d) =>
      d.name === 'geolocation' ? Promise.resolve({ state: sessionStorage.getItem('e2e.perm') ?? 'prompt' } as PermissionStatus) : query(d);
    const w = window as unknown as { __fixed?: number };
    navigator.geolocation.watchPosition = (ok) => (void Promise.resolve().then(() => (ok({ coords: { latitude: 26.69, longitude: 127.88, accuracy: 30 } } as GeolocationPosition), (w.__fixed = 1))), 1);
    navigator.geolocation.clearWatch = () => {};
  });
  await newRecord().pair(context, 'A');
  await routePlaces(page, fixturePlaces());
}

/** A launch: the app opened, 保存した場所, 近くの (the watch started: its fix comes), the permission reading `perm`. */
async function launch(page: Page, how: 'tap' | 'click', perm: PermissionState) {
  await page.goto('');
  await page.evaluate((p) => sessionStorage.setItem('e2e.perm', p), perm);
  await page.reload();
  await islandUp(page);
  await fromMenu(page, 'places', how);
  await view(page).locator('[data-places-q]').focus();
  await view(page).locator('[data-places-q]').pressSequentially('近くの');
  await expect(view(page).locator('[data-qchip]')).toHaveText(['現在地周辺']);
  // (the fix's note drawn in the same task: Svelte's flush is a microtask)
  await expect.poll(() => page.evaluate(() => (window as unknown as { __fixed?: number }).__fixed)).toBe(1);
}

test('asked again at a later launch: the hint once, after the fix; then never again', async ({ page, context }, info) => {
  const how = info.project.name.startsWith('webkit') ? 'tap' : 'click';
  await phone(page, context);
  // the first launch: the first prompt, a fix: remembered, nothing said
  await launch(page, how, 'prompt');
  expect(await page.evaluate(() => localStorage.getItem('island.geoAsked'))).toBe('1');
  await expect(note(page)).toHaveCount(0);
  // a launch with Safari at 許可 (granted): nothing said
  await launch(page, how, 'granted');
  await expect(note(page)).toHaveCount(0);
  // a launch asked again: the hint, on two lines
  await launch(page, how, 'prompt');
  await expect(note(page)).toHaveText(AGAIN);
  expect(await note(page).locator('span').count()).toBe(2);
  expect(await page.evaluate(() => localStorage.getItem('island.geoAsked'))).toBe('2');
  // asked again once more: nothing (once per phone)
  await launch(page, how, 'prompt');
  await expect(view(page).locator('[data-qchip]')).toHaveText(['現在地周辺']);
  await expect(note(page)).toHaveCount(0);
});
