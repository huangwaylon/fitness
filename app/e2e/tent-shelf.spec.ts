// もようがえ's shelf (docs/design.md "The tent" Tray; tent/shelf.ts): NH's kinds as tabs, 🔍 across every kind, 並べ替え・
// 絞り込み, ★ お気に入り (the record's `pref tentFavs`), NEW on what just came, a piece placed from a filtered view, the tab
// and the sort kept on the phone, the filters while the page is; with taps, in WebKit and Chromium at 393 × 659. And a
// thousand owned pieces (frame timings: tent-shelf-perf.spec.ts, on demand). Shots: SHOTS=dir.
import { expect, test, type Page } from './fixtures.ts';
import { openRoom, roomUp, tentStill } from './rooms.ts';
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

test.describe('ours from the start (2026-11-22)', () => {
  test.use({ viewport: { width: 393, height: 852 } });
  /** DECOR_SHOTS=dir: the ジム and キャンプ tabs, the wedding sign and the arches placed, at 393 × 852. */
  const DEC = process.env.DECOR_SHOTS;
  /** The grid's first icons drawn (a packed one's cut from its pack). */
  const iconsIn = (page: Page) =>
    expect.poll(() => page.locator('[data-tent-items] img').evaluateAll((els) => els.slice(0, 12).every((i) => (i as HTMLImageElement).complete && (i as HTMLImageElement).naturalWidth > 0))).toBe(true);
  const pieces = (page: Page) => page.evaluate(() => (window as unknown as { __tent: { pieces(): { item: string }[] } }).__tent.pieces().map((p) => p.item));

  test('every gym and camping piece in their tabs and the filter, the wedding sign a find, searched and placed', async ({ page }) => {
    await seed(page, []);
    await page.goto('tent?demo&date=2026-11-23T12:00');
    await roomUp(page, 'tent');
    await page.locator('[data-tent-edit-open]').tap();
    await expect(page.locator('[data-tent-items]')).toBeVisible();
    // ジム: NH's gym pieces with nothing found or bought (loose ones, packed ones, a rug); キャンプ the camp's
    await page.locator('[data-tab="gym"]').tap();
    await expect.poll(() => shown(page)).toEqual(expect.arrayContaining(['f290', 'f287', 'f4078', 'f7535', 'f12386']));
    expect(await shown(page)).toHaveLength(28);
    await iconsIn(page);
    if (DEC) await page.screenshot({ path: `${DEC}/shot-gym-${test.info().project.name}.png` });
    await page.locator('[data-tab="camp"]').tap();
    await expect.poll(() => shown(page)).toEqual(expect.arrayContaining(['f330', 'f1430', 'f13249', 'f4081', 'f7356']));
    expect(await shown(page)).toHaveLength(32);
    await iconsIn(page);
    if (DEC) await page.screenshot({ path: `${DEC}/shot-camp-${test.info().project.name}.png` });
    // the treadmill in 家具 too (its NH kind)
    await page.locator('[data-tab="furniture"]').tap();
    expect(await shown(page)).toContain('f290');
    // 絞り込み's テーマ: ジム and キャンプ first
    await page.locator('[data-tent-sort]').tap();
    await expect(page.locator('[data-filter^="theme:"]').first()).toHaveAttribute('data-filter', 'theme:gym');
    await page.locator('[data-filter="theme:camp"]').tap();
    await page.locator('dialog[open] .navbar button.nav.close').tap();
    await expect.poll(() => shown(page)).toContain('f330');
    expect(await shown(page)).not.toContain('f290');
    await page.locator('[data-tent-unfilter]').tap();

    // 🔍: a gym piece by its name, the group by ジム, the wedding sign by its name
    await page.locator('[data-tent-search-open]').tap();
    await page.locator('[data-tent-search]').fill('ランニングマシン');
    await expect.poll(() => shown(page)).toEqual(['f290']);
    await page.locator('[data-tent-search]').fill('ジム');
    await expect.poll(() => shown(page)).toEqual(expect.arrayContaining(['f290', 'f4078']));
    await page.locator('[data-tent-search]').fill('ウェディングボード');
    await expect.poll(() => shown(page)).toEqual(['f90001']);
    await page.locator('[data-tent-search-close]').tap();
    await page.locator('[data-tent-search-close]').tap();

    // a find of 11-22: in 新着 with NEW; picked and placed
    await page.locator('[data-tab="fresh"]').tap();
    await expect.poll(() => shown(page)).toEqual(expect.arrayContaining(['f90001', 'f90002', 'f90003']));
    expect(await shown(page)).toHaveLength(3);
    await expect(page.locator('[data-tent-item="f90001"] [data-new]')).toBeVisible();
    await page.locator('[data-tent-item="f90001"]').tap();
    await page.locator('[data-act="place"]').tap();
    await expect.poll(() => pieces(page)).toEqual(['f90001']);
    await page.locator('[data-tent-done]').tap();
    if (DEC) {
      await tentStill(page);
      await page.screenshot({ path: `${DEC}/shot-wedding-${test.info().project.name}.png` });
      await page.evaluate(() => (window as unknown as { __tent: { zoom(f: number): void } }).__tent.zoom(2.5));
      await tentStill(page);
      await page.screenshot({ path: `${DEC}/shot-wedding-close-${test.info().project.name}.png` });
    }
  });

  test('the 2026 and 2027 arches: finds from the start of 11-22, in 新着 with NEW for the other member and the guest', async ({ page }) => {
    await seed(page, []);
    for (const who of ['B', 'G'] as const) {
      await openRoom(page, who, who, '2026-11-22T00:30');
      await page.locator('[data-tent-edit-open]').tap();
      await page.locator('[data-tab="fresh"]').tap();
      await expect.poll(() => shown(page)).toEqual(expect.arrayContaining(['f90002', 'f90003']));
      for (const c of ['f90002', 'f90003']) await expect(page.locator(`[data-tent-item="${c}"] [data-new]`)).toBeVisible();
    }
  });

  test('the 2026 and 2027 arches: new at 00:30 on 11-22, searched by name, both placed', async ({ page }) => {
    await seed(page, []);
    await openRoom(page, 'A', 'A', '2026-11-22T00:30');
    await page.locator('[data-tent-edit-open]').tap();
    await page.locator('[data-tab="fresh"]').tap();
    await expect.poll(() => shown(page)).toEqual(expect.arrayContaining(['f90001', 'f90002', 'f90003']));
    for (const c of ['f90002', 'f90003']) await expect(page.locator(`[data-tent-item="${c}"] [data-new]`)).toBeVisible();
    await iconsIn(page);
    if (DEC) await page.screenshot({ path: `${DEC}/shot-arches-fresh-${test.info().project.name}.png` });
    // 🔍 by their names: each the one
    await page.locator('[data-tent-search-open]').tap();
    await page.locator('[data-tent-search]').fill('2026ねんのアーチ');
    await expect.poll(() => shown(page)).toEqual(['f90002']);
    await page.locator('[data-tent-search]').fill('2027ねんのアーチ');
    await expect.poll(() => shown(page)).toEqual(['f90003']);
    await page.locator('[data-tent-search-close]').tap();
    await page.locator('[data-tent-search-close]').tap();
    // each placed (the tray's spot by my villager: the 2027 one's after a walk towards the door), each shot
    type Hook = { __tent: { zoom(f: number): void; size(): number; walkTo(x: number, z: number): void; walking(w: string): boolean } };
    for (const [c, year] of [['f90002', 2026], ['f90003', 2027]] as const) {
      if (c === 'f90003') {
        await page.evaluate(() => {
          const t = (window as unknown as Hook).__tent, half = t.size() * 5;
          t.walkTo(0, half - 14);
        });
        await expect.poll(() => page.evaluate(() => (window as unknown as Hook).__tent.walking('A'))).toBe(false);
        await page.locator('[data-tent-edit-open]').tap();
      }
      await page.locator(`[data-tent-item="${c}"]`).tap();
      await page.locator('[data-act="place"]').tap();
      await expect.poll(() => pieces(page)).toContain(c);
      await page.locator('[data-tent-done]').tap();
      if (DEC) {
        await expect.poll(() => page.evaluate(() => (window as unknown as { __tent: { loading(): number } }).__tent.loading())).toBe(0);
        await tentStill(page);
        // (closer once: the zoom stays)
        if (c === 'f90002') {
          const f0 = await page.evaluate(() => (window as unknown as { __tent: { stats(): { frames: number } } }).__tent.stats().frames);
          await page.evaluate(() => (window as unknown as Hook).__tent.zoom(2.5));
          await roomUp(page, 'tent', { frames: f0 + 2 });
        }
        await tentStill(page);
        await page.screenshot({ path: `${DEC}/shot-arch-${year}-${test.info().project.name}.png` });
      }
    }
    expect(await pieces(page)).toEqual(['f90002', 'f90003']);
    if (DEC) {
      await tentStill(page);
      await page.screenshot({ path: `${DEC}/shot-arches-${test.info().project.name}.png` });
    }
  });

  test('before its day the wedding sign isn’t found yet; the gym’s pieces are there', async ({ page }) => {
    await seed(page, []);
    await page.goto(`tent?demo&date=${DAY}T12:00`);
    await roomUp(page, 'tent');
    await page.locator('[data-tent-edit-open]').tap();
    await page.locator('[data-tab="furniture"]').tap();
    await expect.poll(async () => (await shown(page)).length).toBeGreaterThan(5);
    for (const c of ['f90001', 'f90002', 'f90003']) expect(await shown(page)).not.toContain(c);
    expect(await shown(page)).toContain('f290');
  });
});
