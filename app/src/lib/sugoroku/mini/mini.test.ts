// The mini-games' pure parts (docs/sugoroku.md "みんなで！"): the building blocks (options, clock, stars, hands) and each
// game's reducer, hermetic (pinned seeds, the real word and line lists, no clock but the numbers given).
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { seeded, shuffle } from '#lib/random.ts';
import type { Who } from '#lib/types.ts';
import { decodeAccept, wordsOf } from '../words.ts';
import everyday from '../everyday.json';
import linesJson from '../sentences.json';
import type { Line } from '../sentences.ts';
import { PICTURES, tierOf } from '../pictures.ts';
import { spellable } from '../tiles.ts';
import { MINIS, MINI_IDS, miniMs, miniOptions, type MiniId } from './registry.ts';
import { COUNTDOWN_MS, GRACE_MS, mayClose, miniTimes, playing } from './clock.ts';
import { CAP_PER_SEAT, capStars, raceStars } from './stars.ts';
import { dealHands, isStage, stagePlay } from './hands.ts';
import { PAIRS, SETS } from './categories.ts';
import { GAMES } from './games.ts';
import { LONG_BONUS, MARKET_FINDS, MARKET_TILES, market, marketCheck, marketHint, type MarketState } from './market.ts';
import { SORT_STREAM, binOf, sort, sortStream } from './sort.ts';
import { SPELL_ROUNDS, spell, spellWord, type SpellState } from './spell.ts';
import { mayPlace, nextWord, together, type TogetherState } from './together.ts';
import { BOXES, FRAMES, SHOP_ASK_MS, SHOP_FILL_MS, SHOP_ITEMS, SHOP_LISTS, SHOP_ROUNDS, SHOP_SHELF, basketRight, lineJa, listJa, readCode, requestCheck, requestCode, requestText, rightSlots, shopRequest, shopping, slotText, type ShoppingState } from './shopping.ts';
import { EXCHANGES, REPLY_ROUNDS, REPLY_TURN_MS, cardLine, reply, replyOn, type ReplyState } from './reply.ts';
import { NUMBER_STREAM, inWords, numberStream, numbers, yearWords, type NumberPrompt } from './numbers.ts';
import { CHAIN_MAX_LEN, CHAIN_SEAT_MAX, CHAIN_TURN_MS, chain, chainCheck, chainHint, chainLetter, chainTurn, letterOf, type ChainState } from './chain.ts';
import type { Ctx, Deal, Hand, MiniGame, Play } from './types.ts';

const file = (f: string) => readFileSync(join(import.meta.dirname, '..', f), 'utf8');
const ctx: Ctx = { words: wordsOf(file('words.txt'), everyday, decodeAccept(file('accept.txt'))), lines: linesJson as unknown as Line[] };
const H = (who: Who, level: 1 | 2 | 3 = 2): Hand => ({ who, level });
const deal = (seats: Hand[], seed = 'd', lander: Who = seats[0].who): Deal => ({ seed, seats, lander, used: { pictures: new Set(), lines: new Set() } });
const run = <S>(g: MiniGame<S>, s: S, plays: readonly [Who, Play][]): S => plays.reduce((x, [w, p]) => g.play(x, w, p, ctx), s);

describe('mini-games: the building blocks', () => {
  it('options: two different, a game’s first from the ★ ones, none again till the pool runs out, then the longest ago', () => {
    for (let k = 0; k < 50; k++) {
      const [a, b] = miniOptions([], seeded(`o${k}`));
      expect(a).not.toBe(b);
      expect(MINIS[a].star && MINIS[b].star).toBe(true);
    }
    // the rest by then: none played again while two are fresh, then the one left and the longest ago
    const stars = MINI_IDS.filter((id) => MINIS[id].star), rest = MINI_IDS.filter((id) => !MINIS[id].star);
    expect(stars.sort()).toEqual(['market', 'sort', 'spell', 'together']);
    for (let k = 0; k < 30; k++) for (const id of miniOptions(['market'], seeded(`p${k}`))) expect(id).not.toBe('market');
    const allBut = (...ids: MiniId[]) => MINI_IDS.filter((id) => !ids.includes(id));
    for (let k = 0; k < 30; k++) expect(miniOptions(allBut('spell', 'together'), seeded(`p${k}`)).sort()).toEqual(['spell', 'together']);
    // one left: it and the one played longest ago
    for (let k = 0; k < 10; k++) expect(miniOptions(allBut(rest[0]), seeded(`q${k}`)).sort()).toEqual([MINI_IDS.find((id) => id !== rest[0])!, rest[0]].sort());
    for (let k = 0; k < 10; k++) expect(miniOptions([...MINI_IDS, 'market'], seeded(`q${k}`)).sort()).toEqual([MINI_IDS[1], MINI_IDS[2]].sort());
    expect(miniOptions([], seeded('same'))).toEqual(miniOptions([], seeded('same')));
  });
  it('the clock: a start-at from the open (the countdown first), the close a grace after the end; passed round a hot-seat’s turns', () => {
    const t = miniTimes(1_000_000, 60_000);
    expect(t).toEqual({ start: 1_000_000 + COUNTDOWN_MS, end: 1_000_000 + COUNTDOWN_MS + 60_000, close: 1_000_000 + COUNTDOWN_MS + 60_000 + GRACE_MS });
    expect([playing(t, t.start - 1), playing(t, t.start), playing(t, t.end - 1), playing(t, t.end)]).toEqual([false, true, true, false]);
    expect([mayClose(t, t.end), mayClose(t, t.close)]).toEqual([false, true]);
    expect([miniMs('market', 3, false), miniMs('market', 3, true), miniMs('together', 3, true), miniMs('sort', 2, true)]).toEqual([60_000, 60_000, 90_000, 40_000]);
    for (const id of MINI_IDS) expect(MINIS[id].ms).toBeLessThanOrEqual(90_000);
  });
  it('stars: whole, never negative, at most 12 a seat present in all, cut to each one’s share', () => {
    const seats = [H('A'), H('B'), H('G')];
    expect(capStars({ A: 5, B: -3, G: 2.7 }, seats)).toEqual({ A: 5, G: 2 });
    const big = capStars({ A: 30, B: 10, G: 0 }, seats.slice(0, 2));
    expect(big).toEqual({ A: 18, B: 6 });
    expect(capStars({ A: 40 }, [H('A')])).toEqual({ A: CAP_PER_SEAT });
    // (a seat not dealt in gets none)
    expect(capStars({ A: 3, G: 4 }, [H('A')])).toEqual({ A: 3 });
    const r = seeded('cap');
    for (let k = 0; k < 300; k++) {
      const raw = { A: Math.floor(r() * 60) - 10, B: Math.floor(r() * 60) - 10, G: Math.floor(r() * 60) - 10 };
      const out = capStars(raw, seats), sum = Object.values(out).reduce((a, b) => a + b, 0);
      expect(sum).toBeLessThanOrEqual(CAP_PER_SEAT * 3);
      for (const n of Object.values(out)) expect(Number.isInteger(n) && n > 0).toBe(true);
    }
    // a race: a beginner's 4 as a stronger player's 6
    expect([raceStars(4, 1), raceStars(6, 3), raceStars(0, 2), raceStars(99, 1), raceStars(-3, 1)]).toEqual([2, 2, 0, 6, 0]);
  });
  it('hands: every seat within one of the others, the weakest the first words, the strongest the hard ones, the same on every phone', () => {
    const seats = [H('A', 2), H('B', 1), H('G', 3)];
    for (let n = 3; n <= 7; n++) {
      const o = dealHands(n, seats, seeded(`h${n}`), { first: 1, hard: [n - 1] });
      const count = (w: Who) => o.filter((x) => x === w).length;
      expect(Math.max(...seats.map((s) => count(s.who))) - Math.min(...seats.map((s) => count(s.who)))).toBeLessThanOrEqual(1);
      expect(o[0]).toBe('B');
      expect(o[n - 1]).toBe('G');
      expect(dealHands(n, seats, seeded(`h${n}`), { first: 1, hard: [n - 1] })).toEqual(o);
      // (the extra to the stronger)
      if (n % 3) expect(count('G')).toBeGreaterThanOrEqual(count('B'));
    }
    expect(dealHands(4, [H('A')], seeded('x'))).toEqual(['A', 'A', 'A', 'A']);
    expect([isStage(stagePlay(65), 65), isStage(stagePlay(1), 2), isStage({ op: 'next' }, 0)]).toEqual([true, false, false]);
  });
  it('なかま分け’s table: every pictures set named in English and Japanese, each pair two sets with pictures enough', () => {
    expect(Object.keys(SETS).sort()).toEqual([...new Set(PICTURES.map((p) => p.set))].sort());
    for (const v of Object.values(SETS)) expect(v.ja).not.toMatch(/です|ます/);
    for (const [band, tiers] of [['far', [1]], ['close', [2, 3]]] as const) for (const [a, b] of PAIRS[band]) {
      expect(a).not.toBe(b);
      for (const set of [a, b]) expect(PICTURES.filter((p) => p.set === set && (tiers as readonly number[]).includes(tierOf(p))).length, `${band} ${set}`).toBeGreaterThanOrEqual(band === 'far' ? 12 : 10);
    }
  });
});

