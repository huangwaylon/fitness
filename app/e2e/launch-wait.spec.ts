// The launch's wait for the week (AppShell's `!week.view`: the phone's cache, ~250 ms on the phones) is the bare sea,
// no しずえ: ui/NookScreen's busy screen draws its figure and line only after BUSY_AFTER_MS (1.5 s), a real wait's
// (review 11-24 T8: her flash before the island). Held here by the demo's backend chunk, delayed.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type Page } from './fixtures.ts';
import { islandUp } from './island.ts';

/** The demo backend's chunk in this build (the client manifest), its answer held `ms`. */
async function holdWeek(page: Page, ms: number): Promise<void> {
  const m = JSON.parse(readFileSync(join(import.meta.dirname, '..', '.svelte-kit', 'output', 'client', '.vite', 'manifest.json'), 'utf8')) as Record<string, { file: string }>;
  const file = m['src/lib/store/demo/backend.ts'].file;
  await page.route(`**/${file}`, async (r) => {
    await new Promise((d) => setTimeout(d, ms));
    await r.continue();
  });
}

const busy = (page: Page) => page.locator('.nook-screen[aria-busy]');

test('a short wait: the sea, then the island, no しずえ', async ({ page }) => {
  await holdWeek(page, 700);
  await page.goto('?demo');
  await expect(busy(page)).toBeAttached();
  await expect(busy(page).locator('img, p')).toHaveCount(0);
  await islandUp(page);
  await expect(busy(page)).toHaveCount(0);
});

test('a long wait: しずえ and the line after 1.5 s', async ({ page }) => {
  await holdWeek(page, 4000);
  await page.goto('?demo');
  await expect(busy(page)).toBeAttached();
  await expect(busy(page).locator('p')).toHaveCount(0);
  await expect(busy(page).locator('p')).toBeVisible({ timeout: 3000 });
  await islandUp(page);
});
