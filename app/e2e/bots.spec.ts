// ボット (docs/bots.md): the menu's ボット, a member's only, right above 設定, with the worst bot's 「!」 while one
// needs a person; its sheet: the bottom tabs (a tablist: ジム left, 保養所, 定期処理 right), each tab's status dot
// (data-tab-status, data-look; 「ジム、順調」), the dots kept across a reload, ← → to move between them,
// the tab remembered for the app's session (ジム, the leftmost, the first time and after the app was closed), only the shown page mounted (it reads while shown, nothing
// reads once its tab is left or the sheet is closed), and 保養所's sticky 保存 bar over the tabs. Both Workers mocked (its.ts, a gym
// status here) at the record's pinned time; the pages' own content is its.spec's and gymbot.spec's, the guest's
// menu hud-menu.spec's; 定期処理 here a healthy /jobs (its page, and メニュー once its own tab, are jobs.spec's), the
// Kalori status.json it reads beside refused.
import { expect, test, type BrowserContext, type Page } from './fixtures.ts';
import { fromMenu, unfoldMenu } from './hud.ts';
import { islandUp } from './island.ts';
import { newRecord } from './record.ts';
import { ORIGIN, cors, payload } from './its.ts';
import { RELAY } from './relay.ts';

const GYM = 'https://gym-bot.island-fund-relay.workers.dev';
const KALORI = 'https://raw.githubusercontent.com/huangwaylon/fitness/kalori-status/status.json';
const MIN = 60_000;

type Jobs = 'up' | 'offline';

/** A member's phone; the ITS Worker answers its example (a hold waiting: 要対応; `its: false`: no answer), the gym bot
 *  `gymVerdict` (故障 by default; 不調: the site failing), the relay's /jobs one healthy row (`setJobs`: offline). */
async function phone(page: Page, context: BrowserContext, gymVerdict: 'broken' | 'failing' | 'healthy' = 'broken', o: { jobs?: Jobs; its?: boolean; gym?: boolean | 'hang' } = {}) {
  const rec = newRecord();
  await context.addInitScript(() => localStorage.setItem('e2e.render', 'none'));
  await rec.pair(context, 'A');
  const calls = { its: 0, gym: 0, jobs: 0 };
  let jobs: Jobs = o.jobs ?? 'up';
  await page.route(KALORI, (route) => route.abort('blockedbyclient'));
  await page.route(`${RELAY}/jobs`, (route) => {
    const req = route.request();
    if (jobs === 'offline') return route.abort('internetdisconnected');
    const h = { 'Access-Control-Allow-Origin': req.headers().origin ?? '*', 'Access-Control-Allow-Headers': 'Authorization, X-Request-Id' };
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: h });
    calls.jobs++;
    const now = rec.now();
    const body = { ok: true, v: 1, now, ext: { at: now, by: 'app', err: null }, jobs: [{ id: 'tick', runs: [{ t: now - 3 * MIN, st: 'ok' }], days: [] }], alerts: [] };
    return route.fulfill({ status: 200, contentType: 'application/json', headers: h, body: JSON.stringify(body) });
  });
  await page.route(`${ORIGIN}/**`, (route) => {
    if (o.its === false) return route.abort();
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors() });
    calls.its++;
    return route.fulfill({ status: 200, contentType: 'application/json', headers: cors(), body: JSON.stringify(payload(rec.now())) });
  });
  let gymUp: boolean | 'hang' = o.gym ?? true;
  await page.route(`${GYM}/**`, (route) => {
    const now = rec.now();
    if (gymUp === 'hang') return void setTimeout(() => void route.abort().catch(() => {}), 4000); // fetchPublic's timeout first
    if (!gymUp) return route.abort('internetdisconnected');
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Authorization' } });
    if (new URL(route.request().url()).pathname !== '/status') return route.fulfill({ status: 404, headers: { 'Access-Control-Allow-Origin': '*' }, body: '' });
    calls.gym++;
    const body = {
      v: 1, now, mode: 'bot', sha: 'abc1234', verdict: gymVerdict, reasons: gymVerdict === 'failing' ? ['site_failing'] : [], intervalMin: 15, paused: false, nextCheck: now + 600_000, lastCheck: now - 300_000,
      lastOk: now - 300_000, lastError: null, failures: gymVerdict === 'healthy' ? 0 : 3, siteDownSent: false, retryPending: false, checks: [], line: {}
    };
    return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(body) });
  });
  await page.goto('');
  await islandUp(page);
  return {
    calls, now: rec.now, sheet: page.locator('dialog[open] [data-bots]'), tab: (id: 'its' | 'gym' | 'jobs') => page.locator(`dialog[open] [data-bots-tab="${id}"]`),
    setJobs: (j: Jobs) => void (jobs = j), setGym: (up: boolean | 'hang') => void (gymUp = up)
  };
}

