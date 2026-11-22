// Dressing up, clocks and gadgets in a room (docs/design.md "The tent": Sit, lie and switch; tent/toggles.ts): a
// mirror walked up to, a look and a twirl, then すがた (look/DressSheet), ‹ back in the room; a clothes wardrobe the
// same, the guest's too, a fridge still peeked into; a clock says the Tokyo time (pinned by ?date); a lucky cat beckons,
// a dharma wobbles, the confetti machine throws confetti, a bin gets a toss, the plasma ball glows.
//   SHOTS=/tmp/wave2/c npx playwright test room-dress --project=webkit   the mirror's look, the sheet, a clock, a lucky cat
import { expect, test, type Page } from './fixtures.ts';
import { roomUp, tentStill } from './rooms.ts';

const VIEW = { viewport: { width: 393, height: 852 } } as const;
type Piece = { id: string; item: string; x: number; z: number; f: number };
type T = {
  loading(): number; pieces(): Piece[]; fill(codes: string[]): number; tile(x: number, z: number): [number, number]; playing(): string | null;
  dressing(): boolean; sparking(): string | null; reaction(id: string): string | null; fx(id: string): { on: boolean; glow: number } | null;
  stats(): { frames: number }; taps(): number; hit(x: number, y: number): { kind: string; id?: string } | undefined; who(w: string): { walking: boolean } | null;
};
const te = <R,>(page: Page, fn: (t: T) => R) => page.evaluate(`(${fn.toString()})(window.__tent)`) as Promise<R>;
const evalArg = <R, A>(page: Page, fn: (t: T, a: A) => R, a: A) => page.evaluate(`(${fn.toString()})(window.__tent, ${JSON.stringify(a)})`) as Promise<R>;
const snap = async (p: Page, name: string) => {
  if (process.env.SHOTS) await p.screenshot({ path: `${process.env.SHOTS}/shot-${name}.png` });
};
const balloon = (page: Page) => page.locator('[data-say="mine"]');
const sheet = (page: Page) => page.locator('dialog[open]').filter({ has: page.locator('[data-dress-sheet]') });

/** A phone in the tent (`as`, at `at`), its room emptied and furnished with `codes`, all loaded. */
async function furnished(page: Page, codes: string[], { as = 'A', at = '2026-11-04T12:00' }: { as?: 'A' | 'G'; at?: string } = {}) {
  await page.goto(`tent?demo&date=${at}${as === 'A' ? '' : `&as=${as}`}`);
  await roomUp(page, 'tent', { timeout: 15_000 });
  await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('island-demo.tent')).forEach((k) => localStorage.removeItem(k)));
  await page.reload();
  await roomUp(page, 'tent', { timeout: 15_000 });
  expect(await evalArg(page, (t, c) => t.fill(c), codes)).toBeGreaterThanOrEqual(codes.length);
  await page.waitForFunction(() => (window as unknown as { __tent: T }).__tent.loading() === 0);
  await tentStill(page, 15_000);
  // (my villager in from the door: a tap during that walk races its end)
  await page.waitForFunction((w) => (window as unknown as { __tent: T }).__tent.who(w)?.walking === false, as);
  return te(page, (t) => t.pieces());
}
/** A tap on a piece (WebKit's finger, Chromium's click): its tile's middle, else the first point up from it that's
 *  the piece (one in front may cover its tile). */
async function tapPiece(page: Page, p: Piece, touch: boolean) {
  const at = await evalArg(page, (t, q) => {
    const [x, y] = t.tile(q.x, q.z);
    for (let k = 0; k < 40; k++) for (const dx of [0, -8, 8]) if (t.hit(x + dx, y - k * 6)?.id === q.id) return [x + dx, y - k * 6];
    return null;
  }, p);
  expect(at, p.item).not.toBeNull();
  // (again if the room didn't take it: under load a finger's down and up can be past a tap's time apart)
  const n = await te(page, (t) => t.taps());
  await expect(async () => {
    if ((await te(page, (t) => t.taps())) > n) return;
    await (touch ? page.touchscreen.tap(at![0], at![1]) : page.mouse.click(at![0], at![1]));
    await expect.poll(() => te(page, (t) => t.taps()), { timeout: 1000 }).toBeGreaterThan(n);
  }).toPass({ timeout: 8000 });
}
const ctxOf = (browser: import('@playwright/test').Browser, touch: boolean) => browser.newContext({ ...VIEW, hasTouch: touch });

