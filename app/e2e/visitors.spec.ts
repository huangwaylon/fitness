// Visitors (docs/design.md "Visitors"): K.K. on his stool (a song on request, for anyone, at any hour), Daisy Mae on Sunday
// mornings, one of NH's weekday visitors most other days (Wisp at night, Gulliver washed up and asleep until the fifth
// nudge). They stand at centre stage (the layout's plaza, a clear patch of lawn behind the villagers, seen as the island
// opens at まえ), Gulliver on the front beach, never under a control; a tap gives a line (an introduction first), no
// trading, no ベル.
import { expect, test, type Page } from './fixtures.ts';
import { BUTTONS, camTo, controlsUnder, geo, islandUp, offFrom, quiet, tapAt, tapFigure, visitorOut, visitorsOut, type W3 } from './island.ts';
import { hudBells } from './hud.ts';
import { ROLES, isSpecial } from '../src/lib/world/visitorRoles.ts';
import { dayVisitor } from '../src/lib/world/visitors.ts';
import { addDays } from '../src/lib/time/dates.ts';
import JA from '../src/lib/i18n/visitors.ja.json' with { type: 'json' };

// the day's visitor and their life are ambient life (e2e/fixtures.ts): on here; a test pins its own with ?visitor=
test.use({ ambient: 'on' });

/** Press a balloon's choice where it is on screen (a locator click would first scroll it "into view": the stage is
 *  sticky in the camera's scroller, so that moves the camera). */
async function choose(page: Page, choice: ReturnType<Page['locator']>) {
  await expect(choice).toBeVisible();
  await page.waitForTimeout(300); // its pop-in
  const r = (await choice.boundingBox())!;
  await page.mouse.click(r.x + r.width / 2, r.y + r.height / 2);
}

const music = (page: Page) => page.addInitScript(() => localStorage.setItem('island.sound', JSON.stringify({ music: true, sfx: true, volume: 0.8 })));
/** Tap the balloon through its pages until its question is asked (its choices then show): only while a page is
 *  still typing or a ▼ shows (a tap on an asked question would close it). */
async function readOut(page: Page) {
  const box = page.locator('[data-fx="talk"].placed');
  await expect(box).toBeVisible();
  for (let i = 0; i < 40 && !(await page.locator('.choices.asking').count()); i++) {
    if (!(await box.count())) break;
    const busy = (await box.locator('[data-next]').count()) > 0 || ((await box.locator('.pg.now .rest').textContent({ timeout: 1000 }).catch(() => '')) ?? '') !== '';
    if (busy) {
      const b = (await box.boundingBox())!;
      await page.mouse.click(b.x + 24, b.y + 10);
    }
    await page.waitForTimeout(100);
  }
  await expect(page.locator('.choices.asking')).toBeVisible();
}

/** A tap on K.K. where nothing else takes it (a villager wandering past in front of him is theirs). */
async function tapKK(page: Page) {
  // (frame-locked, tapAt: a bare spot on him found and tapped with no frame between; a villager walking by took it)
  await tapAt(page, (w, controls) => {
    const r = w.__world3d.box('kk');
    if (!r?.width) return null;
    for (const fy of [0.5, 0.35, 0.65, 0.2, 0.8]) for (const fx of [0.5, 0.3, 0.7]) {
      const x = r.left + r.width * fx, y = r.top + r.height * fy, p = w.__world3d.pick(x, y);
      if (!p || !(controls.includes(p.kind) || p.kind === 'visitor')) return [x, y];
    }
    return null;
  }, BUTTONS, { clear: null, mouse: true, message: 'a bare spot on K.K.' });
}

/** K.K.'s stool on the page's layout (its middle, u). */
const kkAt = (page: Page) => page.evaluate(() => (window as unknown as { __layout: { pos(id: string): [number, number] } }).__layout.pos('kk-slider'));

