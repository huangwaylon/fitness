// もようがえ's shelf (docs/design.md "The tent" Tray; tent/shelf.ts): NH's kinds as tabs, 🔍 across every kind, 並べ替え・
// 絞り込み, ★ お気に入り (the record's `pref tentFavs`), NEW on what just came, a piece placed from a filtered view, the tab
// and the sort kept on the phone, the filters while the page is; with taps, in WebKit and Chromium at 393 × 659. And a
// thousand owned pieces (frame timings: tent-shelf-perf.spec.ts, on demand). Shots: SHOTS=dir.
import { expect, test, type Page } from './fixtures.ts';
import { roomUp } from './rooms.ts';
import base from '../src/lib/components/tent/items.json' with { type: 'json' };
import more from '../src/lib/components/tent/more.json' with { type: 'json' };

const ITEMS = { ...base.items, ...more.items } as Record<string, { cat?: string; cr?: string; starter?: number; sm?: number; rug?: number; wl?: number; cl?: number }>;
const DAY = '2026-11-04';
const SHOTS = process.env.SHOTS;

test.use({ viewport: { width: 393, height: 659 }, hasTouch: true, isMobile: true });

type Seed = [type: string, data: object, who: 'A' | 'B' | 'G', at: number];
/** The demo's events (finds as a balloon writes them), the room empty; `at` ms each. */
const seed = (page: Page, events: Seed[]) =>
  page.addInitScript(([day, list]) => {
    localStorage.removeItem('island-demo.tent');
    if (localStorage.getItem('island-demo.events')) return;
    const rows = list.map(([type, data, person, at], i) => ({ id: `seed-${i}`, type, data, queuedAt: at, tries: 0, nextAt: 0, ackedAt: at, person }));
    localStorage.setItem('island-demo.events', JSON.stringify({ day, events: rows }));
  }, [DAY, events] as const);
const at = (daysAgo: number, i = 0) => Date.parse(`${DAY}T09:00:00+09:00`) - daysAgo * 86_400_000 + i * 1000;
/** A find of a catalogue piece `code` (its ずかん id), `daysAgo`. */
const find = (code: string, daysAgo: number, i = 0): Seed => ['find', { kind: 'item', id: ITEMS[code].cat }, 'A', at(daysAgo, i)];

