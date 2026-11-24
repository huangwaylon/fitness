// ボット → 定期処理 (docs/bots.md "定期処理"): the relay's GET /jobs (routed to a fixture at the record's pinned time) as
// one tab, rightmost: the verdict over the rows (a stopped row 不調 with the tab's 「!」, a late one named; an open
// alert issue in 確認が必要 with its link), a section per place it runs (サーバー · GitHub · ボット), each row its name,
// cadence, age, dot and 24-cell strip; a tap unfolds its detail (14 days, the last runs, GitHub's links; one at a
// time), ジムのタブを開く switches tabs; offline, the last copy kept on this phone under 読み込めませんでした; the guest
// reads it with its own key. The overlap guard on each state, at 393×852 (the Home Screen app's insets) and 393×659
// (Safari's), WebKit tapping.
import { expect, test, type BrowserContext, type Page } from './fixtures.ts';
import { islandUp } from './island.ts';
import { fromMenu } from './hud.ts';
import { newRecord } from './record.ts';
import { KEY_OF, RELAY, type Who } from './relay.ts';
import { IPHONE, SAFARI_BAR, insets, noOverlaps, settle } from './overlap.ts';
import { shot } from './shots.ts';

type Tap = 'tap' | 'click';
const howOf = (project: string): Tap => (project.startsWith('webkit') ? 'tap' : 'click');
const MIN = 60_000, H = 60 * MIN, D = 24 * H;
const ORIGIN = 'http://127.0.0.1';

type Run = { t: number; st: 'ok' | 'warn' | 'fail' | 'idle' | 'run'; ms?: number; c?: string; by?: string; id?: number };
/** `n` runs `every` apart from `now` back, all ok but those `bad` picks. */
const runs = (now: number, every: number, n: number, o: { bad?: (i: number) => boolean; gh?: boolean; ms?: number } = {}): Run[] =>
  Array.from({ length: n }, (_, i) => ({ t: now - 3 * MIN - i * every, st: o.bad?.(i) ? 'fail' : 'ok', ms: o.ms ?? 9000, ...(o.bad?.(i) ? { c: 'failure' } : {}), ...(o.gh ? { by: 's', id: 4500 + i } : {}) }));
const day = (now: number, back: number) => new Date(now + 9 * H - back * D).toISOString().slice(0, 10);
const days = (now: number, fails: (i: number) => number = () => 0) => Array.from({ length: 14 }, (_, i) => [day(now, 13 - i), 40, fails(i)]);

/** /jobs at `now`: everything well, but `trouble`: the backup failing twice (不調), the weather 80 min late (遅れ) and one
 *  open alert issue. */
function jobs(now: number, trouble = false) {
  const half = (id: string, o: Parameters<typeof runs>[3] = {}) => ({ id, runs: runs(now, 30 * MIN, 24, o), days: days(now) });
  const daily = (id: string, o: Parameters<typeof runs>[3] = {}) => ({ id, runs: runs(now, D, 14, o), days: days(now, (i) => (o.bad?.(13 - i) ? 1 : 0)) });
  return {
    ok: true, v: 1, now, ext: { at: now - 2 * MIN, by: 'app', err: null },
    jobs: [
      half('tick'),
      trouble ? { id: 'wx', runs: runs(now - 80 * MIN, 30 * MIN, 24), days: days(now) } : half('wx'),
      { id: 'places', runs: runs(now, 30 * MIN, 24).map((r, i) => (i % 5 ? { ...r, st: 'idle' } : r)), days: days(now) },
      { ...daily('nightly'), x: { ledgercheck: 9.3, sharesweep: 9.3, islandprune: 9.3, ledgerprune: 9.3, tombprune: 9.3 } },
      daily('backup', trouble ? { bad: (i) => i < 2 } : {}),
      half('health', { gh: true }), half('its-health', { gh: true }), { ...half('places-pull', { gh: true }), x: { syncedAt: now - 12 * MIN } },
      daily('places-details', { gh: true }), daily('e2e-flake-hunt', { gh: true, bad: (i) => i === 3 }),
      { id: 'kalori-watch', runs: runs(now, 6 * H, 24, { gh: true }), days: days(now) },
      { id: 'kalori-scrape', runs: runs(now, 7 * D, 6, { gh: true }), days: [] },
      { id: 'pages', runs: [{ t: now - 4 * MIN, st: 'run', by: 'p', id: 4999 }, ...runs(now, 50 * MIN, 23, { gh: true, ms: 300_000 })], days: days(now) },
      half('e2e-logic-full', { gh: true }),
      { id: 'dispatch', runs: runs(now, 30 * MIN, 24).map((r) => ({ ...r, c: 'app' })), days: days(now) },
      { id: 'gym', runs: runs(now, 15 * MIN, 24).map((r, i) => (i % 3 ? r : { ...r, st: 'idle' })), days: days(now) }
    ],
    alerts: trouble ? [{ n: 42, title: 'Relay alert: no record backup in 30 h', label: 'alert', at: now - 5 * H }] : []
  };
}