test('the menu’s ボット, right above やること (then 設定), 「!」 while a bot needs a person; the sheet’s tabs: a tablist, status dots, 44px, ← →', async ({ page, context }) => {
  const { calls, sheet, tab } = await phone(page, context);
  await unfoldMenu(page);
  const pill = page.locator('[data-hud-bots]');
  await expect(pill.locator('.lbl')).toHaveText(/^ボット/);
  await expect(pill.locator('[data-hud-bots-dot]')).toBeVisible();
  await expect(pill.locator('[data-hud-bots-dot]')).toHaveAttribute('data-tone', 'bad'); // ジム broken: coral
  await expect(pill).toHaveAccessibleName('ボット、要対応');
  await expect(pill.locator('img')).toHaveCount(0); // a drawn icon, no game sprite
  // (the default order since やること: … ボット, やること, 設定)
  const [b, s] = [(await pill.boundingBox())!, (await page.locator('[data-hud-todo]').boundingBox())!];
  expect(b.y + b.height).toBeLessThan(s.y);
  expect(b.y + b.height + 12).toBeGreaterThan(s.y);
  expect(calls.its).toBe(1);

  await pill.click();
  await expect(sheet).toHaveAttribute('data-tab', 'gym');
  await expect(sheet.locator('[data-gym-verdict="broken"]')).toBeVisible();
  const list = page.locator('dialog[open] [role="tablist"]');
  await expect(list).toHaveAccessibleName('ボット');
  await expect(list.getByRole('tab')).toHaveText([/ジム/, /保養所/, /Jobs/]);
  await expect(tab('gym')).toHaveAttribute('aria-selected', 'true');
  await expect(tab('its')).toHaveAttribute('aria-selected', 'false');
  await expect(tab('gym')).toHaveAttribute('aria-controls', 'bots-panel');
  await expect(sheet).toHaveAttribute('role', 'tabpanel');
  await expect(sheet).toHaveAttribute('aria-labelledby', 'bots-tab-gym');
  // the gym bot broken (coral 「!」), 保養所 要対応 (a hold waiting) (yuzu 「!」; read as the menu unfolded, its tab
  // not shown, not read again as the sheet opened: the minute's floor); the menu read every bot, and the shown page,
  // read seconds ago, doesn't read ジム again
  await expect(tab('gym')).toHaveAttribute('data-tab-status', 'bad');
  await expect(tab('gym')).toHaveAttribute('data-look', '');
  await expect(tab('its')).toHaveAttribute('data-tab-status', 'warn');
  await expect(tab('its')).toHaveAttribute('data-look', '');
  await expect(tab('gym')).toHaveAccessibleName('ジム、故障、要対応');
  await expect(tab('its')).toHaveAccessibleName('保養所、要対応');
  expect([calls.its, calls.gym, calls.jobs]).toEqual([1, 1, 1]);
  for (const id of ['its', 'gym', 'jobs'] as const) {
    const box = (await tab(id).boundingBox())!;
    expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(44);
  }
  // ジム · 保養所 · Jobs, left to right; Jobs' rows healthy, but its verdict weighs the bots' too: the worst (ジム
  // broken), its 「!」
  const [l, m, r] = [(await tab('gym').boundingBox())!, (await tab('its').boundingBox())!, (await tab('jobs').boundingBox())!];
  expect(l.x).toBeLessThan(m.x);
  expect(m.x).toBeLessThan(r.x);
  await expect(tab('jobs')).toHaveAccessibleName('Jobs, failing, needs you');
  await expect(tab('jobs')).toHaveAttribute('data-tab-status', 'bad');
  await expect(tab('jobs')).toHaveAttribute('data-look', '');
  await expect(tab('gym').locator('[data-dot="bad"][data-look]')).toHaveCount(1);
  // the page's head: its dot says the word (the status itself is Jobs')
  await expect(sheet.locator('[data-gym-page] [data-bots-dot]')).toHaveAccessibleName('ジムの状態：故障。Jobsで詳しく見る');
  // the keyboard: → moves the focus, Enter picks; the focus stays on the tab picked
  await tab('gym').focus();
  await page.keyboard.press('ArrowRight');
  await expect(tab('its')).toBeFocused();
  await expect(sheet).toHaveAttribute('data-tab', 'gym');
  await page.keyboard.press('Enter');
  await expect(sheet).toHaveAttribute('data-tab', 'its');
  await expect(sheet.locator('[data-its-verdict]')).toBeVisible();
  await expect(sheet.locator('[data-gym-page]')).toHaveCount(0);
  await expect(tab('its')).toBeFocused();
  await expect(tab('its')).toHaveAttribute('tabindex', '0');
  await expect(tab('gym')).toHaveAttribute('tabindex', '-1');
  await page.keyboard.press('ArrowLeft');
  await expect(tab('gym')).toBeFocused();
});

