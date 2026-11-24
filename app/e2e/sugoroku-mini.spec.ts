// 英語すごろく's みんなで！ (docs/sugoroku.md "みんなで！"): each of the eight games on one phone passed round (its pick of two,
// the cover between seats 「スマホをBに渡してね」 [見る], the 3-2-1, the play, the result with each seat's part and the
// team's stars, 次へ to the next turn), and each on phones of its own (tabs on the demo's local relay, three through
// the relay's real room: every seat at once, each phone its own hand; one phone gone mid-game and back: the same
// result). Hermetic and quick: the games start on the game's own screen (`?sgNew=`: the island never booted), the
// seeds pinned (`?sgSeed=`, `?sgId=`), the game forced on the first landing (`?sgMini=`), the die and the walk at a
// tenth of their pace and a 0.3 s 3-2-1 (`?sgFast`; passed round's ことばの市場 at the real pace, its 3-2-1 seen), its
// clocks short (`?sgMiniMs=`; passed round never running out: HOLD) and, once a test has
// played what it checks, over at once (`__sgMini.end()`), the words found from the rack shown and the
// lists (no guess). Taps, so it runs in WebKit too. SG_SHOTS=<dir> also saves each passed-round game's pick, play and
// result (SG_SHOTS_AT=375x667 another size, SG_SHOTS_NIGHT=1 at 22:00).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type BrowserContext, type Page } from './fixtures.ts';
import { DEMO_CTX, newIsland } from './liveRoom.ts';
import seeds from '../src/lib/sugoroku/seeds.json' with { type: 'json' };
import linesJson from '../src/lib/sugoroku/sentences.json' with { type: 'json' };
import shopJson from '../src/lib/sugoroku/mini/data/shopping.json' with { type: 'json' };

const [VW, VH] = (process.env.SG_SHOTS_AT ?? '393x852').split('x').map(Number);
test.use({ viewport: { width: VW, height: VH }, hasTouch: true });

const WORDS = readFileSync(join(import.meta.dirname, '../src/lib/sugoroku/words.txt'), 'utf8').split('\n').filter(Boolean);
const LINES = linesJson as unknown as [string, string, number][];
const sheet = (p: Page) => p.locator('[data-sugoroku]');
const stage = (p: Page) => sheet(p).locator('[data-sg-mini-stage]');
const SHOTS = process.env.SG_SHOTS ?? '', NIGHT = process.env.SG_SHOTS_NIGHT ? '&date=2026-11-18T22:00' : '';
async function shot(p: Page, name: string) {
  if (!SHOTS) return;
  await p.screenshot({ path: join(SHOTS, `${test.info().project.name}-${name}-${p.viewportSize()!.width}x${p.viewportSize()!.height}${NIGHT ? '-night' : '-day'}.png`) });
}

/** A word from the lists the rack spells (6–7 letters first: the rack's own), none of `not`. */
function wordOf(rack: string, not: readonly string[]): string {
  const can = (w: string) => { const left = [...rack]; return [...w].every((l) => { const k = left.indexOf(l); return k >= 0 && !!left.splice(k, 1); }); };
  const all = [...(seeds as { w: string[] }).w.filter((w) => w.length >= 6), ...WORDS.filter((w) => w.length >= 4)];
  return all.find((w) => !not.includes(w) && can(w))!;
}
async function marketWord(p: Page, not: readonly string[] = []): Promise<string> {
  const s = sheet(p), w = wordOf((await s.locator('[data-sg-mk-rack]').getAttribute('data-sg-mk-rack'))!, not);
  for (const l of w) await s.locator(`[data-sg-mk-tile="${l}"]:not([disabled])`).first().tap();
  await s.locator('[data-sg-mk-play]').tap();
  await expect(s.locator(`[data-sg-mk-found="${w}"]`)).toHaveCount(1);
  return w;
}
/** The speller's word, its letters (or its spelling) tapped. */
async function spellIt(p: Page) {
  const s = sheet(p), w = (await s.locator('[data-sg-spell-item]').getAttribute('data-sg-spell-item'))!;
  if (await s.locator('[data-sg-choice]').count()) return void (await s.locator(`[data-sg-choice="${w}"]`).tap());
  const spelt = s.locator('[data-sg-spelt]');
  for (let k = (await spelt.getAttribute('data-sg-spelt'))!.length; k < w.length; k++) await s.locator(`[data-sg-letter="${w[k]}"]:not([disabled])`).first().tap();
  return w;
}
/** みんなで一文's line in order, its cards tapped (this phone's; `all` passed round, every seat's). */
async function placeLine(p: Page) {
  const s = sheet(p), ja = (await s.locator('.ja').first().textContent())!.trim();
  const cards = (await s.locator('[data-sg-to-card]').evaluateAll((els) => els.map((e) => e.getAttribute('data-sg-to-card')!))).sort().join(' ');
  const en = LINES.find(([e, j]) => j === ja && [...e.split(' ')].sort().join(' ') === cards)![0];
  for (const w of en.split(' ')) await s.locator(`[data-sg-to-card="${w}"]:not([disabled])`).first().tap();
}

