// The island's bulletin board (docs/board.md): a tap walks my villager up to it and opens it (on the 2D island, a
// sheet with the board's face); a note written there is on the board, on every phone at once (the demo's tabs share
// the record's rows through localStorage, as phones share the record), with a 「！」 over the board for the others; an
// author edits and takes down their own, a member takes down anyone's, the guest posts and changes only its own.
import { expect, test, type BrowserContext, type Page } from '@playwright/test';

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
  await expect(view(b)).toHaveAttribute('data-board-view', 'sheet');
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