test('K.K. lives on his stool, every day (a Friday evening too); on Saturday from 18:00 his show: with the music on he asks for a request and plays (NH)', async ({ page }) => {
  await music(page);
  await page.goto('?demo&date=2026-10-23T19:00&critter=none'); // a Friday: there, strumming to himself
  await islandUp(page);
  await expect.poll(async () => (await visitorOut(page, 'kk'))?.mode).toBe('day');
  await page.goto('?demo&date=2026-10-24T19:00&critter=none'); // a Saturday (not Halloween: Jack's night)
  await islandUp(page);
  await expect.poll(async () => (await visitorOut(page, 'kk'))?.mode).toBe('show');
  const bells = await hudBells(page).getAttribute('aria-label');
  // on his stool (the layout's), in view as the island opens (まえ)
  const g = await geo(page);
  await camTo(page, g.CAMS.mae, false);
  await expect.poll(async () => (await visitorOut(page, 'kk'))?.shown).toBe(true);
  expect(await offFrom(page, 'kk', '', ...(await kkAt(page)))).toBeLessThan(2);
  expect(await controlsUnder(page, 'kk')).toEqual([]);
  await tapFigure(page, 'kk');
  await expect(page.locator('[data-fx="talk"].placed .who')).toHaveText('とたけけ');
  await expect(page.locator('[data-fx="talk"] .sr')).toContainText('リクエストは あるかな？');
  await readOut(page);
  await expect(page.locator('.choice')).toHaveText(['リクエスト', 'おまかせ']);
  await choose(page, page.locator('.choice', { hasText: 'リクエスト' }));
  await readOut(page);
  const song = (await page.locator('.choice').first().textContent())!;
  await choose(page, page.locator('.choice').first());
  // the show: the caption, the villagers sway, he strums harder
  await expect(page.locator('[data-fx="kk-caption"].placed')).toHaveText(`♪ ${song}`);
  await expect(page.locator('.if-scene[data-show]')).toHaveCount(1);
  await expect.poll(async () => (await visitorOut(page, 'kk'))?.playing).toBe(true);
  // a tap mid-song: nothing disruptive, but ストップ ends it with his sign-off
  await tapFigure(page, 'kk');
  await readOut(page);
  await choose(page, page.locator('.choice', { hasText: 'ストップ' }));
  await expect(page.locator('[data-fx="kk-caption"]')).toHaveCount(0);
  await expect(page.locator('.if-scene[data-show]')).toHaveCount(0);
  await expect(page.locator('[data-fx="talk"] .sr')).toContainText('サンキュー');
  await expect(hudBells(page)).toHaveAttribute('aria-label', bells!);
});

// The user: "who can request songs from kk slider and when? … everyone should be able to request songs at any time".
// Each of the three (A, B, the guest), by day and at night (asleep, he wakes groggily): the request, then a song.
for (const as of ['A', 'B', 'G'] as const)
  for (const [when, line] of [['2026-11-04T15:00', 'いっきょく どうだい？'], ['2026-11-05T02:00', 'リクエスト かい？']] as const)
    test(`anyone asks K.K. for a song at any time: ${as} at ${when.slice(11)}`, async ({ page }) => {
      await music(page);
      await page.goto(`?demo&as=${as}&date=${when}&critter=none&visitor=none`); // a Wednesday afternoon; 2 a.m.
      await islandUp(page);
      await expect.poll(async () => (await visitorOut(page, 'kk'))?.mode).toBe(when.endsWith('02:00') ? 'asleep' : 'day');
      await camTo(page, (await geo(page)).CAMS.mae, false);
      await quiet(page); // (the opening beats over)
      await tapKK(page);
      await expect(page.locator('[data-fx="talk"] .sr')).toContainText(line);
      await readOut(page);
      await expect(page.locator('.choice')).toHaveText(['リクエスト', 'おまかせ']);
      await choose(page, page.locator('.choice', { hasText: 'おまかせ' }));
      await expect(page.locator('[data-fx="kk-caption"].placed')).toHaveText(/^♪ /);
      await expect.poll(async () => (await visitorOut(page, 'kk'))?.playing).toBe(true);
    });

