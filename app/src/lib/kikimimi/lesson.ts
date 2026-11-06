// ききみみ's lessons (docs/curriculum-units.md §3, §10; U2-U3): a lesson is one game of 6 questions (about 2½ min) drawn
// from its unit's chunk (compile.ts unitChunk, loaded by pool.ts like a level). Deterministic by seed, as a level's deck
// is (deck.ts), so a co-op lesson (later, framework 8c) builds the same deck on every phone; each player's answer
// choices may be their own tier's (same audio). Pure.
import { mulberry32, shuffle } from '#lib/random.ts';
import { isDialogue, levelAt, type Item, type Level } from './bank.ts';
import type { Ladder } from './ladder.ts';
import { LESSONS, LESSON_QS, STAGES, type Lesson, type Stage } from './stages.ts';

export type { Lesson };
export type Tier = 'easy' | 'hard';

/** A unit as its chunk holds it (compile.ts unitChunk): what the lessons, the stamps and the phrase ずかん read. */
export interface UnitPlay {
  id: string;
  name: string;
  stage: Stage;
  domain: string;
  also?: string[];
  host: string;
  scene: string;
  sound: string;
  status: string;
  cando: { ja: string; en: string };
  lessons: { v: number } & Partial<Record<Lesson, string[]>>;
  /** The lesson items whose home is this unit. */
  home: string[];
  tiers?: Record<string, Partial<Record<Tier, { choices: string[]; answer: number }>>>;
  /** Its key phrases, each with the items it's heard in (the bank's and the units'). */
  ph: { id: string; en: string; ja?: string; register: string; scene: string; trap: string; in: string[] }[];
}

/** A unit's chunk, loaded (pool.ts unitPart). */
export interface UnitChunk {
  unit: UnitPlay;
  items: readonly Item[];
  ladders?: readonly Ladder[];
}

/** A lesson's `l` on the `listen` row (contract/listen.ts: 1 であい … 3 チェック … 5 じっせん), and back. */
export const lessonL = (lesson: Lesson): number => LESSONS.indexOf(lesson) + 1;
export const lessonOf = (l: number): Lesson | undefined => LESSONS[l - 1];

/** The row's level for a unit's lesson: its stage's (levelRank's inverse: かわ 3, もり 4, やま 6, ほし 7). */
export const stageLevel = (stage: Stage): Level => levelAt(STAGES[stage].rank);

/** A player's tier for a unit (plan §4): below its stage by more than half a step, the easier choices; a step or more
 *  above, the harder; else (or still measuring: null) the authored ones. `level` is きろく's comfortable level
 *  (progress.ts statsOf, on levelRank's scale). */
export function tierFor(level: number | null, stage: Stage): Tier | undefined {
  if (level === null) return undefined;
  const rank = STAGES[stage].rank;
  return level < rank - 0.5 ? 'easy' : level >= rank + 1 ? 'hard' : undefined;
}

/** A lesson's item ids, as playable: the チェック held out of であい and ばめん (the compiler checks it; kept here too,
 *  so a stamp is never earned on items already heard in the unit), じっせん's ladders left out (はしご plays those). */
export function playIds(c: UnitChunk, lesson: Lesson): string[] {
  const ids = c.unit.lessons[lesson] ?? [];
  if (lesson !== 'check') return ids;
  const heard = new Set([...(c.unit.lessons.deai ?? []), ...(c.unit.lessons.bamen ?? [])]);
  return ids.filter((id) => !heard.has(id));
}

/**
 * A lesson's deck: LESSON_QS of its items drawn by `seed`, in a seeded order (であい opens on its model dialogue: the
 * gist first), each item's choices shuffled by the seed, as deck() does (`choices` the shuffled order, `answer` the
 * right one's index in it). `tier`: an item with that tier's choice set plays it instead (the same audio). Copies;
 * deterministic for the same chunk, lesson, seed and tier. Fewer items than 6 (an optional lesson of ladders): those.
 */
export function lessonDeck(c: UnitChunk, lesson: Lesson, seed: number, tier?: Tier): Item[] {
  const byId = new Map(c.items.map((it) => [it.id, it]));
  const pool = playIds(c, lesson).map((id) => byId.get(id)).filter((it): it is Item => !!it);
  const r = mulberry32((seed ^ Math.imul(lessonL(lesson), 0x85ebca6b)) >>> 0);
  let picked = shuffle([...pool], r).slice(0, LESSON_QS);
  if (lesson === 'deai') {
    const model = picked.find((it) => isDialogue(it)) ?? pool.find((it) => isDialogue(it));
    if (model) picked = [model, ...picked.filter((it) => it !== model)].slice(0, LESSON_QS);
  }
  return picked.map((it) => {
    const set = tier ? c.unit.tiers?.[it.id]?.[tier] : undefined;
    const choices = set?.choices ?? it.choices, answer = set?.answer ?? it.answer;
    const order = shuffle(choices.map((_, i) => i), r);
    return { ...it, choices: order.map((i) => choices[i]), answer: order.indexOf(answer) };
  });
}
