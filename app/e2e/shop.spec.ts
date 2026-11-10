// The shop (docs/design.md "The shop"): タヌキ商店 in 3D (the twins at the counter, today's stock shown in the room: a
// tap on a piece is its card and 買う; a tap on the twins their choice box), and its counter's lists over the room: うる
// (my pocket: what I caught, from my day tallies, less what I sold) and かう (the day's stock, 全部), my かいがら; a bought
// piece in my もようがえ; the guest's pocket and かいがら its own; overselling and overspending refused. On `?demo` (no
// backend): the demo's events in localStorage, as a catch writes them. In by its door and back out: positions.spec
// (both islands).
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
const SHOTS = process.env.SHOTS;
const tally = (counts: Record<string, number>, who: 'A' | 'B' | 'G' = 'A'): Seed => ['tally', { date: '2026-11-04', counts }, who];
/** The counter's list over the room: うる or かう, by the twins' choice box (as a tap on them: the 3D tests tap them). */
const openList = async (page: Page, tab: 'sell' | 'buy') => {
  await page.waitForFunction(() => !!(window as unknown as { __shop?: object }).__shop);
  await page.evaluate(() => (window as unknown as { __shop: { talk(): void } }).__shop.talk());
  await page.locator(`[data-shop-choice="${tab}"]`).click();
  await expect(page.locator('[data-shop-panel]')).toHaveAttribute('data-shop-panel', tab);
};
type ShopHooks = {
  stats(): { frames: number } | undefined; loading(): number; still(): boolean;
  shown(): { item: string; at: [number, number]; y: number }[]; rest(): string[];
  piece(code: string): [number, number] | null; twin(id: 'timmy' | 'tommy'): [number, number] | null;
  mine(): [number, number] | null; walking(): boolean; standable(x: number, z: number): boolean;
};
/** The room up: its first frame, every model in, the camera at rest. */
const roomIn = (page: Page) => page.waitForFunction(() => {
  const s = (window as unknown as { __shop?: ShopHooks }).__shop;
  return !!s && (s.stats()?.frames ?? 0) > 0 && s.loading() === 0 && s.still() && !s.walking();
}, undefined, { timeout: 30_000 });
const hooks = <T>(page: Page, f: (s: ShopHooks) => T) => page.evaluate((src) => new Function('s', `return (${src})(s)`)((window as unknown as { __shop: ShopHooks }).__shop), f.toString()) as Promise<T>;

