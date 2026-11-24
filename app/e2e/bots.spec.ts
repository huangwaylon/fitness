// ボット (docs/bots.md): the menu's ボット, a member's only, right above 設定, with the worst bot's 「!」 while one
// needs a person; its sheet: the bottom tabs (a tablist: ジム left, 保養所, メニュー right), each tab's status dot
// (data-tab-status, data-look; 「ジム、順調」), the dots kept across a reload, ← → to move between them,
// the tab remembered for the app's session (ジム, the leftmost, the first time and after the app was closed), only the shown page mounted (it reads while shown, nothing
// reads once its tab is left or the sheet is closed), and 保養所's sticky 保存 bar over the tabs. Both Workers mocked (its.ts, a gym
// status here) at the record's pinned time; the pages' own content is its.spec's and gymbot.spec's, the guest's
// menu hud-menu.spec's. メニュー's page is here: the Kalori scraper's status.json (raw.githubusercontent.com, routed to a
// fixture: kaloriStatus) in each state — 順調, 保留 (only the gates that tripped) and 不調 with 確認が必要, ⋯'s links and the
// dots, 取得中, まだ, offline.
import { expect, test, type BrowserContext, type Page } from './fixtures.ts';
import { fromMenu, unfoldMenu } from './hud.ts';
import { islandUp } from './island.ts';
import { newRecord } from './record.ts';
import { ORIGIN, cors, payload } from './its.ts';

const GYM = 'https://gym-bot.island-fund-relay.workers.dev';
const KALORI = 'https://raw.githubusercontent.com/huangwaylon/fitness/kalori-status/status.json';
const MIN = 60_000, DAY = 86_400_000, WEEK = 7 * DAY;

/** status.json (its shape: the workflows' contract) at `now` (the pinned Wednesday noon): the week's run published
 *  this morning at 02:41 in 4 h 12 min, the next a week on; 8 weeks of history, one held. `over` replaces parts. */
function kaloriStatus(now: number, over: Record<string, unknown> = {}): Record<string, unknown> {
  const last = now - (9 * 60 + 19) * MIN, ms = (4 * 60 + 12) * MIN;
  return {
    v: 1, at: now - 3 * MIN, verdict: 'healthy', reasons: [], future: 'ignored',
    run: { id: 4242, url: 'https://github.com/huangwaylon/fitness/actions/runs/4242', event: 'schedule', round: 1, result: 'published', startedAt: last, endedAt: last + ms, shardsDone: 20, shardsTotal: 20 },
    next: last + WEEK,
    dataset: { tag: 'kalori-2026-11-04', date: '2026-11-04', url: 'https://github.com/huangwaylon/fitness/releases/tag/kalori-2026-11-04', items: 54269, shops: 448, ended: 900 },
    diff: { added: 12, gone: 0, renamed: 0, valuesChanged: 38, estChanged: 2, endedChanged: 3, itemsDelta: 9, shares: { added: 0.0002, gone: 0, valuesChanged: 0.0007, estChanged: 0 }, limits: { added: 0.02, gone: 0.015, valuesChanged: 0.05, estChanged: 0.05 } },
    coverage: { complete: true, fetched: 54269, discovered: 54269, shopsTracked: 448, noNutrition: 20, failed: 0 },
    merge: { sha: 'abc1234', deploy: 'ok', pr: null },
    alert: null,
    // (a week's `t`: its run's end, as food-data/scripts/kalori_status.py writes it)
    history: Array.from({ length: 8 }, (_, i) => ({ t: last - (7 - i) * WEEK + ms, result: i === 4 ? 'held' : 'merged', tag: null, added: 12, gone: 0, valuesChanged: 38, endedChanged: 3, ms, runUrl: null })),
    ...over
  };
}

type Kalori = ((now: number) => Record<string, unknown>) | 'offline';

/** A member's phone; the ITS Worker answers its example (a hold waiting: 要対応; `its: false`: no answer), the gym bot
 *  `gymVerdict` (故障 by default; 不調: the site failing), status.json `kalori()` (its current answer: `setKalori`). */
