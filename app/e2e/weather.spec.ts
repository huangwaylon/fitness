// Weather days in the built app (docs/design.md "Weather"): forced with ?weather= (dev or ?demo). Rain and snow fall
// in the 3D island's world (world3d/precip.ts: `__world3d.precip()`, one draw call an effect), under every control, the ambience gets its rain, footsteps splash, no shooting stars or fireflies;
// the rainbow, the fog and the aurora show at their moments. Screenshots at 390 and 320.
import { expect, test, type Page } from './fixtures.ts';
import { hudMenu } from './hud.ts';


async function open(page: Page, q: string, sound = false) {
  await page.addInitScript((on) => {
    if (on) localStorage.setItem('island.sound', JSON.stringify({ music: true, sfx: true, volume: 0.8 }));
    (window as { __ambient?: string[] }).__ambient = [];
    (window as { __cues?: string[] }).__cues = [];
  }, sound);
  await page.goto(`?demo&${q}`);
  await expect(hudMenu(page)).toBeVisible();
}

type Precip = { kind: string | null; sky: string; level: number; meshes: string[]; rings: { flat: number } | null };
/** What falls in the 3D island now (precip.ts PrecipState), once the island is up. */
const precip = (page: Page) => page.evaluate(() => (window as unknown as { __world3d?: { precip(): Precip | null } }).__world3d?.precip() ?? null);

/** Nothing of the weather takes a tap: every control's centre is still the control. */
async function controlsClear(page: Page) {
  const ok = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('button, [role="button"]')]
      .filter((b) => b.getBoundingClientRect().width > 0 && b.checkVisibility())
      .every((b) => {
        const r = b.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
        if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) return true;
        const hit = document.elementFromPoint(x, y);
        return !hit?.closest('.overcast, .wet[data-sky], .fog, .rainbow, .aurora');
      })
  );
  expect(ok).toBe(true);
}

for (const [w, h] of [[390, 844], [320, 568]] as const)
  test.describe(`${w}px`, () => {
    test.use({ viewport: { width: w, height: h } });

    test('rain: the streaks and the grey sky, under every control', async ({ page }) => {
      await open(page, 'date=2026-06-10T11:00&weather=rain');
      await expect(page.locator('.if-scene')).toHaveAttribute('data-sky', 'rain');
      // in the 3D world: the streaks and their rings on the layout's flat ground and water
      await expect.poll(() => precip(page)).toMatchObject({ kind: 'rain', sky: 'rain', meshes: ['precip:rain', 'precip:rings'] });
      expect((await precip(page))!.level).toBeGreaterThan(0);
      expect((await precip(page))!.rings!.flat).toBeGreaterThan(1000);
      await expect(page.locator('.overcast')).toBeVisible();
      // the wet tint over the whole stage (fading out up the sky)
      const wetTop = await page.evaluate(() => document.querySelector('.wet[data-sky]')!.getBoundingClientRect().top - document.querySelector('.if-scene')!.getBoundingClientRect().top);
      expect(Math.abs(wetTop)).toBeLessThan(1);
      await controlsClear(page);
      await page.screenshot({ path: test.info().outputPath(`rain-${w}.png`) });
    });

    test('a downpour, snow, the rainbow, the fog and the aurora', async ({ page }) => {
      await open(page, 'date=2026-06-10T14:00&weather=heavy');
      await expect.poll(() => precip(page)).toMatchObject({ kind: 'rain', sky: 'heavy' });
      await open(page, 'date=2027-01-12T10:00&weather=snow');
      await expect.poll(() => precip(page)).toMatchObject({ kind: 'snow', sky: 'snow', meshes: ['precip:snow'] });
      await controlsClear(page);
      await open(page, 'date=2026-06-10T16:30&weather=rainbow');
      await expect(page.locator('.rainbow')).toBeVisible();
      await expect(page.locator('.overcast')).toHaveCount(0);
      await expect.poll(() => precip(page)).toMatchObject({ kind: null, meshes: [] });
      await open(page, 'date=2026-11-05T07:20&weather=fog');
      await expect(page.locator('.fog')).toBeVisible();
      await controlsClear(page);
      await open(page, 'date=2027-01-12T21:00&weather=aurora');
      await expect(page.locator('.aurora')).toBeVisible();
    });
  });

