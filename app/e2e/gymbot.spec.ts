// 設定's ジムボット (docs/design.md "Settings"): a member's row right above 図鑑 pushes the 動作状況 level, which reads
// the gym bot's GET /status (lib/gym/status.ts, mocked here) and shows its verdict, facts and recent checks; ‹ comes
// back to the row; under the facts, 現在の設定 is 📋 設定を見る's answer from the members-only GET /gym/config (with the
// phone's key: lib/gym/config.ts, mocked here), its rows in the bot's own words. A failed fetch shows もう一度, and a
// retry recovers; a failed /gym/config has its own retry row and keeps the status; an older Worker's 404 hides the
// section. The guest has no row. Phones paired with a record of their own (e2e/record.ts); the payloads' rules (tones,
// lines, a garbled answer) are status.test.ts's and config.test.ts's.
import { expect, test, type BrowserContext, type Page } from './fixtures.ts';
import { fromMenu } from './hud.ts';
import { islandUp } from './island.ts';
import { newRecord } from './record.ts';
import type { GymStatus } from '../src/lib/gym/status.ts';
import type { GymConfig } from '../src/lib/gym/config.ts';

const STATUS = 'https://gym-bot.island-fund-relay.workers.dev/status';
const CONFIG = 'https://gym-bot.island-fund-relay.workers.dev/gym/config';
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET', 'Access-Control-Allow-Headers': 'Authorization' };
const MIN = 60_000;

/** A runner whose last check's pilates timed out, at the record's (pinned) time. */
function payload(now: number): GymStatus {
  const ok = { training: 'ok', pilates: 'ok' } as const;
  return {
    v: 1, now, mode: 'bot', sha: 'abc1234def', verdict: 'degraded', reasons: ['program_failing'], intervalMin: 15, paused: false,
    nextCheck: now + 9 * MIN, lastCheck: now - 6 * MIN, lastOk: now - 21 * MIN, lastError: { t: now - 6 * MIN, code: 'timeout' },
    failures: 0, siteDownSent: false, retryPending: false,
    checks: [
      { t: now - 6 * MIN, by: 'alarm', ms: 15200, r: { training: 'ok', pilates: 'timeout' }, open: 1, fresh: 0, push: 'none' },
      { t: now - 21 * MIN, by: 'tap', ms: 3000, r: ok, open: 1, fresh: 1, push: 'held' },
      { t: now - 36 * MIN, by: 'alarm', ms: 3, idle: true, open: 0, fresh: 0, push: 'none' }
    ],
    line: { used: 12, limit: 200, webhookOk: true, asOf: now - 30 * MIN }
  };
}

/** 📋's answer for a few days from the record's day (11/4（水）), as the bot words them (gym/src/messages.ts). */
function config(now: number): GymConfig {
  const days = [
    { day: '2026-11-04', date: '11/4（水）', rule: '⏰ 12:00〜13:00（ふだん）', from: null },
    { day: '2026-11-05', date: '11/5（木）', rule: '🔔 終日', from: '⏳ 18:00から' },
    { day: '2026-11-06', date: '11/6（金）', rule: '🔕 通知オフ', from: null },
    { day: '2026-11-07', date: '11/7（土）', rule: '⏰ 12:00〜13:00（ふだん）', from: null }
  ];
  const check = '15分ごとにチェック・前回 11:54・次回 12:09';
  const text = ['📋 日ごとの設定', ...days.map((d) => `・${d.date}　${d.rule}${d.from ? `　${d.from}` : ''}`), check].join('\n');
  return { v: 1, now, title: '📋 日ごとの設定', days, notice: null, check, paused: false, intervalMin: 15, lastCheck: now - 6 * MIN, nextCheck: now + 9 * MIN, text };
}

/** A phone paired as `who`, /status answered by `answer` and /gym/config by `configAnswer` (each call counted, the
 *  config's Authorization kept), 設定 open. */
async function phone(page: Page, context: BrowserContext, who: 'A' | 'G', answer: (n: number) => number = () => 200, configAnswer: (n: number) => number = () => 200) {
  const rec = newRecord();
  await context.addInitScript(() => localStorage.setItem('e2e.render', 'none'));
  await rec.pair(context, who);
  const calls = { n: 0, config: 0, auth: [] as (string | undefined)[] };
  await page.route(CONFIG, (route) => {
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
    calls.auth.push(route.request().headers().authorization);
    const status = configAnswer(++calls.config);
    return route.fulfill({
      status, contentType: 'application/json', headers: CORS,
      body: status === 200 ? JSON.stringify(config(rec.now())) : '{"ok":false,"error":"boom"}'
    });
  });
  await page.route(STATUS, (route) => {
    const status = answer(++calls.n);
    return route.fulfill({
      status, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' },
      body: status === 200 ? JSON.stringify(payload(rec.now())) : '{"error":"boom"}'
    });
  });
  await page.goto('');
  await islandUp(page);
  await fromMenu(page, 'settings');
  return { calls, settings: page.locator('dialog[open] [data-settings]') };
}

