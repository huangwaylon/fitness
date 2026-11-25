// ボット's ジム tab (docs/bots.md): a member's ボット sheet, on ジム (the tab last shown): the gym bot's GET
// /status (lib/gym/status.ts, mocked here): its head (the dot inline, ⋯; the dot opens Jobs on the Gym bot row: the
// word, the sentence, the strip, 24 cells a check interval: tap or ← → names one, 前回 ringed, idle alarms low; the
// counts, the open slots and Next on one row; the facts), the calendar from the members-only GET /gym/config (with the phone's key:
// lib/gym/config.ts, the stand-in e2e/gymbot.ts; ⋯'s acts and the calendar are gymbot-settings.spec.ts's);
// 保養所's tab leaves it (no more reads). The last status shows at once on the next opening, its dot dimmed. A failed
// fetch shows もう一度, and a retry recovers; a failed /gym/config has its own retry row and keeps the status; offline
// (after a load or a reload), the last status and settings under one quiet note, the dot dimmed; an older Worker (its
// 404s carry no CORS, so the preflight fails) hides the section. The guest's phone reads both with its key and changes
// nothing (⋯'s rows, 選択 and the day's editor aria-disabled, bots.viewOnly). Phones paired with a record of
// their own (e2e/record.ts); the payloads' rules (tones, cells, lines, a garbled answer) are status.test.ts's and
// config.test.ts's.
import { expect, test, type BrowserContext, type Page, type Route } from './fixtures.ts';
import { fromMenu } from './hud.ts';
import { islandUp } from './island.ts';
import { newRecord } from './record.ts';
import { ACT, CONFIG, STATUS, fakeGym, statusPayload } from './gymbot.ts';
import { KEY_OF } from './relay.ts';
import type { GymStatus } from '../src/lib/gym/status.ts';

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET', 'Access-Control-Allow-Headers': 'Authorization' };

/** A phone paired as `who`, /status answered by `answer` and /gym/config by `configAnswer` (each call counted, the
 *  config's Authorization kept; `old`: a Worker without the route, whose 404s, the preflight's too, carry no CORS),
 *  ボット open on ジム; `edit` changes /status's answer; `acts`: the POST /gym/act bodies (none expected here). */
