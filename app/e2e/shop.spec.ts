// The shop (docs/design.md "The shop"): タヌキ商店's counter, its うる (my pocket: what I caught, from my day tallies,
// less what I sold) and かう (the day's stock), my かいがら; a bought piece in my もようがえ; the guest's pocket and
// かいがら its own; overselling and overspending refused. On `?demo` (no backend): the demo's events in localStorage, as
// a catch writes them. In by its door and back out: positions.spec (both islands).
import { expect, test, type Page } from './fixtures.ts';

test.use({ viewport: { width: 393, height: 852 } });
const DATE = '2026-11-04T12:00';
const Q = `?demo&date=${DATE}`;
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
const stock = (page: Page) => page.locator('[data-shop-stock] [data-shop-item]');
/** The first piece of the day's stock whose price is `ok`: its code and price. */
const pieceOf = async (page: Page, ok: (price: number) => boolean): Promise<[string, number]> => {
  await expect(stock(page)).toHaveCount(24);
  const all = await stock(page).evaluateAll((els) => els.map((e): [string, number] => [e.getAttribute('data-shop-item')!, Number(e.getAttribute('data-price'))]));
  return all.find(([, p]) => ok(p))!;
};
const tally = (counts: Record<string, number>, who: 'A' | 'B' | 'G' = 'A'): Seed => ['tally', { date: '2026-11-04', counts }, who];

test('a catch is in my pocket; sold, かいがら rise; a piece bought from the stock is in my もようがえ and かいがら fall', async ({ page }) => {
  await seed(page, [tally({ 'fish:whale-shark': 2, 'bug:tarantula': 1, 'shell:cowrie': 3 })]);
  await page.goto(`shop${Q}`);
  await expect(page.locator('[data-shop]')).toBeVisible();
  expect(await shells(page)).toBe(0);
  // the pocket by its sections (むし, さかな, …, かいがら), each dearest first
  const pocket = page.locator('[data-shop-pocket] [data-shop-catch]');
  await expect(pocket).toHaveCount(3);
  await expect(page.locator('[data-shop-sec]')).toHaveText(['虫', '魚', 'かいがら']);
  await expect(pocket.nth(1)).toHaveAttribute('data-shop-catch', 'fish:whale-shark');
  await expect(pocket.nth(1)).toHaveAttribute('data-n', '2');
  // pick one whale shark: the offer; a third tap past the pocket goes back to none (never more than it holds)
  const shark = page.locator('[data-shop-catch="fish:whale-shark"]');
  await shark.click();
  await expect(page.locator('[data-shop-offer]')).toHaveAttribute('data-shop-offer', '650');
  await shark.click();
  await shark.click();
  await expect(shark).toHaveAttribute('data-picked', '0');
  await shark.click();
  await page.locator('[data-shop-sell]').click();
  await expect.poll(() => shells(page)).toBe(650);
  await expect(page.locator('[data-shop-say]')).toHaveAttribute('data-shop-say', 'thanks');
  await expect(shark).toHaveAttribute('data-n', '1');
  // the rest at once (ぜんぶ)
  await page.locator('[data-shop-all]').click();
  await page.locator('[data-shop-sell]').click();
  await expect.poll(() => shells(page)).toBe(650 + 650 + 400 + 3 * 3); // a cowrie 3
  await expect(page.locator('[data-shop-empty]')).toBeVisible();
  // かう: the day's stock, 24 pieces (no いつもの); one at most 1,709
  await page.locator('[data-shop-tab="buy"]').click();
  await expect(stock(page)).toHaveCount(24);
  const [code, price] = await pieceOf(page, (p) => p <= 1709);
  const item = page.locator(`[data-shop-item="${code}"]`);
  await item.click();
  await page.locator('[data-shop-buy]').click();
  await expect.poll(() => shells(page)).toBe(1709 - price);
  await expect(item).toHaveAttribute('data-owned', 'true');
  // bought once: picked again, かう only boops (and still in today's stock)
  await item.click();
  await expect(page.locator('[data-shop-buy]')).toHaveAttribute('aria-disabled', 'true');
  await expect(page.locator('[data-shop-say]')).toHaveAttribute('data-shop-say', 'owned');
  // the piece is in my もようがえ (かった)
  await page.goto(`tent${Q}`);
  await page.waitForFunction(() => ((window as unknown as { __tent?: { stats(): { frames: number } } }).__tent?.stats()?.frames ?? 0) > 0);
  await page.locator('[data-tent-edit-open]').click();
  await page.locator('[data-tab="bought"]').click();
  await expect(page.locator(`[data-tent-items] [data-tent-item="${code}"]`)).toBeVisible();
});