describe('ことばの市場', () => {
  const seats = [H('A', 1), H('B', 3)];
  const s0 = market.deal(deal(seats, 'mk'), ctx);
  const words = ctx.words.from(s0.rack, () => 0).filter((w) => w.length >= 4);
  it('deals 9 tiles round a 6–7 letter common word, the same for the same seed', () => {
    expect(s0.rack).toHaveLength(MARKET_TILES);
    expect([6, 7]).toContain(s0.base.length);
    expect(spellable(s0.base, s0.rack)).toBe(true);
    expect(market.deal(deal(seats, 'mk'), ctx)).toEqual(s0);
    expect(market.deal(deal(seats, 'mk2'), ctx)).not.toEqual(s0);
    for (let k = 0; k < 100; k++) {
      const s = market.deal(deal(seats, `r${k}`), ctx);
      expect(spellable(s.base, s.rack) && s.rack.length === MARKET_TILES).toBe(true);
    }
  });
  it('a word anyone found is the first finder’s; again, too short for the seat, not on the rack or not a word: nothing', () => {
    const [w1, w2] = words;
    const s1 = run(market, s0, [['A', { w: w1 }], ['B', { w: w1 }], ['B', { w: w2 }], ['B', { w: 'qqqq' }], ['A', { w: 'zzz' }]]);
    expect(s1.found.map((f) => [f.who, f.w])).toEqual([['A', w1], ['B', w2]]);
    expect(marketCheck(s1, 'B', w1, ctx)).toBe('found');
    const three = ctx.words.from(s0.rack, () => 0).find((w) => w.length === 3);
    if (three) expect([marketCheck(s0, 'B', three, ctx), marketCheck(s0, 'A', three, ctx)]).toEqual(['short', null]);
    expect(marketCheck(s0, 'G', w1, ctx)).toBe('tiles');
    // the same moves in the room's order: the same result whoever's phone folds them
    expect(run(market, s0, [['B', { w: w1 }], ['A', { w: w1 }]]).found[0].who).toBe('B');
  });
  it('stars: each finder’s points ÷ 4 (a find at least one), +3 a 7+ letter word, capped; the longest word kept', () => {
    const many = words.slice(0, 30);
    let s = s0;
    for (const [k, w] of many.entries()) s = market.play(s, k % 2 ? 'B' : 'A', { w }, ctx);
    expect(s.found.filter((f) => f.who === 'A').length).toBeLessThanOrEqual(MARKET_FINDS);
    const res = market.close(s);
    const sum = Object.values(res.stars).reduce((a, b) => a + (b ?? 0), 0);
    expect(sum).toBeLessThanOrEqual(CAP_PER_SEAT * 2);
    expect(sum).toBeGreaterThan(0);
    const longest = Math.max(...s.found.map((f) => f.w.length));
    expect(res.made).toHaveLength(1);
    expect(res.made[0].text.length).toBe(longest);
    // one short find: a star at least; none: none
    const one = market.close(market.play(s0, 'A', { w: words[0] }, ctx));
    expect(one.stars.A).toBeGreaterThanOrEqual(1);
    expect(one.stars.B).toBeUndefined();
    expect(market.close(s0)).toEqual({ stars: {}, made: [] });
    // a 7+ letter word: its bonus
    const long: MarketState = { ...s0, found: [{ who: 'A', w: 'example', pts: 4, ja: '' }] };
    expect(market.close(long).stars.A).toBe(1 + LONG_BONUS);
  });
  it('やさしい’s hint: the first letters of an everyday word no one found yet', () => {
    const h = marketHint(s0, 'A', 0, ctx);
    expect(h).toMatch(/^[a-z]{2}$/);
    const w = ctx.words.from(s0.rack, () => 0).find((x) => ctx.words.ja(x) && x.startsWith(h!) && x.length >= 3)!;
    expect(w).toBeTruthy();
    expect(marketHint(s0, 'G', 0, ctx)).toBeNull();
  });
});

describe('伝えて当てて', () => {
  const seats = [H('A', 1), H('B', 3), H('G', 2)];
  const s0 = spell.deal(deal(seats, 'sp', 'B'), ctx);
  const word = (s: SpellState) => PICTURES[s.rounds[s.r].item].w;
  const right = (s: SpellState, who: Who) => s.rounds[s.r].grids[who]!.indexOf(s.rounds[s.r].item);
  const wrong = (s: SpellState, who: Who) => s.rounds[s.r].grids[who]!.findIndex((i) => i !== s.rounds[s.r].item);
  it('deals 3 rounds, the giver the lander then the next seats; each picker’s grid holds it (6 at むずかしい, its own set)', () => {
    expect(s0.rounds.map((r) => r.giver)).toEqual(['B', 'G', 'A']);
    expect(new Set(s0.rounds.map((r) => r.item)).size).toBe(SPELL_ROUNDS);
    for (const r of s0.rounds) {
      expect(Object.keys(r.grids).sort()).toEqual(seats.map((s) => s.who).filter((w) => w !== r.giver).sort());
      for (const [w, grid] of Object.entries(r.grids)) {
        expect(grid).toContain(r.item);
        expect(new Set(grid!.map((i) => PICTURES[i].w)).size).toBe(grid!.length);
        expect(grid!.length).toBe(w === 'B' ? 6 : 4);
      }
    }
    expect(spell.deal(deal(seats, 'sp', 'B'), ctx)).toEqual(s0);
    const used = new Set(s0.rounds.map((r) => PICTURES[r.item].w));
    const again = spell.deal({ ...deal(seats, 'sp', 'B'), used: { pictures: used, lines: new Set() } }, ctx);
    for (const r of again.rounds) expect(used.has(PICTURES[r.item].w)).toBe(false);
  });
  it('the giver’s word (theirs only, the right one) and each picker’s tap: right 2, after おしい 1, two misses shown', () => {
    let s = spell.play(s0, 'A', { w: word(s0) }, ctx);
    expect(s).toBe(s0);
    expect(spell.play(s0, 'B', { w: 'nope' }, ctx)).toBe(s0);
    s = spell.play(s0, 'B', { w: word(s0) }, ctx);
    expect([s.gave, spellWord(s)]).toEqual([true, word(s0)]);
    s = run(spell, s, [['A', { k: right(s, 'A') }], ['G', { k: wrong(s, 'G') }], ['G', { k: right(s, 'G') }]]);
    expect(s.r).toBe(1);
    expect(s.results[0]).toEqual({ gave: true, picks: { A: 2, G: 1 } });
    // two misses: through with none
    const s2 = run(spell, s, [['G', { w: word(s) }], ['A', { k: wrong(s, 'A') }], ['A', { k: wrong(s, 'A') }], ['A', { k: right(s, 'A') }]]);
    expect(s2.picks.A).toEqual({ misses: 2, got: 0 });
  });
  it('the timer’s `next` for a stage: the giver gone, the word shown (the pickers still pick), then the round over; a late second one nothing', () => {
    const next = { op: 'next', k: s0.stage };
    const shown = spell.play(s0, 'A', next, ctx);
    expect([shown.shown, shown.gave, spellWord(shown), shown.r]).toEqual([true, false, word(s0), 0]);
    // the other phone's `next` for the same stage, heard after: nothing
    expect(spell.play(shown, 'G', next, ctx)).toBe(shown);
    // the giver's word too late: nothing (no stars for it)
    expect(spell.play(shown, 'B', { w: word(s0) }, ctx)).toBe(shown);
    const over = spell.play(shown, 'G', { op: 'next', k: shown.stage }, ctx);
    expect([over.r, over.results[0]]).toEqual([1, { gave: false, picks: {} }]);
  });
  it('a two-seat table: the roles take turns; done after 3 rounds; stars to each, made the pictures spelt', () => {
    const two = [H('A', 2), H('B', 2)];
    let s = spell.deal(deal(two, 'two'), ctx);
    expect(s.rounds.map((r) => r.giver)).toEqual(['A', 'B', 'A']);
    for (let k = 0; k < SPELL_ROUNDS; k++) {
      const giver = s.rounds[s.r].giver, picker = giver === 'A' ? 'B' : 'A';
      s = run(spell, s, [[picker, { k: right(s, picker) }], [giver, { w: word(s) }]]);
    }
    expect(spell.done(s)).toBe(true);
    const res = spell.close(s);
    expect(res.stars).toEqual({ A: 2 * 2 + 2, B: 2 + 2 * 2 });
    expect(res.made.map((m) => m.kind)).toEqual(['picture', 'picture', 'picture']);
    // after the end: nothing
    expect(spell.play(s, 'A', { k: 0 }, ctx)).toBe(s);
    // cut short by the clock: what was done counts
    const half = spell.play(spell.deal(deal(two, 'two'), ctx), 'A', { w: PICTURES[spell.deal(deal(two, 'two'), ctx).rounds[0].item].w }, ctx);
    expect(spell.close(half).stars).toEqual({ A: 2 });
  });
  it('alone (the others away at the open): the giver spells all three', () => {
    let s = spell.deal(deal([H('A')], 'solo'), ctx);
    for (let k = 0; k < SPELL_ROUNDS; k++) s = spell.play(s, 'A', { w: word(s) }, ctx);
    expect(spell.done(s)).toBe(true);
  });
});