/** A word from the lists that starts with the chain's letter and the turn's tiles make after it, none of `not`. */
async function chainWord(p: Page, not: readonly string[] = []): Promise<string> {
  const s = sheet(p), l = (await s.locator('[data-sg-ch-letter]').getAttribute('data-sg-ch-letter'))!;
  const rack = (await s.locator('[data-sg-ch-rack]').getAttribute('data-sg-ch-rack'))!;
  const chain = (await s.locator('[data-sg-ch-chain]').getAttribute('data-sg-ch-chain'))!.split(' ');
  const can = (w: string) => { const left = [...rack]; return [...w.slice(1)].every((x) => { const k = left.indexOf(x); return k >= 0 && !!left.splice(k, 1); }); };
  const w = WORDS.find((x) => x[0] === l && x.length >= 3 && x.length <= 8 && !chain.includes(x) && !not.includes(x) && can(x))!;
  for (const x of w.slice(1)) await s.locator(`[data-sg-ch-tile="${x}"]:not([disabled])`).first().tap();
  await s.locator('[data-sg-ch-play]').tap();
  await expect(s.locator('[data-sg-ch-chain]')).toHaveAttribute('data-sg-ch-chain', new RegExp(` ${w}$`));
  return w;
}
/** おつかい's list as the お客さん reads it: each line's thing and count, from its Japanese (「りんご2つ」). */
const ITEMS = (shopJson as { items: { w: string; ja: string; ctr: string }[] }).items;
async function shopList(p: Page): Promise<{ w: string; n: number }[]> {
  const jas = await sheet(p).locator('[data-sg-shop-slot] .ja').allTextContents();
  return jas.map((ja) => {
    const it = ITEMS.find((i) => new RegExp(`^${i.ja}(\\d)${i.ctr}$`).test(ja))!;
    return { w: it.w, n: Number(ja.slice(it.ja.length, -it.ctr.length)) };
  });
}
/** The お客さん (ふつう) asks for the list: each line's number, -s and thing; `slip` leaves the first plural's -s off. */
async function askFor(p: Page, slip = false) {
  const s = sheet(p), list = await shopList(p);
  for (const [i, l] of list.entries()) {
    await s.locator(`[data-sg-shop-slot="${i}"]`).tap();
    await s.locator(`[data-sg-shop-n="${l.n}"]`).tap();
    const plural = (await s.locator('[data-sg-shop-many]').getAttribute('aria-pressed')) === 'true';
    if (plural !== (l.n > 1) && !(slip && l.n > 1 && i === list.findIndex((x) => x.n > 1))) await s.locator('[data-sg-shop-many]').tap();
    await s.locator(`[data-sg-shop-word="${l.w}"]`).tap();
  }
  await s.locator('[data-sg-shop-ask]').tap();
  return list;
}
/** The shop fills the basket from the shelf and hands it over. */
async function fillBasket(p: Page, list: readonly { w: string; n: number }[]) {
  const s = sheet(p);
  for (const l of list) for (let k = 0; k < l.n; k++) await s.locator(`[data-sg-shelf="${l.w}"]`).tap();
  await expect(s.locator('[data-sg-basket]')).toHaveAttribute('data-sg-basket', new RegExp(list.map((l) => `${l.w}:${l.n}`).sort().join('|')));
  await s.locator('[data-sg-shop-pay]').tap();
}

/** A new game passed round for the two (ふつう each) on the game's own screen, with `q`'s hooks (`fast`: `?sgFast`). */
async function newGame(p: Page, q: string, fast = true) {
  await p.goto(`sugoroku?m=local&demo&sgNew=A2B2&${fast ? 'sgFast&' : ''}${q}${NIGHT}`);
  await expect(sheet(p)).toHaveAttribute('data-level', 'play');
}
/** Passed round, every clock longer than any test (a loaded runner's taps never race it): a step or game the test
 *  doesn't finish by its plays ends on `endNow`. */
