// まねっこ シャドーイング's lane (round/registry.ts, its own chunk): 4 lines to shadow from my level's chunk (my
// placed stage's level: the mode page's おまかせ), solo only; my row is my minutes only (no answers: `record` gives none,
// the row's `r` stays empty). Its round and results are its own pages (components/kikimimi/mane/views.ts), its strings
// with them.
import type { Item } from '../../bank.ts';
import { clipDur, itemMs } from '../../clips.ts';
import { levelItems, type Unit } from '../../pool.ts';
import type { Lane, Phone } from '../../round/registry.ts';
import { quizOpts, type QuizOpts } from '../quiz/def.ts';
import { maneDeal, maneGame, maneLevel } from './def.ts';

const levelOf = (o: readonly number[]) => maneLevel(quizOpts.decode(o)?.lv ?? 1);
const chunks = ({ o }: { o: readonly number[] }): Unit[] => [levelOf(o)];
const source = (phone: Phone) => ({
  items: (seed: number, o: QuizOpts): readonly Item[] => phone.items({ gm: 'mane', seed, o: quizOpts.encode(o) }),
  playMs: (id: string) => itemMs({ id })
});

export const lane: Lane<QuizOpts> = {
  id: 'mane',
  def: (phone) => maneGame(source(phone)),
  chunks,
  deal: (d) => maneDeal(d.seed, levelItems(levelOf(d.o)), (id) => clipDur(id) !== undefined),
  record: () => []
};
