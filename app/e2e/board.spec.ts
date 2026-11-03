// The island's bulletin board (docs/board.md): a tap walks my villager up to it and opens it (on the 2D island, a
// sheet with the board's face); a note written there is on the board, on every phone at once (the demo's tabs share
// the record's rows through localStorage, as phones share the record), with a 「！」 over the board for the others; an
// author edits and takes down their own, a member takes down anyone's, the guest posts and changes only its own.
import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import { KEYBOARD_PX, aboveKeyboard, fakeKeyboard, keyboard } from './keyboard.ts';

test.use({ viewport: { width: 393, height: 852 } });
const DATE = '2026-11-04T12:00';
const ribbon = (page: Page) => page.getByRole('button', { name: /^きょう [\d,]+\sベル$/ });

async function open(ctx: BrowserContext, as: 'A' | 'B' | 'G') {
  const page = await ctx.newPage();
  await page.goto(`?demo&date=${DATE}&critter=none&visitor=none${as === 'A' ? '' : `&as=${as}`}`);
  await expect(ribbon(page)).toBeVisible();
  await page.waitForFunction(() => (window as unknown as { __world?: unknown }).__world);
  return page;
}

const boardButton = (p: Page) => p.getByRole('button', { name: 'けいじばんを みる' });
const view = (p: Page) => p.getByRole('dialog', { name: 'けいじばん' });
const note = (p: Page, text: string) => view(p).getByRole('button', { name: new RegExp(`「${text}」$`) });

async function openBoard(p: Page) {
  await p.bringToFront();
  await boardButton(p).click();
  await expect(view(p)).toBeVisible({ timeout: 10_000 });
}
async function write(p: Page, text: string) {
  // a note being read: put it back first (the controls are under it)
  if (await view(p).locator('[data-board-read]').count()) await view(p).getByRole('button', { name: 'とじる' }).click();
  await view(p).getByRole('button', { name: 'かきこむ' }).click();
  const field = view(p).getByRole('textbox', { name: 'メモ' });
  await expect(field).toBeFocused();
  await field.fill(text);
  await view(p).getByRole('button', { name: 'はる' }).click();
  await expect(note(p, text)).toBeVisible();
}
async function close(p: Page) {
  await view(p).getByRole('button', { name: /もどる/ }).click();
  await expect(view(p)).toBeHidden();
}

test('a tap walks my villager up to the board, it opens, and a note written there is on it', async ({ page, context }) => {
  void page;
  const a = await open(context, 'A');
  const before = await a.evaluate(() => (window as unknown as { __world: { mine(): [number, number] } }).__world.mine());
  await boardButton(a).scrollIntoViewIfNeeded();
  await openBoard(a);
  // my villager walked up to it first (it stands in front of the board's face, on the beach)
  const after = await a.evaluate(() => (window as unknown as { __world: { mine(): [number, number] } }).__world.mine());
  expect(Math.hypot(after[0] - before[0], after[1] - before[1])).toBeGreaterThan(30);
  expect(after[1]).toBeLessThan(110);
  await expect(view(a)).toContainText('1 / 1');
  await write(a, 'きょうは 1まんぽ あるいた！');
  // the counter and the caps: 4 lines and 100 characters at most, as typed
  await view(a).getByRole('button', { name: 'かきこむ' }).click();
  const field = view(a).getByRole('textbox', { name: 'メモ' });
  await field.fill('1\n2\n3\n4\n5');
  await expect(field).toHaveValue('1\n2\n3\n4');
  await field.fill('あ'.repeat(120));
  await expect(field).toHaveValue('あ'.repeat(100));
  await expect(view(a)).toContainText('あと 0もじ');
  await view(a).getByRole('button', { name: 'やめる' }).click();
  // a note reads in full; text is only ever text
  await write(a, '<b>やあ</b>');
  await note(a, '<b>やあ</b>').click();
  await expect(view(a).locator('[data-board-read] .text')).toHaveText('<b>やあ</b>');
  await expect(view(a).locator('[data-board-read] b')).toHaveText('ウェイ');
  await close(a);
  // my own notes put no 「！」 over the board
  await expect(a.locator('[data-board][data-unseen]')).toHaveCount(0);
});

