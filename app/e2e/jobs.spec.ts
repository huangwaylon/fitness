// ボット → Jobs (docs/bots.md "Jobs"; English only whatever the app's language, the tab's label and name too, every
// state checked for kana and for text cut off at 393 px: englishFits): the relay's GET /jobs, the Kalori scraper's
// status.json and the gym bot's /status (routed to fixtures at the record's pinned time) as one tab, rightmost: the
// verdict's sentence of what to do (the tab's 「!」 with it), Needs you (the open alert, Chain menus' PR, then the
// rows in trouble from anywhere: a job, the Gym bot, a Cloudflare limit's copy), the home headings counting what moved
// up, Bots · Data for the app · Your data, Behind the scenes and Releases folded while healthy (a summary row, a tap
// unfolds), the Cloudflare limits last; the server timer stopped: its row says what's paused, its dependents wait on
// it. A row's detail (14 days, the last runs, GitHub's links; one at a time), the Gym tab's button; Chain menus'
// detail (8 weeks, the last change, its links), a kept メニュー tab opening it; offline, the last copy under the note;
// the guest reads it with its own key. The overlap guard on each state, at 393×852 (the Home Screen app's insets) and
// 393×659 (Safari's), WebKit tapping.
import { expect, test, type BrowserContext, type Page } from './fixtures.ts';
import { islandUp } from './island.ts';
import { fromMenu } from './hud.ts';
import { newRecord } from './record.ts';
import { KEY_OF, RELAY, type Who } from './relay.ts';
import { IPHONE, SAFARI_BAR, insets, noOverlaps, settle } from './overlap.ts';
import { shot } from './shots.ts';
import { STATUS as GYM_STATUS, statusPayload } from './gymbot.ts';

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

type Usage = 'ok' | 'tight' | 'none' | 'over';
/** /jobs's usage (relay/src/cfUsage.ts) read 4 min before `now`: well (every limit under 60 %), tight (rows read 92 %:
 *  red, rows written 72 %: amber), over (rows read at 5M: /jobs then 503s, the record unreadable), none (the test
 *  copy's: no token). */
function usage(now: number, u: Usage) {
  const day = new Date(now).toISOString().slice(0, 10);
  if (u === 'none') return { at: now, day: null, limits: [], err: 'no_token' };
  const read = u === 'over' ? 5_000_000 : u === 'tight' ? 4_600_000 : 325_265, written = u === 'tight' ? 72_000 : 22_971;
  return {
    at: now - 4 * MIN, day, err: null,
    limits: [
      { k: 'doRead', used: read, max: 5_000_000, by: [{ name: 'test/IslandStore', n: Math.round(read * 0.55) }, { name: 'relay/IslandStore', n: Math.round(read * 0.3) }, { name: 'relay/IslandLog', n: Math.round(read * 0.15) }] },
      { k: 'doWrite', used: written, max: 100_000, by: [{ name: 'relay/IslandLog', n: Math.round(written * 0.6) }, { name: 'test/IslandLog', n: Math.round(written * 0.4) }] },
      { k: 'doReq', used: 4633, max: 100_000, by: [{ name: 'test/IslandRoom', n: 2633 }, { name: 'relay/IslandRoom', n: 2000 }] },
      { k: 'wReq', used: 1377, max: 100_000, by: [{ name: 'relay', n: 750 }, { name: 'test', n: 450 }, { name: 'gym-bot', n: 89 }, { name: 'its-bot', n: 88 }] }
    ]
  };
}

/** /jobs at `now`: everything well (the backup not run yet since the relay began 2 h ago: First run; Full test run
 *  failed 2 h ago, green since: Recovered), but `trouble`: the backup failing twice (Failing), the weather 80 min late
 *  (Late) and one open alert issue; `timer`: the server timer stopped 3 h ago, the weather and the places' sorting with
 *  it. */
