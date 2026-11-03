// The island's ambience in the built app (docs/design.md "Ambience"): with ミュージック on, the procedural beds for the
// Tokyo hour and season sound under the music after the first tap. Read from the engine's test hook (window.__ambient).
import { expect, test, type Page } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } });

const hudJar = (page: Page) => page.getByRole('button', { name: /^ごほうび · ふたりのベル / });

async function open(page: Page, q: string) {
  await page.addInitScript(() => {
    localStorage.setItem('island.sound', JSON.stringify({ music: true, sfx: false, volume: 0.8 }));
    (window as { __ambient?: string[] }).__ambient = [];
  });
  await page.goto(`?demo&date=${q}`);
  await expect(hudJar(page)).toBeVisible();
  const s = (await page.locator('.if-scene').boundingBox())!;
  await page.mouse.click(s.x + s.width / 2, s.y + 60); // a tap on open sky unlocks audio
}
const layers = (page: Page) => page.evaluate(() => [...((window as { __ambient?: string[] }).__ambient ?? [])].sort());

for (const [q, want] of [
  ['2026-08-10T13:00', ['birds:summer', 'cicadas', 'waves']],
  ['2026-08-10T17:30', ['higurashi', 'waves']],
  ['2026-04-05T06:30', ['birds:spring', 'waves']],
  ['2026-10-10T21:00', ['crickets', 'waves']],
  ['2027-01-20T23:00', ['waves', 'wind']]
] as const)
  test(`${q}: ${want.join(', ')}`, async ({ page }) => {
    await open(page, `${q}&weather=clear`);
    await expect.poll(() => layers(page), { timeout: 8000 }).toEqual([...want].sort());
  });

test('nothing sounds in the background: hidden, the beds stop', async ({ page }) => {
  await open(page, '2026-08-10T13:00&weather=clear');
  await expect.poll(() => layers(page), { timeout: 8000 }).toContain('cicadas');
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect.poll(() => layers(page)).toEqual([]);
});
