// ボット → ジム's settings (docs/design.md "Bots"; the brief's app half): the verdict's ⋯ (its rows per state; stop asks
// first, restart at once, 確認の間隔, 今すぐ確認 with its cooldown in the label and its answer on the result line), the
// calendar (2 weeks from today, 4 in the select mode; the 4-day default, VoiceOver's grid and its arrow keys, 44px), the day editor (instant, 取り消す, the slot chips, 通知の開始's start day and time: Fri from Tue 18:00,
// moved, cleared, the bot's refusals), select mode and one bulk
// act, a 409 stale, quick edits sent in turn, the bot's refusals in its words, a failure with もう一度, and a poll's change
// flashed. The Worker is e2e/gymbot.ts's stand-in (page.route; every act's body kept), at the record's pinned time
// (11/4（水） 12:00). With GYM_UI_SHOTS=<dir>, the last test also writes the screenshots, day and night.
import { mkdirSync } from 'node:fs';
import { expect, test, type BrowserContext, type Page } from './fixtures.ts';
import { fromMenu } from './hud.ts';
import { islandUp } from './island.ts';
import { newRecord } from './record.ts';
import { fakeGym, routeGym } from './gymbot.ts';
import { at } from '../src/lib/gym/contract.ts';

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
  await expect(sheet.locator('[data-gym-day]')).toHaveCount(14);
  const day = (i: number) => sheet.locator(`[data-gym-day="${gym.days[i]}"]`);
  const editor = page.locator('dialog[open] [data-gym-editor]');
  return { gym, calls, sheet, day, editor, rec };
}