/** A phone paired as `who`, /jobs answering `body()` (`'offline'`: unreachable); the other bots' Workers refused (their
 *  tabs aren't this spec's). */
async function phone(page: Page, context: BrowserContext, o: { who?: Who; trouble?: boolean; ins?: typeof IPHONE } = {}) {
  await context.addInitScript(() => localStorage.setItem('e2e.render', 'none'));
  await insets(page, o.ins ?? IPHONE);
  const rec = newRecord();
  await rec.pair(context, o.who ?? 'A');
  const seen = { n: 0, auth: [] as string[] };
  let state: 'up' | 'offline' = 'up';
  await page.route(`${RELAY}/jobs`, (route) => {
    const req = route.request();
    if (state === 'offline') return route.abort('internetdisconnected');
    const cors = { 'Access-Control-Allow-Origin': req.headers().origin ?? ORIGIN, 'Access-Control-Allow-Headers': 'Authorization, X-Request-Id' };
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    seen.n++;
    seen.auth.push(req.headers().authorization ?? '');
    return route.fulfill({ status: 200, contentType: 'application/json', headers: cors, body: JSON.stringify(jobs(rec.now(), o.trouble)) });
  });
  await page.route(/its-bot|gym-bot|raw\.githubusercontent/, (route) => route.abort('blockedbyclient'));
  await page.goto('');
  await islandUp(page);
  return { rec, seen, offline: (v: boolean) => void (state = v ? 'offline' : 'up') };
}

const sheet = (p: Page) => p.locator('dialog[open] [data-bots]');
const tab = (p: Page) => p.locator('dialog[open] [data-bots-tab="jobs"]');
const page_ = (p: Page) => sheet(p).locator('[data-jobs-page]');
const row = (p: Page, id: string) => page_(p).locator(`[data-jobs-row="${id}"]`);

async function openJobs(page: Page, how: Tap) {
  await fromMenu(page, 'bots', how);
  await tab(page)[how]();
  await expect(sheet(page)).toHaveAttribute('data-tab', 'jobs');
  await expect(page_(page).locator('[data-jobs-verdict]')).toBeVisible();
}

