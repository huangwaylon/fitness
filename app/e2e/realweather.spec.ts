// Tokyo's real weather on the island (docs/design.md "Weather"): the relay's timeline (here a `?wx=` fixture on the
// scene clock, or one planted in the phone's cache as the relay would have left it) sets the sky by the hour, the same
// on two phones; offline the cached one serves until it no longer covers the hour or is 36 hours old, then the seeded
// day; せってい's てんき switches the island between ほんもの and ゲーム, with the data's credit; the guest's phone only shows it.
import { expect, test, type Page } from './fixtures.ts';
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

  // one case a test: the eight in one (two phones, sixteen loads) took ~30 s on a loaded CI shard and ran out of its
  // time there in most runs (the top of the flaky list, 2026-11-05)
  const CASES: [string, string, string][] = [
    ['rain in the afternoon', '&date=2026-06-10T13:00&wx=rain-pm', 'rain'],
    ['before the rain', '&date=2026-06-10T10:00&wx=rain-pm', 'clear'],
    ['a typhoon', '&date=2026-06-10T10:00&wx=typhoon', 'heavy'],
    ['snow', '&date=2026-06-10T10:00&wx=snow', 'snow'],
    ['cloudy', '&date=2026-06-10T10:00&wx=cloudy', 'cloudy'],
    // the rain clears at 14:00: the rainbow, on both
    ['the rain clears, a rainbow', '&date=2026-06-10T14:20&wx=clears', 'clear'],
    // winter rain falls as snow; an August Sunday's fireworks night is fine whatever Tokyo does
    ['winter rain falls as snow', '&date=2027-01-20T13:00&wx=rain-pm', 'snow'],
    ['a fireworks night is fine', '&date=2026-08-09T20:00&wx=typhoon', 'clear']
  ];
  for (const [name, q, want] of CASES)
    test(`a fixture timeline gives both phones the same sky by the hour: ${name}`, async ({ page, browser }) => {
      const other = await browser.newPage({ viewport: { width: 390, height: 844 }, locale: 'ja-JP', timezoneId: 'Asia/Tokyo' });
      await open(page, q);
      await other.goto(`?demo${q}&as=B`);
      await expect(hudMenu(other)).toBeVisible();
      await expect(scene(page)).toHaveAttribute('data-sky', want);
      await expect(scene(other)).toHaveAttribute('data-sky', want);
      if (want === 'rain') await expect.poll(() => page.evaluate(() => (window as unknown as { __world3d?: { precip(): { kind: string | null } | null } }).__world3d?.precip()?.kind)).toBe('rain');
      if (q.includes('wx=clears')) {
        await expect(page.locator('.rainbow')).toBeVisible();
        await expect(other.locator('.rainbow')).toHaveAttribute('data-rainbow', (await page.locator('.rainbow').getAttribute('data-rainbow'))!);
      }
      await other.close();
    });

  test('cloudy: a paler grey sky, nothing falling; a change of sky on screen fades out over a minute', async ({ page }) => {
    await page.clock.install({ time: NOON });
    const wx = { h0: Math.floor(NOON / H) - 12, s: 'o'.repeat(48), at: NOON - H, src: 'om', rev: 3 };
    await page.addInitScript((w) => localStorage.setItem('island.wx', JSON.stringify(w)), wx);
    await open(page, '');
    await expect(scene(page)).toHaveAttribute('data-sky', 'cloudy');
    const oc = page.locator('.overcast[data-sky="cloudy"]');
    await expect(oc).toHaveCSS('opacity', '0.5');
    await expect.poll(() => page.evaluate(() => (window as unknown as { __world3d?: { precip(): { kind: string | null } | null } }).__world3d?.precip())).toMatchObject({ kind: null });
    // ゲーム: the seeded day's (2026-06-10 is fine) sky; the grey eases out, then its layers are gone
    await fromMenu(page, 'settings');
    await page.locator('dialog[open] [data-wx-mode="game"]').click();
    await expect(scene(page)).toHaveAttribute('data-sky', 'clear');
    await expect(oc).toHaveAttribute('style', /opacity: 0;?$/);
    await page.clock.fastForward(61_000);
    await expect(page.locator('.overcast')).toHaveCount(0);
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

  test("せってい's てんき: ほんもの or ゲーム for the island, what it is now and the credit; the guest's phone changes it as a member's", async ({ page }) => {
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
    // the guest's phone: the island's mode, its to change as a member's (2026-11-06)
    await open(page, '&as=G');
    await fromMenu(page, 'settings');
    const g = page.locator('dialog[open] [data-weather-section]');
    await g.scrollIntoViewIfNeeded();
    await expect(g.locator('[data-wx-mode="game"]')).toHaveAttribute('aria-checked', 'true');
    await g.locator('[data-wx-mode="real"]').click();
    await expect(g.locator('[data-wx-mode="real"]')).toHaveAttribute('aria-checked', 'true');
    // kept in the record: a member's phone has it
    await open(page, '');
    await fromMenu(page, 'settings');
    const m = page.locator('dialog[open] [data-weather-section]');
    await m.scrollIntoViewIfNeeded();
    await expect(m.locator('[data-wx-mode="real"]')).toHaveAttribute('aria-checked', 'true');
  });
});