describe('みんなで一文', () => {
  const seats = [H('A', 2), H('B', 1), H('G', 3)];
  const s0 = together.deal(deal(seats, 'tg'), ctx);
  /** The line placed by its owners in order (the right tile each time). */
  const place = (s: TogetherState, slip = false): TogetherState => {
    const line = s.lines[s.l];
    for (let n = 0; n < line.words.length; n++) {
      const k = line.words.findIndex((w, i) => w === line.words[s.row.length] && !s.row.includes(i));
      if (slip && n === 1) {
        const bad = line.words.findIndex((w, i) => w !== line.words[s.row.length] && !s.row.includes(i));
        if (bad >= 0) s = together.play(s, line.owner[bad], { k: bad }, ctx);
      }
      s = together.play(s, line.owner[k], { k }, ctx);
    }
    return s;
  };
  it('deals two lines at the lowest seat’s level, 5+ words at 3 seats, each seat 1–3 tiles, the weakest the first', () => {
    expect(s0.lines).toHaveLength(2);
    for (const line of s0.lines) {
      const lv = (linesJson as unknown as Line[]).find(([en]) => en === line.en)![2];
      expect(lv).toBe(1);
      expect(line.words.length).toBeGreaterThanOrEqual(5);
      expect(line.owner[0]).toBe('B');
      for (const w of ['A', 'B', 'G'] as const) expect(line.owner.filter((o) => o === w).length).toBeGreaterThanOrEqual(1);
    }
    expect(together.deal(deal(seats, 'tg'), ctx)).toEqual(s0);
    expect(s0.unseen).toBe(false);
  });
  it('a tile in order placed, one out of order a nudge (it slides back), someone else’s nothing', () => {
    const line = s0.lines[0];
    const notMine = line.owner.findIndex((o) => o !== 'B');
    expect(together.play(s0, 'B', { k: notMine }, ctx)).toBe(s0);
    expect(mayPlace(s0, 'B', 0)).toBe(true);
    const bad = line.words.findIndex((w, i) => i > 0 && w !== line.words[0]);
    const nudged = together.play(s0, line.owner[bad], { k: bad }, ctx);
    expect([nudged.nudges, nudged.row]).toEqual([1, []]);
    const s1 = together.play(nudged, 'B', { k: 0 }, ctx);
    expect([s1.row, nextWord(s1)]).toEqual([[0], line.words[1]]);
    expect(together.play(s1, 'B', { k: 0 }, ctx)).toBe(s1);
  });
  it('a seat gone quiet: anyone frees its tiles (once); 答えはこれ; both lines done: done', () => {
    const line = s0.lines[0], gk = line.owner.indexOf('G');
    expect(mayPlace(s0, 'A', gk)).toBe(false);
    const freed = together.play(s0, 'A', { op: 'free', k: 2 }, ctx);
    expect(freed.free).toEqual(['G']);
    expect(together.play(freed, 'B', { op: 'free', k: 2 }, ctx)).toBe(freed);
    expect(mayPlace(freed, 'A', gk)).toBe(true);
    const shown = together.play(s0, 'G', { op: 'show' }, ctx);
    const done = place(place(shown), true);
    expect(together.done(done)).toBe(true);
    expect(done.results).toEqual([{ nudges: 0, shown: true }, { nudges: 1, shown: false }]);
    // shown 2, after a nudge 4: each seat the same
    expect(together.close(done)).toEqual({ stars: { A: 6, B: 6, G: 6 }, made: done.lines.map((l, k) => ({ who: 'A', kind: 'sentence', text: l.en, ja: l.ja, stars: [2, 4][k] })) });
    // clean twice: 8 + 8, むずかしい +1 a line (capped at 12 a seat)
    expect(together.close(place(place(s0))).stars).toEqual({ A: 12, B: 12, G: 12 });
    const hard = together.deal(deal([H('A', 3), H('B', 3)], 'hard'), ctx);
    expect(hard.unseen).toBe(true);
    const half = { ...place(hard), l: 1 };
    expect(together.close(half).stars).toEqual({ A: 9, B: 9 });
  });
  it('no line to give (none loaded): done as dealt, no stars', () => {
    const none = together.deal(deal(seats, 'x'), { ...ctx, lines: [] });
    expect([together.done(none), together.close(none)]).toEqual([true, { stars: {}, made: [] }]);
  });
});