for (const [h, ins] of [[852, IPHONE], [659, SAFARI_BAR]] as const) {
  test.describe(`393×${h}`, () => {
    test.use({ viewport: { width: 393, height: h } });

    test('定期処理: the rightmost tab; trouble: 不調 with the tab’s 「!」, the rows named, the alert’s link; rows grouped, each with its strip', async ({ page, context }, info) => {
      const how = howOf(info.project.name);
      const { seen } = await phone(page, context, { trouble: true, ins });
      await openJobs(page, how);
      const tabs = page.locator('dialog[open] [role="tablist"]').getByRole('tab');
      await expect(tabs.last()).toHaveText(/定期処理/);
      await expect(tab(page)).toHaveAttribute('data-tab-status', 'bad');
      await expect(tab(page)).toHaveAttribute('data-look', '');
      const card = page_(page).locator('[data-jobs-verdict="failing"]');
      await expect(card.locator('[data-bots-word]')).toHaveText('不調');
      await expect(card.locator('[data-bots-say]')).toHaveText('バックアップが止まっているか、失敗が続いています。 天気の取得に遅れか失敗があります。');
      const alert = page_(page).locator('[data-jobs-alert]');
      await expect(alert.locator('[data-jobs-reason]')).toHaveText('アラート：Relay alert: no record backup in 30 h（5時間前から）');
      await expect(alert.locator('[data-jobs-link="42"]')).toHaveAttribute('href', 'https://github.com/huangwaylon/fitness/issues/42');
      // the groups, in order, their rows
      await expect(page_(page).locator('[data-jobs-group] .sec-label')).toHaveText(['サーバー', 'GitHub', 'ボット']);
      await expect(page_(page).locator('[data-jobs-group="server"] [data-jobs-row]')).toHaveCount(5);
      await expect(page_(page).locator('[data-jobs-group="github"] [data-jobs-row]')).toHaveCount(9);
      await expect(page_(page).locator('[data-jobs-group="bot"] [data-jobs-row]')).toHaveCount(2);
      // a row: its dot, name, age, cadence and why (when not 順調), its 24 cells, the newest at the right
      const backup = row(page, 'backup');
      await expect(backup).toHaveAttribute('data-jobs-tone', 'bad');
      await expect(backup.locator('.name')).toHaveText('バックアップ');
      await expect(backup.locator('[data-jobs-age]')).toHaveText('3分前');
      await expect(backup.locator('[data-jobs-why-word]')).toHaveText('失敗が続いています');
      await expect(backup.locator('[data-jobs-cell]')).toHaveCount(24);
      await expect(backup.locator('[data-jobs-cell]').last()).toHaveAttribute('data-jobs-cell', 'fail');
      await expect(backup.locator('[data-jobs-cell="none"]')).toHaveCount(10);
      await expect(backup.locator('button')).toHaveAccessibleName('バックアップ、失敗が続いています、前回 3分前');
      await expect(row(page, 'wx')).toHaveAttribute('data-jobs-why', 'late');
      await expect(row(page, 'tick')).toHaveAttribute('data-jobs-tone', 'good');
      await expect(row(page, 'tick').locator('[data-jobs-why-word]')).toHaveCount(0);
      await expect(row(page, 'pages')).toHaveAttribute('data-jobs-why', 'running');
      expect(seen.auth.every((a) => a === `Bearer ${KEY_OF.A}`)).toBe(true);
      await settle(page);
      await shot(page, `jobs-trouble-${info.project.name}-${h}`);
      await noOverlaps(page, { insets: ins });
      await page_(page).locator('[data-jobs-group="bot"]').scrollIntoViewIfNeeded();
      await settle(page);
      await shot(page, `jobs-bottom-${info.project.name}-${h}`);
      await noOverlaps(page, { insets: ins });
    });

    test('a tap unfolds a row’s detail (one at a time): what it does, 前回, 14 days, the last runs (GitHub’s links); ジムのタブを開く', async ({ page, context }, info) => {
      const how = howOf(info.project.name);
      await phone(page, context, { ins });
      await openJobs(page, how);
      await expect(page_(page).locator('[data-jobs-verdict="healthy"] [data-bots-say]')).toHaveText('16件すべて順調です。');
      await expect(tab(page)).not.toHaveAttribute('data-look');
      const nightly = row(page, 'nightly');
      await nightly.locator('button').first()[how]();
      await expect(nightly.locator('button').first()).toHaveAttribute('aria-expanded', 'true');
      const d = nightly.locator('[data-jobs-detail]');
      await expect(d.locator('.about')).toContainText('台帳の確認');
      await expect(d.locator('[data-jobs-x]')).toHaveCount(5);
      await expect(d.locator('[data-jobs-x="tombprune"] dd')).toHaveText('9時間前');
      await expect(d.locator('[data-jobs-day]')).toHaveCount(14);
      await expect(d.locator('[data-jobs-days-sum]')).toHaveText('成功560 · 失敗0');
      await expect(d.locator('[data-jobs-run]')).toHaveCount(8);
      await settle(page);
      await shot(page, `jobs-detail-${info.project.name}-${h}`);
      await noOverlaps(page, { insets: ins });
      // another row: the first folds; a GitHub one links its runs and its workflow
      const flake = row(page, 'e2e-flake-hunt');
      await flake.locator('button').first()[how]();
      await expect(nightly.locator('[data-jobs-detail]')).toHaveCount(0);
      const fd = flake.locator('[data-jobs-detail]');
      await expect(fd.locator('[data-jobs-run="fail"]')).toHaveCount(1);
      await expect(fd.locator('[data-jobs-run] a').first()).toHaveAttribute('href', 'https://github.com/huangwaylon/fitness/actions/runs/4500');
      await expect(fd.locator('[data-jobs-open]')).toHaveAttribute('href', 'https://github.com/huangwaylon/fitness/actions/workflows/e2e-flake-hunt.yml');
      await expect(fd.locator('[data-jobs-days-sum]')).toHaveText('成功560 · 失敗1');
      await fd.locator('[data-jobs-open]').scrollIntoViewIfNeeded();
      await settle(page);
      await shot(page, `jobs-detail-gh-${info.project.name}-${h}`);
      await noOverlaps(page, { insets: ins });
      // the gym's row: its tab
      const gym = row(page, 'gym');
      await gym.locator('button').first()[how]();
      await gym.locator('[data-jobs-gym]')[how]();
      await expect(sheet(page)).toHaveAttribute('data-tab', 'gym');
    });
  });
}