async function phone(page: Page, context: BrowserContext, gymVerdict: 'broken' | 'failing' | 'healthy' = 'broken', o: { kalori?: Kalori; its?: boolean; gym?: boolean | 'hang' } = {}) {
  const rec = newRecord();
  await context.addInitScript(() => localStorage.setItem('e2e.render', 'none'));
  await rec.pair(context, 'A');
  const calls = { its: 0, gym: 0, kalori: 0 };
  let kalori: Kalori = o.kalori ?? ((now) => kaloriStatus(now));
  await page.route(KALORI, (route) => {
    calls.kalori++;
    if (kalori === 'offline') return route.abort('internetdisconnected');
    return route.fulfill({ status: 200, contentType: 'text/plain; charset=utf-8', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(kalori(rec.now())) });
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
    calls, now: rec.now, sheet: page.locator('dialog[open] [data-bots]'), tab: (id: 'its' | 'gym' | 'kalori') => page.locator(`dialog[open] [data-bots-tab="${id}"]`),
    setKalori: (k: Kalori) => void (kalori = k), setGym: (up: boolean | 'hang') => void (gymUp = up)
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
  await expect(list.getByRole('tab')).toHaveText([/ジム/, /保養所/, /メニュー/, /定期処理/]);
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
  expect([calls.its, calls.gym, calls.kalori]).toEqual([1, 1, 1]);
  for (const id of ['its', 'gym', 'kalori'] as const) {
    const box = (await tab(id).boundingBox())!;
    expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(44);
  }
  // ジム · 保養所 · メニュー, left to right; メニュー healthy: no dot (one only while a person must act)
  const [l, m, r] = [(await tab('gym').boundingBox())!, (await tab('its').boundingBox())!, (await tab('kalori').boundingBox())!];
  expect(l.x).toBeLessThan(m.x);
  expect(m.x).toBeLessThan(r.x);
  await expect(tab('kalori')).toHaveAccessibleName('メニュー、順調');
  await expect(tab('kalori')).toHaveAttribute('data-tab-status', 'good');
  await expect(tab('kalori')).not.toHaveAttribute('data-look');
  await expect(tab('kalori').locator('[data-dot]')).toHaveCount(0);
  await expect(tab('gym').locator('[data-dot="bad"][data-look]')).toHaveCount(1);
  // the card: the word, then its sentence (no act of its own)
  await expect(sheet.locator('[data-gym-verdict] [data-bots-word]')).toHaveText('故障');
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

// ---- メニュー: the Kalori scraper ----

/** ボット opened on メニュー. */
async function openKalori(page: Page, tab: (id: 'kalori') => ReturnType<Page['locator']>, sheet: ReturnType<Page['locator']>) {
  await fromMenu(page, 'bots');
  await tab('kalori').click();
  await expect(sheet).toHaveAttribute('data-tab', 'kalori');
  return sheet.locator('[data-kalori-page]');
}

/** ⋯ opened on メニュー: its rows (links only). */
async function kaloriMenu(page: Page, k: ReturnType<Page['locator']>) {
  await k.locator('[data-kalori-menu]').click();
  const rows = page.locator('dialog[open] [data-action]');
  await expect(rows.first()).toBeVisible();
  return rows;
}

test('メニュー 順調: the card (no sentence: the word says it), 直近8週 with 前回 and 次回, 前回の変更 in くわしく, ⋯ (the workflow only); no alert, no dot', async ({ page, context }) => {
  const { sheet, tab, calls } = await phone(page, context, 'healthy');
  const k = await openKalori(page, tab, sheet);
  const verdict = k.locator('[data-kalori-verdict="healthy"]');
  await expect(verdict.locator('[data-bots-word]')).toHaveText('順調');
  await expect(verdict.locator('[data-bots-say], [data-bots-act]')).toHaveCount(0);
  await expect(k.locator('[data-kalori-alert]')).toHaveCount(0);
  await expect(tab('kalori')).toHaveAttribute('data-tab-status', 'good');
  // 前回 the newest run's week, ringed, its day the right-hand tick; the 成果 term 品目, and 次回's day at its row's end
  await expect(k.locator('[data-kalori-cell][data-last]')).toHaveCount(1);
  await expect(k.locator('[data-kalori-tick][data-last]')).toHaveText('11/4');
  await expect(k.locator('[data-kalori-next]')).toHaveText('次回 11/11');
  await expect(k.locator('[data-kalori-outcome]')).toHaveText('54,269品目・448店');
  const [sb, nb, ob] = await Promise.all(['strip', 'next', 'outcome'].map(async (x) => (await k.locator(`[data-kalori-${x}]`).boundingBox())!));
  expect(Math.abs(nb.x + nb.width - (sb.x + sb.width))).toBeLessThan(1); // the cells the card's width, 次回 under their end
  expect(Math.abs(nb.y - ob.y)).toBeLessThan(4);
  await expect(k.getByRole('heading', { level: 3 })).toHaveCount(0); // 前回の変更: in くわしく
  await expect(k.locator('[data-kalori-tag]')).toHaveCount(0);
  // 直近8週: 8 cells, one held (warn: yellow, capped), the summary for VoiceOver and under it, the newest cell's line
  await expect(k.locator('[data-kalori-cell]')).toHaveCount(8);
  await expect(k.locator('[data-kalori-cell="warn"]')).toHaveCount(1);
  await expect(k.locator('[data-kalori-strip]')).toHaveAccessibleName('直近8週：公開7回、保留1回、失敗0回');
  await expect(k.locator('[data-kalori-count]')).toHaveText(['公開7', '保留1']); // only counts > 0, each with its swatch
  await k.locator('[data-kalori-cell]').last().click();
  await expect(k.locator('[data-kalori-scan-line]')).toHaveText('11/4（水）· 公開 · 追加12 値38 終了3 · 4時間12分');
  // ⋯: links only; nothing to run here
  await expect(await kaloriMenu(page, k)).toHaveText(['ワークフローを開く']);
  await expect(page.locator('dialog[open]').last()).toHaveAccessibleName('メニューの操作');
  await page.locator('dialog[open] .navbar button.nav.close').last().click();
  // くわしく
  const fact = (id: string) => k.locator(`[data-kalori-fact="${id}"] dd`);
  await expect(k.locator('[data-kalori-more-sum]')).toHaveText('前回の変更 53件');
  await k.locator('[data-kalori-more] summary').click();
  await expect(fact('data').locator('a')).toHaveAttribute('href', 'https://github.com/huangwaylon/fitness/releases/tag/kalori-2026-11-04');
  await expect(fact('coverage')).toHaveText('完了');
  await expect(fact('run').locator('a')).toHaveText('#4242');
  await expect(fact('took')).toHaveText('4時間12分');
  await expect(fact('rounds')).toHaveText('1回');
  await expect(fact('deploy')).toHaveText('完了');
  await expect(fact('rate')).toContainText('値の変更 0.1%・上限5.0%');
  // 前回の変更: the fold's last row, under the facts
  const latest = k.locator('[data-kalori-more] > :last-child');
  await expect(latest).toHaveAttribute('data-kalori-latest', '');
  await expect(latest.getByRole('heading', { level: 3 })).toHaveText('前回の変更');
  await expect(latest.getByRole('img', { name: '前回の変更：追加12、値の変更38、終了3、削除0' })).toBeVisible();
  await expect(latest.locator('.bar .seg')).toHaveCount(3); // 削除 0: in the legend only
  await expect(latest.locator('.legend > span[data-kalori-seg]')).toHaveText(['追加 12', '値の変更 38', '終了 3', '削除 0']);
  await expect(k.locator('[data-kalori-fact="items"], [data-kalori-fact="last"], [data-kalori-fact="workflow"], [data-kalori-foot]')).toHaveCount(0);
  expect(calls.kalori).toBeGreaterThan(0);
});

/** 保留, as the workflows write it: this morning's run held (its history too), the gate that tripped in diff.tripped. */
const held = (tripped: unknown[], reasons = ['band_gone']) => (now: number) => {
  const base = kaloriStatus(now);
  const history = base.history as Record<string, unknown>[];
  return kaloriStatus(now, {
    verdict: 'held', reasons,
    run: { ...(base.run as object), result: 'held' },
    diff: { ...(base.diff as object), gone: 1200, shares: { added: 0.0002, gone: 0.021, valuesChanged: 0.0007, estChanged: 0 }, tripped },
    merge: { sha: null, deploy: 'held', pr: 'https://github.com/huangwaylon/fitness/pull/901' },
    alert: { text: '削除が上限を超えました', since: now - 3600_000, runUrl: 'https://github.com/huangwaylon/fitness/actions/runs/4242' },
    history: [...history.slice(0, -1), { ...history.at(-1), result: 'held' }]
  });
};

test('メニュー 保留: the yuzu verdict, 確認が必要 (role status: the step and PRを開く), ⋯ (the run, the PR, the workflow), the tab’s and the menu’s dots', async ({ page, context }) => {
  const { sheet, tab } = await phone(page, context, 'healthy', { kalori: held([{ code: 'band_gone', key: 'gone', share: 0.021, limit: 0.015 }]), its: false });
  // the menu unfolding reads Kalori: ボット's dot (保養所 unanswered, ジム healthy: it's Kalori's)
  await unfoldMenu(page);
  const pill = page.locator('[data-hud-bots]');
  await expect(pill.locator('[data-hud-bots-dot]')).toHaveAttribute('data-tone', 'warn');
  await expect(pill).toHaveAccessibleName('ボット、要対応');
  await pill.click();
  await tab('kalori').click();
  const k = sheet.locator('[data-kalori-page]');
  const verdict = k.locator('[data-kalori-verdict="held"]');
  await expect(verdict.locator('[data-bots-word]')).toHaveText('保留'); // the bot's own word, never raised to 要対応
  // a person merges by hand: the act in ink, its sentence (what tripped, the data's day) first in 確認が必要
  await expect(verdict.locator('[data-bots-act]')).toHaveText('差分を確認してマージ');
  await expect(verdict.locator('[data-bots-say]')).toHaveCount(0);
  await expect(verdict).toHaveClass(/warn/);
  await expect(k.locator('[data-kalori-cell][data-last]')).toHaveAttribute('data-kalori-cell', 'warn'); // the run held, not 公開
  const alert = k.locator('[data-kalori-alert]');
  await expect(alert).toHaveAttribute('role', 'status');
  await expect(alert.getByRole('heading', { level: 3 })).toHaveText('確認が必要');
  await expect(alert.locator('[data-kalori-reason]')).toHaveText(['変更が多すぎるため反映を止めました（削除 2.1%・上限1.5%）。アプリは11/4（水）のデータのままです。', 'PRを確認して、問題なければ手動でマージしてください。']);
  await expect(alert.getByRole('link')).toHaveText(['PRを開く']);
  await expect(alert.locator('[data-kalori-link="pr"]')).toHaveAttribute('href', 'https://github.com/huangwaylon/fitness/pull/901');
  expect((await alert.getByRole('link').boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await expect(await kaloriMenu(page, k)).toHaveText(['実行を開く', 'PRを開く', 'ワークフローを開く']);
  for (const a of await page.locator('dialog[open] [data-action]').all()) expect((await a.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await page.locator('dialog[open] .navbar button.nav.close').last().click();
  await expect(tab('kalori')).toHaveAttribute('data-tab-status', 'warn'); // yuzu, as its card: coral is for failures
  await expect(tab('kalori')).toHaveAttribute('data-look', '');
  await expect(tab('kalori')).toHaveAccessibleName('メニュー、保留、要対応');
  // くわしく: no 変更率 nor PR beside 保留's own
  await k.locator('[data-kalori-more] summary').click();
  await expect(k.locator('[data-kalori-fact="rate"], [data-kalori-fact="pr"], [data-kalori-fact="run"]')).toHaveCount(0);
  await expect(k.locator('.legend > span[data-kalori-seg="gone"]')).toHaveText('削除 1,200');
});

test('メニュー 保留 names only the gates that tripped (diff.tripped), never a band within its limit; a tests-only hold says so', async ({ page, context }) => {
  const { sheet, tab, setKalori } = await phone(page, context, 'healthy', { kalori: held([{ code: 'band_values', key: 'renamed', share: 0.012, limit: 0.01 }], ['band_values']) });
  const k = await openKalori(page, tab, sheet);
  const verdict = k.locator('[data-kalori-verdict="held"]');
  const said = k.locator('[data-kalori-alert] [data-kalori-reason]').first(); // the sentence, moved there by the act
  await expect(said).toContainText('（名前の変更 1.2%・上限1.0%）');
  await expect(said).not.toContainText('削除');
  await expect(said).not.toContainText('値の変更 0.1%');
  setKalori(held([], ['tests']));
  await page.locator('dialog[open] .navbar button.nav.close').click();
  await openKalori(page, tab, sheet);
  await expect(verdict.locator('[data-bots-act]')).toHaveText('差分を確認してマージ');
  await expect(said).toHaveText('テストが失敗しました。');
  await expect(verdict.locator('[data-bots-word]')).toHaveText('保留');
});

test('メニュー 不調: the coral card, the reason’s sentence, 確認が必要 with the rest, 最後の成功 the 成果 term, ⋯ with the run', async ({ page, context }) => {
  const failing = (now: number) => kaloriStatus(now, { verdict: 'failing', reasons: ['drift', 'incomplete'], alert: { text: 'x', since: now }, coverage: { complete: false, fetched: 30000, discovered: 54269, failed: 12 } });
  const { sheet, tab } = await phone(page, context, 'healthy', { kalori: failing });
  const k = await openKalori(page, tab, sheet);
  const verdict = k.locator('[data-kalori-verdict="failing"]');
  await expect(verdict).toHaveClass(/bad/);
  await expect(verdict.locator('[data-bots-word]')).toHaveText('不調');
  await expect(verdict.locator('[data-bots-say]')).toHaveText('サイトの構成が変わり読み取れません。');
  await expect(k.locator('[data-kalori-alert] [data-kalori-reason]')).toHaveText(['取得が途中で止まりました。']); // the sentence's not again
  await expect(k.locator('[data-kalori-outcome]')).toHaveText('最後の成功 6:53');
  await expect(await kaloriMenu(page, k)).toHaveText(['実行を開く', 'ワークフローを開く']);
  await page.locator('dialog[open] .navbar button.nav.close').last().click();
  await k.locator('[data-kalori-more] summary').click();
  await expect(k.locator('[data-kalori-fact="coverage"] dd')).toHaveText('30,000 / 54,269品 · 失敗12');
  await expect(tab('kalori')).toHaveAttribute('data-tab-status', 'bad');
  await expect(tab('kalori')).toHaveAttribute('data-look', '');
});

test('メニュー 取得中: the round in the card, 前回 the last run kept; まだ: idle, 最初の更新 in the strip’s place', async ({ page, context }) => {
  const running = (now: number) => {
    const base = kaloriStatus(now);
    return kaloriStatus(now, { verdict: 'running', run: { ...(base.run as object), round: 2, result: 'running', startedAt: now - 3600_000, endedAt: null, shardsDone: 7 }, next: now + WEEK - 3600_000 });
  };
  const { sheet, tab, setKalori } = await phone(page, context, 'healthy', { kalori: running });
  const k = await openKalori(page, tab, sheet);
  await expect(k.locator('[data-kalori-verdict="running"]')).toContainText('2回目 · 20区画中7完了');
  await expect(k.locator('[data-kalori-alert]')).toHaveCount(0);
  await expect(k.locator('[data-kalori-cell][data-last]')).toHaveAttribute('data-kalori-cell', 'ok'); // the last run kept, not the one under way
  await k.locator('[data-kalori-more] summary').click();
  await expect(k.getByRole('img', { name: /^前回の変更：追加12/ })).toBeVisible();

  setKalori((now) => kaloriStatus(now, { verdict: 'none', run: null, dataset: null, diff: null, coverage: null, merge: null, history: [] }));
  await page.locator('dialog[open] .navbar button.nav.close').click();
  await openKalori(page, tab, sheet);
  await expect(k.locator('[data-kalori-verdict="none"] [data-bots-word]')).toHaveText('まだありません');
  await expect(k.locator('[data-kalori-verdict="none"] [data-bots-say]')).toHaveCount(0);
  await expect(k.locator('[data-kalori-empty]')).toHaveText('最初の更新は11/11ごろ'); // nothing kept: a line in the strip's place
  await expect(k.locator('[data-kalori-latest], [data-kalori-scans], [data-kalori-alert]')).toHaveCount(0);
  await expect(tab('kalori')).toHaveAttribute('data-tab-status', 'idle');
});

test('メニュー offline: 「読み込めませんでした（オフライン）」 with もう一度, the last known status kept, 更新中; a retry recovers', async ({ page, context }) => {
  const { sheet, tab, setKalori } = await phone(page, context, 'healthy');
  const k = await openKalori(page, tab, sheet);
  await expect(k.locator('[data-kalori-verdict="healthy"]')).toBeVisible();
  await page.locator('dialog[open] .navbar button.nav.close').click();
  setKalori('offline');
  await openKalori(page, tab, sheet);
  const err = k.locator('[data-kalori-error]');
  await expect(err).toContainText('読み込めませんでした（オフライン）');
  await expect(k.locator('[data-kalori-verdict="healthy"]')).toBeVisible();
  await expect(k.locator('[data-bots-stale]')).toHaveText('更新中');
  await expect(k.locator('[data-kalori-skeleton]')).toHaveCount(0);
  setKalori((now) => kaloriStatus(now));
  await err.getByRole('button', { name: 'もう一度' }).click();
  await expect(err).toHaveCount(0);
  await expect(k.locator('[data-bots-stale]')).toHaveCount(0);
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

test('メニュー offline with nothing kept: the error row only, no skeleton left', async ({ page, context }) => {
  const { sheet, tab } = await phone(page, context, 'healthy', { kalori: 'offline' });
  const k = await openKalori(page, tab, sheet);
  await expect(k.locator('[data-kalori-error]')).toContainText('読み込めませんでした（オフライン）');
  await expect(k.locator('[data-kalori-skeleton], [data-kalori-verdict]')).toHaveCount(0);
});

test('メニュー reads while shown only: the tab left, or the sheet closed, it reads no more', async ({ page, context }) => {
  const { sheet, tab, calls } = await phone(page, context, 'healthy');
  const k = await openKalori(page, tab, sheet);
  await expect(k.locator('[data-kalori-verdict="healthy"]')).toBeVisible();
  const shown = () => page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  // shown: the phone coming back reads it again
  let n = calls.kalori;
  await shown();
  await expect.poll(() => calls.kalori).toBeGreaterThan(n);
  // the tab left: its page gone, nothing reads it
  await tab('gym').click();
  await expect(sheet.locator('[data-kalori-page]')).toHaveCount(0);
  await expect(sheet.locator('[data-gym-verdict]')).toBeVisible();
  // (its read done: the phone coming back doesn't restart one under 5 s old, poll.svelte.ts FRESH_MS)
  await expect(sheet.locator('[data-gym-page]')).toHaveAttribute('aria-busy', 'false');
  n = calls.kalori;
  const g = calls.gym;
  await shown();
  await expect.poll(() => calls.gym).toBeGreaterThan(g); // (ジム, shown, read: the event went through)
  expect(calls.kalori).toBe(n);
  // back on it, then the sheet closed: nothing reads
  await tab('kalori').click();
  await expect(k.locator('[data-kalori-verdict]')).toBeVisible();
  await page.locator('dialog[open] .navbar button.nav.close').click();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await expect(page.locator('[data-kalori-page]')).toHaveCount(0);
  n = calls.kalori;
  await shown();
  await expect(page.locator('[data-kalori-page], [data-gym-page], [data-its-page]')).toHaveCount(0);
  expect(calls.kalori).toBe(n);
});

test('the menu’s 「!」 from ジム alone (保養所 unanswered, メニュー healthy); none, and no green one, while every bot is fine', async ({ page, context }) => {
  await phone(page, context, 'broken', { its: false });
  await unfoldMenu(page);
  const dot = page.locator('[data-hud-bots] [data-hud-bots-dot]');
  await expect(dot).toHaveAttribute('data-tone', 'bad');
  await expect(dot.locator('[data-look]')).toHaveCount(1);
});

test('ジム 不調 from the site failing: no 「!」 while the bot retries on its own (the menu, the tab), its coral card all the same', async ({ page, context }) => {
  const { calls, sheet, tab } = await phone(page, context, 'failing', { its: false });
  await unfoldMenu(page);
  await expect.poll(() => calls.gym + calls.kalori).toBe(2);
  await expect(page.locator('[data-hud-bots]')).toHaveAccessibleName('ボット');
  await expect(page.locator('[data-hud-bots-dot]')).toHaveCount(0);
  await page.locator('[data-hud-bots]').click();
  await expect(sheet.locator('[data-gym-verdict="failing"]')).toHaveClass(/bad/);
  await expect(sheet.locator('[data-gym-verdict] [data-bots-say]')).toHaveText('予約サイトの確認が3回続けて失敗しています。');
  await expect(sheet.locator('[data-gym-verdict] [data-bots-act]')).toHaveCount(0);
  await expect(tab('gym')).toHaveAttribute('data-tab-status', 'bad');
  await expect(tab('gym')).not.toHaveAttribute('data-look');
  await expect(tab('gym')).toHaveAccessibleName('ジム、不調');
  // the coral card's soft text (the as-of, the sentence) ≥ 4.5:1
  const ratios = await sheet.locator('[data-gym-verdict]').evaluate((card) => {
    const rgb = (c: string) => { const n = c.match(/[\d.]+/g)!.map(Number); return c.startsWith('color(') ? n.map((v) => v * 255) : n; };
    const lum = (c: string) => { const [r, g, b] = rgb(c).map((v) => (v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
    const bg = lum(getComputedStyle(card).backgroundColor);
    return ['[data-bots-asof]', '[data-bots-say]'].map((q) => { const l = lum(getComputedStyle(card.querySelector(q)!).color); return (Math.max(l, bg) + 0.05) / (Math.min(l, bg) + 0.05); });
  });
  for (const r of ratios) expect(r).toBeGreaterThanOrEqual(4.5);
});

test('no 「!」 on the menu while every bot is fine', async ({ page, context }) => {
  const { calls } = await phone(page, context, 'healthy', { its: false });
  await unfoldMenu(page);
  await expect.poll(() => calls.gym + calls.kalori).toBe(2);
  await expect(page.locator('[data-hud-bots]')).toHaveAccessibleName('ボット');
  await expect(page.locator('[data-hud-bots-dot]')).toHaveCount(0);
});

test('the dots survive a reload: kept with the status, shown before any read, kept when the read fails', async ({ page, context }) => {
  const { sheet, tab, setGym, setKalori } = await phone(page, context, 'broken', { its: false });
  await fromMenu(page, 'bots');
  await expect(sheet.locator('[data-gym-verdict="broken"]')).toBeVisible();
  await expect(tab('kalori')).toHaveAttribute('data-tab-status', 'good');
  await page.locator('dialog[open] .navbar button.nav.close').click();
  setGym(false);
  setKalori('offline');
  await page.reload();
  await islandUp(page);
  await unfoldMenu(page);
  await expect(page.locator('[data-hud-bots-dot]')).toHaveAttribute('data-tone', 'bad');
  await page.locator('[data-hud-bots]').click();
  await expect(sheet.locator('[data-gym-error]')).toContainText('読み込めませんでした（オフライン）');
  await expect(sheet.locator('[data-gym-verdict="broken"]')).toBeVisible();
  await expect(sheet.locator('[data-bots-stale]')).toHaveText('更新中');
  await expect(tab('gym')).toHaveAttribute('data-tab-status', 'bad');
  await expect(tab('gym')).toHaveAttribute('data-stale', ''); // dimmed: the read failed
  await expect(tab('gym')).toHaveAccessibleName('ジム、故障、要対応（古い）');
  await expect(tab('kalori')).toHaveAttribute('data-tab-status', 'good');
  // 保養所 never answered: hollow, 不明
  await expect(tab('its')).toHaveAttribute('data-tab-status', 'unknown');
  await expect(tab('its')).toHaveAccessibleName('保養所、不明');
});

test('while the sheet is open the tabs not shown are read again every 5 min (here 1.5 s: e2e.botsBg)', async ({ page, context }) => {
  await context.addInitScript(() => localStorage.setItem('e2e.botsBg', '1500'));
  const { calls, sheet } = await phone(page, context, 'healthy');
  await fromMenu(page, 'bots');
  await expect(sheet).toHaveAttribute('data-tab', 'gym');
  const k = calls.kalori, i = calls.its;
  await expect.poll(() => calls.kalori, { timeout: 8000 }).toBeGreaterThan(k + 1);
  expect(calls.its).toBeGreaterThan(i);
});
