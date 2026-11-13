// おやすみ ものがたり's rules (docs/kikimimi.md "おやすみ ものがたり", docs/curriculum.md "Modes"): no score and no questions, a chapter's
// segments played in turn with natural gaps, the sleep timer (10 / 20 / 30 minutes of listening, or ぜんぶ: to the
// chapter's end) and its fade over the last 20 s, each serial's chapters unlocked one by one as they're finished
// (reached the end, or the timer ran out in the last third), where to pick up (つづき), and the morning-after
// prediction (「きのうの つづき、どうなると おもう？」 the day after a chapter, revealed when the next one is finished).
// Pure: the phone keeps the progress (kikimimi/progress.ts).
import type { LocalDate } from '../types.ts';

/** The sleep timer: minutes of listening, or 0 (ぜんぶ: to the end of the chapter). */
export type SleepTimer = 10 | 20 | 30 | 0;
export const SLEEP_TIMERS: readonly SleepTimer[] = [10, 20, 30, 0];
/** The voice fades over the timer's last 20 s; then the sheet closes over 2 s. */
export const FADE_MS = 20_000;
export const CLOSE_MS = 2_000;
/** The pause before a timed story goes on into the next chapter (its title shows meanwhile). */
export const NEXT_CHAPTER_MS = 4_000;

/** The gap after a segment (s): a breath when the same voice goes on, a little longer when another takes the turn. */
const GAP_SAME = 0.6;
const GAP_TURN = 0.9;
export const gapAfter = (who: string, next: string | undefined): number => (next === undefined ? 0 : next === who ? GAP_SAME : GAP_TURN);

/** A chapter's timeline (s): each segment's start, with its gap after it, and the whole length. */
export function timeline(segs: readonly { who: string; dur: number }[]): { starts: number[]; total: number } {
  const starts: number[] = [];
  let t = 0;
  segs.forEach((s, k) => {
    starts.push(t);
    t += s.dur + gapAfter(s.who, segs[k + 1]?.who);
  });
  return { starts, total: t };
}

/** The timer's run out during the chapter's last third: it counts as finished (the listener heard the turn of it). */
export const finishesOnTimer = (pos: number, total: number): boolean => total > 0 && pos >= (total * 2) / 3;

/** What's left of a timer (ms) after `spentMs` of listening since it was set (a pause stops it); null: ぜんぶ. */
export const timerLeft = (timer: SleepTimer, spentMs: number): number | null => (timer ? Math.max(0, timer * 60_000 - spentMs) : null);

/** The voice's level with `leftMs` of the timer left: full until the last FADE_MS, then an equal-power curve to 0. */
export function fadeGain(leftMs: number): number {
  if (leftMs >= FADE_MS) return 1;
  if (leftMs <= 0) return 0;
  return Math.sin(((leftMs / FADE_MS) * Math.PI) / 2);
}

/** The fade from now (`leftMs` left, within the last FADE_MS) to silence, as the engine's points: `{t: s from now,
 *  gain}`, `steps` linear pieces of the curve (engine.ts fadeVoice). */
export function fadeCurve(leftMs: number, steps = 8): { t: number; gain: number }[] {
  const left = Math.max(0, Math.min(FADE_MS, leftMs));
  if (!left) return [{ t: 0, gain: 0 }];
  return Array.from({ length: steps + 1 }, (_, k) => {
    const t = (left * k) / steps;
    return { t: Math.round(t) / 1000, gain: Math.round(fadeGain(left - t) * 1000) / 1000 };
  });
}

// ---- each serial's progress ------------------------------------------------------------------------------------------

/** One serial's progress on this phone: each chapter finished (by number) and the day it first was, where to pick up,
 *  when it was last played, and the morning-after guess (about the chapter after `ch`) with its answer. */
export interface SerialProgress {
  done: Record<number, LocalDate>;
  at?: { ch: number; seg: number };
  last?: number;
  guess?: { ch: number; pick: number; right: boolean };
  /** The morning card set aside for today (あとで): the chapter and the day. */
  later?: { ch: number; d: LocalDate };
}
export type StoryProgress = Record<string, SerialProgress>;