const SHOTS = process.env.SHOTS;
/** The price of each piece of the day's stock, in its order. */
const prices = (page: Page) => stock(page).evaluateAll((els) => els.map((e): [string, number] => [e.getAttribute('data-shop-item')!, Number(e.getAttribute('data-price'))]));

test('全部: every piece of the stock I don’t have, its count and total said first; かう buys them at once, one undo, then all 持っている', async ({ page }) => {
  await seed(page, [tally({ 'fish:whale-shark': 999 }), ['sell', { species: 'fish:whale-shark', n: 999, v: 999 * 650 }, 'A']]);
  await page.goto(`shop${Q}`);
  const S = 999 * 650;
  await expect.poll(() => shells(page)).toBe(S);
  await expect(page.locator('[data-shop-tab="buy"]')).toHaveAttribute('aria-pressed', 'true'); // nothing left to sell
  await expect(stock(page)).toHaveCount(24);
  const all = await prices(page);
  // one bought first: 全部 leaves it out
  const [first, p1] = all[0];
  await page.locator(`[data-shop-item="${first}"]`).click();
  await page.locator('[data-shop-buy]').click();
  await expect.poll(() => shells(page)).toBe(S - p1);
  const total = all.slice(1).reduce((a, [, p]) => a + p, 0);
  const allBtn = page.locator('[data-shop-buy-all]');
  await expect(allBtn).toHaveText('全部');
  await allBtn.click();
  await expect(allBtn).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-shop-pick]')).toHaveAttribute('data-shop-total', String(total));
  await expect(page.locator('[data-shop-pick]')).toHaveText(`23個で${total.toLocaleString('ja-JP')}かいがら`);
  await expect(page.locator('[data-shop-say]')).toHaveText(`ぜんぶ 23こで ${total.toLocaleString('ja-JP')} かいがらだも！`);
  await expect(page.locator('.tile.on')).toHaveCount(23);
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/shop-buyall-confirm.png`, animations: 'disabled' });
  // a tap on a piece picks it alone; 全部 again: the lot
  await page.locator(`[data-shop-item="${all[2][0]}"]`).click();
  await expect(allBtn).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('.tile.on')).toHaveCount(1);
  await allBtn.click();
  await page.locator('[data-shop-buy]').click();
  await expect.poll(() => shells(page)).toBe(S - p1 - total);
  await expect(page.locator('[data-shop-say]')).toHaveAttribute('data-shop-say', 'thanks');
  await expect(page.locator('.banner[role="status"] .txt')).toHaveText(`23個を${total.toLocaleString('ja-JP')}かいがらで買いました。模様替えに入っています`);
  // one undo takes back the lot
  await page.getByRole('button', { name: '取り消す' }).click();
  await expect.poll(() => shells(page)).toBe(S - p1);
  await expect(page.locator('[data-shop-stock] [data-owned="true"]')).toHaveCount(1);
  // again, and kept: every piece 持っている, 全部 has nothing left
  await allBtn.click();
  await page.locator('[data-shop-buy]').click();
  await expect.poll(() => shells(page)).toBe(S - p1 - total);
  await expect(page.locator('[data-shop-stock] [data-owned="true"]')).toHaveCount(24);
  await expect(allBtn).toHaveAttribute('aria-disabled', 'true');
  await expect(allBtn).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('[data-shop-pick]')).toHaveText('すべて持っています');
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/shop-buyall-done.png`, animations: 'disabled' });
});

