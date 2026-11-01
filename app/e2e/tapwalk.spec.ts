// Tap-to-walk and the buildings' doors (spec §3–4, docs/design.md "Walking", "Buildings"): a tap on the ground sends
// my villager there along nav.ts's way (over a bridge, never through the river), a cream ring marks the spot, the
// camera follows a run it can't see (snapping off meanwhile, back after; a touch takes it back), and a building is
// one tap: walk to its door, its NH character answers, the feature opens.
import { expect, test, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';

test.use({ viewport: { width: 390, height: 844 } });

type W = {
  go(z: number): void; cam(): number; at(x: number, z: number): [number, number]; put(x: number, z: number): void;
  mine(): [number, number]; following(): boolean; snapping(): string;
};
const call = <T,>(page: Page, fn: (w: W, a: number[]) => T, args: number[] = []) =>
  page.evaluate(([f, a]) => new Function('w', 'a', `return (${f})(w, a)`)((window as unknown as { __world: W }).__world, a), [fn.toString(), args] as const) as Promise<T>;
const SHOTS = process.env.SHOTS_DIR;
const shot = async (page: Page, name: string) => {
  if (!SHOTS) return;
  mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: `${SHOTS}/${name}.png` });
};

async function open(page: Page, q = '&date=2026-07-01T10:00', cam?: number) {
  await page.goto(`?demo&season=summer${q}`);
  await page.waitForFunction(() => (window as unknown as { __world?: unknown }).__world);
  await page.waitForTimeout(600);
  if (cam !== undefined) {
    await call(page, (w, [z]) => w.go(z), [cam]);
    await page.waitForTimeout(300);
  }
}

/** My villager's feet every ~30 ms until it stops (or `ms` runs out). */
async function track(page: Page, ms = 8000): Promise<[number, number][]> {
  return page.evaluate(async (ms) => {
    const w = (window as unknown as { __world: W }).__world, out: [number, number][] = [];
    const t0 = performance.now();
    let still = 0;
    while (performance.now() - t0 < ms) {
      await new Promise((r) => setTimeout(r, 30));
      const p = w.mine();
      const last = out.at(-1);
      out.push([p[0], p[1]]);
      still = last && Math.hypot(p[0] - last[0], p[1] - last[1]) < 0.01 ? still + 1 : 0;
      if (still > 12 && out.length > 20) break;
    }
    return out;
  }, ms);
}

test('a tap in the plaza runs my villager there over a bridge, never through the river; a ring marks the spot', async ({ page }) => {
  await open(page, undefined, 420);
  const [x, y] = await call(page, (w) => w.at(195, 760));
  await page.mouse.click(x, y);
  await expect(page.locator('.tap-ring')).toHaveCount(1);
  await shot(page, 'tap-ring');
  const path = await track(page);
  const end = path.at(-1)!;
  expect(Math.hypot(end[0] - 195, end[1] - 760)).toBeLessThan(3);
  // where the walk crossed the river's reach (z 640): on the stone bridge (x 195 ± 22) or the log bridge (296 ± 17)
  let crossings = 0;
  for (let i = 1; i < path.length; i++) {
    const [ax, az] = path[i - 1], [bx, bz] = path[i];
    if ((az - 640) * (bz - 640) > 0 || az === bz) continue;
    const cx = ax + ((bx - ax) * (640 - az)) / (bz - az);
    expect(Math.abs(cx - 195) <= 22 || Math.abs(cx - 296) <= 17, `crossed at x ${cx.toFixed(1)}`).toBe(true);
    crossings++;
  }
  expect(crossings).toBe(1);
  await shot(page, 'after-bridge');
});

