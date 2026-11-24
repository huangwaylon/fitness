// 英語すごろく (docs/sugoroku.md): English Study's third tab, すごろく; a new game for the two members, one at むずかしい;
// turns play through (the dice, the fork's 遠回り, then the space's ことば with ヒント and これにする, ぶん and 絵 tapped in any order till 答えはこれ); the game
// resumes after a reload; ⋯'s 終了する shows the results. A game plays on its own screen (/sugoroku: the 3D board). The logic tier.
// Hermetic: each game's seed is pinned (`?sgSeed=`, test mode only), so its board, dice and stones are the same every
// run and each turn's phases are asserted, not probed. Taps, so the spec runs in WebKit too (`--project webkit`).
import { expect, test, type Page } from './fixtures.ts';
import { islandUp } from './island.ts';
import { fromMenu } from './hud.ts';

test.use({ viewport: { width: 393, height: 852 }, hasTouch: true });

/** The game: in English Study's tab (the sheet), or on its own screen (/sugoroku: the 3D board). */
const sheet = (p: Page) => p.locator('[data-sugoroku]');
/** English Study from the leaf menu, then its すごろく tab. */
async function openGame(p: Page) {
  await fromMenu(p, 'english', 'tap');
  await p.locator('dialog[open] [data-en-tab="game"]').tap();
  await expect(sheet(p)).toBeVisible();
}

type Phase = 'word' | 'sentence' | 'picture' | 'event' | 'fork' | 'home';
/** Play the phase the board shows now, which must be `phase` (a pinned seed: the same every run). */
async function onePhase(p: Page, phase: Phase) {
  const s = sheet(p);
  await expect(s.locator('[data-sg-die], [data-sg-moving]')).toHaveCount(0, { timeout: 15_000 });
  await expect(s.locator('[data-sg-phase]')).toHaveAttribute('data-sg-phase', phase);
  if (phase === 'fork') return void (await s.locator('[data-sg-branch="1"]').tap());
  if (phase === 'word') {
    await s.locator('[data-sg-hint]').tap();
    await s.locator('[data-sg-play]').tap();
    await expect(s.locator('[data-sg-made]')).toBeVisible();
  } else if (phase === 'sentence' || phase === 'picture') {
    // a try: every tile (a word, a letter) or a choice tapped, first first; 答えはこれ comes by the second miss
    const open = s.locator('[data-sg-wt]:not([disabled]), [data-sg-choice]:not([disabled]), [data-sg-letter]:not([disabled])');
    const answer = s.locator('[data-sg-answer]'), turn = s.locator('[data-sg-stage]');
    for (let k = 0; k < 3; k++) {
      // (「おしい！」's 900 ms: the next try waits for it to be over, or for the answer)
      await expect(turn).not.toHaveAttribute('data-sg-stage', 'miss');
      if (await answer.count()) break;
      const n = phase === 'picture' && (await s.locator('[data-sg-choice]').count()) ? 1 : await open.count();
      for (let i = 0; i < n; i++) await open.first().tap();
    }
    await expect(answer).toBeVisible();
  }
  await s.locator('[data-sg-next]').tap();
}

/** A turn: the dice, then its phases in order (a fork's choice, the stone, a card's move's stone), the next one's turn. */
async function playTurn(p: Page, phases: Phase[]) {
  const s = sheet(p);
  const turn = Number(await s.locator('[data-sg-turn]').getAttribute('data-sg-turn'));
  await s.locator('[data-sg-spin]').tap();
  for (const ph of phases) await onePhase(p, ph);
  await expect(s.locator('[data-sg-die], [data-sg-moving]')).toHaveCount(0, { timeout: 15_000 });
  await expect(s.locator('[data-sg-turn]')).not.toHaveAttribute('data-sg-turn', String(turn));
  await expect(s.locator('[data-sg-phase]')).toHaveAttribute('data-sg-phase', 'spin');
  // whose turn it is: their pill (aria-current), the only one
  const now = await s.locator('[data-sg-turn]').getAttribute('data-sg-turn');
  await expect(s.locator('[data-sg-score][aria-current="true"]')).toHaveAttribute('data-sg-score', now!);
}

