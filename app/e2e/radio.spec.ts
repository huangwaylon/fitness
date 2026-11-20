// Group stretching (docs/design.md "Group stretching"): NH's ラジオ体操. The tape deck comes out on a day either of us met
// 🍑 Exercise or when the island is opened 06:00–08:00, clear of every control; a tap plays its tape (the `stretch`
// cue) and every awake villager and the visitor do the same three stretches together (~6 s; one asleep, its app
// closed, sleeps through it); then the deck is gone for the day on this phone. No ベル.
import { expect, test, type Page } from './fixtures.ts';
import { BUTTONS, is3d, islandUp, propsOut, villager, visitorOut, w3, walking, type W3 } from './island.ts';
import { hudBells } from './hud.ts';

/** The tape deck's state (`__world3d.props`: on (playing), ready (its day), idle: the layout's deck stands every day), or
 *  undefined: none. */
const deckIs = async (page: Page) => (await propsOut(page)).deck?.state;
/** The deck out to play (ready) or playing. */
const live = async (page: Page) => ((s) => !!s && s !== 'idle')(await deckIs(page));
/** The deck drawn now. */
const deckShown = async (page: Page) => !!(await propsOut(page)).deck?.shown;
/** The deck's box on screen (client px). */
const deckBox = async (page: Page) => (await w3(page, (w) => w.box('deck')))!;
/** The controls under the deck's corners and middle, stacked or not (`__world3d.controls`). */
const under = (page: Page) =>
  page.evaluate(() => {
    const w = (window as unknown as { __world3d: W3 }).__world3d, b = w.box('deck')!, [r, bt] = [b.left + b.width, b.top + b.height];
    const pts = [[b.left + 2, b.top + 2], [r - 2, b.top + 2], [b.left + 2, bt - 2], [r - 2, bt - 2], [(b.left + r) / 2, (b.top + bt) / 2]];
    // (the villagers only pass by: their figures may stand in front of it a while)
    return pts.flatMap(([x, y]) => w.controls().filter((c) => c.kind !== 'villager' && x >= c.box.left && x <= c.box.left + c.box.width && y >= c.box.top && y <= c.box.top + c.box.height).map((c) => `${c.kind}:${c.id}`));
  });
/** A point of the deck nothing stands in front of (a villager passing by), polled. */
async function deckPoint(page: Page): Promise<{ x: number; y: number }> {
  const find = () => page.evaluate((controls) => {
    const w = (window as unknown as { __world3d: W3 }).__world3d, b = w.box('deck')!;
    for (const [fx, fy] of [[0.5, 0.5], [0.5, 0.25], [0.25, 0.5], [0.75, 0.5], [0.5, 0.8], [0.2, 0.2], [0.8, 0.2], [0.2, 0.8], [0.8, 0.8]]) {
      const x = b.left + b.width * fx, y = b.top + b.height * fy, p = w.pick(x, y);
      if (!p || !controls.includes(p.kind)) return { x, y };
    }
    return null;
  }, BUTTONS);
  let p: { x: number; y: number } | null = null;
  await expect.poll(async () => (p = await find()), { message: 'a point of the deck with nothing in front of it' }).not.toBeNull();
  return p!;
}
/** What each of the villagers and the visitor is doing (the villagers' rig's motion, the visitor's director motion: its
 *  3D model's pose). */
const acts = (page: Page) =>
  page.evaluate(() => {
    const w = (window as unknown as { __world3d: W3 }).__world3d;
    return [...['mine', 'partner', 'third'].flatMap((s) => ((a) => (a ? [a.act] : []))(w.actor(s))), ...w.visitors().filter((v) => v.id !== 'kk').map((v) => v.motion)];
  });

test('a morning: the tape deck is out, clear of every control; a tap and everyone stretches in sync', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => ((window as { __cues?: string[] }).__cues = []));
  await page.goto('?demo&date=2026-11-01T07:00&visitor=daisy-mae'); // a Sunday morning: Daisy Mae is on the beach
  await islandUp(page);
  const bells = await hudBells(page).getAttribute('aria-label');
  await expect.poll(() => deckShown(page)).toBe(true);
  await expect.poll(async () => (await visitorOut(page, 'daisy-mae'))?.shown).toBe(true);
  expect(await under(page)).toEqual([]);
  // every change of what they're doing, recorded in the page (a sample from the test could miss a 2 s pose on a busy
  // runner): the three poses, each by everyone at once, in order
  await page.evaluate(() => {
    const w = window as { __acts?: string[] };
    w.__acts = [];
    const snap = () => {
      // (mine, the partner's and the visitor's: not the guest's villager)
      const w3 = (window as unknown as { __world3d: W3 }).__world3d;
      const a = [...['mine', 'partner', 'third'].flatMap((s) => ((v) => (v && v.who !== 'G' ? [v.act] : []))(w3.actor(s))), ...w3.visitors().filter((v) => v.id !== 'kk').map((v) => v.motion)];
      const s = a.join(',');
      if (w.__acts![w.__acts!.length - 1] !== s) w.__acts!.push(s);
    };
    new MutationObserver(snap).observe(document.body, { subtree: true, attributes: true, childList: true });
    setInterval(snap, 20); // (the visitor's motion is its model's: no DOM change with it)
  });
  const pt = await deckPoint(page);
  await page.mouse.click(pt.x, pt.y);
  await expect.poll(() => deckIs(page)).toBe('on');
  expect(await page.evaluate(() => (window as { __cues?: string[] }).__cues)).toContain('stretch');
  await expect.poll(() => live(page), { timeout: 15_000 }).toBe(false);
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
  await expect.poll(() => live(page)).toBe(false);
});

