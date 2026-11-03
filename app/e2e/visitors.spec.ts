// Visitors (docs/design.md "Visitors"): K.K. on Saturday nights (a song with the music on), Daisy Mae on Sunday
// mornings, Wisp on some nights, Gulliver washed up on some days (asleep until the fifth nudge). K.K., Wisp and the
// hosts stand at centre stage (the campsite's clearing, seen from おく), Gulliver on the front beach and Daisy Mae on the front lawn
// (seen from まえ), never under a control; a tap gives a line (an introduction first), no trading, no ベル.
import { expect, test, type Page } from '@playwright/test';
import { geo } from './island.ts';
import { hudBells, hudMenu } from './hud.ts';

async function tapOn(page: Page, sel: string) {
  const r = (await page.locator(sel).boundingBox())!;
  await page.mouse.click(r.x + r.width / 2, r.y + r.height / 2);
}
/** The controls under a figure's corners and middle. */
const under = (page: Page, sel: string) =>
  page.evaluate((s) => {
    const b = document.querySelector(s)!.getBoundingClientRect();
    const pts = [[b.left + 2, b.top + 2], [b.right - 2, b.top + 2], [b.left + 2, b.bottom - 2], [b.right - 2, b.bottom - 2], [(b.left + b.right) / 2, (b.top + b.bottom) / 2]];
    return pts.flatMap(([x, y]) => document.elementsFromPoint(x, y).filter((e) => e.closest('button') && !e.closest('[data-building]')).map((e) => e.className));
  }, sel);

/** Press a balloon's choice where it is on screen (a locator click would first scroll it "into view": the stage is
 *  sticky in the camera's scroller, so that moves the camera). */
async function choose(page: Page, choice: ReturnType<Page['locator']>) {
  await expect(choice).toBeVisible();
  await page.waitForTimeout(300); // its pop-in
  const r = (await choice.boundingBox())!;
  await page.mouse.click(r.x + r.width / 2, r.y + r.height / 2);
}
/** The camera to a world z (まえ, おく: the campsite's clearing), settled. */
async function camera(page: Page, z: number) {
  await page.waitForFunction(() => !!(window as unknown as { __world?: unknown }).__world);
  // (again until it holds: the scene may still re-fit its camera as it settles in)
  await expect.poll(async () => {
    await page.evaluate((z) => (window as unknown as { __world: { go(z: number): void } }).__world.go(z), z);
    await page.waitForTimeout(250);
    return page.evaluate((z) => Math.abs((window as unknown as { __world: { cam(): number } }).__world.cam() - z), z);
  }, { timeout: 5000 }).toBeLessThan(1.5); // (WebKit scrolls by whole px: within a px of z)
  await page.waitForTimeout(250);
}
/** The visitor's feet on screen (its world node's origin) against where a world point projects (px apart). */
const offFrom = (page: Page, id: string, x: number, z: number) =>
  page.evaluate(([id, x, z]) => {
    const r = document.querySelector(`[data-visitor="${id}"]`)!.getBoundingClientRect();
    const [px, py] = (window as unknown as { __world: { at(x: number, z: number): [number, number] } }).__world.at(x as number, z as number);
    return Math.hypot(r.left - px, r.top - py);
  }, [id, x, z] as const);

const music = (page: Page) => page.addInitScript(() => localStorage.setItem('island.sound', JSON.stringify({ music: true, sfx: true, volume: 0.8 })));
/** Tap the balloon through its pages until its question is asked (its choices then show): only while a page is
 *  still typing or a ▼ shows (a tap on an asked question would close it). */
async function readOut(page: Page) {
  const box = page.locator('[data-fx="talk"].placed');
  await expect(box).toBeVisible();
  for (let i = 0; i < 40 && !(await page.locator('.choices.asking').count()); i++) {
    if (!(await box.count())) break;
    const busy = (await box.locator('[data-next]').count()) > 0 || ((await box.locator('.pg.now .rest').textContent({ timeout: 1000 }).catch(() => '')) ?? '') !== '';
    if (busy) {
      const b = (await box.boundingBox())!;
      await page.mouse.click(b.x + 24, b.y + 10);
    }
    await page.waitForTimeout(100);
  }
  await expect(page.locator('.choices.asking')).toBeVisible();
}

