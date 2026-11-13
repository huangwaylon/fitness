// ボット (docs/design.md "Bots"): the menu's ボット, a member's only, right above 設定, with a dot while a bot needs a
// person; its sheet: the bottom tabs (a tablist: ジム left, 保養所 right), each tab's dot, ← → to move between them,
// the tab remembered for the app's session (ジム, the leftmost, the first time and after the app was closed), only the shown page mounted (it reads while shown, nothing
// reads once its tab is left or the sheet is closed), and 保養所's sticky 保存 bar over the tabs. Both Workers mocked (its.ts, a gym
// status here) at the record's pinned time; the pages' own content is its.spec's and gymbot.spec's, the guest's
// menu hud-menu.spec's.
import { expect, test, type BrowserContext, type Page } from './fixtures.ts';
import { fromMenu, unfoldMenu } from './hud.ts';
import { islandUp } from './island.ts';
import { newRecord } from './record.ts';
import { ORIGIN, cors, payload } from './its.ts';

const GYM = 'https://gym-bot.island-fund-relay.workers.dev';

/** A member's phone; the ITS Worker answers its example (a hold waiting: 要対応), the gym bot `gymVerdict`. */
async function phone(page: Page, context: BrowserContext, gymVerdict: 'failing' | 'healthy' = 'failing') {
  const rec = newRecord();
  await context.addInitScript(() => localStorage.setItem('e2e.render', 'none'));
  await rec.pair(context, 'A');
  const calls = { its: 0, gym: 0 };
  await page.route(`${ORIGIN}/**`, (route) => {
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors() });
    calls.its++;
    return route.fulfill({ status: 200, contentType: 'application/json', headers: cors(), body: JSON.stringify(payload(rec.now())) });
  });
  await page.route(`${GYM}/**`, (route) => {
    const now = rec.now();
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Authorization' } });
    if (new URL(route.request().url()).pathname !== '/status') return route.fulfill({ status: 404, headers: { 'Access-Control-Allow-Origin': '*' }, body: '' });
    calls.gym++;
    const body = {
      v: 1, now, mode: 'bot', sha: 'abc1234', verdict: gymVerdict, reasons: [], intervalMin: 15, paused: false, nextCheck: now + 600_000, lastCheck: now - 300_000,
      lastOk: now - 300_000, lastError: null, failures: gymVerdict === 'failing' ? 3 : 0, siteDownSent: false, retryPending: false, checks: [], line: {}
    };
    return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(body) });
  });
  await page.goto('');
  await islandUp(page);
  return { calls, sheet: page.locator('dialog[open] [data-bots]'), tab: (id: 'its' | 'gym') => page.locator(`dialog[open] [data-bots-tab="${id}"]`) };
}

test('the menu’s ボット, right above 設定, dotted while 保養所 needs a person; the sheet’s tabs: a tablist, dots, 44px, ← →', async ({ page, context }) => {
  const { calls, sheet, tab } = await phone(page, context);
  await unfoldMenu(page);
  const pill = page.locator('[data-hud-bots]');
  await expect(pill.locator('.lbl')).toHaveText(/^ボット/);
  await expect(pill.locator('[data-hud-bots-dot]')).toBeVisible();
  await expect(pill).toHaveAccessibleName(/ボット.*要対応/);
  await expect(pill.locator('img')).toHaveCount(0); // a drawn icon, no game sprite
  const [b, s] = [(await pill.boundingBox())!, (await page.locator('[data-hud-settings]').boundingBox())!];
  expect(b.y + b.height).toBeLessThan(s.y);
  expect(b.y + b.height + 12).toBeGreaterThan(s.y);
  expect(calls.its).toBe(1);

  await pill.click();
  await expect(sheet).toHaveAttribute('data-tab', 'gym');
  await expect(sheet.locator('[data-gym-verdict="failing"]')).toBeVisible();
  const list = page.locator('dialog[open] [role="tablist"]');
  await expect(list).toHaveAccessibleName('ボット');
  await expect(list.getByRole('tab')).toHaveText([/ジム/, /保養所/]);
  await expect(tab('gym')).toHaveAttribute('aria-selected', 'true');
  await expect(tab('its')).toHaveAttribute('aria-selected', 'false');
  await expect(tab('gym')).toHaveAttribute('aria-controls', 'bots-panel');
  await expect(sheet).toHaveAttribute('role', 'tabpanel');
  await expect(sheet).toHaveAttribute('aria-labelledby', 'bots-tab-gym');
  // both dotted: the gym bot failing, the hold waiting (read as the menu unfolded, its tab not shown)
  await expect(tab('its').locator('[data-tab-dot]')).toBeVisible();
  await expect(tab('gym').locator('[data-tab-dot]')).toBeVisible();
  await expect(tab('gym')).toHaveAccessibleName(/^ジム\s+要対応$/);
  expect([calls.its, calls.gym]).toEqual([1, 1]);
  for (const id of ['its', 'gym'] as const) {
    const box = (await tab(id).boundingBox())!;
    expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(44);
  }
  const [l, r] = [(await tab('gym').boundingBox())!, (await tab('its').boundingBox())!];
  expect(l.x).toBeLessThan(r.x);
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
  await expect(tab('gym').locator('[data-tab-dot]')).toHaveCount(0);
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
  await its.locator('[data-its-guests="3"]').click();
  const bar = its.locator('[data-its-save-bar]');
  await expect(bar).toBeVisible();
  const [s, t] = [(await its.locator('[data-its-save]').boundingBox())!, (await page.locator('dialog[open] [role="tablist"]').boundingBox())!];
  expect(s.y + s.height).toBeLessThanOrEqual(t.y);
  expect(await page.evaluate(([x, y]) => !!document.elementFromPoint(x, y)?.closest('[data-its-save]'), [s.x + s.width / 2, s.y + s.height / 2])).toBe(true);
  await tab('gym').click();
  const ask = page.locator('dialog[open] [data-discard-ask]');
  await expect(ask).toContainText('入力した内容を破棄しますか？');
  await ask.locator('[data-discard-keep]').click();
  await expect(sheet).toHaveAttribute('data-tab', 'its');
  await expect(its.locator('[data-its-guests="3"]')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('dialog[open] .navbar button.nav.close').click();
  await expect(ask).toBeVisible();
  await ask.locator('[data-discard-yes]').click();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
});
