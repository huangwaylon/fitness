// ききみみ クイズ: a game's 8 questions from {seed, lv} (docs/kikimimi.md "Content"). Pure and deterministic: every
// phone builds the same deck from the `open` intent's seed and level, so no text goes on the wire.
import { mulberry32, shuffle } from '#lib/random.ts';
import { BANK, type Item, type ItemType, type Level } from './bank.ts';

export const DECK_SIZE = 8;

/** How many of each type a level's game has (8 in all). */
export const MIX: Readonly<Record<Level, Readonly<Record<ItemType, number>>>> = {
  1: { pic: 3, word: 3, num: 2, reply: 0 },
  2: { pic: 2, word: 2, num: 2, reply: 2 },
  3: { pic: 1, word: 2, num: 2, reply: 3 }
};

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
  const r = mulberry32((seed ^ Math.imul(lv, 0x9e3779b9)) >>> 0);
  const byType = new Map<ItemType, Item[]>();
  for (const [type, n] of Object.entries(MIX[lv]) as [ItemType, number][])
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