test('K.K. with the music off still takes a request: the pick turns ミュージック on and he plays', async ({ page }) => {
  await page.goto('?demo&date=2026-10-24T20:00&critter=none');
  await islandUp(page);
  await camTo(page, (await geo(page)).CAMS.mae, false);
  await quiet(page); // (the opening beats over: the greeting cut a tap short)
  await tapKK(page);
  await expect(page.locator('[data-fx="talk"] .sr')).toContainText('リクエストは あるかな？');
  await readOut(page);
  await choose(page, page.locator('.choice', { hasText: 'おまかせ' }));
  await expect(page.locator('[data-fx="kk-caption"].placed')).toHaveText(/^♪ /);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('island.sound') ?? '{}').music)).toBe(true);
});

test('visitors stand where NH puts them (Daisy Mae and Wisp at centre stage, Gulliver on the beach) clear of every control; the first tap is an introduction', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const [q, id, name] of [['2026-11-01T08:00&critter=none', 'daisy-mae', 'ウリ'], ['2026-11-04T22:00&visitor=wisp&critter=none', 'wisp', 'ゆうたろう'], ['2026-11-04T12:00&visitor=gulliver&critter=none', 'gulliver', 'ジョニー']] as const) {
    await page.goto(`?demo&date=${q}`);
    await islandUp(page);
    const { CAMS, CENTRE_STAGE, BEACHED } = await geo(page);
    const [x, z] = id === 'gulliver' ? BEACHED : CENTRE_STAGE;
    await camTo(page, CAMS.mae, false);
    await expect.poll(async () => (await visitorOut(page, id))?.shown).toBe(true);
    expect(await offFrom(page, 'visitor', id, x, z), id).toBeLessThan(2);
    expect(await controlsUnder(page, 'visitor', id), id).toEqual([]);
    await tapFigure(page, 'visitor', id);
    if (id === 'gulliver') {
      // asleep face down: the fifth nudge wakes him (NH)
      await page.waitForTimeout(1100);
      for (let i = 1; i < 5; i++) {
        await tapFigure(page, 'visitor', id);
        await page.waitForTimeout(250);
      }
    }
    const box = page.locator('[data-fx="talk"].placed');
    await expect(box.locator('.who')).toHaveText(name);
    await expect(box).toHaveAttribute('data-pages', '2');
    // and its balloon covers none of the HUD's controls (it may sit over the island's: the museum, the trees)
    const notSelf = await page.evaluate(() => {
      const b = document.querySelector('[data-fx="talk"]')!.getBoundingClientRect();
      return [[b.left + 3, b.top + 3], [b.right - 3, b.bottom - 3], [(b.left + b.right) / 2, (b.top + b.bottom) / 2]]
        .flatMap(([x, y]) => document.elementsFromPoint(x, y).filter((e) => e.closest('button') && !e.closest('.stage')).map((e) => e.className));
    });
    expect(notSelf).toEqual([]);
  }
});

test('one visitor at a time (the user, 2026-11-25): the day’s, nobody else beside them', async ({ page }) => {
  await page.goto('?demo&date=2026-11-19T19:00');
  await islandUp(page);
  await expect.poll(async () => (await visitorsOut(page)).map((v) => v.id)).toEqual([dayVisitor('2026-11-19')]);
});

test('the day brings its visitor with no hook: Daisy Mae on a Sunday morning, drawn on the 3D island as her NH model, and she talks', async ({ page }) => {
  await page.goto('?demo&date=2026-11-08T09:00&critter=none');
  await islandUp(page);
  const { CAMS } = await geo(page);
  await camTo(page, CAMS.mae, false);
  // the 3D island stands her model where her node is (posed as the villagers are; her DOM node the tap box only), and
  // no visitor is ever a card
  await expect.poll(() => page.evaluate(() => (window as unknown as { __villagers3: { state(s: string): string | null } }).__villagers3.state('visitor')), { timeout: 15_000 }).toBe('idle');
  expect((await visitorOut(page, 'daisy-mae'))?.card).toBe(false);
  await tapFigure(page, 'visitor', 'daisy-mae');
  await expect(page.locator('[data-fx="talk"].placed .who')).toHaveText('ウリ');
});