test('offline: the last copy this phone read, under 読み込めませんでした（オフライン）; back online it reads again', async ({ page, context }) => {
  const how = howOf(test.info().project.name);
  const p = await phone(page, context, { trouble: true });
  await openJobs(page, how);
  await expect(row(page, 'backup')).toHaveAttribute('data-jobs-tone', 'bad');
  p.offline(true);
  await page.reload();
  await islandUp(page);
  await fromMenu(page, 'bots', how);
  // (the tab last shown this session)
  await expect(sheet(page)).toHaveAttribute('data-tab', 'jobs');
  await expect(page_(page).locator('[data-jobs-error]')).toContainText('読み込めませんでした（オフライン）');
  await expect(page_(page).locator('[data-jobs-verdict="failing"] [data-bots-stale]')).toHaveText('更新中');
  await expect(row(page, 'backup')).toHaveAttribute('data-jobs-tone', 'bad');
  await expect(row(page, 'backup').locator('[data-jobs-cell]')).toHaveCount(24);
  await settle(page);
  await shot(page, `jobs-offline-${test.info().project.name}`);
  await noOverlaps(page, { insets: IPHONE });
  p.offline(false);
  await page_(page).locator('[data-jobs-error] button')[how]();
  await expect(page_(page).locator('[data-jobs-error]')).toHaveCount(0);
  await expect(page_(page).locator('[data-jobs-verdict] [data-bots-asof]')).toBeVisible();
});

test('the guest: the tab and every row, read with the guest’s own key', async ({ page, context }) => {
  const how = howOf(test.info().project.name);
  const { seen } = await phone(page, context, { who: 'G' });
  await openJobs(page, how);
  await expect(page_(page).locator('[data-jobs-row]')).toHaveCount(16);
  expect(seen.n).toBeGreaterThan(0);
  expect(seen.auth.every((a) => a === `Bearer ${KEY_OF.G}`)).toBe(true);
});
