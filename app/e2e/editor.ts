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

type Pt = [number, number];
/** Touch fingers (synthetic pointers) over what's under the first frame's first point: each frame the fingers' client
 *  points, down at the first and up after the last, all at once (the plan's gestures read no clock but a tap's). */
export async function fingers(page: Page, frames: Pt[][]) {
  await page.evaluate((frames) => {
    const el = document.elementFromPoint(...frames[0][0])!;
    const ev = (type: string, id: number, [x, y]: Pt) =>
      el.dispatchEvent(new PointerEvent(type, { pointerId: 40 + id, pointerType: 'touch', isPrimary: id === 0, clientX: x, clientY: y, buttons: type === 'pointerup' ? 0 : 1, bubbles: true, cancelable: true, composed: true }));
    frames[0].forEach((p, i) => ev('pointerdown', i, p));
    for (const fr of frames.slice(1)) fr.forEach((p, i) => ev('pointermove', i, p));
    frames.at(-1)!.forEach((p, i) => ev('pointerup', i, p));
  }, frames);
}
/** One finger from a to b in `n` steps. */
export const line = (a: Pt, b: Pt, n = 6): Pt[][] => Array.from({ length: n + 1 }, (_, i) => [[a[0] + ((b[0] - a[0]) * i) / n, a[1] + ((b[1] - a[1]) * i) / n]]);
