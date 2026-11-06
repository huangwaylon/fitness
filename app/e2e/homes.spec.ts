// The homes (docs/island-layout.md "Homes"): うめ's house and the guest's are rooms like the tent's (the same room, its
// own pieces: `sc` u and v), each arranged by its owner alone (the tent's by all three), anyone may come in; and each
// owner changes their home's look (いえを かえる: NH's houses, the tents), which every phone's island holds live. The demo's
// players are tabs of one browser (`?demo&as=B`), as two phones over the relay.
import { expect, test, type Browser, type Page } from './fixtures.ts';
import { newRecord } from './record.ts';

test.use({ viewport: { width: 390, height: 844 } });

const Q = '?demo&date=2026-11-04T12:00&critter=none&visitor=none&preview=0';
type T = { stats(): { frames: number }; pieces(): { id: string; item: string }[]; fill(codes: string[]): number; starter(): string[] };
const tent = <R,>(page: Page, fn: (t: T) => R) => page.evaluate(`(${fn.toString()})(window.__tent)`) as Promise<R>;

async function openRoom(page: Page, as: 'A' | 'B' | 'G', home: 'A' | 'B' | 'G') {
  await page.goto(`tent/${Q}&as=${as}${home !== 'A' ? `&home=${home}` : ''}`);
  await page.waitForFunction(() => ((window as unknown as { __tent?: { stats(): { frames: number } } }).__tent?.stats()?.frames ?? 0) > 0);
  await expect(page.locator(`[data-room-home="${home}"]`)).toBeVisible();
}

test('うめ’s house is hers to arrange: her piece stays in her room, not the tent’s; the guest comes in, sees it, can’t arrange it', async ({ context }) => {
  const b = await context.newPage();
  await openRoom(b, 'B', 'B');
  await expect(b.locator('[data-home="B"]')).toContainText('の いえ');
  await expect(b.locator('[data-tent-edit-open]')).toBeVisible();
  const n = await tent(b, (t) => t.fill([t.starter()[0]]));
  expect(n).toBe(1);
  const mine = await tent(b, (t) => t.pieces());
  // kept: her room opened again has it
  await b.reload();
  await b.waitForFunction(() => ((window as unknown as { __tent?: { stats(): { frames: number } } }).__tent?.stats()?.frames ?? 0) > 0);
  await expect.poll(() => tent(b, (t) => t.pieces().map((p) => p.id))).toEqual(mine.map((p) => p.id));
  // the tent's room is another room
  const a = await context.newPage();
  await openRoom(a, 'A', 'A');
  expect(await tent(a, (t) => t.pieces().map((p) => p.id))).not.toContain(mine[0].id);
  // the guest in うめ's house: the piece is there, nothing to arrange or switch
  const g = await context.newPage();
  await openRoom(g, 'G', 'B');
  await expect.poll(() => tent(g, (t) => t.pieces().map((p) => p.id))).toContain(mine[0].id);
  await expect(g.locator('[data-tent-edit-open]')).toHaveCount(0);
  await expect(g.locator('[data-tent-lights]')).toHaveCount(0);
  await expect(g.locator('[data-home-look]')).toHaveCount(0);
});

