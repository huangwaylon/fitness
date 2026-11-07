// ようじ でんわ's lane (round/registry.ts, its own chunk): a deck of 3 calls (2 rounds each) from the `listened` call files
// at the lobby's place (their parts: pool.ts listenOf), every phone dealing the same; my ear on my options as host and on
// my join, so each player's memo is at their own tier; my row's answers graded by my rows (the wrong ones as `pick`).
// Its round and results are its own pages (components/kikimimi/call/views.ts), its strings with them.
import { itemDur } from '../../clips.ts';
import type { Item } from '../../bank.ts';
import { INDEX, listenOf, type Unit } from '../../pool.ts';
import type { Lane, Phone } from '../../round/registry.ts';
import { tierOf } from '../taikai/def.ts';
import { cvOver } from '../tile/def.ts';
import { callDeal, callFiles, callGame, callOpts, callRecord, callRounds, type CallCard, type CallOpts } from './def.ts';

const levelOf = (o: readonly number[]): number => callOpts.decode(o)?.lv ?? 0;
const chunks = ({ o }: { o: readonly number[] }): Unit[] => callFiles(levelOf(o), INDEX.listen) as Unit[];
/** A call's length as played (its lines and the gaps between them), ms. */
const playMs = (it: Item): number | undefined => {
  const s = itemDur(it);
  return s === undefined ? undefined : Math.round(s * 1000);
};
/** The deck's options with no ear (the deal doesn't read it: one deck for every tier). */
const dealt = (o: CallOpts): number[] => callOpts.encode({ ...o, ear: 0 });

const source = (phone: Phone) => ({
  cards: (seed: number, o: CallOpts) => phone.items({ gm: 'call', seed, o: dealt(o) }) as CallCard[],
  playMs,
  cv: (o: CallOpts) => cvOver(chunks({ o: callOpts.encode(o) }).map((u) => phone.cv('call', u)))
});

export const lane: Lane<CallOpts> = {
  id: 'call',
  def: (phone) => callGame(source(phone)),
  chunks,
  deal: (d) => callDeal(d.seed, chunks(d).flatMap((u) => listenOf(String(u)) ?? [])),
  myTier: (_u, my) => tierOf(my.level),
  opts: ({ lv, timer, level }) => callOpts.encode({ lv: lv as CallOpts['lv'], timer, ear: tierOf(level ?? null) }),
  record: (v, items, rp, done) => {
    const o = callOpts.decode(v.o);
    if (!o) return [];
    return callRecord(callRounds(items as CallCard[], o, playMs), v.answers.map((a) => a?.a ?? null), v.had, rp, done);
  },
  title: { lobby: 'kiki.mode.call' }
};
