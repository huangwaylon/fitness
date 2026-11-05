// Who draws each person (components/person3d/person3d.ts; docs/design.md "Players"): the look they wear picks their
// model on the island (world3d/villagers.ts), in the tent and in the museum, and a change of look (on leaving すがた)
// swaps it where they stand, the old one drawn till the new one is in. On a record of its own (e2e/record.ts), in the
// logic tier's way (nothing drawn; the scenes and their hooks run).
import { expect, test, type Browser, type Page } from '@playwright/test';
import { fromMenu, hudMenu } from './hud.ts';
import { newRecord } from './record.ts';
import { ROSTER } from '../src/lib/villagers/roster.ts';

type Rec = ReturnType<typeof newRecord>;

async function phone(browser: Browser, rec: Rec, who: 'A' | 'B' | 'G') {
  const context = await browser.newContext({ viewport: { width: 393, height: 852 }, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', serviceWorkers: 'block' });
  await context.addInitScript(() => localStorage.setItem('e2e.render', 'none'));
  await rec.pair(context, who);
  const page = await context.newPage();
  await page.goto('?critter=none&visitor=none');
  await expect(hudMenu(page)).toBeVisible();
  return page;
}

type V3 = { model(slot: string): string | null; last(slot: string): { x: number; z: number } | null };
/** The island's model for a slot (mine, partner, third): person3d's key, null till one is in. */
const model = (page: Page, slot: string) =>
  page.evaluate((s) => (window as unknown as { __villagers3?: V3 }).__villagers3?.model(s) ?? null, slot);
const settings = (page: Page) => page.locator('dialog[open]').first();
const back = (page: Page) => settings(page).locator('.titlebar .back').click();

test('the look picks the model; a new look swaps it where it stands', async ({ browser }) => {
  test.setTimeout(60_000);
  const rec = newRecord();
  const a = await phone(browser, rec, 'A');
  // いつもの: the human player (until the player runtime is on, the villager: A's goldie, B's anchovy)
  await expect.poll(() => model(a, 'mine'), { timeout: 30_000 }).toBe('v:goldie');
  await expect.poll(() => model(a, 'partner'), { timeout: 30_000 }).toBe('v:anchovy');

  // むらびとの すがた: Raymond
  await fromMenu(a, 'settings');
  await settings(a).locator('[data-push=look]').click();
  await settings(a).locator('[data-push=villager]').click();
  const name = ROSTER.raymond.nameJa;
  await settings(a).getByRole('searchbox').fill(name);
  await settings(a).getByRole('radio', { name }).click();
  await back(a);
  await back(a);
  await a.keyboard.press('Escape');
  await expect(settings(a)).toBeHidden();
  const was = await a.evaluate(() => (window as unknown as { __villagers3: V3 }).__villagers3.last('mine'));
  await expect.poll(() => model(a, 'mine'), { timeout: 30_000 }).toBe('v:raymond');
  // (in place: where it stood)
  const now = await a.evaluate(() => (window as unknown as { __villagers3: V3 }).__villagers3.last('mine'));
  expect(Math.hypot(now!.x - was!.x, now!.z - was!.z)).toBeLessThan(1);
  expect(await model(a, 'partner')).toBe('v:anchovy');

  // a phone opening later draws it too
  const b = await phone(browser, rec, 'B');
  await expect.poll(() => model(b, 'partner'), { timeout: 30_000 }).toBe('v:raymond');
  await expect.poll(() => model(b, 'mine'), { timeout: 30_000 }).toBe('v:anchovy');
  await a.context().close();
  await b.context().close();
});
