// The tent's surfaces (docs/design.md "The tent", "Table tops"): every piece NH calls a surface holds small things on its
// top, at its model's top (not its bounds): a low table, a bookshelf, a chest, the log shelves (whose bounds are their
// ornaments). A small thing held over one goes on it, stands at that height, and the piece won't go away under it.
import { expect, test, type Page } from '@playwright/test';
import items from '../src/lib/components/tent/items.json' with { type: 'json' };

test.use({ viewport: { width: 393, height: 852 } });

const Q = '?demo&date=2026-11-04T12:00&critter=none&visitor=none';
type Piece = { id: string; item: string; x: number; z: number; f: number; on?: string };
type T = {
  tile(x: number, z: number): [number, number];
  px(x: number, z: number, y?: number): [number, number];
  pieces(): Piece[];
  placed(): { id: string; x: number; z: number; f: number; y: number }[];
  edit(): { sel: (Piece & { fresh: boolean; on: string | null }) | null; why: string | null } | null;
  still(): boolean;
  hit(cx: number, cy: number): { kind: string; id?: string } | null;
};
const te = <R,>(page: Page, fn: (t: T) => R) => page.evaluate(`(${fn.toString()})(window.__tent)`) as Promise<R>;
const META = items.items as Record<string, { w: number; d: number; h: number; sy?: number }>;

async function open(page: Page) {
  await page.addInitScript(() => localStorage.removeItem('island-demo.tent'));
  await page.goto('tent' + Q);
  await page.waitForFunction(() => ((window as unknown as { __tent?: { stats(): { frames: number } } }).__tent?.stats()?.frames ?? 0) > 0);
  await page.locator('[data-tent-edit-open]').click();
  await settled(page);
}
/** The camera at rest, framed for the bar as it is now: taking a piece from the tray, placing it, picking one up change
 *  the bar, and the room re-centres under it; a model point's px is only where the finger lands once it's still. */
const settled = (page: Page) => page.waitForFunction(() => (window as unknown as { __tent: T }).__tent.still());

const CASES = [
  { code: 'f4054', what: 'a low table (the rattan low table)' },
  { code: 'f1558', what: 'a bookshelf (the wooden-block bookshelf)' },
  { code: 'f2560', what: 'a chest (the wooden chest)' },
  { code: 'f4036', what: 'low shelves (the log decorative shelves: its top under its ornaments)' }
];
for (const { code, what } of CASES) {
  test(`on ${what}: the lamp goes on its top, at its model's top, and the piece won't go away under it`, async ({ page }) => {
    await open(page);
    const m = META[code];
    expect(m.sy).toBeGreaterThan(0);
    // the surface on tiles from (5, 2): clear of where a fresh piece comes in (tiles 2–3, 4), so the tap is the floor's,
    // not on the held one's drawn shape (a tall piece is drawn up over the tiles behind it: a tap there turns it)
    await page.locator(`[data-tent-item="${code}"]`).click();
    await settled(page);
    let [x, y] = await te(page, (t) => t.px(-40 + 5 * 10 + 10, -40 + 2 * 10 + 5));
    await page.mouse.click(x, y);
    await expect.poll(() => te(page, (t) => t.edit()?.sel)).toMatchObject({ item: code, z: 2, f: 0 });
    await page.locator('[data-act="place"]').click();
    const piece = (await te(page, (t) => t.pieces()))[0];
    // the rattan table lamp from the tray, then a tap on the piece's top (where it's drawn, high or low)
    await page.locator('[data-tent-item="f4050"]').click();
    await settled(page);
    const top = await page.evaluate(([px, pz, sy]) => (window as unknown as { __tent: T }).__tent.px(px, pz, sy), [-40 + (piece.x + 0.5) * 10, -40 + (piece.z + 0.5) * 10, m.sy!] as const);
    // (its model in: a tap on its top is on it)
    await expect.poll(() => page.evaluate(([a, b]) => (window as unknown as { __tent: T }).__tent.hit(a, b), top)).toEqual({ kind: 'piece', id: piece.id });
    await page.mouse.click(top[0], top[1]);
    await expect.poll(() => te(page, (t) => t.edit()?.sel?.on)).toBe(piece.id);
    expect((await te(page, (t) => t.edit()))?.why).toBeNull();
    await page.locator('[data-act="place"]').click();
    await expect.poll(async () => (await te(page, (t) => t.pieces())).find((p) => p.item === 'f4050')).toMatchObject({ on: piece.id });
    const lamp = (await te(page, (t) => t.pieces())).find((p) => p.item === 'f4050')!;
    const at = (await te(page, (t) => t.placed())).find((p) => p.id === lamp.id)!;
    expect(at.y).toBeCloseTo(m.sy!, 1);
    expect(at.y).toBeLessThanOrEqual(m.h + 0.01);
    if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/${code}.png` });
    // the piece won't be put away with the lamp on it (NH's way): picked up where the lamp isn't (its other tile, or
    // its foot: a tap near the lamp is the lamp's)
    await settled(page);
    [x, y] = await page.evaluate(([tx, tz]) => (window as unknown as { __tent: T }).__tent.tile(tx, tz), [piece.x + m.w - 1, piece.z] as const);
    await page.mouse.click(x, y);
    await expect.poll(() => te(page, (t) => t.edit()?.sel?.id)).toBe(piece.id);
    await page.locator('[data-act="remove"]').click();
    await expect(page.getByText('うえの ものを さきに しまってね')).toBeVisible();
    expect((await te(page, (t) => t.pieces())).length).toBe(2);
  });
}