describe('RULES 3: nothing dealt solved', () => {
  const three = (seats: Hand[], seed: string): Deal => ({ ...deal(seats, seed), rules: '3' });
  const tables = [[H('A', 1), H('B', 2)], [H('A', 2), H('B', 1), H('G', 3)], [H('A', 3), H('B', 3)]];
  it('みんなで一文: each hand shuffled, what’s left of it never in the line’s order; the weakest the first word; the rest apart', () => {
    for (const seats of tables) {
      let same = 0, pairs = 0;
      for (let k = 0; k < 100; k++) {
        const s = together.deal(three(seats, `t${k}`), ctx);
        expect(together.deal(three(seats, `t${k}`), ctx)).toEqual(s);
        for (const l of s.lines) {
          const weak = [...seats].sort((a, b) => a.level - b.level)[0].who;
          expect([l.owner[0], [...l.order!].sort((a, b) => a - b)]).toEqual([weak, l.words.map((_, i) => i)]);
          for (const { who } of seats) {
            const mine = l.owner.flatMap((o, i) => (o === who ? [i] : []));
            expect(mine.length).toBeGreaterThanOrEqual(Math.floor(l.words.length / seats.length));
            // (the tiles go down in the line's order: each step's hand, while it holds two different words)
            for (let n = 0; n < mine.length; n++) {
              const left = mine.slice(n), read = (ks: number[]) => ks.map((i) => l.words[i]).join(' ');
              if (new Set(left.map((i) => l.words[i])).size > 1) expect(read(l.order!.filter((i) => left.includes(i))), l.en).not.toBe(read(left));
            }
          }
          for (let i = 1; i < l.owner.length; i++) (pairs++, l.owner[i] === l.owner[i - 1] && same++);
        }
      }
      // (neighbours in one hand: only where the hard words or the counts force it; dealt in order, 2 seats: 0.6–0.7)
      expect(same / pairs).toBeLessThan(0.3);
    }
  });
  it('みんなで一文 on RULES 2 (an old game): dealt as before, in order', () => {
    const s = together.deal(deal(tables[1], 'tg'), ctx);
    expect(s.lines.every((l) => !l.order && l.owner[0] === 'B')).toBe(true);
  });
  it('ことばの市場: the rack never reads its word (an old game’s as before)', () => {
    for (let k = 0; k < 400; k++) {
      const s = market.deal(three(tables[0], `m${k}`), ctx), old = market.deal(deal(tables[0], `m${k}`), ctx);
      expect(s.rack.join('')).not.toContain(s.base);
      expect([s.base, [...s.rack].sort()]).toEqual([old.base, [...old.rack].sort()]);
    }
  });
});

describe('なかま分け', () => {
  const seats = [H('A', 1), H('B', 2), H('G', 3)];
  const s0 = sort.deal(deal(seats, 'so'), ctx);
  it('bins by band (やさしい・ふつう the same far pair, むずかしい a close one), each seat’s stream from its sets and tiers', () => {
    expect(s0.pairs.A).toEqual(s0.pairs.B);
    expect(PAIRS.far.some(([a, b]) => s0.pairs.A!.includes(a) && s0.pairs.A!.includes(b))).toBe(true);
    expect(PAIRS.close.some(([a, b]) => s0.pairs.G!.includes(a) && s0.pairs.G!.includes(b))).toBe(true);
    for (const { who, level } of seats) {
      const st = sortStream(s0, who);
      expect(st).toHaveLength(SORT_STREAM);
      expect(sortStream(s0, who)).toEqual(st);
      for (const i of st) {
        expect(binOf(s0.pairs[who]!, i)).toBeGreaterThanOrEqual(0);
        if (level === 1) expect(tierOf(PICTURES[i])).toBe(1);
        if (level === 3) expect(tierOf(PICTURES[i])).toBeGreaterThanOrEqual(2);
      }
      // both bins in the first ten
      expect(new Set(st.slice(0, 10).map((i) => binOf(s0.pairs[who]!, i))).size).toBe(2);
    }
    expect(sortStream(s0, 'G')).not.toEqual(sortStream(s0, 'B'));
  });
  it('one count a seat, the first; done when every seat’s is in; stars by the level’s pace; none sent: お休み (no stars, not 0)', () => {
    let s = run(sort, s0, [['A', { n: 8 }], ['A', { n: 30 }], ['G', { n: 99 }]]);
    expect(s.counts).toEqual({ A: 8, G: SORT_STREAM });
    expect(sort.done(s)).toBe(false);
    expect(sort.close(s).stars).toEqual({ A: 4, G: 6 });
    s = sort.play(s, 'B', { n: 0 }, ctx);
    expect(sort.done(s)).toBe(true);
    expect(sort.close(s).stars).toEqual({ A: 4, G: 6 });
    expect(sort.play(s0, 'B', { w: 'cat' }, ctx)).toBe(s0);
  });
});

describe('しりとり', () => {
  const seats = [H('A', 1), H('B', 3), H('G', 2)];
  const s0 = chain.deal(deal(seats, 'ch', 'B'), ctx);
  /** A word the seat whose turn it is may play now. */
  const ok = (s: ChainState, skip = 0) => ctx.words.starting!(letterOf(s)).filter((w) => !chainCheck(s, chainTurn(s), w, ctx))[skip];
  it('deals an everyday picture to start, the lander first then round the seats; the same for the same seed', () => {
    expect(s0.chain).toHaveLength(1);
    expect(PICTURES.some((p) => p.w === s0.chain[0].w && tierOf(p) === 1)).toBe(true);
    expect(s0.seats.map((x) => x.who)).toEqual(['B', 'G', 'A']);
    expect(chainTurn(s0)).toBe('B');
    // (60 s: six turns at the most)
    expect(MINIS.chain.ms / CHAIN_TURN_MS).toBe(6);
    expect(chain.deal(deal(seats, 'ch', 'B'), ctx)).toEqual(s0);
    expect([chainLetter('apple'), chainLetter('box'), chainLetter('quiz'), chainLetter('xx')]).toEqual(['e', 'o', 'i', 'x']);
  });
  it('a word: whose turn only, the last letter, the level’s length to 8, a real word, not used; then the next seat', () => {
    const w = ok(s0);
    expect(chain.play(s0, 'A', { w }, ctx)).toBe(s0);
    const s1 = chain.play(s0, 'B', { w }, ctx);
    expect([s1.chain.at(-1)?.w, chainTurn(s1), s1.stage]).toEqual([w, 'G', 1]);
    expect(chainCheck(s1, 'G', w, ctx)).toBe(w.startsWith(letterOf(s1)) ? 'used' : 'letter');
    const l = letterOf(s1);
    expect(chainCheck(s1, 'G', `${l === 'a' ? 'b' : 'a'}pple`, ctx)).toBe('letter');
    expect(chainCheck(s1, 'G', `${l}qqqq`, ctx)).toBe('word');
    expect(chainCheck(s1, 'G', `${l}${'a'.repeat(CHAIN_MAX_LEN)}`, ctx)).toBe('long');
    // むずかしい: 4 letters at least; やさしい 3
    const three = ctx.words.starting!(letterOf(s0)).find((x) => x.length === 3 && ctx.words.has(x))!;
    expect(chainCheck(s0, 'B', three, ctx)).toBe('short');
    const easy = chain.deal(deal([H('A', 1)], 'ch'), ctx);
    const e3 = ctx.words.starting!(letterOf(easy)).find((x) => x.length === 3)!;
    expect(chainCheck(easy, 'A', e3, ctx)).toBeNull();
  });
  it('パス and the timer’s skip: the next seat, the same letter; a late second skip nothing; a whole round passed: a new start word', () => {
    const p = chain.play(s0, 'B', { op: 'pass' }, ctx);
    expect([chainTurn(p), letterOf(p), p.chain.length]).toEqual(['G', letterOf(s0), 1]);
    expect(chain.play(s0, 'G', { op: 'pass' }, ctx)).toBe(s0);
    const skip = { op: 'next', k: p.stage };
    const q = chain.play(p, 'A', skip, ctx);
    expect(chainTurn(q)).toBe('A');
    expect(chain.play(q, 'B', skip, ctx)).toBe(q);
    const r = chain.play(q, 'A', { op: 'pass' }, ctx);
    expect([chainTurn(r), r.chain.length, r.chain[1].who, r.passes]).toEqual(['B', 2, null, 0]);
    expect(r.chain[1].w).not.toBe(r.chain[0].w);
  });
  it('ヒント: two letters of a familiar word long enough for the seat, on every phone; free at やさしい, else no everyday +1', () => {
    const h = chainHint(s0, ctx)!;
    expect(h.startsWith(letterOf(s0)) && h.length >= 4).toBe(true);
    const hinted = chain.play(s0, 'B', { op: 'hint' }, ctx);
    expect(hinted.hinted).toBe(true);
    expect(chain.play(hinted, 'B', { op: 'hint' }, ctx)).toBe(hinted);
    const ev = ctx.words.starting!(letterOf(s0)).find((w) => ctx.words.ja(w) && !chainCheck(s0, 'B', w, ctx))!;
    expect(chain.play(s0, 'B', { w: ev }, ctx).chain.at(-1)!.pts).toBe(2);
    expect(chain.play(hinted, 'B', { w: ev }, ctx).chain.at(-1)!.pts).toBe(1);
    const easy = chain.deal(deal([H('A', 1), H('B', 2)], 'ez'), ctx);
    const ew = ctx.words.starting!(letterOf(easy)).find((w) => ctx.words.ja(w) && !chainCheck(easy, 'A', w, ctx))!;
    expect(chain.play(chain.play(easy, 'A', { op: 'hint' }, ctx), 'A', { w: ew }, ctx).chain.at(-1)!.pts).toBe(2);
    // the turn over: the hint gone
    expect(chain.play(hinted, 'B', { op: 'pass' }, ctx).hinted).toBe(false);
  });
  it('stars: each maker’s links (+1 everyday), CHAIN_SEAT_MAX a seat; the longest word kept; none made: none', () => {
    let s = s0;
    for (let k = 0; k < 30; k++) s = chain.play(s, chainTurn(s), { w: ok(s) }, ctx);
    expect(s.chain.length).toBe(31);
    const res = chain.close(s);
    for (const n of Object.values(res.stars)) expect(n).toBeLessThanOrEqual(CHAIN_SEAT_MAX);
    expect(Object.keys(res.stars).sort()).toEqual(['A', 'B', 'G']);
    expect(res.made[0].text.length).toBe(Math.max(...s.chain.slice(1).map((l) => l.w.length)));
    expect(chain.close(s0)).toEqual({ stars: {}, made: [] });
    const one = chain.play(s0, 'B', { w: ok(s0) }, ctx);
    expect(chain.close(one).stars).toEqual({ B: one.chain[1].pts });
  });
});

