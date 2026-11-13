// ボット → ジム's settings (docs/design.md "Bots"; the brief's app half): the control row (stop asks first, restart at
// once, 確認の間隔, 今すぐ確認 and its countdown), the 4-week calendar (the 4-day default, VoiceOver's grid and its arrow
// keys, 44px), the day editor (instant, 取り消す, the slot chips, 通知の開始's disabled times), select mode and one bulk
// act, a 409 stale, quick edits sent in turn, the bot's refusals in its words, a failure with もう一度, and a poll's change
// flashed. The Worker is e2e/gymbot.ts's stand-in (page.route; every act's body kept), at the record's pinned time
// (11/4（水） 12:00). With GYM_UI_SHOTS=<dir>, the last test also writes the screenshots, day and night.
import { mkdirSync } from 'node:fs';
import { expect, test, type BrowserContext, type Page } from './fixtures.ts';
import { fromMenu } from './hud.ts';
import { islandUp } from './island.ts';
import { newRecord } from './record.ts';
import { fakeGym, routeGym } from './gymbot.ts';

async function phone(page: Page, context: BrowserContext, arrange: (gym: ReturnType<typeof fakeGym>) => void = () => {}) {
  const rec = newRecord();
  await context.addInitScript(() => {
    localStorage.setItem('e2e.render', 'none');
    localStorage.setItem('island.botsTab', 'gym');
  });
  await rec.pair(context, 'A');
  const gym = fakeGym(rec.now);
  arrange(gym);
  const calls = await routeGym(page, gym, rec.now);
  await page.goto('');
  await islandUp(page);
  await fromMenu(page, 'bots');
  const sheet = page.locator('dialog[open] [data-bots]');
  await expect(sheet.locator('[data-gym-day]')).toHaveCount(25);
  const day = (i: number) => sheet.locator(`[data-gym-day="${gym.days[i]}"]`);
  const editor = page.locator('dialog[open] [data-gym-editor]');
  return { gym, calls, sheet, day, editor, rec };
}

test('the calendar: 4 weeks from Monday, the 4-day default and why, a grid VoiceOver reads, 44px', async ({ page, context }) => {
  const { sheet, day, gym } = await phone(page, context, (g) => {
    g.lineTap(g.days[5], 'any');
    g.setFrom(g.days[5], Date.parse('2026-11-09T18:00:00+09:00'));
    g.lineTap(g.days[6], ['18:30', '20:00']);
    g.announce(g.days[6], ['18:30', '19:00']);
    g.lineTap(g.days[8], 'skip');
  });
  const grid = sheet.getByRole('grid', { name: '日ごとの通知（4週間）' });
  await expect(grid.getByRole('row')).toHaveCount(5); // the weekdays and 4 weeks
  await expect(grid.getByRole('columnheader')).toHaveText(['月', '火', '水', '木', '金', '土', '日']);
  await expect(grid.locator('.cell.out')).toHaveCount(3); // Mon, Tue (passed) … and 12/1 past the 25 days
  await expect(day(0)).toHaveAttribute('aria-label', '11/4（水）（今日）、ふだん（12:00〜13:00）');
  for (const i of [0, 1, 2, 3]) await expect(day(i)).toHaveAttribute('data-fill', 'usual');
  await expect(day(4)).toHaveAttribute('data-fill', 'none');
  await expect(day(4)).toHaveAttribute('aria-label', '11/8（日）、未チェック');
  await expect(day(0)).toContainText('12–13');
  await expect(day(5)).toHaveAttribute('aria-label', '11/9（月）、終日、18:00から');
  await expect(day(5).locator('[data-gym-from]')).toBeVisible();
  await expect(day(6)).toHaveAttribute('aria-label', '11/10（火）、18:30〜20:00、通知済み2件');
  await expect(day(6).locator('[data-gym-announced="2"]')).toHaveText('2');
  await expect(day(6)).toContainText('18:30–20');
  await expect(day(8)).toHaveAttribute('data-fill', 'off');
  await expect(sheet.locator('[data-gym-cal-note]')).toHaveText('予約は同時に3件まで。設定のない日は近い4日だけ 12:00〜13:00 を見ます');
  await expect(sheet.locator('[data-gym-legend] > span')).toHaveText(['終日', '時間指定', 'ふだん', 'オフ', '開始時刻', '通知済み']);
  // 44px: the days, the control row
  for (const el of [day(0), day(24), sheet.locator('[data-gym-run]'), sheet.locator('[data-gym-check]'), sheet.locator('[data-gym-interval-open]')]) { // (選択: the kit's small chip, 32px in a 44px hit)
    const b = (await el.boundingBox())!;
    expect(Math.min(b.width, b.height), await el.evaluate((e) => e.outerHTML.slice(0, 60))).toBeGreaterThanOrEqual(44);
  }
  // one tab stop (today), the arrow keys between days, Home / End within the week
  await expect(day(0)).toHaveAttribute('tabindex', '0');
  await expect(day(1)).toHaveAttribute('tabindex', '-1');
  await day(0).focus();
  await page.keyboard.press('ArrowRight');
  await expect(day(1)).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(day(8)).toBeFocused();
  await page.keyboard.press('End');
  await expect(day(11)).toBeFocused(); // that week's Sunday
  await page.keyboard.press('ArrowUp');
  await expect(day(4)).toBeFocused();
  await page.keyboard.press('ArrowUp'); // above: Sunday 11/1 has passed
  await expect(day(4)).toBeFocused();
  expect(gym.acts).toEqual([]);
});

