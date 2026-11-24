// ボット → Jobs (docs/bots.md "定期処理"; English only whatever the app's language, the tab's label and name too, every
// state checked for kana and for text cut off at 393 px: englishFits): the relay's GET /jobs and the Kalori scraper's status.json (both routed to
// fixtures at the record's pinned time) as one tab, rightmost: the verdict over the rows by their latest state (a
// stopped row 不調 with the tab's 「!」, a late one named; 回復 and 初回 said, never warnings; an open alert issue in
// 確認が必要 with its link), 要確認 first (the rows in trouble), then a section per purpose (データの更新 · 見守り・
// バックアップ · 配信・テスト), each row its name, cadence, age (初回 for one not run yet), dot and 24-cell strip; a tap
// unfolds its detail (14 days, the last runs, GitHub's links; one at a time), ジムのタブを開く switches tabs; メニューの更新
// (once メニュー's own tab): 保留 in 要確認 with 「!」, its step and PRを開く in 確認が必要, its detail (直近8週, 前回の変更,
// its links), a kept or asked メニュー tab opening it here; offline, the last copy kept on this phone under
// 読み込めませんでした; the guest reads it with its own key. The overlap guard on each state, at 393×852 (the Home Screen app's insets) and 393×659
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
const KALORI = 'https://raw.githubusercontent.com/huangwaylon/fitness/kalori-status/status.json';
const PR = 'https://github.com/huangwaylon/fitness/pull/901';

/** status.json (the workflows' contract) at `now`: the week's run published this morning, the next a week on, 8 weeks
 *  of history; `held`: the run held on a gate (削除 2.1% against 1.5%), its PR open. */
function kaloriStatus(now: number, held = false): Record<string, unknown> {
  const last = now - 9 * H, ms = 4 * H;
  return {
    v: 1, at: now - 3 * MIN, verdict: held ? 'held' : 'healthy', reasons: held ? ['band_gone'] : [],
    run: { id: 4242, url: 'https://github.com/huangwaylon/fitness/actions/runs/4242', event: 'schedule', round: 1, result: held ? 'held' : 'published', startedAt: last, endedAt: last + ms, shardsDone: 20, shardsTotal: 20 },
    next: last + 7 * D,
    dataset: { tag: 'kalori-2026-11-04', date: '2026-11-04', url: 'https://github.com/huangwaylon/fitness/releases/tag/kalori-2026-11-04', items: 54269, shops: 448, ended: 900 },
    diff: { added: 12, gone: held ? 1200 : 0, renamed: 0, valuesChanged: 38, estChanged: 2, endedChanged: 3, itemsDelta: 9, shares: {}, limits: {},
      tripped: held ? [{ code: 'band_gone', key: 'gone', share: 0.021, limit: 0.015 }] : [] },
    coverage: { complete: true, fetched: 54269, discovered: 54269, shopsTracked: 448, noNutrition: 20, failed: 0 },
    merge: { sha: held ? null : 'abc1234', deploy: held ? 'held' : 'ok', pr: held ? PR : null },
    alert: null,
    history: Array.from({ length: 8 }, (_, i) => ({ t: last - (7 - i) * 7 * D + ms, result: held && i === 7 ? 'held' : 'merged', tag: null, added: 12, gone: 0, valuesChanged: 38, endedChanged: 3, ms, runUrl: null }))
  };
}

type Run = { t: number; st: 'ok' | 'warn' | 'fail' | 'idle' | 'run'; ms?: number; c?: string; by?: string; id?: number };
/** `n` runs `every` apart from `now` back, all ok but those `bad` picks. */
const runs = (now: number, every: number, n: number, o: { bad?: (i: number) => boolean; gh?: boolean; ms?: number } = {}): Run[] =>
  Array.from({ length: n }, (_, i) => ({ t: now - 3 * MIN - i * every, st: o.bad?.(i) ? 'fail' : 'ok', ms: o.ms ?? 9000, ...(o.bad?.(i) ? { c: 'failure' } : {}), ...(o.gh ? { by: 's', id: 4500 + i } : {}) }));
const day = (now: number, back: number) => new Date(now + 9 * H - back * D).toISOString().slice(0, 10);
const days = (now: number, fails: (i: number) => number = () => 0) => Array.from({ length: 14 }, (_, i) => [day(now, 13 - i), 40, fails(i)]);

