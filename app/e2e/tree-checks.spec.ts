// The tree popup's daily checks (docs/design.md "Daily checks"): 顔, HIIT, Core under the meals, on phones paired with a
// record of their own (e2e/record.ts: the relay's real code). HIIT ticks itself from the day's Shortcut workouts (a dot
// says so); my taps flip my own checks (`check` events: true / false by hand, null back to the workouts), all three
// shows 「ぜんぶ」 with sparkles and pays RULES.checks = 0 ベル (the ledger unchanged); the partner's tree and the guest's
// phone show the row read-only. Taps, not clicks (iPhone Safari).
import { expect, test, type Browser, type Page } from './fixtures.ts';
import { camTo, islandUp, tapOn } from './island.ts';
import { GOAL_TREES } from '../src/lib/world/world.ts';
import { newRecord } from './record.ts';
import { FACE_VIDEO } from '../src/lib/model/checks.ts';

type Rec = ReturnType<typeof newRecord>;

/** A fresh phone paired as `who` on `rec`, on the island. */
async function phone(browser: Browser, rec: Rec, who: 'A' | 'B' | 'G') {
  const context = await browser.newContext({ viewport: { width: 393, height: 852 }, hasTouch: true, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', serviceWorkers: 'block' });
  await rec.pair(context, who);
  const page = await context.newPage();
  await page.goto('');
  await islandUp(page);
  return page;
}

const row = (page: Page) => page.locator('.detail [data-checks]');
const item = (page: Page, k: string) => row(page).locator(`[data-check=${k}]`);
/** Each check's [done, source]. */
const states = (page: Page) =>
  row(page).locator('[data-check]').evaluateAll((els) => els.map((e) => [(e as HTMLElement).dataset.check, e.hasAttribute('data-done'), (e as HTMLElement).dataset.src ?? null]));
const sentChecks = (rec: Rec) => rec.sent.filter((s) => s.type === 'check').map((s) => [s.who, s.data, s.ok]);

/** 2026-11-04 (the pinned day): A's HIIT at 07:10 and an outdoor walk (not kept); B's Core yesterday only. */
function workouts(rec: Rec) {
  expect(rec.ingest('A', { workout_types: 'High Intensity Interval Training\nOutdoor Walk', workout_dates: 'Nov 4, 2026 at 7:10 AM\nNov 4, 2026 at 8:00 AM' })).toMatchObject({ ok: true, metrics: 1 });
  expect(rec.ingest('B', { workout_types: 'Core Training', workout_dates: 'Nov 3, 2026 at 9:00 PM' })).toMatchObject({ ok: true, metrics: 1 });
}

test('my checks: HIIT from the workouts, taps flip each, all three shows ぜんぶ and pays nothing, a reload keeps them', async ({ browser }) => {
  const rec = newRecord();
  workouts(rec);
  const page = await phone(browser, rec, 'A');
  await tapOn(page, 'goal', 'A');
  await expect(row(page).locator('[data-check]')).toHaveText(['顔', 'HIIT', 'Core']);
  expect(await states(page)).toEqual([['face', false, null], ['hiit', true, 'workout'], ['core', false, null]]);
  await expect(item(page, 'hiit')).toHaveAccessibleName('HIIT できた（ワークアウト）');
  await expect(row(page).locator('.ghost')).toHaveText('ぜんぶ');
  const total = await page.locator('.detail [data-v=total]').textContent();

  // ticking 顔 opens its video in a new page (iOS: the YouTube app or Safari), the tap's own; never the network here
  await page.context().route(/^https:\/\/(youtu\.be|(www\.|m\.)?youtube\.com)\//, (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '' }));
  const video = page.context().waitForEvent('page');
  await item(page, 'face').tap();
  expect((await video).url()).toBe(FACE_VIDEO);
  await (await video).close();
  // each tap leaves the popup open (the scene's tap-away lets the popup's own buttons be: IslandScene)
  await expect(page.locator('.detail')).toBeVisible();
  await item(page, 'core').tap();
  await expect(page.locator('.detail')).toBeVisible();
  expect(await states(page)).toEqual([['face', true, 'hand'], ['hiit', true, 'workout'], ['core', true, 'hand']]);
  await expect(row(page).locator('.chip.all')).toHaveText('ぜんぶ');
  await expect(row(page).locator('.chip.all')).toHaveAccessibleName('まいにちの 3つ ぜんぶ できた');
  // RULES.checks is 0: the ledger as it was, no +0 anywhere
  await expect(page.locator('.detail [data-v=total]')).toHaveText(total!);
  await expect(page.locator('.detail')).not.toContainText('+0 ベル');
  await expect.poll(() => sentChecks(rec)).toEqual([
    ['A', { d: '2026-11-04', k: 'face', v: true }, true],
    ['A', { d: '2026-11-04', k: 'core', v: true }, true]
  ]);

  // a workout's check unset by hand (false), then handed back to the workouts (null)
  await item(page, 'hiit').tap();
  await expect(page.locator('.detail')).toBeVisible();
  expect(await states(page)).toEqual([['face', true, 'hand'], ['hiit', false, 'hand'], ['core', true, 'hand']]);
  await expect(item(page, 'hiit')).toHaveAccessibleName('HIIT はずした（ワークアウトは ある）');
  await expect(row(page).locator('.chip.all')).toHaveCount(0);
  await item(page, 'hiit').tap();
  expect(await states(page)).toEqual([['face', true, 'hand'], ['hiit', true, 'workout'], ['core', true, 'hand']]);
  await expect.poll(() => sentChecks(rec).slice(2)).toEqual([
    ['A', { d: '2026-11-04', k: 'hiit', v: false }, true],
    ['A', { d: '2026-11-04', k: 'hiit', v: null }, true]
  ]);
  // the popup stays open through the taps (they never reach the scene's tap-away)
  await expect(page.locator('.detail')).toBeVisible();

  await page.reload();
  await islandUp(page);
  await tapOn(page, 'goal', 'A');
  expect(await states(page)).toEqual([['face', true, 'hand'], ['hiit', true, 'workout'], ['core', true, 'hand']]);
  await expect(row(page).locator('.chip.all')).toBeVisible();

  // un-ticking 顔 only un-ticks: no video
  let opened = 0;
  page.context().on('page', () => opened++);
  await item(page, 'face').tap();
  expect(await states(page)).toEqual([['face', false, null], ['hiit', true, 'workout'], ['core', true, 'hand']]);
  await expect.poll(() => sentChecks(rec).at(-1)).toEqual(['A', { d: '2026-11-04', k: 'face', v: null }, true]);
  expect(opened).toBe(0);
});

test('the partner’s tree and the guest’s phone: the row read-only, each person’s own day', async ({ browser }) => {
  const rec = newRecord();
  workouts(rec);
  expect(rec.event('B', 'check', { d: '2026-11-04', k: 'face', v: true })).toMatchObject({ ok: true });
  const a = await phone(browser, rec, 'A');
  await tapOn(a, 'goal', 'B');
  // B's Core was yesterday's: not today's
  expect(await states(a)).toEqual([['face', true, 'hand'], ['hiit', false, null], ['core', false, null]]);
  await expect(row(a).locator('button')).toHaveCount(0);

  const g = await phone(browser, rec, 'G');
  await camTo(g, GOAL_TREES.A[1]); // (the guest's phone opens at its own villager)
  await tapOn(g, 'goal', 'A');
  expect(await states(g)).toEqual([['face', false, null], ['hiit', true, 'workout'], ['core', false, null]]);
  await expect(row(g).locator('button')).toHaveCount(0);
  expect(sentChecks(rec)).toEqual([]);
  // the record refuses the guest's own anyway
  expect(rec.event('G', 'check', { d: '2026-11-04', k: 'face', v: true })).toMatchObject({ ok: false, error: 'forbidden' });
});
