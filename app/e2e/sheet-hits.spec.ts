// The sheets' small controls (docs/design.md "Unified kit": a 32px chip, a 24px tick, drawn in a 44px hit): a tap
// anywhere in the 44 × 44 box round each one's middle lands on it (elementFromPoint), its scroller or a neighbour never
// taking an edge. Health plan C5: the wedding filters' row clipped their hits to 38px, km | mi's were 38–41px wide.
import { expect, test, type Locator, type Page } from './fixtures.ts';
import { fromMenu } from './hud.ts';

test.use({ viewport: { width: 393, height: 852 } });

/** How far round its middle a tap still lands on each control shown whole (px, up to 22 each way): its hit's width
 *  and height. */
const hits = (l: Locator) =>
  l.evaluateAll((els) =>
    els.flatMap((el) => {
      const r = el.getBoundingClientRect();
      const box = (el.closest('.chip-row') ?? document.documentElement).getBoundingClientRect();
      if (!r.width || r.left < box.left || r.right > box.right) return []; // (scrolled out of its row)
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const own = (x: number, y: number) => { const h = document.elementFromPoint(x, y); return !!h && (h === el || el.contains(h)); };
      const reach = (dx: number, dy: number) => { let d = 0; while (d < 22 && own(cx + dx * (d + 1), cy + dy * (d + 1))) d++; return d; };
      return [`${el.textContent?.trim()} ${reach(-1, 0) + reach(1, 0) + 1}×${reach(0, -1) + reach(0, 1) + 1}`];
    }));
/** Measured at rest: a sheet's open and a level's push (its slide in from the right, 240 ms) over first; mid-slide, a
 *  chip whole in its row can sit past the screen's edge, where nothing is hit. */
const all44 = async (l: Locator) => {
  await l.page().locator('dialog[open]').evaluate((d) =>
    Promise.all(d.getAnimations({ subtree: true }).filter((a) => a.effect?.getTiming().iterations !== Infinity).map((a) => a.finished.catch(() => {}))));
  const hs = await hits(l);
  expect(hs.length).toBeGreaterThan(0);
  for (const h of hs) expect(h, h).toMatch(/ (4[4-5])×(4[4-5])$/);
};

async function island(page: Page) {
  await page.goto('?demo&date=2026-11-04T12:00');
  await expect(page.getByRole('button', { name: 'けんこう', exact: true })).toBeVisible({ timeout: 15_000 });
}

test('けっこんしき’s filter chips and トレイル’s: a 44 × 44 hit each', async ({ page }) => {
  await island(page);
  await fromMenu(page, 'wedding');
  await expect(page.locator('dialog[open] [data-wed-filter]').first()).toBeVisible();
  await all44(page.locator('dialog[open] [data-wed-filter]'));
  await page.locator('dialog[open] .navbar button.nav.close').click();
  await fromMenu(page, 'hiking');
  const chips = page.locator('dialog[open] .chip-row .chip');
  await expect(chips.first()).toBeVisible();
  await all44(chips);
});

test('りょこう’s km | mi and a trip’s day chips: a 44 × 44 hit each', async ({ page }) => {
  await island(page);
  await fromMenu(page, 'travel');
  await all44(page.locator('dialog[open] [data-units]'));
  await page.locator('dialog[open] [data-trip="nz"]').click();
  const days = page.locator('dialog[open] .chip-row .chip');
  await expect(days.first()).toBeVisible();
  await all44(days);
});
