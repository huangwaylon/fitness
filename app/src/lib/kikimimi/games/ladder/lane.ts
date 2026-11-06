// スピード はしご's lane (round/registry.ts): two ladders from the ladders' chunk (ladder.ts ladderDeck), the host's seed
// the one whose ladders overlap my last games least.
import { ladderDeck } from '../../ladder.ts';
import { ladders } from '../../pool.ts';
import { freshSeed } from '../../recent.ts';
import type { Lane } from '../../round/registry.ts';
import type { QuizOpts } from '../quiz/def.ts';
import { quizSource } from '../quiz/lane.ts';
import { ladderGame } from './def.ts';

const chunks: Lane['chunks'] = () => ['ladder'];

export const ladderLane: Lane<QuizOpts> = {
  id: 'ladder',
  def: (phone) => ladderGame(quizSource(phone, chunks)),
  chunks,
  deal: (d) => ladderDeck(d.seed, ladders()),
  seed: ({ flags, random }, recent) => freshSeed({ random, flags, recent, ids: (s) => ladderDeck(s, ladders()).map((it) => it.id) })
};