test('いえを かえる: うめ picks a Japanese house for hers; the other phone’s island holds the new look live; the guest’s own is the guest’s', async ({ context }) => {
  const phone = await context.newPage();
  await phone.goto(`${Q}&as=A`);
  await phone.waitForFunction(() => (window as unknown as { __layout?: unknown }).__layout);
  const look = (w: 'A' | 'B' | 'G') => phone.evaluate((w) => (window as unknown as { __layout: { home(w: string): { m: string; w?: string } } }).__layout.home(w), w);
  expect((await look('B')).m).toBe('house');
  const b = await context.newPage();
  await openRoom(b, 'B', 'B');
  await b.locator('[data-home-look]').click();
  await expect(b.locator('[data-home-picker="B"]')).toBeVisible();
  // nothing changed yet: これにする waits
  await expect(b.locator('[data-home-choose]')).toHaveAttribute('aria-disabled', 'true');
  await b.locator('[data-shape="NC"]').click();
  await b.locator('[data-home-choose]').click();
  await expect(b.locator('[data-home-picker]')).toHaveCount(0);
  await phone.bringToFront();
  await expect.poll(() => look('B').then((s) => s.w ?? '')).toMatch(/^NC/);
  // the guest changes its own house to a tent; うめ's stays hers
  const g = await context.newPage();
  await openRoom(g, 'G', 'G');
  await g.locator('[data-home-look]').click();
  await g.locator('[data-model="tent-n"]').click();
  await g.locator('[data-home-choose]').click();
  await phone.bringToFront();
  await expect.poll(() => look('G').then((s) => s.m)).toBe('tent-n');
  expect((await look('B')).w).toMatch(/^NC/);
  // and turns it a quarter (its own: the door turns with it)
  const facing = () => phone.evaluate(() => (window as unknown as { __layout: { obj(id: string): { f: number } } }).__layout.obj('home-G').f);
  const f0 = await facing();
  await g.bringToFront();
  await g.locator('[data-home-look]').click();
  // (a facing whose door would be walled in is refused: turn on to one that fits)
  let turns = 0;
  do {
    await g.locator('[data-home-turn]').click();
    turns++;
  } while ((await g.locator('[data-home-choose]').getAttribute('aria-disabled')) === 'true' && turns < 3);
  await g.locator('[data-home-choose]').click();
  await phone.bringToFront();
  await expect.poll(facing).toBe((f0 + turns) % 4);
});

// ---- on a record (e2e/record.ts): a paired phone sends the real way, the record checks and keeps it, a phone opening
// later reads it there (2026-11-03: the edit tray took the tent's room in every home, so うめ's and the guest's arranging
// never left the phone) ----

type Piece = { id: string; item: string; x: number; z: number; f: number; who: string };
type H = { tile(x: number, z: number): [number, number]; pieces(): Piece[]; edit(): { sel: Piece | null } | null };
const room = <R,>(page: Page, fn: (t: H) => R) => page.evaluate(`(${fn.toString()})(window.__tent)`) as Promise<R>;
type Rec = ReturnType<typeof newRecord>;
type W = 'A' | 'B' | 'G';
const SC = { A: 't', B: 'u', G: 'v' } as const;

/** A phone paired as `who` on `rec`, fresh (nothing kept from another), in `home`'s room. */
async function phone(browser: Browser, rec: Rec, who: W, home: W) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', serviceWorkers: 'block' });
  // the logic mode whatever the tier (the room's hooks on a paired phone: TentRoom.svelte hooks)
  await context.addInitScript(() => localStorage.setItem('e2e.render', 'none'));
  await rec.pair(context, who);
  const page = await context.newPage();
  await page.goto(`tent/?critter=none&visitor=none${home !== 'A' ? `&home=${home}` : ''}`);
  await page.waitForFunction(() => ((window as unknown as { __tent?: { stats(): { frames: number } } }).__tent?.stats()?.frames ?? 0) > 0);
  await expect(page.locator(`[data-room-home="${home}"]`)).toBeVisible();
  return page;
}
/** The camera at rest (a tap's px only holds then). */
const settled = (p: Page) => p.waitForFunction(() => (window as unknown as { __tent: { still(): boolean } }).__tent.still());
/** A tap on a tile's middle. */
async function tap(p: Page, x: number, z: number) {
  const [cx, cy] = await p.evaluate(([x, z]) => (window as unknown as { __tent: H }).__tent.tile(x, z), [x, z] as const);
  await p.mouse.click(cx, cy);
}
/** The record's latest op of piece `id` in scope `sc`, with who sent it. */
const kept = (rec: Rec, sc: string, id: string) => rec.decor().filter(([, d]) => d.sc === sc && d.id === id).map(([who, d]) => ({ who, ...d })).at(-1);

/** `who` arranges `home`'s room through the tray: places the cot, moves it and turns it; the record keeps each op as
 *  theirs, every event acked. */
