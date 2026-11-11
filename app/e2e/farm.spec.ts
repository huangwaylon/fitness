// The fields (docs/farming.md): starts in my pocket, planted on my field from the farm menu at the bottom left (たね
// picks what); three days on the plant is ripe and a tap harvests it, three for one watered on the two days before;
// the vegetables sell at the shop; the partner sees my plants and waters them, never harvests them. On `?demo`: the
// demo's events in localStorage (a field put down in the editor, a catch sold, the starts bought, as their writes have
// them). The plots are tapped by their world points (a field's tile middles: layout/grid.ts tileMid).
import { expect, test, type Page } from './fixtures.ts';
import { islandUp, quiet, tapWorld } from './island.ts';

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
    ['farm', { d: D, ops: [{ o: 'plant', p: plot(0).p, c: 'tomato', src: 'start' }, { o: 'plant', p: plot(1).p, c: 'tomato', src: 'start' }] }, 'A'],
    // うめ watered the first on the 5th and the 6th
    ['island', { date: '2026-11-05', taken: [], puts: [], shakes: [], watered: [plot(0).p], wishes: {} }, 'B'],
    ['island', { date: '2026-11-06', taken: [], puts: [], shakes: [], watered: [plot(0).p], wishes: {} }, 'B']
  ]);
  await page.goto(`?demo&date=${D3}T12:00`);
  await islandUp(page);
  await quiet(page);
  // both ripe: the pill's badge
  await expect(page.locator('[data-farm-ripe]')).toHaveText('2');
  // a row's miss: a tap on the empty plot behind it harvests the nearest ripe plant of mine (the other is on the diagonal)
  await tapWorld(page, plot(0, 1).x, plot(0, 1).z);
  await expect(page.locator('[data-fx="catch"] .catch-plate')).toHaveAttribute('aria-label', /トマトを しゅうかく！ ×3・54かいがら/);
  await expect.poll(() => farmRows(page)).toEqual([{ o: 'harvest', p: plot(0).p, n: 3 }]);
  await expect(page.locator('[data-farm-ripe]')).toHaveText('1');
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

  // うめ's phone (a clear sky: the seeded 11-07 rains): my plants are on her island; she waters the unwatered one, and can't harvest the ripe one
  const b = await context.newPage();
  await catchPops(b);
  await b.goto(`?demo&as=B&date=${D3}T12:00&weather=clear`);
  await islandUp(b);
  await quiet(b);
  await tapWorld(b, plot(1).x, plot(1).z);
  // ripe and watered now: a word, no harvest
  await tapWorld(b, plot(1).x, plot(1).z);
  await expect.poll(() => pops(b)).toEqual(['みずやり', 'みずやり ずみ']);
  // no field of hers, but a plant to water: her pill, with no ripe badge (mine aren't hers), opens 畑: my two plants a
  // line under my name; neither's watering counts today (one ripe, one growing back), so 水やり says from when
  await expect(b.locator('[data-farm-ripe]')).toHaveCount(0);
  await b.locator('[data-farm-open]').click();
  await expect(b.locator('[data-farm-others="A"]')).toContainText('の畑（2株）');
  await expect(b.locator('[data-farm-water]')).toHaveText('水やりは明日から');
  expect((await farmRows(b)).filter((o) => o.o === 'harvest')).toHaveLength(1);
});
