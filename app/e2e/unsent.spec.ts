// Writes that haven't gone, online (docs/backend.md#write-queue, health A10): one set aside or backed off for over two
// minutes shows on the island 「おくれて いない きろく {n} · タップで おくる」 and in 設定 「未送信 {n}件（最終送信 …）」; a tap
// sends them (the set-aside ones too) and both go. One the relay keeps failing whole is set aside and never holds the rest.
import { expect, test } from './fixtures.ts';
import { fromMenu } from './hud.ts';
import { newRecord } from './record.ts';
import { RELAY } from './relay.ts';

const up = (page: import('@playwright/test').Page) => page.waitForFunction(() => !!(window as unknown as { __world?: unknown }).__world, null, { timeout: 30_000 });

test('a write set aside shows on the island and in 設定; a tap sends it', async ({ page, context }) => {
  const rec = newRecord();
  await rec.pair(context, 'A');
  await page.addInitScript(() => {
    if (sessionStorage.getItem('e2e.seeded')) return;
    sessionStorage.setItem('e2e.seeded', '1');
    const t = Date.now() - 10 * 60_000;
    localStorage.setItem('island.queue', JSON.stringify([{ id: 'e2e-parked-1', type: 'pref', data: { key: 'villagerName', value: 'まち' }, queuedAt: t, tries: 30, nextAt: t, parked: true }]));
  });
  await page.goto('?x=1');
  await up(page);
  const pill = page.locator('button[data-sync-stuck]');
  await expect(pill).toHaveAttribute('data-sync-stuck', '1');
  await expect(pill).toContainText('おくれて いない きろく 1 · タップで おくる');
  await fromMenu(page, 'settings');
  const row = page.locator('dialog[open] [data-unsent]');
  await expect(row).toContainText('未送信 1件（最終送信 まだ）');
  await row.getByRole('button', { name: '送信' }).click();
  await expect(row).toHaveCount(0);
  await expect.poll(() => rec.sent.some((s) => s.type === 'pref' && s.data.value === 'まち' && s.ok)).toBe(true);
  await page.keyboard.press('Escape');
  await expect(pill).toHaveCount(0);
});

test('a write still in its hold is no 未送信 in 設定, as on the island', async ({ page, context }) => {
  const rec = newRecord();
  await rec.pair(context, 'A');
  await page.addInitScript(() => {
    if (sessionStorage.getItem('e2e.seeded')) return;
    sessionStorage.setItem('e2e.seeded', '1');
    const t = Date.now();
    localStorage.setItem('island.queue', JSON.stringify([{ id: 'e2e-held-1', type: 'pref', data: { key: 'villagerName', value: 'まち' }, queuedAt: t, tries: 0, nextAt: t + 120_000 }]));
  });
  await page.goto('?x=1');
  await up(page);
  await fromMenu(page, 'settings');
  await expect(page.locator('dialog[open] [data-settings]')).toBeVisible();
  await expect(page.locator('dialog[open] [data-unsent]')).toHaveCount(0);
  await expect(page.locator('button[data-sync-stuck]')).toHaveCount(0);
});

test('one write the relay keeps failing whole is set aside; the writes around it still land (2026-11-24)', async ({ page, context }) => {
  const rec = newRecord();
  await rec.pair(context, 'A');
  // a batch holding it fails whole, as when its write throws past the record's own catch (registered after the record:
  // tried first, the rest fall through to it)
  let failed = 0;
  await context.route(`${RELAY}/**`, (route) => {
    const text = route.request().postData() ?? '';
    if (!text.includes('e2e-poison')) return route.fallback();
    failed++;
    return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: '{"ok":false,"error":"unavailable"}' });
  });
  await page.addInitScript(() => {
    if (sessionStorage.getItem('e2e.seeded')) return;
    sessionStorage.setItem('e2e.seeded', '1');
    const t = Date.now() - 10 * 60_000;
    const ev = (id: string, key: string, value: unknown, more = {}) => ({ id, type: 'pref', data: { key, value }, queuedAt: t, tries: 0, nextAt: t, ...more });
    // the bad one has failed alone before (one short of being set aside), between two good ones
    localStorage.setItem('island.queue', JSON.stringify([ev('e2e-good-1', 'villagerName', 'まち'), ev('e2e-poison', 'islandName', 'どく', { tries: 9, served: 9 }), ev('e2e-good-2', 'moveGoal', 450)]));
  });
  await page.goto('?x=1');
  await up(page);
  await expect.poll(() => rec.sent.filter((s) => s.ok).map((s) => s.data.value)).toEqual(['まち', 450]);
  expect(failed).toBeGreaterThanOrEqual(2); // the batch of three, then it alone (split: the good one before it went)
  expect(rec.sent.some((s) => s.data.value === 'どく')).toBe(false);
  const pill = page.locator('button[data-sync-stuck]');
  await expect(pill).toContainText('おくれて いない きろく 1 · タップで おくる');
  const q = await page.evaluate(() => JSON.parse(localStorage.getItem('island.queue') ?? '[]') as { id: string; parked?: boolean }[]);
  expect(q.map((x) => [x.id, !!x.parked])).toEqual([['e2e-poison', true]]);
});
