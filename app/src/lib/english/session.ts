// A lesson's place on this phone (docs/english.md "The page": leaving keeps the place): per player, per clip, the
// question shown, each question's state and the study time counted but not yet in a row, and the day this play's
// まとめ wrote its row. Dropped when the clip's content changed (its version), the oldest let go past KEEP.
import { DEVICE, localKV, readJson, writeJson } from '#lib/sync/storage.ts';
import { perPlayer } from './per-player.ts';
import type { LocalDate, Who } from '#lib/types.ts';
import type { QState } from './lesson.ts';

/** Where a lesson is: −1 the watch card, a question's index, or the questions' count (まとめ). */
export interface Saved {
  v: string;
  /** This play's questions (draw.ts), by id. */
  ids: string[];
  at: number;
  st: QState[];
  unsent: number;
  perQ: Record<number, number>;
  /** The day this play's まとめ wrote its row (null: not yet): a finished play isn't resumed. */
  sent: LocalDate | null;
  /** When it was saved (ms): the oldest go first. */
  t: number;
}

const KEEP = 8;
type Store = { who: Who; clips: Record<string, Saved> };

function all(who: Who): Record<string, Saved> {
  const s = readJson<Store>(localKV(), DEVICE.englishLesson);
  return s && s.who === who && s.clips && typeof s.clips === 'object' ? s.clips : {};
}

/** My saved place in a clip at version `v`, or null. */
export function loadSaved(who: Who, id: string, v: string): Saved | null {
  const s = all(who)[id];
  return s && s.v === v && Array.isArray(s.st) && typeof s.at === 'number' ? s : null;
}

/** Whether a saved place is a play left part-way: on a question, not the watch card nor the play's まとめ (its own
 *  length, not the bank's), and its まとめ not reached (one gone back from after it is finished: its next opening draws
 *  the next). */
export const partWay = (s: Saved | null): boolean => !!s && Array.isArray(s.ids) && !s.sent && s.at >= 0 && s.at < s.ids.length;

/** My plays left part-way on this phone, the most recent first (each clip's version as saved). */
export const partWays = (who: Who): { id: string; v: string; at: number; n: number }[] =>
  Object.entries(all(who)).filter(([, x]) => partWay(x)).sort((a, b) => b[1].t - a[1].t).map(([id, x]) => ({ id, v: x.v, at: x.at, n: x.ids.length }));

/** Keep my place in a clip. */
export function save(who: Who, id: string, s: Saved): void {
  const clips = { ...all(who), [id]: s };
  const ids = Object.keys(clips).sort((a, b) => clips[b].t - clips[a].t).slice(0, KEEP);
  writeJson(localKV(), DEVICE.englishLesson, { who, clips: Object.fromEntries(ids.map((k) => [k, clips[k]])) });
}

/** Whether おかえりなさい was shown for a gap that ended after `last` (then not again). */
const back = perPlayer<LocalDate>(DEVICE.englishBack);
export const backShown = (who: Who, last: LocalDate): boolean => back.get(who) === last;
export const markBack = (who: Who, last: LocalDate): void => back.set(who, last);