function jobs(now: number, trouble = false, u: Usage = 'ok', timer = false) {
  const stopped = (id: string) => ({ id, runs: runs(now - 3 * H, 30 * MIN, 24), days: days(now) });
  const half = (id: string, o: Parameters<typeof runs>[3] = {}) => ({ id, runs: runs(now, 30 * MIN, 24, o), days: days(now) });
  const daily = (id: string, o: Parameters<typeof runs>[3] = {}) => ({ id, runs: runs(now, D, 14, o), days: days(now, (i) => (o.bad?.(13 - i) ? 1 : 0)) });
  return {
    ok: true, v: 1, now, since: now - 2 * H, ext: { at: now - 2 * MIN, by: 'app', err: null },
    jobs: [
      timer ? stopped('tick') : half('tick'),
      timer ? stopped('wx') : trouble ? { id: 'wx', runs: runs(now - 80 * MIN, 30 * MIN, 24), days: days(now) } : half('wx'),
      timer ? stopped('places') : { id: 'places', runs: runs(now, 30 * MIN, 24).map((r, i) => (i % 5 ? { ...r, st: 'idle' } : r)), days: days(now) },
      { ...daily('nightly'), x: { ledgercheck: 9.3, sharesweep: 9.3, islandprune: 9.3, ledgerprune: 9.3, tombprune: 9.3 } },
      trouble ? daily('backup', { bad: (i) => i < 2 }) : { id: 'backup', runs: [], days: [] },
      half('health', { gh: true }), half('its-health', { gh: true }), { ...half('places-pull', { gh: true }), x: { syncedAt: now - 12 * MIN } },
      daily('places-details', { gh: true }), daily('e2e-flake-hunt', { gh: true, bad: (i) => i === 3 }),
      { id: 'kalori-watch', runs: runs(now, 6 * H, 24, { gh: true }), days: days(now) },
      { id: 'kalori-scrape', runs: runs(now, 7 * D, 6, { gh: true }), days: [] },
      { id: 'pages', runs: [{ t: now - 4 * MIN, st: 'run', by: 'p', id: 4999 }, ...runs(now, 50 * MIN, 23, { gh: true, ms: 300_000 })], days: days(now) },
      { id: 'relay', runs: runs(now, 9 * H, 12, { gh: true, ms: 120_000 }), days: days(now) },
      trouble ? half('e2e-logic-full', { gh: true }) : half('e2e-logic-full', { gh: true, bad: (i) => i === 3 }),
      { id: 'dispatch', runs: runs(now, 30 * MIN, 24).map((r) => ({ ...r, c: 'app' })), days: days(now) },
      { id: 'gym', runs: runs(now, 15 * MIN, 24).map((r, i) => (i % 3 ? r : { ...r, st: 'idle' })), days: days(now) }
    ],
    alerts: trouble ? [{ n: 42, title: 'Relay alert: no record backup in 30 h', label: 'alert', at: now - 5 * H }] : [],
    usage: usage(now, u)
  };
}

/** A phone paired as `who`, /jobs answering `body()` (`'offline'`: unreachable); the gym bot's /status answered (its
 *  Bots row: its words all English; healthy, or `gym`'s verdict), the ITS Worker refused (its tab isn't this spec's:
 *  its row unknown, never counted). */
async function phone(page: Page, context: BrowserContext, o: { who?: Who; trouble?: boolean; ins?: typeof IPHONE; held?: boolean; tab?: string; usage?: Usage; gym?: 'degraded' | 'broken'; timer?: boolean } = {}) {
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
    // (the record over the rows-read limit: unavailable, the usage still said)
    if (o.usage === 'over') return route.fulfill({ status: 503, contentType: 'application/json', headers: cors, body: JSON.stringify({ ok: false, error: 'unavailable', usage: usage(rec.now(), 'over') }) });
    return route.fulfill({ status: 200, contentType: 'application/json', headers: cors, body: JSON.stringify(jobs(rec.now(), o.trouble, o.usage, o.timer)) });
  });
  await page.route(KALORI, (route) => route.fulfill({ status: 200, contentType: 'text/plain; charset=utf-8', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(kaloriStatus(rec.now(), o.held)) }));
  await page.route(/its-bot|gym-bot/, (route) => route.abort('blockedbyclient'));
  await page.route(GYM_STATUS, (route) => route.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(gymStatus(rec.now(), o.gym)) }));
  await page.goto('');
  await islandUp(page);
  return { rec, seen, offline: (v: boolean) => void (state = v ? 'offline' : 'up') };
}

