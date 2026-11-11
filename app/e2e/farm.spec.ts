// The fields (docs/farming.md): starts in my pocket, planted on my field from the farm menu at the bottom left (たね
// picks what); three days on the plant is ripe and a tap harvests it, three for one watered on the two days before;
// the vegetables sell at the shop; the partner sees my plants and waters them, never harvests them. On `?demo`: the
// demo's events in localStorage (a field put down in the editor, a catch sold, the starts bought, as their writes have
// them). The plots are tapped by their world points (a field's tile middles: layout/grid.ts tileMid).
import { expect, test, type Page } from './fixtures.ts';
import { islandUp, quiet, tapAt, tapWorld } from './island.ts';

test.use({ viewport: { width: 393, height: 852 } });
type Seed = [type: string, data: object, who: 'A' | 'B' | 'G'];
/** The demo's events of a day (as the writes keep them). */
const seed = (page: Page, day: string, events: Seed[]) =>
  page.addInitScript(([day, list]) => {
    if (localStorage.getItem('island-demo.events')) return;
    const at = Date.parse(`${day}T09:00:00+09:00`);
    const rows = list.map(([type, data, person], i) => ({ id: `seed-${i}`, type, data, queuedAt: at + i, tries: 0, nextAt: 0, ackedAt: at + i, person }));
    localStorage.setItem('island-demo.events', JSON.stringify({ day, events: rows }));
  }, [day, events] as const);
/** ウェイ's field: 2 × 2 on まえ's lawn east of the path (tiles 10–11 × 17–18: nothing in front of it on screen, うめ at
 *  her spot, a goal tree's canopy, a flower's tap area). */
const FIELD: Seed = ['decor', { sc: 'o', id: 'field-A', at: 1.79e12, k: 'field', x: 10, z: 17, f: 0, s: 'a-2x2' }, 'A'];
/** A plot's id and its world point (its tile's middle: the grid's x0 and z0 −90, 30 a tile). */
const plot = (i: number, j = 0) => ({ p: `fd:field-A.${i}.${j}`, x: -90 + (10 + i) * 30 + 15, z: -90 + (17 + j) * 30 + 15 });
const D = '2026-11-04';
/** 200 かいがら (a koi sold) and three tomato starts (3 × 14). */
const POCKET: Seed[] = [['tally', { date: D, counts: { 'fish:koi': 1 } }, 'A'], ['sell', { species: 'fish:koi', n: 1, v: 200 }, 'A'], ['buy_starts', { crop: 'tomato', n: 3, v: 42 }, 'A']];
/** The plot words this page pops (FarmPop's tag lives 1.2 s: each caught as it comes). */
const catchPops = (page: Page) =>
  page.addInitScript(() => {
    const seen: string[] = ((window as unknown as { __pops: string[] }).__pops = []);
    new MutationObserver((list) => {
      for (const r of list) for (const n of r.addedNodes) if (n instanceof HTMLElement && n.matches('[data-farm-pop]')) seen.push(n.textContent ?? '');
    }).observe(document, { childList: true, subtree: true });
  });
const pops = (page: Page) => page.evaluate(() => (window as unknown as { __pops: string[] }).__pops);
/** The farm ops this page sent (not the seeds'). */
const farmRows = (page: Page) => page.evaluate(() => (JSON.parse(localStorage.getItem('island-demo.events') ?? '{"events":[]}').events as { id: string; type: string; data: { ops: { o: string; p: string; n?: number }[] } }[])
  .filter((e) => e.type === 'farm' && !e.id.startsWith('seed-')).flatMap((e) => e.data.ops));