/** /jobs at `now`: everything well (the backup not run yet since the relay began 2 h ago: 初回; 全テスト failed 2 h ago,
 *  green since: 回復), but `trouble`: the backup failing twice (不調), the weather 80 min late (遅れ) and one open alert
 *  issue. */
function jobs(now: number, trouble = false) {
  const half = (id: string, o: Parameters<typeof runs>[3] = {}) => ({ id, runs: runs(now, 30 * MIN, 24, o), days: days(now) });
  const daily = (id: string, o: Parameters<typeof runs>[3] = {}) => ({ id, runs: runs(now, D, 14, o), days: days(now, (i) => (o.bad?.(13 - i) ? 1 : 0)) });
  return {
    ok: true, v: 1, now, since: now - 2 * H, ext: { at: now - 2 * MIN, by: 'app', err: null },
    jobs: [
      half('tick'),
      trouble ? { id: 'wx', runs: runs(now - 80 * MIN, 30 * MIN, 24), days: days(now) } : half('wx'),
      { id: 'places', runs: runs(now, 30 * MIN, 24).map((r, i) => (i % 5 ? { ...r, st: 'idle' } : r)), days: days(now) },
      { ...daily('nightly'), x: { ledgercheck: 9.3, sharesweep: 9.3, islandprune: 9.3, ledgerprune: 9.3, tombprune: 9.3 } },
      trouble ? daily('backup', { bad: (i) => i < 2 }) : { id: 'backup', runs: [], days: [] },
      half('health', { gh: true }), half('its-health', { gh: true }), { ...half('places-pull', { gh: true }), x: { syncedAt: now - 12 * MIN } },
      daily('places-details', { gh: true }), daily('e2e-flake-hunt', { gh: true, bad: (i) => i === 3 }),
      { id: 'kalori-watch', runs: runs(now, 6 * H, 24, { gh: true }), days: days(now) },
      { id: 'kalori-scrape', runs: runs(now, 7 * D, 6, { gh: true }), days: [] },
      { id: 'pages', runs: [{ t: now - 4 * MIN, st: 'run', by: 'p', id: 4999 }, ...runs(now, 50 * MIN, 23, { gh: true, ms: 300_000 })], days: days(now) },
      trouble ? half('e2e-logic-full', { gh: true }) : half('e2e-logic-full', { gh: true, bad: (i) => i === 3 }),
      { id: 'dispatch', runs: runs(now, 30 * MIN, 24).map((r) => ({ ...r, c: 'app' })), days: days(now) },
      { id: 'gym', runs: runs(now, 15 * MIN, 24).map((r, i) => (i % 3 ? r : { ...r, st: 'idle' })), days: days(now) }
    ],
    alerts: trouble ? [{ n: 42, title: 'Relay alert: no record backup in 30 h', label: 'alert', at: now - 5 * H }] : []
  };
}

/** A phone paired as `who`, /jobs answering `body()` (`'offline'`: unreachable); the other bots' Workers refused (their
 *  tabs aren't this spec's). */
async function phone(page: Page, context: BrowserContext, o: { who?: Who; trouble?: boolean; ins?: typeof IPHONE; held?: boolean; tab?: string } = {}) {
  await context.addInitScript(() => localStorage.setItem('e2e.render', 'none'));
  // (the tab a session kept: メニュー's, from before it was 定期処理's row)
  if (o.tab) await context.addInitScript((t) => sessionStorage.setItem('island.botsTab', t), o.tab);
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
  await page.route(KALORI, (route) => route.fulfill({ status: 200, contentType: 'text/plain; charset=utf-8', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(kaloriStatus(rec.now(), o.held)) }));
  await page.route(/its-bot|gym-bot/, (route) => route.abort('blockedbyclient'));
  await page.goto('');
  await islandUp(page);
  return { rec, seen, offline: (v: boolean) => void (state = v ? 'offline' : 'up') };
}

const sheet = (p: Page) => p.locator('dialog[open] [data-bots]');
const tab = (p: Page) => p.locator('dialog[open] [data-bots-tab="jobs"]');
const page_ = (p: Page) => sheet(p).locator('[data-jobs-page]');
const row = (p: Page, id: string) => page_(p).locator(`[data-jobs-row="${id}"]`);

/** English only (lang="en"; no kana or kanji in its text or its names, the app in Japanese) and nothing cut off: every
 *  row's and section's text, the card's, the detail's, within its box (scrollWidth ≤ clientWidth: no ellipsis, no
 *  spill) and inside the page's width (English runs longer than the Japanese it replaced). */