test('ジム the first time; the tab shown last opens the next time, after a reload too, but a new launch opens ジム; the tab left, or the sheet closed, reads no more', async ({ page, context }) => {
  const { calls, sheet, tab } = await phone(page, context, 'healthy');
  await fromMenu(page, 'bots');
  await expect(sheet).toHaveAttribute('data-tab', 'gym');
  await expect(sheet.locator('[data-gym-verdict="healthy"]')).toBeVisible();
  await expect(tab('gym')).toHaveAttribute('data-tab-status', 'good');
  await tab('its').click();
  await expect(sheet.locator('[data-its-verdict]')).toBeVisible();
  // the tab left: ジム's page gone, the phone shown again (what makes a shown page read) asks only 保養所
  const [gymReads, itsReads] = [calls.gym, calls.its];
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await expect.poll(() => calls.its).toBeGreaterThan(itsReads);
  expect(calls.gym).toBe(gymReads);
  await page.locator('dialog[open] .navbar button.nav.close').click();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  // closed: the page shown again reads nothing: neither page is mounted
  const seen = { ...calls };
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await expect(page.locator('[data-gym-page], [data-its-page]')).toHaveCount(0);
  expect(calls).toEqual(seen);

  await fromMenu(page, 'bots');
  await expect(sheet).toHaveAttribute('data-tab', 'its');
  await page.reload();
  await islandUp(page);
  await fromMenu(page, 'bots');
  await expect(sheet).toHaveAttribute('data-tab', 'its');
  await expect(tab('its')).toHaveAttribute('aria-selected', 'true');
  await expect(sheet.locator('[data-its-page]')).toBeVisible();
  // a new launch (the app swipe-closed and opened again: a new page, its own sessionStorage): ジム, the leftmost
  const fresh = await context.newPage();
  await fresh.goto(page.url());
  await islandUp(fresh);
  await fromMenu(fresh, 'bots');
  await expect(fresh.locator('dialog[open] [data-bots]')).toHaveAttribute('data-tab', 'gym');
  await fresh.close();
});