describe('数字キャッチ', () => {
  // (the words read back by a reader of their own: the prompts' answers checked against it, not against the writer)
  const N: Record<string, number> = Object.fromEntries('zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen'.split(' ').map((w, i) => [w, i]));
  for (const [i, w] of 'twenty thirty forty fifty sixty seventy eighty ninety'.split(' ').entries()) N[w] = 20 + 10 * i;
  const read = (s: string): number => {
    let total = 0, cur = 0;
    for (const t of s.split(/[ -]/)) {
      if (t === 'hundred') cur *= 100;
      else if (t === 'thousand') (total += cur * 1000), (cur = 0);
      else if (t in N) cur += N[t];
      else throw new Error(`not a number word: ${t} in ${s}`);
    }
    return total + cur;
  };
  const answer = (p: NumberPrompt): string => {
    const t = p.text;
    let m: RegExpExecArray | null;
    const hm = (h: number, mm: number) => `${((h + 11) % 12) + 1}:${String(mm).padStart(2, '0')}`;
    if (p.kind === 'number') return String(read(t));
    if (p.kind === 'big') return read(t).toLocaleString('en-US');
    if (p.kind === 'year') {
      const [a, ...b] = t.split(' ');
      return t.startsWith('two thousand') ? String(read(t)) : String(read(a) * 100 + (b[0] === 'oh' ? read(b[1]) : read(b.join(' '))));
    }
    if (p.kind === 'time') {
      if ((m = /^(.+) o’clock$/.exec(t))) return hm(read(m[1]), 0);
      if ((m = /^half past (.+)$/.exec(t))) return hm(read(m[1]), 30);
      if ((m = /^a quarter past (.+)$/.exec(t))) return hm(read(m[1]), 15);
      if ((m = /^a quarter to (.+)$/.exec(t))) return hm(read(m[1]) - 1, 45);
      if ((m = /^(ten|five|twenty) to (.+)$/.exec(t))) return hm(read(m[2]) - 1, 60 - read(m[1]));
      if ((m = /^(ten|five|twenty) past (.+)$/.exec(t))) return hm(read(m[2]), read(m[1]));
      const [h, ...mm] = t.split(' ');
      return hm(read(h), read(mm.join(' ')));
    }
    m = /^(.+?) dollars?(?: (.+))?$/.exec(t) ?? /^(\S+) (\S+)$/.exec(t);
    const [d, c] = [read(m![1]), m![2] ? read(m![2]) : 0];
    return `$${d}.${String(c).padStart(2, '0')}`;
  };
  it('numbers in words, American style, and years as they’re said', () => {
    expect([inWords(45), inWords(13), inWords(30), inWords(100), inWords(320), inWords(3500), inWords(7)]).toEqual(['forty-five', 'thirteen', 'thirty', 'one hundred', 'three hundred twenty', 'three thousand five hundred', 'seven']);
    for (let n = 0; n < 10_000; n += 7) expect(read(inWords(n))).toBe(n);
    expect([yearWords(1985), yearWords(2008), yearWords(2026), yearWords(1905), yearWords(2000)]).toEqual(['nineteen eighty-five', 'two thousand eight', 'twenty twenty-six', 'nineteen oh five', 'two thousand']);
  });
  const seats = [H('A', 1), H('B', 2), H('G', 3)];
  const s0 = numbers.deal(deal(seats, 'nu'), ctx);
  it('each seat its own stream (the same on every phone): four different choices, the answer the words’, the level’s kinds', () => {
    const kinds = new Map<Who, Set<string>>();
    for (let k = 0; k < 40; k++) {
      const s = numbers.deal(deal(seats, `nu${k}`), ctx);
      for (const { who, level } of seats) {
        const st = numberStream(s, who);
        expect(st).toHaveLength(NUMBER_STREAM);
        for (const p of st) {
          expect(new Set(p.choices).size, p.text).toBe(4);
          expect(p.choices[p.a], p.text).toBe(answer(p));
          if (p.kind === 'number') expect(Number(p.choices[p.a])).toBeGreaterThanOrEqual(level === 3 ? 13 : 1);
          if (p.kind === 'time') for (const c of p.choices) expect(c).toMatch(/^(?:[1-9]|1[0-2]):[0-5]\d$/);
          if (p.kind === 'price') for (const c of p.choices) expect(c).toMatch(/^\$[1-9]\d*\.\d\d$/);
          if (p.kind === 'number') for (const c of p.choices) expect(Number(c) >= 1 && Number(c) <= 100).toBe(true);
          const set = kinds.get(who) ?? kinds.set(who, new Set()).get(who)!;
          set.add(p.kind);
        }
      }
      expect(numberStream(s, 'A')).toEqual(numberStream(numbers.deal(deal(seats, `nu${k}`), ctx), 'A'));
    }
    expect([...kinds.get('A')!]).toEqual(['number']);
    expect([...kinds.get('B')!].sort()).toEqual(['number', 'price', 'time']);
    expect([...kinds.get('G')!].sort()).toEqual(['big', 'number', 'price', 'time', 'year']);
    expect(numberStream(s0, 'A')).not.toEqual(numberStream(s0, 'B'));
    expect(numberStream(s0, 'X' as Who)).toEqual([]);
  });
  it('the classic confusions among the choices: a -teen with its -ty, a quarter to with the next hour’s', () => {
    const all = seats.flatMap(({ who }) => Array.from({ length: 30 }, (_, k) => numberStream(numbers.deal(deal(seats, `cf${k}`), ctx), who)).flat());
    const teen = all.filter((p) => p.kind === 'number' && /^1[3-9]$/.test(p.choices[p.a]));
    expect(teen.length).toBeGreaterThan(20);
    for (const p of teen) expect(p.choices).toContain(String((Number(p.choices[p.a]) - 10) * 10));
    const to = all.filter((p) => p.text.startsWith('a quarter to'));
    expect(to.length).toBeGreaterThan(5);
    for (const p of to) {
      const [h] = p.choices[p.a].split(':').map(Number);
      expect(p.choices.some((c) => c === `${(h % 12) + 1}:45` || c === `${(h % 12) + 1}:15`)).toBe(true);
    }
  });
  it('one count a seat, the first; done when every seat’s is in; stars by the level’s pace; none sent: お休み', () => {
    let s = run(numbers, s0, [['A', { n: 8 }], ['A', { n: 30 }], ['G', { n: 99 }]]);
    expect(s.counts).toEqual({ A: 8, G: NUMBER_STREAM });
    expect([numbers.done(s), numbers.close(s).stars]).toEqual([false, { A: 4, G: 6 }]);
    s = numbers.play(s, 'B', { n: 0 }, ctx);
    expect([numbers.done(s), numbers.close(s)]).toEqual([true, { stars: { A: 4, G: 6 }, made: [] }]);
    expect(numbers.play(s0, 'B', { w: 'ten' }, ctx)).toBe(s0);
  });
});

