// 設定's ジムボット (docs/design.md "Settings"): a member's row right above 図鑑 pushes the 動作状況 level, which reads
// the gym bot's GET /status (lib/gym/status.ts, mocked here) and shows its verdict, facts and recent checks; ‹ comes
// back to the row. A failed fetch shows もう一度, and a retry recovers. The guest has no row. Phones paired with a
// record of their own (e2e/record.ts); the payload's rules (tones, lines, a garbled answer) are status.test.ts's.
import { expect, test, type BrowserContext, type Page } from './fixtures.ts';
import { fromMenu } from './hud.ts';
import { islandUp } from './island.ts';
import { newRecord } from './record.ts';
import type { GymStatus } from '../src/lib/gym/status.ts';

const STATUS = 'https://gym-bot.island-fund-relay.workers.dev/status';
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

/** A phone paired as `who`, /status answered by `answer` (each call counted), 設定 open. */
async function phone(page: Page, context: BrowserContext, who: 'A' | 'G', answer: (n: number) => number = () => 200) {
  const rec = newRecord();
  await context.addInitScript(() => localStorage.setItem('e2e.render', 'none'));
  await rec.pair(context, who);
  const calls = { n: 0 };
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

test('the guest has no ジムボット row, and nothing asks the bot', async ({ page, context }) => {
  const { calls, settings } = await phone(page, context, 'G');
  await expect(settings.locator('[data-settings-zukan]')).toBeVisible();
  await expect(settings.locator('[data-push="gym"]')).toHaveCount(0);
  expect(calls.n).toBe(0);
});
