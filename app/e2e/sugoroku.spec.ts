// 英語すごろく (docs/sugoroku.md): the leaf menu's すごろく pill opens it; a new game for the two members, one at むずかしい;
// turns play through (the dice, the fork's 遠回り, then the space's ことば with ヒント and これにする, ぶん and 絵 tapped in any order till 答えはこれ, イベント's OK); the game
// resumes from 続きから after a reload; 終了 shows the results. The logic tier.
import { expect, test, type Page } from './fixtures.ts';
import { islandUp } from './island.ts';
import { fromMenu } from './hud.ts';

test.use({ viewport: { width: 393, height: 852 } });

const sheet = (p: Page) => p.locator('dialog[open] [data-sugoroku]');

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
  await fromMenu(page, 'sugoroku');
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
  await expect(sheet(page).locator('[data-sg-space]')).toHaveCount(27);
  await expect(sheet(page).locator('[data-sg-token]')).toHaveCount(2);

  await playTurn(page);
  await playTurn(page);

  // 終了 (asked once more), the results: a winner and the words made
  await sheet(page).locator('[data-sg-end]').click();
  await sheet(page).locator('[data-sg-end-yes]').click();
  await expect(sheet(page)).toHaveAttribute('data-level', 'results');
  await expect(sheet(page).locator('[data-sg-rank]')).toHaveCount(2);
  // the finished game isn't offered again; its words are on the shelf (ことばだな)
  await sheet(page).locator('.navbar button').first().click();
  await expect(sheet(page).locator('[data-sg-resume]')).toHaveCount(0);
  await sheet(page).locator('[data-sg-shelf]').click();
  await expect(sheet(page)).toHaveAttribute('data-level', 'shelf');
  await expect(sheet(page).locator('[data-sg-shelf-page] .zk')).not.toHaveCount(0);
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
  await fromMenu(page, 'sugoroku');
  await sheet(page).locator('[data-sg-resume]').click();
  await expect(sheet(page).locator('[data-sg-turn]')).toHaveAttribute('data-sg-turn', turn!);
  await expect(sheet(page).locator('[data-sg-score] b')).toHaveText(stars);
});