test('a second phone sees the note at once; an author edits and takes down their own, a member anyone’s', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 393, height: 852 } });
  const a = await open(ctx, 'A'), b = await open(ctx, 'B');
  await openBoard(a);
  await write(a, 'つりたいかい 3じから');
  // うめ's phone: the 「！」 over the board, then the note on it
  await b.bringToFront();
  await expect(b.locator('[data-board][data-unseen]')).toHaveCount(1, { timeout: 10_000 });
  await openBoard(b);
  await expect(note(b, 'つりたいかい 3じから')).toBeVisible();
  await close(b);
  await expect(b.locator('[data-board][data-unseen]')).toHaveCount(0);
  // ウェイ edits it: うめ sees the new text
  await a.bringToFront();
  await note(a, 'つりたいかい 3じから').click();
  await view(a).getByRole('button', { name: 'かきなおす' }).click();
  await view(a).getByRole('textbox', { name: 'メモ' }).fill('つりたいかい 4じから');
  await view(a).getByRole('button', { name: 'なおす' }).click();
  await expect(note(a, 'つりたいかい 4じから')).toBeVisible();
  await expect(note(a, 'つりたいかい 3じから')).toHaveCount(0);
  await close(a);
  await openBoard(b);
  await expect(note(b, 'つりたいかい 4じから')).toBeVisible();
  // うめ can't edit ウェイ's note, but may take it down
  await note(b, 'つりたいかい 4じから').click();
  await expect(view(b).getByRole('button', { name: 'かきなおす' })).toHaveCount(0);
  await write(b, 'うめの メモ');
  await note(b, 'つりたいかい 4じから').click();
  await view(b).getByRole('button', { name: 'はがす' }).click();
  await view(b).getByRole('button', { name: 'ほんとうに はがす？' }).click();
  await expect(note(b, 'つりたいかい 4じから')).toHaveCount(0);
  // うめ takes down her own
  await note(b, 'うめの メモ').click();
  await view(b).getByRole('button', { name: 'はがす' }).click();
  await view(b).getByRole('button', { name: 'ほんとうに はがす？' }).click();
  await expect(view(b).locator('[data-note]')).toHaveCount(0);
  await expect(view(b)).toHaveAttribute('data-board-view', process.env.E2E_ISLAND === '3d' ? '3d' : 'sheet');
  await close(b);
  // ウェイ's phone: both gone
  await openBoard(a);
  await expect(view(a).locator('[data-note]')).toHaveCount(0);
  await ctx.close();
});

test('the guest posts and edits its own, but can’t take down another’s', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 393, height: 852 } });
  const a = await open(ctx, 'A'), g = await open(ctx, 'G');
  await openBoard(a);
  await write(a, 'ようこそ！');
  await close(a);
  await openBoard(g);
  await expect(note(g, 'ようこそ！')).toBeVisible();
  await note(g, 'ようこそ！').click();
  await expect(view(g).getByRole('button', { name: 'はがす' })).toHaveCount(0);
  await expect(view(g).getByRole('button', { name: 'かきなおす' })).toHaveCount(0);
  await write(g, 'おじゃまします');
  await note(g, 'おじゃまします').click();
  await view(g).getByRole('button', { name: 'かきなおす' }).click();
  await view(g).getByRole('textbox', { name: 'メモ' }).fill('おじゃましました');
  await view(g).getByRole('button', { name: 'なおす' }).click();
  await expect(note(g, 'おじゃましました')).toBeVisible();
  await close(g);
  // ウェイ sees the guest's note, and may take it down
  await openBoard(a);
  await expect(note(a, 'おじゃましました')).toBeVisible();
  await note(a, 'おじゃましました').click();
  await expect(view(a).getByRole('button', { name: 'はがす' })).toBeVisible();
  await ctx.close();
});

// ---- what the face shows (the notes' buttons are only tap areas: the text is drawn on the canvas) ----
type BoardHook = { drawn(): string[]; face3(): { min: number[]; max: number[] } | null };
const drawn = (p: Page) => p.evaluate(() => (window as unknown as { __board: BoardHook }).__board.drawn());
const face3 = (p: Page) => p.evaluate(() => (window as unknown as { __board: BoardHook }).__board.face3());
/** The 2D sheet's face at its first note's header (right of the head, between the name and the date): the darkest of
 *  its r, g, b (the cork's under 170, every note's paper over). */
const paperAt = (p: Page) => p.evaluate(() => {
  const c = document.querySelector('canvas[data-board-face]') as HTMLCanvasElement;
  const [r, g, b] = c.getContext('2d')!.getImageData(420, 150, 1, 1).data;
  return Math.min(r, g, b);
});

