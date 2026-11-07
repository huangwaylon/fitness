// たちぎき's lane (round/registry.ts, its own chunk): a deck of two conversations from the `listened` tachi files at the
// lobby's place (their parts: pool.ts listenOf), every phone dealing the same; my ear (my comfortable level's place) on
// my options as host and on my join, so each player is at their own tier; my row's answers graded by my rounds. Its
// round and results are its own pages (components/kikimimi/tachi/views.ts), its strings with them.
import { INDEX, listenOf, type Unit } from '../../pool.ts';
import type { Lane, Phone } from '../../round/registry.ts';
import { tierOf } from '../taikai/def.ts';
import { cvOver } from '../tile/def.ts';
import { convMs, rawOf, tachiDeal, tachiFiles, tachiGame, tachiOpts, tachiRecord, tachiRounds, type TachiCard, type TachiOpts } from './def.ts';

const levelOf = (o: readonly number[]): number => tachiOpts.decode(o)?.lv ?? 0;
const chunks = ({ o }: { o: readonly number[] }): Unit[] => tachiFiles(levelOf(o), INDEX.listen) as Unit[];
/** The deck's options with no ear (the deal doesn't read it: one deck for every tier). */
const dealt = (o: TachiOpts): number[] => tachiOpts.encode({ ...o, ear: 0 });

const source = (phone: Phone) => ({
  cards: (seed: number, o: TachiOpts) => phone.items({ gm: 'tachi', seed, o: dealt(o) }) as TachiCard[],
  playMs: convMs,
  cv: (o: TachiOpts) => cvOver(chunks({ o: tachiOpts.encode(o) }).map((u) => phone.cv('tachi', u)))
});

export const lane: Lane<TachiOpts> = {
  id: 'tachi',
  def: (phone) => tachiGame(source(phone)),
  chunks,
  deal: (d) => tachiDeal(d.seed, chunks(d).flatMap((u) => listenOf(String(u)) ?? [])),
  myTier: (_u, my) => tierOf(my.level),
  opts: ({ lv, timer, level }) => tachiOpts.encode({ lv: lv as TachiOpts['lv'], timer, ear: tierOf(level ?? null) }),
  record: (v, items, rp, done) => {
    const o = tachiOpts.decode(v.o);
    if (!o) return [];
    return tachiRecord(tachiRounds(items as TachiCard[], o, convMs), v.answers.map(rawOf), v.had, rp, done);
  },
  title: { lobby: 'kiki.mode.tachi' }
};