const HOLD = 120_000;
/** The mini-game's clock (its step's, passed round) over now, on this phone (MiniTurn's test hook). */
const endNow = (p: Page) => p.evaluate(() => (window as { __sgMini?: { end(): void } }).__sgMini!.end());
/** The first roll: the forced みんなで！, its two options; `id` picked. */
async function landAndPick(p: Page, id: string, roll = true) {
  const s = sheet(p);
  if (roll) await s.locator('[data-sg-spin]').tap();
  await expect(s.locator('[data-sg-phase]')).toHaveAttribute('data-sg-phase', 'mini', { timeout: 15_000 });
  await expect(s.locator('[data-sg-mini-opt]')).toHaveCount(2);
  await expect(s.locator('[data-sg-mini-opt]').first()).toHaveAttribute('data-sg-mini-opt', id);
  await shot(p, `${id}-1-pick`);
  await s.locator(`[data-sg-mini-opt="${id}"]`).tap();
}
/** Passed round: the cover for `name`'s seat, then 見る. */
async function look(p: Page, who: 'A' | 'B') {
  await expect(sheet(p).locator('[data-sg-mini-cover]')).toHaveAttribute('data-sg-mini-cover', who);
  await expect(sheet(p).locator('[data-sg-mini-cover]')).toContainText('渡してね');
  await sheet(p).locator('[data-sg-mini-look]').tap();
}
const playing = (p: Page) => expect(stage(p)).toHaveAttribute('data-sg-mini-stage', 'play', { timeout: 8_000 });
/** The result: its game, the team's stars (and each seat's), 次へ to B's turn. */
async function result(p: Page, id: string, next = true, seats = 2): Promise<string> {
  const r = sheet(p).locator('[data-sg-mini-result]');
  await expect(r).toHaveAttribute('data-sg-mini-result', id, { timeout: 15_000 });
  await expect(r.locator('[data-sg-mini-seat]')).toHaveCount(seats);
  await expect(r).not.toContainText('位');
  await shot(p, `${id}-3-result`);
  const team = (await r.getAttribute('data-sg-mini-team'))!;
  if (next) {
    await r.locator('[data-sg-mini-next]').tap();
    await expect(sheet(p).locator('[data-sg-mini-result]')).toHaveCount(0);
  }
  return team;
}

