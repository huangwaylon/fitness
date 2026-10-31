// The rest of NH's bugs (docs/design.md "Scene interactions"): a tarantula or a scorpion in the grass at night rears up
// when it's come at and charges if you keep coming, and once it settles a tap nets it; a mole cricket chirps under a
// mound and a tap digs it up; a tap on my villager now and then sends a flea hopping off it; the stink bugs on the
// flowers. Each keeps clear of every control and is a ずかん find, never ベル. `?critter=<id>` brings one on at once.
import { expect, test, type Page } from '@playwright/test';
import { CATCH_LINES } from '../src/lib/components/island/catchLines.ts';
import { REAR_MS } from '../src/lib/components/island/critters.ts';

const said = (id: keyof typeof CATCH_LINES) => CATCH_LINES[id][0].replace(/\s+/g, ' ');
test.use({ viewport: { width: 390, height: 844 } });
const ribbon = (page: Page) => page.getByRole('button', { name: /^きょう [\d,]+\sベル$/ });

async function open(page: Page, q: string) {
  await page.addInitScript(() => ((window as { __cues?: string[] }).__cues = []));
  await page.goto(`?demo${q}`);
  await expect(ribbon(page)).toBeVisible();
  return ribbon(page).getAttribute('aria-label');
}
const at = (page: Page, sel: string) =>
  page.locator(sel).first().evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
/** No control under the point (a critter must never sit on a button). */
const clear = (page: Page, p: { x: number; y: number }) => page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.closest('button')?.className ?? '', p);
const finds = (page: Page) =>
  page.evaluate(() => (JSON.parse(localStorage.getItem('island-demo.events') ?? '{}').events ?? []).filter((e: { type: string }) => e.type === 'find').map((e: { data: unknown }) => e.data));
const cues = (page: Page) => page.evaluate(() => (window as { __cues?: string[] }).__cues ?? []);

test('a tarantula at night: the first tap makes it rear up, it settles, then a tap nets it', async ({ page }) => {
  const bells = await open(page, '&date=2026-01-10T22:00&critter=tarantula');
  const t = page.locator('[data-critter="tarantula"]');
  await expect(t).toBeAttached();
  await page.waitForTimeout(900);
  const p = await at(page, '[data-critter="tarantula"]');
  expect(await clear(page, p)).toBe('');
  await page.mouse.click(p.x, p.y);
  await expect(page.locator('[data-stalk="rear"]')).toBeAttached();
  await expect(page.locator('[data-fx="catch"]')).toHaveCount(0);
  await expect(page.locator('[data-stalk="settled"]')).toBeAttached({ timeout: REAR_MS + 1000 });
  const q = await at(page, '[data-critter="tarantula"]');
  await page.mouse.click(q.x, q.y);
  await expect(page.locator('[data-fx="catch"]')).toContainText(said('tarantula'));
  expect(await finds(page)).toEqual([{ kind: 'bug', id: 'tarantula' }]);
  await expect(ribbon(page)).toHaveAttribute('aria-label', bells!);
});

test('a scorpion: a second tap while it is reared up and it charges off (gone, nothing caught)', async ({ page }) => {
  await open(page, '&date=2026-07-10T22:00&critter=scorpion');
  await expect(page.locator('[data-critter="scorpion"]')).toBeAttached();
  await page.waitForTimeout(900);
  const p = await at(page, '[data-critter="scorpion"]');
  await page.mouse.click(p.x, p.y);
  await expect(page.locator('[data-stalk="rear"]')).toBeAttached();
  await page.mouse.click(p.x, p.y);
  await expect(page.locator('[data-critter="scorpion"]')).toHaveCount(0, { timeout: 3000 });
  await expect(page.locator('[data-fx="catch"]')).toHaveCount(0);
  expect(await cues(page)).toContain('scene-bug-flee');
  expect(await finds(page)).toEqual([]);
});

test('a mole cricket chirps under a mound in the grass; a tap digs it up', async ({ page }) => {
  await open(page, '&date=2026-02-10T12:00&critter=mole-cricket');
  await expect(page.locator('[data-critter="mole-cricket"]')).toBeAttached();
  await page.waitForTimeout(900);
  const p = await at(page, '[data-critter="mole-cricket"]');
  expect(await clear(page, p)).toBe('');
  await page.mouse.click(p.x, p.y);
  await expect(page.locator('[data-fx="catch"]')).toContainText(said('mole-cricket'));
  expect(await cues(page)).toEqual(expect.arrayContaining(['scene-dig', 'scene-catch']));
});

test('a tap on my villager sends a flea hopping off into the grass; a tap on it nets it', async ({ page }) => {
  await open(page, '&date=2026-07-10T12:00&flea');
  await page.waitForTimeout(2600); // the opening beats are over
  await page.locator('button.vil').first().click();
  const flea = page.locator('[data-critter="flea"]');
  await expect(flea).toBeAttached();
  await page.waitForTimeout(2600); // its first hop lands in the grass
  const p = await at(page, '[data-critter="flea"]');
  expect(await clear(page, p)).toBe('');
  await page.mouse.click(p.x, p.y);
  await expect(page.locator('[data-fx="catch"]')).toContainText(said('flea'));
});

test('a stink bug on the flower beds and a long-horned beetle on a trunk are netted, clear of every control', async ({ page }) => {
  for (const id of ['man-faced-stink-bug', 'citrus-long-horned-beetle'] as const) {
    await open(page, `&date=2026-05-10T21:00&critter=${id}`);
    await expect(page.locator(`[data-critter="${id}"]`)).toBeAttached();
    await page.waitForTimeout(1800);
    const p = await at(page, `[data-critter="${id}"]`);
    expect(await clear(page, p), id).toBe('');
    await page.mouse.click(p.x, p.y);
    await expect(page.locator('[data-fx="catch"]')).toContainText(said(id));
  }
});
