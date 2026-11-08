// The first-person view (docs/design.md "First person"): in the tent and the museum the eye button takes the camera
// to my villager's eyes (the walls all standing), a drag turns the head (nobody walks), a tap on the floor walks there
// (from the eyes' own camera), the button again puts the room's camera back; the choice is kept on this phone, so
// leaving and coming back in finds it as it was. A drag mid-walk turns the camera alone: the walk goes on to its spot,
// the head stays where the finger left it.
import { expect, test, type Page } from './fixtures.ts';
import { islandURL } from './island.ts';

test.use({ viewport: { width: 390, height: 844 } });
const Q = '?demo&date=2026-11-04T12:00';

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
    for (let i = 1; i <= 8; i++) {
      await page.mouse.move(cx + 15 * i, cy + (30 * i) / 8);
      // (never a walk, at any point of it)
      expect(await r(page, (h) => h.walking('A'))).toBe(false);
    }
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
    // standing at its eyes, its head settled: the idle never moves the eye, so nothing draws (the tent: a blink's
    // frames; the museum: at most its exhibits' 30 a second, under the e2e's 60 cap)
    await page.waitForTimeout(1500);
    const n0 = (await r(page, (h) => h.stats())).frames;
    await page.waitForTimeout(1000);
    expect((await r(page, (h) => h.stats())).frames - n0).toBeLessThanOrEqual(room.path === 'tent' ? 3 : 33);
    // off: the room's camera again
    await eyeBtn.click();
    await expect(eyeBtn).toHaveAttribute('data-fpv', 'off');
    await expect.poll(() => r(page, (h) => h.fpv()?.on)).toBe(false);
    await rest(page);
    expect((await r(page, (h) => h.fpv()))!.inside).toBe(false);
    // kept on this phone: on, out and back in, it's at the eyes from the first frame; off, it's off
    await eyeBtn.click();
    await page.getByRole('button', { name: '島へ' }).click();
    await expect(page).toHaveURL(islandURL());
    await open(page);
    await expect(page.locator('[data-fpv]')).toHaveAttribute('data-fpv', 'on');
    expect((await r(page, (h) => h.fpv()))!.inside).toBe(true);
    await page.locator('[data-fpv]').click();
    await open(page);
    await expect(page.locator('[data-fpv]')).toHaveAttribute('data-fpv', 'off');
    expect((await r(page, (h) => h.fpv()))!.on).toBe(false);
  });

  test(`${room.name}: a drag mid-walk turns the camera alone (the walk goes on to its spot); the walk never turns it`, { tag: '@logic', annotation: { type: 'logic', description: 'drawn: a wait sized for the game at full speed (an animation, a spawn, a sync within its seconds); software GL slows the game itself' } }, async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto(room.path + Q + '&fpv=1');
    await page.waitForFunction((h) => ((window as unknown as Record<string, R | undefined>)[h]?.stats()?.frames ?? 0) > 0, room.hook);
    await expect.poll(() => r(page, (h) => h.fpv()?.inside)).toBe(true);
    await page.evaluate(`window.${room.hook}.look(0, -200)`);
    await rest(page);
    const f0 = (await r(page, (h) => h.fpv()))!;
    const goal: [number, number] = [f0.eye[0] + Math.sin(f0.yaw) * 18, f0.eye[2] + Math.cos(f0.yaw) * 18];
    const [tx, ty] = await page.evaluate(([h, x, z]) => (window as unknown as Record<string, R>)[h].px(x, z), [room.hook, ...goal] as const);
    const box = (await page.locator('canvas').first().boundingBox())!;
    const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
    await page.mouse.click(tx, ty);
    await expect.poll(() => r(page, (h) => h.walking('A'))).toBe(true);
    // on the way: a drag right turns the head left by the drag's share of the lens (70° a canvas width)
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + 150, cy, { steps: 5 });
    await page.mouse.up();
    expect(await r(page, (h) => h.walking('A'))).toBe(true);
    await rest(page);
    const [mx, mz] = await r(page, (h) => h.mine());
    expect(Math.hypot(mx - goal[0], mz - goal[1])).toBeLessThan(3);
    const f1 = (await r(page, (h) => h.fpv()))!, want = f0.yaw + (150 * (70 * Math.PI)) / 180 / box.width;
    // (the walk went on ahead, the head stayed where the finger left it; the pitch too)
    const off = { yaw: Math.abs(Math.atan2(Math.sin(f1.yaw - want), Math.cos(f1.yaw - want))) < 0.01, pitch: Math.abs(f1.pitch - f0.pitch) < 1e-6 };
    expect(off, JSON.stringify({ f0, f1, want, end: [mx, mz], goal })).toEqual({ yaw: true, pitch: true });
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