test('starts bought at the shop’s かう; a tap on my empty plot with nothing held: the picker, whose pick plants it; the はたけ pill opens 畑', async ({ page, context }) => {
  await seed(page, D, [FIELD, ...POCKET.slice(0, 2)]);
  // three tomato starts from かう's 苗 (3 × 14), by the list's own name, kanji
  await page.goto(`shop?demo&date=${D}T12:00`);
  await expect(page.locator('[data-shop]')).toHaveAttribute('data-shells', '200');
  await page.waitForFunction(() => !!(window as unknown as { __shop?: object }).__shop);
  await page.evaluate(() => (window as unknown as { __shop: { talk(): void } }).__shop.talk());
  await page.locator('[data-shop-tab="buy"]').click();
  await expect(page.locator('[data-shop-start="tomato"] .nm')).toHaveText('トマトの苗');
  for (let i = 0; i < 3; i++) await page.locator('[data-shop-more="tomato"]').click();
  // one bar: the pinned one names the crop and buys them
  await expect(page.locator('[data-shop-starts-offer]')).toHaveAttribute('data-shop-starts-offer', '42');
  await expect(page.locator('[data-shop-starts-offer]')).toHaveText('トマトの苗 ×3');
  await page.locator('[data-shop-buy]').click();
  await expect(page.locator('[data-shop]')).toHaveAttribute('data-shells', '158');
  await expect(page.locator('.banner[role="status"] .txt')).toHaveText('トマトの苗×3を買いました');
  // うめ has no plot and no plant stands on a field: no はたけ pill on her island
  const b = await context.newPage();
  await b.goto(`?demo&as=B&date=${D}T12:00`);
  await islandUp(b);
  await expect(b.locator('[data-say-open]')).toBeVisible();
  await expect(b.locator('[data-farm-open]')).toHaveCount(0);
  await b.close();
  await catchPops(page);
  await page.goto(`?demo&date=${D}T12:00`);
  await islandUp(page);
  await quiet(page);
  // the はたけ pill at the bottom left, the say button's mirror, clear of it
  await expect(page.locator('[data-farm-open]')).toBeVisible();
  const disc = await page.locator('[data-farm-open]').boundingBox(), say = await page.locator('[data-say-open]').boundingBox();
  expect(disc!.x).toBeLessThan(40);
  expect(Math.abs(disc!.y - say!.y)).toBeLessThan(2);
  // a tap on my empty plot with nothing held: the picker; each start by its crop's name and art, the seedling on it
  await tapWorld(page, plot(0).x, plot(0).z);
  await expect(page.locator('[data-farm-picker]')).toBeVisible();
  const cell = page.locator('[data-farm-pick="start:tomato"]');
  await expect(cell).toContainText('トマト');
  await expect(cell.locator('[data-farm-start]')).toHaveCount(1);
  // the pick plants that plot at once, then a tap a plot
  await cell.click();
  await expect(page.locator('[data-farm-picker]')).toHaveCount(0);
  await expect.poll(() => farmRows(page)).toEqual([{ o: 'plant', p: plot(0).p, c: 'tomato', src: 'start' }]);
  await expect(page.locator('[data-farm-held="tomato"]')).toBeVisible();
  const three = [plot(0), plot(1), plot(0, 1)];
  for (const t of three.slice(1)) await tapWorld(page, t.x, t.z);
  await expect.poll(() => farmRows(page)).toEqual(three.map((t) => ({ o: 'plant', p: t.p, c: 'tomato', src: 'start' })));
  // none left: a fourth plot says so and opens the picker, with nothing in it to plant; each word over its plot
  await tapWorld(page, plot(1, 1).x, plot(1, 1).z);
  await expect(page.locator('[data-farm-noseed]')).toHaveText('なえが ない！ おみせで かえるよ');
  await expect.poll(() => pops(page)).toEqual([...three.map(() => 'トマトを うえた'), 'トマトが もう ない']);
  await expect(page.locator('[data-fx="say"]')).toHaveCount(0);
  expect(await farmRows(page)).toHaveLength(3);
  // the はたけ pill: the held crop worn only while I have some (none now), no ripe badge; one tap opens 畑, counting them
  await expect(page.locator('[data-farm-held]')).toHaveCount(0);
  await expect(page.locator('[data-farm-ripe]')).toHaveCount(0);
  await page.locator('[data-farm-open]').click();
  await expect(page.locator('[data-farm-count]')).toHaveText('3/40株');
  // nothing ripe yet: when the next is, not 「0株・0個」
  await expect(page.locator('[data-farm-today]')).toHaveText('次の収穫まであと3日');
  // never a raw key; the sheet's text in the theme's own colour on its card
  await expect(page.locator('dialog[open]').last()).not.toContainText('beach.name.');
  const [fg, text] = await page.locator('[data-farm-today]').evaluate((el) => {
    const probe = el.appendChild(document.createElement('i'));
    probe.style.color = 'var(--text)';
    const want = getComputedStyle(probe).color;
    probe.remove();
    return [getComputedStyle(el).color, want];
  });
  expect(fg).toBe(text);
});