test('a tap on the pond walks to its bank, facing the water; the walk stays for the session', async ({ page }) => {
  await open(page, undefined, 760);
  const [x, y] = await call(page, (w) => w.at(44, 772));
  await page.mouse.click(x, y);
  const end = (await track(page)).at(-1)!;
  // on the bank: out of the water (rx 40, rz 22) by the pad, within reach of it
  const d = Math.hypot((end[0] - 44) / 40, (end[1] - 772) / 22);
  expect(d).toBeGreaterThan(1);
  expect(Math.hypot(end[0] - 44, end[1] - 772)).toBeLessThan(80);
  await page.reload();
  await page.waitForFunction(() => (window as unknown as { __world?: unknown }).__world);
  await page.waitForTimeout(400);
  const again = await call(page, (w) => w.mine());
  expect(Math.hypot(again[0] - end[0], again[1] - end[1])).toBeLessThan(2);
});

test('the camera follows a run up the island (snapping off), gives it back after, and a touch takes it back at once', async ({ page }) => {
  await open(page);
  expect(await call(page, (w) => w.cam())).toBe(150);
  // far up the plaza: a far tap (θ > 35°), the camera eases there with the walker
  const [x, y] = await call(page, (w) => w.at(195, 800));
  await page.mouse.click(x, y);
  await expect.poll(() => call(page, (w) => w.following())).toBe(true);
  expect(await call(page, (w) => w.snapping())).toBe('none');
  // while following, my villager stays on screen
  for (let i = 0; i < 6; i++) {
    await page.waitForTimeout(250);
    const sy = await call(page, (w) => w.at(...w.mine())[1]);
    expect(sy).toBeLessThan(844);
    expect(sy).toBeGreaterThan(100);
  }
  await expect.poll(() => call(page, (w) => w.following()), { timeout: 8000 }).toBe(false);
  expect(await call(page, (w) => w.cam())).toBeGreaterThan(400);
  await shot(page, 'followed');
  await expect.poll(() => call(page, (w) => w.snapping())).toBe('');

  // a touch on the scroller ends a follow at once
  const [x2, y2] = await call(page, (w) => w.at(195, 1060 - 60));
  await page.mouse.click(x2, y2);
  await expect.poll(() => call(page, (w) => w.following())).toBe(true);
  await page.locator('[data-world-scroller]').dispatchEvent('touchstart');
  expect(await call(page, (w) => w.following())).toBe(false);
});

test('Able Sisters: walk to the door, あさみ answers, then the むらびと picker opens', async ({ page }) => {
  await open(page, undefined, 1260);
  await page.locator('[data-building="able"] .door').click();
  const box = page.locator('[data-fx="talk"]');
  await expect(box).toContainText('あさみ', { timeout: 8000 });
  const end = await call(page, (w) => w.mine());
  expect(Math.hypot(end[0] - 282, end[1] - (1338 - 16))).toBeLessThan(30);
  await shot(page, 'able-door');
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  for (let i = 0; i < 4 && (await box.count()); i++) await box.click().catch(() => {});
  await expect(page.locator('dialog[open]')).toHaveCount(1);
  await expect(page.locator('dialog[open]').getByRole('radio').first()).toBeVisible();
  await shot(page, 'able-picker');
});

test('Resident Services by night: たぬきち answers with his だなも, then せってい opens', async ({ page }) => {
  await open(page, '&date=2026-07-01T23:00', 900);
  await page.locator('[data-building="rs"] .door').click();
  const box = page.locator('[data-fx="talk"]');
  await expect(box).toContainText('たぬきち', { timeout: 8000 });
  expect(await box.getAttribute('aria-label')).toMatch(/だなも/);
  await shot(page, 'rs-night');
  for (let i = 0; i < 4 && (await box.count()); i++) await box.click().catch(() => {});
  await expect(page.locator('dialog[open] .tab[data-tab=settings]')).toHaveAttribute('aria-pressed', 'true');
});

test('a tap at a building’s foot knocks at its door (the footprint snaps to the door)', async ({ page }) => {
  await open(page, undefined, 1260);
  // the ground just inside the Cranny's footprint, beside its art (taps on the art itself are the door button's)
  await page.addStyleTag({ content: '[data-building] .door { pointer-events: none !important; }' });
  const [x, y] = await call(page, (w) => w.at(100, 1340));
  await page.mouse.click(x, y);
  await expect(page.locator('[data-fx="talk"]')).toContainText('まめきち', { timeout: 8000 });
});
