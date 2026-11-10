// NH's whole catalogue in the rooms (docs/design.md "The tent", docs/world3d-assets.md "Room packs"): any of NH's 209
// rugs and 306 wallpapers from もようがえ, their pictures and models cut from packs fetched whole (never a Range); a
// ceiling piece (a find) on 天井, hung over the floor's pieces on a layer of its own; a critter's tank from the ずかん's
// catch on 生き物; and a piece NH never sells (a gyroid) bought at its made-up price (scripts/shop-prices.ts MADE_UP).
import { expect, test, type Page } from './fixtures.ts';
import { stockOf, buyPrice } from '../src/lib/contract/stock.ts';
import base from '../src/lib/components/tent/items.json' with { type: 'json' };
import more from '../src/lib/components/tent/more.json' with { type: 'json' };

/** The rooms' table as items.ts joins it (it reads Kit's paths: not for a spec). */
const ITEMS = { ...base.items, ...more.items } as Record<string, { rug?: number; gy?: number; pk?: unknown }>;
const RUGS = Object.keys(ITEMS).filter((c) => ITEMS[c].rug);
const WALLS = [...base.walls, ...more.walls];

test.use({ viewport: { width: 393, height: 852 } });

type Piece = { id: string; item: string; x: number; z: number; f: number };
type T = { pieces(): Piece[]; surfaces(): { wall: string | null; floor: string | null }; loading(): number; still(): boolean; edit(): { why: string | null } | null };
const te = <R,>(page: Page, fn: (t: T) => R) => page.evaluate(`(${fn.toString()})(window.__tent)`) as Promise<R>;
type Seed = [type: string, data: object, who: 'A' | 'B' | 'G'];
/** The demo's events (as a find, a catch or a buy writes them), the room empty. */
const seed = (page: Page, day: string, events: Seed[]) =>
  page.addInitScript(([day, list]) => {
    localStorage.removeItem('island-demo.tent');
    if (localStorage.getItem('island-demo.events')) return;
    const at = Date.parse(`${day}T09:00:00+09:00`);
    const rows = list.map(([type, data, person], i) => ({ id: `seed-${i}`, type, data, queuedAt: at + i, tries: 0, nextAt: 0, ackedAt: at + i, person }));
    localStorage.setItem('island-demo.events', JSON.stringify({ day, events: rows }));
  }, [day, events] as const);
/** The room open, its editing tray up and settled. */
async function openTent(page: Page, day = '2026-11-04') {
  await page.goto(`tent?demo&date=${day}T12:00`);
  await page.waitForFunction(() => ((window as unknown as { __tent?: { stats(): { frames: number } } }).__tent?.stats()?.frames ?? 0) > 0);
  await page.locator('[data-tent-edit-open]').click();
  await page.waitForFunction(() => (window as unknown as { __tent: T }).__tent.still());
}
/** The room's pack requests (and whether any asked for a Range). */
function packs(page: Page): string[] {
  const out: string[] = [];
  page.on('request', (r) => {
    if (r.url().includes('/room/pack/')) out.push(`${r.url().split('/').pop()}${r.headers().range ? ' range' : ''}`);
  });
  return out;
}

test('a packed rug and a packed wallpaper from もようがえ: placed and on the walls, their packs fetched whole', async ({ page }) => {
  const asked = packs(page);
  await seed(page, '2026-11-04', []);
  await openTent(page);
  // NH's 209 rugs in ラグ (the starter set's first); the last is packed
  await page.locator('[data-tab="rugs"]').click();
  await expect(page.locator('[data-tent-items] [data-tent-item]')).toHaveCount(209);
  const rug = RUGS.at(-1)!;
  expect(ITEMS[rug].pk).toBeDefined();
  const it = page.locator(`[data-tent-item="${rug}"]`);
  await it.scrollIntoViewIfNeeded();
  await it.click();
  await page.locator('[data-act="place"]').click();
  await expect.poll(() => te(page, (t) => t.pieces().map((p) => p.item))).toEqual([rug]);
  await expect.poll(() => te(page, (t) => t.loading())).toBe(0);
  // its icon too came from a pack (the rugs' tab's)
  expect(asked.some((a) => a.startsWith('m-rug'))).toBe(true);
  expect(asked.some((a) => a.startsWith('i-rug'))).toBe(true);
  // a wallpaper past the tent's first set (NH's aurora wall: packed, with its glow)
  await page.locator('[data-tab="wall"]').click();
  await expect(page.locator('[data-tent-items] [data-tent-item]')).toHaveCount(WALLS.length);
  const wall = page.locator('[data-tent-item="w13609"]');
  await wall.scrollIntoViewIfNeeded();
  await wall.click();
  await expect.poll(() => te(page, (t) => t.surfaces().wall)).toBe('w13609');
  await expect.poll(() => asked.some((a) => /^wall[.-]/.test(a))).toBe(true);
  expect(asked.filter((a) => a.endsWith(' range'))).toEqual([]);
  // each pack once
  expect(new Set(asked).size).toBe(asked.length);
});

