// Beach finds (docs/design.md "Beach finds"): shells on the sand, fossil dig spots, the message bottle, star fragments
// the morning after a wish. A tap picks one up with NH's caption; the first of each is a ずかん `find`. None of it
// changes ベル, opens a sheet or navigates. The day items derive from ?date= (deterministic); ?find= forces a bottle or
// this morning's fragments.
import { expect, test, type Page } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } });

const ribbon = (page: Page) => page.getByRole('button', { name: /^きょう [\d,]+\sベル$/ });

async function open(page: Page, q: string) {
  await page.addInitScript(() => ((window as { __cues?: string[] }).__cues = []));
  await page.goto(`?demo${q}`);
  await expect(ribbon(page)).toBeVisible();
  return { bells: await ribbon(page).getAttribute('aria-label'), url: page.url() };
}
async function unchanged(page: Page, before: { bells: string | null; url: string }) {
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  expect(page.url()).toBe(before.url);
  await expect(ribbon(page)).toHaveAttribute('aria-label', before.bells!);
}
const at = (page: Page, sel: string) =>
  page.locator(sel).first().evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
const cues = (page: Page) => page.evaluate(() => (window as { __cues?: string[] }).__cues ?? []);
const finds = (page: Page) =>
  page.evaluate(() => (JSON.parse(localStorage.getItem('island-demo.events') ?? '{}').events ?? [])
    .filter((e: { type: string }) => e.type === 'find').map((e: { data: unknown }) => e.data));
/** What's under a point: a control (button) or nothing. */
const control = (page: Page, p: { x: number; y: number }) =>
  page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.closest('button')?.className ?? '', p);

test('shells lie on the front beach (the newest three); a tap picks one up, and it stays picked after a reload', async ({ page }) => {
  const before = await open(page, '&date=2026-11-04T12:00');
  const shells = page.locator('[data-find="shell"]');
  await expect(shells).toHaveCount(3);
  const id = await shells.first().getAttribute('data-id');
  const p = await at(page, '[data-find="shell"]');
  expect(await control(page, p)).toBe('');
  await page.mouse.click(p.x, p.y);
  await expect(page.locator('[data-fx="catch"]')).toContainText(/を ひろった！/);
  await expect(shells).toHaveCount(2);
  expect(await cues(page)).toContain('scene-shell');
  expect(await finds(page)).toEqual([{ kind: 'shell', id }]);
  await unchanged(page, before);
  await page.reload();
  await expect(ribbon(page)).toBeVisible();
  await expect(shells).toHaveCount(2);
});

test('a fossil dig spot: a tap digs it up (「化石を ほりだした！」 and its name); the next one waits a little', async ({ page }) => {
  const before = await open(page, '&date=2026-11-04T12:00');
  const spots = page.locator('[data-find="fossil"]');
  await expect(spots.first()).toBeAttached();
  const n = await spots.count();
  expect(n).toBeGreaterThanOrEqual(1);
  expect(n).toBeLessThanOrEqual(2);
  const p = await at(page, '[data-find="fossil"]');
  expect(await control(page, p)).toBe('');
  await page.mouse.click(p.x, p.y);
  await expect(page.locator('[data-fx="catch"]')).toContainText(/化石を ほりだした！ .+だ！/);
  await expect(spots).toHaveCount(n - 1);
  expect(await cues(page)).toEqual(expect.arrayContaining(['scene-dig', 'scene-catch']));
  expect((await finds(page))[0]).toMatchObject({ kind: 'fossil' });
  await unchanged(page, before);
});

test('a message bottle at the water’s edge: a tap reads its note', async ({ page }) => {
  const before = await open(page, '&date=2026-11-04T12:00&find=bottle');
  const p = await at(page, '[data-find="bottle"]');
  await page.mouse.click(p.x, p.y);
  await expect(page.locator('[data-fx="catch"]')).toContainText(/メッセージボトル！ 『.+』/);
  await expect(page.locator('[data-find="bottle"]')).toHaveCount(0);
  expect(await cues(page)).toContain('scene-bottle');
  expect(await finds(page)).toEqual([]); // a bottle isn't a ずかん find
  await unchanged(page, before);
});

test('a wish on a shooting star brings star fragments the next morning; a tap picks one up', async ({ page }) => {
  await open(page, '&date=2026-11-04T21:00');
  // the moon sends a shooting star; a tap in the sky while it crosses is a wish
  const moon = await at(page, '.orb');
  await page.mouse.click(moon.x, moon.y);
  await page.mouse.click(moon.x + 120, moon.y + 10);
  await expect(page.locator('[data-fx="catch"]')).toContainText('ながれぼしに おねがい！');
  expect(await page.evaluate(() => localStorage.getItem('scene-wish'))).toBe('"2026-11-05"');
  expect(await cues(page)).toContain('scene-wish');
  await page.goto('?demo&date=2026-11-05T08:00');
  const frags = page.locator('[data-find="fragment"]');
  await expect(frags.first()).toBeAttached();
  const before = { bells: await ribbon(page).getAttribute('aria-label'), url: page.url() };
  const id = await frags.first().getAttribute('data-id');
  const p = await at(page, '[data-find="fragment"]');
  await page.mouse.click(p.x, p.y);
  await expect(page.locator('[data-fx="catch"]')).toContainText(/かけらを ひろった！/);
  expect(await finds(page)).toEqual([{ kind: 'fragment', id }]);
  await unchanged(page, before);
});
