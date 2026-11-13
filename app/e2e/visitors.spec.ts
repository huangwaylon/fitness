// Visitors (docs/design.md "Visitors"): K.K. on his stool (a song on request, for anyone, at any hour), Daisy Mae on Sunday
// mornings, one of NH's weekday visitors most other days (Wisp at night, Gulliver washed up and asleep until the fifth
// nudge). They stand at centre stage (the layout's plaza, a clear patch of lawn behind the villagers, seen as the island
// opens at まえ), Gulliver on the front beach, never under a control; a tap gives a line (an introduction first), no
// trading, no ベル.
import { expect, test, type Page } from './fixtures.ts';
import { camTo, controlsUnder, geo, islandUp, offFrom, quiet, tapAt, tapFigure } from './island.ts';
import { hudBells } from './hud.ts';
import { guestOn, ROLES } from '../src/lib/world/visitorRoles.ts';
import JA from '../src/lib/i18n/ja.json' with { type: 'json' };

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
  await tapAt(page, (w) => {
    const r = w.document.querySelector('[data-kk] .art')?.getBoundingClientRect();
    if (!r?.width) return null;
    for (const fy of [0.5, 0.35, 0.65, 0.2, 0.8]) for (const fx of [0.5, 0.3, 0.7]) {
      const x = r.left + r.width * fx, y = r.top + r.height * fy;
      if (!w.document.elementFromPoint(x, y)?.closest('button, [data-actor], [data-visitor]')) return [x, y];
    }
    return null;
  }, null, { clear: null, mouse: true, message: 'a bare spot on K.K.' });
}

/** K.K.'s stool on the page's layout (its middle, u). */
const kkAt = (page: Page) => page.evaluate(() => (window as unknown as { __layout: { pos(id: string): [number, number] } }).__layout.pos('kk-slider'));

