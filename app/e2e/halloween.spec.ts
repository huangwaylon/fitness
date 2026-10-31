// Halloween (docs/design.md "Halloween"; island/events.ts): on Oct 31 a few orange pumpkins on the lawn, lit as
// jack-o'-lanterns from 17:00 under a purple and orange wash; Jack visits 17:00–24:00 and asks for candy: a treat
// delights him, nothing earns his trick (a goofy face on my villager). Never over a control; no ベル.
import { expect, test, type Page } from '@playwright/test';

const ribbon = (page: Page) => page.getByRole('button', { name: /^きょう [\d,]+\sベル$/ });
async function tapOn(page: Page, sel: string) {
  const r = (await page.locator(sel).boundingBox())!;
  await page.mouse.click(r.x + r.width / 2, r.y + r.height / 2);
}
/** The controls under a figure's corners and middle. */
const under = (page: Page, sel: string) =>
  page.evaluate((s) => {
    return [...document.querySelectorAll(s)].flatMap((el) => {
      const b = el.getBoundingClientRect();
      const pts = [[b.left + 2, b.top + 2], [b.right - 2, b.top + 2], [b.left + 2, b.bottom - 2], [b.right - 2, b.bottom - 2], [(b.left + b.right) / 2, (b.top + b.bottom) / 2]];
      return pts.flatMap(([x, y]) => document.elementsFromPoint(x, y).filter((e) => e.closest('button') && !e.closest('[data-fx]')).map((e) => e.className));
    });
  }, sel);
/** Tap the balloon until its last page has typed (its answers show). */
async function toAnswers(page: Page) {
  const box = page.locator('[data-fx="talk"].placed');
  for (let i = 0; i < 12 && !(await page.locator('.choices.asking').count()); i++) {
    await box.click();
    await page.waitForTimeout(120);
  }
  await expect(page.locator('.choices.asking')).toBeVisible();
}

test('Oct 31 by day: pumpkins on the lawn, clear of every control; no Jack, no lanterns', async ({ page }) => {
  await page.goto('?demo&date=2026-10-31T16:59&critter=none');
  await expect(ribbon(page)).toBeVisible();
  await expect(page.locator('[data-halloween="day"] .pumpkin .art').first()).toBeVisible();
  expect(await page.locator('.pumpkin').count()).toBeGreaterThanOrEqual(3);
  expect(await under(page, '.pumpkin .art')).toEqual([]);
  await expect(page.locator('[data-visitor="jack"]')).toHaveCount(0);
  await expect(page.locator('.pumpkin .glow')).toHaveCount(0);
});

test('Nov 1: no Halloween', async ({ page }) => {
  await page.goto('?demo&date=2026-11-01T00:00&critter=none');
  await expect(ribbon(page)).toBeVisible();
  await expect(page.locator('[data-halloween]')).toHaveCount(0);
  await expect(page.locator('[data-visitor="jack"]')).toHaveCount(0);
});

for (const [w, h] of [[390, 844], [320, 568]] as const)
  test(`Halloween night: lanterns lit, Jack on the beach (not K.K. on this Saturday), a treat delights him (${w}px)`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    await page.goto('?demo&date=2026-10-31T19:00&critter=none');
    await expect(ribbon(page)).toBeVisible();
    const bells = await ribbon(page).getAttribute('aria-label');
    await expect(page.locator('[data-halloween="night"] .glow').first()).toBeVisible();
    await expect(page.locator('[data-visitor="kk-slider"]')).toHaveCount(0);
    const jack = page.locator('[data-visitor="jack"] .art');
    await expect(jack).toBeVisible();
    expect(await under(page, '[data-visitor="jack"] .art')).toEqual([]);
    expect(await under(page, '.pumpkin .art')).toEqual([]);
    if (w === 390) await page.waitForTimeout(500), await page.screenshot({ path: '/tmp/halloween/night-390.png' });
    await tapOn(page, '[data-visitor="jack"] .art');
    const box = page.locator('[data-fx="talk"].placed');
    await expect(box.locator('.who')).toHaveText('パンプキング');
    await expect(box).toHaveAttribute('data-pages', '3'); // the introduction (two pages), then the ask
    await toAnswers(page);
    // on a tall phone the question and its answers cover no control (a short one may put them over the island's)
    if (h > 800) expect(await under(page, '[data-fx="talk"], .choices.asking')).toEqual([]);
    if (w === 390) await page.screenshot({ path: '/tmp/halloween/jack-ask-390.png' });
    await page.getByRole('button', { name: 'キャンディを あげる' }).click();
    await expect(page.locator('[data-treat] .candy')).toBeVisible();
    await expect(page.locator('[data-fx="talk"].placed .sr')).toContainText('キャンディ');
    if (w === 390) await page.waitForTimeout(300), await page.screenshot({ path: '/tmp/halloween/jack-treat-390.png' });
    await expect(page.locator('[data-tricked]')).toHaveCount(0);
    // after a treat he just chats (no ask)
    await page.waitForTimeout(400);
    await tapOn(page, '[data-visitor="jack"] .art');
    await expect(page.locator('[data-fx="talk"].placed')).toHaveAttribute('data-pages', '1');
    await expect(page.locator('.choices')).toHaveCount(0);
    await expect(ribbon(page)).toHaveAttribute('aria-label', bells!);
  });

test('nothing for Jack: his trick puts goofy glasses on my villager', async ({ page }) => {
  await page.goto('?demo&date=2026-10-31T23:59&critter=none');
  await expect(ribbon(page)).toBeVisible();
  await tapOn(page, '[data-visitor="jack"] .art');
  await toAnswers(page);
  await page.getByRole('button', { name: 'なにも あげない' }).click();
  await expect(page.locator('[data-tricked]')).toHaveCount(1);
  await expect(page.locator('[data-fx="talk"].placed .sr')).toContainText('イタズラ');
  await page.waitForTimeout(600);
  await page.screenshot({ path: '/tmp/halloween/jack-trick-390.png' });
  // only my villager's face, on the left
  const g = (await page.locator('[data-tricked]').boundingBox())!;
  expect(g.x + g.width / 2).toBeLessThan(195);
  // asking again (no candy yet): the ask alone
  // tap the trick line away (finish, then close; it may have finished typing already)
  const talk = page.locator('[data-fx="talk"].placed');
  for (let i = 0; i < 4 && (await talk.count()); i++) await talk.click({ timeout: 1000 }).catch(() => {});
  await expect(talk).toHaveCount(0);
  await tapOn(page, '[data-visitor="jack"] .art');
  await expect(page.locator('[data-fx="talk"].placed')).toHaveAttribute('data-pages', '1');
});

test('?event=halloween brings the evening on any day', async ({ page }) => {
  await page.goto('?demo&date=2026-11-04T12:00&event=halloween&critter=none');
  await expect(ribbon(page)).toBeVisible();
  await expect(page.locator('[data-visitor="jack"] .art')).toBeVisible();
  await expect(page.locator('[data-halloween="night"]')).toHaveCount(1);
});
