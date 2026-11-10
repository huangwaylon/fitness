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
/** The farm ops this page sent (not the seeds'). */
const farmRows = (page: Page) => page.evaluate(() => (JSON.parse(localStorage.getItem('island-demo.events') ?? '{"events":[]}').events as { id: string; type: string; data: { ops: { o: string; p: string; n?: number }[] } }[])
  .filter((e) => e.type === 'farm' && !e.id.startsWith('seed-')).flatMap((e) => e.data.ops));

test('starts bought at the shop’s かう; the farm menu at the bottom left: たね picks them, a tap on my empty plot plants one; the 畑 sheet counts them', async ({ page }) => {
  await seed(page, D, [FIELD, ...POCKET.slice(0, 2)]);
  // three tomato starts from かう's 苗 (3 × 14)
  await page.goto(`shop?demo&date=${D}T12:00`);
  await expect(page.locator('[data-shop]')).toHaveAttribute('data-shells', '200');
  await page.waitForFunction(() => !!(window as unknown as { __shop?: object }).__shop);
  await page.evaluate(() => (window as unknown as { __shop: { talk(): void } }).__shop.talk());
  await page.locator('[data-shop-choice="buy"]').click();
  for (let i = 0; i < 3; i++) await page.locator('[data-shop-start="tomato"]').click();
  await expect(page.locator('[data-shop-starts-offer]')).toHaveAttribute('data-shop-starts-offer', '42');
  await page.locator('[data-shop-starts-buy]').click();
  await expect(page.locator('[data-shop]')).toHaveAttribute('data-shells', '158');
  await page.goto(`?demo&date=${D}T12:00`);
  await islandUp(page);
  await quiet(page);
  // the disc at the bottom left, the say button's mirror, clear of it
  const disc = await page.locator('[data-farm-open]').boundingBox(), say = await page.locator('[data-say-open]').boundingBox();
  expect(disc!.x).toBeLessThan(40);
  expect(Math.abs(disc!.y - say!.y)).toBeLessThan(2);
  // a tap on my empty plot with nothing picked: the picker
  await tapWorld(page, plot(0).x, plot(0).z);
  await expect(page.locator('[data-farm-picker]')).toBeVisible();
  await page.locator('[data-farm-pick="start:tomato"]').click();
  await expect(page.locator('[data-farm-picker]')).toHaveCount(0);
  const three = [plot(0), plot(1), plot(0, 1)];
  for (const t of three) await tapWorld(page, t.x, t.z);
  await expect.poll(() => farmRows(page)).toEqual(three.map((t) => ({ o: 'plant', p: t.p, c: 'tomato', src: 'start' })));
  // none left: a fourth plot only says so
  await tapWorld(page, plot(1, 1).x, plot(1, 1).z);
  await expect.poll(() => farmRows(page).then((r) => r.length)).toBe(3);
  // the menu: たね shows none left of tomatoes; はたけ opens the sheet
  await page.locator('[data-farm-open]').click();
  await expect(page.locator('[data-farm-seed-n]')).toHaveText('0');
  await page.locator('[data-farm-field]').click();
  await expect(page.locator('[data-farm-count]')).toHaveText('3/40株');
  await expect(page.locator('[data-farm-group="growing"] li')).toHaveCount(3);
  // the crops by name (the catch catalog loaded), never a raw key; the rows' text in the theme's own colour on its card
  await expect(page.locator('[data-farm-group="growing"] li').first()).toContainText('トマト');
  await expect(page.locator('dialog[open]').last()).not.toContainText('beach.name.');
  const [fg, text] = await page.locator('[data-farm-group="growing"] li').first().evaluate((el) => {
    const probe = el.appendChild(document.createElement('i'));
    probe.style.color = 'var(--text)';
    const want = getComputedStyle(probe).color;
    probe.remove();
    return [getComputedStyle(el).color, want];
  });
  expect(fg).toBe(text);
});

test('three days on: ripe, watered on the two days before it gives three; sold at the shop for 54 かいがら; the partner waters, never harvests', async ({ page, context }) => {
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
  await tapWorld(page, plot(0).x, plot(0).z);
  await expect(page.locator('[data-fx="catch"] .catch-plate')).toHaveAttribute('aria-label', /トマトを しゅうかく！ ×3/);
  await expect.poll(() => farmRows(page)).toEqual([{ o: 'harvest', p: plot(0).p, n: 3 }]);
  // the shop buys them: 3 × 18
  await page.goto(`shop?demo&date=${D3}T12:00`);
  await expect(page.locator('[data-shop]')).toBeVisible();
  const before = Number(await page.locator('[data-shop]').getAttribute('data-shells'));
  await page.waitForFunction(() => !!(window as unknown as { __shop?: object }).__shop);
  await page.evaluate(() => (window as unknown as { __shop: { talk(): void } }).__shop.talk());
  await page.locator('[data-shop-choice="sell"]').click();
  const tomato = page.locator('[data-shop-catch="goods:tomato"]');
  await expect(tomato).toHaveAttribute('data-n', '3');
  for (let i = 0; i < 3; i++) await tomato.click();
  await page.locator('[data-shop-sell]').click();
  await expect.poll(async () => Number(await page.locator('[data-shop]').getAttribute('data-shells'))).toBe(before + 54);

  // うめ's phone: my plants are on her island; she waters the unwatered one, and can't harvest the ripe one
  const b = await context.newPage();
  await b.goto(`?demo&as=B&date=${D3}T12:00`);
  await islandUp(b);
  await quiet(b);
  await tapWorld(b, plot(1).x, plot(1).z);
  // ripe and watered now: a word, no harvest
  await tapWorld(b, plot(1).x, plot(1).z);
  // her 畑 sheet: my two plants folded under my name, the second watered today
  await b.locator('[data-farm-open]').click();
  await b.locator('[data-farm-field]').click();
  await b.locator('[data-farm-sheet] details summary').click();
  await expect(b.locator(`[data-farm-row="${plot(1).p}"]`)).toHaveAttribute('data-wet', 'true');
  expect((await farmRows(b)).filter((o) => o.o === 'harvest')).toHaveLength(1);
});
