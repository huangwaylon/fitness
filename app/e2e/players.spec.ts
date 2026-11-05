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

type V3 = { model(slot: string): string | null; player(slot: string): boolean; last(slot: string): { x: number; z: number } | null };
/** The island's model for a slot (mine, partner, third): person3d's key, null till one is in. */
const model = (page: Page, slot: string) =>
  page.evaluate((s) => (window as unknown as { __villagers3?: V3 }).__villagers3?.model(s) ?? null, slot);
const settings = (page: Page) => page.locator('dialog[open]').first();
const back = (page: Page) => settings(page).locator('.titlebar .back').click();

test('the look picks the model: A and B human players, a villager look its villager; a new look swaps it where it stands', async ({ browser }) => {
  test.setTimeout(90_000);
  const rec = newRecord();
  const a = await phone(browser, rec, 'A');
  // いつもの: each their human player (their own look, so two keys)
  await expect.poll(() => model(a, 'mine'), { timeout: 30_000 }).toMatch(/^p:/);
  await expect.poll(() => model(a, 'partner'), { timeout: 30_000 }).toMatch(/^p:/);
  const usualA = await model(a, 'mine'), usualB = await model(a, 'partner');
  expect(usualA).not.toBe(usualB);
  // (drawn as players: their parts all there, no stand-in)
  expect(await a.evaluate(() => ['mine', 'partner'].map((s) => (window as unknown as { __villagers3: V3 }).__villagers3.player(s)))).toEqual([true, true]);

  // むらびとの すがた: Raymond, swapped in place
  await fromMenu(a, 'settings');
  await settings(a).locator('[data-push=look]').click();
  await settings(a).locator('[data-look-tab=villager]').click();
  const name = ROSTER.raymond.nameJa;
  await settings(a).getByRole('searchbox').fill(name);
  await settings(a).getByRole('radio', { name }).click();
  await back(a);
  await a.keyboard.press('Escape');
  await expect(settings(a)).toBeHidden();
  const was = await a.evaluate(() => (window as unknown as { __villagers3: V3 }).__villagers3.last('mine'));
  await expect.poll(() => model(a, 'mine'), { timeout: 30_000 }).toBe('v:raymond');
  // (in place: where it stood)
  const now = await a.evaluate(() => (window as unknown as { __villagers3: V3 }).__villagers3.last('mine'));
  expect(Math.hypot(now!.x - was!.x, now!.z - was!.z)).toBeLessThan(1);
  expect(await model(a, 'partner')).toBe(usualB);

  // a phone opening later draws it too
  const b = await phone(browser, rec, 'B');
  await expect.poll(() => model(b, 'partner'), { timeout: 30_000 }).toBe('v:raymond');
  await expect.poll(() => model(b, 'mine'), { timeout: 30_000 }).toBe(usualB);

  // B's phone: another top (a player's look changed: a new player)
  await fromMenu(b, 'settings');
  await settings(b).locator('[data-push=look]').click();
  await settings(b).locator('[data-cat=tops]').click();
  await settings(b).locator('[data-closet=top] [data-item=TopsTexTopOuterLAran]').click();
  await back(b);
  await b.keyboard.press('Escape');
  await expect(settings(b)).toBeHidden();
  await expect.poll(() => model(b, 'mine'), { timeout: 30_000 }).toMatch(/^p:/);
  await expect.poll(() => model(b, 'mine'), { timeout: 30_000 }).not.toBe(usualB);

  // A back to いつもの: its player again
  await fromMenu(a, 'settings');
  await settings(a).locator('[data-push=look]').click();
  await settings(a).locator('[data-look-tab=coord]').click();
  await settings(a).locator('[data-look-chip="usual"]').click();
  await back(a);
  await a.keyboard.press('Escape');
  await expect.poll(() => model(a, 'mine'), { timeout: 30_000 }).toBe(usualA);
  await a.context().close();
  await b.context().close();
});

test('in the tent and the museum: my human player, and my villager once I wear it', async ({ browser }) => {
  test.setTimeout(90_000);
  const rec = newRecord();
  const a = await phone(browser, rec, 'A');
  await expect.poll(() => model(a, 'mine'), { timeout: 30_000 }).toMatch(/^p:/);
  const usual = await model(a, 'mine');
  type Room = { model(w: string): string | null };
  const inRoom = (hook: '__tent' | '__museum') => a.evaluate((h) => (window as unknown as Record<string, Room | undefined>)[h]?.model('A') ?? null, hook);
  await a.goto('tent?critter=none&visitor=none');
  await expect.poll(() => inRoom('__tent'), { timeout: 30_000 }).toBe(usual);
  await a.goto('museum?critter=none&visitor=none');
  await expect.poll(() => inRoom('__museum'), { timeout: 30_000 }).toBe(usual);
  await a.context().close();
  // my villager look (sent from another phone of mine): a phone opening later draws my villager in the tent
  expect(rec.event('A', 'pref', { key: 'villager', value: 'raymond' })).toEqual({ ok: true });
  expect(rec.event('A', 'pref', { key: 'look', value: { kind: 'villager' } })).toEqual({ ok: true });
  const a2 = await phone(browser, rec, 'A');
  await a2.goto('tent?critter=none&visitor=none');
  await expect.poll(() => a2.evaluate(() => (window as unknown as Record<string, Room | undefined>).__tent?.model('A') ?? null), { timeout: 30_000 }).toBe('v:raymond');
  await a2.context().close();
});

// The 2D heads: the island's renderer draws the players' portraits when it's idle or paused under a sheet (person3d
// createPainter), kept by the look (look/portraits.svelte.ts): the partner's head too, a look never opened in すがた here
test('the 2D heads: A’s and B’s portraits, drawn by the island’s renderer @render', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('?demo&date=2026-11-04T12:00&critter=none&visitor=none');
  await page.waitForFunction(() => (window as unknown as { __world3d?: { loaded(): boolean } }).__world3d?.loaded(), null, { timeout: 30_000 });
  await fromMenu(page, 'settings');
  const heads = page.locator('#sec-sync + .prows .av');
  await expect(heads).toHaveCount(2);
  await expect(heads.nth(0)).toHaveAttribute('data-portrait', '3d', { timeout: 60_000 });
  await expect(heads.nth(1)).toHaveAttribute('data-portrait', '3d', { timeout: 60_000 });
  // kept for the next opening
  expect(await page.evaluate(() => (JSON.parse(localStorage.getItem('look.portraits') ?? '[]') as unknown[]).length)).toBeGreaterThanOrEqual(2);
});

test('the 2D heads in the logic tier: a player’s stand-in figure, a villager look its villager', async ({ browser }) => {
  const rec = newRecord();
  const a = await phone(browser, rec, 'A');
  await fromMenu(a, 'settings');
  const heads = settings(a).locator('#sec-sync + .prows .av');
  await expect(heads.nth(0)).toHaveAttribute('data-portrait', 'figure');
  await expect(heads.nth(1)).toHaveAttribute('data-portrait', 'figure');
  await a.context().close();
  rec.event('B', 'pref', { key: 'look', value: { kind: 'villager' } });
  const b = await phone(browser, rec, 'A');
  await fromMenu(b, 'settings');
  const hb = settings(b).locator('#sec-sync + .prows .av');
  await expect(hb.nth(1)).not.toHaveAttribute('data-portrait', /./);
  await expect(hb.nth(1).locator('img, svg').first()).toBeVisible();
  await b.context().close();
});
