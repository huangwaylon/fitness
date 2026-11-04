// Tokyo's real weather on the island (docs/design.md "Weather"): the relay's timeline (here a `?wx=` fixture on the
// scene clock, or one planted in the phone's cache as the relay would have left it) sets the sky by the hour, the same
// on two phones; offline the cached one serves until it no longer covers the hour or is 36 hours old, then the seeded
// day; せってい's てんき switches the island between ほんもの and ゲーム, with the data's credit; the guest's phone only shows it.
import { expect, test, type Page } from '@playwright/test';
import { fromMenu, hudMenu } from './hud.ts';

const H = 3600_000;
/** 2026-06-10 11:20 Tokyo: no event night, not the snowy season. */
const NOON = Date.parse('2026-06-10T11:20:00+09:00');
const scene = (p: Page) => p.locator('.if-scene');

/** The phone's clock at NOON (not a `?date=` preview: the real weather's hours), its cache holding `s` from 12 hours
 *  back (as the relay sends it) fetched `ago` ms before. */
async function planted(page: Page, s: string, ago = H) {
  await page.clock.setFixedTime(NOON);
  const wx = { h0: Math.floor(NOON / H) - 12, s, at: NOON - ago, src: 'om', rev: 3 };
  await page.addInitScript((w) => localStorage.setItem('island.wx', JSON.stringify(w)), wx);
}

async function open(page: Page, q: string) {
  await page.goto(`?demo${q}`);
  await expect(hudMenu(page)).toBeVisible();
}

/** The seeded day's sky at NOON (the game's weather). */
async function seededSky(page: Page): Promise<string> {
  await page.clock.setFixedTime(NOON);
  await open(page, '&wx=game');
  return (await scene(page).getAttribute('data-sky'))!;
}

test.describe('the real weather', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('a fixture timeline gives both phones the same sky by the hour', async ({ page, browser }) => {
    const other = await browser.newPage({ viewport: { width: 390, height: 844 }, locale: 'ja-JP', timezoneId: 'Asia/Tokyo' });
    const both = async (q: string, want: string) => {
      await open(page, q);
      await other.goto(page.url().replace('?demo', '?demo&as=B'));
      await expect(hudMenu(other)).toBeVisible();
      await expect(scene(page)).toHaveAttribute('data-sky', want);
      await expect(scene(other)).toHaveAttribute('data-sky', want);
    };
    await both('&date=2026-06-10T13:00&wx=rain-pm', 'rain');
    await expect(page.locator('.precip .rain')).toBeVisible();
    await both('&date=2026-06-10T10:00&wx=rain-pm', 'clear');
    await both('&date=2026-06-10T10:00&wx=typhoon', 'heavy');
    await both('&date=2026-06-10T10:00&wx=snow', 'snow');
    // winter rain falls as snow; an August Sunday's fireworks night is fine whatever Tokyo does
    await both('&date=2027-01-20T13:00&wx=rain-pm', 'snow');
    await both('&date=2026-08-09T20:00&wx=typhoon', 'clear');
    await other.close();
  });

  test('offline: the cached timeline serves; 36 hours old, the seeded day', async ({ page }) => {
    const seeded = await seededSky(page);
    const real = seeded === 'heavy' ? 'c' : 'h';
    await planted(page, real.repeat(48));
    await open(page, '');
    // (no relay here: what the phone had cached when it was last online)
    await expect(scene(page)).toHaveAttribute('data-sky', real === 'h' ? 'heavy' : 'clear');
    // a timeline fetched 37 hours ago no longer serves: the seeded day's sky
    await planted(page, real.repeat(48), 37 * H);
    await open(page, '');
    await expect(scene(page)).toHaveAttribute('data-sky', seeded);
  });

  test("せってい's てんき: ほんもの or ゲーム for the island, what it is now and the credit; the guest's phone only shows it", async ({ page }) => {
    const seeded = await seededSky(page);
    const real = seeded === 'heavy' ? 'c' : 'h';
    const realSky = real === 'h' ? 'heavy' : 'clear';
    await planted(page, real.repeat(48));
    await open(page, '');
    await expect(scene(page)).toHaveAttribute('data-sky', realSky);
    await fromMenu(page, 'settings');
    const sec = page.locator('dialog[open] [data-weather-section]');
    await sec.scrollIntoViewIfNeeded();
    await expect(sec.locator('[data-wx-mode="real"]')).toHaveAttribute('aria-checked', 'true');
    await expect(sec.locator('[data-wx-now="real"]')).toHaveText(`いま: とうきょう ${realSky === 'heavy' ? 'おおあめ' : 'はれ'}`);
    await expect(sec.locator('[data-wx-credit]')).toHaveText('天気: Open-Meteo（気象庁モデル）');
    await sec.locator('[data-wx-mode="game"]').click();
    await expect(sec.locator('[data-wx-mode="game"]')).toHaveAttribute('aria-checked', 'true');
    await expect(sec.locator('[data-wx-now]')).toHaveCount(0);
    await expect(scene(page)).toHaveAttribute('data-sky', seeded);
    // kept in the record: still the game's after a reload
    await page.reload();
    await expect(hudMenu(page)).toBeVisible();
    await expect(scene(page)).toHaveAttribute('data-sky', seeded);
    // the guest's phone: the island's mode, shown and not changed
    await open(page, '&as=G');
    await fromMenu(page, 'settings');
    const g = page.locator('dialog[open] [data-weather-section]');
    await g.scrollIntoViewIfNeeded();
    await expect(g.locator('[data-wx-guest]')).toBeVisible();
    await expect(g.locator('[data-wx-mode="real"]')).toHaveAttribute('aria-disabled', 'true');
    const before = await g.locator('[aria-checked="true"]').getAttribute('data-wx-mode');
    await g.locator(`[data-wx-mode="${before === 'real' ? 'game' : 'real'}"]`).click({ force: true });
    await expect(g.locator('[aria-checked="true"]')).toHaveAttribute('data-wx-mode', before!);
  });
});