test('a note written is drawn on the face at once, and still after a reload', async ({ page }) => {
  await page.goto(`?demo&date=${DATE}&critter=none&visitor=none&island=2d`);
  await expect(ribbon(page)).toBeVisible();
  await page.waitForFunction(() => (window as unknown as { __board?: unknown }).__board);
  await openBoard(page);
  expect(await drawn(page)).toEqual([]);
  expect(await paperAt(page)).toBeLessThan(170);
  await write(page, 'よみかえし テスト');
  expect(await drawn(page)).toEqual(['よみかえし テスト']);
  expect(await paperAt(page)).toBeGreaterThan(170);
  await close(page);
  await page.reload();
  await expect(ribbon(page)).toBeVisible();
  await openBoard(page);
  await expect(note(page, 'よみかえし テスト')).toBeVisible();
  expect(await drawn(page)).toEqual(['よみかえし テスト']);
  expect(await paperAt(page)).toBeGreaterThan(170);
});

for (const island of ['2d', '3d'] as const) {
  test(`「もどる」 sits under the HUD’s ribbon, never over it, and the face under both (${island})`, async ({ page }) => {
    // (the 3D island loads its models and draws in software on CI: 20-odd s before the board opens)
    if (island === '3d') test.setTimeout(60_000);
    await page.goto(`?demo&date=${DATE}&critter=none&visitor=none&island=${island}`);
    await expect(ribbon(page)).toBeVisible();
    const hud = (await ribbon(page).boundingBox())!;
    await openBoard(page);
    await expect(view(page)).toHaveAttribute('data-board-view', island === '2d' ? 'sheet' : '3d');
    const back = (await view(page).getByRole('button', { name: /もどる/ }).boundingBox())!;
    expect(back.y).toBeGreaterThanOrEqual(hud.y + hud.height);
    // the face (its notes' tap areas lie over it, the sheet's canvas or the 3D board's, once the camera is there)
    const face = view(page).getByRole('group', { name: 'けいじばん' });
    await expect(face).toBeVisible({ timeout: 10_000 });
    expect((await face.boundingBox())!.y).toBeGreaterThanOrEqual(back.y + back.height);
  });
}

// ---- the record's posts on a paired phone (the relay mocked: its snapshot holds one of うめ's notes) ----
const RELAY = 'https://island-fund-relay.island-fund-relay.workers.dev';
async function pairedWithPost(page: Page, island: '2d' | '3d') {
  const now = Date.now(), at = now - 3_600_000;
  const iso = (ms: number) => new Date(ms).toISOString();
  const snap = {
    ok: true, me: 'A', now: iso(now), rev: 'e1',
    rows: { metrics: [], events: [[iso(at), 'B', 'ev-board-1', 'board', JSON.stringify({ id: `b${at.toString(36)}abcd`, at, p: at, t: 'Hi!!' })]] }
  };
  await page.addInitScript(() => localStorage.setItem('island.key', 'ab'.repeat(16)));
  await page.routeWebSocket(/\/room/, () => {});
  await page.route(`${RELAY}/**`, (route) => {
    let action = '';
    try {
      action = JSON.parse(route.request().postData() ?? '{}').action;
    } catch { /* not JSON */ }
    return route.fulfill({
      status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' },
      body: action === 'snapshot' ? JSON.stringify(snap) : '{"ok":true}'
    });
  });
  await page.goto(`?critter=none&visitor=none&island=${island}`);
  await page.waitForFunction(() => (window as unknown as { __board?: unknown }).__board);
}

test('a note in the record’s snapshot is on the board when it opens', async ({ page }) => {
  await pairedWithPost(page, '2d');
  await expect(page.locator('[data-board][data-unseen]')).toHaveCount(1, { timeout: 10_000 });
  await openBoard(page);
  await expect(note(page, 'Hi!!')).toBeVisible();
  expect(await drawn(page)).toEqual(['Hi!!']);
  expect(await paperAt(page)).toBeGreaterThan(170);
  await write(page, 'みえる？');
  expect(await drawn(page)).toEqual(['みえる？', 'Hi!!']);
});

