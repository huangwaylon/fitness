// A unit's lesson's lane (round/registry.ts): its 6 questions from the unit's chunk at the options' lesson and tier,
// and on recipe 2 from the listening files its lesson's kind draws from too (recipe.ts recipeDeck): those files'
// chunks, when `listened`, load with the unit's before the deck is dealt (the index's units[<id>].kinds), so every phone
// deals the same deck from the build's content; a player who joins, their tier for the unit's stage. Its rounds each
// their kind's, and my row's answers each round's (a card's by its game: recipe.ts cardAnswer); the row stays a lesson's
// (no `gm`: recorder.ts).
import type { Item } from '../../bank.ts';
import { lessonOf, type Lesson } from '../../lesson.ts';
import { INDEX, listenOf, unitKinds, unitPart, type Unit } from '../../pool.ts';
import { listenAnswers } from '../../progress.ts';
import type { Lane, Phone } from '../../round/registry.ts';
import type { Round } from '../../round/types.ts';
import { rawOf } from '../listened.ts';
import { lessonGame, lessonOpts, tierIndex, type LessonOpts, type LessonSource } from './def.ts';
import { cardAnswer, cardKind, lessonRounds, recipeDeck, type KindSource } from './recipe.ts';

/** The build's listening files: their index lines, their parts once loaded. */
const KINDS: KindSource = { entry: (f) => INDEX.listen[f], part: listenOf };

/** The listening files a unit's lesson plays from on recipe 2: those of its kind, `listened` (none: recipe 1). */
const kindFilesOf = (u: string, lesson: Lesson): string[] => (unitKinds(u)[lesson] ?? []).filter((f) => INDEX.listen[f]?.[2] === 'listened');

/** A lesson's chunks: its unit's, then its kind's listened files' (what its deck is dealt from). */
export const lessonChunks = (u: string, lesson: Lesson | undefined): Unit[] => [u as Unit, ...(lesson ? (kindFilesOf(u, lesson) as Unit[]) : [])];

const chunks: Lane['chunks'] = ({ o, u }) => (u ? lessonChunks(u, lessonOf(o[2] ?? 0)) : []);

/** A deck's rounds, kept per its items and tier (the session reads them at every call). */
const ROUNDS = new WeakMap<readonly Item[], Map<string, readonly Round[]>>();
function roundsOf(items: readonly Item[], seed: number, enc: readonly number[]): readonly Round[] {
  const o = lessonOpts.decode(enc), k = `${seed}:${enc.join('.')}`;
  let by = ROUNDS.get(items);
  if (!by) ROUNDS.set(items, (by = new Map()));
  let rs = by.get(k);
  if (!rs) by.set(k, (rs = lessonRounds(items, seed, o?.tier, o?.timer ?? 30)));
  return rs;
}

const source = (phone: Phone): LessonSource => ({
  rounds: (seed, enc, u) => roundsOf(phone.items({ gm: 'lesson', seed, o: enc, u }), seed, enc),
  cv: (_enc, u) => (u ? phone.cv('lesson', u as Unit) : undefined)
});

export const lessonLane: Lane<LessonOpts> = {
  id: 'lesson',
  def: (phone) => lessonGame(source(phone)),
  chunks,
  deal: (d) => {
    const o = lessonOpts.decode(d.o), part = d.u ? unitPart(d.u) : undefined;
    return o && part ? recipeDeck(part, o.lesson, d.seed, o.tier, kindFilesOf(d.u!, o.lesson), KINDS) : [];
  },
  // a co-op lesson's choices at my tier for its unit's stage
  myTier: (u, my) => {
    const part = u ? unitPart(u) : undefined;
    return part ? tierIndex(my.tierOf(part.unit.stage)) : undefined;
  },
  // my answers: a quiz item's its authored choice (progress.ts listenAnswers), a card's its game's
  record: (v, items, rp, done) => {
    if (!items.some((it) => cardKind(it))) return listenAnswers(items, v.answers, v.had, rp, done);
    const rounds = roundsOf(items, v.seed, v.o);
    return items.flatMap((it, i) => {
      const a = v.answers[i];
      if (!v.had[i] || (!a && !done)) return [];
      return cardKind(it) ? [cardAnswer(rounds[i], rawOf(a), rp[i] ?? 0)] : listenAnswers([it], [a], [true], [rp[i] ?? 0], done);
    }).slice(0, 12);
  }
};