test('a mirror: walked up to, a look and a twirl, then すがた over the room; ‹ closes it, back in the room', async ({ browser, browserName }) => {
  const touch = browserName === 'webkit', ctx = await ctxOf(browser, touch), a = await ctx.newPage();
  const [mirror] = (await furnished(a, ['f12891'])).filter((p) => p.item === 'f12891');
  await tapPiece(a, mirror, touch);
  await expect.poll(() => te(a, (t) => t.playing()), { timeout: 8000 }).toBe('mirror');
  await expect(balloon(a)).toContainText(/きょうは なにを きようかな|うん、 にあってる！|きがえて みようかな/);
  await snap(a, 'mirror-pose');
  await expect(sheet(a).locator('[data-look-page]')).toBeVisible({ timeout: 6000 });
  expect(await te(a, (t) => t.dressing())).toBe(true);
  await snap(a, 'dress-sheet');
  const back = sheet(a).locator('.titlebar .back');
  await (touch ? back.tap() : back.click());
  await expect(sheet(a)).toHaveCount(0);
  expect(await te(a, (t) => t.dressing())).toBe(false);
  // the room as it was: my villager stands by the mirror, a tap on it again looks again
  await tapPiece(a, mirror, touch);
  await expect.poll(() => te(a, (t) => t.playing()), { timeout: 8000 }).toBe('mirror');
  await ctx.close();
});

test("a clothes wardrobe opens すがた (the guest's own too); a fridge is still only peeked into", async ({ browser, browserName }) => {
  const touch = browserName === 'webkit';
  for (const as of ['A', 'G'] as const) {
    const ctx = await ctxOf(browser, touch), a = await ctx.newPage();
    const ps = await furnished(a, ['f3959', 'f2713'], { as });
    const wardrobe = ps.find((p) => p.item === 'f3959')!, fridge = ps.find((p) => p.item === 'f2713')!;
    await tapPiece(a, fridge, touch);
    await expect(balloon(a)).toContainText(/ひんやり|ジュース|アイス/);
    expect(await te(a, (t) => t.dressing())).toBe(false);
    await tapPiece(a, wardrobe, touch);
    await expect(sheet(a).locator(`[data-look-page="${as}"]`)).toBeVisible({ timeout: 8000 });
    const close = sheet(a).locator('.titlebar .close');
    await (touch ? close.tap() : close.click());
    await expect(sheet(a)).toHaveCount(0);
    await ctx.close();
  }
});

test('a clock: my villager says the Tokyo time in a balloon (?date)', async ({ browser, browserName }) => {
  const touch = browserName === 'webkit', ctx = await ctxOf(browser, touch), a = await ctx.newPage();
  const [clock] = (await furnished(a, ['f3954'], { at: '2026-11-04T15:15' })).filter((p) => p.item === 'f3954');
  await tapPiece(a, clock, touch);
  await expect(balloon(a)).toContainText('いまは 3じ 15ふん だよ');
  expect(await te(a, (t) => t.playing())).toBeNull();
  await snap(a, 'clock');
  await ctx.close();
});

test('gadgets: a lucky cat beckons, a dharma wobbles, confetti flies, a bin gets a toss, the plasma ball glows', async ({ browser, browserName }) => {
  const touch = browserName === 'webkit', ctx = await ctxOf(browser, touch), a = await ctx.newPage();
  const ps = await furnished(a, ['f131', 'f1573', 'f13776', 'f2555', 'f4105']);
  const of = (c: string) => ps.find((p) => p.item === c)!;
  const reaction = (p: Piece) => evalArg(a, (t, id) => t.reaction(id), p.id);
  await tapPiece(a, of('f131'), touch);
  await expect.poll(() => reaction(of('f131'))).toBe('beckon');
  await snap(a, 'lucky-cat');
  await tapPiece(a, of('f1573'), touch);
  await expect.poll(() => reaction(of('f1573'))).toBe('wobble');
  await tapPiece(a, of('f13776'), touch);
  await expect.poll(() => te(a, (t) => t.sparking())).toBe('confetti');
  await expect.poll(() => reaction(of('f13776'))).toBe('pop');
  // (the confetti a moment out: some frames on)
  const f0 = await te(a, (t) => t.stats().frames);
  await expect.poll(() => te(a, (t) => t.stats().frames)).toBeGreaterThan(f0 + 12);
  await snap(a, 'confetti');
  // the bin: walked up to, a toss, the bin gulping it
  await tapPiece(a, of('f2555'), touch);
  await expect.poll(() => te(a, (t) => t.playing()), { timeout: 8000 }).toBe('toss');
  expect(await reaction(of('f2555'))).toBe('gulp');
  await expect(balloon(a)).toContainText(/ぽいっ！|ナイス シュート！|おかたづけ/);
  // the plasma ball: on (kept, its light switch), glowing
  expect(await evalArg(a, (t, id) => t.fx(id), of('f4105').id)).toMatchObject({ on: false });
  await tapPiece(a, of('f4105'), touch);
  await expect.poll(() => evalArg(a, (t, id) => t.fx(id)?.on ?? null, of('f4105').id)).toBe(true);
  expect((await evalArg(a, (t, id) => t.fx(id), of('f4105').id))!.glow).toBeGreaterThan(0);
  await ctx.close();
});
