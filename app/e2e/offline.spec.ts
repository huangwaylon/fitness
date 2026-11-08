// The app offline (docs/backend.md "Service worker" › Offline): once visited online, a trip's hero and the photos seen
// come from the service worker's caches, a trail's track (precached) draws its chart and its map's route, and a photo
// never seen shows the paper placeholder, not WebKit's "?"; the sync pill counts the taps waiting. The logic tier (maps are
// stubs), but the drawn map offline (@render). ききみみ: a game played online plays offline (its parts kept in the shell
// once loaded, never precached), one never played says オフラインです.
import { expect, test, type Page } from './fixtures.ts';
import { fromMenu } from './hud.ts';
import { BASE, islandQuery } from './island.ts';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { drawn, mapReady, mapState, pickTrip, tripsSheet } from './trips.ts';
import { newRecord } from './record.ts';
import { RELAY } from './relay.ts';

test.use({ viewport: { width: 393, height: 852 } });

const loaded = (img: import('@playwright/test').Locator) => expect.poll(() => img.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 1 && !('missing' in i.dataset)), { timeout: 15_000 }).toBe(true);
const dayChip = (p: Page, d: number) => tripsSheet(p).locator(`[data-day-pick="${d}"]`);
const hiking = (p: Page) => p.locator('dialog[open] [data-hiking]');
const URL_ = `${BASE}/${islandQuery('demo&date=2026-11-04T12:00')}`;
const up = (page: Page) => page.waitForFunction(() => !!(window as unknown as { __world?: unknown }).__world, null, { timeout: 30_000 });