test('K.K. lives on his stool, every day (a Friday evening too); on Saturday from 18:00 his show: with the music on he asks for a request and plays (NH)', async ({ page }) => {
  await music(page);
  await page.goto('?demo&date=2026-10-23T19:00&critter=none'); // a Friday: there, strumming to himself
  await islandUp(page);
  await expect(page.locator('[data-kk]')).toHaveAttribute('data-kk', 'day');
  await page.goto('?demo&date=2026-10-24T19:00&critter=none'); // a Saturday (not Halloween: Jack's night)
  await islandUp(page);
  await expect(page.locator('[data-kk]')).toHaveAttribute('data-kk', 'show');
  const bells = await hudBells(page).getAttribute('aria-label');
  // on his stool (the layout's), in view as the island opens (まえ)
  const g = await geo(page);
  await camTo(page, g.CAMS.mae, false);
  await expect(page.locator('[data-kk] .art')).toBeVisible();
  expect(await offFrom(page, '[data-kk]', ...(await kkAt(page)))).toBeLessThan(2);
  expect(await controlsUnder(page, '[data-kk] .art')).toEqual([]);
  await tapFigure(page, '[data-kk] .art');
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
  await expect(page.locator('[data-kk].show')).toHaveCount(1);
  // a tap mid-song: nothing disruptive, but ストップ ends it with his sign-off
  await tapFigure(page, '[data-kk] .art');
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
  for (const [when, line] of [['2026-11-04T15:00', '一曲 どうだい？'], ['2026-11-05T02:00', 'リクエスト かい？']] as const)
    test(`anyone asks K.K. for a song at any time: ${as} at ${when.slice(11)}`, async ({ page }) => {
      await music(page);
      await page.goto(`?demo&as=${as}&date=${when}&critter=none&visitor=none`); // a Wednesday afternoon; 2 a.m.
      await islandUp(page);
      await expect(page.locator('[data-kk]')).toHaveAttribute('data-kk', when.endsWith('02:00') ? 'asleep' : 'day');
      await camTo(page, (await geo(page)).CAMS.mae, false);
      await quiet(page); // (the opening beats over)
      await tapKK(page);
      await expect(page.locator('[data-fx="talk"] .sr')).toContainText(line);
      await readOut(page);
      await expect(page.locator('.choice')).toHaveText(['リクエスト', 'おまかせ']);
      await choose(page, page.locator('.choice', { hasText: 'おまかせ' }));
      await expect(page.locator('[data-fx="kk-caption"].placed')).toHaveText(/^♪ /);
      await expect(page.locator('[data-kk].show')).toHaveCount(1);
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
    await expect(page.locator(`[data-visitor="${id}"] .art`)).toBeVisible();
    expect(await offFrom(page, `[data-visitor="${id}"]`, x, z), id).toBeLessThan(2);
    expect(await controlsUnder(page, `[data-visitor="${id}"] .art`), id).toEqual([]);
    await tapFigure(page, `[data-visitor="${id}"] .art`);
    if (id === 'gulliver') {
      // asleep face down: the fifth nudge wakes him (NH)
      await page.waitForTimeout(1100);
      for (let i = 1; i < 5; i++) {
        await tapFigure(page, `[data-visitor="${id}"] .art`);
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

test('nobody visits on a quiet day (about one in ten of the rotation’s): the day’s guest only, in their own slot', async ({ page }) => {
  await page.goto('?demo&date=2026-11-19T19:00');
  await islandUp(page);
  await expect(page.locator('[data-visitor][data-slot="guest"]')).toHaveAttribute('data-visitor', guestOn('2026-11-19'));
  await expect(page.locator('[data-visitor][data-slot="visitor"]')).toHaveCount(0);
});

test('the day brings its visitor with no hook: Daisy Mae on a Sunday morning, drawn on the 3D island as her NH model, and she talks', async ({ page }) => {
  await page.goto('?demo&date=2026-11-08T09:00&critter=none');
  await islandUp(page);
  const { CAMS } = await geo(page);
  await camTo(page, CAMS.mae, false);
  // the 3D island stands her model where her node is (posed as the villagers are; her DOM node the tap box only), and
  // no visitor is ever a card
  await expect.poll(() => page.evaluate(() => (window as unknown as { __villagers3: { state(s: string): string | null } }).__villagers3.state('visitor')), { timeout: 15_000 }).toBe('idle');
  await expect(page.locator('[data-visitor="daisy-mae"] .art .official')).toHaveCount(0);
  await tapFigure(page, '[data-visitor="daisy-mae"] .art');
  await expect(page.locator('[data-fx="talk"].placed .who')).toHaveText('ウリ');
});

test('the weekday rotation brings its visitor with no hook: Redd on Wednesday Nov 4 2026, at centre stage, and he talks', async ({ page }) => {
  await page.goto('?demo&date=2026-11-04T12:00&critter=none');
  await islandUp(page);
  const { CAMS, CENTRE_STAGE } = await geo(page);
  await camTo(page, CAMS.mae, false);
  await expect(page.locator('[data-visitor="redd"] .art')).toBeVisible();
  expect(await offFrom(page, '[data-visitor="redd"]', ...CENTRE_STAGE)).toBeLessThan(2);
  expect(await controlsUnder(page, '[data-visitor="redd"] .art')).toEqual([]);
  await tapFigure(page, '[data-visitor="redd"] .art');
  await expect(page.locator('[data-fx="talk"].placed .who')).toHaveText('つねきち');
});

test('a tap in a visitor’s reach (a finger’s slack beside its figure) with nothing exact under it still talks', async ({ page }) => {
  await page.goto('?demo&date=2026-11-04T12:00&critter=none&guest=none');
  await islandUp(page);
  const { CAMS } = await geo(page);
  await camTo(page, CAMS.mae, false);
  const art = page.locator('[data-visitor="redd"] .art');
  await expect(art).toBeVisible();
  // a point 5 px off its figure, on bare ground: no control there, no small thing's box (theirs would win: SceneTaps)
  const p = await art.evaluate((el) => {
    const r = el.getBoundingClientRect(), mid = (r.top + r.bottom) / 2;
    const things = [...document.querySelectorAll('[data-care], [data-find], [data-branch], [data-wood], [data-present]')].map((e) => e.getBoundingClientRect());
    for (const [x, y] of [[r.left - 5, mid], [r.right + 5, mid], [r.left - 5, r.bottom - 10], [r.right + 5, r.bottom - 10]]) {
      const at = document.elementFromPoint(x, y);
      if (at?.classList.contains('stage') && !things.some((b) => Math.abs(x - (b.left + b.right) / 2) < 30 && Math.abs(y - (b.top + b.bottom) / 2) < 30)) return { x, y };
    }
    return null;
  });
  expect(p).not.toBeNull();
  await page.mouse.click(p!.x, p!.y);
  await expect(page.locator('[data-fx="talk"].placed .who')).toHaveText('つねきち');
});

// The guests (docs/design.md "Visitors: roles", world/visitorRoles.ts): NH's other special characters, each with a role.
test('a guest every day with no hook: Sunday afternoon Nov 8 2026 (after Daisy Mae) the day’s guest at centre stage, Redd’s Wednesday beside him, their introduction', async ({ page }) => {
  for (const [date, wd, beside] of [['2026-11-08', 0, false], ['2026-11-04', 3, true]] as const) {
    const g = guestOn(date);
    expect(ROLES[g].beach, `${date}: ${g} on the beach`).toBeFalsy();
    await page.goto(`?demo&date=${date}T13:00&critter=none`);
    await islandUp(page);
    const { CAMS, CENTRE_STAGE } = await geo(page);
    await camTo(page, CAMS.mae, false);
    const sel = `[data-visitor="${g}"][data-slot="guest"]`;
    await expect(page.locator(`${sel} .art`)).toBeVisible();
    // (no guest spot on the demo's island: centre stage, beside it while the day's visitor stands there)
    const off = await offFrom(page, sel, ...CENTRE_STAGE);
    if (beside) expect(off).toBeGreaterThan(40);
    else expect(off).toBeLessThan(2);
    expect(await page.locator('[data-visitor][data-slot="visitor"]').count()).toBe(wd === 0 ? 0 : 1);
    await tapFigure(page, `${sel} .art`);
    await expect(page.locator('[data-fx="talk"].placed .who')).toHaveText((JA as Record<string, string>)[`visitor.${g}`]);
  }
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
  await tapFigure(page, '[data-visitor="gracie"] .art');
  await expect(page.locator('[data-fx="talk"].placed .who')).toHaveText('グレース');
  await readOut(page);
  await choose(page, page.locator('.choices.asking button').first());
  const sheet = page.locator('[data-guest-shop="gracie"]');
  await expect(sheet).toBeVisible();
  const items = sheet.locator('[data-guest-item]');
  await expect(items).toHaveCount(6);
  const before = Number(await sheet.locator('[data-guest-shells]').getAttribute('data-guest-shells'));
  expect(before).toBe(13000);
  const first = items.first(), price = Number(await first.getAttribute('data-price'));
  expect(price).toBeGreaterThanOrEqual(500);
  await first.click();
  await sheet.locator('[data-guest-buy]').click();
  await expect(first).toHaveAttribute('data-owned', 'true');
  await expect(sheet.locator('[data-guest-shells]')).toHaveAttribute('data-guest-shells', String(before - price));
});

test('a giver’s gift: Pete’s present goes to the island once (a find in the ずかん), the same piece for whoever asks again', async ({ page }) => {
  await page.goto('?demo&date=2026-11-04T12:00&visitor=pete&critter=none');
  await islandUp(page);
  const { CAMS } = await geo(page);
  await camTo(page, CAMS.mae, false);
  const box = page.locator('[data-fx="talk"].placed');
  await tapFigure(page, '[data-visitor="pete"] .art');
  await expect(box.locator('.who')).toHaveText('ぺりお');
  // again (his introduction given): his delivery, the piece to the island's ずかん
  await tapFigure(page, '[data-visitor="pete"] .art');
  const finds = () => page.evaluate(() => (JSON.parse(localStorage.getItem('island-demo.events') ?? '{"events":[]}') as { events: { type: string; data: { kind?: string } }[] }).events.filter((e) => e.type === 'find' && e.data.kind === 'item').length);
  await expect.poll(finds).toBe(1);
  // asked once more: the same piece already given, nothing more
  await tapFigure(page, '[data-visitor="pete"] .art');
  await expect.poll(() => page.locator('[data-fx="talk"].placed').getAttribute('data-pages')).not.toBeNull();
  expect(await finds()).toBe(1);
});
