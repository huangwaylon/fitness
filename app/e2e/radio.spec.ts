// Group stretching (docs/design.md "Group stretching"): NH's ラジオ体操. The tape deck comes out on a day either of us met
// 🍑 Exercise or when the island is opened 06:00–08:00, clear of every control; a tap plays its tape (the `stretch`
// cue) and both villagers and the visitor do the same three stretches together (~6 s); then the deck is gone for the
// day on this phone. No ベル.
import { expect, test, type Page } from '@playwright/test';
import { is3d, w3 } from './island.ts';
import { hudBells, hudMenu } from './hud.ts';

/** The deck out to play (ready) or playing (the layout's deck stands every day: `idle` when it isn't its day). */
const LIVE = '[data-stretch]:not([data-stretch="idle"])';
const deck = (page: Page) => page.locator('[data-stretch] .radio');
/** The controls under the deck's corners and middle. */
const under = (page: Page) =>
  page.evaluate(() => {
    const b = document.querySelector('[data-stretch] .radio')!.getBoundingClientRect();
    const pts = [[b.left + 2, b.top + 2], [b.right - 2, b.top + 2], [b.left + 2, b.bottom - 2], [b.right - 2, b.bottom - 2], [(b.left + b.right) / 2, (b.top + b.bottom) / 2]];
    // (the villagers only pass by: their figures may stand in front of it a while)
    return pts.flatMap(([x, y]) => document.elementsFromPoint(x, y).filter((e) => e.closest('button') && !e.closest('[data-actor]')).map((e) => e.className));
  });
/** A point of the deck nothing stands in front of (a villager passing by), polled. */
async function deckPoint(page: Page): Promise<{ x: number; y: number }> {
  const find = () => page.evaluate(() => {
    const b = document.querySelector('[data-stretch] .radio')!.getBoundingClientRect();
    for (const [fx, fy] of [[0.5, 0.5], [0.5, 0.25], [0.25, 0.5], [0.75, 0.5], [0.5, 0.8], [0.2, 0.2], [0.8, 0.2], [0.2, 0.8], [0.8, 0.8]]) {
      const x = b.left + b.width * fx, y = b.top + b.height * fy;
      if (!document.elementFromPoint(x, y)?.closest('button')) return { x, y };
    }
    return null;
  });
  let p: { x: number; y: number } | null = null;
  await expect.poll(async () => (p = await find()), { message: 'a point of the deck with nothing in front of it' }).not.toBeNull();
  return p!;
}
/** What each of the villagers and the visitor is doing (the villagers' rig's motion, the visitor's director motion: its
 *  3D model's pose). */
const acts = (page: Page) =>
  page.evaluate(() => [...document.querySelectorAll('.vil .body, [data-visitor]')].map((e) => e.getAttribute(e.hasAttribute('data-visitor') ? 'data-motion' : 'data-act')));

test('a morning: the tape deck is out, clear of every control; a tap and everyone stretches in sync', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => ((window as { __cues?: string[] }).__cues = []));
  await page.goto('?demo&date=2026-11-01T07:00&critter=none'); // a Sunday morning: Daisy Mae is on the beach
  await expect(hudMenu(page)).toBeVisible();
  const bells = await hudBells(page).getAttribute('aria-label');
  await expect(deck(page)).toBeVisible();
  await expect(page.locator('[data-visitor="daisy-mae"] .art')).toBeVisible();
  expect(await under(page)).toEqual([]);
  // every change of what they're doing, recorded in the page (a sample from the test could miss a 2 s pose on a busy
  // runner): the three poses, each by everyone at once, in order
  await page.evaluate(() => {
    const w = window as { __acts?: string[] };
    w.__acts = [];
    const snap = () => {
      const a = [...document.querySelectorAll('.vil .body, [data-visitor]')].map((e) => e.getAttribute(e.hasAttribute('data-visitor') ? 'data-motion' : 'data-act'));
      const s = a.join(',');
      if (w.__acts![w.__acts!.length - 1] !== s) w.__acts!.push(s);
    };
    new MutationObserver(snap).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['data-act', 'data-motion'], childList: true });
  });
  const pt = await deckPoint(page);
  await page.mouse.click(pt.x, pt.y);
  await expect(page.locator('[data-stretch="on"]')).toBeAttached();
  expect(await page.evaluate(() => (window as { __cues?: string[] }).__cues)).toContain('stretch');
  await expect(page.locator(LIVE)).toHaveCount(0, { timeout: 15_000 });
  const seen = await page.evaluate(() => (window as { __acts?: string[] }).__acts ?? []);
  const at = ['warmup', 'sidebend', 'leap'].map((p) => seen.indexOf([p, p, p].join(',')));
  expect(at.every((i) => i >= 0), seen.join(' | ')).toBe(true);
  expect([...at].sort((a, b) => a - b)).toEqual(at);
  await expect(hudBells(page)).toHaveAttribute('aria-label', bells!);
  // once a day per phone
  await page.reload();
  await expect(hudMenu(page)).toBeVisible();
  await page.waitForTimeout(800);
  await expect(page.locator(LIVE)).toHaveCount(0);
});