/** The gym bot's /status: healthy, degraded (a program failing: amber) or broken (the site down for hours: red, 「!」). */
function gymStatus(now: number, v?: 'degraded' | 'broken') {
  const s = statusPayload(now);
  if (v === 'degraded') return s;
  if (v === 'broken') return { ...s, verdict: 'broken', reasons: ['no_alarm'], lastOk: now - 8 * H };
  return { ...s, verdict: 'healthy', reasons: [], lastError: null, checks: s.checks.map((c) => ({ ...c, r: { training: 'ok', pilates: 'ok' } })) };
}

const sheet = (p: Page) => p.locator('dialog[open] [data-bots]');
const tab = (p: Page) => p.locator('dialog[open] [data-bots-tab="jobs"]');
const page_ = (p: Page) => sheet(p).locator('[data-jobs-page]');
const row = (p: Page, id: string) => page_(p).locator(`[data-jobs-row="${id}"]`);
const group = (p: Page, id: string) => page_(p).locator(`[data-jobs-group="${id}"]`);
/** A folded section unfolded by a tap. */
async function unfold(p: Page, id: string, how: Tap) {
  const b = group(p, id).locator('[data-jobs-fold]');
  await expect(b).toHaveAttribute('aria-expanded', 'false');
  await b[how]();
  await expect(b).toHaveAttribute('aria-expanded', 'true');
}

/** English only (lang="en"; no kana or kanji in its text or its names, the app in Japanese) and nothing cut off: every
 *  row's and section's text, the card's, the detail's, within its box (scrollWidth ≤ clientWidth: no ellipsis, no
 *  spill) and inside the page's width (English runs longer than the Japanese it replaced). */