async function placeMoveTurn(page: Page, rec: Rec, who: W, home: W) {
  const sc = SC[home];
  await page.locator('[data-tent-edit-open]').click();
  await settled(page);
  const before = (await room(page, (t) => t.pieces())).map((q) => q.id);
  await page.locator('[data-tent-item="f4081"]').click();
  await page.locator('[data-act="place"]').click();
  await expect.poll(() => room(page, (t) => t.pieces().length)).toBe(before.length + 1);
  const p = (await room(page, (t) => t.pieces())).find((q) => !before.includes(q.id))!;
  expect(p.who).toBe(who);
  await expect.poll(() => kept(rec, sc, p.id)).toMatchObject({ who, sc, item: 'f4081', x: p.x, z: p.z, f: 0 });
  // picked up, a tap on the floor takes it there (the back row, at the side it isn't), ↻ turns it, ✓ puts it down
  await settled(page);
  await tap(page, p.x, p.z);
  await expect.poll(() => room(page, (t) => t.edit()?.sel?.id)).toBe(p.id);
  const to = { x: p.x < 4 ? 5 : 1, z: 1 + before.length };
  await tap(page, to.x, to.z);
  // (a 2 × 1 piece's middle under the finger: its back-left tile the tapped one or the one before)
  await expect.poll(() => room(page, (t) => t.edit()?.sel?.z)).toBe(to.z);
  expect([to.x - 1, to.x]).toContain(await room(page, (t) => t.edit()!.sel!.x));
  await page.locator('[data-act="turn"]').click();
  await expect.poll(() => room(page, (t) => t.edit()?.sel?.f)).toBe(3);
  const held = (await room(page, (t) => t.edit()!.sel!));
  await page.locator('[data-act="place"]').click();
  await expect.poll(() => kept(rec, sc, p.id)).toMatchObject({ who, sc, x: held.x, z: held.z, f: 3 });
  for (const s of rec.sent) expect(s.ok, JSON.stringify(s)).toBe(true);
  await page.locator('[data-tent-done]').click();
  return { id: p.id, x: held.x, z: held.z };
}

for (const who of ['B', 'G'] as const) {
  test(`${who === 'B' ? 'うめ' : 'the guest'} places, moves, turns and puts away a piece in their own house, on the record; a phone opening later has it`, async ({ browser }) => {
    test.setTimeout(60_000);
    const rec = newRecord();
    const page = await phone(browser, rec, who, who);
    const p = await placeMoveTurn(page, rec, who, who);
    // the tent's room is another: nothing went there
    expect(rec.decor().filter(([, d]) => d.sc !== SC[who])).toEqual([]);
    await page.context().close();
    // a phone opening later (nothing kept on it) has it where it was put, from the record
    const later = await phone(browser, rec, who, who);
    await expect.poll(() => room(later, (t) => t.pieces().map(({ id, x, z, f }) => ({ id, x, z, f })))).toEqual([{ ...p, f: 3 }]);
    // and puts it away
    await later.locator('[data-tent-edit-open]').click();
    await settled(later);
    await tap(later, p.x, p.z);
    await expect.poll(() => room(later, (t) => t.edit()?.sel?.id)).toBe(p.id);
    await later.locator('[data-act="remove"]').click();
    await expect.poll(() => kept(rec, SC[who], p.id)).toMatchObject({ who, rm: true });
    await later.context().close();
    const again = await phone(browser, rec, who, who);
    await expect.poll(() => room(again, (t) => t.pieces())).toEqual([]);
    await again.context().close();
  });
}

test('うめ and the guest arrange the tent on the record; ウェイ’s phone opening later has both pieces', async ({ browser }) => {
  test.setTimeout(60_000);
  const rec = newRecord();
  const ids: string[] = [];
  for (const who of ['B', 'G'] as const) {
    const page = await phone(browser, rec, who, 'A');
    ids.push((await placeMoveTurn(page, rec, who, 'A')).id);
    await page.context().close();
  }
  expect(rec.decor().map(([who, d]) => [who, d.sc])).toEqual(expect.arrayContaining([['B', 't'], ['G', 't']]));
  const a = await phone(browser, rec, 'A', 'A');
  await expect.poll(() => room(a, (t) => t.pieces().map((p) => p.id).sort())).toEqual([...ids].sort());
  await a.context().close();
});

test('ウェイ can’t arrange うめ’s house: no tray in there, and the record refuses a room op of hers from his phone', async ({ browser }) => {
  const rec = newRecord();
  const page = await phone(browser, rec, 'A', 'B');
  await expect(page.locator('[data-tent-edit-open]')).toHaveCount(0);
  await expect(page.locator('[data-home-look]')).toHaveCount(0);
  const at = rec.now();
  expect(rec.event('A', 'decor', { sc: 'u', id: 'dpiece123', at, item: 'f4081', x: 2, z: 3, f: 0, p: at })).toEqual({ ok: false, error: 'forbidden' });
  expect(rec.decor()).toEqual([]);
  await page.context().close();
});