/** A new game's setup, the game's seed pinned. */
async function start(page: Page, seed: string) {
  await page.goto(`?demo&sgSeed=${seed}`);
  await islandUp(page);
  await openGame(page);
  await expect(sheet(page)).toHaveAttribute('data-level', 'menu');
  await expect(sheet(page).locator('[data-sg-resume]')).toHaveCount(0);
  await sheet(page).locator('[data-sg-new]').tap();
}

test('a game for two at two levels: the board, turns, 終了, the results', async ({ page }) => {
  await start(page, 'e2e-8');
  // the members picked by default, in order, each ふつう till changed
  await expect(sheet(page).locator('[data-sg-seat][aria-pressed="true"]')).toHaveCount(2);
  await expect(sheet(page).locator('[data-sg-level-row]')).toHaveCount(2);
  // (A やさしい, B むずかしい)
  await sheet(page).locator('[data-sg-level-row]').nth(0).locator('[data-sg-level="1"]').tap();
  await sheet(page).locator('[data-sg-level-row]').nth(1).locator('[data-sg-level="3"]').tap();
  await expect(sheet(page).locator('[data-sg-level-row]').nth(1).locator('[data-sg-level="3"]')).toHaveAttribute('aria-pressed', 'true');
  await sheet(page).locator('[data-sg-length="short"]').tap();
  await sheet(page).locator('[data-sg-start]').tap();
  // its own screen: the 3D board over the turn's panel
  await expect(page).toHaveURL(/\/sugoroku\?.*m=local/);
  await expect(sheet(page)).toHaveAttribute('data-level', 'play');
  await expect(sheet(page).locator('[data-sg-board3d]')).toBeVisible();
  // the players' pills: each one's name and level (a .tag), whose turn it is aria-current
  const pills = sheet(page).locator('[data-sg-score]');
  await expect(pills).toHaveCount(2);
  await expect(pills.nth(0).locator('.pn')).not.toBeEmpty();
  await expect(pills.nth(0)).toHaveAttribute('aria-current', 'true');
  expect(await pills.nth(1).locator('[data-sg-level-tag]').evaluate((el) => getComputedStyle(el).fontSize)).toBe('13px');

  // (the seed's: A a ことば, B a ぶん, A the fork's 遠回り to a 絵: one of three spellings)
  await playTurn(page, ['word']);
  await playTurn(page, ['sentence']);
  await playTurn(page, ['fork', 'picture']);

  // ⋯ → 終了する (asked once more), the results: a winner and the words made
  await sheet(page).locator('[data-sg-menu]').tap();
  await sheet(page).locator('dialog[open] [data-sg-end]').tap();
  // (passed round: the stars so far, the leaf verb)
  await expect(page.locator('[data-sg-end-yes]')).not.toHaveClass(/danger/);
  // (a confirm: no ✕, キャンセル + the verb)
  await expect(page.locator('dialog[open]', { has: page.locator('[data-sg-end-yes]') }).locator('.navbar button')).toHaveCount(0);
  await sheet(page).locator('[data-sg-end-yes]').tap();
  await expect(sheet(page)).toHaveAttribute('data-level', 'results');
  // a team game: no ranking, each one's good thing
  await expect(sheet(page).locator('[data-sg-rank]')).toHaveCount(0);
  await expect(sheet(page).locator('[data-sg-hl]')).toHaveCount(2);
  // (ended in round 1: no かいがら yet, said so)
  await expect(sheet(page).locator('[data-sg-shells]')).toHaveAttribute('data-sg-shells', '0');
  // ‹: back to the island, English Study on the tab; the finished game isn't offered again
  await sheet(page).locator('.navbar button').first().tap();
  await expect(page.locator('dialog[open] [data-sugoroku]')).toHaveAttribute('data-level', 'menu');
  await expect(sheet(page).locator('[data-sg-resume]')).toHaveCount(0);
});