test('a member opens ジムボット above 図鑑: the verdict, the facts and the checks; ‹ comes back to the row', async ({ page, context }) => {
  const { settings } = await phone(page, context, 'A');
  const row = settings.locator('[data-push="gym"]');
  await row.scrollIntoViewIfNeeded();
  await expect(row).toContainText('動作状況');
  const zukan = settings.locator('[data-settings-zukan]');
  expect((await row.boundingBox())!.y).toBeLessThan((await zukan.boundingBox())!.y);

  await row.click();
  const gym = settings.locator('[data-gym-page]');
  await expect(gym.locator('[data-gym-verdict="degraded"]')).toContainText('一部不調');
  await expect(gym.locator('[data-gym-verdict]')).toContainText('前回のチェックで一部が失敗しました。');
  await expect(page.locator('dialog[open] .titlebar')).toContainText('ジムボット');
  await expect(gym.locator('[data-gym-fact="last"]')).toContainText('11:54');
  await expect(gym.locator('[data-gym-fact="next"]')).toContainText('12:09ごろ');
  await expect(gym.locator('[data-gym-fact="ok"]')).toContainText('11:39');
  await expect(gym.locator('[data-gym-fact="line"]')).toContainText('12 / 200');
  await expect(gym.locator('[data-gym-fact="failures"]')).toHaveCount(0);
  const current = gym.locator('[data-gym-config]');
  await expect(current).toContainText('現在の設定');
  await expect(current).toContainText('📋 日ごとの設定');
  const days = current.locator('[data-gym-day]');
  await expect(days).toHaveCount(4);
  await expect(days.nth(0)).toHaveText('11/4（水）⏰ 12:00〜13:00（ふだん）');
  await expect(days.nth(1)).toHaveText('11/5（木）🔔 終日⏳ 18:00から');
  await expect(days.nth(2)).toHaveText('11/6（金）🔕 通知オフ');
  await expect(days.nth(2)).toHaveClass(/soft/);
  await expect(current.locator('[data-gym-config-check]')).toHaveText('15分ごとにチェック・前回 11:54・次回 12:09');
  await expect(current.locator('[data-gym-notice]')).toHaveCount(0);
  // under the facts, above the recent checks
  expect((await current.boundingBox())!.y).toBeGreaterThan((await gym.locator('[data-gym-fact="line"]').boundingBox())!.y);
  expect((await current.boundingBox())!.y).toBeLessThan((await gym.locator('[data-gym-check]').first().boundingBox())!.y);
  const checks = gym.locator('[data-gym-check]');
  await expect(checks).toHaveCount(3);
  await expect(checks.nth(0)).toHaveAttribute('data-failed', '');
  await expect(checks.nth(0)).toContainText('ピラティス：タイムアウト');
  await expect(checks.nth(1)).toContainText('手動');
  await expect(checks.nth(2)).toContainText('チェックなし');
  await expect(gym.locator('[data-gym-foot]')).toContainText('bot · abc1234 · 更新 12:00');

  await page.locator('dialog[open] .titlebar .back').click();
  await expect(gym).toHaveCount(0);
  await expect(row).toBeFocused();
});

test('a failed fetch shows もう一度, and a retry recovers', async ({ page, context }) => {
  const { calls, settings } = await phone(page, context, 'A', (n) => (n === 1 ? 500 : 200));
  await settings.locator('[data-push="gym"]').click();
  const error = settings.locator('[data-gym-error]');
  await expect(error).toContainText('読み込めませんでした');
  await expect(settings.locator('[data-gym-verdict]')).toHaveCount(0);
  await error.getByRole('button', { name: 'もう一度' }).click();
  await expect(settings.locator('[data-gym-verdict="degraded"]')).toBeVisible();
  await expect(error).toHaveCount(0);
  expect(calls.n).toBe(2);
});

test('the phone’s key reads 現在の設定; a failed read has its own もう一度 and keeps the status', async ({ page, context }) => {
  const { calls, settings } = await phone(page, context, 'A', () => 200, (n) => (n === 1 ? 503 : 200));
  await settings.locator('[data-push="gym"]').click();
  const error = settings.locator('[data-gym-config-error]');
  await expect(error).toContainText('現在の設定を読み込めませんでした');
  await expect(settings.locator('[data-gym-verdict="degraded"]')).toBeVisible();
  await expect(settings.locator('[data-gym-error]')).toHaveCount(0);
  await error.getByRole('button', { name: 'もう一度' }).click();
  await expect(settings.locator('[data-gym-day]')).toHaveCount(4);
  await expect(error).toHaveCount(0);
  expect(calls.config).toBe(2);
  expect(calls.auth.every((a) => /^Bearer [0-9a-f]{32,}$/i.test(a ?? ''))).toBe(true);
});

test('an older Worker without /gym/config (404): no 現在の設定, no error, the status as before', async ({ page, context }) => {
  const { calls, settings } = await phone(page, context, 'A', () => 200, () => 404);
  await settings.locator('[data-push="gym"]').click();
  await expect(settings.locator('[data-gym-verdict="degraded"]')).toBeVisible();
  await expect.poll(() => calls.config).toBe(1);
  await expect(settings.locator('[data-gym-config]')).toHaveCount(0);
  await expect(settings.locator('[data-gym-config-error], [data-gym-error]')).toHaveCount(0);
});

test('the guest has no ジムボット row, and nothing asks the bot', async ({ page, context }) => {
  const { calls, settings } = await phone(page, context, 'G');
  await expect(settings.locator('[data-settings-zukan]')).toBeVisible();
  await expect(settings.locator('[data-push="gym"]')).toHaveCount(0);
  expect([calls.n, calls.config]).toEqual([0, 0]);
});