async function englishFits(page: Page) {
  await expect(page_(page)).toHaveAttribute('lang', 'en');
  const r = await page_(page).evaluate((root) => {
    const ja = /[\u3040-\u30ff\u4e00-\u9fff]/;
    const right = root.getBoundingClientRect().right;
    const named = [...root.querySelectorAll('[aria-label], [title]')].map((e) => `${e.getAttribute('aria-label') ?? ''} ${e.getAttribute('title') ?? ''}`);
    const boxes = [...root.querySelectorAll<HTMLElement>('.name, .age, .l2 > span, .sec-label, h3, [data-bots-word], [data-bots-asof], [data-bots-stale], [data-bots-say], dt, dd, .about, .say, .lbl, .run, .run a, .btn, [data-jobs-reason]')];
    const cut = boxes.filter((e) => e.scrollWidth > e.clientWidth + 1 || e.getBoundingClientRect().right > right + 1).map((e) => e.textContent);
    return { ja: [(root as HTMLElement).innerText, ...named].filter((t) => ja.test(t)), cut };
  });
  expect(r).toEqual({ ja: [], cut: [] });
}

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
      await expect(tabs.last()).toHaveText('Jobs');
      await expect(tabs.first()).toHaveText(/ジム/); // (the app in Japanese: only Jobs is English)
      await expect(tab(page)).toHaveAccessibleName('Jobs, failing, needs you');
      await expect(tab(page)).toHaveAttribute('lang', 'en');
      await expect(tab(page)).toHaveAttribute('data-tab-status', 'bad');
      await expect(tab(page)).toHaveAttribute('data-look', '');
      const card = page_(page).locator('[data-jobs-verdict="failing"]');
      await expect(card.locator('[data-bots-word]')).toHaveText('Failing');
      await expect(card.locator('[data-bots-say]')).toHaveText('Stopped or failing: Backup. Late or failed: Weather.');
      const alert = page_(page).locator('[data-jobs-alert]');
      await expect(alert.locator('[data-jobs-reason]')).toHaveText('Alert: Relay alert: no record backup in 30 h (opened 5 h ago)');
      await expect(alert.locator('[data-jobs-link="42"]')).toHaveAttribute('href', 'https://github.com/huangwaylon/fitness/issues/42');
      // the groups, in order, their rows
      // 要確認 first (the worst first), then by purpose, the rows in trouble out of their own
      await expect(page_(page).locator('[data-jobs-group] .sec-label')).toHaveText(['Needs attention', 'Data updates', 'Monitoring & backups', 'Deploys & tests']);
      await expect(page_(page).locator('[data-jobs-group="look"] [data-jobs-row]')).toHaveCount(2);
      await expect(page_(page).locator('[data-jobs-group="look"] [data-jobs-row]').first()).toHaveAttribute('data-jobs-row', 'backup');
      await expect(page_(page).locator('[data-jobs-group="look"] [data-jobs-row]').last()).toHaveAttribute('data-jobs-row', 'wx');
      await expect(page_(page).locator('[data-jobs-group="data"] [data-jobs-row]')).toHaveCount(5);
      await expect(page_(page).locator('[data-jobs-group="watch"] [data-jobs-row]')).toHaveCount(5);
      await expect(page_(page).locator('[data-jobs-group="ship"] [data-jobs-row]')).toHaveCount(3);
      await expect(page_(page).locator('[data-jobs-row="kalori-watch"]')).toHaveCount(0);
      // a row: its dot, name, age, cadence and why (when not 順調), its 24 cells, the newest at the right
      const backup = row(page, 'backup');
      await expect(backup).toHaveAttribute('data-jobs-tone', 'bad');
      await expect(backup.locator('.name')).toHaveText('Backup');
      await expect(backup.locator('[data-jobs-age]')).toHaveText('3 min ago');
      await expect(backup.locator('[data-jobs-why-word]')).toHaveText('Failing');
      await expect(backup.locator('[data-jobs-cell]')).toHaveCount(24);
      await expect(backup.locator('[data-jobs-cell]').last()).toHaveAttribute('data-jobs-cell', 'fail');
      await expect(backup.locator('[data-jobs-cell="none"]')).toHaveCount(10);
      await expect(backup.locator('button')).toHaveAccessibleName('Backup, Failing, last run 3 min ago');
      await expect(row(page, 'wx')).toHaveAttribute('data-jobs-why', 'late');
      await expect(row(page, 'tick')).toHaveAttribute('data-jobs-tone', 'good');
      await expect(row(page, 'tick').locator('[data-jobs-why-word]')).toHaveCount(0);
      await expect(row(page, 'pages')).toHaveAttribute('data-jobs-why', 'running');
      expect(seen.auth.every((a) => a === `Bearer ${KEY_OF.A}`)).toBe(true);
      await settle(page);
      await shot(page, `jobs-trouble-${info.project.name}-${h}`);
      await noOverlaps(page, { insets: ins });
      await englishFits(page);
      await page_(page).locator('[data-jobs-group="ship"]').scrollIntoViewIfNeeded();
      await settle(page);
      await shot(page, `jobs-bottom-${info.project.name}-${h}`);
      await noOverlaps(page, { insets: ins });
      await englishFits(page);
    });

    test('a tap unfolds a row’s detail (one at a time): what it does, 前回, 14 days, the last runs (GitHub’s links); ジムのタブを開く', async ({ page, context }, info) => {
      const how = howOf(info.project.name);
      await phone(page, context, { ins });
      await openJobs(page, how);
      await expect(page_(page).locator('[data-jobs-verdict="healthy"] [data-bots-say]')).toHaveText('All 14 OK. Recovered: Full e2e. First run to come: Backup.');
      await expect(tab(page)).toHaveAccessibleName('Jobs, healthy');
      await expect(tab(page)).not.toHaveAttribute('data-look');
      await expect(page_(page).locator('[data-jobs-group="look"]')).toHaveCount(0);
      // fine now: 回復 (good, said), 初回 at its time (neutral), neither in 要確認
      await expect(row(page, 'e2e-logic-full')).toHaveAttribute('data-jobs-tone', 'good');
      await expect(row(page, 'e2e-logic-full').locator('[data-jobs-why-word]')).toHaveText('Recovered');
      await expect(row(page, 'backup')).toHaveAttribute('data-jobs-tone', 'idle');
      await expect(row(page, 'backup').locator('[data-jobs-age]')).toHaveText(/^First run .*3:00$/);
      await expect(row(page, 'backup').locator('[data-jobs-why-word]')).toHaveCount(0);
      const nightly = row(page, 'nightly');
      await nightly.locator('button').first()[how]();
      await expect(nightly.locator('button').first()).toHaveAttribute('aria-expanded', 'true');
      const d = nightly.locator('[data-jobs-detail]');
      await expect(d.locator('.about')).toContainText('Checks the ledgers');
      await expect(d.locator('[data-jobs-x]')).toHaveCount(5);
      await expect(d.locator('[data-jobs-x="tombprune"] dd')).toHaveText('9 h ago');
      await expect(d.locator('[data-jobs-day]')).toHaveCount(14);
      await expect(d.locator('[data-jobs-days-sum]')).toHaveText('560 OK · 0 failed');
      await expect(d.locator('[data-jobs-run]')).toHaveCount(8);
      await settle(page);
      await shot(page, `jobs-detail-${info.project.name}-${h}`);
      await noOverlaps(page, { insets: ins });
      await englishFits(page);
      // another row: the first folds; a GitHub one links its runs and its workflow
      const flake = row(page, 'e2e-flake-hunt');
      await flake.locator('button').first()[how]();
      await expect(nightly.locator('[data-jobs-detail]')).toHaveCount(0);
      const fd = flake.locator('[data-jobs-detail]');
      await expect(fd.locator('[data-jobs-run="fail"]')).toHaveCount(1);
      await expect(fd.locator('[data-jobs-run] a').first()).toHaveAttribute('href', 'https://github.com/huangwaylon/fitness/actions/runs/4500');
      await expect(fd.locator('[data-jobs-open]')).toHaveAttribute('href', 'https://github.com/huangwaylon/fitness/actions/workflows/e2e-flake-hunt.yml');
      await expect(fd.locator('[data-jobs-days-sum]')).toHaveText('560 OK · 1 failed');
      await fd.locator('[data-jobs-open]').scrollIntoViewIfNeeded();
      await settle(page);
      await shot(page, `jobs-detail-gh-${info.project.name}-${h}`);
      await noOverlaps(page, { insets: ins });
      await englishFits(page);
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
  await expect(page_(page).locator('[data-jobs-error]')).toContainText("Couldn't load (offline)");
  await expect(page_(page).locator('[data-jobs-verdict="failing"] [data-bots-stale]')).toHaveText('Updating');
  await expect(row(page, 'backup')).toHaveAttribute('data-jobs-tone', 'bad');
  await expect(row(page, 'backup').locator('[data-jobs-cell]')).toHaveCount(24);
  await settle(page);
  await shot(page, `jobs-offline-${test.info().project.name}`);
  await noOverlaps(page, { insets: IPHONE });
  await englishFits(page);
  p.offline(false);
  await page_(page).locator('[data-jobs-error] button')[how]();
  await expect(page_(page).locator('[data-jobs-error]')).toHaveCount(0);
  await expect(page_(page).locator('[data-jobs-verdict] [data-bots-asof]')).toBeVisible();
});