test('an イベント that only gave stars asks its key word: a miss 「おしい！」 (dimmed), the right one, its Japanese and stars, 次へ', async ({ page }) => {
  // (the seed's: A's first roll lands on 「You catch a big *fish*!」; ふつう, the word's Japanese from four)
  await start(page, 'e2e-ev58');
  await sheet(page).locator('[data-sg-start]').tap();
  const s = sheet(page);
  await s.locator('[data-sg-spin]').tap();
  await expect(s.locator('[data-sg-phase]')).toHaveAttribute('data-sg-phase', 'event', { timeout: 15_000 });
  await expect(s.locator('[data-sg-event]')).toHaveAttribute('data-sg-quiz', 'meaning');
  await expect(s.locator('[data-sg-quiz-choice]')).toHaveCount(4);
  // (no effect chip, no OK: the question is the turn)
  await expect(s.locator('[data-sg-effect], [data-sg-next]')).toHaveCount(0);
  const wrong = s.locator('[data-sg-quiz-choice]:not([data-right])').first();
  await wrong.tap();
  await expect(s.locator('[data-sg-nudge]')).toContainText('おしい');
  await expect(wrong).toBeDisabled();
  // (only the one tried dims: the others never disabled, 「おしい！」 or not)
  await expect(s.locator('[data-sg-quiz-choice]:disabled')).toHaveCount(1);
  await expect(s.locator('[data-sg-event]')).toHaveAttribute('data-sg-stage', 'try');
  await s.locator('[data-sg-quiz-choice][data-right]').tap();
  await expect(s.locator('[data-sg-answer]')).toHaveText('fish = 魚');
  await expect(s.locator('[data-sg-event] .ja')).toHaveText('大きな魚を釣った！');
  await s.locator('[data-sg-next]').tap();
  // (2 stars after one おしい, B's turn)
  await expect(s.locator('[data-sg-team]')).toHaveAttribute('data-sg-team', '2');
  await expect(s.locator('[data-sg-phase]')).toHaveAttribute('data-sg-phase', 'spin');
  await expect(s.locator('[data-sg-turn]')).toHaveAttribute('data-sg-turn', '1');
});

test('a game left half-way resumes after a reload (続きから), where it was', async ({ page }) => {
  await start(page, 'e2e-1');
  await sheet(page).locator('[data-sg-start]').tap();
  await playTurn(page, ['word']);
  const stars = await sheet(page).locator('[data-sg-team]').getAttribute('data-sg-team');
  const turn = await sheet(page).locator('[data-sg-turn]').getAttribute('data-sg-turn');
  // the save is down before the reload (it's written on every step)
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('island.sugoroku') ?? 'null')?.turn)).toBe(Number(turn));
  // a reload on its screen: the game again, where it was
  await page.reload();
  await expect(sheet(page)).toHaveAttribute('data-level', 'play');
  await expect(sheet(page).locator('[data-sg-turn]')).toHaveAttribute('data-sg-turn', turn!);
  await expect(sheet(page).locator('[data-sg-team]')).toHaveAttribute('data-sg-team', stars!);
});