test('a ceiling piece (a find) on 天井: hung over a floor piece, never over another ceiling piece', async ({ page }) => {
  await seed(page, '2026-11-04', [['find', { kind: 'item', id: 'moroccan-lights' }, 'A'], ['find', { kind: 'item', id: 'chandelier' }, 'B']]);
  await openTent(page);
  // a floor piece first (the starter set's lantern), where the ceiling pieces will hang over it
  await page.locator('[data-tent-item="f1432"]').click();
  await page.locator('[data-act="place"]').click();
  await expect.poll(() => te(page, (t) => t.pieces().length)).toBe(1);
  const lantern = (await te(page, (t) => t.pieces()))[0];
  await page.locator('[data-tab="ceiling"]').click();
  await expect(page.locator('[data-tent-items] [data-tent-item]')).toHaveCount(2);
  // the Moroccan lights land on the free ceiling tile nearest my villager: the lantern's (the floor's pieces aren't in its way)
  await page.locator('[data-tent-item="f13150"]').click();
  await expect.poll(() => te(page, (t) => t.edit()?.why ?? null)).toBeNull();
  await page.locator('[data-act="place"]').click();
  await expect.poll(() => te(page, (t) => t.pieces().length)).toBe(2);
  const lights = (await te(page, (t) => t.pieces())).find((p) => p.item === 'f13150')!;
  expect([lights.x, lights.z]).toEqual([lantern.x, lantern.z]);
  // the chandelier (2 × 2) can't take a tile the lights hang from: it goes beside them
  await page.locator('[data-tent-item="f13154"]').click();
  await page.locator('[data-act="place"]').click();
  await expect.poll(() => te(page, (t) => t.pieces().length)).toBe(3);
  const ch = (await te(page, (t) => t.pieces())).find((p) => p.item === 'f13154')!;
  const covers = (p: Piece, x: number, z: number) => x >= p.x && x < p.x + 2 && z >= p.z && z < p.z + 2;
  expect(covers(ch, lights.x, lights.z)).toBe(false);
  await expect.poll(() => te(page, (t) => t.loading())).toBe(0);
});

test('a critter’s tank on 生き物: the ずかん’s catch put down indoors', async ({ page }) => {
  await seed(page, '2026-11-04', [['find', { kind: 'fish', id: 'koi' }, 'A'], ['find', { kind: 'bug', id: 'tarantula' }, 'B']]);
  await openTent(page);
  await page.locator('[data-tab="critters"]').click();
  expect(await page.locator('[data-tent-items] [data-tent-item]').evaluateAll((els) => els.map((e) => e.getAttribute('data-tent-item')))).toEqual(['f646', 'f2220']);
  await page.locator('[data-tent-item="f2220"]').click();
  await page.locator('[data-act="place"]').click();
  await expect.poll(() => te(page, (t) => t.pieces().map((p) => p.item))).toEqual(['f2220']);
});

test('a piece NH never sells, bought at its made-up price, is in my もようがえ', async ({ page }) => {
  // the first day from 11-04 whose stock holds a gyroid (NH's are dug up, never sold: 4 × its NH sell ÷ 20)
  let day = '', code = '';
  for (let d = 4; d < 400 && !code; d++) {
    const date = new Date(Date.UTC(2026, 10, d)).toISOString().slice(0, 10);
    code = stockOf(date).find((c) => ITEMS[c].gy) ?? '';
    day = date;
  }
  expect(code).not.toBe('');
  const price = buyPrice(code)!;
  await seed(page, day, [['tally', { date: day, counts: { 'fish:whale-shark': 2 } }, 'A']]);
  await page.goto(`shop?demo&date=${day}T12:00`);
  // the counter's うる list (the shop is a 3D room: shop.spec)
  await page.waitForFunction(() => !!(window as unknown as { __shop?: object }).__shop);
  await page.evaluate(() => (window as unknown as { __shop: { talk(): void } }).__shop.talk());
  await page.locator('[data-shop-choice="sell"]').click();
  await page.locator('[data-shop-all]').click();
  await page.locator('[data-shop-sell]').click();
  await page.locator('[data-shop-tab="buy"]').click();
  const item = page.locator(`[data-shop-item="${code}"]`);
  await expect(item).toHaveAttribute('data-price', String(price));
  await item.click();
  await page.locator('[data-shop-buy]').click();
  await expect(item).toHaveAttribute('data-owned', 'true');
  await expect.poll(async () => Number(await page.locator('[data-shop]').getAttribute('data-shells'))).toBe(1300 - price);
  await openTent(page, day);
  await page.locator('[data-tab="bought"]').click();
  await expect(page.locator(`[data-tent-items] [data-tent-item="${code}"]`)).toBeVisible();
});

test('a piece past the old 100,000-Bell cap (unobtainable until 2026-11-10) is bought at the 10,000 cap', async ({ page }) => {
  // the first day from 11-04 whose stock holds a capped piece (golden furniture, a vehicle, the grand piano…)
  let day = '', code = '';
  for (let d = 4; d < 400 && !code; d++) {
    const date = new Date(Date.UTC(2026, 10, d)).toISOString().slice(0, 10);
    code = stockOf(date).find((c) => buyPrice(c) === 10_000) ?? '';
    day = date;
  }
  expect(code).not.toBe('');
  // 16 whale sharks: 10,400 かいがら
  await seed(page, day, [['tally', { date: day, counts: { 'fish:whale-shark': 16 } }, 'A']]);
  await page.goto(`shop?demo&date=${day}T12:00`);
  await page.waitForFunction(() => !!(window as unknown as { __shop?: object }).__shop);
  await page.evaluate(() => (window as unknown as { __shop: { talk(): void } }).__shop.talk());
  await page.locator('[data-shop-choice="sell"]').click();
  await page.locator('[data-shop-all]').click();
  await page.locator('[data-shop-sell]').click();
  await page.locator('[data-shop-tab="buy"]').click();
  const item = page.locator(`[data-shop-item="${code}"]`);
  await expect(item).toHaveAttribute('data-price', '10000');
  await item.click();
  await page.locator('[data-shop-buy]').click();
  await expect(item).toHaveAttribute('data-owned', 'true');
  await expect.poll(async () => Number(await page.locator('[data-shop]').getAttribute('data-shells'))).toBe(16 * 650 - 10_000);
  await openTent(page, day);
  await page.locator('[data-tab="bought"]').click();
  await expect(page.locator(`[data-tent-items] [data-tent-item="${code}"]`)).toBeVisible();
});