async function phone(page: Page, context: BrowserContext, who: 'A' | 'G', answer: (n: number) => number = () => 200, configAnswer: (n: number) => number | 'old' = () => 200, edit: (s: GymStatus) => GymStatus = (s) => s) {
  const payload = (now: number) => edit(statusPayload(now));
  const rec = newRecord();
  await context.addInitScript(() => localStorage.setItem('e2e.render', 'none'));
  await rec.pair(context, who);
  const calls = { n: 0, config: 0, asked: 0, auth: [] as (string | undefined)[], acts: [] as unknown[] };
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
  await page.route(ACT, (route) => {
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
    calls.acts.push(route.request().postDataJSON());
    return route.fulfill({ status: 401, contentType: 'application/json', headers: CORS, body: '{"ok":false,"error":"unauthorized"}' });
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
  await fromMenu(page, 'bots');
  return { calls, sheet: page.locator('dialog[open] [data-bots]') };
}

/** The head's dot tapped: Jobs, its Gym bot row unfolded (the status lives there, in English). */
async function svc(sheet: ReturnType<Page['locator']>) {
  await sheet.locator('[data-gym-page] [data-bots-dot]').click();
  await expect(sheet).toHaveAttribute('data-tab', 'jobs');
  const row = sheet.locator('[data-jobs-svc="gym"]');
  await expect(row.locator('button').first()).toHaveAttribute('aria-expanded', 'true');
  return row;
}

test('a member’s ボット on ジム: the head (its dot inline, ⋯), the calendar; the dot opens Jobs on the bot’s row: the verdict, the checks, the facts; 保養所 leaves it, and it reads no more', async ({ page, context }) => {
  const { sheet, calls } = await phone(page, context, 'A');
  const tab = page.locator('dialog[open] [data-bots-tab="gym"]');
  await expect(tab).toHaveAttribute('aria-selected', 'true');
  const gym = sheet.locator('[data-gym-page]');
  // the head: 空き枠の確認, the dot inline (the verdict's tone, named, a button to Jobs), ⋯ at the row's end
  const dot = gym.locator('[data-bots-dot]');
  await expect(dot).toHaveAttribute('data-gym-verdict', 'degraded');
  await expect(dot.locator('[data-dot]')).toHaveAttribute('data-dot', 'warn');
  await expect(dot).toHaveAccessibleName('ジムの状態：一部不調。Jobsで詳しく見る');
  await expect(page.locator('dialog[open] .titlebar')).toContainText('ボット');
  await expect(tab).toHaveAttribute('data-tab-status', 'warn'); // 一部不調, no person needed: no dot on the tab, said inside
  await expect(tab).not.toHaveAttribute('data-look');
  await expect(tab.locator('[data-dot]')).toHaveCount(0);
  await expect(tab).toHaveAccessibleName('ジム、一部不調');
  // no status card on the page (word, sentence, strip and facts are Jobs'); nothing to do: no 確認が必要
  await expect(gym.locator('[data-bots-word], [data-bots-say], [data-gym-strip], [data-gym-fact], .status')).toHaveCount(0);
  await expect(gym.locator('[data-gym-alert]')).toHaveCount(0);
  const menu = gym.locator('[data-gym-menu]');
  await expect(menu).toHaveAccessibleName('ジムの操作');
  await expect(menu).toHaveAttribute('aria-haspopup', 'dialog');
  const box = async (l: ReturnType<Page['locator']>) => (await l.boundingBox())!;
  const [db, mb] = [await box(dot), await box(menu)];
  expect(Math.abs(db.y + db.height / 2 - (mb.y + mb.height / 2))).toBeLessThan(2); // one row
  expect(db.width).toBeGreaterThanOrEqual(44);
  // the head, the calendar (this month); くわしく only with アプリで変更 (none yet)
  const current = gym.locator('[data-gym-config]');
  await expect(current.locator('[data-gym-day]')).toHaveCount(25);
  await expect(gym.getByRole('heading', { level: 3 })).toHaveText(['空き枠の確認', '日ごとの設定']);
  expect(db.y).toBeLessThan((await box(current)).y);
  await expect(gym.locator('[data-gym-more], [data-gym-foot]')).toHaveCount(0);

  // the dot: Jobs, the Gym bot row unfolded (English)
  const row = await svc(sheet);
  await expect(row).toHaveAttribute('data-gym-verdict', 'degraded');
  await expect(row.locator('[data-bots-word]')).toHaveText('Some trouble');
  await expect(row.locator('[data-jobs-svc-asof]')).toHaveText('as of 12:00');
  await expect(row.locator('[data-bots-say]')).toHaveText('Part of the last check failed.');
  await expect(row.locator('[data-bots-act]')).toHaveCount(0);
  // 前回 the newest check's cell, ringed, its time the right-hand tick; the 成果 term and Next
  await expect(row.locator('[data-gym-tick][data-last]')).toHaveText('11:54');
  await expect(row.locator('[data-gym-next]')).toHaveText('Next ~12:09');
  await expect(row.locator('[data-gym-outcome]')).toHaveText('Open now: 1');
  // 24 cells, one each 15 minutes; the last check's timeout warn (one program), the 🔎 before it avail, the idle alarm low
  const scans = row.locator('[data-gym-scans]');
  const strip = row.locator('[data-gym-strip]');
  await expect(strip.locator('[data-gym-cell]')).toHaveCount(24);
  await expect(strip).toHaveAttribute('aria-label', 'Last 6 hours: 2 checks, 1 failed, 2 with openings');
  await expect(strip.locator('[data-gym-cell]').last()).toHaveAttribute('data-gym-cell', 'warn');
  await expect(strip.locator('[data-gym-cell="avail"]')).toHaveCount(1);
  await expect(strip.locator('[data-gym-cell="ok"]')).toHaveCount(0);
  await expect(row.locator('[data-gym-count]')).toHaveText(['Saw openings1', 'Part failed1']); // each with its swatch, only those > 0
  expect(await row.locator('[data-gym-count] .cell').evaluateAll((els) => els.map((e) => [e.getBoundingClientRect().width, e.getBoundingClientRect().height]))).toEqual([[10, 10], [10, 10]]); // one square each
  // the cells the strip's width; Next at the end of the counts' row, right-aligned
  const [sb, cb, nb, kb] = await Promise.all([strip, scans, row.locator('[data-gym-next]'), row.locator('[data-gym-count]').first()].map(box));
  expect(Math.abs(sb.width - cb.width)).toBeLessThan(1);
  expect(Math.abs(nb.x + nb.width - (sb.x + sb.width))).toBeLessThan(1);
  expect(Math.abs(nb.y + nb.height / 2 - (kb.y + kb.height / 2))).toBeLessThan(4);
  await strip.locator('[data-gym-cell]').last().click();
  const line = row.locator('[data-gym-scan-line]');
  const last = await line.textContent();
  expect(last).toMatch(/^11:54 · /);
  await expect(row.locator('[data-gym-next]')).toHaveText('Next ~12:09'); // kept on the picked cell's row
  await page.keyboard.press('ArrowLeft');
  await expect(line).toHaveText(/^11:39 Manual · /);
  await page.keyboard.press('ArrowLeft');
  await expect(line).toHaveText('11:24 · no day to check');
  // one hit layer the strip's height (no per-cell buttons): a drag picks the cell under the finger as it goes
  const sbox = await box(strip);
  expect(sbox.height).toBeGreaterThanOrEqual(44);
  await expect(strip.getByRole('button')).toHaveCount(0);
  await page.mouse.move(sbox.x + 2, sbox.y + sbox.height / 2);
  await page.mouse.down();
  await page.mouse.move(sbox.x + sbox.width - 2, sbox.y + sbox.height / 2, { steps: 4 });
  await page.mouse.up();
  await expect(line).toHaveText(last!);
  // the facts: the last success, LINE's count, the mode in words, the version
  await expect(row.locator('[data-gym-fact="ok"]')).toContainText('11:39');
  await expect(row.locator('[data-gym-fact="line"]')).toContainText('12 / 200');
  await expect(row.locator('[data-gym-fact="mode"] dd')).toHaveText('Bot');
  await expect(row.locator('[data-gym-fact="sha"] dd')).toHaveText('abc1234');
  await expect(row.locator('[data-gym-fact="failures"], [data-gym-fact="last"], [data-gym-fact="next"]')).toHaveCount(0);
  // its button: back to ジム
  await row.locator('[data-jobs-svc-open]').click();
  await expect(sheet).toHaveAttribute('data-tab', 'gym');

  await expect(gym.locator('[data-bots-dot]')).toHaveAttribute('data-gym-verdict', 'degraded');
  const n = calls.n;
  await page.locator('dialog[open] [data-bots-tab="its"]').click();
  await expect(gym).toHaveCount(0);
  await expect(sheet).toHaveAttribute('data-tab', 'its');
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  expect(calls.n).toBe(n);
});

test('idle alarms only (no day to check, as since 11/14): the strip shows them, low and neutral, 前回 ringed; 確認する日なし (no number) and 次回 on the row', async ({ page, context }) => {
  const MIN = 60_000;
  const { sheet } = await phone(page, context, 'A', undefined, undefined, (s) => ({
    ...s, verdict: 'healthy', reasons: [], lastError: null,
    checks: Array.from({ length: 30 }, (_, i) => ({ t: s.now - 4 * MIN - i * 15 * MIN, by: 'alarm' as const, ms: 3, idle: true as const, open: 0, fresh: 0, push: 'none' as const }))
  }));
  const gym = await svc(sheet);
  const strip = gym.locator('[data-gym-strip]');
  await expect(strip.locator('[data-gym-cell="idle"]')).toHaveCount(24);
  await expect(gym.locator('[data-gym-empty]')).toHaveCount(0);
  await expect(strip.locator('[data-gym-cell]').last()).toHaveAttribute('data-last', 'true');
  await expect(gym.locator('[data-gym-tick][data-last]')).toHaveText('11:56');
  await expect(gym.locator('[data-gym-count]')).toHaveText(['no day to check']);
  await expect(gym.locator('[data-gym-next]')).toHaveText('Next ~12:09');
  // its swatch the others' 10×10
  expect(await gym.locator('[data-gym-count="idle"] .cell').evaluate((e) => [e.getBoundingClientRect().width, e.getBoundingClientRect().height])).toEqual([10, 10]);
  // a low bar: taller than none's tick, lower than a check's; its line names it
  const h = (await strip.locator('[data-gym-cell]').last().boundingBox())!.height;
  expect(h).toBeGreaterThan(6);
  expect(h).toBeLessThan(16);
  expect((await strip.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await strip.locator('[data-gym-cell]').last().click();
  await expect(gym.locator('[data-gym-scan-line]')).toHaveText('11:56 · no day to check');
});

test('the next opening shows the last status at once, its dot dimmed, and the read refreshes it in place (after a reload too)', async ({ page, context }) => {
  const { sheet } = await phone(page, context, 'A');
  const dot = sheet.locator('[data-gym-page] [data-bots-dot]');
  await expect(dot).toHaveAttribute('data-gym-verdict', 'degraded');
  await expect(dot.locator('[data-dot]')).not.toHaveAttribute('data-stale');
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
    await expect(dot).toHaveAttribute('data-gym-verdict', 'degraded');
    await expect(sheet.locator('[data-gym-skeleton]')).toHaveCount(0);
    await expect(dot.locator('[data-dot]')).toHaveAttribute('data-stale', '');
    await expect(dot).toHaveAccessibleName('ジムの状態：一部不調（古い）。Jobsで詳しく見る');
  }
  go();
  await expect(dot.locator('[data-dot]')).not.toHaveAttribute('data-stale');
  await expect(dot).toHaveAttribute('data-gym-verdict', 'degraded');
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

test('offline after a first load: the last status and settings, one quiet note (no error rows), the dot dimmed; back online it reads again; after a reload too', async ({ page, context }, info) => {
  const how = info.project.name.startsWith('webkit') ? 'tap' : 'click';
  const { calls, sheet } = await phone(page, context, 'A');
  const gym = sheet.locator('[data-gym-page]');
  const note = gym.locator('[data-gym-error]');
  const shownOffline = async () => {
    await expect(note).toHaveCount(1);
    await expect(note).toHaveAttribute('data-offline', '');
    await expect(note).toContainText('オフラインのため、前回の内容を表示しています');
    await expect(gym.locator('[data-gym-config-error]')).toHaveCount(0);
    await expect(gym.locator('.load-error')).toHaveCount(0);
    await expect(gym.locator('[data-gym-verdict="degraded"]')).toBeVisible();
    await expect(gym.locator('[data-gym-config] [data-gym-day]')).toHaveCount(25);
    await expect(gym.locator('[data-bots-dot]')).toHaveAccessibleName('ジムの状態：一部不調（古い）。Jobsで詳しく見る');
    await expect(gym).toHaveAttribute('aria-busy', 'false');
  };
  await expect(gym.locator('[data-gym-config] [data-gym-day]')).toHaveCount(25);
  await expect.poll(() => calls.config).toBeGreaterThan(0);
  // the network gone (Playwright's routes still answer offline: the bot's cut too); the phone coming back to the page
  // reads (poll.svelte.ts), and both reads fail
  const cut = (route: Route) => route.abort('internetdisconnected');
  await context.setOffline(true);
  for (const url of [STATUS, CONFIG]) await page.route(url, cut);
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await shownOffline();
  // もう一度 offline: tried, and still the one note
  await note.getByRole('button', { name: 'もう一度' })[how]();
  await shownOffline();
  // the bot reachable again: もう一度 reads, the note gone (on a phone the online event reads too: Playwright's WebKit
  // sends none)
  const before = calls.n;
  for (const url of [STATUS, CONFIG]) await page.unroute(url, cut);
  await note.getByRole('button', { name: 'もう一度' })[how]();
  await expect(note).toHaveCount(0);
  expect(calls.n).toBeGreaterThan(before);
  await context.setOffline(false);
  await expect(gym.locator('[data-gym-verdict="degraded"]')).toBeVisible();

  // a reload with the bot unreachable (the shell itself from the network: e2e blocks the service worker): the copies
  // kept on this phone
  for (const url of [STATUS, CONFIG]) await page.route(url, cut);
  await page.reload();
  await islandUp(page);
  await fromMenu(page, 'bots', how);
  await shownOffline();
});

test('an older Worker without /gym/config (404s without CORS, so fetch throws): no settings, no error, the status as before', async ({ page, context }) => {
  const { calls, sheet } = await phone(page, context, 'A', () => 200, () => 'old');
  await expect(sheet.locator('[data-gym-verdict="degraded"]')).toBeVisible();
  await expect.poll(() => calls.asked).toBeGreaterThan(0);
  await expect(sheet.locator('[data-gym-page]')).toHaveAttribute('data-config', 'hidden'); // asked and settled
  await expect(sheet.locator('[data-gym-config]')).toHaveCount(0);
  await expect(sheet.locator('[data-gym-config-error], [data-gym-error]')).toHaveCount(0);
});

test('the guest’s ボット: ジム read with its key as a member’s, changed never (⋯, 選択 and the day’s editor aria-disabled)', async ({ page, context }) => {
  const { calls, sheet } = await phone(page, context, 'G');
  const gym = sheet.locator('[data-gym-page]');
  await expect(page.locator('dialog[open] [data-bots-tab]')).toHaveCount(3); // ジム · 保養所 · 定期処理, as a member's
  await expect(gym.locator('[data-bots-dot]')).toHaveAccessibleName('ジムの状態：一部不調。Jobsで詳しく見る');
  await expect(gym.locator('[data-gym-config] [data-gym-day]')).toHaveCount(25);
  expect(calls.auth[0]).toBe(`Bearer ${KEY_OF.G}`);
  await expect(gym.locator('[data-gym-config] [data-gym-view-only]')).toHaveText('ゲストは見るだけです。設定を変えるのはふたりです。');
  await expect(gym.locator('[data-gym-select]')).toBeDisabled();
  // ⋯: the rows a member has, each off, the note above them
  await gym.locator('[data-gym-menu]').click();
  const rows = page.locator('dialog[open] [data-action]');
  await expect(rows).toHaveText(['今すぐ確認', '確認を停止', '確認の間隔 · 15分ごと ›']);
  for (const r of await rows.all()) await expect(r).toHaveAttribute('aria-disabled', 'true');
  await expect(page.locator('dialog[open]').last()).toContainText('ゲストは見るだけです。');
  await page.locator('dialog[open] [data-action="stop"]').dispatchEvent('click');   // (aria-disabled: Playwright won't tap it)
  await page.keyboard.press('Escape');
  // a day: its editor as a member's, every control disabled
  await gym.locator('[data-gym-day]').nth(5).click();
  const editor = page.locator('[data-gym-editor]');
  await expect(editor.locator('[data-gym-editor-now]')).toBeVisible();
  await expect(editor.locator('[data-gym-view-only]')).toBeVisible();
  for (const k of ['any', 'range', 'off']) await expect(editor.locator(`[data-gym-kind="${k}"]`)).toBeDisabled();
  await editor.locator('[data-gym-kind="any"]').dispatchEvent('click');   // swallowed (sound/taps.ts): a boop, no act
  await expect(editor.locator('[data-gym-kind="any"]')).toHaveAttribute('aria-pressed', 'false');
  await page.keyboard.press('Escape');
  await expect(editor).toHaveCount(0);
  expect(calls.acts).toEqual([]);
});

test('/status failing, /gym/config answered: the head (a hollow dot, ⋯) and the calendar, under the error row', async ({ page, context }) => {
  const { sheet } = await phone(page, context, 'A', () => 500);
  const gym = sheet.locator('[data-gym-page]');
  await expect(gym.locator('[data-gym-error]')).toContainText('読み込めませんでした（http 500）');
  await expect(gym.locator('.phead [data-gym-menu]')).toHaveAccessibleName('ジムの操作');
  await expect(gym.locator('[data-bots-dot] [data-dot]')).toHaveAttribute('data-dot', 'unknown');
  await expect(gym.locator('[data-gym-config] [data-gym-day]')).toHaveCount(25);
  await expect(gym.locator('[data-gym-verdict], [data-gym-skeleton], [data-gym-scans]')).toHaveCount(0);
});