test('on two phones: A starts a game for A and B, B is invited and joins, each plays their own turn and watches the other’s', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, hasTouch: true });
  const a = await ctx.newPage(), b = await ctx.newPage();
  // (the game's id pinned: its board, dice and stones the same every run)
  await a.goto('?demo&sgId=e2eon00003');
  await b.goto('?demo&as=B');
  await islandUp(a);
  await islandUp(b);
  await a.bringToFront();
  await openGame(a);
  await sheet(a).locator('[data-sg-new]').tap();
  await sheet(a).locator('[data-sg-mode="online"]').tap();
  await sheet(a).locator('[data-sg-start]').tap();
  await expect(sheet(a).locator('[data-sg-turn]')).toHaveAttribute('data-sg-turn', '0');
  // B: the invitation, 参加 straight into the game, A's turn to watch
  await b.bringToFront();
  await b.getByRole('button', { name: '参加' }).tap();
  await expect(sheet(b)).toHaveAttribute('data-level', 'play');
  await expect(sheet(b).locator('[data-sg-waiting]')).toBeVisible();
  await expect(sheet(b).locator('[data-sg-spin]')).toHaveCount(0);
  // A plays a turn (a ことば); B's phone follows it to B's turn
  await a.bringToFront();
  await playTurn(a, ['word']);
  await expect(sheet(a).locator('[data-sg-waiting]')).toBeVisible();
  await b.bringToFront();
  await expect(sheet(b).locator('[data-sg-turn]')).toHaveAttribute('data-sg-turn', '1');
  await expect(sheet(b).locator('[data-sg-team]')).toHaveAttribute('data-sg-team', (await sheet(a).locator('[data-sg-team]').getAttribute('data-sg-team'))!);
  // B plays theirs (a ぶん); A's phone follows, A's turn again
  await playTurn(b, ['sentence']);
  await a.bringToFront();
  await expect(sheet(a).locator('[data-sg-team]')).toHaveAttribute('data-sg-team', (await sheet(b).locator('[data-sg-team]').getAttribute('data-sg-team'))!);
  await expect(sheet(a).locator('[data-sg-spin]')).toBeVisible();
  // ⋯ → 終了する online: everyone's game ends, so the verb is the danger one and the note says so
  await sheet(a).locator('[data-sg-menu]').tap();
  await sheet(a).locator('dialog[open] [data-sg-end]').tap();
  await expect(a.locator('[data-sg-end-note]')).toHaveText('全員のゲームが終わるよ');
  await expect(a.locator('[data-sg-end-yes]')).toHaveClass(/danger/);
  await a.locator('[data-sg-end-yes]').tap();
  await expect(sheet(a)).toHaveAttribute('data-level', 'results');
  await b.bringToFront();
  await expect(sheet(b)).toHaveAttribute('data-level', 'results');
  await ctx.close();
});

/** Each control in the turn's sheet whose box, lip (its outer box-shadow) included, spills past the sheet's scroller or
 *  the viewport: [] when the whole of each one is seen. The scroller first scrolled to its end (its last row). */
const clipped = (p: Page) => sheet(p).locator('.sbody').evaluate((sb) => {
  sb.scrollTop = sb.scrollHeight;
  const box = sb.getBoundingClientRect(), out: string[] = [];
  for (const el of sb.querySelectorAll<HTMLElement>('button, .sg-tile')) {
    const r = el.getBoundingClientRect();
    if (!r.height || r.bottom < box.top) continue; // (hidden, or scrolled above)
    // the deepest outer shadow under it: `<color> 0 4px 0` (offset-y the 2nd length, spread the 4th)
    const lip = Math.max(0, ...getComputedStyle(el).boxShadow.split(/,(?![^(]*\))/).filter((s) => !s.includes('inset'))
      .map((s) => { const n = s.match(/-?[\d.]+px/g)?.map(parseFloat) ?? []; return (n[1] ?? 0) + Math.max(0, n[3] ?? 0); }));
    const bottom = r.bottom + lip;
    if (bottom > box.bottom + 0.5 || bottom > innerHeight + 0.5 || r.left < box.left - 0.5 || r.right > box.right + 0.5)
      out.push(`${el.textContent?.trim()} ${Math.round(bottom)}>${Math.round(Math.min(box.bottom, innerHeight))}`);
  }
  return out;
});