async function englishFits(page: Page) {
  await expect(page_(page)).toHaveAttribute('lang', 'en');
  const r = await page_(page).evaluate((root) => {
    const ja = /[\u3040-\u30ff\u4e00-\u9fff]/;
    const right = root.getBoundingClientRect().right;
    const named = [...root.querySelectorAll('[aria-label], [title]')].map((e) => `${e.getAttribute('aria-label') ?? ''} ${e.getAttribute('title') ?? ''}`);
    const boxes = [...root.querySelectorAll<HTMLElement>('.name, .age, .l2 > span, .sec-label, .sec-label > span, h3, .cf-note, .sum, [data-bots-word], [data-bots-asof], [data-bots-stale], [data-bots-say], dt, dd, .about, .say, .lbl, .run, .run a, .btn, [data-jobs-reason]')];
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

    test('the rightmost tab; trouble: Failing with the tab’s 「!」, the sentence says what to do; Needs you: the alert, then red, then amber; homes count what moved; folds', async ({ page, context }, info) => {
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
      await expect(card.locator('[data-bots-say]')).toHaveText('Read the open alert. 2 more below.');
      // Needs you: the person's step (the alert, its link) first, then the failing row, then the late one
      const needs = group(page, 'needs');
      await expect(needs.locator('[data-jobs-step="a42"] [data-jobs-reason]')).toHaveText('Alert: Relay alert: no record backup in 30 h (opened 5 h ago)');
      await expect(needs.locator('[data-jobs-link="42"]')).toHaveAttribute('href', 'https://github.com/huangwaylon/fitness/issues/42');
      await expect(needs.locator('[data-jobs-row]')).toHaveCount(2);
      await expect(needs.locator('[data-jobs-row]').first()).toHaveAttribute('data-jobs-row', 'backup');
      await expect(needs.locator('[data-jobs-row]').last()).toHaveAttribute('data-jobs-row', 'wx');
      // the sections in order, a home counting the row that moved up; the bots, then their jobs; no くわしく (GitHub read fine)
      await expect(page_(page).locator('[data-jobs-group] > .sec-label')).toHaveText(['Needs you', 'Bots', 'Data for the app· 1 above', 'Your data· 1 above', 'Behind the scenes', 'Releases', /^Daily limits \(Cloudflare\)Resets in/]);
      await expect(group(page, 'bots').locator('[data-jobs-svc], [data-jobs-row]')).toHaveCount(4);
      await expect(group(page, 'bots').locator('[data-jobs-svc="gym"] + [data-jobs-row="gym"] + [data-jobs-svc="its"] + [data-jobs-row="its-health"]')).toHaveCount(1);
      await expect(group(page, 'data').locator('[data-jobs-row]')).toHaveCount(4);
      await expect(group(page, 'yours').locator('[data-jobs-row]')).toHaveCount(1);
      await expect(page_(page).locator('[data-jobs-row="kalori-watch"]')).toHaveCount(0);
      await expect(page_(page).locator('[data-jobs-more]')).toHaveCount(0);
      // folded while healthy: a summary row each, no rows
      await expect(group(page, 'behind')).toHaveAttribute('data-jobs-folded', 'true');
      await expect(group(page, 'behind').locator('[data-jobs-fold]')).toHaveAccessibleName('Behind the scenes: All 3 OK');
      await expect(group(page, 'ship').locator('[data-jobs-fold-sum]')).toHaveText('All 4 OK');
      await expect(group(page, 'behind').locator('[data-jobs-row]')).toHaveCount(0);
      // a row: its dot, name, age, cadence and why (when not OK), its 24 cells, the newest at the right
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
      expect(seen.auth.every((a) => a === `Bearer ${KEY_OF.A}`)).toBe(true);
      await settle(page);
      await shot(page, `jobs-trouble-${info.project.name}-${h}`);
      await noOverlaps(page, { insets: ins });
      await englishFits(page);
      // a fold opened: its rows, OK ones without a word
      await unfold(page, 'behind', how);
      await expect(group(page, 'behind').locator('[data-jobs-row]')).toHaveCount(3);
      await expect(row(page, 'tick')).toHaveAttribute('data-jobs-tone', 'good');
      await expect(row(page, 'tick').locator('[data-jobs-why-word]')).toHaveCount(0);
      await unfold(page, 'ship', how);
      await expect(row(page, 'pages')).toHaveAttribute('data-jobs-why', 'running');
      await expect(row(page, 'relay').locator('.name')).toHaveText('Relay deploy');
      // the limits, last, all under 60 %
      await expect(page_(page).locator('[data-jobs-cf][data-jobs-tone="good"]')).toHaveCount(4);
      await group(page, 'cf').scrollIntoViewIfNeeded();
      await settle(page);
      await shot(page, `jobs-bottom-${info.project.name}-${h}`);
      await noOverlaps(page, { insets: ins });
      await englishFits(page);
    });

    test('a tap unfolds a row’s detail (one at a time): what it does, 前回, 14 days, the last runs (GitHub’s links); ジムのタブを開く', async ({ page, context }, info) => {
      const how = howOf(info.project.name);
      await phone(page, context, { ins });
      await openJobs(page, how);
      await expect(page_(page).locator('[data-jobs-verdict="healthy"] [data-bots-say]')).toHaveText('All 15 OK. Nothing to do. First run to come: Backup.');
      await expect(tab(page)).toHaveAccessibleName('Jobs, healthy');
      await expect(tab(page)).not.toHaveAttribute('data-look');
      await expect(group(page, 'needs')).toHaveCount(0);
      await expect(page_(page).locator('[data-jobs-above]')).toHaveCount(0);
      await settle(page);
      await shot(page, `jobs-healthy-${info.project.name}-${h}`);
      await group(page, 'ship').scrollIntoViewIfNeeded();
      await settle(page);
      await shot(page, `jobs-healthy-folds-${info.project.name}-${h}`);
      await noOverlaps(page, { insets: ins });
      await englishFits(page);
      // fine now: Recovered (good, its row only), First run at its time (neutral), neither in Needs you
      await unfold(page, 'ship', how);
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
      // the bots' rows: Gym bot (its status, English), ITS bot (refused here: unknown)
      const svc = page_(page).locator('[data-jobs-svc="gym"]');
      await expect(svc).toHaveAttribute('data-gym-verdict', 'healthy');
      await expect(svc.locator('button').first()).toHaveAccessibleName(/^Gym bot, Healthy, as of \d+:\d\d$/);
      await expect(page_(page).locator('[data-jobs-svc="its"] [data-bots-word]')).toHaveText('Unknown');
      await svc.locator('button').first()[how]();
      await expect(flake.locator('[data-jobs-detail]')).toHaveCount(0);
      await expect(svc.locator('[data-gym-strip] [data-gym-cell]')).toHaveCount(24);
      await expect(svc.locator('[data-gym-fact="mode"] dd')).toHaveText('Bot');
      await svc.scrollIntoViewIfNeeded();
      await settle(page);
      await shot(page, `jobs-detail-svc-${info.project.name}-${h}`);
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

test('offline: the last copy this phone read, under one quiet note, its time (not Updating); back online it reads again', async ({ page, context }) => {
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
  await expect(page_(page).locator('[data-jobs-error][data-offline]')).toContainText('Offline: showing the last copy');
  await expect(page_(page).locator('[data-jobs-verdict="failing"] [data-bots-stale]')).toHaveCount(0);
  await expect(page_(page).locator('[data-jobs-verdict="failing"] [data-bots-asof]')).toBeVisible();
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

test('Cloudflare limits: a row per limit (share, bar), always last; red and amber copied into Needs you with the tab’s 「!」, the sentence’s 100 % stop; a tap unfolds what it is and who used it', async ({ page, context }, info) => {
  const how = howOf(info.project.name);
  await phone(page, context, { usage: 'tight' });
  await openJobs(page, how);
  const sec = group(page, 'cf');
  await expect(page_(page).locator('[data-jobs-group] > .sec-label').last()).toHaveText(/^Daily limits \(Cloudflare\)/);
  await expect(sec.locator('[data-jobs-cf-resets]')).toHaveText(/^Resets in \d+ (h|min)$/);
  await expect(sec.locator('[data-jobs-cf]')).toHaveCount(4);
  await expect(sec.locator('[data-jobs-cf] .name')).toHaveText(['DO rows read', 'DO rows written', 'DO requests', 'Worker requests']);
  const tones = await sec.locator('[data-jobs-cf]').evaluateAll((els) => els.map((e) => e.getAttribute('data-jobs-tone')));
  expect(tones).toEqual(['bad', 'warn', 'good', 'good']);
  // (Needs you: red, then amber)
  await expect(group(page, 'needs').locator('[data-jobs-cf]')).toHaveCount(2);
  await expect(group(page, 'needs').locator('[data-jobs-cf]').first()).toHaveAttribute('data-jobs-cf', 'doRead');
  const read = group(page, 'needs').locator('[data-jobs-cf="doRead"]');
  await expect(read.locator('[data-jobs-cf-of]')).toHaveText('4.6M / 5M92%');
  await expect(read.locator('button')).toHaveAccessibleName('DO rows read, 92% used, 4.6M / 5M');
  await expect(read.locator('[data-jobs-cf-kind]')).toHaveText('Cloudflare daily limit');
  await expect(sec.locator('[data-jobs-cf-kind]')).toHaveCount(0);
  await expect(tab(page)).toHaveAttribute('data-look', '');
  await expect(page_(page).locator('[data-jobs-verdict="failing"] [data-bots-say]')).toHaveText('Cut Cloudflare use: DO rows read at 92%; the app stops at 100%. 1 more below.');
  await settle(page);
  await shot(page, `jobs-cf-amber-${info.project.name}`);
  await read.locator('button')[how]();
  const d = read.locator('[data-jobs-detail]');
  await expect(d.locator('.about')).toHaveText("Rows the server's database reads today. The app stops at 100%, until the reset at 9:00. Shared by every Worker on the account.");
  await expect(d.locator('[data-jobs-cf-by]')).toHaveCount(3);
  await expect(d.locator('[data-jobs-cf-by="test/IslandStore"] dd')).toHaveText('2.53M · 55%');
  await expect(d.locator('[data-jobs-cf-read] dd')).toHaveText('4 min ago');
  // (the copy and the row at home unfold apart)
  await expect(sec.locator('[data-jobs-detail]')).toHaveCount(0);
  await settle(page);
  await shot(page, `jobs-cf-tight-${info.project.name}`);
  await noOverlaps(page, { insets: IPHONE });
  await englishFits(page);
});

test('a bot failing: the Gym bot in Needs you, its home counting it, the verdict and the tab’s 「!」 with it', async ({ page, context }, info) => {
  const how = howOf(info.project.name);
  await phone(page, context, { gym: 'broken' });
  await openJobs(page, how);
  await expect(page_(page).locator('[data-jobs-verdict="failing"] [data-bots-say]')).toHaveText('Needs you: Gym bot, see below.');
  await expect(tab(page)).toHaveAttribute('data-tab-status', 'bad');
  await expect(tab(page)).toHaveAttribute('data-look', '');
  await expect(group(page, 'needs').locator('[data-jobs-svc="gym"]')).toHaveAttribute('data-jobs-tone', 'bad');
  await expect(group(page, 'bots').locator('[data-jobs-above]')).toHaveText('· 1 above');
  await expect(group(page, 'bots').locator('[data-jobs-svc]')).toHaveCount(1);
  await settle(page);
  await shot(page, `jobs-bot-failing-${info.project.name}`);
  await noOverlaps(page, { insets: IPHONE });
  await englishFits(page);
});

test('the server timer stopped: its row in Needs you says what’s paused; Weather and Place sorting wait on it, not failures of their own', async ({ page, context }, info) => {
  const how = howOf(info.project.name);
  await phone(page, context, { timer: true });
  await openJobs(page, how);
  await expect(page_(page).locator('[data-jobs-verdict="failing"] [data-bots-say]')).toHaveText('Check Server timer: stopped or failing.');
  const tick = group(page, 'needs').locator('[data-jobs-row="tick"]');
  await expect(tick.locator('[data-jobs-why-word]')).toHaveText('Stopped');
  await expect(tick.locator('[data-jobs-pauses]')).toHaveText('Weather and Place sorting paused');
  await expect(group(page, 'needs').locator('[data-jobs-row]')).toHaveCount(1);
  for (const id of ['wx', 'places']) {
    await expect(group(page, 'data').locator(`[data-jobs-row="${id}"]`)).toHaveAttribute('data-jobs-tone', 'idle');
    await expect(row(page, id).locator('[data-jobs-why-word]')).toHaveText('Waiting on Server timer');
  }
  await expect(group(page, 'behind').locator('.sec-label')).toHaveText('Behind the scenes· 1 above');
  await expect(group(page, 'behind').locator('[data-jobs-fold-sum]')).toHaveText('All 2 OK');
  await settle(page);
  await shot(page, `jobs-timer-stopped-${info.project.name}`);
  await noOverlaps(page, { insets: IPHONE });
  await englishFits(page);
});

test('Cloudflare limits unavailable (no token): one quiet line, last; the verdict unmoved', async ({ page, context }, info) => {
  const how = howOf(info.project.name);
  await phone(page, context, { usage: 'none' });
  await openJobs(page, how);
  const sec = group(page, 'cf');
  await expect(page_(page).locator('[data-jobs-group] > .sec-label').last()).toHaveText('Daily limits (Cloudflare)');
  await expect(sec.locator('[data-jobs-cf]')).toHaveCount(0);
  await expect(sec.locator('[data-jobs-cf-note]')).toHaveText('Usage unavailable (no_token).');
  await expect(tab(page)).not.toHaveAttribute('data-look');
  await englishFits(page);
});

test('an outage (the record over the rows-read limit: /jobs 503): LoadError as before, and the limits from the refusal, rows read at 100%', async ({ page, context }, info) => {
  const how = howOf(info.project.name);
  await phone(page, context, { usage: 'over' });
  await fromMenu(page, 'bots', how);
  await tab(page)[how]();
  await expect(sheet(page)).toHaveAttribute('data-tab', 'jobs');
  await expect(page_(page).locator('[data-jobs-error]')).toBeVisible();
  await expect(page_(page).locator('[data-jobs-row]')).toHaveCount(0);
  const sec = group(page, 'cf');
  await expect(sec.locator('[data-jobs-cf]')).toHaveCount(4);
  await expect(sec.locator('[data-jobs-cf="doRead"]')).toHaveAttribute('data-jobs-tone', 'bad');
  await expect(sec.locator('[data-jobs-cf="doRead"] [data-jobs-cf-pct]')).toHaveText('100%');
  await settle(page);
  await shot(page, `jobs-cf-outage-${info.project.name}`);
  await noOverlaps(page, { insets: IPHONE });
  await englishFits(page);
});

test('the guest: the tab and every row, read with the guest’s own key', async ({ page, context }) => {
  const how = howOf(test.info().project.name);
  const { seen } = await phone(page, context, { who: 'G' });
  await openJobs(page, how);
  // (Behind the scenes and Releases folded: their 7 under their summaries)
  await expect(page_(page).locator('[data-jobs-row]')).toHaveCount(9);
  await expect(page_(page).locator('[data-jobs-fold-sum]')).toHaveText(['All 3 OK', 'All 4 OK']);
  expect(seen.n).toBeGreaterThan(0);
  expect(seen.auth.every((a) => a === `Bearer ${KEY_OF.G}`)).toBe(true);
});

test('Chain menus (the Kalori scraper) held: in Needs you with the tab’s 「!」, its step and Open the PR first; its detail: the sentence, 8 weeks, the last change, its links', async ({ page, context }, info) => {
  const how = howOf(info.project.name);
  await phone(page, context, { held: true });
  await openJobs(page, how);
  await expect(tab(page)).toHaveAttribute('data-look', '');
  await expect(page_(page).locator('[data-jobs-verdict="trouble"] [data-bots-say]')).toHaveText("Merge Chain menus' PR.");
  const menu = row(page, 'kalori-scrape');
  await expect(group(page, 'needs').locator('[data-jobs-row="kalori-scrape"]')).toHaveCount(1);
  await expect(menu).toHaveAttribute('data-jobs-tone', 'warn');
  await expect(menu.locator('[data-jobs-why-word]')).toHaveText('Held: merge the PR');
  await expect(menu.locator('.name')).toHaveText('Chain menus');
  const step = group(page, 'needs').locator('[data-jobs-step]');
  await expect(step.locator('[data-jobs-reason]')).toHaveText(['Check the PR and merge it by hand if it looks right.']);
  await expect(step.locator('[data-jobs-link="pr"]')).toHaveAttribute('href', PR);
  await expect(group(page, 'needs').locator('[data-jobs-step] + [data-jobs-row="kalori-scrape"]')).toHaveCount(1);
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

test('a session that kept メニュー’s tab opens Jobs, Chain menus unfolded (fine: no 「!」, the workflow’s link only)', async ({ page, context }) => {
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
