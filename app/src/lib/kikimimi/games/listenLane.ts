// A listening game's lane (round/registry.ts; each game's lane.ts, its own chunk): a deck from the `listened` files of
// its game at the lobby's place (their parts: pool.ts listenOf), every phone dealing the same with no ear (one deck for
// every tier); my ear (my comfortable level's place) on my options as host and on my join, so each player plays at
// their own tier; my row's answers graded by my rounds. Its round and results are its own pages
// (components/kikimimi/<gm>/views.ts), its strings with them.
import type { Item } from '../bank.ts';
import { itemDur } from '../clips.ts';
import type { ListenPart } from '../listen.ts';
import { INDEX, listenOf, type Unit } from '../pool.ts';
import type { Lane, Phone } from '../round/registry.ts';
import type { Round } from '../round/types.ts';
import { tierOf } from './taikai/def.ts';
import { cvOver, filesOf, listenGame, listenOpts, listenRecord, rawOf, type ListenOpts, type ListenRules, type ListenSource } from './listened.ts';

/** An item's length as played (its lines and the gaps between them), ms; undefined while a clip is missing. */
const itemMs = (it: Pick<Item, 'id' | 'lines'>): number | undefined => {
  const s = itemDur(it);
  return s === undefined ? undefined : Math.round(s * 1000);
};

/** A listening game's lane from its rules and its deal (pure: the same cards on every phone for a seed). */
export function listenLane<C extends Item, R extends Round>(g: ListenRules<C, R>, deal: (seed: number, parts: readonly ListenPart[]) => C[]): Lane<ListenOpts> {
  const chunks = ({ o }: { o: readonly number[] }): Unit[] => filesOf(g.id, listenOpts.decode(o)?.lv ?? 0, INDEX.listen) as Unit[];
  const source = (phone: Phone): ListenSource<C> => ({
    cards: (seed, o) => phone.items({ gm: g.id, seed, o: listenOpts.encode({ ...o, ear: 0 }) }) as C[],
    playMs: itemMs,
    cv: (o) => cvOver(chunks({ o: listenOpts.encode(o) }).map((u) => phone.cv(g.id, u)))
  });
  return {
    id: g.id,
    def: (phone) => listenGame(g, source(phone)),
    chunks,
    deal: (d) => deal(d.seed, chunks(d).flatMap((u) => listenOf(String(u)) ?? [])),
    myTier: (_u, my) => tierOf(my.level),
    opts: ({ lv, timer, level }) => listenOpts.encode({ lv: lv as ListenOpts['lv'], timer, ear: tierOf(level ?? null) }),
    record: (v, items, rp, done) => {
      const o = listenOpts.decode(v.o);
      return o ? listenRecord(g, g.rounds(items as C[], v.seed, o, itemMs), v.answers.map(rawOf), v.had, rp, done) : [];
    },
    title: { lobby: `kiki.mode.${g.id}` }
  };
}
