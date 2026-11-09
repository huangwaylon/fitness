// Group stretching (docs/design.md "Group stretching"): NH's ラジオ体操. The tape deck comes out on a day either of us met
// 🍑 Exercise or when the island is opened 06:00–08:00, clear of every control; a tap plays its tape (the `stretch`
// cue) and every awake villager and the visitor do the same three stretches together (~6 s; one asleep, its app
// closed, sleeps through it); then the deck is gone for the day on this phone. No ベル.
import { expect, test, type Page } from './fixtures.ts';
import { is3d, islandUp, w3 } from './island.ts';
import { hudBells } from './hud.ts';

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
  await page.goto('?demo&date=2026-11-01T07:00&visitor=daisy-mae'); // a Sunday morning: Daisy Mae is on the beach
  await islandUp(page);
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
      // (mine, the partner's and the visitor's: not the guest's villager)
      const a = [...document.querySelectorAll('.actor:not([data-who="G"]) .vil .body, [data-visitor]')].map((e) => e.getAttribute(e.hasAttribute('data-visitor') ? 'data-motion' : 'data-act'));
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
  // (the partner's villager, its app closed, sleeps through it)
  const at = ['warmup', 'sidebend', 'leap'].map((p) => seen.indexOf([p, '', p].join(',')));
  expect(at.every((i) => i >= 0), seen.join(' | ')).toBe(true);
  expect([...at].sort((a, b) => a - b)).toEqual(at);
  await expect(hudBells(page)).toHaveAttribute('aria-label', bells!);
  // once a day per phone
  await page.reload();
  await islandUp(page);
  await page.waitForTimeout(800);
  await expect(page.locator(LIVE)).toHaveCount(0);
});

test('no deck on a later hour without Exercise met; a morning opening keeps it out for the day', async ({ page }) => {
  await page.goto('?demo&date=2026-11-02T09:00');
  await islandUp(page);
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

  test('its day (a morning): a tap on the deck and everyone stretches; done, a tap says so', { tag: '@logic', annotation: { type: 'logic', description: 'drawn: a transient pose or effect (a squish, a sparkle) over before a software-GL frame shows it' } }, async ({ page }) => {
    await page.goto('?demo&date=2026-11-01T07:00');
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
    await page.goto('?demo&date=2026-11-02T09:00');
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

// The guest's villager joins the island's group stretching as a member's does (2026-11-06): on its own phone, and on a
// member's phone while its app is open; a villager whose app is closed sleeps through it (2026-11-09).
/** Every change of what each villager is doing (`[data-actor]` order: mine, partner, third), recorded in the page. */
const watchActs = (page: Page) =>
  page.evaluate(() => {
    const w = window as { __vacts?: string[] };
    w.__vacts = [];
    const snap = () => {
      const s = [...document.querySelectorAll('[data-actor] .vil .body')].map((e) => e.getAttribute('data-act')).join(',');
      if (w.__vacts![w.__vacts!.length - 1] !== s) w.__vacts!.push(s);
    };
    new MutationObserver(snap).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['data-act'], childList: true });
  });
/** Nobody walking. */
const settled = (page: Page) =>
  expect.poll(() => page.locator('[data-actor].walking').count(), { timeout: 20_000 }).toBe(0);
/** Each pose seen by the awake villagers at once, in order (`awake`: mine, partner, third; the rest sleep through). */
async function allStretched(page: Page, awake: readonly boolean[]) {
  const seen = await page.evaluate(() => (window as { __vacts?: string[] }).__vacts ?? []);
  const at = ['warmup', 'sidebend', 'leap'].map((p) => seen.indexOf(awake.map((on) => (on ? p : '')).join(',')));
  expect(at.every((i) => i >= 0), seen.join(' | ')).toBe(true);
  expect([...at].sort((a, b) => a - b)).toEqual(at);
}

test('the guest’s phone: a tap on the deck and its villager stretches; the members’, their apps closed, sleep through it', async ({ page }) => {
  await page.goto('?demo&date=2026-11-01T07:00&as=G');
  await islandUp(page);
  await expect(deck(page)).toBeVisible();
  await expect(page.locator('[data-actor] .vil')).toHaveCount(3);
  await settled(page);
  await watchActs(page);
  const pt = await deckPoint(page);
  await page.mouse.click(pt.x, pt.y);
  await expect(page.locator('[data-stretch="on"]')).toBeAttached();
  await expect(page.locator(LIVE)).toHaveCount(0, { timeout: 15_000 });
  await allStretched(page, [true, false, false]);
});

test('a member’s tap with the guest here: the guest’s villager stretches on the member’s phone too (the partner’s asleep)', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const open = async (more: string) => {
    const p = await ctx.newPage();
    await p.goto(`?demo&date=2026-11-01T07:00${more}`);
    await islandUp(p);
    return p;
  };
  const a = await open('');
  await open('&as=G');
  // the guest's villager on A's island (its app open)
  await expect(a.locator('[data-actor] .vil')).toHaveCount(3, { timeout: 10_000 });
  await expect(deck(a)).toBeVisible();
  await settled(a);
  await watchActs(a);
  const pt = await deckPoint(a);
  await a.mouse.click(pt.x, pt.y);
  await expect(a.locator('[data-stretch="on"]')).toBeAttached();
  await expect(a.locator(LIVE)).toHaveCount(0, { timeout: 15_000 });
  await allStretched(a, [true, false, true]);
  await ctx.close();
});
