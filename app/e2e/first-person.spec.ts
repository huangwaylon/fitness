// The first-person view (docs/design.md "First person"): in the tent and the museum the eye button takes the camera
// to my villager's eyes (the walls all standing), a drag turns the head (nobody walks), a tap on the floor walks there
// (from the eyes' own camera), the button again puts the room's camera back; the choice is kept on this phone, so
// leaving and coming back in finds it as it was.
import { expect, test, type Page } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } });
const Q = '?demo&date=2026-11-04T12:00&critter=none&visitor=none';

type Fpv = { on: boolean; inside: boolean; busy: boolean; yaw: number; pitch: number; eye: [number, number, number] };
type R = { stats(): { frames: number }; fpv(): Fpv | null; mine(): [number, number]; walking(w: string): boolean; px(x: number, z: number, y?: number): [number, number] };
const ROOMS = [
  { name: 'the tent', path: 'tent', hook: '__tent', walls: null },
  { name: 'the museum', path: 'museum', hook: '__museum', walls: () => '__museum.walls()' }
] as const;

for (const room of ROOMS) {
  const r = <T,>(page: Page, fn: (h: R) => T) => page.evaluate(`(${fn.toString()})(window.${room.hook})`) as Promise<T>;
  const open = async (page: Page) => {
    await page.goto(room.path + Q);
    await page.waitForFunction((h) => ((window as unknown as Record<string, R | undefined>)[h]?.stats()?.frames ?? 0) > 0, room.hook);
  };
  /** At rest: the camera's glide and the head's easing done, and my villager not walking (the museum's exhibits may
   *  move on: a wing seen through its opening). */
  const rest = (page: Page) => expect.poll(() => r(page, (h) => !h.fpv()?.busy && !h.walking('A')), { timeout: 15_000 }).toBe(true);

  test(`${room.name}: the eye button, a look round, a tap to walk, back to the room's camera; kept across a visit`, async ({ page }) => {
    test.setTimeout(60_000);
    await open(page);
    const eyeBtn = page.locator('[data-fpv]');
    await expect(eyeBtn).toHaveAttribute('data-fpv', 'off');
    await rest(page);
    // on: the camera glides to my villager's eyes
    await eyeBtn.click();
    await expect(eyeBtn).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(() => r(page, (h) => h.fpv()?.inside)).toBe(true);
    // (inside, every wall stands: none cut away)
    if (room.walls) expect(await page.evaluate(room.walls())).not.toContain('1');
    const at = await r(page, (h) => h.mine());
    const f0 = (await r(page, (h) => h.fpv()))!;
    // the eye at my villager's head: over its feet, a villager's eye height up
    expect(Math.hypot(f0.eye[0] - at[0], f0.eye[2] - at[1])).toBeLessThan(6);
    expect(f0.eye[1]).toBeGreaterThan(8);
    expect(f0.eye[1]).toBeLessThan(16);
    // a drag turns the head (right: it turns left, the world following the finger); it walks nobody
    const box = (await page.locator('canvas').first().boundingBox())!;
    const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + 120, cy + 30, { steps: 8 });
    await page.mouse.up();
    await rest(page);
    const f1 = (await r(page, (h) => h.fpv()))!;
    expect(Math.atan2(Math.sin(f1.yaw - f0.yaw), Math.cos(f1.yaw - f0.yaw))).toBeGreaterThan(0.3);
    expect(f1.pitch).toBeGreaterThan(f0.pitch);
    expect(await r(page, (h) => h.mine())).toEqual(at);
    // a tap on the floor ahead walks there (the floor from the eyes' own camera)
    await page.evaluate(`window.${room.hook}.look(0, -200)`);
    await rest(page);
    const f2 = (await r(page, (h) => h.fpv()))!;
    const goal: [number, number] = [f2.eye[0] + Math.sin(f2.yaw) * 18, f2.eye[2] + Math.cos(f2.yaw) * 18];
    const [tx, ty] = await page.evaluate(([h, x, z]) => (window as unknown as Record<string, R>)[h].px(x, z), [room.hook, ...goal] as const);
    await page.mouse.click(tx, ty);
    await expect.poll(() => r(page, (h) => h.walking('A'))).toBe(true);
    await rest(page);
    const [mx, mz] = await r(page, (h) => h.mine());
    expect(Math.hypot(mx - goal[0], mz - goal[1])).toBeLessThan(3);
    // off: the room's camera again
    await eyeBtn.click();
    await expect(eyeBtn).toHaveAttribute('data-fpv', 'off');
    await expect.poll(() => r(page, (h) => h.fpv()?.on)).toBe(false);
    await rest(page);
    expect((await r(page, (h) => h.fpv()))!.inside).toBe(false);
    // kept on this phone: on, out and back in, it's at the eyes from the first frame; off, it's off
    await eyeBtn.click();
    await page.getByRole('button', { name: '島へ' }).click();
    await expect(page).toHaveURL(/\/fitness\/\?/);
    await open(page);
    await expect(page.locator('[data-fpv]')).toHaveAttribute('data-fpv', 'on');
    expect((await r(page, (h) => h.fpv()))!.inside).toBe(true);
    await page.locator('[data-fpv]').click();
    await open(page);
    await expect(page.locator('[data-fpv]')).toHaveAttribute('data-fpv', 'off');
    expect((await r(page, (h) => h.fpv()))!.on).toBe(false);
  });
}

test('the tent: もようがえ arranges with the room’s camera, and the eyes come back after', async ({ page }) => {
  await page.goto('tent' + Q + '&fpv=1');
  await page.waitForFunction(() => ((window as unknown as { __tent?: R }).__tent?.stats()?.frames ?? 0) > 0);
  const t = () => page.evaluate(() => (window as unknown as { __tent: R }).__tent.fpv());
  await expect.poll(async () => (await t())?.inside).toBe(true);
  await page.locator('[data-tent-edit-open]').click();
  await expect.poll(async () => (await t())?.on).toBe(false);
  await expect(page.locator('[data-fpv]')).toHaveCount(0);
  await page.locator('[data-tent-done]').click();
  await expect.poll(async () => (await t())?.inside).toBe(true);
});