describe('おつかい', () => {
  const picture = (w: string) => PICTURES.findIndex((p) => p.w === w);
  it('the content: every thing a picture with its plural or container and a counter; every list three different things; enough lists a level', () => {
    const words = new Set(SHOP_ITEMS.map((i) => i.w));
    expect(words.size).toBe(SHOP_ITEMS.length);
    for (const i of SHOP_ITEMS) {
      expect(picture(i.w), i.w).toBeGreaterThanOrEqual(0);
      expect(!!i.many !== !!i.box, i.w).toBe(true);
      if (i.box) expect(BOXES as readonly string[]).toContain(i.box);
      expect(i.ja).toMatch(/^[^a-zA-Z]+$/);
      expect(['つ', '個', '本', '枚', '冊', 'びん', '袋', 'パック', '房']).toContain(i.ctr);
    }
    let boxed = 0;
    for (const row of SHOP_LISTS) {
      const ws = [row[1], row[3], row[5]];
      expect(row).toHaveLength(7);
      expect(new Set(ws).size, row[0]).toBe(3);
      for (const w of ws) expect(words.has(w as string), `${row[0]} ${w}`).toBe(true);
      for (const n of [row[2], row[4], row[6]]) expect(Number.isInteger(n) && (n as number) >= 1 && (n as number) <= 6).toBe(true);
      if (ws.some((w) => SHOP_ITEMS.find((i) => i.w === w)!.box)) boxed++;
    }
    expect([SHOP_LISTS.length - boxed >= 25, boxed >= 15]).toEqual([true, true]);
  });
  const seats = [H('A', 1), H('B', 3), H('G', 2)];
  const s0 = shopping.deal(deal(seats, 'sh', 'B'), ctx);
  it('deals two lists, the お客さん the lander then the next; やさしい two lines of countable things, むずかしい three with a container; a shelf of 9 with them', () => {
    expect(s0.rounds.map((r) => r.asker)).toEqual(['B', 'G']);
    // (both rounds' timers fit its 90 s)
    expect(SHOP_ROUNDS * (SHOP_ASK_MS + SHOP_FILL_MS)).toBeLessThanOrEqual(MINIS.shopping.ms);
    expect(shopping.deal(deal(seats, 'sh', 'B'), ctx)).toEqual(s0);
    for (let k = 0; k < 60; k++) {
      const s = shopping.deal(deal(seats, `sh${k}`, (['A', 'B', 'G'] as const)[k % 3]), ctx);
      expect(s.rounds).toHaveLength(SHOP_ROUNDS);
      for (const round of s.rounds) {
        const level = seats.find((x) => x.who === round.asker)!.level;
        const items = round.lines.map((l) => SHOP_ITEMS.find((i) => i.w === l.w)!);
        expect(round.lines).toHaveLength(level === 1 ? 2 : 3);
        expect(items.some((i) => i.box)).toBe(level === 3);
        expect(round.shelf).toHaveLength(SHOP_SHELF);
        expect(new Set(round.shelf).size).toBe(SHOP_SHELF);
        for (const l of round.lines) {
          expect(round.shelf).toContain(picture(l.w));
          expect(round.words).toContain(l.w);
        }
        expect(round.words.length).toBe(round.lines.length + 2);
      }
    }
  });
  it('the list in Japanese and the request in English: counters, a / an, plurals, containers, and', () => {
    const round = { asker: 'A' as Who, title: 't', lines: [{ w: 'apple', n: 2 }, { w: 'egg', n: 1 }, { w: 'bread', n: 2 }], words: ['bread', 'apple', 'egg'], shelf: [] };
    expect(listJa(round)).toBe('りんご2つ、卵1個、食パン2袋');
    expect(requestText(0, rightSlots(round), round.words)).toBe('Can I have two apples, an egg and two loaves of bread, please?');
    expect(requestText(3, rightSlots(round), round.words)).toBe('Two apples, an egg and two loaves of bread, please.');
    expect(requestText(1, rightSlots(round).slice(0, 1), round.words)).toBe('I’d like two apples, please.');
    expect(slotText({ word: 0, n: 1, many: false, box: BOXES.indexOf('loaf') }, round.words)).toBe('a loaf of bread');
    expect(slotText({ word: 0, n: 3, many: true, box: -1 }, ['tomato'])).toBe('three tomatoes');
    expect(slotText({ word: 0, n: 2, many: true, box: BOXES.indexOf('pack') }, ['strawberry'])).toBe('two packs of strawberries');
    expect(lineJa({ w: 'grapes', n: 1 })).toBe('ぶどう1房');
    // every list's request reads
    for (const k of SHOP_LISTS.keys()) {
      const lines = [1, 3, 5].map((i) => ({ w: SHOP_LISTS[k][i] as string, n: SHOP_LISTS[k][i + 1] as number }));
      const r2 = { ...round, lines, words: lines.map((l) => l.w) };
      expect(requestText(2, rightSlots(r2), r2.words)).toMatch(/^Could I get (?:an? |two |three |four |five |six )[a-z ,]+ and (?:an? |two |three |four |five |six )[a-z ]+, please\?$/);
    }
    expect(FRAMES).toHaveLength(4);
  });
  it('the request on the wire: one code (≤ 16, the wire’s), read back; the fold judges it: right, sent; not yet, the slot and part; two misses, the right one shown', () => {
    const round = s0.rounds[0], right = rightSlots(round), code = requestCode(2, right);
    expect(code).toMatch(/^[a-z0-9]{1,16}$/);
    expect(readCode(code)).toEqual({ frame: 2, slots: right });
    expect([readCode('9'), readCode('0zz'), readCode('')]).toEqual([null, null, null]);
    expect(requestCheck(round, code)).toBeNull();
    const wrong = (f: (sl: (typeof right)[number]) => object) => requestCode(0, right.map((sl, i) => (i === 1 ? { ...sl, ...f(sl) } : sl)));
    expect(requestCheck(round, wrong((sl) => ({ word: (sl.word + 1) % round.words.length })))).toEqual({ slot: 1, part: 'word' });
    expect(requestCheck(round, wrong((sl) => ({ n: sl.n === 6 ? 5 : sl.n + 1 })))).toEqual({ slot: 1, part: 'number' });
    expect(requestCheck(round, wrong((sl) => ({ many: !sl.many })))).toEqual({ slot: 1, part: 'many' });
    expect(requestCheck(round, requestCode(0, right.slice(0, 2)))).toEqual({ slot: 2, part: 'word' });
    // only the お客さん's, once
    expect(shopping.play(s0, 'A', { op: code }, ctx)).toBe(s0);
    const sent = shopping.play(s0, 'B', { op: code }, ctx);
    expect([sent.frame, shopRequest(sent)]).toEqual([2, requestText(2, right, round.words)]);
    expect(shopping.play(sent, 'B', { op: code }, ctx)).toBe(sent);
    const miss = wrong((sl) => ({ many: !sl.many }));
    const once = shopping.play(s0, 'B', { op: miss }, ctx);
    expect([once.tries, shopRequest(once)]).toEqual([1, null]);
    const twice = shopping.play(once, 'B', { op: miss }, ctx);
    expect([twice.shown, shopRequest(twice)]).toEqual([true, requestText(0, right, round.words)]);
  });
  it('the shop fills the basket (the お客さん can’t; alone, they do), hands it over: right, the round over; else one more go', () => {
    const round = s0.rounds[0];
    expect(shopping.play(s0, 'A', { k: 0 }, ctx)).toBe(s0);
    let s = shopping.play(s0, 'B', { op: requestCode(0, rightSlots(round)) }, ctx);
    expect(shopping.play(s, 'B', { k: 0 }, ctx)).toBe(s);
    const fill = (x: ShoppingState, who: Who) => round.lines.reduce((y, l) => Array.from({ length: l.n }).reduce<ShoppingState>((z) => shopping.play(z, who, { k: round.shelf.indexOf(picture(l.w)) }, ctx), y), x);
    // one too many of the first, then taken out
    const slot = round.shelf.indexOf(picture(round.lines[0].w));
    s = shopping.play(fill(s, 'A'), 'G', { k: slot }, ctx);
    expect(basketRight(s)).toBe(round.lines.length - 1);
    const paid = shopping.play(s, 'A', { op: 'pay' }, ctx);
    expect([paid.r, paid.pays]).toEqual([0, 1]);
    s = shopping.play(paid, 'G', { k: slot, op: 'out' }, ctx);
    expect(basketRight(s)).toBe(round.lines.length);
    expect(shopping.play(s0, 'B', { k: slot, op: 'out' }, ctx)).toBe(s0);
    const done = shopping.play(s, 'G', { op: 'pay' }, ctx);
    expect([done.r, done.results[0]]).toEqual([1, { first: true, right: round.lines.length, of: round.lines.length }]);
    // alone: the お客さん shops too
    const solo = shopping.deal(deal([H('A', 2)], 'solo'), ctx);
    const sr = solo.rounds[0];
    const sent = shopping.play(solo, 'A', { op: requestCode(0, rightSlots(sr)) }, ctx);
    expect(shopping.play(sent, 'A', { k: 0 }, ctx).basket[0]).toBe(1);
  });
  it('the timers: the list not in, it goes as written (no bonus); then the round over with the basket as it is; a late second next nothing; stars to everyone', () => {
    const next = { op: 'next', k: s0.stage };
    const shown = shopping.play(s0, 'A', next, ctx);
    expect([shown.shown, shopRequest(shown) !== null, shown.r]).toEqual([true, true, 0]);
    expect(shopping.play(shown, 'G', next, ctx)).toBe(shown);
    const round = s0.rounds[0], first = round.lines[0];
    let s = shopping.play(shown, 'G', { k: round.shelf.indexOf(picture(first.w)) }, ctx);
    for (let n = 1; n < first.n; n++) s = shopping.play(s, 'A', { k: round.shelf.indexOf(picture(first.w)) }, ctx);
    s = shopping.play(s, 'A', { op: 'next', k: s.stage }, ctx);
    expect([s.r, s.results[0]]).toEqual([1, { first: false, right: 1, of: round.lines.length }]);
    // one line right, no bonus: 2 each
    expect(shopping.close(s).stars).toEqual({ A: 2, B: 2, G: 2 });
    expect(shopping.close(s0)).toEqual({ stars: {}, made: [] });
    // both right first time: (2 × lines + 2) a list, capped at 12 a seat; the requests made
    let all = s0;
    for (let k = 0; k < SHOP_ROUNDS; k++) {
      const rd = all.rounds[all.r], shop = seats.find((x) => x.who !== rd.asker)!.who;
      all = shopping.play(all, rd.asker, { op: requestCode(0, rightSlots(rd)) }, ctx);
      for (const l of rd.lines) for (let n = 0; n < l.n; n++) all = shopping.play(all, shop, { k: rd.shelf.indexOf(picture(l.w)) }, ctx);
      all = shopping.play(all, shop, { op: 'pay' }, ctx);
    }
    expect(shopping.done(all)).toBe(true);
    const res = shopping.close(all);
    expect(res.stars).toEqual({ A: 12, B: 12, G: 12 });
    expect(res.made.map((m) => [m.who, m.kind])).toEqual([['B', 'sentence'], ['G', 'sentence']]);
    expect(res.made[0].ja).toBe(listJa(all.rounds[0]));
  });
});