test('the turn’s sheet shows its last row whole (tiles’ and buttons’ lips too), above the home indicator; scrolls when short', async ({ page }) => {
  await start(page, 'e2e-23');
  await sheet(page).locator('[data-sg-start]').tap();
  await expect(sheet(page)).toHaveAttribute('data-level', 'play');
  // an iPhone 15/16 home-screen app's 34 px home indicator (Playwright has no safe area)
  await page.addStyleTag({ content: ':root { --safe-bottom: 34px !important; }' });
  const s = sheet(page), play = s.locator('[data-sg-phase]');
  const check = async () => {
    await expect.poll(() => clipped(page)).toEqual([]);
    await page.setViewportSize({ width: 393, height: 660 }); // (Safari in a tab: its toolbars)
    await expect.poll(() => clipped(page)).toEqual([]);
    await page.setViewportSize({ width: 393, height: 852 });
  };
  await check(); // (the dice)
  // (the seed's: A's ぶん, then B's ことば: its two rows of tiles, then ヒント and これにする)
  await s.locator('[data-sg-spin]').tap();
  await expect(s.locator('[data-sg-die], [data-sg-moving]')).toHaveCount(0, { timeout: 15_000 });
  await expect(play).toHaveAttribute('data-sg-phase', 'sentence');
  await check();
  // the fold's handle: a 44 px tall hit (no pill drawn), a tap folds the sheet to its bar, the bar's tap opens it
  const fold = s.locator('[data-sg-fold]');
  expect(await fold.evaluate((e) => e.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
  await fold.tap();
  await s.locator('[data-sg-unfold]').tap();
  await expect(fold).toBeVisible();
  await onePhase(page, 'sentence');
  await expect(play).toHaveAttribute('data-sg-phase', 'spin');
  await s.locator('[data-sg-spin]').tap();
  await expect(s.locator('[data-sg-die], [data-sg-moving]')).toHaveCount(0, { timeout: 15_000 });
  await expect(play).toHaveAttribute('data-sg-phase', 'word');
  await check();
  await expect(s.locator('[data-sg-hint]')).toBeInViewport({ ratio: 1 });
  // every tile's letter the same size and centred: a lucky (yuzu) one too (the header's .lucky row once matched it: tiny, at the left)
  const tileLooks = () => s.locator('.sg-tile').evaluateAll((els) => els.map((el) => {
    const r = document.createRange();
    r.selectNodeContents(el.firstChild!);
    const a = r.getBoundingClientRect(), b = el.getBoundingClientRect();
    return { lucky: el.classList.contains('lucky'), in: el.classList.contains('in'), size: getComputedStyle(el).fontSize,
      off: Math.max(Math.abs(a.x + a.width / 2 - (b.x + b.width / 2)), Math.abs(a.y + a.height / 2 - (b.y + b.height / 2))) <= 1.5 ? 0 : 1 };
  }));
  const looks = await tileLooks();
  expect(looks.filter((t) => t.lucky).length).toBeGreaterThan(0); // (the seed's rack has a lucky letter)
  for (const t of looks) expect(t, JSON.stringify(t)).toMatchObject({ size: t.in ? '19px' : '20px', off: 0 });
  // ⌫ takes back one letter at a time (the last placed), never the whole word
  const rack = s.locator('.rack [data-sg-tile]:not([disabled])');
  const letters: string[] = [];
  for (let i = 0; i < 3; i++) {
    const t = rack.first();
    letters.push((await t.getAttribute('data-sg-tile'))!);
    await t.tap();
  }
  const slots = s.locator('[data-sg-slots]');
  await expect(slots).toHaveAttribute('data-sg-slots', letters.join(''));
  await s.locator('[data-sg-del]').tap();
  await expect(slots).toHaveAttribute('data-sg-slots', letters.slice(0, 2).join(''));
  await s.locator('[data-sg-del]').tap();
  await expect(slots).toHaveAttribute('data-sg-slots', letters[0]);
});