test.describe('みんなで！ passed round', () => {
  test('ことばの市場: A’s 20 s, the cover, B’s; a word found already 「もう出てるよ」; the result, 次へ', async ({ page }) => {
    await newGame(page, `sgSeed=e2e-mk&sgMini=market&sgMiniMs=${HOLD}`, false);
    await landAndPick(page, 'market');
    await look(page, 'A');
    await expect(sheet(page).locator('[data-sg-mini-count]')).toBeVisible();
    await playing(page);
    const w = await marketWord(page);
    await shot(page, 'market-2-play');
    await endNow(page);
    await look(page, 'B');
    await playing(page);
    // A's word again: not taken, said softly
    for (const l of w) await sheet(page).locator(`[data-sg-mk-tile="${l}"]:not([disabled])`).first().tap();
    await sheet(page).locator('[data-sg-mk-play]').tap();
    await expect(sheet(page).locator('[data-sg-nudge]')).toHaveText('もう出てるよ');
    await endNow(page);
    expect(Number(await result(page, 'market', false))).toBeGreaterThan(0);
    // (B found none: お休み, never a 0)
    await expect(sheet(page).locator('[data-sg-mini-seat="B"]')).toContainText('お休み');
    await expect(sheet(page).locator('[data-sg-mini-seat="B"]')).not.toContainText('0語');
    await sheet(page).locator('[data-sg-mini-next]').tap();
    await expect(sheet(page).locator('[data-sg-phase]')).toHaveAttribute('data-sg-phase', 'spin');
  });

  test('伝えて当てて: the speller spells behind the cover, the finder picks; three rounds, the roles turning', async ({ page }) => {
    await newGame(page, `sgSeed=e2e-sp&sgMini=spell&sgMiniMs=${HOLD}`);
    await landAndPick(page, 'spell');
    for (const [r, [giver, picker]] of ([['A', 'B'], ['B', 'A'], ['A', 'B']] as const).entries()) {
      // (the finder going on as the next speller: no cover between)
      if (r === 0) await look(page, giver);
      await expect(sheet(page).locator('[data-sg-spell-role]')).toHaveAttribute('data-sg-spell-role', 'giver');
      const w = await spellIt(page);
      if (r === 0) await shot(page, 'spell-2-play');
      await look(page, picker);
      await expect(sheet(page).locator('[data-sg-spell-word]')).toHaveAttribute('data-sg-spell-word', w!);
      await sheet(page).locator(`[data-sg-cell="${w}"]`).tap();
    }
    expect(Number(await result(page, 'spell'))).toBe(12);
  });

  test('みんなで一文: one phone, every hand in its seat’s colour; two lines put together, the Japanese with them', async ({ page }) => {
    await newGame(page, `sgSeed=e2e-to&sgMini=together&sgMiniMs=${HOLD}`);
    await landAndPick(page, 'together');
    await playing(page);
    await expect(sheet(page).locator('[data-sg-to-hand]')).toHaveCount(2);
    await shot(page, 'together-2-play');
    await placeLine(page);
    await expect(sheet(page).locator('[data-sg-to-line]')).toHaveText('2/2文目');
    await placeLine(page);
    expect(Number(await result(page, 'together'))).toBeGreaterThan(0);
  });

  test('なかま分け: each seat sorts its own stream on its turn; a miss shows the right bin; the counts in, the result', async ({ page }) => {
    await newGame(page, `sgSeed=e2e-so&sgMini=sort&sgMiniMs=${HOLD}`);
    await landAndPick(page, 'sort');
    for (const who of ['A', 'B'] as const) {
      await look(page, who);
      await playing(page);
      for (let k = 0; k < 4; k++) await sheet(page).locator('[data-sg-bin]').nth(k % 2).tap();
      if (who === 'A') await shot(page, 'sort-2-play');
      await endNow(page);
    }
    await result(page, 'sort', false);
    // (each seat's part, the last seat's too: its count closed the game)
    for (const w of ['A', 'B']) await expect(sheet(page).locator(`[data-sg-mini-seat="${w}"]`)).toContainText('枚分けた');
  });

  test('しりとり: one phone, the chain turn by turn; a word too short said softly; ヒント, パス; the ribbon on, the result', async ({ page }) => {
    await newGame(page, `sgSeed=e2e-ch&sgMini=chain&sgMiniMs=${HOLD}`);
    await landAndPick(page, 'chain');
    await playing(page);
    const s = sheet(page);
    await expect(s.locator('[data-sg-chain]')).toHaveAttribute('data-sg-ch-turn', 'A');
    // two letters: too short, the tiles kept
    await s.locator('[data-sg-ch-tile]').first().tap();
    await s.locator('[data-sg-ch-play]').tap();
    await expect(s.locator('[data-sg-nudge]')).toHaveText('3文字以上');
    await s.locator('[data-sg-ch-word] button').first().tap();
    await s.locator('[data-sg-ch-hint]').tap();
    await expect(s.locator('[data-sg-ch-hinted]')).toContainText('ヒント：');
    await shot(page, 'chain-2-play');
    const w1 = await chainWord(page);
    await expect(s.locator('[data-sg-chain]')).toHaveAttribute('data-sg-ch-turn', 'B');
    await s.locator('[data-sg-ch-pass]').tap();
    await expect(s.locator('[data-sg-chain]')).toHaveAttribute('data-sg-ch-turn', 'A');
    await chainWord(page, [w1]);
    await endNow(page);
    expect(Number(await result(page, 'chain'))).toBeGreaterThan(0);
  });

  test('しりとり at むずかしい runs out on its own clock while turns keep coming (2026-11-20: never ended)', async ({ page }) => {
    // (every turn's play re-armed the sheet's next clock tick from the last tick, not from now: turns coming faster than
    // the gap to あと5秒 kept the clock from ever moving on, the turn timer's skips among them, so it played forever)
    await page.goto(`sugoroku?m=local&demo&sgNew=A3B3&sgFast&sgSeed=e2e-ch3&sgMini=chain&sgMiniMs=8000`);
    await expect(sheet(page)).toHaveAttribute('data-level', 'play');
    await landAndPick(page, 'chain');
    await playing(page);
    // (パス after パス: turns far closer together than the 8 s game's gaps; the clock's own end, no __sgMini.end(); ~9 s
    // with the grace, before the fix still playing at 18 s)
    const s = sheet(page), res = s.locator('[data-sg-mini-result]'), t0 = Date.now();
    while (!(await res.count()) && Date.now() - t0 < 18_000) await s.locator('[data-sg-ch-pass]:not([disabled])').tap({ timeout: 1000 }).catch(() => {});
    await expect(res).toHaveAttribute('data-sg-mini-result', 'chain', { timeout: 2000 });
  });

  test('数字キャッチ: each seat its own stream on its turn; a miss shows the answer; the counts in, the result', async ({ page }) => {
    await newGame(page, `sgSeed=e2e-nu&sgMini=numbers&sgMiniMs=${HOLD}`);
    await landAndPick(page, 'numbers');
    for (const who of ['A', 'B'] as const) {
      await look(page, who);
      await playing(page);
      const s = sheet(page);
      for (let k = 0; k < 3; k++) {
        const text = await s.locator('[data-sg-nu-text]').getAttribute('data-sg-nu-text');
        await s.locator('[data-sg-nu-choice][data-right]').tap();
        await expect(s.locator('[data-sg-nu-text]')).not.toHaveAttribute('data-sg-nu-text', text!);
      }
      if (who === 'A') {
        await s.locator('[data-sg-nu-choice]:not([data-right])').first().tap();
        await expect(s.locator('[data-sg-numbers] .note')).toContainText('おしい！答えは');
        await shot(page, 'numbers-2-play');
      }
      await endNow(page);
    }
    expect(Number(await result(page, 'numbers', false))).toBeGreaterThan(0);
    // (each seat's part, the last seat's too: its count closed the game)
    for (const w of ['A', 'B']) await expect(sheet(page).locator(`[data-sg-mini-seat="${w}"]`)).toContainText('3問キャッチ');
  });

  test('おつかい: the お客さん builds the list behind the cover (an -s left off: which line, kindly), the shop fills the basket; two lists', async ({ page }) => {
    await newGame(page, `sgSeed=e2e-sh&sgMini=shopping&sgMiniMs=${HOLD}`);
    await landAndPick(page, 'shopping');
    await look(page, 'A');
    const s = sheet(page);
    await expect(s.locator('[data-sg-shop-role]')).toHaveAttribute('data-sg-shop-role', 'ask');
    const list = await askFor(page, true);
    if (list.some((l) => l.n > 1)) {
      await expect(s.locator('[data-sg-nudge]')).toContainText('-s をつけよう');
      await shot(page, 'shopping-2-play');
      await askFor(page);
    }
    await look(page, 'B');
    await expect(s.locator('[data-sg-shop-request]')).toHaveAttribute('data-sg-shop-request', /^(Can I have|I’d like|Could I get|[A-Z]).*(please[.?])$/);
    await shot(page, 'shopping-2-shop');
    await fillBasket(page, list);
    // B asks the next list (no cover: the same seat), A shops
    await expect(s.locator('[data-sg-shop-role]')).toHaveAttribute('data-sg-shop-role', 'ask');
    const two = await askFor(page);
    await look(page, 'A');
    await fillBasket(page, two);
    expect(Number(await result(page, 'shopping'))).toBeGreaterThanOrEqual(10);
  });

  test('返事はどれ？: one phone, the replier’s cards in its colour; one that doesn’t fit 「おしい！」; the chat grows; four found', async ({ page }) => {
    await newGame(page, `sgSeed=e2e-re&sgMini=reply&sgMiniMs=${HOLD}`);
    await landAndPick(page, 'reply');
    await playing(page);
    const s = sheet(page);
    for (let r = 0; r < 4; r++) {
      await expect(s.locator('[data-sg-reply]')).toHaveAttribute('data-sg-reply', String(r));
      await expect(s.locator('[data-sg-re-hand]')).toHaveCount(1);
      await expect(s.locator('[data-sg-re-hand]')).toHaveAttribute('data-sg-re-hand', r % 2 ? 'A' : 'B');
      if (r === 0) {
        await s.locator('[data-sg-re-card]:not([data-fits])').first().tap();
        await expect(s.locator('[data-sg-nudge]')).toHaveText('おしい！ほかの返事かも');
        await shot(page, 'reply-2-play');
      }
      await s.locator('[data-sg-re-card][data-fits]').tap();
      // (the fourth found: the game over)
      if (r < 3) await expect(s.locator('[data-sg-re-said]')).toHaveCount(r + 1);
    }
    // (2 a reply each, no +2: one おしい; the last reply, that closed it, counted)
    expect(Number(await result(page, 'reply', false))).toBe(16);
    for (const w of ['A', 'B']) await expect(sheet(page).locator(`[data-sg-mini-seat="${w}"]`)).toContainText('2回返事した');
  });

  // (each game left alone at むずかしい, every clock 3 s: it ends on its own clock or its steps' timers, the covers'
  // 見る tapped as they come; the results shown)
  for (const id of ['market', 'spell', 'together', 'sort', 'chain', 'numbers', 'shopping', 'reply']) {
    test(`${id} at むずかしい ends on its own, untouched`, async ({ page }) => {
      await page.goto(`sugoroku?m=local&demo&sgNew=A3B3&sgFast&sgSeed=e2e-end-${id}&sgMini=${id}&sgMiniMs=3000`);
      await expect(sheet(page)).toHaveAttribute('data-level', 'play');
      await landAndPick(page, id);
      const s = sheet(page), res = s.locator('[data-sg-mini-result]'), t0 = Date.now();
      while (!(await res.count()) && Date.now() - t0 < 40_000) await s.locator('[data-sg-mini-look]').tap({ timeout: 500 }).catch(() => {});
      await expect(res).toHaveAttribute('data-sg-mini-result', id);
    });
  }
});

