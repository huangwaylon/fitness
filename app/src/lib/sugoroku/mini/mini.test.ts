// The mini-games' pure parts (docs/sugoroku.md "みんなで！"): the building blocks (options, clock, stars, hands) and each
// game's reducer, hermetic (pinned seeds, the real word and line lists, no clock but the numbers given).
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
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
    const played: MiniId[] = ['market', 'sort'];
    for (let k = 0; k < 30; k++) expect(miniOptions(played, seeded(`p${k}`)).sort()).toEqual(['spell', 'together']);
    // one left: it and the one played longest ago
    for (let k = 0; k < 10; k++) expect(miniOptions(['market', 'sort', 'spell'], seeded(`q${k}`)).sort()).toEqual(['market', 'together']);
    for (let k = 0; k < 10; k++) expect(miniOptions(['market', 'sort', 'spell', 'together', 'market'], seeded(`q${k}`)).sort()).toEqual(['sort', 'spell']);
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