async function openTray(page: Page) {
  await page.goto(`tent?demo&date=${DAY}T12:00`);
  await roomUp(page, 'tent');
  await page.locator('[data-tent-edit-open]').tap();
  await expect(page.locator('[data-tent-items]')).toBeVisible();
}
const shown = (page: Page) => page.locator('[data-tent-items] [data-tent-item]').evaluateAll((els) => els.map((e) => e.getAttribute('data-tent-item')!));
const shot = async (page: Page, name: string) => {
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/${name}-${test.info().project.name}.png` });
};

// a found log bed (furniture, 1 day ago: NEW), a found rattan lamp-ish small piece (5 days ago), a found wall piece
const finds = Object.keys(ITEMS).filter((c) => ITEMS[c].cat && !ITEMS[c].starter);
const furn = finds.find((c) => !ITEMS[c].sm && !ITEMS[c].rug && !ITEMS[c].wl && !ITEMS[c].cl && !ITEMS[c].cr)!;
const small = finds.find((c) => ITEMS[c].sm && !ITEMS[c].wl && !ITEMS[c].cl && !ITEMS[c].cr && !ITEMS[c].rug)!;
const walled = finds.find((c) => ITEMS[c].wl)!;

test('kinds, search, sort, ★, NEW, a filtered pick placed, the tray remembered', async ({ page }) => {
  await seed(page, [find(small, 5, 0), find(walled, 4, 1), find(furn, 1, 2)]);
  await openTray(page);
  // NH's kinds: 家具 holds the starter furniture and my find (newest first, NEW on it); 小物 the small one
  await expect(page.locator('[data-tab="fresh"]')).toHaveCount(1);
  expect((await shown(page))[0]).toBe(furn);
  await expect(page.locator(`[data-tent-item="${furn}"] [data-new]`)).toBeVisible();
  await page.locator('[data-tab="small"]').tap();
  expect(await shown(page)).toContain(small);
  expect(await shown(page)).not.toContain(furn);
  await shot(page, 'kinds');

  // 🔍 across every kind, forgiving (katakana typed as hiragana): a wallpaper and a floor among the hits get their kind's tag
  await page.locator('[data-tent-search-open]').tap();
  const name = (await page.locator(`[data-tent-item="${small}"]`).getAttribute('aria-label')) ?? '';
  await page.locator('[data-tent-search]').fill(name.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60)));
  await expect.poll(() => shown(page)).toContain(small);
  await page.locator('[data-tent-search]').fill('zzzz');
  await expect(page.locator('[data-tent-empty]')).toContainText('zzzz');
  await page.locator('[data-tent-search]').fill('まるた');
  await expect.poll(async () => (await shown(page)).length).toBeGreaterThan(3);
  await shot(page, 'search');
  // ✕ clears the text, then closes the search: back on the tab I was on
  await page.locator('[data-tent-search-close]').tap();
  await expect(page.locator('[data-tent-search]')).toHaveValue('');
  await page.locator('[data-tent-search-close]').tap();
  await expect(page.locator('[data-tab="small"]')).toHaveAttribute('aria-selected', 'true');

  // 並べ替え: 名前順 in 家具
  await page.locator('[data-tab="furniture"]').tap();
  await page.locator('[data-tent-sort]').tap();
  await page.locator('[data-sort="name"]').tap();
  await shot(page, 'sort-sheet');
  await page.locator('dialog[open] .navbar button.nav.close').tap();
  const byName = await shown(page);
  const names = await page.locator('[data-tent-items] [data-tent-item]').evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')!));
  expect(names).toEqual([...names].sort(new Intl.Collator('ja').compare));
  expect(byName.length).toBeGreaterThan(5);

  // a filter (見つけた) → only my find; picked from the filtered view and placed; ★ while held → お気に入り
  await page.locator('[data-tent-sort]').tap();
  await page.locator('[data-filter="src:find"]').tap();
  await page.locator('dialog[open] .navbar button.nav.close').tap();
  await expect.poll(() => shown(page)).toEqual([furn]);
  await expect(page.locator('[data-tent-fline]')).toBeVisible();
  await expect(page.locator('[data-tent-nfilters]')).toHaveText('1');
  await page.locator(`[data-tent-item="${furn}"]`).tap();
  await expect(page.locator(`[data-tent-item="${furn}"] [data-new]`)).toHaveCount(0);
  await page.locator('[data-act="fav"]').tap();
  await expect(page.locator('[data-act="fav"]')).toHaveAttribute('aria-pressed', 'true');
  await shot(page, 'held');
  await page.locator('[data-act="place"]').tap();
  await expect.poll(() => page.evaluate(() => (window as unknown as { __tent: { pieces(): { item: string }[] } }).__tent.pieces().map((p) => p.item))).toEqual([furn]);

  // the tray closed and opened again: the tab, the sort and the filter as I left them; ★ (now first) holds it
  await page.locator('[data-tent-done]').tap();
  await page.locator('[data-tent-edit-open]').tap();
  await expect(page.locator('[data-tab="furniture"]')).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('[data-tent-nfilters]')).toHaveText('1');
  await expect.poll(() => shown(page)).toEqual([furn]);
  await page.locator('[data-tent-unfilter]').tap();
  await expect.poll(async () => (await shown(page)).length).toBeGreaterThan(5);
  await expect(page.locator('[data-tab]').first()).toHaveAttribute('data-tab', 'fav');
  await page.locator('[data-tab="fav"]').tap();
  await expect.poll(() => shown(page)).toEqual([furn]);
  await expect(page.locator(`[data-tent-item="${furn}"] [data-fav]`)).toBeVisible();

  // a reload: the tab and the sort kept, the filters gone (a new launch starts with none)
  await page.reload();
  await roomUp(page, 'tent');
  await page.locator('[data-tent-edit-open]').tap();
  await expect(page.locator('[data-tab="fav"]')).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('[data-tent-nfilters]')).toHaveCount(0);
  await page.locator('[data-tent-sort]').tap();
  await expect(page.locator('[data-sort="name"]')).toHaveAttribute('aria-checked', 'true');
});


/** ~1,000 owned pieces: every find with a model and every critter's tank, found over the last 20-30 days. */
function manyFinds(): Seed[] {
  const mine = Object.keys(ITEMS).filter((c) => ITEMS[c].cat && !ITEMS[c].starter);
  const tanks = Object.keys(ITEMS).filter((c) => ITEMS[c].cr);
  return [...mine.map((c, i) => find(c, 20 - (i % 20), i)), ...tanks.map((c, i): Seed => {
    const [kind, id] = ITEMS[c].cr!.split(':');
    return ['find', { kind, id }, 'A', at(30, i)];
  })];
}

test('a thousand pieces: the tray opens at once, the tall grid reaches the last one, a search narrows them', async ({ page }) => {
  const events = manyFinds();
  expect(events.length).toBeGreaterThan(950);
  await seed(page, events);
  await page.goto(`tent?demo&date=${DAY}T12:00`);
  await roomUp(page, 'tent');
  const t0 = Date.now();
  await page.locator('[data-tent-edit-open]').tap();
  await expect(page.locator('[data-tent-items] [data-tent-item]').first()).toBeVisible();
  expect(Date.now() - t0).toBeLessThan(3000);
  const n = Number(await page.locator('[data-tent-items]').getAttribute('data-n'));
  expect(n).toBeGreaterThan(400);
  // tall, scrolled to the end: the last icon is there and takes a tap
  await page.locator('[data-tent-tall]').tap();
  await expect(page.locator('[data-tent-tall]')).toHaveAttribute('aria-expanded', 'true');
  await page.locator('[data-tent-items]').evaluate((g) => (g.scrollTop = g.scrollHeight));
  const last = page.locator('[data-tent-items] [data-tent-item]').last();
  await expect(last).toBeInViewport();
  await last.tap();
  await expect(last).toHaveAttribute('aria-pressed', 'true');
  // the pick folded the grid back
  await expect(page.locator('[data-tent-tall]')).toHaveAttribute('aria-expanded', 'false');
  await page.locator('[data-act="cancel"]').tap();
  await page.locator('[data-tent-search-open]').tap();
  await page.locator('[data-tent-search]').fill('テーブル');
  await expect.poll(async () => Number(await page.locator('[data-tent-items]').getAttribute('data-n'))).toBeLessThan(n);
  await shot(page, 'many-search');
});
