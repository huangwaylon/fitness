// The island's launch, frame by frame (docs/design.md "Players"; the 3D island's first frame): nothing shows over
// the canvas before the island does, nothing jumps once it's there. A villager's flat card stays until its 3D model is
// drawn (its programs out of the engine's warm-up), never a gap with only its blob of shadow; the world layer's HTML
// stand-ins (a sleeper's zzz, a note, the board's 「！」, the canopy's fruit) wait for the island's first frame; the
// sky opens at the camera's horizon (its sun and its band don't move as the engine reports it). Each display frame
// is looked at by a waitForFunction polling on rAF.
import { expect, test, type Page } from './fixtures.ts';

test.use({ viewport: { width: 393, height: 852 } });

/** My villager in its villager look (the demo's `look` pref, seeded: fishing3d.spec's): a card until its model is in. */
const asVillager = (page: Page) => page.addInitScript(() => {
  if (localStorage.getItem('island-demo.events')) return;
  const at = Date.parse('2026-11-04T09:00:00+09:00');
  const ev = { id: 'seed-look', type: 'pref', data: { key: 'look', value: { kind: 'villager' } }, queuedAt: at, tries: 0, nextAt: 0, ackedAt: at, person: 'A' };
  localStorage.setItem('island-demo.events', JSON.stringify({ day: '2026-11-04', events: [ev] }));
});

type Box = { n: number; first: number; bad: string[]; sunY?: number; skyH?: number; card?: boolean; seen?: boolean; body?: number };
type Win = Window & {
  __fl?: Box;
  __world3d?: { loaded(): boolean; stats(): { island: boolean } };
  __villagers3?: { figure(slot: string): { card: boolean; body: boolean } };
};

/** Every display frame from now until the island stands loaded and `more` frames on (and `until`, if any): what shows
 *  over the canvas before its first frame, the sky's sun and band, and my villager's card or model. */
const watch = (page: Page, until: 'body' | null) => page.waitForFunction((until) => {
  const w = window as unknown as Win, s = (w.__fl ??= { n: 0, first: 0, bad: [] });
  s.n++;
  const st = w.__world3d?.stats();
  // the first frame with the island on screen (engine.ts stats: its ground drawn, not held back by the warm-up)
  if (!s.first && st?.island) s.first = s.n;
  const shows = (el: Element) => {
    const r = el.getBoundingClientRect();
    return r.width > 1 && r.height > 1 && r.bottom > 0 && r.top < innerHeight && el.checkVisibility({ opacityProperty: true, visibilityProperty: true });
  };
  if (!s.first) {
    for (const el of document.querySelectorAll('.if-scene :is(.float[data-mark], .news, .fruit img.official[src])'))
      if (shows(el)) s.bad.push(`${s.n}: ${el.className || el.tagName} ${el.getAttribute('data-mark') ?? ''} before the first frame`);
  }
  const sun = document.querySelector('.if-scene .sky.lights .orb'), sky = document.querySelector('.if-scene .sky:not(.lights)');
  if (sun && shows(sun)) {
    const y = Math.round(sun.getBoundingClientRect().top);
    s.sunY ??= y;
    if (Math.abs(y - s.sunY) > 1) s.bad.push(`${s.n}: the sun moved ${s.sunY} → ${(s.sunY = y)}`);
  }
  if (sky && shows(sky)) {
    const h = Math.round(sky.getBoundingClientRect().height);
    s.skyH ??= h;
    if (Math.abs(h - s.skyH) > 1) s.bad.push(`${s.n}: the sky's band ${s.skyH} → ${(s.skyH = h)}`);
  }
  const f = until === 'body' ? w.__villagers3?.figure('mine') : undefined;
  if (f) {
    s.card ||= f.card;
    s.seen ||= f.card || f.body;
    if (s.seen && !f.card && !f.body) s.bad.push(`${s.n}: my villager neither a card nor a model`);
    if (f.body) s.body ??= s.n;
  }
  const done = !!s.first && !!w.__world3d?.loaded() && s.n > s.first + 20;
  return done && (until !== 'body' || (s.body !== undefined && s.n > s.body + 20)) ? s : false;
}, until, { polling: 'raf', timeout: 25_000 }).then((h) => h.jsonValue() as Promise<Box>);

test('nothing over the canvas before the first frame; the sky where it opens', async ({ page }) => {
  await page.goto('?demo', { waitUntil: 'commit' });
  const box = await watch(page, null);
  // (the demo's launch has them: a sleeper's zzz or a note on the others, the fruit in the canopies)
  expect(await page.locator('.if-scene .fruit img.official').count()).toBeGreaterThan(0);
  expect(box.sunY, 'the sun shown').toBeDefined();
  expect(box.bad).toEqual([]);
});

test('my villager: its card until its model is drawn, never neither @render', async ({ page }) => {
  await asVillager(page);
  // its model held back till its card has shown (~a second's wait, a slow phone's)
  let release!: () => void;
  const held = new Promise<void>((r) => (release = r));
  await page.route('**/room/villagers3d/*.glb*', async (r) => {
    await held;
    await r.continue();
  });
  await page.goto('?demo', { waitUntil: 'commit' });
  const box = watch(page, 'body');
  await page.waitForFunction(() => (window as unknown as Win).__fl?.card, null, { polling: 'raf', timeout: 25_000 });
  release();
  const b = await box;
  expect(b.body, 'its model drawn').toBeDefined();
  expect(b.bad).toEqual([]);
});