test('a day’s editor applies at once, and 取り消す puts the day back', async ({ page, context }) => {
  const { gym, day, editor } = await phone(page, context);
  await day(5).click();
  await expect(page.locator('dialog[open] .navbar').last()).toContainText('11/9（月）');
  await expect(editor.locator('[data-gym-editor-now]')).toHaveText('いまの設定：未チェック');
  await expect(editor.locator('[data-gym-reset]')).toHaveCount(0); // nothing to clear
  await editor.locator('[data-gym-kind="any"]').click();
  await expect(day(5)).toHaveAttribute('data-fill', 'any');
  await expect(editor.locator('[data-gym-kind="any"]')).toHaveAttribute('aria-pressed', 'true');
  expect(gym.acts).toEqual([{ a: 'any', d: gym.days[5], base: 'v0' }]);
  const toast = page.locator('.banner');
  await expect(toast).toContainText('11/9（月） 終日にしました');
  await toast.getByRole('button', { name: '取り消す' }).click();
  await expect(day(5)).toHaveAttribute('data-fill', 'none');
  expect(gym.acts.at(-1)).toEqual({ a: 'reset', d: gym.days[5], base: 'v1' }); // a 未チェック day: back with a reset
  // a ふだん day: back with its usual window, and ふだんに戻す once it has a rule
  await page.locator('dialog[open] .navbar button.nav.close').last().click();
  await day(1).click();
  await editor.locator('[data-gym-kind="off"]').click();
  await expect(day(1)).toHaveAttribute('data-fill', 'off');
  await expect(editor.locator('[data-gym-reset]')).toHaveText('ふだんに戻す');
  await editor.locator('[data-gym-reset]').click();
  await expect(day(1)).toHaveAttribute('data-fill', 'usual');
  expect(gym.acts.slice(-2)).toEqual([{ a: 'skip', d: gym.days[1], base: 'v0' }, { a: 'reset', d: gym.days[1], base: 'v1' }]);
});