test('K.K. comes on Saturday from 18:00 (not on Friday); with the music on he asks for a request and plays (NH)', async ({ page }) => {
  await music(page);
  await page.goto('?demo&date=2026-10-23T19:00&critter=none'); // a Friday
  await expect(hudMenu(page)).toBeVisible();
  await expect(page.locator('[data-visitor="kk-slider"]')).toHaveCount(0);
  await page.goto('?demo&date=2026-10-24T19:00&critter=none'); // a Saturday (not Halloween: Jack's night)
  await expect(hudMenu(page)).toBeVisible();
  const bells = await hudBells(page).getAttribute('aria-label');
  // at centre stage: out of sight from まえ (only a speck on the horizon), seen from おく
  const g = await geo(page);
  await camera(page, g.CAMS.oku);
  await expect(page.locator('[data-visitor="kk-slider"] .art')).toBeVisible();
  expect(await offFrom(page, 'kk-slider', ...g.CENTRE_STAGE)).toBeLessThan(2);
  expect(await under(page, '[data-visitor="kk-slider"] .art')).toEqual([]);
  await tapOn(page, '[data-visitor="kk-slider"] .art');
  await expect(page.locator('[data-fx="talk"].placed .who')).toHaveText('とたけけ');
  await expect(page.locator('[data-fx="talk"] .sr')).toContainText('リクエストは あるかな？');
  await readOut(page);
  await expect(page.locator('.choice')).toHaveText(['リクエスト', 'おまかせ']);
  await choose(page, page.locator('.choice', { hasText: 'リクエスト' }));
  await readOut(page);
  const song = (await page.locator('.choice').first().textContent())!;
  await choose(page, page.locator('.choice').first());
  // the show: the caption, the villagers sway, he strums harder
  await expect(page.locator('[data-fx="kk-caption"].placed')).toHaveText(`♪ ${song}`);
  await expect(page.locator('.if-scene[data-show]')).toHaveCount(1);
  await expect(page.locator('[data-visitor="kk-slider"].show')).toHaveCount(1);
  // a tap mid-song: nothing disruptive, but ストップ ends it with his sign-off
  await tapOn(page, '[data-visitor="kk-slider"] .art');
  await readOut(page);
  await choose(page, page.locator('.choice', { hasText: 'ストップ' }));
  await expect(page.locator('[data-fx="kk-caption"]')).toHaveCount(0);
  await expect(page.locator('.if-scene[data-show]')).toHaveCount(0);
  await expect(page.locator('[data-fx="talk"] .sr')).toContainText('サンキュー');
  await expect(hudBells(page)).toHaveAttribute('aria-label', bells!);
});

test('K.K. with the music off just introduces himself', async ({ page }) => {
  await page.goto('?demo&date=2026-10-24T20:00&critter=none');
  await expect(hudMenu(page)).toBeVisible();
  await camera(page, (await geo(page)).CAMS.oku);
  await tapOn(page, '[data-visitor="kk-slider"] .art');
  await expect(page.locator('[data-fx="talk"].placed')).toHaveAttribute('data-pages', '2');
  await expect(page.locator('[data-fx="talk"] .sr')).toContainText('とたけけ だ');
});

for (const [w, h] of [[390, 844], [320, 568]] as const)
  test(`visitors stand where NH puts them (Daisy Mae on the front lawn, Gulliver on the beach, Wisp at centre stage) clear of every control; the first tap is an introduction (${w}px)`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    for (const [q, id, name] of [['2026-11-01T08:00&critter=none', 'daisy-mae', 'ウリ'], ['2026-11-04T22:00&visitor=wisp&critter=none', 'wisp', 'ゆうたろう'], ['2026-11-04T12:00&visitor=gulliver&critter=none', 'gulliver', 'ジョニー']] as const) {
      await page.goto(`?demo&date=${q}`);
      await expect(hudMenu(page)).toBeVisible();
      const { CAMS, CENTRE_STAGE } = await geo(page);
      const at = { 'daisy-mae': [CAMS.mae, 206, 396], wisp: [CAMS.oku, CENTRE_STAGE[0], CENTRE_STAGE[1]], gulliver: [CAMS.mae, 96, 30] } as const;
      const [cam, x, z] = at[id];
      await camera(page, cam);
      await expect(page.locator(`[data-visitor="${id}"] .art`)).toBeVisible();
      expect(await offFrom(page, id, x, z), id).toBeLessThan(2);
      expect(await under(page, `[data-visitor="${id}"] .art`), id).toEqual([]);
      await tapOn(page, `[data-visitor="${id}"] .art`);
      if (id === 'gulliver') {
        // asleep face down: the fifth nudge wakes him (NH)
        await page.waitForTimeout(1100);
        for (let i = 1; i < 5; i++) {
          await tapOn(page, `[data-visitor="${id}"] .art`);
          await page.waitForTimeout(250);
        }
      }
      const box = page.locator('[data-fx="talk"].placed');
      await expect(box.locator('.who')).toHaveText(name);
      await expect(box).toHaveAttribute('data-pages', '2');
      // and its balloon covers none of the HUD's controls (it may sit over the island's: the museum, the trees)
      const notSelf = await page.evaluate(() => {
        const b = document.querySelector('[data-fx="talk"]')!.getBoundingClientRect();
        return [[b.left + 3, b.top + 3], [b.right - 3, b.bottom - 3], [(b.left + b.right) / 2, (b.top + b.bottom) / 2]]
          .flatMap(([x, y]) => document.elementsFromPoint(x, y).filter((e) => e.closest('button') && !e.closest('.stage')).map((e) => e.className));
      });
      expect(notSelf).toEqual([]);
    }
  });

test('out of view, a visitor takes no tap: K.K. at centre stage seen from まえ', async ({ page }) => {
  await page.goto('?demo&date=2026-10-24T20:00&critter=none');
  await expect(hudMenu(page)).toBeVisible();
  await camera(page, 114);
  // his feet: a speck sunk at the horizon (the HUD stands over his head); a tap there just below the horizon
  const [sx, sz] = (await geo(page)).CENTRE_STAGE;
  const [x, y] = await page.evaluate(([sx, sz]) => (window as unknown as { __world: { at(x: number, z: number): [number, number] } }).__world.at(sx, sz), [sx, sz]);
  expect(y).toBeLessThan(200);
  await page.mouse.click(x, y + 3);
  await page.waitForTimeout(400);
  await expect(page.locator('[data-fx="talk"]')).toHaveCount(0);
});

test('nobody visits on an ordinary weekday evening', async ({ page }) => {
  await page.goto('?demo&date=2026-11-04T19:00');
  await expect(hudMenu(page)).toBeVisible();
  await expect(page.locator('[data-visitor]')).toHaveCount(0);
});
