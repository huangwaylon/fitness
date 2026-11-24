// 旅行 › 設定's オフライン地図 (docs/travel.md "Offline"): a row per trip with a map (Seattle has none), each its area's
// save from there: its size, saving (the bar, 止める: what's in kept, 一部のみ), saved with its date and size, kept on
// reopening; a save that can't start says why (offline, another saving); the trash asks first (キャンセル keeps it),
// a gone area's only forgets it. The trip's 地図 has no save pill and its title back; offline, a saved trip's map says
// 「保存した範囲のみ」. OpenFreeMap from the fixtures (mapTiles.ts), its tiles held while a test looks at the progress.
// The drawn test (@render, Chromium: Playwright's WebKit doesn't route a worker's fetches): offline, the tiles seen
// forgotten, the map draws from the saved area alone.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type Page, type Route } from './fixtures.ts';
import { fromMenu } from './hud.ts';
import { islandUp } from './island.ts';
import { drawn, gotoTrips, mapReady, pickTrip, tripsSheet } from './trips.ts';

test.use({ viewport: { width: 393, height: 852 } });
const howOf = (project: string) => (project.startsWith('webkit') ? 'tap' : 'click') as 'tap' | 'click';
const row = (p: Page, id: string) => tripsSheet(p).locator(`[data-offline-row="trip-${id}"]`);
const act = (p: Page, id: string, a: string) => row(p, id).locator(`[data-offline-act="${a}"]`);
const AREA = 'island-offline-trip-okinawa';
const FIX = join(import.meta.dirname, 'fixtures', 'travel');
const CORS = { 'access-control-allow-origin': '*' };
const hasArea = (page: Page) => page.evaluate((n) => caches.has(n), AREA);

/** OpenFreeMap's tiles held until `go()` (the TileJSON answered: the save starts, 0 of its tiles in). */
async function holdTiles(page: Page) {
  const held: Route[] = [];
  let open = false;
  await page.route('https://tiles.openfreemap.org/planet/**/*.pbf', (r) => (open ? r.fallback() : void held.push(r)));
  return { go: () => ((open = true), Promise.all(held.splice(0).map((r) => r.fallback()))) };
}
async function settings(page: Page, how: 'tap' | 'click') {
  await gotoTrips(page);
  await tripsSheet(page).locator('[data-travel-tab="settings"]')[how]();
  await expect(row(page, 'okinawa')).toBeVisible();
}

