// みみ チェック's lane (round/registry.ts): its deck the ids dealt so far (GameDef.next), their levels' chunks in first,
// and while it runs the levels round the walk's band (it moves a band at a time). Its round under its way-through bar
// and its result (the placed stage) are its own pages (components/kikimimi/check/views.ts).
import type { Lane } from '../../round/registry.ts';
import type { QuizOpts } from '../quiz/def.ts';
import { taikaiDeck, taikaiLevels } from '../taikai/source.ts';
import { checkGame, walkOf } from './def.ts';
import { checkLevels, checkSource } from './source.ts';

export const checkLane: Lane<QuizOpts> = {
  id: 'check',
  def: () => checkGame(checkSource),
  chunks: ({ ids }) => taikaiLevels(ids ?? []),
  deal: (d) => taikaiDeck(d.seed, d.ids ?? []),
  byIds: true,
  ahead: (v, items) => {
    const over = (i: number) => i < v.i || (i === v.i && v.phase === 'reveal');
    return checkLevels(walkOf(v.answers.flatMap((a, i) => (over(i) ? [!!a && a.k === items[i]?.answer] : []))).band);
  },
  title: { game: 'kiki.check.title' }
};