/** A's and B's phones (two tabs), the game online for the two: A starts it on the game's screen, B opens it there
 *  (the island's way in, だれが遊ぶ？ and the invitation's 参加: sugoroku.spec, sugoroku-invite.spec). */
async function table(ctx: BrowserContext, id: string, q: string) {
  const a = await ctx.newPage(), b = await ctx.newPage();
  await a.goto(`sugoroku?m=online&demo&sgId=${id}&sgNew=A2B2&${q}`);
  await expect(sheet(a)).toHaveAttribute('data-level', 'play');
  await b.goto(`sugoroku?m=online&demo&as=B&${q}`);
  await expect(sheet(b)).toHaveAttribute('data-level', 'play');
  return pick(a, b, q);
}
/** A rolls onto the forced みんなで！ and picks it, B here first (only seats present are dealt in). */
async function pick(a: Page, b: Page, q: string) {
  await a.locator('[data-sg-spin]').tap();
  await expect(sheet(a).locator('[data-sg-mini-here]')).toHaveAttribute('data-sg-mini-here', 'AB', { timeout: 15_000 });
  await landAndPick(a, q.match(/sgMini=(\w+)/)![1], false);
  return { a, b };
}
/** A race's count on a phone: `n` taps, the right bin or choice. */
async function race(p: Page, n: number) {
  const s = sheet(p);
  for (let k = 0; k < n; k++) {
    if (await s.locator('[data-sg-sort]').count()) {
      const before = await s.locator('[data-sg-sort]').getAttribute('data-sg-sort');
      await s.locator('[data-sg-bin]').first().tap();
      await expect.poll(async () => (await s.locator('[data-sg-sort]').getAttribute('data-sg-sort')) !== before || (await s.locator('.bin.hint').count()) > 0).toBe(true);
      await expect(s.locator('.bin.hint')).toHaveCount(0);
    } else {
      const text = await s.locator('[data-sg-nu-text]').getAttribute('data-sg-nu-text');
      await s.locator('[data-sg-nu-choice][data-right]').tap();
      await expect(s.locator('[data-sg-nu-text]')).not.toHaveAttribute('data-sg-nu-text', text!);
    }
  }
}

