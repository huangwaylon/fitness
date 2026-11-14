// ボット's ジム tab (docs/design.md "Bots"): a member's ボット sheet, on ジム (the tab last shown): on top the settings
// from the members-only GET /gym/config (with the phone's key: lib/gym/config.ts, the stand-in e2e/gymbot.ts; the
// controls and the calendar are gymbot-settings.spec.ts's); at the foot 動作状況, the gym bot's GET /status (lib/gym/status.ts, mocked here): its
// verdict, 直近12時間 (a cell a check interval: tap or ← → names one) and its facts (くわしく folds the rest); 保養所's tab
// leaves it (no more reads). The last status shows at once on the next opening, marked 更新中. A failed fetch shows
// もう一度, and a retry recovers; a failed /gym/config has its own retry row and keeps the status; an older Worker (its
// 404s carry no CORS, so the preflight fails) hides the section. The guest has no ボット. Phones paired with a record of
// their own (e2e/record.ts); the payloads' rules (tones, cells, lines, a garbled answer) are status.test.ts's and
// config.test.ts's.
import { expect, test, type BrowserContext, type Page } from './fixtures.ts';
import { fromMenu, unfoldMenu } from './hud.ts';
import { islandUp } from './island.ts';
import { newRecord } from './record.ts';
import { CONFIG, STATUS, fakeGym, statusPayload as payload } from './gymbot.ts';

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET', 'Access-Control-Allow-Headers': 'Authorization' };

/** A phone paired as `who`, /status answered by `answer` and /gym/config by `configAnswer` (each call counted, the
 *  config's Authorization kept; `old`: a Worker without the route, whose 404s, the preflight's too, carry no CORS),
 *  ボット open on ジム (the guest's: the menu unfolded). */
async function phone(page: Page, context: BrowserContext, who: 'A' | 'G', answer: (n: number) => number = () => 200, configAnswer: (n: number) => number | 'old' = () => 200) {
  const rec = newRecord();
  await context.addInitScript(() => localStorage.setItem('e2e.render', 'none'));
  await rec.pair(context, who);
  const calls = { n: 0, config: 0, asked: 0, auth: [] as (string | undefined)[] };
  const gym = fakeGym(rec.now);
  await page.route(CONFIG, (route) => {
    calls.asked++;
    if (configAnswer(calls.config + 1) === 'old') {
      // Playwright answers the preflight itself (neither browser routes it here) and skips CORS on a fulfilled
      // response, so the GET fails as the browser fails it after the real Worker's CORS-less 404 to OPTIONS
      const old = route.request().method() === 'OPTIONS';
      return old ? route.fulfill({ status: 404, contentType: 'text/plain', body: 'not found' }) : route.abort('failed');
    }
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
    calls.auth.push(route.request().headers().authorization);
    const status = configAnswer(++calls.config) as number;
    return route.fulfill({
      status, contentType: 'application/json', headers: CORS,
      body: status === 200 ? JSON.stringify(gym.config()) : '{"ok":false,"error":"boom"}'
    });
  });
  await page.route(STATUS, (route) => {
    const status = answer(++calls.n);
    return route.fulfill({
      status, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' },
      body: status === 200 ? JSON.stringify(payload(rec.now())) : '{"error":"boom"}'
    });
  });
  // (ジム the tab last shown on this phone)
  await context.addInitScript(() => sessionStorage.setItem('island.botsTab', 'gym'));
  await page.goto('');
  await islandUp(page);
  if (who === 'A') await fromMenu(page, 'bots');
  else await unfoldMenu(page);
  return { calls, sheet: page.locator('dialog[open] [data-bots]') };
}

