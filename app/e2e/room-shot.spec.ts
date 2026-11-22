// The rooms' screenshot pair (docs/design.md "The tent": For a picture; rooms/ShotTools.svelte, lookAt.ts): the
// corner-marks button hides every button and hint (the scene alone), the fingers still turn the camera, a tap anywhere
// brings them back (and walks nobody); カメラめせん turns every character's head to the camera, within a neck's reach,
// follows it round, rests when it does, is kept on this phone, and never moves a head in first person.
//   SHOTS=/tmp/cam npx playwright test room-shot --project=webkit   the room bare, everyone looking at the camera
import { expect, test, type Page } from './fixtures.ts';
import { roomUp, tentStill } from './rooms.ts';

test.use({ viewport: { width: 393, height: 852 } });
const Q = '?demo&date=2026-11-04T12:00';
type Gaze = { yaw: number; pitch: number; toYaw: number; toPitch: number; off: number };
type T = {
  stats(): { frames: number; queued: boolean }; still(): boolean; walking(w: string): boolean; mine(): [number, number]; isDefault(): boolean;
  v3(w: string): { gaze: Gaze | null } | null; putAs(w: string, x: number, z: number): void; orbit(dAz: number, dPitch?: number): void; zoom(f: number): void;
  fpv(): { inside: boolean; busy: boolean } | null;
};
const te = <R,>(page: Page, fn: (t: T) => R) => page.evaluate(`(${fn.toString()})(window.__tent)`) as Promise<R>;
const gaze = (page: Page, w: string) => page.evaluate(`window.__tent.v3(${JSON.stringify(w)})?.gaze ?? null`) as Promise<Gaze | null>;
const shot = async (page: Page, name: string) => void (process.env.SHOTS && (await page.screenshot({ path: `${process.env.SHOTS}/shot-${name}.png` })));
/** A tap (WebKit: a finger; Chromium: a click) on a locator or at a point. */
const tap = async (page: Page, browserName: string, at: { click(): Promise<void>; tap(): Promise<void> } | [number, number]) => {
  if (Array.isArray(at)) return browserName === 'webkit' ? page.touchscreen.tap(...at) : page.mouse.click(...at);
  return browserName === 'webkit' ? at.tap() : at.click();
};

test('the room bare: the buttons and the hint hidden, a drag still turns the camera, a tap anywhere brings them back and walks nobody', async ({ page, browserName }) => {
  await page.goto('tent' + Q);
  await roomUp(page, 'tent', { timeout: 15_000 });
  await tentStill(page, 15_000);
  const chrome = [page.getByRole('button', { name: 'しまへ' }), page.locator('[data-fpv]'), page.locator('[data-tent-edit-open]'), page.locator('[data-tent-lights]'), page.locator('[data-room-bare]')];
  for (const c of chrome) await expect(c).toBeVisible();
  await tap(page, browserName, page.locator('[data-room-bare]'));
  await expect(page.locator('main[data-bare]')).toBeVisible();
  for (const c of chrome) await expect(c).toBeHidden();
  // (a moment's 「タップで もどるよ」, then nothing over the scene)
  await expect(page.locator('[data-bare-hint]')).toBeVisible();
  await expect(page.locator('[data-bare-hint]')).toBeHidden({ timeout: 4000 });
  // a drag turns the camera, still bare
  const at = await te(page, (t) => t.mine());
  const box = (await page.locator('canvas').first().boundingBox())!;
  const cx = box.x + box.width / 2, cy = box.y + box.height * 0.45;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx + 120, cy, { steps: 6 });
  await page.mouse.up();
  await expect.poll(() => te(page, (t) => t.isDefault())).toBe(false);
  await expect(page.locator('main[data-bare]')).toBeVisible();
  await tentStill(page, 15_000);
  // a tap on the floor: the buttons back, nobody walks
  await tap(page, browserName, [cx - 40, cy + 120]);
  await expect(page.locator('main[data-bare]')).toHaveCount(0);
  for (const c of chrome.slice(1)) await expect(c).toBeVisible();
  expect(await te(page, (t) => t.walking('A'))).toBe(false);
  expect(await te(page, (t) => t.mine())).toEqual(at);
  // (bare again, then out of the room and back in: never left bare)
  await tap(page, browserName, page.locator('[data-room-bare]'));
  await expect(page.locator('main[data-bare]')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('main[data-bare]')).toHaveCount(0);
});