test('saved from 設定: progress, saved on reopening and offline on the map; the trash asks first', async ({ page, context }, info) => {
  const how = howOf(info.project.name);
  const tiles = await holdTiles(page);
  await settings(page, how);
  // the trips with a map, in the list's order (coming, then past); Seattle's none
  await expect(tripsSheet(page).locator('[data-offline-row]')).toHaveCount(3);
  await expect(row(page, 'seattle')).toHaveCount(0);
  await expect(row(page, 'okinawa')).toHaveAttribute('data-offline-state', 'none');
  await expect(row(page, 'okinawa')).toContainText(/約 \d+\.\d MB/);

  await act(page, 'okinawa', 'save')[how]();
  await expect(row(page, 'okinawa')).toHaveAttribute('data-offline-state', 'saving');
  await expect(row(page, 'okinawa').locator('[role="progressbar"]')).toBeVisible();
  // another save meanwhile: says why, for a moment
  await act(page, 'zao', 'save')[how]();
  await expect(row(page, 'zao').locator('[data-offline-why="busy"]')).toHaveText('ほかの地図を保存中です');
  await tiles.go();
  await expect(row(page, 'okinawa')).toHaveAttribute('data-offline-state', 'saved', { timeout: 30_000 });
  await expect(row(page, 'okinawa')).toContainText(/保存済み · \d+\/\d+ · \d+\.\d MB/);
  expect(await hasArea(page)).toBe(true);

  // reopened: as it was
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await fromMenu(page, 'travel', how);
  await expect(row(page, 'okinawa')).toHaveAttribute('data-offline-state', 'saved');

  // the trip's 地図: its title, no save pill; offline: 「保存した範囲のみ」
  await tripsSheet(page).locator('[data-travel-tab="trips"]')[how]();
  await pickTrip(page, 'okinawa', 'map');
  await expect(tripsSheet(page).locator('[data-trip-view] h2')).toHaveText('沖縄 · 地図');
  await expect(tripsSheet(page).locator('[data-offline-save], [data-offline-delete]')).toHaveCount(0);
  await context.setOffline(true);
  await expect(tripsSheet(page).locator('[data-map-note="saved"]')).toHaveText('保存した範囲のみ');
  await context.setOffline(false);
  await expect(tripsSheet(page).locator('[data-map-note="saved"]')).toHaveCount(0);

  // the trash: キャンセル keeps it, 削除 frees it
  await tripsSheet(page).locator('.nav.back')[how]();
  await tripsSheet(page).locator('[data-travel-tab="settings"]')[how]();
  await act(page, 'okinawa', 'delete')[how]();
  await expect(page.getByRole('dialog', { name: '沖縄の地図を削除しますか？' })).toBeVisible();
  await page.locator('[data-confirm-no]')[how]();
  await expect(row(page, 'okinawa')).toHaveAttribute('data-offline-state', 'saved');
  await act(page, 'okinawa', 'delete')[how]();
  await page.locator('[data-confirm-yes]')[how]();
  await expect(row(page, 'okinawa')).toHaveAttribute('data-offline-state', 'none');
  expect(await hasArea(page)).toBe(false);
  expect(await page.evaluate(() => localStorage.getItem('island.offlineAreas'))).toBe('{}');
});

test('stopped: 一部のみ, もう一度 goes on; offline: says why; a gone area forgotten without asking', async ({ page, context }, info) => {
  const how = howOf(info.project.name);
  // NZ saved once, its cache since evicted (Safari): 消えました
  await page.addInitScript(() => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    const e = { name: { ja: 'ニュージーランド', en: 'New Zealand' }, source: 'ofm', bytes: 20_400_000, at: Date.now(), done: true, tileVersion: 'fixture' };
    localStorage.setItem('island.offlineAreas', JSON.stringify({ 'trip-nz': e }));
  });
  const tiles = await holdTiles(page);
  await settings(page, how);
  await expect(row(page, 'nz')).toHaveAttribute('data-offline-state', 'gone');
  await expect(row(page, 'nz')).toContainText('消えました');
  await act(page, 'nz', 'delete')[how]();
  await expect(row(page, 'nz')).toHaveAttribute('data-offline-state', 'none');
  await expect(page.locator('[data-confirm-yes]')).toHaveCount(0);

  await act(page, 'okinawa', 'save')[how]();
  await expect(row(page, 'okinawa')).toHaveAttribute('data-offline-state', 'saving');
  await act(page, 'okinawa', 'stop')[how]();
  await expect(row(page, 'okinawa')).toHaveAttribute('data-offline-state', 'partial');
  await expect(row(page, 'okinawa')).toContainText(/一部のみ · \d+\.\d MB/);
  await expect(act(page, 'okinawa', 'save')).toHaveText('もう一度');

  await context.setOffline(true);
  await expect(act(page, 'okinawa', 'save')).toHaveAttribute('aria-disabled', 'true');
  await expect(row(page, 'okinawa').locator('[data-offline-why="offline"]')).toHaveText('オフラインでは保存できません');
  await context.setOffline(false);
  await expect(row(page, 'okinawa').locator('[data-offline-why]')).toHaveCount(0);
  await expect(act(page, 'okinawa', 'save')).toHaveAttribute('aria-disabled', 'false');

  await tiles.go();
  await act(page, 'okinawa', 'save')[how]();
  await expect(row(page, 'okinawa')).toHaveAttribute('data-offline-state', 'saved', { timeout: 30_000 });
});