describe('返事はどれ？', () => {
  it('the content: 80–120 exchanges, ids once, A1–A2, one reply that fits and three that don’t, all different, each with casual Japanese; the フレーズ cards it reuses real', () => {
    expect(EXCHANGES.length).toBeGreaterThanOrEqual(80);
    expect(EXCHANGES.length).toBeLessThanOrEqual(120);
    expect(new Set(EXCHANGES.map((e) => e.id)).size).toBe(EXCHANGES.length);
    expect(new Set(EXCHANGES.map((e) => e.q[0])).size).toBe(EXCHANGES.length);
    const dir = join(import.meta.dirname, '../../english/clips');
    const clips = readdirSync(dir).map((f) => readFileSync(join(dir, f), 'utf8')).join('\n');
    for (const e of EXCHANGES) {
      expect([1, 2]).toContain(e.lv);
      expect(e.x, e.id).toHaveLength(3);
      const all = [e.q, e.a, ...e.x];
      expect(new Set([e.a, ...e.x].map(([en]) => en.toLowerCase())).size, e.id).toBe(4);
      for (const [en, ja] of all) {
        expect(en, e.id).toMatch(/^[A-Z][A-Za-z0-9’,.!?\- ]+[.!?]$/);
        expect(en, e.id).not.toMatch(/'/);
        expect(ja, e.id).toMatch(/[ぁ-んァ-ヶ一-龯]/);
        expect(ja, e.id).not.toMatch(/です|ます/);
      }
      // (a source: an existing clip, cited as clip/qid)
      if (e.src) {
        const [clip, qid] = e.src.split('/');
        expect(clips.includes(`id: '${clip}'`) && clips.includes(`{ id: '${qid}'`), e.src).toBe(true);
      }
    }
    expect(EXCHANGES.filter((e) => e.lv === 1).length).toBeGreaterThanOrEqual(40);
    expect(new Set(EXCHANGES.map((e) => e.t))).toEqual(new Set(['travel', 'shop', 'food', 'home', 'work', 'chat']));
  });
  const seats = [H('A', 1), H('B', 3), H('G', 2)];
  const s0 = reply.deal(deal(seats, 're', 'G'), ctx);
  const holder = (s: ReplyState) => Object.entries(s.rounds[s.r].hands).find(([, h]) => h!.includes(0))!;
  it('deals 4 exchanges, the asker the lander then round; two cards each at 3 seats (one fits, in one hand), three at 2, the closest wrong one to the strongest', () => {
    expect(s0.rounds.map((r) => r.asker)).toEqual(['G', 'A', 'B', 'G']);
    expect(reply.deal(deal(seats, 're', 'G'), ctx)).toEqual(s0);
    expect(MINIS.reply.ms / REPLY_TURN_MS).toBe(REPLY_ROUNDS);
    for (let k = 0; k < 50; k++) {
      const s = reply.deal(deal(seats, `re${k}`), ctx);
      expect(new Set(s.rounds.map((r) => r.ex)).size).toBe(REPLY_ROUNDS);
      for (const round of s.rounds) {
        // (a table with a やさしい seat: A1 lines)
        expect(EXCHANGES[round.ex].lv).toBe(1);
        expect(round.hands[round.asker]).toBeUndefined();
        const cards = Object.values(round.hands).flat();
        expect(cards.sort()).toEqual([0, 1, 2, 3]);
        for (const h of Object.values(round.hands)) expect(h).toHaveLength(2);
        // (むずかしい the closest wrong one; やさしい, not holding it, the plainest two)
        if (round.asker !== 'B') expect(round.hands.B).toContain(1);
        if (round.asker !== 'A' && !round.hands.A!.includes(0)) expect(round.hands.A!.slice().sort()).toEqual([2, 3]);
      }
    }
    const two = reply.deal(deal([H('A', 3), H('B', 2)], 'two'), ctx);
    for (const round of two.rounds) expect(Object.values(round.hands).map((h) => h!.slice().sort())).toEqual([[0, 1, 2]]);
    const strong = reply.deal(deal([H('A', 2), H('B', 3)], 'lv'), ctx);
    expect(strong.rounds.some((r) => EXCHANGES[r.ex].lv === 2)).toBe(true);
    const solo = reply.deal(deal([H('A', 1)], 'solo'), ctx);
    expect(solo.rounds[0].hands.A).toHaveLength(3);
    expect(cardLine(EXCHANGES[0], 0)).toEqual(EXCHANGES[0].a);
    expect(cardLine(EXCHANGES[0], 1)).toEqual(EXCHANGES[0].x[0]);
  });
  it('the fitting card: the round over, its finder; one that doesn’t: おしい (once a card); the asker holds none; the timer shows it', () => {
    const [who, hand] = holder(s0);
    const wrongK = hand!.findIndex((c) => c !== 0);
    const other = Object.entries(s0.rounds[0].hands).find(([w]) => w !== who)!;
    let s = reply.play(s0, other[0] as Who, { k: 0 }, ctx);
    expect(s.tried[other[0] as Who]).toEqual([0]);
    expect(reply.play(s, other[0] as Who, { k: 0 }, ctx)).toBe(s);
    expect(reply.play(s0, 'G', { k: 0 }, ctx)).toBe(s0);
    if (wrongK >= 0) s = reply.play(s, who as Who, { k: wrongK }, ctx);
    s = reply.play(s, who as Who, { k: hand!.indexOf(0) }, ctx);
    expect([s.r, s.results[0].by, s.results[0].misses]).toEqual([1, who, wrongK >= 0 ? 2 : 1]);
    expect(replyOn(s)).toBe(EXCHANGES[s.rounds[1].ex]);
    const next = { op: 'next', k: s.stage };
    const t = reply.play(s, 'A', next, ctx);
    expect([t.r, t.results[1].by]).toEqual([2, null]);
    expect(reply.play(t, 'B', next, ctx)).toBe(t);
  });
  it('stars: 2 each a reply found, +2 all four with no おしい; made the exchanges found', () => {
    let s = s0;
    for (let k = 0; k < REPLY_ROUNDS; k++) {
      const [who, hand] = holder(s);
      s = reply.play(s, who as Who, { k: hand!.indexOf(0) }, ctx);
    }
    expect(reply.done(s)).toBe(true);
    const res = reply.close(s);
    expect(res.stars).toEqual({ A: 10, B: 10, G: 10 });
    expect(res.made).toHaveLength(4);
    expect(res.made[0].text).toBe(`${EXCHANGES[s.rounds[0].ex].q[0]} — ${EXCHANGES[s.rounds[0].ex].a[0]}`);
    expect(reply.close(s0)).toEqual({ stars: {}, made: [] });
    const one = reply.play(s0, holder(s0)[0] as Who, { k: holder(s0)[1]!.indexOf(0) }, ctx);
    expect(reply.close(one).stars).toEqual({ A: 2, B: 2, G: 2 });
  });
});

describe('every game: whatever the plays, never a negative star, and the same plays give the same game', () => {
  const seats = [H('A', 1), H('B', 2), H('G', 3)];
  const rackWords = new Map<string, string[]>();
  /** Plausible plays for a game's state (right and wrong ones, controls, from every seat and one not dealt in). */
  function playsFor(id: MiniId, s: unknown, r: () => number): [Who, Play][] {
    const who: Who = (['A', 'B', 'G'] as const)[Math.floor(r() * 3)];
    switch (id) {
      case 'market': {
        const m = s as MarketState, key = m.rack.join('');
        const ws = rackWords.get(key) ?? rackWords.set(key, ctx.words.from(m.rack, () => 0).slice(0, 25)).get(key)!;
        return [[who, { w: ws[Math.floor(r() * Math.min(ws.length, 25))] ?? 'cat' }]];
      }
      case 'spell': {
        const p = s as SpellState, round = p.rounds[p.r];
        if (!round) return [[who, { k: 0 }]];
        const x = r();
        if (x < 0.2) return [[round.giver, { w: PICTURES[round.item].w }]];
        if (x < 0.3) return [[who, { op: 'next', k: p.stage }]];
        return [[who, { k: Math.floor(r() * 6) }]];
      }
      case 'together': {
        const t = s as TogetherState, line = t.lines[t.l];
        if (!line) return [[who, { k: 0 }]];
        const x = r();
        if (x < 0.05) return [[who, { op: 'show' }]];
        if (x < 0.1) return [[who, { op: 'free', k: Math.floor(r() * 3) }]];
        const k = Math.floor(r() * line.words.length);
        return [[line.owner[k], { k }]];
      }
      case 'sort':
        return [[who, { n: Math.floor(r() * 100) }]];
      case 'numbers':
        return [[who, { n: Math.floor(r() * 100) }]];
      case 'reply': {
        const rp = s as ReplyState, round = rp.rounds[rp.r];
        if (!round) return [[who, { k: 0 }]];
        if (r() < 0.1) return [[who, { op: 'next', k: rp.stage % 64 }]];
        return [[who, { k: Math.floor(r() * 3) }]];
      }
      case 'shopping': {
        const sh = s as ShoppingState, round = sh.rounds[sh.r], x = r();
        if (!round) return [[who, { k: 0 }]];
        if (x < 0.15) return [[round.asker, { op: requestCode(Math.floor(r() * 4), rightSlots(round)) }]];
        if (x < 0.25) return [[round.asker, { op: requestCode(0, rightSlots(round).map((sl) => ({ ...sl, n: 1 + Math.floor(r() * 6) }))) }]];
        if (x < 0.3) return [[who, { op: 'next', k: sh.stage % 64 }]];
        if (x < 0.4) return [[who, { op: 'pay' }]];
        if (x < 0.5) return [[who, { k: Math.floor(r() * SHOP_SHELF), op: 'out' }]];
        return [[who, { k: Math.floor(r() * SHOP_SHELF) }]];
      }
      case 'chain': {
        const c = s as ChainState, x = r(), turn = chainTurn(c);
        if (x < 0.55) return [[turn, { w: ctx.words.starting!(letterOf(c)).find((w) => !chainCheck(c, turn, w, ctx)) ?? 'cat' }]];
        if (x < 0.65) return [[turn, { op: 'hint' }]];
        if (x < 0.75) return [[turn, { op: 'pass' }]];
        if (x < 0.85) return [[who, { op: 'next', k: c.stage % 64 }]];
        return [[who, { w: ['apple', 'egg', 'tree', 'rain', 'zz'][Math.floor(r() * 5)] }]];
      }
    }
  }
  it('300 random games each', () => {
    for (const id of MINI_IDS) {
      const game = GAMES[id] as MiniGame<unknown>;
      for (let k = 0; k < 300; k++) {
        const r = seeded(`${id}${k}`), here = shuffle([...seats], r).slice(0, 1 + Math.floor(r() * 3));
        let s = game.deal(deal(here, `${id}:${k}`, here[0].who), ctx);
        const plays: [Who, Play][] = [];
        for (let n = 0; n < 40 && !game.done(s); n++) for (const pl of playsFor(id, s, r)) (plays.push(pl), (s = game.play(s, pl[0], pl[1], ctx)));
        const res = game.close(s);
        for (const [w, n] of Object.entries(res.stars)) {
          expect(n, `${id} ${k}`).toBeGreaterThan(0);
          expect(here.some((x) => x.who === w), `${id} ${k} ${w}`).toBe(true);
        }
        expect(Object.values(res.stars).reduce((a, b) => a + (b ?? 0), 0)).toBeLessThanOrEqual(CAP_PER_SEAT * here.length);
        // (folded again from the same plays: the same)
        const again = plays.reduce((x, [w, p]) => game.play(x, w, p, ctx), game.deal(deal(here, `${id}:${k}`, here[0].who), ctx));
        expect(JSON.stringify(again)).toBe(JSON.stringify(s));
      }
    }
  });
});