test.describe('offline after a visit', () => {
  test.use({ serviceWorkers: 'allow' });

  // (in Chromium: WebKit's Playwright build doesn't route a service worker's fetches, nor takes it offline)
  test("a trip's hero and a photo seen, a trail's track and chart; a photo never seen is the placeholder", { tag: '@chromium' }, async ({ page, context }) => {
    test.setTimeout(120_000);
    await page.addInitScript(() => localStorage.setItem('e2e.render', 'none'));
    await page.goto(URL_);
    await up(page);
    await page.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 60_000 });

    // online: Seattle's day 2, its hike's photo (cached on first view)
    await fromMenu(page, 'travel');
    await pickTrip(page, 'seattle');
    await dayChip(page, 2).click();
    await loaded(tripsSheet(page).locator('[data-day="2"] [data-hike] .band img'));
    await expect.poll(() => page.evaluate(async () => (await (await caches.open('island-photos-v1')).keys()).some((r) => r.url.endsWith('/travel/seattle/lake-22.webp'))), { timeout: 10_000 }).toBe(true);

    await context.setOffline(true);
    const again = await page.reload();
    expect(again?.fromServiceWorker()).toBe(true);
    await up(page);
    await fromMenu(page, 'travel');
    await pickTrip(page, 'seattle');
    // the hero (precached) and the photo seen
    await loaded(tripsSheet(page).locator('[data-trip-view="seattle"] .band.edge img'));
    await dayChip(page, 2).click();
    await loaded(tripsSheet(page).locator('[data-day="2"] [data-hike] .band img'));
    await page.keyboard.press('Escape');
    await expect(page.locator('dialog[open]')).toHaveCount(0);

    // トレイル: the list's photos never seen (the placeholder), a trail never opened: its track (precached), its chart
    await fromMenu(page, 'hiking');
    const card = hiking(page).locator('[data-trail="enchantments"]');
    await card.scrollIntoViewIfNeeded();
    await expect(card.locator('.band img')).toHaveAttribute('data-missing', '');
    await card.click();
    const view = hiking(page).locator('[data-trail-view="enchantments"]');
    await expect(view.locator('[data-map-stub] polyline')).toHaveCount(1);
    await expect(view.locator('[data-elev]')).toBeVisible();
    await expect(view.locator('[data-elev] svg path').first()).toBeVisible();
    await context.setOffline(false);
  });

  test('drawn: a map drawn online draws offline, MapLibre and the tiles it showed from the caches', { tag: ['@chromium', '@render'] }, async ({ page, context }) => {
    test.setTimeout(120_000);
    // OpenFreeMap from the fixtures (trips.ts fixtureTiles), on the context: the worker's fetches are routed there
    const FIX = join(import.meta.dirname, 'fixtures', 'travel');
    let offline = false;
    const missed: string[] = [];
    const cors = { 'access-control-allow-origin': '*' };
    await context.route('https://tiles.openfreemap.org/**', (route) => {
      if (offline) return (missed.push(route.request().url()), route.abort('internetdisconnected'));
      const u = new URL(route.request().url());
      if (u.pathname === '/planet') return route.fulfill({ contentType: 'application/json', body: readFileSync(join(FIX, 'tilejson.json')), headers: cors });
      const m = /^\/planet\/fixture\/(\d+)\/(\d+)\/(\d+)\.pbf$/.exec(u.pathname);
      const f = m && join(FIX, 'tiles', m[1], m[2], `${m[3]}.pbf`);
      // (no fixture: an empty tile, a 200 as OpenFreeMap's sea)
      return route.fulfill({ contentType: 'application/x-protobuf', body: f && existsSync(f) ? readFileSync(f) : Buffer.alloc(0), headers: cors });
    });
    await drawn(page);
    await page.goto(URL_);
    await up(page);
    await page.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 60_000 });
    await fromMenu(page, 'travel');
    await pickTrip(page, 'nz', 'map');
    await mapReady(page);
    const kept = () => page.evaluate(async () => {
      const shell = (await caches.keys()).filter((k) => k.startsWith('island-shell-')).at(-1)!;
      const has = async (c: string, re: RegExp) => (await (await caches.open(c)).keys()).filter((r) => re.test(r.url)).length;
      return { chunk: await has(shell, /\/chunks\/maplibre\./), worker: await has(shell, /maplibre-gl-worker-/), tiles: await has('island-tiles-v1', /\/planet\/_\//), meta: await has('island-map-meta-v1', /\/planet$/) };
    });
    await expect.poll(async () => { const k = await kept(); return k.chunk > 0 && k.worker > 0 && k.tiles > 0 && k.meta > 0; }, { timeout: 20_000 }).toBe(true);

    offline = true;
    await context.setOffline(true);
    await page.reload();
    await up(page);
    await fromMenu(page, 'travel');
    await pickTrip(page, 'nz', 'map');
    await mapReady(page);
    await expect(page.locator('dialog[open] .maplibregl-marker.tm-pin').first()).toBeVisible();
    await expect.poll(async () => (await mapState(page)).moving, { timeout: 10_000 }).toBe(false);
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    // every tile it drew came from the cache: none went out, no offline note
    expect(missed).toEqual([]);
    await expect(page.locator('dialog[open] [data-map-note="offline"]')).toHaveCount(0);
    expect((await mapState(page)).mode).toBe('ready');
    await context.setOffline(false);
  });

  // ききみみ's parts (levels/parts/*.json's chunks) aren't precached: kept in the shell once a game loads them
  test("ききみみ: a game played online plays offline; one never played says it's offline", { tag: '@chromium' }, async ({ page, context }) => {
    test.setTimeout(120_000);
    const kiki = (p: Page) => p.locator('dialog[open] [data-kikimimi]');
    const toMode = async (m: string) => {
      await fromMenu(page, 'kikimimi');
      await expect(kiki(page)).toHaveAttribute('data-kiki-at', 'hub');
      await kiki(page).locator('[data-kiki-tile="asobu"]').click();
      await kiki(page).locator(`[data-kiki-mode-tile="${m}"]`).click();
      await expect(kiki(page).locator(`[data-kiki-mode-page="${m}"]`)).toBeVisible();
    };
    const gm = () => page.evaluate(() => (window as unknown as { __kiki?: { view(): { gm: string | null } } }).__kiki?.view().gm ?? null);
    const KIKI = `${BASE}/?demo&date=2026-11-07T10:00&critter=none&visitor=none&kikimimi=fast`;
    await page.addInitScript(() => localStorage.setItem('e2e.render', 'none'));
    await page.goto(KIKI);
    await up(page);
    await page.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 60_000 });
    const held = () => page.evaluate(async () => {
      const shell = (await caches.keys()).filter((k) => k.startsWith('island-shell-')).at(-1)!;
      return (await (await caches.open(shell)).keys()).flatMap((r) => /\/chunks\/(kiki-[\w-]+)\./.exec(r.url)?.[1] ?? []);
    });
    // none at install
    expect(await held()).toEqual([]);

    // online: ことば タイル started (its parts loaded, so kept)
    await toMode('tile');
    await kiki(page).locator('[data-kiki-start]').click();
    await expect.poll(gm).toBe('tile');
    await expect(kiki(page).locator('[data-kiki-tile-wait], [data-kiki-tile-pool]').first()).toBeVisible({ timeout: 15_000 });
    // (its first place's tile files: かわ's since their A1 flip)
    await expect.poll(async () => (await held()).some((c) => /^kiki-s\d-tile/.test(c)), { timeout: 10_000 }).toBe(true);
    expect(await held()).not.toContain('kiki-ladder');

    await context.setOffline(true);
    await page.reload();
    await up(page);
    // the tiles again, offline
    await toMode('tile');
    await expect(page.getByText('オフラインです')).toHaveCount(0);
    await kiki(page).locator('[data-kiki-start]').click();
    await expect.poll(gm).toBe('tile');
    await expect(kiki(page).locator('[data-kiki-tile-wait], [data-kiki-tile-pool]').first()).toBeVisible({ timeout: 15_000 });
    // スピード はしご, never played: its part never asked for, and the note says why
    await page.reload();
    await up(page);
    await toMode('ladder');
    await expect(page.getByText('オフラインです')).toBeVisible();
    await context.setOffline(false);
  });
});

