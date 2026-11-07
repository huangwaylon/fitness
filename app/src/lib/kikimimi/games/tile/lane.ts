// ことば タイル's lane (round/registry.ts, its own chunk): a deck of 6 sentences from the `listened`
// tile files at the lobby's place (their parts: pool.ts listenOf), every phone dealing the same; my ear (my comfortable
// level's place) on my options as host and on my join, so each player's board is at their own tier; my row's answers
// graded by my board (the wrong slots as `pick`). Its round and results are its own pages
// (components/kikimimi/tile/views.ts), its strings with them.
import { clipDur } from '../../clips.ts';
import { INDEX, listenOf, type Unit } from '../../pool.ts';
import type { Lane, Phone } from '../../round/registry.ts';
import { tierOf } from '../taikai/def.ts';
import { cvOver, tileDeal, tileFiles, tileGame, tileOpts, tileRecord, tileRounds, type TileCard, type TileOpts } from './def.ts';

const levelOf = (o: readonly number[]): number => tileOpts.decode(o)?.lv ?? 0;
const chunks = ({ o }: { o: readonly number[] }): Unit[] => tileFiles(levelOf(o), INDEX.listen) as Unit[];
const playMs = (id: string): number | undefined => {
  const s = clipDur(id);
  return s === undefined ? undefined : Math.round(s * 1000);
};
/** The deck's options with no ear (the deal doesn't read it: one deck for every tier). */
const dealt = (o: TileOpts): number[] => tileOpts.encode({ ...o, ear: 0 });

const source = (phone: Phone) => ({
  cards: (seed: number, o: TileOpts) => phone.items({ gm: 'tile', seed, o: dealt(o) }) as TileCard[],
  playMs,
  cv: (o: TileOpts) => cvOver(chunks({ o: tileOpts.encode(o) }).map((u) => phone.cv('tile', u)))
});

export const lane: Lane<TileOpts> = {
  id: 'tile',
  def: (phone) => tileGame(source(phone)),
  chunks,
  deal: (d) => tileDeal(d.seed, chunks(d).flatMap((u) => listenOf(String(u)) ?? [])),
  myTier: (_u, my) => tierOf(my.level),
  opts: ({ lv, timer, level }) => tileOpts.encode({ lv: lv as TileOpts['lv'], timer, ear: tierOf(level ?? null) }),
  record: (v, items, rp, done) => {
    const o = tileOpts.decode(v.o);
    if (!o) return [];
    return tileRecord(tileRounds(items as TileCard[], v.seed, o, playMs), v.answers.map((a) => a?.a ?? null), v.had, rp, done);
  },
  title: { lobby: 'kiki.mode.tile' }
};
