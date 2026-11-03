// Group stretching (docs/design.md "Group stretching"): NH's ラジオ体操. The tape deck comes out on a day either of us met
// 🍑 Exercise or when the island is opened 06:00–08:00, clear of every control; a tap plays its tape (the `stretch`
// cue) and both villagers and the visitor do the same three stretches together (~6 s); then the deck is gone for the
// day on this phone. No ベル.
import { expect, test, type Page } from '@playwright/test';

const ribbon = (page: Page) => page.getByRole('button', { name: /^きょう [\d,]+\sベル$/ });
const deck = (page: Page) => page.locator('[data-stretch] .radio');
/** The controls under the deck's corners and middle. */
const under = (page: Page) =>
  page.evaluate(() => {
    const b = document.querySelector('[data-stretch] .radio')!.getBoundingClientRect();
    const pts = [[b.left + 2, b.top + 2], [b.right - 2, b.top + 2], [b.left + 2, b.bottom - 2], [b.right - 2, b.bottom - 2], [(b.left + b.right) / 2, (b.top + b.bottom) / 2]];
    return pts.flatMap(([x, y]) => document.elementsFromPoint(x, y).filter((e) => e.closest('button')).map((e) => e.className));
  });
/** What each of the villagers and the visitor is doing (their rig's motion). */
const acts = (page: Page) =>
  page.evaluate(() => [...document.querySelectorAll('.vil .body, [data-visitor] .body')].map((e) => e.getAttribute('data-act')));

for (const [w, h] of [[390, 844], [320, 568]] as const)
  test(`a morning: the tape deck is out, clear of every control; a tap and everyone stretches in sync (${w}px)`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    await page.addInitScript(() => ((window as { __cues?: string[] }).__cues = []));
    await page.goto('?demo&date=2026-11-01T07:00&critter=none'); // a Sunday morning: Daisy Mae is on the beach
    await expect(ribbon(page)).toBeVisible();
    const bells = await ribbon(page).getAttribute('aria-label');
    await expect(deck(page)).toBeVisible();
    await expect(page.locator('[data-visitor="daisy-mae"] .art')).toBeVisible();
    expect(await under(page)).toEqual([]);
    // every change of what they're doing, recorded in the page (a sample from the test could miss a 2 s pose on a busy
    // runner): the three poses, each by everyone at once, in order
    await page.evaluate(() => {
      const w = window as { __acts?: string[] };
      w.__acts = [];
      const snap = () => {
        const a = [...document.querySelectorAll('.vil .body, [data-visitor] .body')].map((e) => e.getAttribute('data-act'));
        const s = a.join(',');
        if (w.__acts![w.__acts!.length - 1] !== s) w.__acts!.push(s);
      };
      new MutationObserver(snap).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['data-act'], childList: true });
    });
    const r = (await deck(page).boundingBox())!;
    await page.mouse.click(r.x + r.width / 2, r.y + r.height / 2);
    await expect(page.locator('[data-stretch="on"]')).toBeAttached();
    expect(await page.evaluate(() => (window as { __cues?: string[] }).__cues)).toContain('stretch');
    await expect(page.locator('[data-stretch]')).toHaveCount(0, { timeout: 15_000 });
    const seen = await page.evaluate(() => (window as { __acts?: string[] }).__acts ?? []);
    const at = ['warmup', 'sidebend', 'leap'].map((p) => seen.indexOf([p, p, p].join(',')));
    expect(at.every((i) => i >= 0), seen.join(' | ')).toBe(true);
    expect([...at].sort((a, b) => a - b)).toEqual(at);
    await expect(ribbon(page)).toHaveAttribute('aria-label', bells!);
    // once a day per phone
    await page.reload();
    await expect(ribbon(page)).toBeVisible();
    await page.waitForTimeout(800);
    await expect(page.locator('[data-stretch]')).toHaveCount(0);
  });

test('no deck on a later hour without Exercise met; a morning opening keeps it out for the day', async ({ page }) => {
  await page.goto('?demo&date=2026-11-02T09:00');
  await expect(ribbon(page)).toBeVisible();
  await page.waitForTimeout(800);
  await expect(page.locator('[data-stretch]')).toHaveCount(0);
  await page.goto('?demo&date=2026-11-02T06:10');
  await expect(deck(page)).toBeVisible();
  await page.goto('?demo&date=2026-11-02T09:00');
  await expect(deck(page)).toBeVisible();
});
