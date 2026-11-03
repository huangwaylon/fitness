// The museum (docs/design.md "The museum"): NH's building on the layout, its door walked up to and gone through, its
// inside (the hall and its two wings) with every fish and bug anyone has found on show, a creature's card, and back out.
import { expect, test, type Page } from '@playwright/test';
import { is3d, tapOn } from './island';

const ISLAND = './?demo&visitor=none&critter=none&date=2026-11-04T12:00';
const MUSEUM = 'museum?demo&date=2026-11-04T12:00';
type M = {
  stats(): { frames: number };
  mine(): [number, number] | null;
  still(): boolean;
  specimens(): { id: string; kind: string; tank: string; by: string }[];
  shown(): string[];
  creature(id: string): [number, number] | null;
  card(): string | null;
  put(x: number, z: number): void;
};
const mu = <R,>(page: Page, fn: string) => page.evaluate(`window.__museum.${fn}`) as Promise<R>;
const open = async (page: Page, url = MUSEUM) => {
  await page.goto(url);
  await page.waitForFunction(() => ((window as unknown as { __museum?: M }).__museum?.stats()?.frames ?? 0) > 0);
};
/** The demo's finds: these fish and bugs found by these people (as a catch writes them). */
const seed = (page: Page, finds: [kind: 'fish' | 'bug', id: string, who: 'A' | 'B' | 'G'][]) =>
  page.addInitScript((list) => {
    if (localStorage.getItem('island-demo.events')) return;
    const at = Date.parse('2026-11-04T09:00:00+09:00');
    const events = list.map(([kind, id, person], i) => ({ id: `seed-${i}`, type: 'find', data: { kind, id }, queuedAt: at + i, tries: 0, nextAt: 0, ackedAt: at + i, person }));
    localStorage.setItem('island-demo.events', JSON.stringify({ day: '2026-11-04', events }));
  }, finds);

test('the museum stands on the layout with its door; a tap walks up to it and goes in', async ({ page }) => {
  await page.goto(ISLAND);
  expect(await is3d(page)).toBe(true);
  const door = await page.evaluate(() => (window as unknown as { __world: { site(): { doors: Record<string, [number, number]> } } }).__world.site().doors.museum);
  expect(door).toBeTruthy();
  await page.evaluate(`window.__world.go(${door[1] - 120})`);
  await expect.poll(() => page.evaluate('window.__world3d.camStill()')).toBe(true);
  await tapOn(page, page.locator('[data-building="museum"] .door'));
  await expect(page).toHaveURL(/\/museum\/?\?/, { timeout: 20_000 });
  await expect(page.locator('[data-museum]')).toBeVisible();
});

test('‹ 島へ goes back out, my villager just out of the museum’s door', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: '島へ' }).click();
  await expect(page).toHaveURL(/fitness\/?\?/);
  const door = await page.evaluate(() => (window as unknown as { __world: { site(): { doors: Record<string, [number, number]> } } }).__world.site().doors.museum);
  await expect.poll(async () => {
    const [x, z] = await page.evaluate('window.__world.mine()') as [number, number];
    return Math.hypot(x - door[0], z - door[1]);
  }).toBeLessThan(60);
});

test('a tap on the floor walks there, through the hall into a wing', async ({ page }) => {
  await open(page);
  await expect.poll(() => mu<boolean>(page, 'still()')).toBe(true);
  await page.evaluate('window.__museum.walkTo(150, 20)');
  await expect.poll(async () => {
    const [x, z] = await mu<[number, number]>(page, 'mine()');
    return Math.hypot(x - 150, z - 20);
  }, { timeout: 15_000 }).toBeLessThan(6);
});