const blank = (): SerialProgress => ({ done: {} });

/** A chapter can be played: the first always, the next once the one before is finished (or it's been finished). */
export const unlocked = (p: SerialProgress | undefined, ch: number): boolean => ch <= 1 || !!p?.done[ch - 1] || !!p?.done[ch];

/** Where a serial picks up: the chapter left part-way (つづき), else the first not finished yet, else (all finished)
 *  the first again; and the segment to start from. */
export function nextOf(p: SerialProgress | undefined, chapters: number): { ch: number; seg: number } {
  if (p?.at && p.at.ch <= chapters && !p.done[p.at.ch]) return p.at;
  for (let ch = 1; ch <= chapters; ch++) if (!p?.done[ch]) return { ch, seg: 0 };
  return { ch: 1, seg: 0 };
}

/** A chapter finished on `day` (its place let go). */
export function finish(p: SerialProgress | undefined, ch: number, day: LocalDate, now: number): SerialProgress {
  const q = p ?? blank();
  const { at, ...rest } = q;
  return { ...rest, done: { ...q.done, [ch]: q.done[ch] ?? day }, ...(at && at.ch !== ch && { at }), last: now };
}

/** Where I stopped in a chapter (つづき next time). */
export const keepPlace = (p: SerialProgress | undefined, ch: number, seg: number, now: number): SerialProgress => ({ ...(p ?? blank()), at: { ch, seg }, last: now });

/** The serial a night's story opens on: the one last played that still has a chapter to finish, else the first with
 *  one, else the first. */
export function pickSerial(progress: StoryProgress, serials: readonly { unit: string; chapters: number }[]): string | null {
  const open = serials.filter((s) => Object.keys(progress[s.unit]?.done ?? {}).length < s.chapters);
  const played = open.filter((s) => progress[s.unit]?.last).sort((a, b) => progress[b.unit].last! - progress[a.unit].last!);
  return (played[0] ?? open[0] ?? serials[0])?.unit ?? null;
}

// ---- the morning-after prediction ------------------------------------------------------------------------------------

/** The morning card: the chapter finished on an earlier day whose next chapter hasn't been begun or finished, not yet
 *  guessed nor set aside today; the most recently finished of them. The caller drops it when the chapter has no
 *  prediction (the serial's last). */
export function morningCard(progress: StoryProgress, serials: readonly { unit: string; chapters: number }[], today: LocalDate): { unit: string; ch: number } | null {
  let best: { unit: string; ch: number; d: LocalDate } | null = null;
  for (const s of serials) {
    const p = progress[s.unit];
    if (!p) continue;
    for (const [k, d] of Object.entries(p.done)) {
      const ch = Number(k);
      if (d >= today || ch >= s.chapters || p.done[ch + 1] || p.at?.ch === ch + 1) continue;
      if (p.guess?.ch === ch || (p.later?.ch === ch && p.later.d === today)) continue;
      if (!best || d > best.d || (d === best.d && ch > best.ch)) best = { unit: s.unit, ch, d };
    }
  }
  return best && { unit: best.unit, ch: best.ch };
}

/** The guess made (choice `pick` of the chapter `ch`'s prediction, `answer` its right one). */
export const guess = (p: SerialProgress | undefined, ch: number, pick: number, answer: number): SerialProgress => ({ ...(p ?? blank()), guess: { ch, pick, right: pick === answer } });

/** The morning card set aside for today. */
export const later = (p: SerialProgress | undefined, ch: number, day: LocalDate): SerialProgress => ({ ...(p ?? blank()), later: { ch, d: day } });

/** The reveal when chapter `ch` is finished: the guess made about it (the one before's prediction), or null. */
export const revealOf = (p: SerialProgress | undefined, ch: number): { pick: number; right: boolean } | null =>
  p?.guess && p.guess.ch === ch - 1 ? { pick: p.guess.pick, right: p.guess.right } : null;
