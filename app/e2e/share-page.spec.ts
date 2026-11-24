// 共有リンク's page (routes/s, components/share; docs/travel.md "Sharing"): a stranger's phone (a fresh context: no key,
// nothing stored) opens `/s#<token>`: the relay's `/share` read once (the token alone in a text/plain body, never a key),
// the trip's guide from the bundle with every private value 🔒, no 持ち物, no service worker; the gone states (expired
// with its date, turned off and unknown alike), busy and offline with もう一度; English by the switch, kept this
// session. The relay is routed (e2e/share.ts routeShare), never fetched. Day and night shots at 393×659 under SHOTS.
import { expect, test, type Page } from './fixtures.ts';
import { routeShare, TOKEN, type ShareAnswer } from './share.ts';
import { mapReady, mapsDrawn } from './trips.ts';

test.use({ viewport: { width: 393, height: 659 }, storageState: { cookies: [], origins: [] } });

const EXP = '2027-11-20T03:00:00.000Z';
const OK = (ref = 'nz'): ShareAnswer => ({ ok: true, kind: 'trip', ref, exp: EXP, data: {} });
/** A `trips` link's answer: NZ's note's free value and an Okinawa item whose note the relay redacted. */
const TRIPS: ShareAnswer = {
  ok: true, kind: 'trips', ref: 'all', exp: EXP,
  data: { trips: { nz: { pack: [], notes: ['集合 8:00 オークランド空港', 'Hotel 予約番号:🔒'] }, okinawa: { pack: [{ id: '_e2eitem1', kind: 'item', cat: 'ok-0', ord: 9, name: { ja: 'お土産リスト' }, note: { ja: '確認番号 🔒' } }], notes: [] } } }
};
const shot = (page: Page, name: string) => (process.env.SHOTS ? page.screenshot({ path: `${process.env.SHOTS}/${name}-${test.info().project.name}.png` }) : Promise.resolve());

/** `/s#<token>` with the relay answering `answer`; `q`: the page's query (a ?date= for the scene clock, ?demo for the
 *  map's hooks). The reads seen. */
async function open(page: Page, answer: (b: Record<string, unknown>) => ShareAnswer, q = '') {
  const seen = await routeShare(page, answer);
  await page.goto(`s${q}#${TOKEN}`);
  return seen;
}

test('a stranger opens the link: the trip, 🔒 for every private value, no 持ち物, no key sent, no service worker', async ({ page }) => {
  const keyed: string[] = [];
  page.on('request', (r) => /[0-9a-f]{32}/i.test(`${r.url()} ${r.postData() ?? ''}`) && keyed.push(r.url()));
  // (the device clock the test's: stepped below, past the service worker's moment; the scene's at the pinned day)
  await page.clock.install({ time: Date.parse('2026-11-04T03:00:00.000Z') });
  const seen = await open(page, () => OK('nz'));
  const trip = page.locator('[data-share-trip="nz"]');
  await expect(trip).toBeVisible();
  // one read, the token alone (not paired: no `self`), as text/plain
  expect(seen.map((s) => s.body)).toEqual([{ t: TOKEN }]);
  expect(seen[0].headers['content-type']).toMatch(/^text\/plain/);
  // the pages: 日程 and 地図, never 持ち物
  await expect(page.locator('[data-trip-tab]')).toHaveCount(2);
  await expect(page.locator('[data-trip-tab="pack"]')).toHaveCount(0);
  // NZ before the trip opens on 準備: its private values (the flight's ref, the travellers) locked, never shown
  await expect(page.locator('[data-prep]')).toBeVisible();
  await expect(page.locator('[data-locked]').first()).toBeVisible();
  await expect(page.locator('[data-locked]').first()).toHaveAttribute('aria-label', '非公開');
  await expect(page.locator('[data-share-private]')).toBeVisible();
  await expect(page.locator('[data-share-foot]')).toContainText('Island Fund の旅のしおり · 2027/11/20まで有効');
  // a day
  await page.locator('[data-day-pick="1"]').tap();
  await expect(page.locator('article.day[data-day="1"]')).toBeVisible();
  await expect(page).toHaveTitle(/ニュージーランド · 旅のしおり/);
  // no service worker on a visitor's phone (stepped past where swLate would register one, 2 s after the load), no key
  // in any request, nothing kept but the tests' own
  await page.clock.runFor(5000);
  expect(await page.evaluate(() => navigator.serviceWorker.getRegistrations().then((r) => r.length))).toBe(0);
  expect(keyed).toEqual([]);
  expect(await page.evaluate(() => Object.keys(localStorage).filter((k) => !k.startsWith('e2e.')))).toEqual([]);
});

test('a member’s own phone says `self` (not a visit), and never sends its key', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('island.key', 'a1'.repeat(32)));
  const seen = await open(page, () => OK('okinawa'));
  await expect(page.locator('[data-share-trip="okinawa"]')).toBeVisible();
  expect(seen.map((s) => s.body)).toEqual([{ t: TOKEN, self: true }]);
});

test('a trips link: the list (これから, これまで), a trip with its 持ち物 and notes (🔒 chips), ‹ back; v1 `trip` links have no 持ち物', async ({ page }) => {
  await open(page, () => TRIPS);
  const list = page.locator('[data-share-trips]');
  await expect(list.locator('[data-trip="okinawa"]')).toBeVisible();
  await expect(list.locator('[data-memories]')).toBeVisible();
  await expect(page).toHaveTitle(/旅行 · 旅のしおり/);
  await list.locator('[data-trip="nz"]').tap();
  const nz = page.locator('[data-share-trip="nz"]');
  await expect(nz.locator('[data-share-notes]')).toContainText('集合 8:00 オークランド空港');
  await expect(nz.locator('[data-share-notes] [data-locked="redacted"]')).toHaveCount(1);
  await expect(nz.locator('[data-trip-tab="pack"]')).toBeVisible();
  await nz.getByRole('button', { name: '戻る' }).tap();
  await list.locator('[data-trip="okinawa"]').tap();
  await page.locator('[data-trip-tab="pack"]').tap();
  await expect(page.locator('[data-pack-item="_e2eitem1"]')).toContainText('お土産リスト');
  await expect(page.locator('[data-pack-item="_e2eitem1"] [data-locked="redacted"]')).toBeVisible();
  await expect(page.locator('[data-pack-item="ok-0-0"]')).toContainText('身分証明書');
});

