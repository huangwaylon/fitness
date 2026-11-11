// A listening game's lane (round/registry.ts; each game's lane.ts, its own chunk): a deck from the `listened` files of
// its game at the lobby's place (their parts: pool.ts listenOf), every phone dealing the same with no ear (one deck for
// every tier); my ear (my comfortable level's place) on my options as host and on my join, so each player plays at
// their own tier; my row's answers graded by my rounds. A game with more (しずえの ニュース's weather in its options and
// its day's seed, すうじ ラッシュ's しょうぶ and passes) says so in `more`. Its round and results are its own pages
// (components/kikimimi/<gm>/views.ts), its strings with them.
import type { ListenRow } from '../../contract/listen.ts';
import type { Item } from '../bank.ts';
import { itemMs } from '../clips.ts';
import type { ListenPart } from '../listen.ts';
import { INDEX, listenOf, type Unit } from '../pool.ts';
import type { Lane, Phone } from '../round/registry.ts';
import type { AnswerValue, GameDef, Round } from '../round/types.ts';
import { tierOf } from './taikai/def.ts';
import { cvOver, filesOf, listenGame, listenOpts, listenRecord, rawOf, type ListenOpts, type ListenRules, type ListenSource } from './listened.ts';

/** What a listening game's lane may do its own way (each: none, the listening games' way). */
interface ListenMore<C extends Item, R extends Round, O extends ListenOpts> {
  /** Its options on the wire (listenOpts). */
  codec?: { encode(o: O): number[]; decode(a: readonly number[]): O | null };
  /** Its GameDef over its source (listenGame). */
  game?(src: ListenSource<C>): GameDef<O>;
  /** Its options' own, beyond a listening game's, as a lobby opens (the host's; `focus`: the sheet's pick for this
   *  game at this level, まるごと 聞く's piece). */
  lobby?(p: { lv: number; focus: number | null }): Omit<O, keyof ListenOpts>;
  /** The host's seed (Lane.seed; none: a random one). */
  seed?: Lane['seed'];
  /** My answers as its row's from my rounds (listenRecord). */
  record?(rounds: readonly R[], answers: readonly (AnswerValue | null)[], had: readonly boolean[], rp: readonly number[], done: boolean): ListenRow['r'];
}

/** A listening game's lane from its rules and its deal (pure: the same cards on every phone for a seed and options). */
export function listenLane<C extends Item, R extends Round, O extends ListenOpts = ListenOpts>(
  g: ListenRules<C, R>, deal: (seed: number, parts: readonly ListenPart[], o: O | null) => C[], more: ListenMore<C, R, O> = {}
): Lane<O> {
  const codec = more.codec ?? (listenOpts as unknown as NonNullable<ListenMore<C, R, O>['codec']>);
  const chunks = ({ o }: { o: readonly number[] }): Unit[] => filesOf(g.id, codec.decode(o)?.lv ?? 0, INDEX.listen) as Unit[];
  const source = (phone: Phone): ListenSource<C> => ({
    cards: (seed, o) => phone.items({ gm: g.id, seed, o: codec.encode({ ...(o as O), ear: 0 }) }) as C[],
    playMs: itemMs,
    cv: (o) => cvOver(chunks({ o: codec.encode(o as O) }).map((u) => phone.cv(g.id, u)))
  });
  const record = more.record ?? ((rounds, answers, had, rp, done) => listenRecord(g, rounds, answers, had, rp, done));
  return {
    id: g.id,
    def: (phone) => (more.game ? more.game(source(phone)) : (listenGame(g, source(phone)) as unknown as GameDef<O>)),
    chunks,
    deal: (d) => deal(d.seed, chunks(d).flatMap((u) => listenOf(String(u)) ?? []), codec.decode(d.o)),
    ...(more.seed && { seed: more.seed }),
    myTier: (_u, my) => tierOf(my.level),
    opts: ({ lv, timer, level, focus }) => codec.encode({ ...more.lobby?.({ lv, focus: focus ?? null }), lv: lv as ListenOpts['lv'], timer, ear: tierOf(level ?? null) } as O),
    record: (v, items, rp, done) => {
      const o = codec.decode(v.o);
      return o ? record(g.rounds(items as C[], v.seed, o, itemMs), v.answers.map(rawOf), v.had, rp, done) : [];
    },
    title: { lobby: `kiki.mode.${g.id}` }
  };
}