test('全部 past my かいがら: the twins say how many short, かう only boops, nothing bought (never a part of it)', async ({ page }) => {
  await seed(page, [tally({ 'fish:whale-shark': 1 }), ['sell', { species: 'fish:whale-shark', n: 1, v: 650 }, 'A']]);
  await page.goto(`shop${Q}`);
  await expect.poll(() => shells(page)).toBe(650);
  await expect(stock(page)).toHaveCount(24);
  const total = (await prices(page)).reduce((a, [, p]) => a + p, 0);
  expect(total).toBeGreaterThan(650);
  await page.locator('[data-shop-buy-all]').click();
  await expect(page.locator('[data-shop-say]')).toHaveText(`ぜんぶだと ${(total - 650).toLocaleString('ja-JP')} かいがら たりないだも…`);
  await expect(page.locator('[data-shop-pick]')).toHaveText(`24個で${total.toLocaleString('ja-JP')}かいがら`);
  await expect(page.locator('[data-shop-buy]')).toHaveAttribute('aria-disabled', 'true');
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/shop-buyall-short.png`, animations: 'disabled' });
  await page.locator('[data-shop-buy]').click({ force: true });
  expect(await shells(page)).toBe(650);
  await expect(page.locator('[data-shop-stock] [data-owned="true"]')).toHaveCount(0);
});

// (a piece found before the day leaves the stock: shop/stock.test; the demo stamps its seeded rows today)
test('a piece found or bought today stays in the day’s stock till tomorrow, the same on every phone', async ({ page }) => {
  // the day's first two pieces (contract/shop.test pins the order): the tin bucket found by the guest this morning,
  // the unicorn toy bought by B
  await seed(page, [tally({ 'fish:whale-shark': 1 }, 'B'), ['sell', { species: 'fish:whale-shark', n: 1, v: 650 }, 'B'],
    ['find', { kind: 'item', id: 'tin-bucket' }, 'G'], ['buy', { item: 'f14354', price: 70, d: '2026-11-04' }, 'B']]);
  await page.goto(`shop${Q}`);
  await expect(stock(page)).toHaveCount(24);
  await expect(stock(page).nth(0)).toHaveAttribute('data-shop-item', 'f2592');
  await expect(stock(page).nth(1)).toHaveAttribute('data-shop-item', 'f14354');
  await expect(page.locator('[data-shop-sold-out]')).toHaveCount(0);
});

test('overspending is refused: too dear, かう only boops and the twins say so; a forged sell past the pocket counts for nothing', async ({ page }) => {
  // a sell of more koi than were caught (the record would refuse it): ignored, no かいがら
  await seed(page, [tally({ 'fish:sea-bass': 1 }), ['sell', { species: 'fish:koi', n: 5, v: 200 }, 'A'], ['sell', { species: 'fish:sea-bass', n: 1, v: 4 }, 'A']]);
  await page.goto(`shop${Q}`);
  await expect.poll(() => shells(page)).toBe(4);
  await page.locator('[data-shop-tab="buy"]').click();
  const [dear] = await pieceOf(page, (p) => p > 4);
  await page.locator(`[data-shop-item="${dear}"]`).click();
  await expect(page.locator('[data-shop-say]')).toHaveAttribute('data-shop-say', 'short');
  await expect(page.locator('[data-shop-buy]')).toHaveAttribute('aria-disabled', 'true');
  await page.locator('[data-shop-buy]').click({ force: true });
  expect(await shells(page)).toBe(4);
  await expect(page.locator(`[data-shop-item="${dear}"]`)).toHaveAttribute('data-owned', 'false');
});

// Nothing to sell: the shop opens on かう (health plan C7: an empty うる was a dead end, its bar's 売る disabled under
// 500 px of nothing); うる then says why, with no bar.
test('an empty pocket opens the shop on かう; うる says it’s empty, no 売る bar', async ({ page }) => {
  await seed(page, []);
  await page.goto(`shop${Q}`);
  await expect(page.locator('[data-shop-tab="buy"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(stock(page).first()).toBeVisible();
  await expect(page.locator('[data-shop-say]')).toHaveAttribute('data-shop-say', 'stock');
  await page.locator('[data-shop-tab="sell"]').click();
  await expect(page.locator('[data-shop-empty]')).toHaveText('ポケットは空です。魚や虫、かいがらや木材を拾ったら、ここで売れます');
  await expect(page.locator('[data-shop-sell], [data-shop-offer]')).toHaveCount(0);
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
  await expect.poll(() => shells(g)).toBe(400);
  await g.locator('[data-shop-tab="buy"]').click();
  const [code, price] = await pieceOf(g, (p) => p <= 400);
  await g.locator(`[data-shop-item="${code}"]`).click();
  await g.locator('[data-shop-buy]').click();
  await expect.poll(() => shells(g)).toBe(400 - price);
  // a member's phone on the same record: A's own
  const a = await ctx.newPage();
  await a.goto(`shop${Q}`);
  await expect.poll(() => shells(a)).toBe(1170);
  await expect(a.locator('[data-shop-pocket] [data-shop-catch]')).toHaveCount(0);
  await ctx.close();
});