test('no deck on a later hour without Exercise met; a morning opening keeps it out for the day', async ({ page }) => {
  await page.goto('?demo&date=2026-11-02T09:00');
  await islandUp(page);
  await page.waitForTimeout(800);
  await expect.poll(() => live(page)).toBe(false);
  await page.goto('?demo&date=2026-11-02T06:10');
  await expect.poll(() => deckShown(page)).toBe(true);
  await page.goto('?demo&date=2026-11-02T09:00');
  await expect.poll(() => deckShown(page)).toBe(true);
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
    await expect.poll(() => deckIs(page)).toBe('ready');
    // the model stands where its tap area is, NH's size beside the villagers: about half a villager's height (at DECOR_U, a
    // fifth: "super tiny"; the villager's box a little taller than it, and further back)
    await expect.poll(() => w3(page, (w) => { const p = w.where('tape-deck'); return !!p && !p.hidden; })).toBe(true);
    const box = await deckBox(page), vil = (await w3(page, (w) => w.box('villager', 'mine')))!;
    expect(box.height / vil.height).toBeGreaterThan(0.3);
    await tapDeck(page);
    await expect.poll(() => deckIs(page)).toBe('on');
    expect(await page.evaluate(() => (window as { __cues?: string[] }).__cues)).toContain('stretch');
    // the villagers stretch (the director's poses, which the 3D villagers play)
    await expect.poll(() => acts(page), { timeout: 4000 }).toContain('warmup');
    // over: the deck stays (the layout's), idle; a tap says today's is done
    await expect.poll(() => deckIs(page), { timeout: 15_000 }).toBe('idle');
    await tapDeck(page);
    await expect(talk(page)).toContainText('おしまい');
    await expect.poll(() => deckIs(page)).not.toBe('on');
  });

  test('not its day: the deck stands, no ♪, and a tap says when it plays', async ({ page }) => {
    await page.goto('?demo&date=2026-11-02T09:00');
    await is3d(page);
    await expect.poll(() => deckIs(page)).toBe('idle');
    expect((await propsOut(page)).deck?.hint).toBe(false);
    // (a thumb's reach: 44px round it, a tap just under the radio is on it)
    const r = await deckBox(page);
    await page.mouse.click(r.left + r.width / 2, r.top + r.height + Math.max(2, (44 - r.height) / 2 - 2));
    await expect(talk(page)).toContainText('エクササイズ');
    await expect.poll(() => deckIs(page)).not.toBe('on');
  });
});

// The guest's villager joins the island's group stretching as a member's does (2026-11-06): on its own phone, and on a
// member's phone while its app is open; a villager whose app is closed sleeps through it (2026-11-09).
/** Every change of what each villager is doing (mine, partner, third: `__world3d.actor`), recorded in the page. */
const watchActs = (page: Page) =>
  page.evaluate(() => {
    const w = window as { __vacts?: string[] };
    w.__vacts = [];
    const snap = () => {
      const w3 = (window as unknown as { __world3d: W3 }).__world3d;
      const s = ['mine', 'partner', 'third'].flatMap((id) => ((a) => (a ? [a.act ?? ''] : []))(w3.actor(id))).join(',');
      if (w.__vacts![w.__vacts!.length - 1] !== s) w.__vacts!.push(s);
    };
    new MutationObserver(snap).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['data-act'], childList: true });
  });
/** How many villagers are out. */
const villagers = async (page: Page) => (await Promise.all(['mine', 'partner', 'third'].map((s) => villager(page, s)))).filter(Boolean).length;
/** Nobody walking. */
const settled = (page: Page) =>
  expect.poll(async () => (await Promise.all(['mine', 'partner', 'third'].map((s) => walking(page, s)))).some(Boolean), { timeout: 20_000 }).toBe(false);
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
  // (the guest's island opens at its own villager, far up; the deck is at the front)
  await page.evaluate(() => { const w3 = (window as unknown as { __world3d: { go(z: number): void; limits(): { min: number } } }).__world3d; w3.go(w3.limits().min); });
  await expect.poll(() => deckShown(page)).toBe(true);
  await expect.poll(() => villagers(page)).toBe(3);
  await settled(page);
  await watchActs(page);
  const pt = await deckPoint(page);
  await page.mouse.click(pt.x, pt.y);
  await expect.poll(() => deckIs(page)).toBe('on');
  await expect.poll(() => live(page), { timeout: 15_000 }).toBe(false);
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
  await expect.poll(() => villagers(a), { timeout: 10_000 }).toBe(3);
  await expect.poll(() => deckShown(a)).toBe(true);
  await settled(a);
  await watchActs(a);
  const pt = await deckPoint(a);
  await a.mouse.click(pt.x, pt.y);
  await expect.poll(() => deckIs(a)).toBe('on');
  await expect.poll(() => live(a), { timeout: 15_000 }).toBe(false);
  await allStretched(a, [true, false, true]);
  await ctx.close();
});
