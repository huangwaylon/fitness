// The shop (docs/design.md "The shop"): タヌキ商店's counter, its うる (my pocket: what I caught, from my day tallies,
// less what I sold) and かう (the day's stock), my かいがら; a bought piece in my もようがえ; the guest's pocket and
// かいがら its own; overselling and overspending refused. On `?demo` (no backend): the demo's events in localStorage, as
// a catch writes them. Screenshots of the counter by day and by night (test-results/shop-*.png).
import { expect, test, type Page } from '@playwright/test';
import { is3d, settled, tapOn } from './island';

test.use({ viewport: { width: 393, height: 852 } });
const DATE = '2026-11-04T12:00';
const Q = `?demo&date=${DATE}&critter=none&visitor=none`;
type Seed = [type: string, data: object, who: 'A' | 'B' | 'G'];
/** The demo's events (as a catch, a sell or a buy writes them). */
const seed = (page: Page, events: Seed[]) =>
  page.addInitScript((list) => {
    if (localStorage.getItem('island-demo.events')) return;
    const at = Date.parse('2026-11-04T09:00:00+09:00');
    const rows = list.map(([type, data, person], i) => ({ id: `seed-${i}`, type, data, queuedAt: at + i, tries: 0, nextAt: 0, ackedAt: at + i, person }));
    localStorage.setItem('island-demo.events', JSON.stringify({ day: '2026-11-04', events: rows }));
  }, events);
const shells = async (page: Page) => Number(await page.locator('[data-shop]').getAttribute('data-shells'));
const tally = (counts: Record<string, number>, who: 'A' | 'B' | 'G' = 'A'): Seed => ['tally', { date: '2026-11-04', counts }, who];

test('a catch is in my pocket; sold, かいがら rise; a piece bought from the stock is in my もようがえ and かいがら fall', async ({ page }) => {
  await seed(page, [tally({ 'fish:whale-shark': 2, 'bug:tarantula': 1, 'shell:cowrie': 3 })]);
  await page.goto(`shop${Q}`);
  await expect(page.locator('[data-shop]')).toBeVisible();
  expect(await shells(page)).toBe(0);
  // the pocket: the catches (never a shell), most valuable first
  const pocket = page.locator('[data-shop-pocket] [data-shop-catch]');
  await expect(pocket).toHaveCount(2);
  await expect(pocket.first()).toHaveAttribute('data-shop-catch', 'fish:whale-shark');
  await expect(pocket.first()).toHaveAttribute('data-n', '2');
  // pick one whale shark: the offer; a third tap past the pocket goes back to none (never more than it holds)
  const shark = page.locator('[data-shop-catch="fish:whale-shark"]');
  await shark.click();
  await expect(page.locator('[data-shop-offer]')).toHaveAttribute('data-shop-offer', '130');
  await shark.click();
  await shark.click();
  await expect(shark).toHaveAttribute('data-picked', '0');
  await shark.click();
  await page.locator('[data-shop-sell]').click();
  await expect.poll(() => shells(page)).toBe(130);
  await expect(page.locator('[data-shop-say]')).toHaveAttribute('data-shop-say', 'thanks');
  await expect(shark).toHaveAttribute('data-n', '1');
  // the rest at once (ぜんぶ)
  await page.locator('[data-shop-all]').click();
  await page.locator('[data-shop-sell]').click();
  await expect.poll(() => shells(page)).toBe(130 + 130 + 80);
  await expect(page.locator('[data-shop-empty]')).toBeVisible();
  // かう: the day's stock and the basics; a cardboard box (6)
  await page.locator('[data-shop-tab="buy"]').click();
  await expect(page.locator('[data-shop-stock] [data-shop-item]')).toHaveCount(8);
  await page.locator('[data-shop-item="f3672"]').click();
  await page.locator('[data-shop-buy]').click();
  await expect.poll(() => shells(page)).toBe(340 - 6);
  await expect(page.locator('[data-shop-item="f3672"]')).toHaveAttribute('data-owned', 'true');
  // bought once: picked again, かう only boops
  await page.locator('[data-shop-item="f3672"]').click();
  await expect(page.locator('[data-shop-buy]')).toHaveAttribute('aria-disabled', 'true');
  await expect(page.locator('[data-shop-say]')).toHaveAttribute('data-shop-say', 'owned');
  // the piece is in my もようがえ (かった)
  await page.goto(`tent${Q}`);
  await page.waitForFunction(() => ((window as unknown as { __tent?: { stats(): { frames: number } } }).__tent?.stats()?.frames ?? 0) > 0);
  await page.locator('[data-tent-edit-open]').click();
  await page.locator('[data-tab="bought"]').click();
  await expect(page.locator('[data-tent-items] [data-tent-item="f3672"]')).toBeVisible();
});

