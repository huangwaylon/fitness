// Less repetition (recent.ts): the host's seed with the least overlap with its last games, the flags kept; a solo
// game's and にがて れんしゅう's freshest items.
import { describe, expect, it } from 'vitest';
import { mulberry32 } from '#lib/random.ts';
import { type Level } from './bank.ts';
import { BANK } from './source.ts';
import { deck, inMix } from './deck.ts';
import { skillsOf } from './tags.ts';
import { RECENT_GAMES, SEED_TRIES, agesOf, freshSeed, overlap, remember, seedWith, staleness, type Recent } from './recent.ts';
import { FLAG_BITS, isLadder, timerOf, versus } from './seed.ts';
import { QuizSession, type DeckOf } from './session.ts';
import { practiceDeck } from './srs.ts';
import { statsOf } from './progress.ts';
import { loadAll } from './pool.ts';

// (the compiled levels' chunks: decks and clips read the loaded ones, pool.ts)
await loadAll();

const ids = (lv: Level) => (seed: number) => deck(seed, lv).map((it) => it.id);

/** A host playing `games` games in a row at `lv`: each game's items heard before in its last RECENT_GAMES games. */
function replay(lv: Level, games: number, pickSeed: (r: () => number, recent: Recent) => number): number[] {
  const r = mulberry32(2026);
  let recent: Recent = [];
  const out: number[] = [];
  for (let k = 0; k < games; k++) {
    const d = ids(lv)(pickSeed(r, recent));
    const heard = new Set(recent.flat());
    out.push(d.filter((id) => heard.has(id)).length);
    recent = remember(recent, d);
  }
  return out;
}
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