test('a catch is in my pocket; sold, かいがら rise; a piece bought from the stock is in my もようがえ and かいがら fall', async ({ page }) => {
  await seed(page, [tally({ 'fish:whale-shark': 2, 'bug:tarantula': 1, 'shell:cowrie': 3 })]);
  await page.goto(`shop${Q}`);
  await expect(page.locator('[data-shop]')).toBeVisible();
  expect(await shells(page)).toBe(0);
  await openList(page, 'sell');
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

/** The price of each piece of the day's stock, in its order. */
const prices = (page: Page) => stock(page).evaluateAll((els) => els.map((e): [string, number] => [e.getAttribute('data-shop-item')!, Number(e.getAttribute('data-price'))]));

test('全部: every piece of the stock I don’t have, its count and total said first; かう buys them at once, one undo, then all 持っている', async ({ page }) => {
  await seed(page, [tally({ 'fish:whale-shark': 999 }), ['sell', { species: 'fish:whale-shark', n: 999, v: 999 * 650 }, 'A']]);
  await page.goto(`shop${Q}`);
  const S = 999 * 650;
  await expect.poll(() => shells(page)).toBe(S);
  await openList(page, 'buy');
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
  await openList(page, 'buy');
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
  // the day's first two pieces (contract/shop.test pins the order): the omurice bought by B, the skeleton found by the
  // guest this morning
  await seed(page, [tally({ 'fish:whale-shark': 1 }, 'B'), ['sell', { species: 'fish:whale-shark', n: 1, v: 650 }, 'B'],
    ['buy', { item: 'f12830', price: 70, d: '2026-11-04' }, 'B'], ['find', { kind: 'item', id: 'skeleton' }, 'G']]);
  await page.goto(`shop${Q}`);
  await openList(page, 'buy');
  await expect(stock(page)).toHaveCount(24);
  await expect(stock(page).nth(0)).toHaveAttribute('data-shop-item', 'f12830');
  await expect(stock(page).nth(1)).toHaveAttribute('data-shop-item', 'f1326');
  await expect(page.locator('[data-shop-sold-out]')).toHaveCount(0);
});

test('overspending is refused: too dear, かう only boops and the twins say so; a forged sell past the pocket counts for nothing', async ({ page }) => {
  // a sell of more koi than were caught (the record would refuse it): ignored, no かいがら
  await seed(page, [tally({ 'fish:sea-bass': 1 }), ['sell', { species: 'fish:koi', n: 5, v: 200 }, 'A'], ['sell', { species: 'fish:sea-bass', n: 1, v: 4 }, 'A']]);
  await page.goto(`shop${Q}`);
  await expect.poll(() => shells(page)).toBe(4);
  await openList(page, 'buy');
  const [dear] = await pieceOf(page, (p) => p > 4);
  await page.locator(`[data-shop-item="${dear}"]`).click();
  await expect(page.locator('[data-shop-say]')).toHaveAttribute('data-shop-say', 'short');
  await expect(page.locator('[data-shop-buy]')).toHaveAttribute('aria-disabled', 'true');
  await page.locator('[data-shop-buy]').click({ force: true });
  expect(await shells(page)).toBe(4);
  await expect(page.locator(`[data-shop-item="${dear}"]`)).toHaveAttribute('data-owned', 'false');
});

// Nothing to sell: うる says why, with no bar (health plan C7: an empty うる was a dead end, its bar's 売る disabled
// under 500 px of nothing).
test('an empty pocket: うる says it’s empty, no 売る bar; かう has the day’s stock', async ({ page }) => {
  await seed(page, []);
  await page.goto(`shop${Q}`);
  await openList(page, 'buy');
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
  await openList(g, 'sell');
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
  await openList(a, 'sell');
  await expect(a.locator('[data-shop-pocket] [data-shop-catch]')).toHaveCount(0);
  await ctx.close();
});


test('the 3D shop: the twins at the counter, the day’s stock in the room; a tap on a piece is its card, 買う buys it in place', async ({ page }) => {
  await seed(page, [tally({ 'fish:whale-shark': 99 }), ['sell', { species: 'fish:whale-shark', n: 99, v: 99 * 650 }, 'A']]);
  await page.goto(`shop${Q}`);
  await roomIn(page);
  const S = 99 * 650;
  await expect.poll(() => shells(page)).toBe(S);
  // every piece of the day's stock in the room or (no place left) in the list: most shown
  const shownList = await hooks(page, (s) => s.shown());
  const rest = await hooks(page, (s) => s.rest());
  expect(shownList.length + rest.length).toBe(24);
  expect(shownList.length).toBeGreaterThanOrEqual(18);
  expect(await hooks(page, (s) => s.twin('timmy'))).not.toBeNull();
  // a piece on the stage, on screen and clear of the controls: tapped, its card (my villager turns to it, no walk)
  const vh = page.viewportSize()!.height;
  let target: { code: string; at: [number, number] } | null = null;
  for (const p of shownList) {
    const px = await page.evaluate((c) => (window as unknown as { __shop: ShopHooks }).__shop.piece(c), p.item);
    if (px && px[0] > 30 && px[0] < 363 && px[1] > 140 && px[1] < vh - 200) {
      target = { code: p.item, at: px };
      break;
    }
  }
  expect(target).not.toBeNull();
  const before = await hooks(page, (s) => s.mine());
  await page.mouse.click(target!.at[0], target!.at[1]);
  await expect(page.locator('[data-shop-card]')).toHaveAttribute('data-shop-card', target!.code);
  await expect(page.locator('[data-shop-say]')).toHaveAttribute('data-shop-say', 'price');
  expect(await hooks(page, (s) => s.walking())).toBe(false);
  expect(await hooks(page, (s) => s.mine())).toEqual(before);
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/shop3d-card.png`, animations: 'disabled' });
  await page.locator('[data-shop-card-buy]').click();
  await expect(page.locator('[data-shop-say]')).toHaveAttribute('data-shop-say', 'thanks');
  await expect(page.locator('[data-shop-card] .owned-tag')).toBeVisible();
  await expect(page.locator('[data-shop-card-buy]')).toHaveAttribute('aria-disabled', 'true');
  // in the list too, mine now, and the かいがら gone
  await openList(page, 'buy');
  const item = page.locator(`[data-shop-item="${target!.code}"]`);
  await expect(item).toHaveAttribute('data-owned', 'true');
  expect(await shells(page)).toBe(S - Number(await item.getAttribute('data-price')));
});

test('a tap on the twins is their choice box: うりたい opens うる at the counter, しなものを みたい the day’s list', async ({ page }) => {
  await seed(page, [tally({ 'fish:whale-shark': 1 })]);
  await page.goto(`shop${Q}`);
  await roomIn(page);
  // up to the counter (a floor tap there): the camera follows my villager, the twins come into view
  const counter = await page.evaluate(() => (window as unknown as { __shop: { counter(): [number, number]; walkTo(x: number, z: number): void } }).__shop.counter());
  await page.evaluate(([x, z]) => (window as unknown as { __shop: { walkTo(x: number, z: number): void } }).__shop.walkTo(x, z), counter);
  await roomIn(page);
  const twin = await hooks(page, (s) => s.twin('timmy'));
  expect(twin).not.toBeNull();
  await page.mouse.click(twin![0], twin![1] + 12);
  await expect(page.locator('[data-shop-choices]')).toBeVisible();
  await expect(page.locator('[data-shop-say]')).toHaveAttribute('data-shop-say', 'ask');
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/shop3d-twins.png`, animations: 'disabled' });
  await page.locator('[data-shop-choice="sell"]').click();
  await expect(page.locator('[data-shop-panel]')).toHaveAttribute('data-shop-panel', 'sell');
  await page.locator('[data-shop-catch="fish:whale-shark"]').click();
  await page.locator('[data-shop-sell]').click();
  await expect.poll(() => shells(page)).toBe(650);
  // closed: the room again; the twins again, the day's list
  await page.locator('[data-shop-close]').click();
  await expect(page.locator('[data-shop-panel]')).toHaveCount(0);
  await roomIn(page);
  const again = (await hooks(page, (s) => s.twin('timmy')))!;
  await page.mouse.click(again[0], again[1] + 12);
  await page.locator('[data-shop-choice="buy"]').click();
  await expect(page.locator('[data-shop-panel]')).toHaveAttribute('data-shop-panel', 'buy');
  await expect(stock(page)).toHaveCount(24);
});

