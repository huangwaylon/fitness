// はつおん ききわけ's lane (round/registry.ts, its own chunk): 8 pairs from its chunk (pool.ts, parts/mic-pairs.json),
// solo or あてっこ (co-op: both phones deal the same deck, its content version the chunk's); my row is my minutes only (no
// answers: `record` gives none). Its round and results are its own pages (components/kikimimi/pair/views.ts), its
// strings with them.
import { itemMs } from '../../clips.ts';
import { partItems, type Unit } from '../../pool.ts';
import type { Lane, Phone } from '../../round/registry.ts';
import { quizOpts, type QuizOpts } from '../quiz/def.ts';
import { pairDeal, pairGame } from './def.ts';
import { PAIR_UNIT, type PairCard } from './pairs.ts';

const UNIT = PAIR_UNIT as Unit;
const source = (phone: Phone) => ({
  cards: (seed: number, o: QuizOpts) => phone.items({ gm: 'pair', seed, o: quizOpts.encode(o) }) as PairCard[],
  playMs: itemMs,
  cv: () => phone.cv('pair', UNIT)
});

export const lane: Lane<QuizOpts> = {
  id: 'pair',
  def: (phone) => pairGame(source(phone)),
  chunks: () => [UNIT],
  deal: (d) => pairDeal(d.seed, partItems(UNIT) as PairCard[]),
  record: () => [],
  title: { lobby: 'kiki.mode.pair' }
};
