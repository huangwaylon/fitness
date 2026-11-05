// Visitors (docs/design.md "Visitors"): K.K. on Saturday nights (a song with the music on), Daisy Mae on Sunday
// mornings, one of NH's weekday visitors most other days (Wisp at night, Gulliver washed up and asleep until the fifth
// nudge). They stand at centre stage (the layout's plaza, a clear patch of lawn behind the villagers, seen as the island
// opens at まえ), Gulliver on the front beach, never under a control; a tap gives a line (an introduction first), no
// trading, no ベル.
import { expect, test, type Page } from '@playwright/test';
import { camTo, controlsUnder, geo, offFrom, tapFigure } from './island.ts';
import { hudBells, hudMenu } from './hud.ts';

/** Press a balloon's choice where it is on screen (a locator click would first scroll it "into view": the stage is
 *  sticky in the camera's scroller, so that moves the camera). */
async function choose(page: Page, choice: ReturnType<Page['locator']>) {
  await expect(choice).toBeVisible();
  await page.waitForTimeout(300); // its pop-in
  const r = (await choice.boundingBox())!;
  await page.mouse.click(r.x + r.width / 2, r.y + r.height / 2);
}

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
  // at centre stage, in view as the island opens (まえ)
  const g = await geo(page);
  await camTo(page, g.CAMS.mae, false);
  await expect(page.locator('[data-visitor="kk-slider"] .art')).toBeVisible();
  expect(await offFrom(page, '[data-visitor="kk-slider"]', ...g.CENTRE_STAGE)).toBeLessThan(2);
  expect(await controlsUnder(page, '[data-visitor="kk-slider"] .art')).toEqual([]);
  await tapFigure(page, '[data-visitor="kk-slider"] .art');
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
  await tapFigure(page, '[data-visitor="kk-slider"] .art');
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
  await camTo(page, (await geo(page)).CAMS.mae, false);
  await tapFigure(page, '[data-visitor="kk-slider"] .art');
  await expect(page.locator('[data-fx="talk"].placed')).toHaveAttribute('data-pages', '2');
  await expect(page.locator('[data-fx="talk"] .sr')).toContainText('とたけけ だ');
});

test('visitors stand where NH puts them (Daisy Mae and Wisp at centre stage, Gulliver on the beach) clear of every control; the first tap is an introduction', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const [q, id, name] of [['2026-11-01T08:00&critter=none', 'daisy-mae', 'ウリ'], ['2026-11-04T22:00&visitor=wisp&critter=none', 'wisp', 'ゆうたろう'], ['2026-11-04T12:00&visitor=gulliver&critter=none', 'gulliver', 'ジョニー']] as const) {
    await page.goto(`?demo&date=${q}`);
    await expect(hudMenu(page)).toBeVisible();
    const { CAMS, CENTRE_STAGE, BEACHED } = await geo(page);
    const [x, z] = id === 'gulliver' ? BEACHED : CENTRE_STAGE;
    await camTo(page, CAMS.mae, false);
    await expect(page.locator(`[data-visitor="${id}"] .art`)).toBeVisible();
    expect(await offFrom(page, `[data-visitor="${id}"]`, x, z), id).toBeLessThan(2);
    expect(await controlsUnder(page, `[data-visitor="${id}"] .art`), id).toEqual([]);
    await tapFigure(page, `[data-visitor="${id}"] .art`);
    if (id === 'gulliver') {
      // asleep face down: the fifth nudge wakes him (NH)
      await page.waitForTimeout(1100);
      for (let i = 1; i < 5; i++) {
        await tapFigure(page, `[data-visitor="${id}"] .art`);
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

test('nobody visits on a quiet day (about one in ten of the rotation’s)', async ({ page }) => {
  await page.goto('?demo&date=2026-11-19T19:00');
  await expect(hudMenu(page)).toBeVisible();
  await expect(page.locator('[data-visitor]')).toHaveCount(0);
});

test('the day brings its visitor with no hook: Daisy Mae on a Sunday morning, drawn on the 3D island as her NH model, and she talks', async ({ page }) => {
  await page.goto('?demo&date=2026-11-08T09:00&critter=none');
  await expect(hudMenu(page)).toBeVisible();
  const { CAMS } = await geo(page);
  await camTo(page, CAMS.mae, false);
  // the 3D island stands her model where her node is (posed as the villagers are; her DOM node the tap box only), and
  // no visitor is ever a card
  await expect.poll(() => page.evaluate(() => (window as unknown as { __villagers3: { state(s: string): string | null } }).__villagers3.state('visitor')), { timeout: 15_000 }).toBe('idle');
  await expect(page.locator('[data-visitor="daisy-mae"] .art .official')).toHaveCount(0);
  await tapFigure(page, '[data-visitor="daisy-mae"] .art');
  await expect(page.locator('[data-fx="talk"].placed .who')).toHaveText('ウリ');
});

test('the weekday rotation brings its visitor with no hook: Redd on Wednesday Nov 4 2026, at centre stage, and he talks', async ({ page }) => {
  await page.goto('?demo&date=2026-11-04T12:00&critter=none');
  await expect(hudMenu(page)).toBeVisible();
  const { CAMS, CENTRE_STAGE } = await geo(page);
  await camTo(page, CAMS.mae, false);
  await expect(page.locator('[data-visitor="redd"] .art')).toBeVisible();
  expect(await offFrom(page, '[data-visitor="redd"]', ...CENTRE_STAGE)).toBeLessThan(2);
  expect(await controlsUnder(page, '[data-visitor="redd"] .art')).toEqual([]);
  await tapFigure(page, '[data-visitor="redd"] .art');
  await expect(page.locator('[data-fx="talk"].placed .who')).toHaveText('つねきち');
});

test('a tap in a visitor’s reach (a finger’s slack beside its figure) with nothing exact under it still talks', async ({ page }) => {
  await page.goto('?demo&date=2026-11-04T12:00&critter=none');
  await expect(hudMenu(page)).toBeVisible();
  const { CAMS } = await geo(page);
  await camTo(page, CAMS.mae, false);
  const art = page.locator('[data-visitor="redd"] .art');
  await expect(art).toBeVisible();
  // a point 5 px off its figure, on bare ground: no control there, no small thing's box (theirs would win: SceneTaps)
  const p = await art.evaluate((el) => {
    const r = el.getBoundingClientRect(), mid = (r.top + r.bottom) / 2;
    const things = [...document.querySelectorAll('[data-care], [data-find], [data-branch], [data-wood], [data-present]')].map((e) => e.getBoundingClientRect());
    for (const [x, y] of [[r.left - 5, mid], [r.right + 5, mid], [r.left - 5, r.bottom - 10], [r.right + 5, r.bottom - 10]]) {
      const at = document.elementFromPoint(x, y);
      if (at?.classList.contains('stage') && !things.some((b) => Math.abs(x - (b.left + b.right) / 2) < 30 && Math.abs(y - (b.top + b.bottom) / 2) < 30)) return { x, y };
    }
    return null;
  });
  expect(p).not.toBeNull();
  await page.mouse.click(p!.x, p!.y);
  await expect(page.locator('[data-fx="talk"].placed .who')).toHaveText('つねきち');
});