// Saved ahead (offline phase B, lib/offline): a trail's area saved on fixture tiles (a blank PNG for every USGS tile,
// never the network), in its own cache; offline, the map draws from it alone; せってい lists it and 削除 frees it.
test.describe('a map area saved ahead', () => {
  test.use({ serviceWorkers: 'allow' });
  const TILE = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64');
  const AREA = 'island-offline-trail-talapus-lake';
  const trail = (p: Page) => hiking(p).locator('[data-trail-view="talapus-lake"]');
  /** USGS from the fixture; offline, every tile asked is noted and refused. */
  async function usgs(context: import('@playwright/test').BrowserContext) {
    const s = { offline: false, missed: [] as string[], asked: 0, headers: [] as string[] };
    await context.route(/^https:\/\/basemap\.nationalmap\.gov\//, (route) => {
      if (s.offline) return (s.missed.push(route.request().url()), route.abort('internetdisconnected'));
      s.asked++;
      s.headers.push(...Object.keys(route.request().headers()).filter((h) => h.startsWith('x-')));
      return route.fulfill({ contentType: 'image/png', body: TILE, headers: { 'access-control-allow-origin': '*' } });
    });
    return s;
  }
  const count = (page: Page, name: string) => page.evaluate(async (n) => ((await caches.has(n)) ? (await (await caches.open(n)).keys()).length : -1), name);
  async function saveTalapus(page: Page) {
    await page.goto(URL_);
    await up(page);
    await page.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 60_000 });
    await fromMenu(page, 'hiking');
    await hiking(page).locator('[data-trail="talapus-lake"]').click();
    const save = trail(page).locator('[data-offline-save]');
    await expect(save).toHaveAttribute('data-offline-save', 'none', { timeout: 15_000 });
    await expect(save).toContainText(/オフライン用に保存（\d+\.\d MB）/);
    await save.click();
    await expect(save).toHaveAttribute('data-offline-save', 'saved', { timeout: 60_000 });
    await expect(save).toContainText(/保存済み · \d+\.\d MB/);
  }

  test('saved in its own cache, never the seen tiles; its trash pill frees it', { tag: '@chromium' }, async ({ page, context }) => {
    test.setTimeout(120_000);
    await page.addInitScript(() => localStorage.setItem('e2e.render', 'none'));
    const net = await usgs(context);
    await saveTalapus(page);
    // the plan's 91 tiles and the manifest; none of them among the seen tiles; no header of ours on the wire
    expect(await count(page, AREA)).toBe(92);
    expect(await count(page, 'island-tiles-v1')).toBeLessThanOrEqual(0);
    expect(net.headers).toEqual([]);
    const manifest = await page.evaluate(async (n) => (await (await caches.open(n)).match('https://island-fund.invalid/__manifest'))!.json(), AREA);
    expect(manifest).toMatchObject({ id: 'trail-talapus-lake', source: 'usgs', tileVersion: null, tiles: 91, stored: 91, done: true });
    // 削除 beside it: gone, the pill back to its save
    const del = trail(page).locator('[data-offline-delete="trail-talapus-lake"]');
    await expect(del).toHaveAttribute('aria-label', /タラパス.*を削除/);
    await del.click();
    await expect(del).toHaveCount(0);
    await expect(trail(page).locator('[data-offline-save]')).toHaveAttribute('data-offline-save', 'none');
    expect(await count(page, AREA)).toBe(-1);
    expect(await page.evaluate(() => localStorage.getItem('island.offlineAreas'))).toBe('{}');
  });

  test('drawn: offline, the saved area draws from its cache alone, with 「保存した範囲のみ」', { tag: ['@chromium', '@render'] }, async ({ page, context }) => {
    test.setTimeout(150_000);
    const net = await usgs(context);
    await drawn(page);
    await saveTalapus(page);
    // the tiles the map drew online forgotten: what draws offline is the area's
    await page.evaluate(() => caches.delete('island-tiles-v1'));
    net.offline = true;
    await context.setOffline(true);
    await page.reload();
    await up(page);
    await fromMenu(page, 'hiking');
    await hiking(page).locator('[data-trail="talapus-lake"]').click();
    await expect(trail(page).locator('[data-trail-map]')).toHaveAttribute('data-mode', 'ready', { timeout: 30_000 });
    await expect(trail(page).locator('[data-map-note="saved"]')).toHaveText('保存した範囲のみ');
    await expect(trail(page).locator('.maplibregl-ctrl-attrib')).toContainText('USGS');
    await page.evaluate(() => new Promise((r) => setTimeout(r, 1500))); // hold: no tile goes out while the map settles
    // the saved tiles from the area's cache; past it (the screen is wider than the 1 km band) none asked of the network
    expect(net.missed).toEqual([]);
    await expect(trail(page).locator('[data-trail-map]')).toHaveAttribute('data-mode', /ready|offline/);
    await expect(trail(page).locator('[data-map-note="saved"]')).toBeVisible();
    await context.setOffline(false);
  });
});