test('the calendar: 2 weeks from today, the 4-day default and why, a grid VoiceOver reads, 44px', async ({ page, context }) => {
  const { sheet, day, gym } = await phone(page, context, (g) => {
    g.lineTap(g.days[5], 'any');
    g.setFrom(g.days[5], Date.parse('2026-11-09T18:00:00+09:00'));
    g.lineTap(g.days[6], ['18:30', '20:00']);
    g.announce(g.days[6], ['18:30', '19:00']);
    g.lineTap(g.days[8], 'skip');
  });
  const grid = sheet.getByRole('grid', { name: '日ごとの通知（2週間）' });
  await expect(grid.getByRole('row')).toHaveCount(3); // the weekdays and 2 weeks
  await expect(grid.getByRole('columnheader')).toHaveText(['水', '木', '金', '土', '日', '月', '火']); // today's first
  await expect(grid.locator('.cell.out')).toHaveCount(0); // today + 13 days: no blank start
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
  // the legend folded, the note always shown
  await expect(sheet.locator('[data-gym-legend]')).toBeHidden();
  await sheet.locator('[data-gym-legend-fold] summary').click();
  await expect(sheet.locator('[data-gym-legend] > span')).toHaveText(['終日', '時間指定', 'ふだん', 'オフ', '開始時刻', '通知済み']);
  // 44px: the days, ⋯
  for (const el of [day(0), day(13), sheet.locator('[data-gym-menu]')]) { // (選択: the kit's small chip, 32px in a 44px hit)
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
  await expect(day(13)).toBeFocused(); // that row's last day
  await page.keyboard.press('ArrowUp');
  await expect(day(6)).toBeFocused();
  await page.keyboard.press('ArrowUp'); // above: the weekdays
  await expect(day(6)).toBeFocused();
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
  await expect.poll(() => gym.acts).toEqual([{ a: 'any', d: gym.days[5], base: 'v0' }]);
  const toast = page.locator('.banner');
  await expect(toast).toContainText('11/9（月） 終日にしました');
  await toast.getByRole('button', { name: '取り消す' }).click();
  await expect(day(5)).toHaveAttribute('data-fill', 'none');
  await expect.poll(() => gym.acts.at(-1)).toEqual({ a: 'reset', d: gym.days[5], base: 'v1' }); // a 未チェック day: back with a reset
  // a ふだん day: back with its usual window, and ふだんに戻す once it has a rule
  await page.locator('dialog[open] .navbar button.nav.close').last().click();
  await day(1).click();
  await editor.locator('[data-gym-kind="off"]').click();
  await expect(day(1)).toHaveAttribute('data-fill', 'off');
  await expect(editor.locator('[data-gym-reset]')).toHaveText('ふだんに戻す');
  await editor.locator('[data-gym-reset]').click();
  await expect(day(1)).toHaveAttribute('data-fill', 'usual');
  await expect.poll(() => gym.acts.slice(-2)).toEqual([{ a: 'skip', d: gym.days[1], base: 'v0' }, { a: 'reset', d: gym.days[1], base: 'v1' }]);
});

test('時間指定: a tap starts an hour, the next picks the last slot, 21:30 ends at 22:00; 通知の開始’s times the bot would refuse are disabled', async ({ page, context }) => {
  const { gym, day, editor } = await phone(page, context, (g) => g.announce(g.days[6], ['18:30']));
  await day(6).click();
  await editor.locator('[data-gym-kind="range"]').click();
  await expect.poll(() => gym.acts.at(-1)).toEqual({ a: 'range', d: gym.days[6], s: '12:00', e: '13:00', base: 'v0' });
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
  await expect.poll(() => gym.acts.slice(1).map((a) => 'e' in a && `${a.s}-${a.e}`)).toEqual(['18:00-19:00', '18:00-20:00', '18:00-19:00', '21:30-22:00']);
  // 通知の開始: 時刻, then a time before the window's last slot (on the day itself: its start day by default)
  await editor.locator('[data-gym-from="at"]').click();
  await expect(editor.locator('[data-gym-from-date]')).toHaveValue(gym.days[6]);
  const pick = editor.locator('[data-gym-from-time]');
  const opt = (d: string, c: string) => pick.locator(`option[value="${at(d, c)}"]`);
  await expect(opt(gym.days[6], '21:00')).toBeEnabled();
  await expect(opt(gym.days[6], '21:30')).toHaveCount(0); // the window's last slot starts then: not offered
  await pick.selectOption(String(at(gym.days[6], '20:00')));
  await expect(day(6).locator('[data-gym-from]')).toBeVisible();
  await expect.poll(() => gym.acts.at(-1)).toMatchObject({ a: 'from', d: gym.days[6], at: at(gym.days[6], '20:00') });
  await editor.locator('[data-gym-from="now"]').click();
  await expect.poll(() => gym.acts.at(-1)).toMatchObject({ a: 'unfrom', d: gym.days[6] });
  await expect(day(6).locator('[data-gym-from]')).toHaveCount(0);
  // today past noon: no time before the usual window's last slot (12:30) is ahead
  await page.locator('dialog[open] .navbar button.nav.close').last().click();
  await day(0).click();
  await editor.locator('[data-gym-from="at"]').click();
  await expect(editor.locator('[data-gym-from-none]')).toHaveText('この日の枠に間に合う開始時刻は、もうありません');
  await expect(editor.locator('[data-gym-from-date], [data-gym-from-time]')).toHaveCount(0);
});

test('⏳ on an earlier day: Fri from Tue 18:00 (the 3-booking limit), moved, edited, cleared; the bot’s refusals', async ({ page, context }) => {
  const { gym, day, editor } = await phone(page, context);
  const [tue, fri] = [gym.days[6], gym.days[9]]; // 11/10（火）, 11/13（金）; today 11/4（水） 12:00
  await day(9).click();
  await editor.locator('[data-gym-kind="range"]').click(); // 12:00〜13:00
  await editor.locator('[data-gym-from="at"]').click();
  await expect(editor.locator('[data-gym-from-why]')).toContainText('予約は同時に3件まで');
  const date = editor.locator('[data-gym-from-date]');
  const time = editor.locator('[data-gym-from-time]');
  // the dates: today to the day, none before today or after the day; weekday and today / the day marked
  const labels = await date.locator('option').allTextContents();
  expect(labels).toHaveLength(10);
  expect([labels[0], labels[6], labels[9]]).toEqual(['11/4（水）（今日）', '11/10（火）', '11/13（金）（当日）']);
  await expect(date).toHaveAccessibleName('開始日');
  await expect(time).toHaveAccessibleName('開始時刻');
  for (const el of [date, time]) expect((await el.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  // today: none of the passed half hours is offered (now 12:00)
  await date.selectOption(gym.days[0]);
  const today = (await time.locator('option:not([disabled])').allTextContents());
  expect(today[0]).toBe('12:30');
  expect(today.filter((c) => c <= '12:00')).toEqual([]);
  expect(today).toHaveLength(23); // 12:30 … 23:30
  // Tue 18:00 for Fri: any half hour that day, the window doesn't apply before the day
  await date.selectOption(tue);
  expect(gym.acts.at(-1)!.a).toBe('range'); // a day alone sends nothing
  await expect(time).toHaveValue('');
  await expect(time.locator('option:not([disabled])')).toHaveCount(48);
  await time.selectOption(String(at(tue, '18:00')));
  await expect.poll(() => gym.acts.at(-1)).toMatchObject({ a: 'from', d: fri, at: at(tue, '18:00') });
  await expect(editor.locator('[data-gym-editor-now] small')).toHaveText('11/10（火）18:00から');
  await expect(day(9)).toHaveAttribute('aria-label', '11/13（金）、12:00〜13:00、11/10（火）18:00から');
  await expect(page.locator('.banner')).toContainText('11/13（金） 11/10（火）18:00からにしました');
  // reopened: prefilled with its day and time
  await page.locator('dialog[open] .navbar button.nav.close').last().click();
  await day(9).click();
  await expect(editor.locator('[data-gym-from="at"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(date).toHaveValue(tue);
  await expect(time).toHaveValue(String(at(tue, '18:00')));
  // another day keeps its time; on the day itself 18:00 is after the window, so the time is asked for, and the
  // saved one said to stay until then
  await date.selectOption(gym.days[7]);
  await expect.poll(() => gym.acts.at(-1)).toMatchObject({ a: 'from', d: fri, at: at(gym.days[7], '18:00') });
  await expect(time).toHaveValue(String(at(gym.days[7], '18:00')));
  await expect(editor.locator('[data-gym-from-kept]')).toHaveCount(0);
  const sent = gym.acts.length;
  await date.selectOption(fri);
  await expect(time).toHaveValue('');
  await expect(editor.locator('[data-gym-from-kept]')).toHaveText('18:00 はこの日は選べません。時刻を選ぶまで 11/11（水）18:00 のままです');
  expect(await time.locator('option:not([disabled])').allTextContents()).toEqual([
    '00:00', '00:30', '01:00', '01:30', '02:00', '02:30', '03:00', '03:30', '04:00', '04:30', '05:00', '05:30',
    '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00'
  ]); // ⏰ 12:00〜13:00: none after 12:00 offered
  expect(gym.acts.length).toBe(sent);
  // the bot refuses a time that passed meanwhile (its words), and the day is shown as it is
  gym.next({ status: 422, body: { ok: false, error: 'from_passed', hint: 'その日時はもう過ぎています。' } });
  await time.selectOption(String(at(fri, '09:00')));
  await expect(editor.locator('[data-gym-note]')).toHaveText('その日時はもう過ぎています。');
  await expect(editor.locator('[data-gym-editor-now] small')).toHaveText('11/11（水）18:00から');
  await expect(date).toHaveValue(gym.days[7]); // the saved one, in force, shows
  // cleared: すぐ
  await editor.locator('[data-gym-from="now"]').click();
  await expect.poll(() => gym.acts.at(-1)).toMatchObject({ a: 'unfrom', d: fri });
  await expect(day(9).locator('[data-gym-from]')).toHaveCount(0);
  // a first ⏳ refused: the day picked stays (no jump back to the day itself)
  await editor.locator('[data-gym-from="at"]').click();
  await date.selectOption(tue);
  gym.next({ status: 422, body: { ok: false, error: 'from_passed', hint: 'その日時はもう過ぎています。' } });
  await time.selectOption(String(at(tue, '18:00')));
  await expect(editor.locator('[data-gym-note]')).toHaveText('その日時はもう過ぎています。');
  await expect(day(9).locator('[data-gym-from]')).toHaveCount(0);
  await expect(date).toHaveValue(tue);
  await expect(time).toHaveValue('');
  // 🔕 clears it, as LINE's
  await time.selectOption(String(at(tue, '18:00')));
  await expect(day(9).locator('[data-gym-from]')).toBeVisible();
  await editor.locator('[data-gym-kind="off"]').click();
  await expect(day(9).locator('[data-gym-from]')).toHaveCount(0);
  await expect(editor.locator('[data-gym-from-date]')).toHaveCount(0);
});

test('⏳ set by the other member meanwhile: 409 stale shows theirs, prefilled; their ⏰ then disables the late times', async ({ page, context }) => {
  const { gym, day, editor } = await phone(page, context, (g) => g.lineTap(g.days[9], 'any'));
  await day(9).click();
  await editor.locator('[data-gym-from="at"]').click();
  gym.setFrom(gym.days[9], at(gym.days[8], '20:00'));
  gym.lineTap(gym.days[9], 'any'); // their change: the base moves
  await editor.locator('[data-gym-from-date]').selectOption(gym.days[6]);
  await editor.locator('[data-gym-from-time]').selectOption(String(at(gym.days[6], '18:00')));
  await expect(editor.locator('[data-gym-note]')).toHaveText('ほかの人が変更しました。いまの設定を表示しています。');
  await expect(editor.locator('[data-gym-from-date]')).toHaveValue(gym.days[8]); // theirs, prefilled
  await expect(editor.locator('[data-gym-from-time]')).toHaveValue(String(at(gym.days[8], '20:00')));
  // their ⏰ 12:00〜13:00 meanwhile: on the day itself, 12:30 and later aren't offered
  gym.lineTap(gym.days[9], ['12:00', '13:00']);
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await expect(day(9)).toContainText('12–13');
  await editor.locator('[data-gym-from-date]').selectOption(gym.days[9]);
  expect((await editor.locator('[data-gym-from-time] option:not([disabled])').allTextContents()).at(-1)).toBe('12:00');
});

test('⏳ on a 🔔 day ends at 21:00 (21:30 the bot refuses); a ⏰ that leaves the ⏳ no slot clears it, said, undone', async ({ page, context }) => {
  const { gym, day, editor } = await phone(page, context, (g) => g.lineTap(g.days[9], 'any'));
  await day(9).click();
  await editor.locator('[data-gym-from="at"]').click();
  const time = editor.locator('[data-gym-from-time]');
  expect((await time.locator('option:not([disabled])').allTextContents()).at(-1)).toBe('21:00');
  await expect(time.locator(`option[value="${at(gym.days[9], '21:30')}"]`)).toHaveCount(0);
  await time.selectOption(String(at(gym.days[9], '20:00')));
  await expect(day(9).locator('[data-gym-from]')).toBeVisible();
  // ⏰ 12:00〜13:00 leaves nothing after 20:00: cleared at once, and the banner says so
  await editor.locator('[data-gym-kind="range"]').click();
  await expect(day(9).locator('[data-gym-from]')).toHaveCount(0);
  await expect(time).toHaveValue(''); // 時刻 still chosen here, no time: a new one can be picked
  await expect(editor.locator('[data-gym-editor-now] small')).toHaveCount(0);
  const toast = page.locator('.banner');
  await expect(toast).toContainText('11/13（金） 12:00〜13:00にしました。開始時刻は時間帯の外になったので解除しました');
  // 取り消す: 🔔 back first, then the ⏳
  await toast.getByRole('button', { name: '取り消す' }).click();
  await expect(day(9)).toHaveAttribute('data-fill', 'any');
  await expect(day(9).locator('[data-gym-from]')).toBeVisible();
  await expect.poll(() => gym.acts.slice(-2)).toMatchObject([{ a: 'any', d: gym.days[9] }, { a: 'from', d: gym.days[9], at: at(gym.days[9], '20:00') }]);
  // a ⏳ that has passed (today 11:00), not yet dropped by the bot: the editor shows checks started (すぐ)
  gym.lineTap(gym.days[10], 'any');
  gym.setFrom(gym.days[10], at(gym.days[0], '11:00'));
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await page.locator('dialog[open] .navbar button.nav.close').last().click();
  await day(10).click();
  await expect(editor.locator('[data-gym-from="now"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(editor.locator('[data-gym-editor-now] small')).toHaveCount(0);
});


test('select mode: weekday headers and days, one bulk act, one 取り消す; 時間指定 for them all; a long press starts it', async ({ page, context }) => {
  const { gym, day, sheet } = await phone(page, context);
  await sheet.locator('[data-gym-select]').click();
  const bar = sheet.locator('[data-gym-bulk]');
  await expect(bar).toContainText('日付か曜日を選んでください');
  await expect(sheet.locator('[data-gym-day]')).toHaveCount(25); // 4 weeks while selecting: a column reaches no hidden day
  await sheet.locator('[data-gym-weekday="3"]').click(); // 土 (today's Wednesday first): 11/7, 14, 21, 28
  await expect(bar).toContainText('4日を選択');
  await day(5).click();
  await expect(bar).toContainText('5日を選択');
  await expect(day(5)).toHaveAttribute('aria-pressed', 'true');
  await bar.locator('[data-gym-bulk-act="skip"]').click();
  for (const i of [3, 5, 10, 17, 24]) await expect(day(i)).toHaveAttribute('data-fill', 'off');
  await expect.poll(() => gym.acts).toHaveLength(1);
  await expect.poll(() => gym.acts[0]).toEqual({ a: 'skip', days: [3, 5, 10, 17, 24].map((i) => ({ d: gym.days[i], base: 'v0' })) });
  const toast = page.locator('.banner');
  await expect(toast).toContainText('5日をオフにしました');
  await toast.getByRole('button', { name: '取り消す' }).click();
  await expect(day(3)).toHaveAttribute('data-fill', 'usual');
  await expect(day(10)).toHaveAttribute('data-fill', 'none');
  // undone in two acts: 11/7 back to ふだん's window, the rest reset
  await expect.poll(() => gym.acts.slice(1)).toEqual([
    { a: 'range', s: '12:00', e: '13:00', d: gym.days[3], base: 'v1' },
    { a: 'reset', days: [5, 10, 17, 24].map((i) => ({ d: gym.days[i], base: 'v1' })) }
  ]);
  await bar.locator('[data-gym-bulk-act="range"]').click();
  const pick = page.locator('dialog[open] [data-gym-bulk-range]');
  await pick.locator('[data-gym-slot="18:00"]').click();
  await pick.locator('[data-gym-slot="19:30"]').click();
  await page.locator('dialog[open] [data-gym-bulk-range-apply]').click();
  await expect(day(17)).toContainText('18–20');
  await expect.poll(() => gym.acts.at(-1)).toMatchObject({ a: 'range', s: '18:00', e: '20:00' });
  await bar.locator('[data-gym-bulk-done]').click();
  await expect(bar).toHaveCount(0);
  await expect(sheet.locator('[data-gym-day]')).toHaveCount(14);
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
  await expect.poll(() => gym.acts).toEqual([{ a: 'any', d: gym.days[5], base: 'v0' }, { a: 'skip', d: gym.days[5], base: 'v1' }]);
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
  await expect.poll(() => gym.acts.slice(2)).toEqual([{ a: 'any', d: gym.days[6], base: 'v0' }, { a: 'any', d: gym.days[7], base: 'v0' }]);
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
  await expect.poll(() => gym.acts.slice(-2)).toEqual([{ a: 'skip', d: gym.days[2], base: 'v0' }, { a: 'skip', d: gym.days[2], base: 'v0' }]);
});

/** ⋯ opened: its rows' ids and labels (ActionSheet's), each off or not. */
async function menuRows(page: Page, sheet: ReturnType<Page['locator']>) {
  await sheet.locator('[data-gym-menu]').click();
  const rows = page.locator('dialog[open] [data-action]');
  await expect(rows.first()).toBeVisible();
  return rows;
}

test('⋯: its rows per state; stopping asks first, restarting doesn’t; 確認の間隔', async ({ page, context }) => {
  const { gym, sheet } = await phone(page, context);
  const verdict = sheet.locator('[data-gym-verdict]');
  const menu = sheet.locator('[data-gym-menu]');
  const [m, w] = [(await menu.boundingBox())!, (await verdict.locator('.word').boundingBox())!];
  expect(Math.abs(m.y + m.height / 2 - (w.y + w.height / 2))).toBeLessThan(8); // on the word's row
  let rows = await menuRows(page, sheet);
  await expect(rows).toHaveText(['今すぐ確認', '確認を停止', '確認の間隔 · 15分ごと ›']);
  await expect(page.locator('dialog[open]').last()).toHaveAccessibleName('ジムの操作');
  await page.locator('dialog[open] [data-action="stop"]').click();
  const ask = page.getByRole('dialog', { name: 'チェックを停止しますか？' });
  await expect(ask).toContainText('チェックを停止しますか？');
  await expect(ask).toContainText('再開するまで、空きのお知らせは届きません。');
  await ask.locator('[data-action="cancel"]').click();
  expect(gym.acts).toEqual([]);
  await menuRows(page, sheet);
  await page.locator('dialog[open] [data-action="stop"]').click();
  await ask.locator('[data-action="stop"]').click();
  await expect.poll(() => gym.acts).toEqual([{ a: 'pause' }]);
  // stopped: 確認を再開 first (at once), 今すぐ確認 off
  rows = await menuRows(page, sheet);
  await expect(rows).toHaveText(['確認を再開', '今すぐ確認', '確認の間隔 · 15分ごと ›']);
  await expect(page.locator('dialog[open] [data-action="check"]')).toHaveAttribute('aria-disabled', 'true');
  await page.locator('dialog[open] [data-action="resume"]').click();
  await expect.poll(() => gym.acts).toEqual([{ a: 'pause' }, { a: 'resume' }]);
  await menuRows(page, sheet);
  await page.locator('dialog[open] [data-action="interval"]').click();
  await page.locator('dialog[open] [data-gym-interval="30"]').click();
  await expect.poll(() => gym.acts.at(-1)).toEqual({ a: 'interval', m: 30 });
  rows = await menuRows(page, sheet);
  await expect(rows.last()).toHaveText('確認の間隔 · 30分ごと ›');
});

test('今すぐ確認: its answer on the result line with the cooldown’s tail, gone when it ends; its label counts down', async ({ page, context }) => {
  const { gym, sheet } = await phone(page, context);
  await menuRows(page, sheet);
  await page.locator('dialog[open] [data-action="check"]').click();
  const result = sheet.locator('[data-gym-verdict] [data-gym-result]');
  await expect(result).toContainText('12:00の確認：空き1枠');
  await expect(result).toContainText('11/5（木） 12:00〜12:30');
  const tail = result.locator('[data-gym-wait]');
  await expect(tail).toHaveText(/^· 次はあと(60|5\d)秒$/);
  const first = Number((await tail.textContent())!.match(/\d+/)![0]);
  await expect.poll(async () => Number((await tail.textContent())!.match(/\d+/)![0])).toBeLessThan(first);
  // nothing on the page runs past the screen's edge (a countdown widened a row on an iPhone 15)
  expect(await page.evaluate(() => [...document.querySelectorAll('dialog[open] [data-bots] *')].filter((e) => e.getBoundingClientRect().right > innerWidth + 0.5).length)).toBe(0);
  await menuRows(page, sheet);
  const check = page.locator('dialog[open] [data-action="check"]');
  await expect(check).toHaveText(/^今すぐ確認（あと(5\d|60)秒）$/);
  await expect(check).toHaveAttribute('aria-disabled', 'true');
  await check.dispatchEvent('click'); // off (and ticking): nothing sent
  await expect.poll(() => gym.acts.filter((a) => a.a === 'check')).toHaveLength(1);
});

test('今すぐ確認 after a LINE 🔎: the cooldown counted from the Worker’s; a 429 the page didn’t know about is worded on the result line', async ({ page, context }) => {
  const { gym, sheet } = await phone(page, context);
  gym.next({ status: 429, body: { ok: false, error: 'cooldown', hint: '⏱️ 45秒ほど待ってから、もう一度お試しください。' }, headers: { 'Retry-After': '45' } });
  await menuRows(page, sheet);
  await page.locator('dialog[open] [data-action="check"]').click();
  await expect(sheet.locator('[data-gym-result]')).toHaveText(/⏱️ 45秒ほど待ってから、もう一度お試しください。/);
  await menuRows(page, sheet);
  await expect(page.locator('dialog[open] [data-action="check"]')).toHaveText(/^今すぐ確認（あと4[3-5]秒）$/);
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
    await sheet.locator('[data-gym-verdict]').screenshot({ path: `${dir}/${tod}-verdict.png` });
    await day(2).click();
    await editor.locator('[data-gym-slot="18:00"]').waitFor();
    await page.screenshot({ path: `${dir}/${tod}-editor.png` });
    gym.next({ status: 422, body: { ok: false, error: 'from_after_window', hint: 'その時刻からだと、11/6（金）の ⏰ 18:30〜20:00 の枠は残りません。先に時間帯を変えてください。' } });
    await editor.locator('[data-gym-kind="any"]').click();
    await editor.locator('[data-gym-note]').waitFor();
    await page.screenshot({ path: `${dir}/${tod}-refusal.png` });
    await page.locator('dialog[open] .navbar button.nav.close').last().click();
    await sheet.locator('[data-gym-select]').click();
    await sheet.locator('[data-gym-weekday="3"]').click();
    await day(4).click();
    await sheet.locator('[data-gym-bulk]').scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${dir}/${tod}-select.png` });
    await sheet.locator('[data-gym-bulk]').screenshot({ path: `${dir}/${tod}-bulkbar.png` });
    await sheet.locator('[data-gym-bulk-done]').click();
  }
});
