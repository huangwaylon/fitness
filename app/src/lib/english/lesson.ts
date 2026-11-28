// A clip's lesson as the learner goes through it (docs/english.md "The page"), pure: a pick right first (◎) or on
// the second listen (○); a first miss replays the segment with the cue, a second shows the answer (「答えはこれ」);
// a dictation counts the words heard. Never a mark on a wrong pick. Also what a `listen` row says of the answers.
import type { Question } from './types.ts';

export type Result =
  | { k: 'first' }
  | { k: 'second' }
  | { k: 'shown' }
  /** A dictation: the target's words, each heard or not. */
  | { k: 'dict'; words: { w: string; hit: boolean }[] };

/** A question's state: its result (null: not settled), the misses so far, the last choice picked (−1 none), a
 *  dictation's last typing. */
export interface QState {
  r: Result | null;
  miss: number;
  pick: number;
  typed: string;
}

export const blank = (): QState => ({ r: null, miss: 0, pick: -1, typed: '' });

/** A choice picked: settled ◎ / ○ when right, ○… after a miss; a first miss replays (the caller plays the segment and
 *  shows the cue); a second shows the answer. */
export function pick(q: Question, st: QState, i: number): { st: QState; replay: boolean } {
  if (st.r) return { st, replay: false };
  if (i === q.a) return { st: { ...st, pick: i, r: { k: st.miss ? 'second' : 'first' } }, replay: false };
  const miss = st.miss + 1;
  return miss >= 2 ? { st: { ...st, pick: i, miss, r: { k: 'shown' } }, replay: false } : { st: { ...st, pick: i, miss }, replay: true };
}

/** 答えを見る after a miss. */
export const reveal = (st: QState): QState => (st.r ? st : { ...st, r: { k: 'shown' } });

/** Words as compared: lower case, curly apostrophes straight, anything but letters and ' a space. */
const words = (s: string): string[] => s.toLowerCase().replace(/[’']/g, "'").replace(/[^a-z' ]/g, ' ').split(/\s+/).filter(Boolean);

/** A dictation answered (again: the latest counts). */
export function dictate(q: Question, st: QState, typed: string): QState {
  const got = new Set(words(typed));
  return { ...st, typed, r: { k: 'dict', words: words(q.answer ?? '').map((w) => ({ w, hit: got.has(w) })) } };
}

/** A dictation's count heard, and of how many. */
export const heard = (r: Extract<Result, { k: 'dict' }>): { hit: number; of: number } => ({ hit: r.words.filter((w) => w.hit).length, of: r.words.length });

/** Heard in full on the first try (◎, or every word of a dictation): not a scene to hear again. */
const clean = (r: Result | null): boolean => r?.k === 'first' || (r?.k === 'dict' && r.words.every((w) => w.hit));

/** The scenes to hear again at まとめ: every question answered and not heard in full the first time, the ones its row
 *  records (progress.ts missesOf: これまでの記録 counts the same). */
export const againOf = (qs: readonly Question[], st: readonly QState[]): number[] => qs.flatMap((_, i) => {
  const r = st[i]?.r ?? null;
  return r && !clean(r) ? [i] : [];
});

/** まとめ's unanswered questions (their own line, never scenes to hear again: nothing was heard to miss). */
export const unansweredOf = (qs: readonly Question[], st: readonly QState[]): number => qs.filter((_, i) => !st[i]?.r).length;

/** ふりかえり from まとめ: the scenes to hear again (`of`, the play's indexes), stepped with picks of their own. Never the
 *  play's states: nothing it does is recorded, まとめ's list stays as it was. */
export interface Review {
  of: number[];
  /** The step shown. */
  at: number;
  st: QState[];
}

export const review = (of: readonly number[]): Review => ({ of: [...of], at: 0, st: of.map(blank) });

/** A step on (−1 back, +1 on); null past either end: back at まとめ. */
export const stepped = (rv: Review, by: -1 | 1): Review | null => {
  const at = rv.at + by;
  return at < 0 || at >= rv.of.length ? null : { ...rv, at };
};

/** The step shown's state replaced. */
export const settled = (rv: Review, st: QState): Review => ({ ...rv, st: rv.st.map((x, i) => (i === rv.at ? st : x)) });

/** The settled answers as a `listen` row's `r` (contract/listen.ts): [the question's id, right first, the authored
 *  choice (a dictation's words heard; −1 shown with none), the listens before it]. */
export function answersOf(qs: readonly Question[], st: readonly QState[]): [string, 0 | 1, number, number][] {
  return qs.flatMap((q, i): [string, 0 | 1, number, number][] => {
    const s = st[i], r = s?.r;
    if (!r) return [];
    const id = q.id;
    if (r.k === 'dict') {
      const h = heard(r);
      return [[id, h.hit === h.of ? 1 : 0, h.hit, 0]];
    }
    return [[id, r.k === 'first' ? 1 : 0, s.pick, Math.min(s.miss, 99)]];
  });
}