test('the guest: the tab and every row, read with the guest’s own key', async ({ page, context }) => {
  const how = howOf(test.info().project.name);
  const { seen } = await phone(page, context, { who: 'G' });
  await openJobs(page, how);
  await expect(page_(page).locator('[data-jobs-row]')).toHaveCount(15);
  expect(seen.n).toBeGreaterThan(0);
  expect(seen.auth.every((a) => a === `Bearer ${KEY_OF.G}`)).toBe(true);
});

test('メニュー (the Kalori scraper) 保留: in 要確認 with the tab’s 「!」, 確認が必要’s step and PRを開く; its detail: the sentence, 直近8週, 前回の変更, its links', async ({ page, context }, info) => {
  const how = howOf(info.project.name);
  await phone(page, context, { held: true });
  await openJobs(page, how);
  await expect(tab(page)).toHaveAttribute('data-look', '');
  await expect(page_(page).locator('[data-jobs-verdict="trouble"] [data-bots-say]')).toContainText('Held: Menu update.');
  const menu = row(page, 'kalori-scrape');
  await expect(page_(page).locator('[data-jobs-group="look"] [data-jobs-row="kalori-scrape"]')).toHaveCount(1);
  await expect(menu).toHaveAttribute('data-jobs-tone', 'warn');
  await expect(menu.locator('[data-jobs-why-word]')).toHaveText('Held: merge the PR');
  await expect(menu.locator('.name')).toHaveText('Menu update');
  const alert = page_(page).locator('[data-jobs-alert]');
  await expect(alert.locator('[data-jobs-reason]')).toHaveText(['Check the PR and merge it by hand if it looks right.']);
  await expect(alert.locator('[data-jobs-link="pr"]')).toHaveAttribute('href', PR);
  await menu.locator('button').first()[how]();
  const d = menu.locator('[data-jobs-detail]');
  await expect(d.locator('[data-jobs-menu-say]')).toContainText('Removed 2.1%, limit 1.5%');
  await expect(d.locator('[data-jobs-week]')).toHaveCount(8);
  await expect(d.locator('[data-jobs-week="warn"]')).toHaveCount(1);
  await expect(d.locator('[data-jobs-days]')).toHaveCount(0);
  await expect(d.locator('[data-jobs-x="outcome"] dd')).toHaveText('54,269 items · 448 shops');
  await expect(d.locator('[data-jobs-seg="gone"]')).toHaveText('Removed 1,200');
  await expect(d.locator('[data-jobs-link]')).toHaveText(['Open the run', 'Open the PR', 'Open the workflow']);
  await expect(d.locator('[data-jobs-link="pr"]')).toHaveAttribute('href', PR);
  await d.locator('[data-jobs-link="workflow"]').scrollIntoViewIfNeeded();
  await settle(page);
  await shot(page, `jobs-menu-held-${info.project.name}`);
  await noOverlaps(page, { insets: IPHONE });
  await englishFits(page);
});

test('a session that kept メニュー’s tab opens 定期処理, メニューの更新 unfolded (順調: no 「!」, the workflow’s link only)', async ({ page, context }) => {
  const how = howOf(test.info().project.name);
  await phone(page, context, { tab: 'kalori' });
  await fromMenu(page, 'bots', how);
  await expect(sheet(page)).toHaveAttribute('data-tab', 'jobs');
  const d = row(page, 'kalori-scrape').locator('[data-jobs-detail]');
  await expect(d).toBeVisible();
  await expect(row(page, 'kalori-scrape')).toHaveAttribute('data-jobs-tone', 'good');
  await expect(d.locator('[data-jobs-link]')).toHaveText(['Open the workflow']);
  await expect(page.locator('dialog[open] [role="tablist"]').getByRole('tab', { name: /メニュー/ })).toHaveCount(0);
});
