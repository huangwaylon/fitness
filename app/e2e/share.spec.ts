// 共有リンク (docs/travel.md "Sharing", docs/design.md §Trips): the trips list → the share disc → the 共有リンク level, on a
// phone paired with a record of its own (e2e/record.ts: the relay's real code, `POST /share` by its real gate). Made with
// the default 1年, コピー and 共有… (navigator.share and the clipboard stubbed), then a FRESH phone with no key opens the
// link: the whole trips page (every trip, past and coming), a coming and a past trip opened with their 持ち物 and notes,
// a planted booking ref 🔒, the {p:} values and the guest's item never sent, no key in any request, no service worker;
// the owner's list shows the visit; 無効にする → the visitor's page says the link can't be used; 期限を変更 brings it back.
// The guest has no share disc. Day and night shots at 393×659 (SHOTS=<dir>).
import { expect, test, type Browser, type BrowserContext, type Page } from './fixtures.ts';
import { islandUp } from './island.ts';
import { openTrips, tripsSheet } from './trips.ts';
import { newRecord } from './record.ts';
import { KEYS } from './relay.ts';
import { shot } from './shots.ts';

test.use({ viewport: { width: 393, height: 659 } });
type Rec = ReturnType<typeof newRecord>;
const VIEW = { width: 393, height: 659 };

/** WebKit taps (the phones' input), Chromium clicks. */
const howOf = (name: string) => (name.startsWith('webkit') ? 'tap' : 'click') as 'tap' | 'click';

/** A member's (or the guest's) phone on `rec`, the trips list open; navigator.share and the clipboard stubbed (what they were
 *  given in window.__shared / __copied). */
async function member(browser: Browser, rec: Rec, who: 'A' | 'B' | 'G', touch: boolean): Promise<Page> {
  const context = await browser.newContext({ viewport: VIEW, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', serviceWorkers: 'block', hasTouch: touch });
  await context.addInitScript(() => {
    localStorage.setItem('e2e.render', 'none');
    const w = window as unknown as { __shared: unknown[]; __copied: string[] };
    w.__shared = [];
    w.__copied = [];
    Object.defineProperty(navigator, 'share', { configurable: true, value: async (d: unknown) => void w.__shared.push(d) });
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (s: string) => void w.__copied.push(s) } });
  });
  await rec.pair(context, who);
  const page = await context.newPage();
  await page.goto('');
  await islandUp(page);
  await openTrips(page);
  return page;
}