test('地図: the trip map, without オフライン用に保存; キャンプ場 for a trip with campsites', async ({ page }) => {
  await mapsDrawn(page);
  await open(page, () => OK('okinawa'), '?demo');
  await page.locator('[data-trip-tab="map"]').tap();
  await mapReady(page);
  // no save anywhere: none on the map, no 設定 (オフライン地図 is the app's)
  await expect(page.locator('[data-offline-save], [data-offline-maps], [data-travel-tab="settings"]')).toHaveCount(0);
  await page.locator('[data-trip-tab="camps"]').tap();
  await expect(page.locator('[data-pane="camps"] [data-camp]').first()).toBeVisible();
});

test('gone: turned off and an unknown token alike; expired with its date; no fragment at all', async ({ page }) => {
  let answer: ShareAnswer = { ok: false, error: 'gone', why: 'off' };
  await open(page, () => answer);
  await expect(page.locator('[data-share-gone="off"]')).toContainText('このリンクは使えません');
  answer = { ok: false, error: 'gone', why: 'expired', exp: '2026-11-01T03:00:00.000Z' };
  await page.reload();
  await expect(page.locator('[data-share-gone="expired"]')).toContainText('このリンクは有効期限が切れました');
  await expect(page.locator('[data-share-gone="expired"]')).toContainText('2026/11/1まで有効でした');
  await page.goto('s');
  await expect(page.locator('[data-share-gone="off"]')).toBeVisible();
});

test('busy and offline: もう一度 reads again', async ({ page }) => {
  let answer: ShareAnswer = { status: 429, body: { ok: false, error: 'busy' } };
  const seen = await open(page, () => answer);
  await expect(page.locator('[data-share-gone="busy"]')).toContainText('混み合っています');
  answer = 'abort';
  await page.locator('[data-share-retry] button').tap();
  await expect(page.locator('[data-share-gone="offline"]')).toContainText('オフラインです');
  answer = OK('nz');
  await page.locator('[data-share-retry] button').tap();
  await expect(page.locator('[data-share-trip="nz"]')).toBeVisible();
  expect(seen).toHaveLength(3);
});

test('English: the switch (an English browser starts in it), kept this session', async ({ page }) => {
  await open(page, () => OK('nz'));
  await expect(page.locator('[data-share-trip="nz"]')).toBeVisible();
  await page.locator('[data-share-lang="en"]').tap();
  await expect(page.locator('[data-share-foot]')).toContainText('An Island Fund travel guide · valid until Nov 20, 2027');
  await expect(page.locator('[data-trip-tab="days"]')).toContainText('Plan');
  await page.reload();
  await expect(page.locator('[data-share-foot]')).toContainText('valid until Nov 20, 2027');
  // the app's own language untouched
  expect(await page.evaluate(() => localStorage.getItem('island.locale'))).toBeNull();
});

test.describe('an English browser', () => {
  test.use({ locale: 'en-US' });
  test('starts in English', async ({ page }) => {
    await open(page, () => ({ ok: false, error: 'gone', why: 'off' }));
    await expect(page.locator('[data-share-gone="off"]')).toContainText("This link can't be used");
  });
});

for (const [tod, at] of [['day', '2026-11-04T12:00'], ['night', '2026-11-04T21:30']] as const) {
  test(`shots: 日程, 地図 and both gone states (${tod})`, async ({ page }) => {
    test.skip(!process.env.SHOTS, 'SHOTS=<dir> only');
    await mapsDrawn(page);
    let answer = OK('okinawa');
    await open(page, () => answer, `?demo&date=${at}`);
    await expect(page.locator('[data-share-trip="okinawa"]')).toBeVisible();
    await page.locator('[data-day-pick="1"]').tap();
    await page.evaluate(() => document.fonts.ready);
    await shot(page, `share-days-${tod}`);
    await page.locator('[data-trip-tab="map"]').tap();
    await mapReady(page);
    await shot(page, `share-map-${tod}`);
    answer = TRIPS;
    await page.reload();
    await expect(page.locator('[data-share-trips]')).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await shot(page, `share-trips-${tod}`);
    await page.locator('[data-trip="okinawa"]').tap();
    await page.locator('[data-trip-tab="pack"]').tap();
    await expect(page.locator('[data-share-pack="okinawa"]')).toBeVisible();
    await shot(page, `share-pack-${tod}`);
    await page.getByRole('button', { name: '戻る' }).tap();
    await page.locator('[data-trip="nz"]').tap();
    await expect(page.locator('[data-share-notes]')).toBeVisible();
    await shot(page, `share-notes-${tod}`);
    answer = { ok: false, error: 'gone', why: 'off' };
    await page.reload();
    await expect(page.locator('[data-share-gone="off"]')).toBeVisible();
    await shot(page, `share-off-${tod}`);
    answer = { ok: false, error: 'gone', why: 'expired', exp: '2026-11-01T03:00:00.000Z' };
    await page.reload();
    await expect(page.locator('[data-share-gone="expired"]')).toBeVisible();
    await shot(page, `share-expired-${tod}`);
  });
}
