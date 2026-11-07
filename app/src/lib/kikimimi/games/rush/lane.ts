// すうじ ラッシュ's lane (round/registry.ts, its own chunk; games/listenLane.ts): 8 customers from the `listened` rush
// files at the lobby's place, each player's ticket at their own ear, しょうぶ paid by expectation; my row's picks as the
// chips authored, the other register's passes left out. Its pages: components/kikimimi/rush/views.ts.
import type { Lane } from '../../round/registry.ts';
import { listenOpts, rawOf, type ListenOpts } from '../listened.ts';
import { listenLane } from '../listenLane.ts';
import { RUSH, rushDeal, rushGame, rushRecord, rushRounds, type RushCard } from './def.ts';

const base = listenLane(RUSH, rushDeal);

export const lane: Lane<ListenOpts> = {
  ...base,
  def: (phone) => rushGame(base.def(phone)),
  record: (v, items, rp, done) => {
    const o = listenOpts.decode(v.o);
    return o ? rushRecord(rushRounds(items as RushCard[], o, () => 0), v.answers.map(rawOf), v.had, rp, done) : [];
  }
};