test('時間指定: a tap starts an hour, the next picks the last slot, 21:30 ends at 22:00; 通知の開始’s times the bot would refuse are disabled', async ({ page, context }) => {
  const { gym, day, editor } = await phone(page, context, (g) => g.announce(g.days[6], ['18:30']));
  await day(6).click();
  await editor.locator('[data-gym-kind="range"]').click();
  expect(gym.acts.at(-1)).toEqual({ a: 'range', d: gym.days[6], s: '12:00', e: '13:00', base: 'v0' });
  const slot = (c: string) => editor.locator(`[data-gym-slot="${c}"]`);
  await expect(editor.locator('[data-gym-slot]')).toHaveCount(24);
  await expect(slot('12:00')).toHaveAttribute('aria-pressed', 'true');
  await expect(slot('18:30')).toHaveAttribute('aria-label', '18:30（通知済み）');
  await slot('18:00').click();
  await expect(editor.locator('[data-gym-slots-line]')).toHaveText('18:00〜19:00 の枠を通知（2枠）');
  await slot('19:30').click();
  await expect(editor.locator('[data-gym-slots-line]')).toHaveText('18:00〜20:00 の枠を通知（4枠）');
  await expect(day(6)).toContainText('18–20');
  await slot('18:30').click(); // inside: trims the end
  await expect(editor.locator('[data-gym-slots-line]')).toHaveText('18:00〜19:00 の枠を通知（2枠）');
  await slot('21:30').click();
  await expect(editor.locator('[data-gym-slots-line]')).toHaveText('21:30〜22:00 の枠を通知（1枠）');
  expect(gym.acts.slice(1).map((a) => 'e' in a && `${a.s}-${a.e}`)).toEqual(['18:00-19:00', '18:00-20:00', '18:00-19:00', '21:30-22:00']);
  // 通知の開始: 時刻, then a time before the window's last slot
  await editor.locator('[data-gym-from="at"]').click();
  const pick = editor.locator('[data-gym-from-time]');
  await expect(pick.locator('option[value="21:00"]')).toBeEnabled();
  await expect(pick.locator('option[value="21:30"]')).toBeDisabled(); // the window's last slot starts then
  await pick.selectOption('20:00');
  await expect(day(6).locator('[data-gym-from]')).toBeVisible();
  expect(gym.acts.at(-1)).toMatchObject({ a: 'from', d: gym.days[6], at: '20:00' });
  await editor.locator('[data-gym-from="now"]').click();
  expect(gym.acts.at(-1)).toMatchObject({ a: 'unfrom', d: gym.days[6] });
  await expect(day(6).locator('[data-gym-from]')).toHaveCount(0);
  // today past noon: no time before the usual window's last slot (12:30) is ahead
  await page.locator('dialog[open] .navbar button.nav.close').last().click();
  await day(0).click();
  await editor.locator('[data-gym-from="at"]').click();
  await expect(editor.locator('[data-gym-from-time] option:not([disabled])')).toHaveCount(0);
  await expect(editor.locator('[data-gym-from-time] option[value="12:00"]')).toBeDisabled();
});