test('a member’s ボット on ジム: the verdict, the facts and the checks; 保養所 leaves it, and it reads no more', async ({ page, context }) => {
  const { sheet, calls } = await phone(page, context, 'A');
  const tab = page.locator('dialog[open] [data-bots-tab="gym"]');
  await expect(tab).toHaveAttribute('aria-selected', 'true');
  const gym = sheet.locator('[data-gym-page]');
  await expect(gym.locator('[data-gym-verdict="degraded"]')).toContainText('一部不調');
  await expect(gym.locator('[data-gym-verdict]')).toContainText('前回のチェックで一部が失敗しました。');
  await expect(page.locator('dialog[open] .titlebar')).toContainText('ボット');
  await expect(tab).toHaveAttribute('data-tab-status', 'warn'); // 一部不調: yuzu, no 「!」 (no person needed)
  await expect(tab).not.toHaveAttribute('data-look');
  await expect(tab).toHaveAccessibleName('ジム、一部不調');
  await expect(gym.locator('[data-gym-alert]')).toHaveCount(0);
  await expect(gym.locator('[data-gym-fact="last"]')).toContainText('11:54');
  await expect(gym.locator('[data-gym-fact="next"]')).toContainText('12:09ごろ');
  await expect(gym.locator('[data-gym-fact="failures"]')).toHaveCount(0);
  // くわしく: the last success and LINE's count
  await expect(gym.locator('[data-gym-fact="line"]')).toHaveCount(0);
  await gym.locator('[data-gym-more] summary').click();
  await expect(gym.locator('[data-gym-fact="ok"]')).toContainText('11:39');
  await expect(gym.locator('[data-gym-fact="line"]')).toContainText('12 / 200');
  // the verdict on top, the controls in its row (gymbot-settings.spec.ts), the calendar, then 動作状況 (the strip, the
  // facts) and the foot
  const current = gym.locator('[data-gym-config]');
  await expect(gym.locator('[data-gym-verdict] [data-gym-controls]')).toContainText('チェック中・15分ごと');
  await expect(current.locator('[data-gym-day]')).toHaveCount(25);
  const status = gym.locator('[data-gym-status]');
  await expect(status).toContainText('動作状況');
  expect((await gym.locator('[data-gym-verdict]').boundingBox())!.y).toBeLessThan((await current.boundingBox())!.y);
  expect((await current.boundingBox())!.y).toBeLessThan((await status.boundingBox())!.y);
  // 直近12時間: a cell each 15 minutes; the last check's timeout red, the 🔎 before it yellow (a slot open), the idle alarm outlined
  const strip = gym.locator('[data-gym-strip]');
  await expect(strip.locator('[data-gym-cell]')).toHaveCount(48);
  await expect(strip).toHaveAttribute('aria-label', '直近12時間：確認2回、失敗1回、空きあり2回');
  await expect(strip.locator('[data-gym-cell]').last()).toHaveAttribute('data-gym-cell', 'fail');
  await expect(strip.locator('[data-gym-cell="avail"]')).toHaveCount(1);
  await expect(strip.locator('[data-gym-cell="ok"]')).toHaveCount(0);
  await expect(gym.locator('[data-gym-scan-line]')).toHaveText('枠を選ぶと内容が出ます');
  await strip.locator('[data-gym-cell]').last().click();
  await expect(gym.locator('[data-gym-scan-line]')).toHaveText('11:54 · トレーニング○ ピラティス✕（タイムアウト） · 空き1');
  await page.keyboard.press('ArrowLeft');
  await expect(gym.locator('[data-gym-scan-line]')).toHaveText('11:39 手動 · トレーニング○ ピラティス○ · 空き1');
  await page.keyboard.press('ArrowLeft');
  await expect(gym.locator('[data-gym-scan-line]')).toHaveText('11:24 · チェックする日なし');
  await expect(gym.locator('[data-gym-foot]')).toContainText('bot · abc1234 · 更新 12:00');

  const n = calls.n;
  await page.locator('dialog[open] [data-bots-tab="its"]').click();
  await expect(gym).toHaveCount(0);
  await expect(sheet).toHaveAttribute('data-tab', 'its');
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  expect(calls.n).toBe(n);
});

