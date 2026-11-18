// 英語すごろく (docs/sugoroku.md): English Study's third tab, すごろく; a new game for the two members, one at むずかしい;
// turns play through (the dice, the fork's 遠回り, then the space's ことば with ヒント and これにする, ぶん and 絵 tapped in any order till 答えはこれ, イベント's OK); the game
// resumes from 続きから after a reload; 終了 shows the results. The logic tier.
import { expect, test, type Page } from './fixtures.ts';
import { islandUp } from './island.ts';
import { fromMenu } from './hud.ts';

test.use({ viewport: { width: 393, height: 852 } });

const sheet = (p: Page) => p.locator('dialog[open] [data-sugoroku]');
/** English Study from the leaf menu, then its すごろく tab. */
async function openGame(p: Page) {
  await fromMenu(p, 'english');
  await p.locator('dialog[open] [data-en-tab="game"]').click();
  await expect(sheet(p)).toBeVisible();
}

/** Play the current turn to its end, whatever the space. */
async function playTurn(p: Page) {
  const s = sheet(p);
  await s.locator('[data-sg-spin]').click();
  const play = s.locator('[data-sg-phase]');
  await expect(play).not.toHaveAttribute('data-sg-phase', 'spin', { timeout: 10_000 });
  await expect(s.locator('[data-sg-die]')).toHaveCount(0, { timeout: 10_000 });
  let phase = await play.getAttribute('data-sg-phase');
  if (phase === 'fork') {
    await s.locator('[data-sg-branch="1"]').click();
    await expect(play).not.toHaveAttribute('data-sg-phase', 'fork');
    await expect(s.locator('[data-sg-die]')).toHaveCount(0, { timeout: 10_000 });
    phase = await play.getAttribute('data-sg-phase');
  }
  if (phase === 'word') {
    await s.locator('[data-sg-hint]').click();
    // (むずかしい's 4+ letters: a rack with none is swapped)
    if ((await s.locator('[data-sg-slots]').getAttribute('data-sg-slots')) === '') return void (await s.locator('[data-sg-swap]').click());
    await s.locator('[data-sg-play]').click();
    await expect(s.locator('[data-sg-made]')).toBeVisible();
    await s.locator('[data-sg-next]').click();
  } else if (phase === 'sentence') {
    for (let round = 0; round < 2 && !(await s.locator('[data-sg-answer]').count()); round++) {
      const n = await s.locator('[data-sg-wt]').count();
      for (let i = 0; i < n && !(await s.locator('[data-sg-answer]').count()); i++) {
        await expect(s.locator('.miss')).toHaveCount(0); // (「おしい！」's moment: taps wait for it)
        if (await s.locator('[data-sg-answer]').count()) break;
        await s.locator('[data-sg-wt]:not([disabled])').first().click();
      }
    }
    await expect(s.locator('[data-sg-answer]')).toBeVisible();
    await s.locator('[data-sg-next]').click();
  } else if (phase === 'picture') {
    // tap whatever's first till the answer (a choice, or letters in any order): 答えはこれ comes by the second miss
    for (let k = 0; k < 30 && !(await s.locator('[data-sg-answer]').count()); k++) {
      await expect(s.locator('.miss')).toHaveCount(0); // (「おしい！」's moment: taps wait for it)
      const b = s.locator('[data-sg-choice]:not([disabled]), [data-sg-letter]:not([disabled])').first();
      if (await b.count()) await b.click();
    }
    await expect(s.locator('[data-sg-answer]')).toBeVisible();
    await s.locator('[data-sg-next]').click();
  } else await s.locator('[data-sg-next]').click();
}

async function start(page: Page) {
  await page.goto('?demo');
  await islandUp(page);
  await openGame(page);
  await expect(sheet(page)).toHaveAttribute('data-level', 'menu');
  await expect(sheet(page).locator('[data-sg-resume]')).toHaveCount(0);
  await sheet(page).locator('[data-sg-new]').click();
}