test('保養所’s 保存 bar sits over the tabs, not under them; a tab switch with the draft asks first', async ({ page, context }) => {
  const { sheet, tab } = await phone(page, context);
  await fromMenu(page, 'bots');
  await tab('its').click();
  const its = sheet.locator('[data-its-page]');
  await its.locator('[data-its-fold="detail"] > summary').click();
  await its.locator('[data-its-guests="3"]').click();
  const bar = its.locator('[data-its-save-bar]');
  await expect(bar).toBeVisible();
  const [s, t] = [(await its.locator('[data-its-save]').boundingBox())!, (await page.locator('dialog[open] [role="tablist"]').boundingBox())!];
  expect(s.y + s.height).toBeLessThanOrEqual(t.y);
  expect(await page.evaluate(([x, y]) => !!document.elementFromPoint(x, y)?.closest('[data-its-save]'), [s.x + s.width / 2, s.y + s.height / 2])).toBe(true);
  await tab('gym').click();
  const ask = page.locator('dialog[open] [data-discard-ask]');
  await expect(ask).toContainText('入力した内容を破棄しますか？');
  await page.locator('dialog[open] [data-discard-keep]').click();
  await expect(sheet).toHaveAttribute('data-tab', 'its');
  await expect(its.locator('[data-its-guests="3"]')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('dialog[open] .navbar button.nav.close').click();
  await expect(ask).toBeVisible();
  await page.locator('dialog[open] [data-discard-yes]').click();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
});

test('ジム hung (no answer): 「読み込めませんでした（時間切れ）」 after the timeout, not 更新中 for good; a retry recovers', async ({ page, context }) => {
  // fetchPublic's 20 s made 1.5 s (only a 20 s timeout: the bots' reads); the mock lets go after 4 s (an abort:
  // 「オフライン」 if the timeout hadn't come first), as Playwright's WebKit settles an aborted fetch only once its route does
  await context.addInitScript(() => {
    const orig = AbortSignal.timeout.bind(AbortSignal);
    AbortSignal.timeout = (ms: number) => orig(ms === 20_000 ? 1500 : ms);
  });
  const { sheet, tab, setGym } = await phone(page, context, 'healthy', { gym: 'hang', its: false });
  await fromMenu(page, 'bots');
  await expect(sheet).toHaveAttribute('data-tab', 'gym');
  const err = sheet.locator('[data-gym-error]');
  await expect(err).toContainText('読み込めませんでした（時間切れ）', { timeout: 10_000 });
  await expect(sheet.locator('[data-gym-page]')).toHaveAttribute('aria-busy', 'false');
  setGym(true);
  await err.getByRole('button', { name: 'もう一度' }).click();
  await expect(err).toHaveCount(0);
  await expect(sheet.locator('[data-gym-verdict="healthy"]')).toBeVisible();
  await expect(tab('gym')).toHaveAttribute('data-tab-status', 'good');
});

test('定期処理 reads while shown only: the tab left, or the sheet closed, it reads no more', async ({ page, context }) => {
  const { sheet, tab, calls } = await phone(page, context, 'healthy');
  await fromMenu(page, 'bots');
  await tab('jobs').click();
  await expect(sheet).toHaveAttribute('data-tab', 'jobs');
  const k = sheet.locator('[data-jobs-page]');
  // (its verdict weighs the bots' too: 保養所's hold)
  await expect(k.locator('[data-jobs-verdict]')).toBeVisible();
  const shown = () => page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  // shown: the phone coming back reads it again
  let n = calls.jobs;
  await shown();
  await expect.poll(() => calls.jobs).toBeGreaterThan(n);
  // the tab left: its page gone, nothing reads it
  await tab('gym').click();
  await expect(sheet.locator('[data-jobs-page]')).toHaveCount(0);
  await expect(sheet.locator('[data-gym-verdict]')).toBeVisible();
  // (its read done: the phone coming back doesn't restart one under 5 s old, poll.svelte.ts FRESH_MS)
  await expect(sheet.locator('[data-gym-page]')).toHaveAttribute('aria-busy', 'false');
  n = calls.jobs;
  const g = calls.gym;
  await shown();
  await expect.poll(() => calls.gym).toBeGreaterThan(g); // (ジム, shown, read: the event went through)
  expect(calls.jobs).toBe(n);
  // back on it, then the sheet closed: nothing reads
  await tab('jobs').click();
  await expect(k.locator('[data-jobs-verdict]')).toBeVisible();
  await page.locator('dialog[open] .navbar button.nav.close').click();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await expect(page.locator('[data-jobs-page]')).toHaveCount(0);
  n = calls.jobs;
  await shown();
  await expect(page.locator('[data-jobs-page], [data-gym-page], [data-its-page]')).toHaveCount(0);
  expect(calls.jobs).toBe(n);
});

test('the menu’s 「!」 from ジム alone (保養所 unanswered, 定期処理 healthy); none, and no green one, while every bot is fine', async ({ page, context }) => {
  await phone(page, context, 'broken', { its: false });
  await unfoldMenu(page);
  const dot = page.locator('[data-hud-bots] [data-hud-bots-dot]');
  await expect(dot).toHaveAttribute('data-tone', 'bad');
  await expect(dot.locator('[data-look]')).toHaveCount(1);
});

test('ジム 不調 from the site failing: no 「!」 while the bot retries on its own (the menu, the tab), its coral dot all the same', async ({ page, context }) => {
  const { calls, sheet, tab } = await phone(page, context, 'failing', { its: false });
  await unfoldMenu(page);
  await expect.poll(() => calls.gym + calls.jobs).toBe(2);
  await expect(page.locator('[data-hud-bots]')).toHaveAccessibleName('ボット');
  await expect(page.locator('[data-hud-bots-dot]')).toHaveCount(0);
  await page.locator('[data-hud-bots]').click();
  const dot = sheet.locator('[data-gym-page] [data-bots-dot]');
  await expect(dot).toHaveAttribute('data-gym-verdict', 'failing');
  await expect(dot.locator('[data-dot]')).toHaveAttribute('data-dot', 'bad');
  await expect(dot.locator('[data-look]')).toHaveCount(0);
  // 確認が必要: the sentence, then what to do (no act: nothing for a person yet)
  const alert = sheet.locator('[data-gym-alert]');
  await expect(alert.locator('[data-bots-act]')).toHaveCount(0);
  await expect(alert.locator('[data-gym-reason]')).toHaveText(['予約サイトの確認が3回続けて失敗しています。', '間隔をあけて自動で再試行します。長く続くときは予約サイトの変更を疑ってください。']);
  await expect(tab('gym')).toHaveAttribute('data-tab-status', 'bad');
  await expect(tab('gym')).not.toHaveAttribute('data-look');
  await expect(tab('gym')).toHaveAccessibleName('ジム、不調');
  // Jobs' row: the word and the sentence, in English
  await dot.click();
  const row = sheet.locator('[data-jobs-svc="gym"]');
  await expect(row.locator('[data-bots-word]')).toHaveText('Failing');
  await expect(row.locator('[data-bots-say]')).toHaveText('The booking site failed 3 checks in a row.');
});

test('no 「!」 on the menu while every bot is fine', async ({ page, context }) => {
  const { calls } = await phone(page, context, 'healthy', { its: false });
  await unfoldMenu(page);
  await expect.poll(() => calls.gym + calls.jobs).toBe(2);
  await expect(page.locator('[data-hud-bots]')).toHaveAccessibleName('ボット');
  await expect(page.locator('[data-hud-bots-dot]')).toHaveCount(0);
});

test('the dots survive a reload: kept with the status, shown before any read, kept when the read fails', async ({ page, context }) => {
  const { sheet, tab, setGym, setJobs } = await phone(page, context, 'broken', { its: false });
  await fromMenu(page, 'bots');
  await expect(sheet.locator('[data-gym-verdict="broken"]')).toBeVisible();
  // (Jobs weighs ジム too)
  await expect(tab('jobs')).toHaveAttribute('data-tab-status', 'bad');
  await page.locator('dialog[open] .navbar button.nav.close').click();
  setGym(false);
  setJobs('offline');
  await page.reload();
  await islandUp(page);
  await unfoldMenu(page);
  await expect(page.locator('[data-hud-bots-dot]')).toHaveAttribute('data-tone', 'bad');
  await page.locator('[data-hud-bots]').click();
  await expect(sheet.locator('[data-gym-error][data-offline]')).toContainText('オフラインのため、前回の内容を表示しています');
  await expect(sheet.locator('[data-gym-verdict="broken"]')).toBeVisible();
  // (the read ended: the kept one, its dot dimmed)
  await expect(sheet.locator('[data-gym-page] [data-bots-dot]')).toHaveAccessibleName('ジムの状態：故障（古い）。Jobsで詳しく見る');
  await expect(tab('gym')).toHaveAttribute('data-tab-status', 'bad');
  await expect(tab('gym')).toHaveAttribute('data-stale', ''); // dimmed: the read failed
  await expect(tab('gym')).toHaveAccessibleName('ジム、故障、要対応（古い）');
  await expect(tab('jobs')).toHaveAttribute('data-tab-status', 'bad');
  // 保養所 never answered: hollow, 不明
  await expect(tab('its')).toHaveAttribute('data-tab-status', 'unknown');
  await expect(tab('its')).toHaveAccessibleName('保養所、不明');
});

test('while the sheet is open the tabs not shown are read again every 5 min (here 1.5 s: e2e.botsBg)', async ({ page, context }) => {
  await context.addInitScript(() => localStorage.setItem('e2e.botsBg', '1500'));
  const { calls, sheet } = await phone(page, context, 'healthy');
  await fromMenu(page, 'bots');
  await expect(sheet).toHaveAttribute('data-tab', 'gym');
  const k = calls.jobs, i = calls.its;
  await expect.poll(() => calls.jobs, { timeout: 8000 }).toBeGreaterThan(k + 1);
  expect(calls.its).toBeGreaterThan(i);
});
