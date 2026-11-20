// トレイル's registered hikes (components/hiking/HikeForm.svelte, hikes.svelte.ts; docs/hiking.md "Registered hikes"),
// on a paired phone over the relay's real record in the test's process (e2e/liveRoom.ts), WebKit with taps, Chromium
// with clicks. The relay's YAMAP import (`POST /hiking`) is route-mocked with an invented activity (no network; the
// track the fixture's, e2e/fixtures/hiking/tiny.gpx). A YAMAP link pasted in share text → its preview → 保存 → its trail,
// then in 歩いた; 編集 to 行きたい moves it; 削除 (asked) goes at once, 取り消す brings it back, and it's on the record after
// a reload; the same link again opens it. A GPX file (and a broken one's line); by hand as the guest (no track: the
// plain page); a link not YAMAP's and a private activity's lines. Day and night shots at 393×659 (SHOTS=<dir>).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type Browser, type Page } from './fixtures.ts';
import { islandUp } from './island.ts';
import { newIsland } from './liveRoom.ts';
import { fromMenu } from './hud.ts';
import { shot } from './shots.ts';
import { RELAY } from './relay.ts';
import { toTrack } from '../src/lib/contract/hikeTrack.ts';

type Island = ReturnType<typeof newIsland>;
type How = 'tap' | 'click';
const VIEW = { width: 393, height: 659 };
const howOf = (name: string): How => (name.startsWith('webkit') ? 'tap' : 'click');
const GPX = join(import.meta.dirname, 'fixtures', 'hiking', 'tiny.gpx');
const TRACK = toTrack(readFileSync(GPX, 'utf8'));
/** An invented activity as the relay answers it (contract/yamap.ts HikeImportReply). */
const META = { name: 'テスト尾根の周回', area: '架空県', status: 'done', date: '2026-10-12', src: 'yamap', ref: 'a90000001', km: 6.4, gainM: 512, downM: 498, time: '3:40', diff: 'moderate' };
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type', 'Access-Control-Allow-Methods': 'POST' };