test('select mode: weekday headers and days, one bulk act, one 取り消す; 時間指定 for them all; a long press starts it', async ({ page, context }) => {
  const { gym, day, sheet } = await phone(page, context);
  await sheet.locator('[data-gym-select]').click();
  const bar = sheet.locator('[data-gym-bulk]');
  await expect(bar).toContainText('日付か曜日を選んでください');
  await sheet.locator('[data-gym-weekday="5"]').click(); // 土: 11/7, 14, 21, 28
  await expect(bar).toContainText('4日を選択');
  await day(5).click();
  await expect(bar).toContainText('5日を選択');
  await expect(day(5)).toHaveAttribute('aria-pressed', 'true');
  await bar.locator('[data-gym-bulk-act="skip"]').click();
  for (const i of [3, 5, 10, 17, 24]) await expect(day(i)).toHaveAttribute('data-fill', 'off');
  expect(gym.acts).toHaveLength(1);
  expect(gym.acts[0]).toEqual({ a: 'skip', days: [3, 5, 10, 17, 24].map((i) => ({ d: gym.days[i], base: 'v0' })) });
  const toast = page.locator('.banner');
  await expect(toast).toContainText('5日をオフにしました');
  await toast.getByRole('button', { name: '取り消す' }).click();
  await expect(day(3)).toHaveAttribute('data-fill', 'usual');
  await expect(day(10)).toHaveAttribute('data-fill', 'none');
  // undone in two acts: 11/7 back to ふだん's window, the rest reset
  expect(gym.acts.slice(1)).toEqual([
    { a: 'range', s: '12:00', e: '13:00', d: gym.days[3], base: 'v1' },
    { a: 'reset', days: [5, 10, 17, 24].map((i) => ({ d: gym.days[i], base: 'v1' })) }
  ]);
  await bar.locator('[data-gym-bulk-act="range"]').click();
  const pick = page.locator('dialog[open] [data-gym-bulk-range]');
  await pick.locator('[data-gym-slot="18:00"]').click();
  await pick.locator('[data-gym-slot="19:30"]').click();
  await page.locator('dialog[open] [data-gym-bulk-range-apply]').click();
  await expect(day(17)).toContainText('18–20');
  expect(gym.acts.at(-1)).toMatchObject({ a: 'range', s: '18:00', e: '20:00' });
  await bar.locator('[data-gym-bulk-done]').click();
  await expect(bar).toHaveCount(0);
  // a long press on a day (a touch held half a second; the click as it's let go starts nothing more)
  await day(12).dispatchEvent('pointerdown', { pointerType: 'touch', isPrimary: true, clientX: 10, clientY: 10 });
  await expect(sheet.locator('[data-gym-bulk]')).toContainText('1日を選択');
  await day(12).dispatchEvent('pointerup', { pointerType: 'touch', isPrimary: true });
  await day(12).dispatchEvent('click');
  await expect(day(12)).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('dialog[open] [data-gym-editor]')).toHaveCount(0);
  await expect(sheet.locator('[role="gridcell"][aria-selected]')).toHaveCount(0); // a day's state is its aria-pressed
  // a long press whose click never comes (the touch cancelled): the next tap still counts
  await sheet.locator('[data-gym-bulk-done]').click();
  await day(12).dispatchEvent('pointerdown', { pointerType: 'touch', isPrimary: true, clientX: 10, clientY: 10 });
  await expect(sheet.locator('[data-gym-bulk]')).toContainText('1日を選択');
  await day(12).dispatchEvent('pointercancel', { pointerType: 'touch', isPrimary: true });
  await day(13).click();
  await expect(day(13)).toHaveAttribute('aria-pressed', 'true');
});

