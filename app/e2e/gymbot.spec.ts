// ボット's ジム tab (docs/design.md "Bots"): a member's ボット sheet, on ジム (the tab last shown): the gym bot's GET
// /status (lib/gym/status.ts, mocked here): its verdict with the key row (前回 · 次回 · いま) and ⋯, 直近12時間 (a cell a
// check interval: tap or ← → names one), the calendar from the members-only GET /gym/config (with the phone's key:
// lib/gym/config.ts, the stand-in e2e/gymbot.ts; ⋯'s acts and the calendar are gymbot-settings.spec.ts's) and
// くわしく last; 保養所's tab leaves it (no more reads). The last status shows at once on the next opening, marked 更新中. A failed fetch shows
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
  await expect(gym.locator('[data-gym-alert]')).toHaveCount(0); // nothing to do the sentence doesn't say
  // the key row: 前回 (and how it went) · 次回 (and the interval) · いま (the open slots the last check saw)
  const key = (id: string) => gym.locator(`[data-gym-key="${id}"]`);
  await expect(key('last')).toHaveText(/前回\s*11:54\s*一部失敗/);
  await expect(key('next')).toHaveText(/次回\s*12:09ごろ\s*15分ごと/);
  await expect(key('open')).toHaveText(/いま\s*空き1件/);
  await expect(gym.locator('[data-bots-asof]')).toHaveText('12:00時点');
  // the word: body type, as the other cards' titles (くわしく's row), never a display size
  const size = (l: ReturnType<Page['locator']>) => l.evaluate((e) => getComputedStyle(e).fontSize);
  expect(await size(gym.locator('[data-gym-verdict] .word'))).toBe(await size(gym.locator('[data-gym-more] .prl')));
  // ⋯ on the card: named, a dialog's; the card has no other button
  const menu = gym.locator('[data-gym-verdict] [data-gym-menu]');
  await expect(menu).toHaveAccessibleName('ジムの操作');
  await expect(menu).toHaveAttribute('aria-haspopup', 'dialog');
  await expect(gym.locator('[data-gym-verdict]').getByRole('button')).toHaveCount(1);
  // the verdict, the strip, the calendar (2 weeks), くわしく last; no 動作状況 heading, no foot
  const current = gym.locator('[data-gym-config]');
  const scans = gym.locator('[data-gym-scans]');
  await expect(current.locator('[data-gym-day]')).toHaveCount(14);
  await expect(gym.getByRole('heading', { level: 3 })).toHaveText(['日ごとの設定']);
  const y = async (l: ReturnType<Page['locator']>) => (await l.boundingBox())!.y;
  expect(await y(gym.locator('[data-gym-verdict]'))).toBeLessThan(await y(scans));
  expect(await y(scans)).toBeLessThan(await y(current));
  expect(await y(current)).toBeLessThan(await y(gym.locator('[data-gym-more]')));
  await expect(gym.locator('[data-gym-foot]')).toHaveCount(0);
  // 直近12時間: a cell each 15 minutes; the last check's timeout warn (one program), the 🔎 before it avail, the idle alarm low
  await expect(scans).toContainText('直近12時間（1枠15分）');
  const strip = gym.locator('[data-gym-strip]');
  await expect(strip.locator('[data-gym-cell]')).toHaveCount(48);
  await expect(strip).toHaveAttribute('aria-label', '直近12時間：確認2回、失敗1回、空きあり2回');
  await expect(strip.locator('[data-gym-cell]').last()).toHaveAttribute('data-gym-cell', 'warn');
  await expect(strip.locator('[data-gym-cell="avail"]')).toHaveCount(1);
  await expect(strip.locator('[data-gym-cell="ok"]')).toHaveCount(0);
  await expect(gym.locator('[data-gym-scan-line]')).toHaveText('確認2回 · 失敗1 · 空き2');
  await strip.locator('[data-gym-cell]').last().click();
  await expect(gym.locator('[data-gym-scan-line]')).toHaveText('11:54 · トレーニング○ ピラティス✕（タイムアウト） · 空き1');
  await page.keyboard.press('ArrowLeft');
  await expect(gym.locator('[data-gym-scan-line]')).toHaveText('11:39 手動 · トレーニング○ ピラティス○ · 空き1');
  await page.keyboard.press('ArrowLeft');
  await expect(gym.locator('[data-gym-scan-line]')).toHaveText('11:24 · チェックする日なし');
  // くわしく: the last success, LINE's count, the mode in words, the version
  await expect(gym.locator('[data-gym-fact="line"]')).toHaveCount(0);
  await gym.locator('[data-gym-more] summary').click();
  await expect(gym.locator('[data-gym-fact="ok"]')).toContainText('11:39');
  await expect(gym.locator('[data-gym-fact="line"]')).toContainText('12 / 200');
  await expect(gym.locator('[data-gym-fact="mode"] dd')).toHaveText('ボット');
  await expect(gym.locator('[data-gym-fact="sha"] dd')).toHaveText('abc1234');
  await expect(gym.locator('[data-gym-fact="failures"], [data-gym-fact="last"], [data-gym-fact="next"]')).toHaveCount(0);

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
  await expect(sheet.locator('[data-gym-day]')).toHaveCount(14);
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

test('/status failing, /gym/config answered: ⋯ in its own row and the calendar, under the error row', async ({ page, context }) => {
  const { sheet } = await phone(page, context, 'A', () => 500);
  const gym = sheet.locator('[data-gym-page]');
  await expect(gym.locator('[data-gym-error]')).toContainText('読み込めませんでした（http 500）');
  await expect(gym.locator('.actrow [data-gym-menu]')).toHaveAccessibleName('ジムの操作');
  await expect(gym.locator('[data-gym-config] [data-gym-day]')).toHaveCount(14);
  await expect(gym.locator('[data-gym-verdict], [data-gym-skeleton], [data-gym-scans]')).toHaveCount(0);
});