test('the next opening shows the last status at once, marked 更新中, and the read refreshes it in place (after a reload too)', async ({ page, context }) => {
  const { sheet } = await phone(page, context, 'A');
  await expect(sheet.locator('[data-gym-verdict="degraded"]')).toBeVisible();
  await expect(sheet.locator('[data-bots-stale]')).toHaveCount(0);
  // the bot's answers held from now on (until let go), as a slow network's
  let go = () => {};
  const held = new Promise<void>((r) => (go = r));
  await page.route(STATUS, async (route) => { await held; await route.fallback().catch(() => {}); });
  for (const reload of [false, true]) {
    await page.locator('dialog[open] .navbar button.nav.close').click();
    await expect(page.locator('dialog[open]')).toHaveCount(0);
    if (reload) {
      await page.reload();
      await islandUp(page);
    }
    await fromMenu(page, 'bots');
    await expect(sheet.locator('[data-gym-verdict="degraded"]')).toBeVisible();
    await expect(sheet.locator('[data-gym-skeleton]')).toHaveCount(0);
    await expect(sheet.locator('[data-bots-stale]')).toHaveText('更新中');
    await expect(sheet.locator('[data-gym-cell]')).toHaveCount(48);
  }
  go();
  await expect(sheet.locator('[data-bots-stale]')).toHaveCount(0);
  await expect(sheet.locator('[data-gym-verdict="degraded"]')).toBeVisible();
});

test('a failed fetch shows もう一度 with its code, and a retry recovers', async ({ page, context }) => {
  // (the menu unfolding reads ジム first: its dot)
  const { calls, sheet } = await phone(page, context, 'A', (n) => (n <= 2 ? 500 : 200));
  const error = sheet.locator('[data-gym-error]');
  await expect(error).toContainText('読み込めませんでした（http 500）');
  await expect(sheet.locator('[data-gym-verdict]')).toHaveCount(0);
  await error.getByRole('button', { name: 'もう一度' }).click();
  await expect(sheet.locator('[data-gym-verdict="degraded"]')).toBeVisible();
  await expect(error).toHaveCount(0);
  expect(calls.n).toBe(3);
});

test('the phone’s key reads 現在の設定; a failed read has its own もう一度 and keeps the status', async ({ page, context }) => {
  const { calls, sheet } = await phone(page, context, 'A', () => 200, (n) => (n === 1 ? 503 : 200));
  const error = sheet.locator('[data-gym-config-error]');
  await expect(error).toContainText('設定を読み込めませんでした');
  await expect(sheet.locator('[data-gym-verdict="degraded"]')).toBeVisible();
  await expect(sheet.locator('[data-gym-error]')).toHaveCount(0);
  await error.getByRole('button', { name: 'もう一度' }).click();
  await expect(sheet.locator('[data-gym-day]')).toHaveCount(25);
  await expect(error).toHaveCount(0);
  expect(calls.config).toBe(2);
  expect(calls.auth.every((a) => /^Bearer [0-9a-f]{32,}$/i.test(a ?? ''))).toBe(true);
});

test('an older Worker without /gym/config (404s without CORS, so fetch throws): no settings, no error, the status as before', async ({ page, context }) => {
  const { calls, sheet } = await phone(page, context, 'A', () => 200, () => 'old');
  await expect(sheet.locator('[data-gym-verdict="degraded"]')).toBeVisible();
  await expect.poll(() => calls.asked).toBeGreaterThan(0);
  await expect(sheet.locator('[data-gym-page]')).toHaveAttribute('data-config', 'hidden'); // asked and settled
  await expect(sheet.locator('[data-gym-config]')).toHaveCount(0);
  await expect(sheet.locator('[data-gym-config-error], [data-gym-error]')).toHaveCount(0);
});

test('the guest has no ボット, and nothing asks the bot', async ({ page, context }) => {
  const { calls } = await phone(page, context, 'G');
  await expect(page.locator('[data-hud-settings]')).toBeVisible();
  await expect(page.locator('[data-hud-bots]')).toHaveCount(0);
  expect([calls.n, calls.config]).toEqual([0, 0]);
});

test('/status failing, /gym/config answered: the controls in their own row and the calendar, under the error row', async ({ page, context }) => {
  const { sheet } = await phone(page, context, 'A', () => 500);
  const gym = sheet.locator('[data-gym-page]');
  await expect(gym.locator('[data-gym-error]')).toContainText('読み込めませんでした（http 500）');
  await expect(gym.locator('[data-gym-controls]')).toContainText('チェック中・15分ごと');
  await expect(gym.locator('[data-gym-config] [data-gym-day]')).toHaveCount(25);
  await expect(gym.locator('[data-gym-verdict], [data-gym-skeleton], [data-gym-status]')).toHaveCount(0);
});