test('the weekday rotation brings its visitor with no hook: Kicks on Thursday Nov 5 2026, at centre stage, and he talks', async ({ page }) => {
  expect(dayVisitor('2026-11-05')).toBe('kicks');
  await page.goto('?demo&date=2026-11-05T12:00&critter=none');
  await islandUp(page);
  const { CAMS, CENTRE_STAGE } = await geo(page);
  await camTo(page, CAMS.mae, false);
  await expect.poll(async () => (await visitorOut(page, 'kicks'))?.shown).toBe(true);
  expect(await offFrom(page, 'visitor', 'kicks', ...CENTRE_STAGE)).toBeLessThan(2);
  expect(await controlsUnder(page, 'visitor', 'kicks')).toEqual([]);
  await tapFigure(page, 'visitor', 'kicks');
  await expect(page.locator('[data-fx="talk"].placed .who')).toHaveText('シャンク');
});

test('a tap in a visitor’s reach (a finger’s slack beside its figure) with nothing exact under it still talks', async ({ page }) => {
  await page.goto('?demo&date=2026-11-04T12:00&visitor=redd&critter=none');
  await islandUp(page);
  const { CAMS } = await geo(page);
  await camTo(page, CAMS.mae, false);
  await expect.poll(async () => (await visitorOut(page, 'redd'))?.shown).toBe(true);
  // a point 5 px off its figure, on bare ground: no control there, no small thing's box (theirs would win: SceneTaps)
  const p = await page.evaluate(() => {
    const w = (window as unknown as { __world3d: W3 }).__world3d, b = w.box('visitor', 'redd')!;
    const r = { left: b.left, right: b.left + b.width, bottom: b.top + b.height }, mid = b.top + b.height / 2;
    // (the small things lying about and a tree shake's drops: their art's boxes grown to a thumb's 44 px, as their tap
    // boxes are: hitbox.ts MIN_HIT)
    const grow = (b: { left: number; top: number; width: number; height: number }) => {
      const cx = b.left + b.width / 2, cy = b.top + b.height / 2, hw = Math.max(b.width, 44) / 2 + 2, hh = Math.max(b.height, 44) / 2 + 2;
      return [cx - hw, cy - hh, cx + hw, cy + hh];
    };
    const boxes = [...w.care(), ...w.finds(), ...w.shakes().drops].map((t) => grow(t.box));
    // (either side, 5 px off, at a few heights: a day's weed or find may lie by one of them; 2026-11-28 a weed behind
    // Redd's middle on the pinned day)
    const ys = [mid, r.bottom - 10, b.top + 12, r.bottom - 24];
    for (const [x, y] of ys.flatMap((y) => [[r.left - 5, y], [r.right + 5, y]])) {
      const at = document.elementFromPoint(x, y);
      if (at?.classList.contains('stage') && !boxes.some(([l, t, rr, bb]) => x >= l && x <= rr && y >= t && y <= bb)) return { x, y };
    }
    return null;
  });
  expect(p).not.toBeNull();
  await page.mouse.click(p!.x, p!.y);
  await expect(page.locator('[data-fx="talk"].placed .who')).toHaveText('つねきち');
});

// The special characters (docs/design.md "Visitors: roles", world/visitorRoles.ts): in the rotation, each with a role.
test('a special character comes in the rotation with no hook: on their day at centre stage, alone, their introduction', async ({ page }) => {
  // (the first weekday from Nov 2 2026 that brings one who stands on the plaza)
  const date = Array.from({ length: 30 }, (_, i) => addDays('2026-11-02', i)).find((d) => ((v) => !!v && isSpecial(v) && !ROLES[v].beach)(dayVisitor(d)))!;
  const g = dayVisitor(date)!;
  await page.goto(`?demo&date=${date}T13:00&critter=none`);
  await islandUp(page);
  const { CAMS, CENTRE_STAGE } = await geo(page);
  await camTo(page, CAMS.mae, false);
  await expect.poll(async () => (await visitorOut(page, g))?.shown).toBe(true);
  expect(await offFrom(page, 'visitor', g, ...CENTRE_STAGE)).toBeLessThan(2);
  expect((await visitorsOut(page)).map((v) => v.id)).toEqual([g]);
  await tapFigure(page, 'visitor', g);
  await expect(page.locator('[data-fx="talk"].placed .who')).toHaveText((JA as Record<string, string>)[`visitor.${g}`]);
});