test('the museum bare too: hidden, a tap back', async ({ page, browserName }) => {
  await page.goto('museum' + Q);
  await roomUp(page, 'museum', { timeout: 20_000 });
  await tap(page, browserName, page.locator('[data-room-bare]'));
  await expect(page.locator('main[data-bare]')).toBeVisible();
  await expect(page.locator('[data-fpv]')).toBeHidden();
  await expect(page.getByRole('button', { name: 'しまへ' })).toBeHidden();
  const box = (await page.locator('canvas').first().boundingBox())!;
  await tap(page, browserName, [box.x + box.width / 2, box.y + box.height / 2]);
  await expect(page.locator('main[data-bare]')).toHaveCount(0);
  await expect(page.locator('[data-fpv]')).toBeVisible();
});

/** No frame queued (pace.queued): at rest, only the faces' blink timers left. */
const quiet = (page: Page) => expect.poll(() => te(page, (t) => t.stats().queued), { timeout: 8000 }).toBe(false);

test('カメラめせん: every head to the camera within its reach, after it as it turns, resting when it does; kept on this phone', async ({ page, browserName }) => {
  await page.goto('tent' + Q);
  await roomUp(page, 'tent', { timeout: 15_000 });
  await te(page, (t) => (t.putAs('B', -14, 8), t.putAs('G', 12, 4)));
  // (the camera tilted low: the heads' reach takes it in, 30° up at most)
  await te(page, (t) => (t.orbit(0.25, -1), t.zoom(2.2)));
  await expect.poll(() => te(page, (t) => !!t.v3('B') && !!t.v3('G')), { timeout: 15_000 }).toBe(true);
  await tentStill(page, 15_000);
  const btn = page.locator('[data-face-cam]');
  await expect(btn).toHaveAttribute('aria-pressed', 'false');
  const off0 = await gaze(page, 'B');
  await shot(page, 'room-looking-off');
  await tap(page, browserName, btn);
  await expect(btn).toHaveAttribute('aria-pressed', 'true');
  /** Every head at the camera's way clamped to its reach (±70°, ±30°); those within it, its world way within 4° of
   *  the camera; at least one of them so. */
  const clamp = (v: number, m: number) => Math.max(-m, Math.min(m, v));
  const looking = async () => {
    const all = await Promise.all(['A', 'B', 'G'].map((w) => gaze(page, w)));
    const ok = all.every((g) => !!g && Math.abs(g.yaw - clamp(g.toYaw, 70)) < 3 && Math.abs(g.pitch - clamp(g.toPitch, 30)) < 3);
    const near = all.filter((g) => g && Math.abs(g.toYaw) < 68 && Math.abs(g.toPitch) < 28);
    return ok && near.length > 0 && near.every((g) => g!.off < 4) ? true : JSON.stringify(all);
  };
  await expect.poll(looking, { timeout: 8000 }).toBe(true);
  expect(off0!.off).toBeGreaterThan(8);
  // settled: no frame asked for (no continuous drawing while they look)
  await quiet(page);
  await page.locator('[data-room-bare]').evaluate((b: HTMLElement) => b.click());
  await expect(page.locator('[data-bare-hint]')).toBeHidden({ timeout: 4000 });
  await shot(page, 'room-bare-looking');
  await page.keyboard.press('Escape');
  // the camera turned: the heads after it (within reach), at rest again
  await te(page, (t) => t.orbit(-0.5, 0));
  await expect.poll(looking, { timeout: 8000 }).toBe(true);
  await quiet(page);
  // kept on this phone
  await page.reload();
  await roomUp(page, 'tent', { timeout: 15_000 });
  await expect(page.locator('[data-face-cam]')).toHaveAttribute('aria-pressed', 'true');
});

test('カメラめせん never in first person: the heads keep their own poses, on or off alike', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('island.faceCam', '1'));
  await page.goto('tent' + Q + '&fpv=1');
  await roomUp(page, 'tent', { timeout: 15_000 });
  await te(page, (t) => t.putAs('B', -14, 8));
  await expect.poll(() => te(page, (t) => !!t.v3('B') && !!t.fpv()?.inside && !t.fpv()?.busy), { timeout: 15_000 }).toBe(true);
  await quiet(page);
  const on = await gaze(page, 'B');
  await page.locator('[data-face-cam]').click();
  await expect(page.locator('[data-face-cam]')).toHaveAttribute('aria-pressed', 'false');
  await quiet(page);
  const off = await gaze(page, 'B');
  expect(Math.abs(on!.yaw - off!.yaw) + Math.abs(on!.pitch - off!.pitch)).toBeLessThan(1);
});