test('overspending is refused: too dear, かう only boops and the twins say so; a forged sell past the pocket counts for nothing', async ({ page }) => {
  // a sell of more koi than were caught (the record would refuse it): ignored, no かいがら
  await seed(page, [tally({ 'fish:sea-bass': 1 }), ['sell', { species: 'fish:koi', n: 5, v: 200 }, 'A'], ['sell', { species: 'fish:sea-bass', n: 1, v: 4 }, 'A']]);
  await page.goto(`shop${Q}`);
  await expect.poll(() => shells(page)).toBe(4);
  await page.locator('[data-shop-tab="buy"]').click();
  await page.locator('[data-shop-item="f7047"]').click(); // the zen cushion, 25
  await expect(page.locator('[data-shop-say]')).toHaveAttribute('data-shop-say', 'short');
  await expect(page.locator('[data-shop-buy]')).toHaveAttribute('aria-disabled', 'true');
  await page.locator('[data-shop-buy]').click({ force: true });
  expect(await shells(page)).toBe(4);
  await expect(page.locator('[data-shop-item="f7047"]')).toHaveAttribute('data-owned', 'false');
});

test('the guest’s pocket and かいがら are its own', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 393, height: 852 } });
  const g = await ctx.newPage();
  await seed(g, [tally({ 'fish:whale-shark': 9 }, 'A'), ['sell', { species: 'fish:whale-shark', n: 9, v: 1170 }, 'A'], tally({ 'bug:tarantula': 1 }, 'G')]);
  await g.goto(`shop${Q}&as=G`);
  await expect(g.locator('[data-shop]')).toBeVisible();
  expect(await shells(g)).toBe(0); // A's 1,170 aren't the guest's
  await expect(g.locator('[data-shop-pocket] [data-shop-catch]')).toHaveCount(1);
  await g.locator('[data-shop-catch="bug:tarantula"]').click();
  await g.locator('[data-shop-sell]').click();
  await expect.poll(() => shells(g)).toBe(80);
  await g.locator('[data-shop-tab="buy"]').click();
  await g.locator('[data-shop-item="f3672"]').click();
  await g.locator('[data-shop-buy]').click();
  await expect.poll(() => shells(g)).toBe(74);
  // a member's phone on the same record: A's own
  const a = await ctx.newPage();
  await a.goto(`shop${Q}`);
  await expect.poll(() => shells(a)).toBe(1170);
  await expect(a.locator('[data-shop-pocket] [data-shop-catch]')).toHaveCount(0);
  await ctx.close();
});

test('the shop stands on the layout with its door; a tap walks up to it and goes in; ‹ 島へ comes out of its door', async ({ page }) => {
  await page.goto(`./?demo&visitor=none&critter=none&date=${DATE}`);
  expect(await is3d(page)).toBe(true);
  const door = await page.evaluate(() => (window as unknown as { __world: { site(): { doors: Record<string, [number, number]> } } }).__world.site().doors.shop);
  expect(door).toBeTruthy();
  await page.evaluate(`window.__world.go(${door[1] - 120})`);
  // (at rest: its camera still and its nodes placed for it; the DOM door's box stays where the last camera had it for
  // a beat after the camera stops, and a tap found on that box landed off the door once it was placed)
  await settled(page);
  await tapOn(page, page.locator('[data-building="shop"] .door'));
  await expect(page).toHaveURL(/\/shop\/?\?/, { timeout: 20_000 });
  await expect(page.locator('[data-shop]')).toBeVisible();
  await page.getByRole('button', { name: '島へ' }).click();
  await expect(page).toHaveURL(/fitness\/?\?/);
  await expect.poll(async () => {
    const [x, z] = await page.evaluate('window.__world.mine()') as [number, number];
    return Math.hypot(x - door[0], z - door[1]);
  }).toBeLessThan(60);
});

for (const [when, hm] of [['day', '12:00'], ['night', '22:30']] as const) {
  test(`the counter, by ${when} (screenshot)`, async ({ page }) => {
    await seed(page, [tally({ 'fish:koi': 2, 'bug:tarantula': 1, 'sea:octopus': 3, 'fish:sea-bass': 4, 'bug:common-butterfly': 2 })]);
    await page.goto(`shop?demo&date=2026-11-04T${hm}&critter=none&visitor=none`);
    await expect(page.locator('[data-shop]')).toBeVisible();
    await page.locator('[data-shop-catch="fish:koi"]').click();
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(400);
    await page.screenshot({ path: `test-results/shop-${when}-sell.png` });
    await page.locator('[data-shop-tab="buy"]').click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: `test-results/shop-${when}-buy.png` });
  });
}
