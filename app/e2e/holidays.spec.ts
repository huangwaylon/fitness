// NH's holiday hosts in the visitor slot (docs/design.md "Holiday hosts"), each on its Nookipedia date rule
// (events.ts): Franklin on Turkey Day (he asks for a fish; the next catch makes him happy), Jingle on Toy Day, Pavé at
// Festivale, Zipper on Bunny Day's first and last days; Bunny Day's eggs in a dig spot. No ベル.
import { expect, test, type Page } from '@playwright/test';
import { CATCH_LINES } from '../src/lib/components/island/catchLines.ts';

test.use({ viewport: { width: 390, height: 844 } });

const ribbon = (page: Page) => page.getByRole('button', { name: /^きょう [\d,]+\sベル$/ });
/** The camera to a world z (150 まえ, 860 ひろば), settled. */
async function camera(page: Page, z: number) {
  await page.waitForFunction(() => !!(window as unknown as { __world?: unknown }).__world);
  // (again until it holds: the scene may still re-fit its camera as it settles in)
  await expect.poll(async () => {
    await page.evaluate((z) => (window as unknown as { __world: { go(z: number): void } }).__world.go(z), z);
    await page.waitForTimeout(250);
    return page.evaluate(() => Math.round((window as unknown as { __world: { cam(): number } }).__world.cam()));
  }, { timeout: 5000 }).toBe(z);
  await page.waitForTimeout(250);
}
const under = (page: Page, sel: string) =>
  page.evaluate((s) => {
    const b = document.querySelector(s)!.getBoundingClientRect();
    const pts = [[b.left + 2, b.top + 2], [b.right - 2, b.top + 2], [b.left + 2, b.bottom - 2], [b.right - 2, b.bottom - 2], [(b.left + b.right) / 2, (b.top + b.bottom) / 2]];
    return pts.flatMap(([x, y]) => document.elementsFromPoint(x, y).filter((e) => e.closest('button')).map((e) => e.className));
  }, sel);
const at = (page: Page, sel: string) =>
  page.locator(sel).first().evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
async function tapOn(page: Page, sel: string) {
  const p = await at(page, sel);
  await page.mouse.click(p.x, p.y);
}
/** Tap the balloon until it has said everything (each tap finishes a page, the next turns it). */
async function readAll(page: Page) {
  for (let i = 0; i < 12 && (await page.locator('[data-fx="talk"]').count()); i++) {
    await tapOn(page, '[data-fx="talk"]');
    await page.waitForTimeout(150);
  }
}

for (const [w, h] of [[390, 844], [320, 568]] as const)
  test(`each host on its day, at centre stage (ひろば) clear of every control, introducing themselves (${w}px)`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    for (const [date, id, name] of [
      ['2026-11-26T10:00', 'franklin', 'フランクリン'], ['2026-12-24T12:00', 'jingle', 'ジングル'],
      ['2027-02-08T12:00', 'pave', 'ベルリーナ'], ['2027-03-21T09:00', 'zipper', 'ぴょんたろう']
    ] as const) {
      await page.goto(`?demo&date=${date}&critter=none`);
      await expect(ribbon(page)).toBeVisible();
      const sel = `[data-visitor="${id}"] .art`;
      await camera(page, 860);
      await expect(page.locator(sel)).toBeVisible();
      expect(await under(page, sel), id).toEqual([]);
      await tapOn(page, sel);
      await expect(page.locator('[data-fx="talk"].placed .who')).toHaveText(name, { timeout: 4000 });
    }
  });

test('Turkey Day: Franklin asks for a fish; the next catch makes him happy, and he stays happy after a reload', async ({ page }) => {
  test.setTimeout(45_000);
  await page.goto('?demo&date=2026-11-26T10:00&critter=sea-bass');
  await expect(ribbon(page)).toBeVisible();
  const bells = await ribbon(page).getAttribute('aria-label');
  // he stands at centre stage (ひろば); the sea is at まえ
  await camera(page, 860);
  await tapOn(page, '[data-visitor="franklin"] .art');
  await expect(page.locator('[data-fx="talk"] .sr')).toContainText('サンクスギビング', { timeout: 4000 });
  await expect(page.locator('[data-fx="talk"] .sr')).toContainText('さかなが 1ぴき');
  await readAll(page);
  await camera(page, 114);
  // fish one: cast beside the shadow, reel in on the bite
  const fish = page.locator('[data-critter="fish"]');
  await expect(fish).toBeAttached();
  await page.waitForTimeout(500);
  // (the shadow swims in the sea in front of the beach: on screen, clear of its bottom edge)
  const vh = page.viewportSize()!.height;
  await expect.poll(async () => (await at(page, '[data-critter="fish"]')).y, { timeout: 10_000 }).toBeLessThan(vh - 24);
  const f = await at(page, '[data-critter="fish"]');
  await page.mouse.click(f.x + (f.x < 195 ? 40 : -40), f.y);
  await expect(page.locator('[data-bite]')).toHaveText('！', { timeout: 12_000 });
  await page.waitForTimeout(300);
  const b = await at(page, '[data-bobber]');
  await page.mouse.click(b.x < 195 ? 366 : 24, b.y);
  await expect(page.locator('[data-fx="catch"]')).toContainText(CATCH_LINES['sea-bass'][0].split('\n')[0]);
  await expect(page.locator('[data-treat]')).toBeAttached({ timeout: 6000 });
  await expect(page.locator('[data-fx="talk"] .sr')).toContainText('ありがとう', { timeout: 6000 });
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('scene-franklin') ?? '{}'))).toMatchObject({ date: '2026-11-26', asked: true, fed: true });
  await expect(ribbon(page)).toHaveAttribute('aria-label', bells!);
  await page.goto('?demo&date=2026-11-26T11:00&critter=none');
  await camera(page, 860);
  await expect(page.locator('[data-visitor="franklin"] .art')).toBeVisible();
  await tapOn(page, '[data-visitor="franklin"] .art');
  await expect(page.locator('[data-fx="talk"].placed .who')).toHaveText('フランクリン', { timeout: 4000 });
  await expect(page.locator('[data-fx="talk"] .sr')).not.toContainText('さかなが 1ぴき');
});

test('Toy Day: two presents beside the goal trees (まえ)', async ({ page }) => {
  await page.goto('?demo&date=2026-12-24T12:00&critter=none');
  await expect(ribbon(page)).toBeVisible();
  await camera(page, 114);
  await expect(page.locator('[data-toy]')).toHaveCount(2);
  await expect(page.locator('[data-toy] .art').first()).toBeVisible();
  expect(await under(page, '[data-toy] .art')).toEqual([]);
});

test('Bunny Day week: no Zipper mid-week, and a dig spot can hold an earth egg (no ずかん find)', async ({ page }) => {
  await page.goto('?demo&date=2027-03-24T12:00&find=earth-egg&critter=none');
  await expect(ribbon(page)).toBeVisible();
  await expect(page.locator('[data-visitor="zipper"]')).toHaveCount(0);
  await expect(page.locator('[data-find="fossil"]').first()).toBeAttached();
  await tapOn(page, '[data-find="fossil"]');
  await expect(page.locator('[data-fx="catch"]')).toContainText('じめんのたまごを ほりだした！', { timeout: 5000 });
  const finds = await page.evaluate(() => (JSON.parse(localStorage.getItem('island-demo.events') ?? '{}').events ?? []).filter((e: { type: string }) => e.type === 'find'));
  expect(finds).toEqual([]);
});