test.describe('the day itself', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('a fine day has no weather layers; a seeded rain day does on both phones', async ({ page, browser }) => {
    await open(page, 'date=2026-06-10T11:00&weather=clear');
    await expect(page.locator('.overcast, .wet[data-sky], .fog, .rainbow, .aurora')).toHaveCount(0);
    await expect.poll(() => precip(page)).toMatchObject({ kind: null, level: 0, meshes: [] });
    // the same date on another phone gets the same sky
    const other = await browser.newPage({ viewport: { width: 390, height: 844 }, locale: 'ja-JP', timezoneId: 'Asia/Tokyo' });
    await other.goto(page.url().replace('&weather=clear', ''));
    await page.goto(page.url().replace('&weather=clear', ''));
    await expect(hudMenu(page)).toBeVisible();
    await expect(hudMenu(other)).toBeVisible();
    expect(await page.locator('.if-scene').getAttribute('data-sky')).toBe(await other.locator('.if-scene').getAttribute('data-sky'));
    await other.close();
  });

  test('rain and snow are one draw call an effect (the streaks, the rings; the flakes)', { tag: '@render' }, async ({ page }) => {
    test.setTimeout(120_000);
    type W = { __world3d: { stats(): { calls: number; frames: number }; precipHide(on: boolean): void } };
    /** The draw calls of a frame drawn after `hide` (its kick draws one). */
    const calls = async (hide: boolean) => {
      const f0 = await page.evaluate((h) => ((window as unknown as W).__world3d.precipHide(h), (window as unknown as W).__world3d.stats().frames), hide);
      await expect.poll(() => page.evaluate(() => (window as unknown as W).__world3d.stats().frames)).toBeGreaterThan(f0);
      return page.evaluate(() => (window as unknown as W).__world3d.stats().calls);
    };
    // (the scene pinned: a critter or a visitor coming into view between the three frames changed their draw calls, on
    // and again never equal: NaN, the drawn smoke's most flaky test, 32 runs in a day)
    for (const [q, n] of [['date=2026-06-10T11:00&weather=rain&critter=none&visitor=none', 2], ['date=2027-01-12T10:00&weather=snow&critter=none&visitor=none', 1]] as const) {
      await open(page, q);
      await expect.poll(() => precip(page).then((p) => p?.meshes.length), { timeout: 30_000 }).toBe(n);
      await expect.poll(() => page.evaluate(() => (window as unknown as { __world3d: { loaded(): boolean } }).__world3d.loaded()), { timeout: 30_000 }).toBe(true);
      // (on, off, on: the scene itself held still meanwhile)
      await expect.poll(async () => {
        const on = await calls(false), off = await calls(true), again = await calls(false);
        return on === again ? on - off : NaN;
      }, { timeout: 30_000 }).toBe(n);
    }
  });

  test('in the rain the ambience has its rain bed and footsteps splash', async ({ page }) => {
    test.setTimeout(60_000);
    await open(page, 'date=2026-06-10T11:00&weather=rain&wander', true);
    const s = (await page.locator('.if-scene').boundingBox())!;
    await page.mouse.click(s.x + s.width / 2, s.y + 60); // a tap on open sky unlocks audio
    await expect.poll(() => page.evaluate(() => (window as { __ambient?: string[] }).__ambient), { timeout: 8000 }).toEqual(['waves', 'rain']);
    await expect
      .poll(() => page.evaluate(() => ((window as { __cues?: string[] }).__cues ?? []).filter((c) => c.startsWith('footstep-'))), { timeout: 30_000 })
      .toContain('footstep-splash');
    const steps = await page.evaluate(() => ((window as { __cues?: string[] }).__cues ?? []).filter((c) => c.startsWith('footstep-')));
    expect(new Set(steps)).toEqual(new Set(['footstep-splash']));
  });
});
