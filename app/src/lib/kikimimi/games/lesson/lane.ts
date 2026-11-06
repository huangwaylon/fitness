// A unit's lesson's lane (round/registry.ts): its 6 questions from the unit's chunk (lesson.ts lessonDeck, at the
// options' lesson and tier); a player who joins, their tier for the unit's stage.
import { lessonDeck } from '../../lesson.ts';
import { unitPart, type Unit } from '../../pool.ts';
import type { Lane } from '../../round/registry.ts';
import { quizSource } from '../quiz/lane.ts';
import { lessonGame, lessonOpts, tierIndex, type LessonOpts } from './def.ts';

const chunks: Lane['chunks'] = ({ u }) => (u ? [u as Unit] : []);

export const lessonLane: Lane<LessonOpts> = {
  id: 'lesson',
  def: (phone) => lessonGame(quizSource(phone, chunks)),
  chunks,
  deal: (d) => {
    const o = lessonOpts.decode(d.o), part = d.u ? unitPart(d.u) : undefined;
    return o && part ? lessonDeck(part, o.lesson, d.seed, o.tier) : [];
  },
  // a co-op lesson's choices at my tier for its unit's stage
  myTier: (u, my) => {
    const part = u ? unitPart(u) : undefined;
    return part ? tierIndex(my.tierOf(part.unit.stage)) : undefined;
  }
};