test('the museum: seated on a bench, the eye at the seated head, a look round keeps it seated, a tap on the floor gets up and walks', async ({ page }) => {
  test.setTimeout(60_000);
  type H = R & { put(x: number, z: number): void; still(): boolean; seat(): { id: string; n: number } | null; benchPx(id: string, n: number): [number, number]; look(dx: number, dy: number): void };
  const m = <T,>(fn: (h: H) => T) => page.evaluate(`(${fn.toString()})(window.__museum)`) as Promise<T>;
  await page.goto('museum' + Q);
  await page.waitForFunction(() => ((window as unknown as { __museum?: R }).__museum?.stats()?.frames ?? 0) > 0);
  await m((h) => h.put(150, 10));
  await expect.poll(() => m((h) => h.still()), { timeout: 10_000 }).toBe(true);
  const [bx, by] = await m((h) => h.benchPx('dmbench1', 0));
  await page.mouse.click(bx, by);
  await expect.poll(() => m((h) => h.seat()), { timeout: 10_000 }).not.toBeNull();
  // the eyes: at its head where it sits, over its seat (not at its step in front, where it stood), a villager's
  // seated eye height up (NH's short legs: about as high as standing)
  await page.locator('[data-fpv]').click();
  await expect.poll(() => m((h) => h.fpv()?.inside), { timeout: 10_000 }).toBe(true);
  await expect.poll(() => m((h) => !h.fpv()?.busy), { timeout: 10_000 }).toBe(true);
  const f0 = (await m((h) => h.fpv()))!;
  const seat = (await m((h) => h.seat()))!;
  // (the bench's seats: x 124 ± 4.68, museum/seats.ts)
  expect(Math.abs(f0.eye[0] - (seat.n === 0 ? 128.68 : 119.32))).toBeLessThan(3);
  expect(Math.abs(f0.eye[2] + 21)).toBeLessThan(5);
  expect(f0.eye[1]).toBeGreaterThan(10);
  expect(f0.eye[1]).toBeLessThan(17);
  // facing the great tank (−z)
  expect(Math.cos(f0.yaw)).toBeLessThan(-0.9);
  // a look round: the head turns, still seated, the eye where it was
  await m((h) => h.look(-150, 0));
  await expect.poll(() => m((h) => !h.fpv()?.busy), { timeout: 10_000 }).toBe(true);
  const f1 = (await m((h) => h.fpv()))!;
  expect(Math.abs(Math.atan2(Math.sin(f1.yaw - f0.yaw), Math.cos(f1.yaw - f0.yaw)))).toBeGreaterThan(0.3);
  expect(await m((h) => h.seat())).not.toBeNull();
  expect(Math.hypot(f1.eye[0] - f0.eye[0], f1.eye[2] - f0.eye[2])).toBeLessThan(1.5);
  // a tap on the floor ahead (toward the tank, from the eyes' own camera): up and walking there
  await m((h) => h.look(150, -120));
  await expect.poll(() => m((h) => !h.fpv()?.busy), { timeout: 10_000 }).toBe(true);
  const f2 = (await m((h) => h.fpv()))!;
  const goal: [number, number] = [f2.eye[0] + Math.sin(f2.yaw) * 14, f2.eye[2] + Math.cos(f2.yaw) * 14];
  const [tx, ty] = await page.evaluate(([x, z]) => (window as unknown as { __museum: R }).__museum.px(x, z), goal);
  await page.mouse.click(tx, ty);
  await expect.poll(() => m((h) => h.seat())).toBeNull();
  await expect.poll(async () => {
    const [x, z] = await m((h) => h.mine());
    return !(await m((h) => h.walking('A'))) && Math.hypot(x - goal[0], z - goal[1]) < 4;
  }, { timeout: 10_000 }).toBe(true);
  expect((await m((h) => h.fpv()))!.inside).toBe(true);
});
