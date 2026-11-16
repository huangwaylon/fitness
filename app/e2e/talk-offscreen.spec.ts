// A speaker out of view (docs/design.md "Dialogue"): a world node past the horizon is `visibility: hidden` with its last
// box, so a balloon placed by that box stood in the sky. Chip's cheer at a catch while he's out of view is a banner with
// his name instead; in view, the balloon by him as before. A synthetic layout: only the guest spot, on a clifftop tile far
// back (x16/z56, the demo island's last row: the user's was x14/z67), past the horizon from まえ.
import { expect, test, type Page } from './fixtures.ts';
import { camTo, geo, islandUp } from './island.ts';
import JA from '../src/lib/i18n/ja.json' with { type: 'json' };
import CATCH from '../src/lib/i18n/catch.ja.json' with { type: 'json' };

test.use({ viewport: { width: 393, height: 852 } });

const SPOT = ['decor', { sc: 'o', id: 'guest-spot-far', at: 1.79e12, k: 'guest-spot', x: 16, z: 56, f: 0 }, 'A'] as const;
const seed = (page: Page) =>
  page.addInitScript(([day, op]) => {
    if (localStorage.getItem('island-demo.events')) return;
    const at = Date.parse(`${day}T09:00:00+09:00`);
    const [type, data, person] = op;
    localStorage.setItem('island-demo.events', JSON.stringify({ day, events: [{ id: 'seed-0', type, data, queuedAt: at, tries: 0, nextAt: 0, ackedAt: at, person }] }));
  }, ['2026-11-16', SPOT] as const);

const CHIP = '[data-visitor="chip"][data-slot="guest"]';
const catchFish = (page: Page) =>
  page.evaluate(() => document.querySelector('.scene')!.dispatchEvent(new CustomEvent('island:catch', { detail: { kind: 'fish', id: 'sea-bass' } })));
/** Whether Chip's node is drawn now (a node out of view is `visibility: hidden`). */
const chipShown = (page: Page) => page.locator(CHIP).evaluate((e) => e.checkVisibility({ visibilityProperty: true }));
/** The gap between the placed balloon's box and Chip's (px; 0 overlapping), or null with no balloon. */
const balloonOff = (page: Page) =>
  page.evaluate((sel) => {
    const b = document.querySelector('[data-fx="talk"].placed')?.getBoundingClientRect(), a = document.querySelector(`${sel} .art`)!.getBoundingClientRect();
    return b ? Math.hypot(Math.max(0, b.left - a.right, a.left - b.right), Math.max(0, b.top - a.bottom, a.top - b.bottom)) : null;
  }, CHIP);

/** Whether the text's last character (the closing 」) stands on a line of its own: its box below the one before it. */
const closeAlone = (txt: Element) => {
  const w = document.createTreeWalker(txt, NodeFilter.SHOW_TEXT), nodes: Text[] = [];
  while (w.nextNode()) if ((w.currentNode as Text).data.trim()) nodes.push(w.currentNode as Text);
  const box = (n: Text, i: number) => { const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + 1); return r.getBoundingClientRect(); };
  const last = nodes.at(-1)!, end = box(last, last.data.trimEnd().length - 1);
  const prevNode = last.data.trimEnd().length > 1 ? last : nodes.at(-2)!, prev = box(prevNode, prevNode === last ? last.data.trimEnd().length - 2 : prevNode.data.trimEnd().length - 1);
  return end.top > prev.bottom - 2;
};

async function open(page: Page) {
  await seed(page);
  await page.goto('?demo&date=2026-11-16T12:00&guest=chip&critter=none');
  await islandUp(page);
  await expect(page.locator(`${CHIP} .art`)).toBeAttached();
  // (here: a cheer waits for his arrival)
  await expect(page.locator(CHIP)).toHaveAttribute('data-phase', 'here');
  return geo(page);
}

test('Chip out of view (past the horizon from まえ): his cheer at a catch is a banner with his name, no balloon in the sky', async ({ page }) => {
  const g = await open(page);
  // seen at the back first (his node placed on screen, its box kept when it's hidden), then the camera to the front
  await camTo(page, g.CAMS.oku);
  await expect.poll(() => chipShown(page)).toBe(true);
  await camTo(page, g.CAMS.mae);
  await expect.poll(() => chipShown(page)).toBe(false);
  await catchFish(page);
  await expect(page.locator('.banner[role="status"] .txt')).toContainText(JA['chat.sp.chip.cheer'].split(' ')[0], { timeout: 8000 });
  await expect(page.locator('.banner[role="status"] .txt')).toContainText(JA['visitor.chip']);
  await expect(page.locator('[data-fx="talk"].placed')).toHaveCount(0);
  // the banner is his: his own icon on the left (not しずえ's), the fish's real name, and its closing 」 never alone on a line
  const banner = page.locator('.banner[role="status"]');
  expect(await banner.locator('.txt').evaluate(closeAlone)).toBe(false);
  // (WebKit's keep-all breaks between ！ and 」 where the line runs out: the pair is kept on one line)
  await expect(banner.locator('.txt .num').last()).toHaveText('！」');
  await expect(banner.locator('.pebble img')).toHaveAttribute('src', /room\/npc\/chip\.webp/);
  await expect(banner.locator('.txt')).toContainText(CATCH['critter.name.sea-bass']);
});

test('Chip in view: his cheer at a catch is the balloon by him', async ({ page }) => {
  const g = await open(page);
  await camTo(page, g.CAMS.oku);
  await expect.poll(() => chipShown(page)).toBe(true);
  await catchFish(page);
  await expect(page.locator('[data-fx="talk"].placed .who')).toHaveText(JA['visitor.chip'], { timeout: 8000 });
  expect(await balloonOff(page)).toBeLessThan(80);
});