describe('kikimimi recent history', () => {
  it('remember: newest first, at most 6 games; agesOf and staleness count games ago', () => {
    let h: Recent = [];
    for (let k = 0; k < 8; k++) h = remember(h, [`a${k}`, 'x']);
    expect(h).toHaveLength(RECENT_GAMES);
    expect(h[0]).toEqual(['a7', 'x']);
    expect(remember(h, [])).toEqual(h);
    const ages = agesOf(h);
    expect(ages.get('a7')).toBe(0);
    expect(ages.get('x')).toBe(0);
    expect(ages.get('a2')).toBe(5);
    expect(ages.has('a1')).toBe(false);
    expect([staleness('a7', ages), staleness('a2', ages), staleness('new', ages)]).toEqual([6, 1, 0]);
    expect(overlap(['a7', 'a2', 'new'], ages)).toBe(7);
  });

  it('freshSeed keeps the flags (たいせん, スピード はしご, こたえる じかん) in every candidate', () => {
    for (let flags = 0; flags <= FLAG_BITS; flags++) {
      const r = mulberry32(flags + 1);
      const seen: number[] = [];
      const s = freshSeed({ random: r, flags, recent: [ids(4)(1)], ids: (x) => (seen.push(x), ids(4)(x)) });
      expect(s & FLAG_BITS).toBe(flags);
      expect(seen.every((x) => (x & FLAG_BITS) === flags)).toBe(true);
      expect(seen.length).toBeLessThanOrEqual(SEED_TRIES);
      expect(seedWith(() => 0.999999, flags) & FLAG_BITS).toBe(flags);
    }
  });

  it('freshSeed is deterministic given the random sequence and the history, and stops at a deck with no overlap', () => {
    const h = [ids(6)(11), ids(6)(12)];
    const a = freshSeed({ random: mulberry32(9), flags: 5, recent: h, ids: ids(6) });
    expect(freshSeed({ random: mulberry32(9), flags: 5, recent: h, ids: ids(6) })).toBe(a);
    let calls = 0;
    freshSeed({ random: mulberry32(9), flags: 0, recent: [], ids: (x) => (calls++, ids(6)(x)) });
    expect(calls).toBe(1); // nothing heard yet: the first seed
    // the deck it keeps overlaps no more than any other it tried
    const tried: number[] = [];
    const best = freshSeed({ random: mulberry32(3), flags: 0, recent: h, ids: (x) => (tried.push(x), ids(6)(x)) });
    const ages = agesOf(h);
    expect(Math.min(...tried.map((x) => overlap(ids(6)(x), ages)))).toBe(overlap(ids(6)(best), ages));
  });

  it('the overlap with the last 6 games falls (30 games in a row: random seeds against the host’s pick)', () => {
    for (const lv of [1, 2, 3, 4, 6, 7] as Level[]) {
      const before = mean(replay(lv, 30, (r) => seedWith(r, 0)));
      const after = mean(replay(lv, 30, (r, recent) => freshSeed({ random: r, flags: 0, recent, ids: ids(lv) })));
      // (levels 1-3 hold 46-49 items, ~48 heard in 6 games: some overlap is unavoidable there; the アナウンス pack's 30, more)
      expect(after, `level ${lv}: ${before} → ${after}`).toBeLessThan(lv === 4 || lv >= 6 ? before / 2 : before);
    }
  });

  it('a solo deck (deck with `seen`) draws the items not heard lately first: no repeat while the level has fresh ones', () => {
    for (const lv of [4, 6, 7] as Level[]) {
      let recent: Recent = [];
      for (let k = 0; k < RECENT_GAMES; k++) {
        const d = deck(1000 + k, lv, undefined, agesOf(recent)).map((it) => it.id);
        expect(d.filter((id) => recent.flat().includes(id)), `level ${lv} game ${k}`).toEqual([]);
        recent = remember(recent, d);
      }
    }
    // level 1's pool runs short of fresh pictures: then the least recently heard come back first
    let recent: Recent = [];
    for (let k = 0; k < RECENT_GAMES; k++) recent = remember(recent, deck(2000 + k, 1, undefined, agesOf(recent)).map((it) => it.id));
    const ages = agesOf(recent);
    const next = deck(3000, 1, undefined, ages);
    const pics = next.filter((it) => it.type === 'pic').map((it) => staleness(it.id, ages));
    const pool = BANK.filter((it) => it.lv === 1 && it.type === 'pic').map((it) => staleness(it.id, ages)).sort((a, b) => a - b);
    expect([...pics].sort((a, b) => a - b)).toEqual(pool.slice(0, pics.length));
    // and without a history it's the shared deck
    expect(deck(77, 4, undefined, new Map())).toEqual(deck(77, 4));
  });

  it('にがて れんしゅう prefers the items not heard lately', () => {
    const lv: Level[] = [4];
    const today = '2026-11-06';
    const stats = statsOf([], today);
    const focus = { skill: 'indirect' } as const;
    const first = practiceDeck({ answers: [], stats, today, seed: 5, levels: lv, focus }).map((it) => it.id);
    const again = practiceDeck({ answers: [], stats, today, seed: 5, levels: lv, focus, recent: [first] }).map((it) => it.id);
    expect(again).toHaveLength(8);
    // mostly fresh; an item heard comes back only when its skill (the deck covers the weakest skills two items each)
    // had no unheard item left to draw
    const repeats = again.filter((id) => first.includes(id));
    expect(repeats.length).toBeLessThan(first.length / 2);
    const pool = BANK.filter((it) => it.lv === 4 && inMix(it) && [skillsOf(it).primary, ...skillsOf(it).also].includes('indirect'));
    for (const id of repeats) {
      const s = skillsOf(BANK.find((it) => it.id === id)!).primary;
      const fresh = pool.filter((it) => skillsOf(it).primary === s && !first.includes(it.id)).map((it) => it.id);
      expect(fresh.filter((x) => !again.includes(x)), `${id} (${s})`).toEqual([]);
    }
    // without the history, the same seed deals the same deck
    expect(practiceDeck({ answers: [], stats, today, seed: 5, levels: lv, focus }).map((it) => it.id)).toEqual(first);
  });

  it('the session asks the host’s seedFor at open and when configure changes the level or a flag, the flags as set', () => {
    const asked: { lv: number; flags: number }[] = [];
    const deckOf: DeckOf = () => ({ count: 8, dur: () => 1000, answer: () => 0 });
    const s = new QuizSession({ me: 'A', deckOf, random: mulberry32(1), seedFor: ({ lv, flags }) => (asked.push({ lv, flags }), (0xabc0 | flags) >>> 0) });
    s.open({ lv: 6, vs: true, timer: 60 }, 0);
    expect(asked).toEqual([{ lv: 6, flags: 1 | (2 << 2) }]);
    let v = s.view(0);
    expect([v.seed, versus(v.seed), timerOf(v.seed), v.lv]).toEqual([0xabc0 | 9, true, 60, 6]);
    s.configure({ same: true }, 1); // no new deck: the seed stays
    expect(asked).toHaveLength(1);
    s.configure({ lv: 7 }, 2);
    s.configure({ ladder: true }, 3);
    expect(asked.slice(1)).toEqual([{ lv: 7, flags: 9 }, { lv: 7, flags: 11 }]);
    v = s.view(3);
    expect([isLadder(v.seed), versus(v.seed), timerOf(v.seed)]).toEqual([true, true, 60]);
  });
});