test('someone else changed the day: 409 stale shows it as it is now; a poll that sees a change flashes the cell', async ({ page, context }) => {
  const { gym, day, editor } = await phone(page, context);
  await day(7).click();
  gym.lineTap(gym.days[7], 'skip'); // from LINE, after the page read it
  await editor.locator('[data-gym-kind="any"]').click();
  await expect(editor.locator('[data-gym-note]')).toHaveText('ほかの人が変更しました。いまの設定を表示しています。');
  await expect(day(7)).toHaveAttribute('data-fill', 'off');
  await expect(editor.locator('[data-gym-kind="off"]')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('dialog[open] .navbar button.nav.close').last().click();
  gym.lineTap(gym.days[9], 'any');
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange'))); // the next read
  await expect(day(9)).toHaveAttribute('data-fill', 'any');
  await expect(day(9)).toHaveClass(/flash/);
});

test('quick edits wait their turn: two to one day both apply (no 409), a failed one puts back only its day', async ({ page, context }) => {
  const { gym, calls, day, editor } = await phone(page, context);
  const close = () => page.locator('dialog[open] .navbar button.nav.close').last().click();
  let release = gym.hold();
  await day(5).click();
  await editor.locator('[data-gym-kind="any"]').click();
  await expect.poll(() => calls.act).toBe(1);
  await editor.locator('[data-gym-kind="off"]').click();
  await expect(day(5)).toHaveAttribute('data-fill', 'off'); // shown at once
  expect(calls.act).toBe(1); // sent once the first is answered
  release();
  await expect.poll(() => gym.acts.length).toBe(2);
  expect(gym.acts).toEqual([{ a: 'any', d: gym.days[5], base: 'v0' }, { a: 'skip', d: gym.days[5], base: 'v1' }]);
  await expect(day(5)).toHaveAttribute('data-fill', 'off');
  await expect(editor.locator('[data-gym-note]')).toHaveCount(0);
  await close();
  // the first fails while the second waits: only the first's day goes back
  release = gym.hold();
  gym.next({ status: 500, body: { ok: false, error: 'failed' } });
  await day(6).click();
  await editor.locator('[data-gym-kind="any"]').click();
  await expect.poll(() => calls.act).toBe(3);
  await close();
  await day(7).click();
  await editor.locator('[data-gym-kind="any"]').click();
  await expect(day(6)).toHaveAttribute('data-fill', 'any');
  await expect(day(7)).toHaveAttribute('data-fill', 'any');
  release();
  await expect(day(6)).toHaveAttribute('data-fill', 'none');
  await expect.poll(() => gym.acts.length).toBe(4);
  await expect(day(7)).toHaveAttribute('data-fill', 'any');
  expect(gym.acts.slice(2)).toEqual([{ a: 'any', d: gym.days[6], base: 'v0' }, { a: 'any', d: gym.days[7], base: 'v0' }]);
});

test('a refusal in the bot’s words; a failure rolls back with もう一度, which sends it again', async ({ page, context }) => {
  const { gym, day, editor } = await phone(page, context);
  await day(2).click();
  gym.next({ status: 422, body: { ok: false, error: 'day_passed', hint: '11/6（金）はもう過ぎています。' } });
  await editor.locator('[data-gym-kind="any"]').click();
  await expect(editor.locator('[data-gym-note]')).toHaveText('11/6（金）はもう過ぎています。');
  await expect(editor.locator('[data-gym-note] button')).toHaveCount(0);
  await expect(day(2)).toHaveAttribute('data-fill', 'usual'); // rolled back
  gym.next({ status: 500, body: { ok: false, error: 'failed' } });
  await editor.locator('[data-gym-kind="off"]').click();
  const note = editor.locator('[data-gym-note]');
  await expect(note).toContainText('変更できませんでした');
  await expect(day(2)).toHaveAttribute('data-fill', 'usual');
  await note.getByRole('button', { name: 'もう一度' }).click();
  await expect(day(2)).toHaveAttribute('data-fill', 'off');
  await expect(note).toHaveCount(0);
  expect(gym.acts.slice(-2)).toEqual([{ a: 'skip', d: gym.days[2], base: 'v0' }, { a: 'skip', d: gym.days[2], base: 'v0' }]);
});

test('the control row: stopping asks first, restarting doesn’t; 確認の間隔; 今すぐ確認’s answer and countdown', async ({ page, context }) => {
  const { gym, sheet } = await phone(page, context);
  const run = sheet.locator('[data-gym-run]');
  const check = sheet.locator('[data-gym-check]');
  await expect(run).toHaveText('チェック中・15分ごと');
  await run.click();
  const ask = page.locator('dialog[open]').last();
  await expect(ask).toContainText('チェックを停止しますか？');
  await expect(ask).toContainText('再開するまで、空きのお知らせは届きません。');
  await ask.locator('[data-action="cancel"]').click();
  expect(gym.acts).toEqual([]);
  await run.click();
  await page.locator('dialog[open] [data-action="stop"]').click();
  await expect(run).toHaveText('停止中');
  await expect(run).toHaveAttribute('data-gym-run', 'stopped');
  await expect(check).toHaveAttribute('aria-disabled', 'true');
  await expect(sheet.locator('[data-gym-stopped]')).toBeVisible();
  await run.click(); // restarts at once
  await expect(run).toHaveText('チェック中・15分ごと');
  expect(gym.acts).toEqual([{ a: 'pause' }, { a: 'resume' }]);
  await sheet.locator('[data-gym-interval-open]').click();
  await page.locator('dialog[open] [data-gym-interval="30"]').click();
  await expect(run).toHaveText('チェック中・30分ごと');
  expect(gym.acts.at(-1)).toEqual({ a: 'interval', m: 30 });
  // 🔎: a peek, its answer under the row, then a minute's countdown
  await check.click();
  const result = sheet.locator('[data-gym-result]');
  await expect(result).toContainText('🟢 いま空いている枠');
  await expect(result).toContainText('・12:00〜12:30　💪 パーソナルトレーニング');
  await expect(check).toHaveText(/^あと(60|59|58)秒$/);
  // the countdown never widens the row: nothing on the page runs past the screen's edge (it did on an iPhone 15)
  expect(await page.evaluate(() => [...document.querySelectorAll('dialog[open] [data-bots] *')].filter((e) => e.getBoundingClientRect().right > innerWidth + 0.5).length)).toBe(0);
  await expect(check).toHaveAttribute('aria-disabled', 'true');
  const first = Number((await check.textContent())!.match(/\d+/)![0]);
  await expect.poll(async () => Number((await check.textContent())!.match(/\d+/)![0])).toBeLessThan(first);
  await check.dispatchEvent('click'); // disabled (and ticking): nothing sent
  expect(gym.acts.filter((a) => a.a === 'check')).toHaveLength(1);
});

test('今すぐ確認 after a LINE 🔎: the cooldown counted from the Worker’s; a 429 the page didn’t know about is worded', async ({ page, context }) => {
  let gymRef: ReturnType<typeof fakeGym> | undefined;
  const { gym, sheet, rec } = await phone(page, context, (g) => (gymRef = g));
  const check = sheet.locator('[data-gym-check]');
  await expect(check).toHaveText('今すぐ確認');
  gym.next({ status: 429, body: { ok: false, error: 'cooldown', hint: '⏱️ 45秒ほど待ってから、もう一度お試しください。' }, headers: { 'Retry-After': '45' } });
  await check.click();
  await expect(sheet.locator('[data-gym-result]')).toHaveText(/⏱️ 45秒ほど待ってから、もう一度お試しください。/);
  await expect(check).toHaveText(/^あと4[3-5]秒$/);
  void gymRef;
  void rec;
});

test('screenshots, day and night (GYM_UI_SHOTS)', async ({ page, context }) => {
  const dir = process.env.GYM_UI_SHOTS;
  test.skip(!dir, 'GYM_UI_SHOTS=<dir> writes the screenshots');
  mkdirSync(dir!, { recursive: true });
  const { gym, sheet, day, editor } = await phone(page, context, (g) => {
    g.lineTap(g.days[1], 'any');
    g.lineTap(g.days[2], ['18:30', '20:00']);
    g.announce(g.days[2], ['18:30', '19:00']);
    g.lineTap(g.days[5], 'skip');
    g.lineTap(g.days[9], 'any');
    g.setFrom(g.days[9], Date.parse('2026-11-13T09:00:00+09:00'));
    g.lineTap(g.days[12], ['10:00', '12:00']);
  });
  for (const tod of ['day', 'night'] as const) {
    if (tod === 'night') await page.evaluate(() => document.documentElement.setAttribute('data-tod', 'night'));
    await sheet.locator('[data-gym-config]').evaluate((e) => e.scrollIntoView());
    await page.screenshot({ path: `${dir}/${tod}-calendar.png` });
    await sheet.locator('[data-gym-controls]').screenshot({ path: `${dir}/${tod}-controls.png` });
    await day(2).click();
    await editor.locator('[data-gym-slot="18:00"]').waitFor();
    await page.screenshot({ path: `${dir}/${tod}-editor.png` });
    gym.next({ status: 422, body: { ok: false, error: 'from_after_window', hint: 'その時刻からだと、11/6（金）の ⏰ 18:30〜20:00 の枠は残りません。先に時間帯を変えてください。' } });
    await editor.locator('[data-gym-kind="any"]').click();
    await editor.locator('[data-gym-note]').waitFor();
    await page.screenshot({ path: `${dir}/${tod}-refusal.png` });
    await page.locator('dialog[open] .navbar button.nav.close').last().click();
    await sheet.locator('[data-gym-select]').click();
    await sheet.locator('[data-gym-weekday="5"]').click();
    await day(4).click();
    await sheet.locator('[data-gym-bulk]').scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${dir}/${tod}-select.png` });
    await sheet.locator('[data-gym-bulk]').screenshot({ path: `${dir}/${tod}-bulkbar.png` });
    await sheet.locator('[data-gym-bulk-done]').click();
  }
});
