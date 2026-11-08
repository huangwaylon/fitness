// Writes that haven't gone, online (docs/backend.md#write-queue, health A10): one set aside or backed off for over two
// minutes shows on the island 「おくれて いない きろく {n} · タップで おくる」 and in 設定 「未送信 {n}件（最終送信 …）」; a tap
// sends them (the set-aside ones too) and both go.
import { expect, test } from './fixtures.ts';
import { fromMenu } from './hud.ts';
import { newRecord } from './record.ts';

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