test('three days on: ripe, watered on the two days before it gives three, harvested by a tap a row off; sold at the shop for 54 かいがら; the partner waters, never harvests', async ({ page, context }) => {
  const D3 = '2026-11-07';
  await seed(page, D3, [
    FIELD, ...POCKET,
    ['farm', { d: D, ops: [{ o: 'plant', p: plot(0).p, c: 'tomato', src: 'start' }] }, 'A'],
    // the second a day later: ripe tomorrow
    ['farm', { d: '2026-11-05', ops: [{ o: 'plant', p: plot(1).p, c: 'tomato', src: 'start' }] }, 'A'],
    // うめ watered the first on the 5th and the 6th
    ['island', { date: '2026-11-05', taken: [], puts: [], shakes: [], watered: [plot(0).p], wishes: {} }, 'B'],
    ['island', { date: '2026-11-06', taken: [], puts: [], shakes: [], watered: [plot(0).p], wishes: {} }, 'B']
  ]);
  await page.goto(`?demo&date=${D3}T12:00`);
  await islandUp(page);
  await quiet(page);
  // one ripe: the pill's badge
  await expect(page.locator('[data-farm-ripe]')).toHaveText('1');
  // a row's miss: a tap on my empty plot behind it harvests my ripe plant there (the growing one on the diagonal stays)
  await tapWorld(page, plot(0, 1).x, plot(0, 1).z);
  await expect(page.locator('[data-fx="catch"] .catch-plate')).toHaveAttribute('aria-label', /トマトを しゅうかく！ ×3・54かいがら/);
  await expect.poll(() => farmRows(page)).toEqual([{ o: 'harvest', p: plot(0).p, n: 3 }]);
  await expect(page.locator('[data-farm-ripe]')).toHaveCount(0);
  // the shop buys them: 3 × 18
  await page.goto(`shop?demo&date=${D3}T12:00`);
  await expect(page.locator('[data-shop]')).toBeVisible();
  const before = Number(await page.locator('[data-shop]').getAttribute('data-shells'));
  await page.waitForFunction(() => !!(window as unknown as { __shop?: object }).__shop);
  await page.evaluate(() => (window as unknown as { __shop: { talk(): void } }).__shop.talk());
  await page.locator('[data-shop-tab="sell"]').click();
  const tomato = page.locator('[data-shop-catch="goods:tomato"]');
  await expect(tomato).toHaveAttribute('data-n', '3');
  for (let i = 0; i < 3; i++) await tomato.click();
  await page.locator('[data-shop-sell]').click();
  await expect.poll(async () => Number(await page.locator('[data-shop]').getAttribute('data-shells'))).toBe(before + 54);

  // うめ's phone (a clear sky: the seeded 11-07 rains): my plants are on her island; she waters the growing one, and
  // can't harvest mine
  const b = await context.newPage();
  await catchPops(b);
  await b.goto(`?demo&as=B&date=${D3}T12:00&weather=clear`);
  await islandUp(b);
  await quiet(b);
  await tapWorld(b, plot(1).x, plot(1).z);
  // watered now: a word, no harvest
  await tapWorld(b, plot(1).x, plot(1).z);
  await expect.poll(() => pops(b)).toEqual(['みずやり', expect.stringMatching(/の トマト・あと 1にち$/)]);
  // no field of hers, but a plant to water: her pill, with no ripe badge (mine aren't hers), opens 畑: my two plants a
  // line under my name; her tap watered both (the one growing back counts from its harvest day), so 水やり is done
  await expect(b.locator('[data-farm-ripe]')).toHaveCount(0);
  await b.locator('[data-farm-open]').click();
  await expect(b.locator('[data-farm-others="A"]')).toContainText('の畑（2株）');
  await expect(b.locator('[data-farm-water]')).toHaveText('水やり済み');
  expect((await farmRows(b)).filter((o) => o.o === 'harvest')).toHaveLength(1);
});

