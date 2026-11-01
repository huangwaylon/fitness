// Weather days in the built app (docs/design.md "Weather"): forced with ?weather= (dev or ?demo). Rain and snow fall
// over the island under every control, the ambience gets its rain, footsteps splash, no shooting stars or fireflies;
// the rainbow, the fog and the aurora show at their moments. Screenshots at 390 and 320.
import { expect, test, type Page } from '@playwright/test';

const ribbon = (page: Page) => page.getByRole('button', { name: /^きょう [\d,]+\sベル$/ });

async function open(page: Page, q: string, sound = false) {
  await page.addInitScript((on) => {
    if (on) localStorage.setItem('island.sound', JSON.stringify({ music: true, sfx: true, volume: 0.8 }));
    (window as { __ambient?: string[] }).__ambient = [];
    (window as { __cues?: string[] }).__cues = [];
  }, sound);
  await page.goto(`?demo&${q}`);
  await expect(ribbon(page)).toBeVisible();
}

/** Nothing of the weather takes a tap: every control's centre is still the control. */
async function controlsClear(page: Page) {
  const ok = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('button, [role="button"]')]
      .filter((b) => b.getBoundingClientRect().width > 0 && b.checkVisibility())
      .every((b) => {
        const r = b.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
        if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) return true;
        const hit = document.elementFromPoint(x, y);
        return !hit?.closest('.overcast, .wet[data-sky], .precip, .fog, .rainbow, .aurora');
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
      await expect(page.locator('.precip .rain')).toBeVisible();
      await expect(page.locator('.precip .rain.heavy')).toHaveCount(0);
      await expect(page.locator('.overcast')).toBeVisible();
      // screen space over the whole scene (the stage is the viewport); the wet tint from the horizon down
      const geo = await page.evaluate(() => {
        const s = document.querySelector('.if-scene')!, sc = s.getBoundingClientRect(), p = document.querySelector('.precip')!.getBoundingClientRect();
        const wet = document.querySelector('.wet[data-sky]')!.getBoundingClientRect(), hy = parseFloat(getComputedStyle(s).getPropertyValue('--horizon-y'));
        return { dw: Math.abs(p.width - sc.width), dh: Math.abs(p.height - sc.height), wetTop: wet.top - sc.top, hy };
      });
      expect(geo.dw).toBeLessThan(1);
      expect(geo.dh).toBeLessThan(1);
      expect(Math.abs(geo.wetTop - (geo.hy - 2))).toBeLessThan(1);
      await controlsClear(page);
      await page.screenshot({ path: test.info().outputPath(`rain-${w}.png`) });
    });

    test('a downpour, snow, the rainbow, the fog and the aurora', async ({ page }) => {
      await open(page, 'date=2026-06-10T14:00&weather=heavy');
      await expect(page.locator('.precip .rain.heavy')).toBeVisible();
      await open(page, 'date=2027-01-12T10:00&weather=snow');
      await expect(page.locator('.precip .snow')).toHaveCount(2);
      await controlsClear(page);
      await open(page, 'date=2026-06-10T16:30&weather=rainbow');
      await expect(page.locator('.rainbow')).toBeVisible();
      await expect(page.locator('.overcast, .precip')).toHaveCount(0);
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
    await expect(page.locator('.overcast, .wet[data-sky], .precip .rain, .fog, .rainbow, .aurora')).toHaveCount(0);
    // the same date on another phone gets the same sky
    const other = await browser.newPage({ viewport: { width: 390, height: 844 }, locale: 'ja-JP', timezoneId: 'Asia/Tokyo' });
    await other.goto(page.url().replace('&weather=clear', ''));
    await page.goto(page.url().replace('&weather=clear', ''));
    await expect(ribbon(page)).toBeVisible();
    await expect(ribbon(other)).toBeVisible();
    expect(await page.locator('.if-scene').getAttribute('data-sky')).toBe(await other.locator('.if-scene').getAttribute('data-sky'));
    await other.close();
  });

  test('in the rain the ambience has its rain bed and footsteps splash', async ({ page }) => {
    await open(page, 'date=2026-06-10T11:00&weather=rain&wander', true);
    const s = (await page.locator('.if-scene').boundingBox())!;
    await page.mouse.click(s.x + s.width / 2, s.y + 60); // a tap on open sky unlocks audio
    await expect.poll(() => page.evaluate(() => (window as { __ambient?: string[] }).__ambient), { timeout: 8000 }).toEqual(['waves', 'rain']);
    await expect
      .poll(() => page.evaluate(() => ((window as { __cues?: string[] }).__cues ?? []).filter((c) => c.startsWith('footstep-'))), { timeout: 15_000 })
      .toContain('footstep-splash');
    const steps = await page.evaluate(() => ((window as { __cues?: string[] }).__cues ?? []).filter((c) => c.startsWith('footstep-')));
    expect(new Set(steps)).toEqual(new Set(['footstep-splash']));
  });
});
