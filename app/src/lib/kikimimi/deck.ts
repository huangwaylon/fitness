// ききみみ クイズ: a game's 8 questions from {seed, lv} (docs/kikimimi-engine.md "Content"). Deterministic: every phone builds
// the same deck from the `open` intent's seed and level, so no text goes on the wire. It draws from the level's items as
// loaded (pool.ts levelItems: the level's chunk must be in first, game.svelte.ts waits for it).
import { mulberry32, shuffle } from '#lib/random.ts';
import { shuffleChoices, type Item, type ItemType, type Level } from './bank.ts';
import { mixFor, type Mixes } from './mix.ts';
import { INDEX, levelItems } from './pool.ts';
import { staleness } from './recent.ts';

export const DECK_SIZE = 8;

/** The mixes this build plays (mix.ts: level 4's dialogues once all are voiced, as compiled: levels/index.json). */
export const MIX: Mixes = mixFor(INDEX.dialogues);

/** The levels a phone offers (the lobby's): those with a mix and every clip of the items it draws, so a level whose
 *  audio isn't made yet (level 4 till the neural cast, docs/curriculum.md "Modes") stays hidden and main stays shippable
 *  (compile.ts playable, in the index). */
export const LEVELS: readonly Level[] = INDEX.offered;
/** Whether this phone offers スピード はしご (the lobby's mode choice): once every rung of every ladder has its clip. */
export const LADDER_OK: boolean = INDEX.ladder;

/** Never more than this many of one type in a row. */
const MAX_RUN = 2;

const runOk = (types: readonly ItemType[]): boolean =>
  types.every((t, i) => i < MAX_RUN || types.slice(i - MAX_RUN, i).some((u) => u !== t));

/** A num template's items share their id up to the row number (`n1-price-2`): one per game where the pool allows. */
const family = (it: Item): string => (it.type === 'num' ? it.id.replace(/-\d+$/, '') : it.id);

/** `n` of `pool` in a seeded order, preferring one item per family (`heard`: items not heard lately first, then the
 *  least recently heard: recent.ts). */
function pick(pool: readonly Item[], n: number, r: () => number, heard?: ReadonlyMap<string, number>): Item[] {
  const shuffled = shuffle([...pool], r);
  const order = heard ? shuffled.sort((a, b) => staleness(a.id, heard) - staleness(b.id, heard)) : shuffled;
  const out: Item[] = [], seen = new Set<string>();
  for (const it of order) if (out.length < n && !seen.has(family(it))) (out.push(it), seen.add(family(it)));
  for (const it of order) if (out.length < n && !out.includes(it)) out.push(it);
  return out;
}

/**
 * The deck for a game: the level's mix of types (MIX), items drawn by the seed, ordered so no type comes more than
 * twice in a row, and each item's choices shuffled by the seed (`all`: the mixes, a test's own). The items are copies:
 * `choices` is the shuffled order and `answer` the right choice's index in it. `seen` (a solo game's own deck, this
 * phone's: recent.ts agesOf) draws the items not heard lately first, then the least recently heard; a shared deck never
 * has it (every phone builds the same deck from the seed).
 */
export function deck(seed: number, lv: Level, all: Mixes = MIX, seen?: ReadonlyMap<string, number>): Item[] {
  const mix = all[lv];
  if (!mix) return []; // a level this bank hasn't (another phone's newer one): no questions
  const r = mulberry32((seed ^ Math.imul(lv, 0x9e3779b9)) >>> 0);
  const byType = new Map<ItemType, Item[]>();
  for (const [type, n] of Object.entries(mix) as [ItemType, number][])
    if (n) byType.set(type, pick(levelItems(lv).filter((it) => it.type === type), n, r, seen));
  // the order of the types: reshuffled till no run is too long (most shuffles pass; the mixes always allow one)
  const types = [...byType].flatMap(([t, items]) => items.map(() => t));
  for (let tries = 0; !runOk(shuffle(types, r)); tries++) if (tries > 1000) throw new Error(`kikimimi: no order for level ${lv}`);
  const next = new Map([...byType].map(([t, items]) => [t, items.values()]));
  return types.map((t) => shuffleChoices(next.get(t)!.next().value!, r));
}