test('no deck on a later hour without Exercise met; a morning opening keeps it out for the day', async ({ page }) => {
  await page.goto('?demo&date=2026-11-02T09:00');
  await expect(hudMenu(page)).toBeVisible();
  await page.waitForTimeout(800);
  await expect(page.locator(LIVE)).toHaveCount(0);
  await page.goto('?demo&date=2026-11-02T06:10');
  await expect(deck(page)).toBeVisible();
  await page.goto('?demo&date=2026-11-02T09:00');
  await expect(deck(page)).toBeVisible();
});

// The 3D island's layout (the user: "what is the point of the radio on the ground? Tapping it does nothing. It's also
// super tiny"): the deck is the layout's piece, there every day, NH's boom box at the villagers' scale; a tap plays
// the tape on its day and everyone stretches (the 3D villagers posed: NH's three), else it says when it plays, or
// that today's is done.
const talk = (page: Page) => page.locator('.talk');
const tapDeck = async (page: Page) => {
  const p = await deckPoint(page);
  await page.mouse.click(p.x, p.y);
};
test.describe('the layout’s deck', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => ((window as { __cues?: string[] }).__cues = []));
  });

  test('its day (a morning): a tap on the deck and everyone stretches; done, a tap says so', async ({ page }) => {
    await page.goto('?demo&date=2026-11-01T07:00&critter=none&visitor=none');
    await is3d(page);
    await expect(page.locator('[data-stretch="ready"]')).toBeAttached();
    // the model stands where its tap area is, NH's size beside the villagers: about half a villager's height (at DECOR_U, a
    // fifth: "super tiny"; the villager's box a little taller than it, and further back)
    await expect.poll(() => w3(page, (w) => { const p = w.where('tape-deck'); return !!p && !p.hidden; })).toBe(true);
    const box = (await deck(page).boundingBox())!, vil = (await page.locator('[data-actor="mine"] .vil').boundingBox())!;
    expect(box.height / vil.height).toBeGreaterThan(0.3);
    await tapDeck(page);
    await expect(page.locator('[data-stretch="on"]')).toBeAttached();
    expect(await page.evaluate(() => (window as { __cues?: string[] }).__cues)).toContain('stretch');
    // the villagers stretch (the director's poses, which the 3D villagers play)
    await expect.poll(() => acts(page), { timeout: 4000 }).toContain('warmup');
    // over: the deck stays (the layout's), idle; a tap says today's is done
    await expect(page.locator('[data-stretch="idle"]')).toBeAttached({ timeout: 15_000 });
    await tapDeck(page);
    await expect(talk(page)).toContainText('おしまい');
    await expect(page.locator('[data-stretch="on"]')).toHaveCount(0);
  });

  test('not its day: the deck stands, no ♪, and a tap says when it plays', async ({ page }) => {
    await page.goto('?demo&date=2026-11-02T09:00&critter=none&visitor=none');
    await is3d(page);
    await expect(page.locator('[data-stretch="idle"]')).toBeAttached();
    await expect(page.locator('[data-stretch] .hint')).toHaveCount(0);
    // (a thumb's reach: 44px round it, a tap just under the radio is on it)
    const r = (await deck(page).boundingBox())!;
    await page.mouse.click(r.x + r.width / 2, r.y + r.height + Math.max(2, (44 - r.height) / 2 - 2));
    await expect(talk(page)).toContainText('エクササイズ');
    await expect(page.locator('[data-stretch="on"]')).toHaveCount(0);
  });
});