test('a photo that fails to load is the paper placeholder with its box kept, and the photo once it comes', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('e2e.render', 'none'));
  let fail = true;
  await page.route('**/travel/seattle/lake-22.webp', (r) => (fail ? r.abort() : r.fallback()));
  await page.goto(URL_);
  await up(page);
  await fromMenu(page, 'travel');
  await pickTrip(page, 'seattle');
  await dayChip(page, 2).click();
  const img = tripsSheet(page).locator('[data-day="2"] [data-hike] .band img');
  await img.scrollIntoViewIfNeeded();
  await expect(img).toHaveAttribute('data-missing', '');
  expect(await img.evaluate((i: HTMLImageElement) => [i.src.startsWith('data:image/svg+xml'), i.naturalWidth > 0, Math.round(i.getBoundingClientRect().height)])).toEqual([true, true, 150]);
  fail = false;
  await img.evaluate((i: HTMLImageElement) => (i.src = new URL('travel/seattle/lake-22.webp', document.baseURI).href));
  await loaded(img);
});

test('offline, the sync pill counts the taps waiting to go', async ({ page, context }) => {
  const rec = newRecord();
  await rec.pair(context, 'A');
  await page.goto(islandQuery('x=1'));
  await up(page);
  // the record's copy kept on the phone (the first sync)
  const kept = () => page.evaluate(() => new Promise<boolean>((ok) => {
    const q = indexedDB.open('island');
    q.onerror = () => ok(false);
    q.onsuccess = () => {
      const db = q.result;
      if (!db.objectStoreNames.contains('cache')) return (db.close(), ok(false));
      const g = db.transaction('cache').objectStore('cache').get('meta');
      g.onsuccess = () => (db.close(), ok(!!g.result));
      g.onerror = () => (db.close(), ok(false));
    };
  }));
  await expect.poll(kept, { timeout: 15_000 }).toBe(true);
  // the relay gone; two taps waiting
  await context.route(`${RELAY}/**`, (r) => r.abort('internetdisconnected'));
  await page.evaluate(() => {
    const ev = (id: string) => ({ id, type: 'pref', data: { key: 'locale', value: 'ja' }, queuedAt: Date.now(), tries: 0, nextAt: Date.now() });
    localStorage.setItem('island.queue', JSON.stringify([ev('e2e-q-1'), ev('e2e-q-2')]));
  });
  await page.reload();
  await up(page);
  const pill = page.locator('button[data-sfx="sync"]');
  await expect(pill).toHaveAttribute('data-sync-waiting', '2');
  await expect(pill).toContainText('オフライン');
  await expect(pill).toContainText('2けん まち');
  await expect(pill).toHaveAttribute('aria-label', /2けん まだ おくっていない/);
});
