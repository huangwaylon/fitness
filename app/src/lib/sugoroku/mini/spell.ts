// ★2 伝えて当てて — Spell & Pick (docs/sugoroku.md "みんなで！"): each round one seat (the 伝える人, the lander first,
// then the next seat) sees a picture and spells its English (the 絵 turn's tiles and help, the sheet's); the others (the
// 当てる人) see a grid of pictures (4; 6 at むずかしい, its others from the same set) and the word growing (`sgv`, the
// sheet's), and tap the one it is. 3 rounds in 60 s. The giver's play is the word, once whole (`w`); a picker's, the
// grid index (`k`): right first 2 stars, after 「おしい！」 1, a second miss shows it. A round ends when the giver's word
// is in (or shown) and every picker is through; its timer (20 s, the sheet's) sends `next` for its stage: the giver's
// word not in, it's shown (they dropped: the pickers read it), else the round ends (a picker gone is skipped).
import { seeded, shuffle, weighted } from '#lib/random.ts';
import type { Who } from '#lib/types.ts';
import { PICTURES, TIERS, tierOf } from '../pictures.ts';
import { isStage } from './hands.ts';
import { capStars } from './stars.ts';
import type { Deal, Hand, MiniGame, MiniMade, Play, Result } from './types.ts';

export const SPELL_ROUNDS = 3;
/** The giver's stars a round, a picker's right first and after a miss. */
const GIVE = 2, PICK = [2, 1] as const;

interface SpellRound {
  giver: Who;
  /** PICTURES' index. */
  item: number;
  /** Each picker's grid (PICTURES' indices, the item among them). */
  grids: Partial<Record<Who, number[]>>;
}
export interface SpellState {
  seats: Hand[];
  rounds: SpellRound[];
  /** The round on (rounds.length: all played). */
  r: number;
  /** The control stage (hands.ts isStage): one more at each reveal and round's end. */
  stage: number;
  /** The round's word: spelt by its giver, or shown on the timer. */
  gave: boolean;
  shown: boolean;
  /** The round's pickers: misses so far, and their stars once through (0: shown after two misses). */
  picks: Partial<Record<Who, { misses: number; got?: number }>>;
  /** The rounds played: whether the giver spelt it, each picker's stars. */
  results: { gave: boolean; picks: Partial<Record<Who, number>> }[];
}

function dealRounds(d: Deal): SpellRound[] {
  const r = seeded(`${d.seed}:spell`), n = d.seats.length;
  const from = Math.max(0, d.seats.findIndex((s) => s.who === d.lander));
  const chosen = new Set<number>();
  const rounds: SpellRound[] = [];
  for (let k = 0; k < SPELL_ROUNDS; k++) {
    const giver = d.seats[(from + k) % n];
    const left = PICTURES.map((_, i) => i).filter((i) => !chosen.has(i) && !d.used.pictures.has(PICTURES[i].w));
    const tier = weighted(TIERS[giver.level], r), pool = left.filter((i) => tierOf(PICTURES[i]) === tier);
    const item = (pool.length ? pool : left)[Math.floor(r() * (pool.length || left.length))];
    chosen.add(item);
    const set = PICTURES[item].set, grids: SpellRound['grids'] = {};
    for (const p of d.seats) {
      if (p.who === giver.who) continue;
      const size = p.level >= 3 ? 6 : 4;
      const others = PICTURES.map((_, i) => i).filter((i) => i !== item && PICTURES[i].w !== PICTURES[item].w);
      const same = others.filter((i) => PICTURES[i].set === set), apart = others.filter((i) => PICTURES[i].set !== set);
      // (むずかしい: its own set's, then any; else other sets' everyday ones first)
      const easy = apart.filter((i) => tierOf(PICTURES[i]) === 1);
      const pick = p.level >= 3 ? [...shuffle(same, r), ...shuffle(apart, r)] : [...shuffle(easy, r), ...shuffle(apart, r)];
      grids[p.who] = shuffle([item, ...[...new Set(pick)].slice(0, size - 1)], r);
    }
    rounds.push({ giver: giver.who, item, grids });
  }
  return rounds;
}

/** The round's word as the pickers see it at its end (spelt or shown), else null. */
export const spellWord = (s: SpellState): string | null => (s.r < s.rounds.length && (s.gave || s.shown) ? PICTURES[s.rounds[s.r].item].w : null);

/** The round over: its results kept, the next one on. */
function nextRound(s: SpellState): SpellState {
  const picks = Object.fromEntries(Object.entries(s.picks).map(([w, p]) => [w, p?.got ?? 0])) as Partial<Record<Who, number>>;
  return { ...s, r: s.r + 1, stage: s.stage + 1, gave: false, shown: false, picks: {}, results: [...s.results, { gave: s.gave, picks }] };
}
/** The round through: its word in (or shown) and every picker through. */
function settle(s: SpellState): SpellState {
  const round = s.rounds[s.r];
  const through = Object.keys(round.grids).every((w) => s.picks[w as Who]?.got !== undefined);
  return (s.gave || s.shown) && through ? nextRound(s) : s;
}

export const spell: MiniGame<SpellState> = {
  deal: (d) => ({ seats: [...d.seats], rounds: dealRounds(d), r: 0, stage: 0, gave: false, shown: false, picks: {}, results: [] }),
  play(s, who, p: Play) {
    if (s.r >= s.rounds.length) return s;
    const round = s.rounds[s.r];
    // (a control move, its stage's or a late one for a stage gone by: never a tap)
    if (p.op !== undefined) return !isStage(p, s.stage) ? s : !s.gave && !s.shown ? { ...s, shown: true, stage: s.stage + 1 } : nextRound(s);
    if (who === round.giver) return p.w === PICTURES[round.item].w && !s.gave && !s.shown ? settle({ ...s, gave: true }) : s;
    const grid = round.grids[who], was = s.picks[who] ?? { misses: 0 };
    if (!grid || p.k === undefined || p.k >= grid.length || was.got !== undefined) return s;
    const right = grid[p.k] === round.item, misses = was.misses + (right ? 0 : 1);
    const got = right ? PICK[Math.min(misses, 1)] : misses >= 2 ? 0 : undefined;
    return settle({ ...s, picks: { ...s.picks, [who]: { misses, ...(got !== undefined ? { got } : {}) } } });
  },
  done: (s) => s.r >= s.rounds.length,
  close(s): Result {
    // (a round cut short by the clock counts what was done in it)
    const all = s.r < s.rounds.length ? nextRound(s).results : s.results;
    const raw: Partial<Record<Who, number>> = {}, made: MiniMade[] = [];
    all.forEach((res, k) => {
      const round = s.rounds[k], pic = PICTURES[round.item];
      if (res.gave) raw[round.giver] = (raw[round.giver] ?? 0) + GIVE;
      for (const [w, n] of Object.entries(res.picks)) raw[w as Who] = (raw[w as Who] ?? 0) + (n ?? 0);
      if (res.gave) made.push({ who: round.giver, kind: 'picture', text: pic.w, ja: pic.ja, stars: GIVE });
    });
    return { stars: capStars(raw, s.seats), made };
  }
};
