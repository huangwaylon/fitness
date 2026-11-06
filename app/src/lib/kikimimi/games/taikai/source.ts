// しずえの しゅうまつ たいかい over this build's content (pool.ts): the items numbered (pick.ts numbering, over the
// index: no chunk needed), the pool the fillers come from (the levels this phone offers), the levels a deck's ids need
// loaded, and the game's source (def.ts TaikaiSource: the rounds from a seed and ids once their levels are in, the cv).
// The UI's wiring (the decks, the registry) goes through here.
import { itemDur } from '../../clips.ts';
import type { Item, Level } from '../../bank.ts';
import { ENTRIES, INDEX, itemOf } from '../../pool.ts';
import { taikaiItems, taikaiRounds, type TaikaiRound, type TaikaiSource } from './def.ts';
import { numbering, type Numbering } from './pick.ts';

/** This build's items numbered (the `open`'s `ids`; the same on every phone with the game's cv). */
export const TAIKAI_IDS: Numbering = numbering(ENTRIES);

const OFFERED: ReadonlySet<number> = new Set(INDEX.offered);

/** Whether the tournament can deal an item (a `listen` answer's id): one of the levels this phone offers. */
export const taikaiDeals = (id: string): boolean => {
  const n = TAIKAI_IDS.num(id);
  return n !== undefined && OFFERED.has(TAIKAI_IDS.entry(n)!.lv);
};

/** The fillers' pool: every item of the levels this phone offers, numbered. */
export const taikaiPool = (): number[] => ENTRIES.filter((e) => OFFERED.has(e.lv)).map((e) => TAIKAI_IDS.num(e.id)!);

/** The levels a deck's ids need loaded (pool.ts load) before its rounds can be dealt. */
export const taikaiLevels = (ids: readonly number[]): Level[] => [...new Set(ids.map((n) => TAIKAI_IDS.entry(n)?.lv).filter((lv): lv is Level => lv !== undefined))];

/** A deck's items (loaded: an id whose level isn't in yet is left out, so wait for taikaiLevels). */
export const taikaiDeck = (seed: number, ids: readonly number[]): Item[] => taikaiItems(seed, ids, (n) => {
  const e = TAIKAI_IDS.entry(n);
  return e && itemOf(e.id);
});

/** The rounds of the last decks dealt whole, by seed and ids (the session reads them at every call). */
const DEALT = new Map<string, readonly TaikaiRound[]>();

export const taikaiSource: TaikaiSource = {
  rounds: (seed, ids) => {
    const key = `${seed}:${ids.join(',')}`;
    let rs = DEALT.get(key);
    if (!rs) {
      const items = taikaiDeck(seed, ids);
      rs = taikaiRounds(items, (it) => {
        const s = itemDur(it);
        return s === undefined ? undefined : Math.round(s * 1000);
      });
      if (items.length < ids.length) return rs; // (a level not in yet: dealt again once it is)
      DEALT.set(key, rs);
      if (DEALT.size > 4) DEALT.delete(DEALT.keys().next().value!);
    }
    return rs;
  },
  cv: () => INDEX.games['taikai:all']
};
