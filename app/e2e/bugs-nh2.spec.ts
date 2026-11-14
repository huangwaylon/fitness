// The six bugs the island lacked till the NH 2.0 export (docs/design.md "Critters"): one netted on its palm and then
// in the ずかん and the museum's bug wing; the dung beetle rolling its snowball before it. Their spawn rules
// (months, hours, places, rarity) are critters.test's. Hermetic: a pinned date (?date), `?critter=` brings the one on.
import { expect, test, type Page } from './fixtures.ts';
import { roomUp } from './rooms.ts';
import { is3d, tapAt, type Aim } from './island';
import { fromMenu } from './hud.ts';

test.use({ viewport: { width: 393, height: 852 } });

type W3 = { modelAt(id: string, lift?: number): [number, number] | null; where(id: string): { x: number; y: number; z: number; hidden: boolean } | null };
type M = { stats(): { frames: number }; specimens(): { id: string; kind: string; tank: string; by: string }[] };

async function open(page: Page, q: string) {
  await page.addInitScript(() => ((window as { __cues?: string[] }).__cues = []));
  await page.goto(`?demo&${q}`);
  expect(await is3d(page)).toBe(true);
}
/** `tapAt`'s aim at the bug's model where it's drawn at the tap (it flies in to its trunk). */
const theBug: Aim<null> = (w) => {
  for (let n = 0; n < 60; n++) {
    const at = w.__world3d.modelAt(`bug-${n}`);
    if (at) return at[0] > 15 && at[0] < innerWidth - 15 && at[1] > 60 && at[1] < innerHeight - 50 ? at : null;
  }
  return null;
};
const cues = (page: Page) => page.evaluate(() => (window as unknown as { __cues: string[] }).__cues.slice());

test('a giraffe stag on a palm at night: netted, it is in the ずかん and on show in the museum', async ({ page }) => {
  await open(page, 'critter=giraffe-stag&date=2026-07-15T21:00');
  await tapAt(page, theBug, null, { clear: null, timeout: 15_000, intervals: [50], mouse: true });
  await expect.poll(() => cues(page)).toContain('scene-catch');
  await expect(page.locator('[data-fx="catch"]')).toContainText('ギラファノコギリクワガタを つかまえた！');
  // the ずかん: one bug found, the giraffe stag's tile and its card
  await fromMenu(page, 'zukan');
  await page.locator('[data-zukan="bug"]').click();
  await page.locator('button.tile[data-entry="giraffe-stag"]').click();
  await expect(page.locator('[data-zukan-detail="giraffe-stag"]')).toContainText('ギラファノコギリクワガタ');
  // the museum: on show on its palm in the bug wing
  await page.goto('museum?demo&date=2026-07-15T21:00');
  await roomUp(page, 'museum');
  const sp = await page.evaluate(() => (window as unknown as { __museum: M }).__museum.specimens());
  expect(sp.find((s) => s.id === 'giraffe-stag')).toMatchObject({ kind: 'bug', tank: 'palm' });
});

test('a dung beetle rolls its snowball before it over the winter lawn', async ({ page }) => {
  await open(page, 'critter=dung-beetle&date=2027-01-15T12:00');
  // its snowball drawn, a beetle's head-and-a-radius (15.6u) in front of it, on the ground, as it goes (before its
  // motion's first frame too: critterMotion3d.ts ball3 drew it inside the beetle then, gap 0)
  const pair = () => page.evaluate(() => {
    const w = (window as unknown as { __world3d: W3 }).__world3d;
    for (let n = 0; n < 60; n++) {
      const b = w.where(`bug-${n}`), s = w.where(`ball-${n}`);
      if (b && s) return { gap: Math.hypot(s.x - b.x, s.z - b.z), hidden: s.hidden, up: s.y - b.y };
    }
    return null;
  });
  await expect.poll(async () => (await pair())?.hidden, { timeout: 15_000 }).toBe(false);
  const p = (await pair())!;
  expect(p.gap).toBeGreaterThan(12);
  expect(p.gap).toBeLessThan(19);
  // netted, the snowball goes with it
  await tapAt(page, theBug, null, { clear: null, timeout: 15_000, intervals: [50], mouse: true });
  await expect.poll(() => cues(page)).toContain('scene-catch');
  await expect.poll(async () => (await pair())?.hidden ?? true).toBe(true);
});