async function phone(browser: Browser, island: Island, who: 'A' | 'G', how: How) {
  const context = await browser.newContext({ viewport: VIEW, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', serviceWorkers: 'block', hasTouch: how === 'tap' });
  await context.addInitScript(() => localStorage.setItem('e2e.render', 'none'));
  await island.pair(context, who);
  // (after the record's route: the later route wins) the relay's YAMAP import, by the link's id
  await context.route(`${RELAY}/hiking`, async (r) => {
    if (r.request().method() === 'OPTIONS') return r.fulfill({ status: 204, headers: CORS });
    const url = String((r.request().postDataJSON() as { url?: string }).url ?? '');
    if (url.includes('/activities/90000002')) return r.fulfill({ status: 404, headers: CORS, json: { ok: false, error: 'not_found' } });
    return r.fulfill({ status: 200, headers: CORS, json: { ok: true, meta: META, track: TRACK } });
  });
  const page = await context.newPage();
  await page.goto('');
  await islandUp(page, { timeout: 20_000 });
  await open(page, how);
  return page;
}
async function open(page: Page, how: How) {
  await fromMenu(page, 'hiking', how);
  await expect(list(page)).toBeVisible();
}

const sheet = (p: Page) => p.locator('dialog[open] [data-hiking]');
const list = (p: Page) => sheet(p).locator('[data-trail-list]');
const top = (p: Page) => p.locator('dialog[open]').last();
const mine = (p: Page) => list(p).locator('[data-trail^="u-"]');
const view = (p: Page) => sheet(p).locator('[data-trail-view^="u-"]');
const banner = (p: Page) => p.getByRole('button', { name: '取り消す' });
/** The section a registered hike's row or card sits under. */
const sectionOf = (p: Page, name: string) =>
  list(p).locator('.list').evaluate((el, name) => {
    let sec: string | null = null;
    for (const c of el.children) {
      if (c.matches('[data-section]')) sec = c.getAttribute('data-section');
      else if ([...c.querySelectorAll('[data-trail^="u-"] .name'), ...(c.matches('[data-trail^="u-"]') ? c.querySelectorAll('.name') : [])].some((n) => n.textContent === name)) return sec;
    }
    return null;
  }, name);

async function add(p: Page, how: How, src: 'yamap' | 'gpx' | 'manual') {
  await list(p).locator('[data-hike-add]')[how]();
  await top(p).locator(`[data-action="${src}"]`)[how]();
  await expect(top(p).locator(`[data-hike-form="${src}"]`)).toBeVisible();
}
async function dayAndNight(p: Page, name: string, project: string) {
  await shot(p, `${name}-day-${project}`);
  await p.evaluate(() => (document.documentElement.dataset.tod = 'night'));
  await shot(p, `${name}-night-${project}`);
  await p.evaluate(() => (document.documentElement.dataset.tod = 'day'));
}

test.afterEach(async ({ browser }) => {
  for (const c of browser.contexts()) await c.close();
});

test('a YAMAP link: preview, 保存, 歩いた; 編集 to 行きたい moves it; 削除 then 取り消す; on the record; the same link opens it', async ({ browser }, info) => {
  const how = howOf(info.project.name);
  const island = newIsland();
  const a = await phone(browser, island, 'A', how);
  await expect(mine(a)).toHaveCount(0);
  await add(a, how, 'yamap');
  const form = top(a);
  await form.locator('[data-hike-url]').fill('テスト尾根の周回 - 2026年10月12日 https://yamap.com/activities/90000001 #YAMAP');
  await form.locator('[data-hike-load]')[how]();
  await expect(form.locator('[data-hike-field="name"]')).toHaveValue('テスト尾根の周回');
  await expect(form.locator('[data-hike-field="area"]')).toHaveValue('架空県');
  await expect(form.locator('[data-hike-field="date"]')).toHaveValue('2026-10-12');
  await expect(form.locator('[data-hike-status="done"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(form.locator('[data-hike-figs]')).toContainText('6.4 km');
  await expect(form.locator('[data-elev]')).toBeVisible();
  await dayAndNight(a, 'trail-user-form-yamap', info.project.name);
  await form.locator('[data-hike-save]')[how]();

  // its trail at once: the map (the stub), its chart, its card and YAMAP's credit
  await expect(view(a)).toBeVisible();
  await expect(view(a).locator('.pk-title')).toHaveText('テスト尾根の周回');
  await expect(view(a).locator('[data-trail-map]')).toHaveAttribute('data-mode', 'stub');
  await expect(view(a).locator('[data-hike-status]')).toHaveText('歩いた');
  await expect(view(a).locator('.attrib')).toContainText('軌跡・記録：YAMAP');
  await view(a).locator('[data-sheet-grip]')[how]();
  await expect(view(a)).toHaveAttribute('data-sheet', 'full');
  await dayAndNight(a, 'trail-user-view', info.project.name);
  await view(a).locator('.nav.back')[how]();
  expect(await sectionOf(a, 'テスト尾根の周回')).toBe('walked');
  await expect(mine(a).locator('[data-missing]')).toHaveCount(1);
  await mine(a).evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await dayAndNight(a, 'trail-user-list', info.project.name);

  // 編集: 行きたい
  await mine(a)[how]();
  await view(a).locator('[data-sheet-grip]')[how]();
  await view(a).locator('[data-hike-edit]')[how]();
  await expect(top(a).locator('[data-hike-field="name"]')).toHaveValue('テスト尾根の周回');
  await top(a).locator('[data-hike-status="want"]')[how]();
  await top(a).locator('[data-hike-save]')[how]();
  await expect(view(a).locator('[data-hike-status]')).toHaveText('行きたい');
  await view(a).locator('.nav.back')[how]();
  expect(await sectionOf(a, 'テスト尾根の周回')).toBe('want');

  // 削除: asked, gone at once, 取り消す brings it back
  await mine(a)[how]();
  await view(a).locator('[data-sheet-grip]')[how]();
  await view(a).locator('[data-hike-remove]')[how]();
  await expect(top(a)).toContainText('このコースを削除しますか？');
  await top(a).locator('[data-confirm-yes]')[how]();
  await expect(view(a)).toHaveCount(0);
  await expect(mine(a)).toHaveCount(0);
  await banner(a)[how]();
  await expect(mine(a)).toHaveCount(1);

  // on the record: there after a reload, its track too; the same link again opens it, no second
  await a.reload();
  await islandUp(a, { timeout: 20_000 });
  await open(a, how);
  await expect(mine(a)).toHaveCount(1);
  expect(await sectionOf(a, 'テスト尾根の周回')).toBe('want');
  await add(a, how, 'yamap');
  await top(a).locator('[data-hike-url]').fill('https://yamap.com/activities/90000001');
  await top(a).locator('[data-hike-load]')[how]();
  await expect(view(a)).toBeVisible();
  await expect(view(a).locator('[data-elev]')).toBeVisible();
  await view(a).locator('.nav.back')[how]();
  await expect(mine(a)).toHaveCount(1);
});

test('a GPX file: read on the phone, its chart, 保存; a broken file says so', async ({ browser }, info) => {
  const how = howOf(info.project.name);
  const island = newIsland();
  const a = await phone(browser, island, 'A', how);
  await add(a, how, 'gpx');
  const form = top(a);
  await form.locator('[data-hike-file]').setInputFiles({ name: 'broken.gpx', mimeType: 'application/gpx+xml', buffer: Buffer.from('<gpx><trk></trk></gpx>') });
  await expect(form.locator('[data-hike-error]')).toHaveText('GPXファイルを読み込めませんでした（軌跡が見つかりません）');
  await form.locator('[data-hike-file]').setInputFiles(GPX);
  await expect(form.locator('[data-hike-error]')).toHaveCount(0);
  await expect(form.locator('[data-hike-field="name"]')).toHaveValue('Fixture');
  await expect(form.locator('[data-elev]')).toBeVisible();
  await expect(form.locator('[data-hike-status="done"]')).toHaveAttribute('aria-pressed', 'true');
  await form.locator('[data-hike-field="name"]').fill('裏山の散歩');
  await form.locator('[data-hike-field="hours"]').fill('1');
  await form.locator('[data-hike-field="mins"]').fill('20');
  await dayAndNight(a, 'trail-user-form-gpx', info.project.name);
  await form.locator('[data-hike-save]')[how]();
  await expect(view(a).locator('.pk-title')).toHaveText('裏山の散歩');
  await expect(view(a).locator('[data-elev]')).toBeVisible();
  await expect(view(a).locator('.peek')).toContainText('約1時間20分');
  await view(a).locator('.nav.back')[how]();
  expect(await sectionOf(a, '裏山の散歩')).toBe('walked');
});

test('by hand as the guest, offline (no track: the plain page; on the record once back); YAMAP offline, a link not YAMAP’s, a private activity’s (then its GPX)', async ({ browser }, info) => {
  const how = howOf(info.project.name);
  const island = newIsland();
  const g = await phone(browser, island, 'G', how);
  await add(g, how, 'manual');
  const form = top(g);
  // the name is needed
  await form.locator('[data-hike-save]')[how]();
  await expect(form.locator('[role="alert"]')).toHaveText('コース名を入力してください');
  await form.locator('[data-hike-field="name"]').fill('いつか行く山');
  await form.locator('[data-hike-status="planned"]')[how]();
  await form.locator('[data-hike-field="date"]').fill('2027-05-03');
  await form.locator('[data-hike-field="km"]').fill('8.5');
  await form.locator('[data-hike-field="gain"]').fill('900');
  await form.locator('[data-hike-field="notes"]').fill('始発で行く\n雨なら延期');
  await dayAndNight(g, 'trail-user-form-manual', info.project.name);
  // saved offline: queued, shown at once
  island.offline('G');
  await g.context().setOffline(true);
  await form.locator('[data-hike-save]')[how]();
  await expect(view(g)).toHaveAttribute('data-sheet', 'none');
  await expect(view(g).locator('[data-trail-map]')).toHaveCount(0);
  await expect(view(g)).toContainText('8.5');
  await expect(view(g).locator('[data-hike-notes]')).toHaveText('始発で行く\n雨なら延期');
  await dayAndNight(g, 'trail-user-plain', info.project.name);
  await view(g).locator('.nav.back')[how]();
  expect(await sectionOf(g, 'いつか行く山')).toBe('planned');
  await expect(mine(g).locator('.band.ph')).toHaveCount(1);
  await dayAndNight(g, 'trail-user-list-planned', info.project.name);
  // YAMAP's link needs the network
  await add(g, how, 'yamap');
  await top(g).locator('[data-hike-url]').fill('https://yamap.com/activities/90000001');
  await top(g).locator('[data-hike-load]')[how]();
  await expect(top(g).locator('[data-hike-error]')).toHaveText('オフラインです');
  // (a link typed: ✕ asks first)
  await top(g).locator('.nav.close')[how]();
  await top(g).locator('[data-discard-yes]')[how]();
  island.offline('G', false);
  await g.context().setOffline(false);
  // back online: the queued hike reaches the record, and a member's phone
  const a = await phone(browser, island, 'A', how);
  await expect(mine(a).locator('.name')).toHaveText(['いつか行く山'], { timeout: 15_000 });

  await add(g, how, 'yamap');
  await top(g).locator('[data-hike-url]').fill('https://example.com/activities/1');
  await top(g).locator('[data-hike-load]')[how]();
  await expect(top(g).locator('[data-hike-error]')).toHaveText('YAMAPの活動日記かモデルコースのリンクを貼ってください');
  await top(g).locator('[data-hike-url]').fill('https://yamap.com/activities/90000002');
  await top(g).locator('[data-hike-load]')[how]();
  await expect(top(g).locator('[data-hike-error]')).toHaveText('見つかりませんでした（非公開の活動日記は読み込めません）');
  await top(g).locator('[data-hike-use-gpx]')[how]();
  await expect(top(g).locator('[data-hike-form="gpx"]')).toBeVisible();
});