/** A visitor's phone: never paired, no key; service workers allowed (none must be registered). */
async function visitor(browser: Browser, rec: Rec, touch: boolean): Promise<{ context: BrowserContext; page: Page; posted: string[] }> {
  const context = await browser.newContext({ viewport: VIEW, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', hasTouch: touch });
  await rec.visitor(context);
  const page = await context.newPage();
  const posted: string[] = [];
  page.on('request', (r) => posted.push(`${r.url()} ${r.postData() ?? ''} ${JSON.stringify(r.headers())}`));
  return { context, page, posted };
}

/** Day and night pictures (SHOTS=<dir>): the theme's night set by hand for the second (the record's clock is noon). */
async function shots(page: Page, name: string, project: string) {
  if (!process.env.SHOTS) return;
  await shot(page, `${name}-day-${project}`);
  const was = await page.evaluate(() => document.documentElement.dataset.tod);
  await page.evaluate(() => (document.documentElement.dataset.tod = 'night'));
  await shot(page, `${name}-night-${project}`);
  await page.evaluate((t) => (document.documentElement.dataset.tod = t), was ?? 'day');
}

const level = (page: Page) => tripsSheet(page).locator('[data-share-level]');
const row = (page: Page) => level(page).locator('[data-share-row]').first();

/** What the record holds besides the guides: notes with private values and free text, a member's packing item with a
 *  booking ref in its note, the guest's item. */
function plant(rec: Rec) {
  const at = rec.now();
  for (const [who, type, data] of [
    ['A', 'trip_note', { trip: 'okinawa', at, v: { flightRef: 'SECRETPNR1', meet: '集合 那覇空港 9:00', memo: 'レンタカー 予約 XK7Q2P' } }],
    ['A', 'trip_note', { trip: 'nz', at, v: { flightRef: 'NZSECRET1', traveller1: 'HUANG/WAYLON', plan: 'Taupō は天気次第' } }],
    ['A', 'pack', { trip: 'okinawa', id: '_e2eitem1', at, kind: 'item', cat: 'ok-0', ord: 9, name: { ja: 'お土産リスト' }, note: { ja: '確認番号 4F7K9Z' }, by: 'A' }],
    ['G', 'pack', { trip: 'nz', id: '_e2eguest1', at, kind: 'item', cat: 'nz-0', ord: 9, name: { ja: 'GUESTITEM' }, by: 'G' }]
  ] as const) expect(rec.event(who, type, data as Record<string, unknown>)).toMatchObject({ ok: true });
}
const SECRETS = ['SECRETPNR1', 'XK7Q2P', 'NZSECRET1', 'HUANG', '4F7K9Z', 'GUESTITEM'];

test('a member makes a 1年 link to the trips page; a fresh phone with no key reads every trip with 持ち物 and notes (🔒), the visit is counted, 無効にする ends it, 期限を変更 brings it back', async ({ browser, browserName }) => {
  const how = howOf(browserName), touch = how === 'tap';
  const rec = newRecord();
  plant(rec);
  const a = await member(browser, rec, 'A', touch);
  await tripsSheet(a).locator('[data-share-disc]')[how]();
  await expect(level(a)).toBeVisible();
  await expect(tripsSheet(a)).toHaveAttribute('data-level', 'share');
  await expect(level(a).locator('[data-share-days="365"]')).toHaveAttribute('aria-pressed', 'true');
  await shots(a, 'owner-empty', browserName);
  await level(a).locator('[data-share-label]').fill('両親へ');
  await level(a).locator('[data-share-make]')[how]();
  await expect(row(a).locator('[data-share-name]')).toHaveText('両親へ');
  await expect(row(a)).toContainText('2027/11/04まで');
  await row(a).locator('[data-share-copy]')[how]();
  await row(a).locator('[data-share-send]')[how]();
  const { copied, shared } = await a.evaluate(() => {
    const w = window as unknown as { __shared: { url: string; title: string }[]; __copied: string[] };
    return { copied: w.__copied, shared: w.__shared };
  });
  expect(copied).toHaveLength(1);
  expect(copied[0]).toMatch(/^http:\/\/127\.0\.0\.1:\d+(\/[\w-]+)?\/s#[A-Za-z0-9_-]{22}$/);
  expect(shared).toEqual([{ url: copied[0], title: '旅行' }]);
  await shots(a, 'owner-made', browserName);

  // a fresh phone, no key: the whole trips page, read-only
  const v = await visitor(browser, rec, touch);
  const link = new URL(copied[0]);
  await v.page.goto(`${link.pathname}${link.hash}`);
  const list = v.page.locator('[data-share-trips]');
  await expect(list).toBeVisible();
  for (const id of ['okinawa', 'seattle', 'nz', 'zao']) await expect(list.locator(`[data-trip="${id}"]`)).toBeVisible();
  await expect(list.locator('[data-memories]')).toBeVisible();
  await shots(v.page, 'visitor-list', browserName);

  // a coming trip (NZ: opens on 準備): its notes' free value, its {p:} values 🔒; 持ち物 the seed, never the guest's item
  await list.locator('[data-trip="nz"]')[how]();
  const nz = v.page.locator('[data-share-trip="nz"]');
  await expect(nz.locator('[data-share-notes]')).toContainText('Taupō は天気次第');
  await expect(nz.locator('[data-locked]').first()).toBeVisible();
  await nz.locator('[data-trip-tab="pack"]')[how]();
  await expect(nz.locator('[data-share-pack="nz"]')).toContainText('パスポート');
  await shots(v.page, 'visitor-pack', browserName);
  await nz.getByRole('button', { name: '戻る' })[how]();

  // a past trip (Okinawa): 持ち物 with the member's item, its booking ref 🔒; 準備's notes with the ref 🔒
  await list.locator('[data-trip="okinawa"]')[how]();
  const ok = v.page.locator('[data-share-trip="okinawa"]');
  await ok.locator('[data-trip-tab="pack"]')[how]();
  const item = ok.locator('[data-pack-item="_e2eitem1"]');
  await expect(item).toContainText('お土産リスト');
  await expect(item.locator('[data-locked="redacted"]')).toBeVisible();
  await ok.locator('[data-trip-tab="days"]')[how]();
  await ok.locator('[data-day-pick="prep"]')[how]();
  const notes = ok.locator('[data-share-notes]');
  await expect(notes).toContainText('集合 那覇空港 9:00');
  await expect(notes).toContainText('レンタカー 予約');
  await expect(notes.locator('[data-locked="redacted"]')).toHaveCount(1);
  await shots(v.page, 'visitor-notes', browserName);
  const html = await v.page.content();
  for (const x of SECRETS) expect(html).not.toContain(x);
  // what came over the wire: none of it either
  expect(rec.shareReads.length).toBeGreaterThan(0);
  expect(await v.page.evaluate(async () => (await navigator.serviceWorker?.getRegistrations())?.length ?? 0)).toBe(0);
  for (const key of Object.values(KEYS)) expect(v.posted.filter((p) => p.includes(key))).toEqual([]);
  expect(v.posted.filter((p) => /island\.key|"key"/.test(p))).toEqual([]);

  // the owner's list: one view
  await tripsSheet(a).getByRole('button', { name: '戻る' })[how]();
  await tripsSheet(a).locator('[data-share-disc]')[how]();
  await expect(row(a).locator('[data-share-views]')).toHaveText(/閲覧 1回（約1人）/);
  await row(a).locator('[data-share-open]')[how]();
  await expect(row(a).locator('[data-share-visit]')).toHaveCount(1);
  await expect(row(a).locator('[data-share-visit]')).toContainText('JP');
  await shots(a, 'owner-visits', browserName);

  // 無効にする: at once, 取り消す on the banner; the visitor's page says it can't be used
  await row(a).locator('[data-share-more]')[how]();
  await a.locator('dialog[open] [data-share-act-off]')[how]();
  await expect(a.getByRole('button', { name: '取り消す' })).toBeVisible();
  await expect(level(a).locator('[data-share-state="live"]')).toHaveCount(0);
  await v.page.reload();
  await expect(v.page.locator('[data-share-gone="off"]')).toBeVisible();
  await shots(v.page, 'visitor-off', browserName);

  // 期限を変更 on the ended link: live again, the visitor reads the trips page
  await level(a).locator('[data-share-ended]')[how]();
  await shots(a, 'owner-ended', browserName);
  await level(a).locator('[data-share-state="off"] [data-share-more]')[how]();
  await a.locator('dialog[open] [data-share-act-renew]')[how]();
  await a.locator('dialog[open] [data-share-renew-30]')[how]();
  await expect(level(a).locator('[data-share-state="live"]')).toHaveCount(1);
  await expect(row(a)).toContainText('2026/12/04まで');
  await v.page.reload();
  await expect(v.page.locator('[data-share-trips]')).toBeVisible();
  await v.context.close();
});

test('the guest has no share disc; a member’s level offline says so', async ({ browser, browserName }) => {
  const how = howOf(browserName), touch = how === 'tap';
  const rec = newRecord();
  const g = await member(browser, rec, 'G', touch);
  await expect(tripsSheet(g).locator('[data-trip-list]')).toBeVisible();
  await expect(tripsSheet(g).locator('[data-share-disc]')).toHaveCount(0);
  // nor a trip's level (the disc lives on the list only)
  const b0 = await member(browser, rec, 'A', touch);
  await tripsSheet(b0).locator('[data-trip="nz"]')[how]();
  await expect(tripsSheet(b0).locator('[data-trip-view="nz"]')).toBeVisible();
  await expect(tripsSheet(b0).locator('[data-share-disc]')).toHaveCount(0);
  const b = await member(browser, rec, 'B', touch);
  rec.offline(true);
  await tripsSheet(b).locator('[data-share-disc]')[how]();
  await expect(level(b).locator('[data-share-offline]')).toBeVisible();
  rec.offline(false);
  await level(b).getByRole('button', { name: 'もう一度' })[how]();
  await expect(level(b).locator('[data-share-form]')).toBeVisible();
});