test.describe('みんなで！ online', () => {
  // (each of the eight on phones of its own: these four here, the rest below; a game's second mini-game too, the
  // 2026-11-19 bug: なかま分け after another closed as it opened, nothing played)
  test('なかま分け second in a game, on two phones: after ことばの市場 it opens with its 3-2-1, both sort, the same result', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, hasTouch: true });
    const { a, b } = await table(ctx, 'e2esort001', 'sgFast&sgMini=market,sort&sgMiniMs=8000');
    for (const p of [a, b]) await playing(p);
    await Promise.all([a, b].map(endNow));
    for (const p of [a, b]) await result(p, 'market');
    await sheet(b).locator('[data-sg-spin]').tap();
    await expect(sheet(b).locator('[data-sg-mini-opt]').first()).toHaveAttribute('data-sg-mini-opt', 'sort', { timeout: 15_000 });
    await sheet(b).locator('[data-sg-mini-opt="sort"]').tap();
    for (const p of [a, b]) await playing(p);
    await race(a, 3);
    await race(b, 3);
    await Promise.all([a, b].map(endNow));
    const [ta, tb] = [await result(a, 'sort', false), await result(b, 'sort', false)];
    expect(ta).toBe(tb);
    for (const p of [a, b]) for (const w of ['A', 'B']) await expect(sheet(p).locator(`[data-sg-mini-seat="${w}"]`)).toContainText(/\d枚分けた/);
    await ctx.close();
  });

  test('数字キャッチ on three phones through the relay’s room: each its own stream at once, three counts in, the same result on each', async ({ browser }) => {
    // (the relay's real room in the test's process, e2e/liveRoom.ts: the demo's tab relay can't play a third tab's
    // races as the room does)
    const island = newIsland(), q = 'sgFast&sgMini=numbers&sgMiniMs=12000';
    const phones = await Promise.all((['A', 'B', 'G'] as const).map(async (who) => {
      const context = await browser.newContext({ ...DEMO_CTX, viewport: { width: 393, height: 852 }, hasTouch: true, serviceWorkers: 'block' });
      await context.addInitScript(() => localStorage.setItem('e2e.render', 'none'));
      await island.demo(context, who);
      return context.newPage();
    }));
    const [a, b, c] = phones;
    // (on the game's own screen, the island never booted; with a test relay a phone listens from the screen's opening:
    // B's and G's first, then A's start for the three; the invitation's way in is sugoroku-invite.spec's)
    await Promise.all(([[b, 'B'], [c, 'G']] as const).map(async ([p, who]) => {
      await p.goto(`sugoroku${island.demoUrl(who, `&m=online&${q}`)}`);
      await expect(sheet(p)).toHaveAttribute('data-level', 'play');
    }));
    await expect.poll(() => island.sockets('B') + island.sockets('G')).toBe(2);
    await a.goto(`sugoroku${island.demoUrl('A', `&m=online&sgId=e2enum0001&sgNew=A2B2G2&${q}`)}`);
    for (const p of phones) await expect(sheet(p).locator('[data-sg-phase]')).toHaveAttribute('data-sg-phase', 'spin');
    await a.locator('[data-sg-spin]').tap();
    await expect(sheet(a).locator('[data-sg-mini-here]')).toHaveAttribute('data-sg-mini-here', 'ABG', { timeout: 15_000 });
    await landAndPick(a, 'numbers', false);
    await Promise.all(phones.map(async (p) => (await playing(p), await race(p, 2))));
    await Promise.all(phones.map(endNow));
    const ts = await Promise.all(phones.map((p) => result(p, 'numbers', false, 3)));
    // (the same game on every phone, the counts in: stars made)
    expect([new Set(ts).size, Number(ts[0]) > 0]).toEqual([1, true]);
    for (const w of ['A', 'B', 'G']) expect(await sheet(a).locator(`[data-sg-mini-seat="${w}"]`).getAttribute('data-stars')).toBe(await sheet(b).locator(`[data-sg-mini-seat="${w}"]`).getAttribute('data-stars'));
    for (const p of phones) await p.context().close();
  });

  test('みんなで一文 on two phones: each phone its own cards, the line put together across them, both lines', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, hasTouch: true });
    const { a, b } = await table(ctx, 'e2etog0001', 'sgFast&sgMini=together&sgMiniMs=20000');
    for (const p of [a, b]) await playing(p);
    for (let l = 0; l < 2; l++) {
      const ja = (await sheet(a).locator('.ja').first().textContent())!.trim();
      const cards = [...(await sheet(a).locator('[data-sg-to-card]').evaluateAll((els) => els.map((e) => e.getAttribute('data-sg-to-card')!))),
        ...(await sheet(b).locator('[data-sg-to-card]').evaluateAll((els) => els.map((e) => e.getAttribute('data-sg-to-card')!)))].sort().join(' ');
      const en = LINES.find(([e, j]) => j === ja && [...e.split(' ')].sort().join(' ') === cards)![0];
      const ws = en.split(' ');
      for (const [k, w] of ws.entries()) {
        const mine = sheet(a).locator(`[data-sg-to-card="${w}"]:not([disabled])`);
        await ((await mine.count()) ? mine : sheet(b).locator(`[data-sg-to-card="${w}"]:not([disabled])`)).first().tap();
        // (on both phones: the row as it grows, then the next line)
        for (const p of [a, b]) {
          if (k < ws.length - 1) await expect(sheet(p).locator('[data-sg-to-row]')).toHaveAttribute('data-sg-to-row', ws.slice(0, k + 1).join(' '));
          else if (!l) await expect(sheet(p).locator('[data-sg-together]')).toHaveAttribute('data-sg-together', '1');
        }
      }
    }
    const [ta, tb] = [await result(a, 'together', false), await result(b, 'together', false)];
    expect([ta, Number(tb) > 0]).toEqual([tb, true]);
    await ctx.close();
  });

  test('おつかい on two phones: the お客さん’s list on theirs, the shop fills the basket on the other; two lists, the roles turning', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, hasTouch: true });
    const { a, b } = await table(ctx, 'e2eshop001', 'sgFast&sgMini=shopping&sgMiniMs=15000');
    for (const [asker, shop] of [[a, b], [b, a]] as const) {
      await expect(sheet(asker).locator('[data-sg-shop-role]')).toHaveAttribute('data-sg-shop-role', 'ask', { timeout: 8_000 });
      const list = await askFor(asker);
      await expect(sheet(shop).locator('[data-sg-shop-request]')).toHaveAttribute('data-sg-shop-request', /please[.?]$/);
      await fillBasket(shop, list);
    }
    const [ta, tb] = [await result(a, 'shopping', false), await result(b, 'shopping', false)];
    expect([ta, Number(tb) >= 10]).toEqual([tb, true]);
    await ctx.close();
  });

  test('ことばの市場 on two phones at once: each one’s words on both; B gone mid-game and back: the same result', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, hasTouch: true });
    const q = 'sgFast&sgMini=market&sgMiniMs=20000';
    const { a, b } = await table(ctx, 'e2emarket1', q);
    await playing(a);
    await playing(b);
    const wa = await marketWord(a);
    const wb = await marketWord(b, [wa]);
    for (const p of [a, b]) for (const w of [wa, wb]) await expect(sheet(p).locator(`[data-sg-mk-found="${w}"]`)).toHaveCount(1);
    // B's tab closed and opened again: the game as it is, its finds kept
    await b.close();
    const b2 = await ctx.newPage();
    await b2.goto(`sugoroku?m=online&demo&as=B&${q}`);
    await playing(b2);
    await endNow(a);
    const [ta, tb] = [await result(a, 'market', false), await result(b2, 'market', false)];
    expect(ta).toBe(tb);
    await expect(sheet(a).locator('[data-sg-mini-seat="B"]')).not.toContainText('お休み');
    await ctx.close();
  });

  test('伝えて当てて on two phones: the speller’s letters grow on the finder’s, the finder picks, the roles turn', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, hasTouch: true });
    const { a, b } = await table(ctx, 'e2espell01', 'sgFast&sgMini=spell&sgMiniMs=15000');
    for (const [giver, picker] of [[a, b], [b, a], [a, b]] as const) {
      await expect(sheet(giver).locator('[data-sg-spell-role]')).toHaveAttribute('data-sg-spell-role', 'giver', { timeout: 8_000 });
      await expect(sheet(picker).locator('[data-sg-spell-role]')).toHaveAttribute('data-sg-spell-role', 'picker');
      // (ふつう: the first letter given, on the finder's phone as it grows)
      const first = (await sheet(giver).locator('[data-sg-spell-item]').getAttribute('data-sg-spell-item'))![0];
      await expect(sheet(picker).locator('[data-sg-spell-word]')).toHaveText(new RegExp(`^${first} _`));
      const w = await spellIt(giver);
      await expect(sheet(picker).locator('[data-sg-spell-word]')).toHaveAttribute('data-sg-spell-word', w!);
      await sheet(picker).locator(`[data-sg-cell="${w}"]`).tap();
    }
    const [ta, tb] = [await result(a, 'spell', false), await result(b, 'spell', false)];
    expect([ta, tb]).toEqual(['12', '12']);
    await ctx.close();
  });

  test('伝えて当てて on two phones: a finder’s miss doesn’t restart the round’s clock (cbdc7b6e5)', async ({ browser }) => {
    // (every fold made a new state, and the step timer read it: each pick, on any phone, re-armed every phone's 20 s, so a
    // slow finder never ran out. Rounds of 6 s in a 40 s game here (sgRoundMs): the finder misses at ~3 s; the round still moves on ~6 s after the
    // word was shown (the first phone's timer), not ~9 s. The 3 s wait is the slow finder this is about.)
    const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, hasTouch: true });
    const { a, b } = await table(ctx, 'e2espell02', 'sgFast&sgMini=spell&sgMiniMs=40000&sgRoundMs=6000');
    await expect(sheet(a).locator('[data-sg-spell-role]')).toHaveAttribute('data-sg-spell-role', 'giver', { timeout: 8_000 });
    const w = await spellIt(a);
    await expect(sheet(b).locator('[data-sg-spell-word]')).toHaveAttribute('data-sg-spell-word', w!);
    const shown = Date.now();
    const round = await sheet(b).locator('[data-sg-spell]').getAttribute('data-sg-spell');
    await b.waitForTimeout(3000);
    await sheet(b).locator(`[data-sg-cell]:not([data-sg-cell="${w}"])`).first().tap();
    await expect(sheet(b).locator('[data-sg-cell][disabled]')).toHaveCount(1);
    // (the round over: the next one's, or the game's end)
    await expect(sheet(b).locator(`[data-sg-spell="${round}"]`)).toHaveCount(0, { timeout: 12_000 });
    expect(Date.now() - shown).toBeLessThan(8000);
    await ctx.close();
  });

  test('しりとり on two phones: whose turn on each, each one’s word on both; B gone mid-game and back: the same result', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, hasTouch: true });
    const q = 'sgFast&sgMini=chain&sgMiniMs=20000';
    const { a, b } = await table(ctx, 'e2echain01', q);
    await playing(a);
    await playing(b);
    await expect(sheet(b).locator('[data-sg-ch-play]')).toHaveCount(0);
    const wa = await chainWord(a);
    await expect(sheet(b).locator('[data-sg-ch-chain]')).toHaveAttribute('data-sg-ch-chain', new RegExp(` ${wa}$`));
    const wb = await chainWord(b, [wa]);
    await expect(sheet(a).locator('[data-sg-ch-chain]')).toHaveAttribute('data-sg-ch-chain', new RegExp(` ${wb}$`));
    // B's tab closed and opened again: the chain as it is
    await b.close();
    await chainWord(a, [wa, wb]);
    const b2 = await ctx.newPage();
    await b2.goto(`sugoroku?m=online&demo&as=B&${q}`);
    await playing(b2);
    await endNow(a);
    const [ta, tb] = [await result(a, 'chain', false), await result(b2, 'chain', false)];
    expect(ta).toBe(tb);
    await expect(sheet(b2).locator('[data-sg-mini-seat="B"]')).toContainText('1語つないだ');
    await ctx.close();
  });

  test('返事はどれ？ on two phones: the asker’s line on both, the replier’s cards on theirs; the chat on both; B gone and back: the same result', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, hasTouch: true });
    const q = 'sgFast&sgMini=reply&sgMiniMs=20000';
    const { a, b } = await table(ctx, 'e2ereply01', q);
    await playing(a);
    await playing(b);
    // round 1: A asks (no cards), B holds three
    const line = (await sheet(a).locator('[data-sg-re-line]').getAttribute('data-sg-re-line'))!;
    await expect(sheet(b).locator('[data-sg-re-line]')).toHaveAttribute('data-sg-re-line', line);
    await expect(sheet(a).locator('[data-sg-re-card]')).toHaveCount(0);
    await expect(sheet(b).locator('[data-sg-re-card]')).toHaveCount(3);
    await sheet(b).locator('[data-sg-re-card][data-fits]').tap();
    for (const p of [a, b]) await expect(sheet(p).locator('[data-sg-re-said]')).toHaveCount(1);
    // round 2: B asks, A replies
    await expect(sheet(a).locator('[data-sg-re-card]')).toHaveCount(3);
    await sheet(a).locator('[data-sg-re-card][data-fits]').tap();
    await expect(sheet(b).locator('[data-sg-re-said]')).toHaveCount(2);
    await b.close();
    const b2 = await ctx.newPage();
    await b2.goto(`sugoroku?m=online&demo&as=B&${q}`);
    await playing(b2);
    await endNow(a);
    const [ta, tb] = [await result(a, 'reply', false), await result(b2, 'reply', false)];
    expect(ta).toBe(tb);
    expect(Number(ta)).toBeGreaterThanOrEqual(4);
    await ctx.close();
  });
});
