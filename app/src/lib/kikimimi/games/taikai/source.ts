// しずえの しゅうまつ たいかい over this build's content (pool.ts): the items numbered (pick.ts numbering, over the
// index: no chunk needed), the pool the fillers come from (the levels this phone offers), the levels a deck's ids need
// loaded, and the game's source (def.ts TaikaiSource: the rounds from a seed and ids once their levels are in, the cv).
// The UI's wiring (the decks, the registry) goes through here.
import { itemDur } from '../../clips.ts';
import type { Item, Level } from '../../bank.ts';
import { ENTRIES, INDEX, itemOf } from '../../pool.ts';
import type { Who } from '../../../types.ts';
import type { RoundEvent } from '../../round/types.ts';
import { taikaiItems, taikaiRounds, taikaiTarget, tierLevel, trophyOf, type TaikaiRound, type TaikaiSource, type Trophy } from './def.ts';
import { numbering, offerOf, offersOf, taikaiPick, weekMisses, type Numbering } from './pick.ts';
import { taikaiAt } from './window.ts';

/** This build's items numbered (the `open`'s `ids`; the same on every phone with the game's cv). */
export const TAIKAI_IDS: Numbering = numbering(ENTRIES);

const OFFERED: ReadonlySet<number> = new Set(INDEX.offered);

/** Whether the tournament can deal an item (a `listen` answer's id): one of the levels this phone offers. */
export const taikaiDeals = (id: string): boolean => {
  const n = TAIKAI_IDS.num(id);
  return n !== undefined && OFFERED.has(TAIKAI_IDS.entry(n)!.lv);
};

/** The fillers' pool: every item of the levels this phone offers, numbered. */
let pool: number[] | null = null;
export const taikaiPool = (): number[] => (pool ??= ENTRIES.filter((e) => OFFERED.has(e.lv)).map((e) => TAIKAI_IDS.num(e.id)!));

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

/** My offer for the tournament under way at `now` (or the next): my misses of its week (pick.ts weekMisses over my
 *  answers), numbered, the first OFFER_MAX. */
export const taikaiOffer = (answers: Parameters<typeof weekMisses>[0], now: number): number[] =>
  offerOf(weekMisses(answers, taikaiAt(now).fri, taikaiDeals), TAIKAI_IDS);

/** The host's pick (pick.ts taikaiPick) from its own offer and its lobby's view: the offers heard, everyone's tiers (the
 *  fillers' levels); the items of its recent games (recent.ts, by string id) last among the fillers. */
export function taikaiPickFor(o: {
  seed: number; me: Who; mine: readonly number[]; evs: readonly RoundEvent[]; tiers: Partial<Record<Who, number>>; recent?: readonly (readonly string[])[];
}): number[] {
  const avoid = new Set((o.recent ?? []).flat().flatMap((id) => TAIKAI_IDS.num(id) ?? []));
  const levels = Object.values(o.tiers).map((t) => tierLevel(t!));
  return taikaiPick({ seed: o.seed, offers: { ...offersOf(o.evs), [o.me]: o.mine }, levels, pool: taikaiPool(), avoid, ids: TAIKAI_IDS });
}

/** A tournament's outcome on any phone alike: しずえ's target from its rounds and everyone's tiers (the session view's),
 *  and the trophy for the team's rounds right. */
export function taikaiOutcome(seed: number, ids: readonly number[], tiers: Partial<Record<Who, number>>, right: number): { target: ReturnType<typeof taikaiTarget>; trophy: Trophy } {
  const target = taikaiTarget(taikaiSource.rounds(seed, ids), Object.values(tiers) as number[]);
  return { target, trophy: trophyOf(right, target) };
}
