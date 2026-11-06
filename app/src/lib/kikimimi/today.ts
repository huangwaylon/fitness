// ききみみ's daily menu (docs/kikimimi-ux.md §6.1, §7.1): しずえ's three cards for the Tokyo day — 1 おさらい (the
// due cards, ≤ 8; the 30-day recheck takes its place when one's due; none due: 「おさらいは ぜんぶ おわり！」), 2 きょうの
// いっぽ (the current unit's next lesson; before units, ひとこと クイズ at my place), 3 きまぐれ (one playable mode seeded
// in turn by the day, never yesterday's; at night, 21:00-04:00, おやすみ ものがたり). Any one finished session (≥ 4 answers,
// or a story heard ≥ 3 min) means 「きょうは OK」: each of today's sessions ticks the first undone card it matches, else the
// first undone card, so free play is never "off menu". Same inputs, same menu, on every phone of mine. Pure.
import type { LocalDate } from '../types.ts';
import type { Lesson } from './stages.ts';
import type { ModeId } from './catalog.ts';
import { dayNum } from './progress.ts';

export type Act =
  | { k: 'review'; n: number }
  | { k: 'recheck'; unit: string }
  | { k: 'lesson'; unit: string; lesson: Lesson }
  | { k: 'quiz'; lv: number }
  | { k: 'mode'; m: Exclude<ModeId, 'quiz' | 'review'> }
  | { k: 'story' };
type Slot = 'review' | 'step' | 'whim';

export interface Card {
  slot: Slot;
  /** What it plays (null: おさらい with nothing due, folded as done). */
  act: Act | null;
  done: boolean;
}

/** A finished session of today's, as the menu matches it: practice (おさらい), a unit's lesson, a ladder, its level; or
 *  a bedtime story. */
export interface Session {
  p: boolean;
  u?: string;
  ladder: boolean;
  lv: number;
  story?: boolean;
}

export interface MenuIn {
  day: LocalDate;
  /** Due SRS cards and the first unit whose 30-day recheck is due. */
  due: number;
  recheck: string | null;
  /** The current unit's next lesson on the path (null: no units). */
  next: { unit: string; lesson: Lesson } | null;
  /** My comfortable quiz level. */
  lv: number;
  /** The playable modes きまぐれ picks from. */
  whims: readonly ModeId[];
  /** It's night (21:00-04:00) and a bedtime story can be played: きまぐれ is おやすみ ものがたり. */
  night?: boolean;
  /** Today's finished sessions, in order. */
  sessions: readonly Session[];
}

export interface Menu {
  cards: Card[];
  /** A session finished today: 「きょうは OK」. */
  ok: boolean;
  /** Every card done: 「きょうは ここまでで じゅうぶんです！」. */
  all: boolean;
}

/** おさらい's cap (the srs fold's REVIEW_CAP): 「しずえが 6もん えらびました」, never "14 overdue". */
const CAP = 8;

/** A finished session: ≥ 4 answers. */
export const finished = (answers: number): boolean => answers >= 4;
/** A bedtime story heard long enough to count as a session (docs/kikimimi-ux.md §7.1): ≥ 3 min. */
export const finishedStory = (ms: number): boolean => ms >= 180_000;
/** The night (Tokyo hours): きまぐれ becomes おやすみ ものがたり from 21:00 until 04:00. */
export const isNight = (hour: number): boolean => hour >= 21 || hour < 4;

/** きまぐれ's mode for a day: one of `whims` in turn, a new one each day (the quiz left out when card 2 is already a
 *  quiz and there's another), so never yesterday's. */
export function whimOf(day: number, whims: readonly ModeId[], step: 'quiz' | 'lesson'): ModeId | null {
  const pool = whims.filter((m) => m !== 'review' && !(step === 'quiz' && m === 'quiz' && whims.length > 1));
  return pool.length ? pool[day % pool.length] : null;
}

const matches = (a: Act | null, s: Session): boolean => {
  if (!a) return false;
  if (a.k === 'story' || s.story) return a.k === 'story' && !!s.story;
  switch (a.k) {
    case 'review': return s.p;
    case 'recheck':
    case 'lesson': return s.u === a.unit;
    case 'quiz': return !s.p && s.u === undefined && !s.ladder && s.lv !== 5;
    case 'mode': return a.m === 'ladder' ? s.ladder : !s.p && s.lv === 5 && !s.ladder;
  }
};

/** The day's menu. */
export function pickMenu(o: MenuIn): Menu {
  const review: Act | null = o.recheck ? { k: 'recheck', unit: o.recheck } : o.due > 0 ? { k: 'review', n: Math.min(CAP, o.due) } : null;
  const step: Act = o.next ? { k: 'lesson', ...o.next } : { k: 'quiz', lv: o.lv };
  const w = whimOf(dayNum(o.day), o.whims, step.k === 'lesson' ? 'lesson' : 'quiz');
  const whim: Act | null = o.night ? { k: 'story' } : w === 'ladder' || w === 'announce' ? { k: 'mode', m: w } : w === 'quiz' ? { k: 'quiz', lv: o.lv } : null;
  const cards: Card[] = [
    { slot: 'review', act: review, done: !review },
    { slot: 'step', act: step, done: false },
    ...(whim ? [{ slot: 'whim' as const, act: whim, done: false }] : [])
  ];
  for (const s of o.sessions) {
    const open = cards.filter((c) => !c.done && c.act);
    const c = open.find((x) => matches(x.act, s)) ?? open[0];
    if (c) c.done = true;
  }
  return { cards, ok: o.sessions.length > 0, all: cards.every((c) => c.done) && o.sessions.length > 0 };
}