test('a game for two at two levels: the board, turns, 終了, the results', async ({ page }) => {
  await start(page);
  // the members picked by default, in order, each ふつう till changed
  await expect(sheet(page).locator('[data-sg-seat][aria-pressed="true"]')).toHaveCount(2);
  await expect(sheet(page).locator('[data-sg-level-row]')).toHaveCount(2);
  await sheet(page).locator('[data-sg-level-row]').nth(1).locator('[data-sg-level="3"]').click();
  await expect(sheet(page).locator('[data-sg-level-row]').nth(1).locator('[data-sg-level="3"]')).toHaveAttribute('aria-checked', 'true');
  await sheet(page).locator('[data-sg-length="short"]').click();
  await sheet(page).locator('[data-sg-start]').click();
  await expect(sheet(page)).toHaveAttribute('data-level', 'play');
  await expect(sheet(page).locator('[data-sg-space]')).toHaveCount(47);
  await expect(sheet(page).locator('[data-sg-token]')).toHaveCount(2);

  await playTurn(page);
  await playTurn(page);

  // 終了 (asked once more), the results: a winner and the words made
  await sheet(page).locator('[data-sg-end]').click();
  await sheet(page).locator('[data-sg-end-yes]').click();
  await expect(sheet(page)).toHaveAttribute('data-level', 'results');
  await expect(sheet(page).locator('[data-sg-rank]')).toHaveCount(2);
  // the finished game isn't offered again
  await sheet(page).locator('.navbar button').first().click();
  await expect(sheet(page).locator('[data-sg-resume]')).toHaveCount(0);
});

test('a game left half-way resumes after a reload (続きから), where it was', async ({ page }) => {
  await start(page);
  await sheet(page).locator('[data-sg-start]').click();
  await playTurn(page);
  const stars = await sheet(page).locator('[data-sg-score] b').allTextContents();
  const turn = await sheet(page).locator('[data-sg-turn]').getAttribute('data-sg-turn');
  // the save is down before the reload (it's written on every step)
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('island.sugoroku') ?? 'null')?.turn)).toBe(Number(turn));
  await page.reload();
  await islandUp(page);
  await openGame(page);
  await sheet(page).locator('[data-sg-resume]').click();
  await expect(sheet(page).locator('[data-sg-turn]')).toHaveAttribute('data-sg-turn', turn!);
  await expect(sheet(page).locator('[data-sg-score] b')).toHaveText(stars);
});

test('on two phones: A starts a game for A and B, B is invited and joins, each plays their own turn and watches the other’s', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 393, height: 852 } });
  const a = await ctx.newPage(), b = await ctx.newPage();
  await a.goto('?demo');
  await b.goto('?demo&as=B');
  await islandUp(a);
  await islandUp(b);
  await a.bringToFront();
  await openGame(a);
  await sheet(a).locator('[data-sg-new]').click();
  await sheet(a).locator('[data-sg-mode="online"]').click();
  await sheet(a).locator('[data-sg-start]').click();
  await expect(sheet(a).locator('[data-sg-turn]')).toHaveAttribute('data-sg-turn', '0');
  // B: the invitation, 参加 straight into the game, A's turn to watch
  await b.bringToFront();
  await b.getByRole('button', { name: '参加' }).click();
  await expect(sheet(b)).toHaveAttribute('data-level', 'play');
  await expect(sheet(b).locator('[data-sg-waiting]')).toBeVisible();
  await expect(sheet(b).locator('[data-sg-spin]')).toHaveCount(0);
  // A plays a turn; B's phone follows it to B's turn
  await a.bringToFront();
  // (a もう1回ふろう card keeps the turn: played till it passes)
  for (let k = 0; k < 4 && (await sheet(a).locator('[data-sg-turn]').getAttribute('data-sg-turn')) === '0'; k++) await playTurn(a);
  await expect(sheet(a).locator('[data-sg-waiting]')).toBeVisible();
  await b.bringToFront();
  await expect(sheet(b).locator('[data-sg-turn]')).toHaveAttribute('data-sg-turn', '1');
  await expect(sheet(b).locator('[data-sg-score] b')).toHaveText(await sheet(a).locator('[data-sg-score] b').allTextContents());
  for (let k = 0; k < 4 && (await sheet(b).locator('[data-sg-turn]').getAttribute('data-sg-turn')) === '1'; k++) await playTurn(b);
  await a.bringToFront();
  await expect(sheet(a).locator('[data-sg-score] b')).toHaveText(await sheet(b).locator('[data-sg-score] b').allTextContents());
  await expect(sheet(a).locator('[data-sg-spin], [data-sg-waiting]').first()).toBeVisible();
  await ctx.close();
});