// The twins' hello (docs/design.md "The shop"): not at the door, once I reach the counter; a small balloon that goes by
// itself after a few seconds or at a tap on it, never in the way of a tap on the room.
test('the twins say いらっしゃいませ once I reach the counter, not at the door; gone at a tap on it, or by itself', async ({ page }) => {
  await seed(page, []);
  const balloon = page.locator('.say.float');
  const toCounter = async () => {
    await roomIn(page);
    await expect(balloon).not.toHaveClass(/\bon\b/);
    const counter = await page.evaluate(() => (window as unknown as { __shop: { counter(): [number, number] } }).__shop.counter());
    await page.evaluate(([x, z]) => (window as unknown as { __shop: { walkTo(x: number, z: number): void } }).__shop.walkTo(x, z), counter);
    await expect(balloon).toHaveClass(/\bon\b/);
    await expect(balloon.locator('[data-shop-say]')).toHaveAttribute('data-shop-say', 'hello');
  };
  await page.goto(`shop${Q}`);
  await toCounter();
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/shop-hello.png`, animations: 'disabled' });
  // a small balloon, not over the screen
  const box = (await balloon.boundingBox())!;
  expect(box.width).toBeLessThanOrEqual(240);
  expect(box.height).toBeLessThan(120);
  // tapped: gone at once (well before it would go by itself)
  await balloon.locator('p').click();
  await expect(balloon).not.toHaveClass(/\bon\b/, { timeout: 1000 });
  // in again, left alone: gone by itself after a few seconds; the counter again says nothing more this visit
  await page.reload();
  await toCounter();
  await expect(balloon).not.toHaveClass(/\bon\b/, { timeout: 8000 });
  await roomIn(page);
  await expect(balloon).not.toHaveClass(/\bon\b/);
});

test('a floor tap walks my villager round what stands, never onto the stage or behind the counter', async ({ page }) => {
  await seed(page, []);
  await page.goto(`shop${Q}`);
  await roomIn(page);
  expect(await hooks(page, (s) => [s.standable(-20, 30), s.standable(-30, -30), s.standable(60, 25), s.standable(0, 10)])).toEqual([true, false, false, false]);
  await page.evaluate(() => (window as unknown as { __shop: { walkTo(x: number, z: number): void } }).__shop.walkTo(-40, -30));
  await roomIn(page);
  const at = (await hooks(page, (s) => s.mine()))!;
  // as near as the floor goes: off the stage, on the floor in front of it
  expect(at[1]).toBeGreaterThan(3);
  expect(await page.evaluate(([x, z]) => (window as unknown as { __shop: ShopHooks }).__shop.standable(x, z), at)).toBe(true);
});

// The others in the shop (docs/design.md "The shop"): each phone draws whoever else is in here, walking where they walk
// (the rooms' presence, `tent` with `sc: 's'` and the very walk); out of the door, they're gone.
test('two phones in the shop see each other: B’s walk is drawn on A’s phone, and B gone once out of the door', async ({ page, context }) => {
  type Who = { at: [number, number]; walking: boolean } | null;
  const who = (p: Page, w: 'A' | 'B') => p.evaluate((w) => (window as unknown as { __shop: { who(w: string): Who } }).__shop.who(w), w);
  await seed(page, []);
  const other = await context.newPage();
  await page.goto(`shop${Q}`);
  await roomIn(page);
  await other.goto(`shop${Q}&as=B`);
  await roomIn(other);
  // each sees the other in here
  await expect.poll(async () => !!(await who(page, 'B')) && !!(await who(other, 'A')), { timeout: 15_000 }).toBe(true);
  // B walks to the floor before the stage: A's phone draws it walking there, then standing where it stopped
  await other.evaluate(() => (window as unknown as { __shop: { walkTo(x: number, z: number): void } }).__shop.walkTo(-40, 12));
  await expect.poll(async () => (await who(page, 'B'))?.walking, { timeout: 5_000 }).toBe(true);
  await roomIn(other);
  const end = (await hooks(other, (s) => s.mine()))!;
  await expect.poll(async () => {
    const b = await who(page, 'B');
    return !!b && !b.walking && Math.hypot(b.at[0] - end[0], b.at[1] - end[1]) < 3;
  }, { timeout: 10_000 }).toBe(true);
  if (SHOTS) {
    await page.bringToFront();
    await page.screenshot({ path: `${SHOTS}/shop-two-players.png`, animations: 'disabled' });
  }
  // out of B's door: gone from A's shop
  await other.bringToFront();
  await other.locator('.top button').first().click();
  await expect(other.locator('[data-shop]')).toHaveCount(0);
  await expect.poll(() => who(page, 'B'), { timeout: 10_000 }).toBeNull();
  await other.close();
});

test('a link straight into the shop draws the players from their KTX2s: their everyday pack, never the WebP pack', async ({ page }) => {
  const packs: string[] = [];
  page.on('request', (r) => r.url().includes('/room/player/') && packs.push(new URL(r.url()).pathname));
  await page.goto(`shop${Q}`);
  await roomIn(page);
  expect(packs.some((p) => /\/everyday\.\w+\.pak$/.test(p))).toBe(true);
  expect(packs.filter((p) => /\/webp\.\w+\.pak$/.test(p))).toEqual([]);
});
