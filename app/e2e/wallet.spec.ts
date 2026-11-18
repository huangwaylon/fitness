// The かいがら wallet (docs/backend.md#the-wallet): the phone shows the relay's stored number, its own unsent ops on top.
// Offline, a buy shows at once (the pending estimate); the record, its かいがら spent meanwhile, refuses it: the number
// snaps back to the record's (the ack's wallet) and the toast says why, not the generic save failure. Both browsers
// (test-webkit rule: taps, the queue, the toast).
import { expect, test, type Page } from './fixtures.ts';
import { newRecord } from './record.ts';
import { PINNED_DATE } from './fixtures.ts';

test.use({ viewport: { width: 393, height: 852 } });
const D = PINNED_DATE.slice(0, 10);
const shells = async (page: Page) => Number(await page.locator('[data-shop]').getAttribute('data-shells'));

test('an offline buy shows at once; refused by the record (its かいがら spent meanwhile), the number is the record’s again and the toast says why', async ({ page, context }) => {
  const rec = newRecord();
  // 2 whale sharks sold: the record's wallet
  expect(rec.event('A', 'tally', { date: D, counts: { 'fish:whale-shark': 2 } })).toMatchObject({ ok: true });
  expect(rec.event('A', 'sell', { species: 'fish:whale-shark', n: 2, v: 13_000 })).toMatchObject({ ok: true });
  const h = rec.wallet('A');
  expect(h).toBe(13_000);
  await rec.pair(context, 'A');
  await page.goto('shop');
  await expect.poll(() => shells(page), { timeout: 15_000 }).toBe(h);

  // the relay out of reach: a piece bought shows at once, the wallet less its price
  rec.offline(true);
  await page.waitForFunction(() => !!(window as unknown as { __shop?: object }).__shop);
  await page.evaluate(() => (window as unknown as { __shop: { talk(): void } }).__shop.talk());
  await page.locator('[data-shop-tab="buy"]').click();
  const stock = page.locator('[data-shop-stock] [data-shop-item]');
  await expect(stock).toHaveCount(24);
  const [code, price] = (await stock.evaluateAll((els) => els.map((e): [string, number] => [e.getAttribute('data-shop-item')!, Number(e.getAttribute('data-price'))])))
    .filter(([, p]) => p > 1 && p <= 13_000).sort((a, b) => b[1] - a[1])[0];
  await page.locator(`[data-shop-item="${code}"]`).click();
  await page.locator('[data-shop-buy]').click();
  await expect.poll(() => shells(page)).toBe(h - price);
  await expect(page.locator(`[data-shop-item="${code}"]`)).toHaveAttribute('data-owned', 'true');

  // meanwhile the record's かいがら go (spent elsewhere; here the admin's correction): 1 left
  expect(rec.adjust('A', -(h - 1))).toMatchObject({ ok: true, after: 1 });
  // back online: the queued buy goes, the record refuses it (`wallet short`), its ack carries the wallet
  rec.offline(false);
  await page.evaluate(() => dispatchEvent(new Event('online')));
  await expect(page.locator('.banner[role="status"] .txt')).toHaveText('かいがらが足りず、買えませんでした', { timeout: 20_000 });
  await expect.poll(() => shells(page)).toBe(1);
  await expect(page.locator(`[data-shop-item="${code}"]`)).toHaveAttribute('data-owned', 'false');
  expect(rec.sent.filter((s) => s.type === 'buy').map((s) => [s.ok, s.error])).toEqual([[false, 'bad_request']]);
});