test('on the 3D island the face rides on the board’s cork, in front of NH’s notes', async ({ page }) => {
  test.setTimeout(60_000);
  await pairedWithPost(page, '3d');
  const where = () => page.evaluate(() => (window as unknown as { __world3d?: { where(id: string): { x: number; y: number; z: number } | null } }).__world3d?.where('board') ?? null);
  await expect.poll(where, { timeout: 20_000 }).not.toBeNull();
  await expect.poll(() => face3(page), { timeout: 10_000 }).not.toBeNull();
  const at = (await where())!, box = (await face3(page))!;
  // the cork (board.md: model y 3.5…13.5 about x 0, at 3.5 u a unit), in front of NH's own notes (z +1.02, three's
  // z: toward the camera)
  const S = 3.5;
  expect(Math.abs(box.min[1] - (at.y + 3.5 * S))).toBeLessThan(1);
  expect(Math.abs(box.max[1] - (at.y + 13.5 * S))).toBeLessThan(1);
  expect(Math.abs((box.min[0] + box.max[0]) / 2 - at.x)).toBeLessThan(1);
  expect(box.min[2] - at.z).toBeGreaterThan(1.02 * S);
  expect(box.min[2] - at.z).toBeLessThan(1.1 * S);
  await openBoard(page);
  await expect(view(page)).toHaveAttribute('data-board-view', '3d');
  await expect(note(page, 'Hi!!')).toBeVisible();
  expect(await drawn(page)).toEqual(['Hi!!']);
  // my villager (who walked up to it) is faded out of the way between the camera and the board, back once it closes
  const away = () => page.evaluate(() => {
    const w = window as unknown as { __world: { mine(): [number, number] }; __world3d: { away(x: number, z: number): boolean } };
    return w.__world3d.away(...w.__world.mine());
  });
  await expect.poll(away).toBe(true);
  await view(page).getByRole('button', { name: 'もどる' }).click();
  await expect.poll(away).toBe(false);
});

// ---- writing with the keyboard up (iOS's, simulated: e2e/keyboard.ts) ----
for (const island of ['2d', '3d'] as const) {
  test(`writing with the keyboard up: the field, its controls and the face with the note as typed stay above it (${island})`, async ({ page }) => {
    // TODO(3D lead): the 3D run takes over a minute on CI's software GL (14 s locally under SwiftShader; it times out
    // on its last steps): back on once the 3D island's frames are lighter there, or the spec is split
    test.fixme(island === '3d' && !!process.env.CI, 'over a minute under CI\'s software GL');
    if (island === '3d') test.setTimeout(60_000);
    await fakeKeyboard(page);
    await page.goto(`?demo&date=${DATE}&critter=none&visitor=none&island=${island}`);
    await expect(ribbon(page)).toBeVisible();
    await openBoard(page);
    await expect(view(page)).toHaveAttribute('data-board-view', island === '2d' ? 'sheet' : '3d');
    await expect(view(page)).toHaveAttribute('data-ready', 'true', { timeout: 10_000 });
    await view(page).getByRole('button', { name: 'かきこむ' }).click();
    const field = view(page).getByRole('textbox', { name: 'メモ' });
    await expect(field).toBeFocused();
    await keyboard(page, KEYBOARD_PX);
    const text = 'みえてる？\nキーボードの うえ';
    await field.fill(text);
    // the composer just above the keyboard, the face (the note as typed on it) above the composer
    await expect.poll(async () => (await aboveKeyboard(page, '[data-board-write]')).ok).toBe(true);
    const bar = await aboveKeyboard(page, '[data-board-write]');
    expect(bar.bottom).toBeGreaterThan(852 - KEYBOARD_PX - 40);
    expect(await drawn(page)).toEqual([text]);
    const faceOk = async () => {
      const f = await aboveKeyboard(page, '[data-board-face-box]');
      return f.ok && f.bottom <= bar.top + 1 && f.bottom - f.top > 120;
    };
    await expect.poll(faceOk, { timeout: 10_000 }).toBe(true);
    if (island === '2d') expect((await aboveKeyboard(page, 'canvas[data-board-face]')).ok).toBe(true);
    if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/board-keyboard-${island}.png` });
    // the keyboard goes (its ✓): the controls back at the screen's foot, the face still clear of them
    await keyboard(page, 0);
    await expect.poll(async () => (await aboveKeyboard(page, '[data-board-write]')).bottom).toBeGreaterThan(852 - 100);
    await expect.poll(async () => (await aboveKeyboard(page, '[data-board-face-box]')).ok, { timeout: 10_000 }).toBe(true);
    // up again and posted: the note on the face, the face above the keyboard
    await keyboard(page, KEYBOARD_PX);
    await view(page).getByRole('button', { name: 'はる' }).click();
    await expect(view(page).locator('[data-note]')).toHaveCount(1);
    expect(await drawn(page)).toEqual([text]);
    await expect.poll(async () => (await aboveKeyboard(page, '[data-board-face-box]')).ok, { timeout: 10_000 }).toBe(true);
    // a draft given up (やめる) leaves the face as it was
    await view(page).getByRole('button', { name: 'かきこむ' }).click();
    await view(page).getByRole('textbox', { name: 'メモ' }).fill('やっぱり やめ');
    expect(await drawn(page)).toEqual(['やっぱり やめ', text]);
    await view(page).getByRole('button', { name: 'やめる' }).click();
    expect(await drawn(page)).toEqual([text]);
  });
}