test('a plot under a goal tree’s canopy is the plot’s; the canopy off the field still opens its tree', async ({ page }) => {
  // ウェイ's 6 × 3 field beside うめ's goal tree (14, 10): its east plots lie under the tree's canopy on screen
  const beside: Seed = ['decor', { sc: 'o', id: 'field-A', at: 1.79e12, k: 'field', x: 10, z: 11, f: 0, s: 'a-6x3' }, 'A'];
  await seed(page, D, [beside, ...POCKET]);
  await catchPops(page);
  await page.goto(`?demo&date=${D}T12:00`);
  await islandUp(page);
  await quiet(page);
  const at = (i: number, j: number) => ({ p: `fd:field-A.${i}.${j}`, x: -90 + (10 + i) * 30 + 15, z: -90 + (11 + j) * 30 + 15 });
  const all = [0, 1, 2].flatMap((j) => [0, 1, 2, 3, 4, 5].map((i) => at(i, j)));
  const under = await page.evaluate((all) => all.filter(({ x, z }) => {
    const [cx, cy] = (window as unknown as { __world3d: { client(x: number, z: number, lift: number): [number, number] } }).__world3d.client(x, z, 0);
    return !!document.elementFromPoint(cx, cy)?.closest('.canopy');
  }), all);
  expect(under.length).toBeGreaterThan(0);
  const t = await tapWorld(page, under[0].x, under[0].z, { clear: null });
  expect(t.on).toBe('button.canopy');
  // (nothing held: the picker, whose pick plants it), the tree's popup shut
  await expect(page.locator('[data-farm-picker]')).toBeVisible();
  await expect(page.locator('.canopy[aria-expanded="true"]')).toHaveCount(0);
  await page.locator('[data-farm-pick="start:tomato"]').click();
  await expect.poll(() => farmRows(page)).toEqual([{ o: 'plant', p: under[0].p, c: 'tomato', src: 'start' }]);
  await expect.poll(() => pops(page)).toEqual(['トマトを うえた']);
  // the canopy's top, no field under it: the tree's popup
  const top = await tapAt(page, (w) => {
    const r = [...w.document.querySelectorAll('.canopy')].map((c: Element) => c.getBoundingClientRect()).find((r: DOMRect) => r.width > 0 && r.top > 0);
    return r ? [r.left + r.width / 2, r.top + 6] : null;
  }, null, { clear: null, message: 'a canopy’s top' });
  expect(top.on).toBe('button.canopy');
  await expect(page.locator('.canopy[aria-expanded="true"]')).toHaveCount(1);
});

test('a first tap on a growing plant names its crop, never a raw key (the names load first)', async ({ page }) => {
  const D1 = '2026-11-05';
  await seed(page, D1, [
    FIELD, ...POCKET.slice(0, 2), ['buy_starts', { crop: 'pumpkin', n: 1, v: 14 }, 'A'],
    ['farm', { d: D, ops: [{ o: 'plant', p: plot(0).p, c: 'pumpkin', src: 'start' }] }, 'A'],
    // watered today already: the tap's a word, not the can
    ['island', { date: D1, taken: [], puts: [], shakes: [], watered: [plot(0).p], wishes: {} }, 'A']
  ]);
  await catchPops(page);
  await page.goto(`?demo&date=${D1}T12:00&weather=clear`);
  await islandUp(page);
  await quiet(page);
  await tapWorld(page, plot(0).x, plot(0).z);
  await expect.poll(() => pops(page)).toEqual([expect.stringMatching(/^カボチャ・あと \d+にち$/)]);
  expect((await pops(page)).join()).not.toMatch(/beach\.name\./);
});
