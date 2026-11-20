// The island editor in the specs (/editor): its plan's test hooks (window.__editor; the phone-view edit mode's
// window.__islandEdit, openEditor in island.ts).
import type { Page } from './fixtures.ts';

type Tiles = { tileScreen(c: number, r: number): [number, number] | null };

/** A mouse drag from tile `from` to tile `to` in six steps, over `hook`'s plan. */
export async function dragTile(page: Page, from: readonly [number, number], to: readonly [number, number], hook: '__editor' | '__islandEdit' = '__editor') {
  const at = async ([c, r]: readonly [number, number]) =>
    (await page.evaluate(([h, c, r]) => (window as unknown as Record<string, Tiles>)[h].tileScreen(c, r), [hook, c, r] as const))!;
  const a = await at(from), b = await at(to);
  await page.mouse.move(a[0], a[1]);
  await page.mouse.down();
  for (let i = 1; i <= 6; i++) await page.mouse.move(a[0] + ((b[0] - a[0]) * i) / 6, a[1] + ((b[1] - a[1]) * i) / 6);
  await page.mouse.up();
}