test.describe('with the worker', () => {
  test.use({ serviceWorkers: 'allow' });
  test('drawn: saved from 設定, offline, the tiles seen forgotten, the map draws from the area alone', { tag: ['@chromium', '@render'] }, async ({ page, context }) => {
    // (the island twice, the map twice and an area saved, under software GL: past 30 s in the full tier)
    test.slow();
    // OpenFreeMap from the fixtures on the context (the worker's fetches routed there), a tile it lacks a 200 empty as
    // OpenFreeMap's sea (mapTiles' 204 is saved as nothing to keep); offline, every ask noted and refused
    const missed: string[] = [];
    let offline = false;
    await context.route('https://tiles.openfreemap.org/**', (route) => {
      if (offline) return (missed.push(route.request().url()), route.abort('internetdisconnected'));
      const u = new URL(route.request().url());
      if (u.pathname === '/planet') return route.fulfill({ contentType: 'application/json', body: readFileSync(join(FIX, 'tilejson.json')), headers: CORS });
      const m = /^\/planet\/fixture\/(\d+)\/(\d+)\/(\d+)\.pbf$/.exec(u.pathname);
      const f = m && join(FIX, 'tiles', m[1], m[2], `${m[3]}.pbf`);
      return route.fulfill({ contentType: 'application/x-protobuf', body: f && existsSync(f) ? readFileSync(f) : Buffer.alloc(0), headers: CORS });
    });
    await drawn(page);
    await page.goto('?demo&date=2026-11-04T12:00');
    await islandUp(page);
    await page.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 60_000 });
    // (the map once online: MapLibre's chunk kept by the worker, as on the phone)
    await fromMenu(page, 'travel');
    await pickTrip(page, 'okinawa', 'map');
    await mapReady(page);
    await tripsSheet(page).locator('.nav.back').click();
    await tripsSheet(page).locator('[data-travel-tab="settings"]').click();
    await act(page, 'okinawa', 'save').click();
    await expect(row(page, 'okinawa')).toHaveAttribute('data-offline-state', 'saved', { timeout: 60_000 });
    // offline, nothing seen kept: what draws is the area's
    offline = true;
    await page.evaluate(() => Promise.all(['island-tiles-v1', 'island-map-meta-v1'].map((c) => caches.delete(c))));
    await context.setOffline(true);
    await page.reload();
    await islandUp(page);
    await fromMenu(page, 'travel');
    await tripsSheet(page).locator('[data-travel-tab="trips"]').click();
    await pickTrip(page, 'okinawa', 'map');
    // (the screen reaches past the area's rings at z10+: those tiles fail, so the map may say offline too; the note is
    // the saved one either way)
    await expect(tripsSheet(page).locator('[data-travel-map]')).toHaveAttribute('data-mode', /ready|offline/, { timeout: 30_000 });
    await expect(tripsSheet(page).locator('[data-map-note="saved"]')).toHaveText('保存した範囲のみ');
    await expect(page.locator('dialog[open] .maplibregl-marker.tm-pin').first()).toBeVisible();
    await expect.poll(() => page.evaluate(() => (window as unknown as { __travelMap: { state(): { settled: boolean } } }).__travelMap.state().settled), { timeout: 15_000 }).toBe(true);
    // no tile the area holds asked of the network (one past its rings may be: the screen is wider than its 3 km band)
    const held = await page.evaluate(async (n) => (await (await caches.open(n)).keys()).map((r) => r.url).filter((u) => u.endsWith('.pbf')).map((u) => u.split('/planet/_/')[1]), AREA);
    expect(held.length).toBeGreaterThan(300);
    expect(missed.map((u) => u.split('/planet/fixture/')[1]).filter((k) => k && held.includes(k))).toEqual([]);
    await context.setOffline(false);
  });
});
