// ききみみ クイズ: a game's 8 questions from {seed, lv} (docs/kikimimi.md "Content"). Pure and deterministic: every
// phone builds the same deck from the `open` intent's seed and level, so no text goes on the wire.
import { mulberry32, shuffle } from '#lib/random.ts';
import { BANK, type Item, type ItemType, type Level } from './bank.ts';
import { CLIPS } from './clips.ts';

export const DECK_SIZE = 8;

/** How many of each type a level's game has (8 in all). Level 5 has none yet (the protocol's room for the next). */
export const MIX: Readonly<Partial<Record<Level, Readonly<Record<ItemType, number>>>>> = {
  1: { pic: 3, word: 3, num: 2, reply: 0, mean: 0 },
  2: { pic: 2, word: 2, num: 2, reply: 2, mean: 0 },
  3: { pic: 1, word: 2, num: 2, reply: 3, mean: 0 },
  4: { pic: 0, word: 2, num: 2, reply: 2, mean: 2 }
};

/** The levels a phone offers (the lobby's): those with a mix and a clip for every item, so a level whose audio isn't
 *  made yet (level 4 till the neural cast, docs/curriculum.md §14) stays hidden and main stays shippable. */
export const playable = (clips: Readonly<Record<string, unknown>>): Level[] =>
  ([1, 2, 3, 4, 5] as const).filter((lv) => MIX[lv] && BANK.some((it) => it.lv === lv) && BANK.every((it) => it.lv !== lv || it.id in clips));
export const LEVELS: readonly Level[] = playable(CLIPS);

/** Never more than this many of one type in a row. */
const MAX_RUN = 2;

const runOk = (types: readonly ItemType[]): boolean =>
  types.every((t, i) => i < MAX_RUN || types.slice(i - MAX_RUN, i).some((u) => u !== t));

/** A num template's items share their id up to the row number (`n1-price-2`): one per game where the pool allows. */
const family = (it: Item): string => (it.type === 'num' ? it.id.replace(/-\d+$/, '') : it.id);

/** `n` of `pool` in a seeded order, preferring one item per family. */
function pick(pool: readonly Item[], n: number, r: () => number): Item[] {
  const order = shuffle([...pool], r);
  const out: Item[] = [], seen = new Set<string>();
  for (const it of order) if (out.length < n && !seen.has(family(it))) (out.push(it), seen.add(family(it)));
  for (const it of order) if (out.length < n && !out.includes(it)) out.push(it);
  return out;
}

/**
 * The deck for a game: the level's mix of types (MIX), items drawn by the seed, ordered so no type comes more than
 * twice in a row, and each item's choices shuffled by the seed. The items are copies: `choices` is the shuffled order
 * and `answer` the right choice's index in it.
 */
export function deck(seed: number, lv: Level): Item[] {
  const mix = MIX[lv];
  if (!mix) return []; // a level this bank hasn't (another phone's newer one): no questions
  const r = mulberry32((seed ^ Math.imul(lv, 0x9e3779b9)) >>> 0);
  const byType = new Map<ItemType, Item[]>();
  for (const [type, n] of Object.entries(mix) as [ItemType, number][])
    if (n) byType.set(type, pick(BANK.filter((it) => it.lv === lv && it.type === type), n, r));
  // the order of the types: reshuffled till no run is too long (most shuffles pass; the mixes always allow one)
  const types = [...byType].flatMap(([t, items]) => items.map(() => t));
  for (let tries = 0; !runOk(shuffle(types, r)); tries++) if (tries > 1000) throw new Error(`kikimimi: no order for level ${lv}`);
  const next = new Map([...byType].map(([t, items]) => [t, items.values()]));
  return types.map((t) => {
    const it = next.get(t)!.next().value!;
    const order = shuffle(it.choices.map((_, i) => i), r);
    return { ...it, choices: order.map((i) => it.choices[i]), answer: order.indexOf(it.answer) };
  });
}