test('Chip’s node is a bare anchor: his id is no class (theme.css’s .chip once drew a cream pill by him all day)', async ({ page }) => {
  await page.goto('?demo&date=2026-11-16T12:00&visitor=chip&critter=none');
  await islandUp(page);
  const { CAMS } = await geo(page);
  await camTo(page, CAMS.mae, false);
  await expect.poll(async () => (await visitorOut(page, 'chip'))?.shown).toBe(true);
  await expect(page.locator('.if-scene .stage .chip')).toHaveCount(0);
});

test('Gracie’s shop: her offer’s choice box opens her sheet, and a piece bought there is mine (the shop’s かいがら)', async ({ page }) => {
  await page.addInitScript(() => {
    if (localStorage.getItem('island-demo.events')) return;
    const at = Date.parse('2026-11-04T09:00:00+09:00');
    const rows = [['tally', { date: '2026-11-04', counts: { 'fish:whale-shark': 20 } }], ['sell', { species: 'fish:whale-shark', n: 20, v: 13000 }]]
      .map(([type, data], i) => ({ id: `seed-${i}`, type, data, queuedAt: at + i, tries: 0, nextAt: 0, ackedAt: at + i, person: 'A' }));
    localStorage.setItem('island-demo.events', JSON.stringify({ day: '2026-11-04', events: rows }));
  });
  await page.goto('?demo&date=2026-11-04T12:00&visitor=gracie&critter=none');
  await islandUp(page);
  const { CAMS } = await geo(page);
  await camTo(page, CAMS.mae, false);
  await tapFigure(page, 'visitor', 'gracie');
  await expect(page.locator('[data-fx="talk"].placed .who')).toHaveText('グレース');
  await readOut(page);
  await choose(page, page.locator('.choices.asking button').first());
  const sheet = page.locator('[data-visitor-shop="gracie"]');
  await expect(sheet).toBeVisible();
  const items = sheet.locator('[data-visitor-item]');
  await expect(items).toHaveCount(6);
  const before = Number(await sheet.locator('[data-visitor-shells]').getAttribute('data-visitor-shells'));
  expect(before).toBe(13000);
  const first = items.first(), price = Number(await first.getAttribute('data-price'));
  expect(price).toBeGreaterThanOrEqual(500);
  await first.click();
  await sheet.locator('[data-visitor-buy]').click();
  await expect(first).toHaveAttribute('data-owned', 'true');
  await expect(sheet.locator('[data-visitor-shells]')).toHaveAttribute('data-visitor-shells', String(before - price));
});

test('a giver’s gift: Pete’s present goes to the island once (a find in the ずかん), the same piece for whoever asks again', async ({ page }) => {
  await page.goto('?demo&date=2026-11-04T12:00&visitor=pete&critter=none');
  await islandUp(page);
  const { CAMS } = await geo(page);
  await camTo(page, CAMS.mae, false);
  const box = page.locator('[data-fx="talk"].placed');
  await tapFigure(page, 'visitor', 'pete');
  await expect(box.locator('.who')).toHaveText('ぺりお');
  // again (his introduction given): his delivery, the piece to the island's ずかん
  await tapFigure(page, 'visitor', 'pete');
  const finds = () => page.evaluate(() => (JSON.parse(localStorage.getItem('island-demo.events') ?? '{"events":[]}') as { events: { type: string; data: { kind?: string } }[] }).events.filter((e) => e.type === 'find' && e.data.kind === 'item').length);
  await expect.poll(finds).toBe(1);
  // asked once more: the same piece already given, nothing more
  await tapFigure(page, 'visitor', 'pete');
  await expect.poll(() => page.locator('[data-fx="talk"].placed').getAttribute('data-pages')).not.toBeNull();
  expect(await finds()).toBe(1);
});
