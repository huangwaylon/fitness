// A lesson's place on this phone (docs/english.md "The page": leaving keeps the place): per player, per clip, the
// question shown, each question's state and the study time counted but not yet in a row, and the day its まとめ last
// wrote a row. Dropped when the clip's content changed (its version), the oldest let go past KEEP.
import { DEVICE, localKV, readJson, writeJson } from '#lib/sync/storage.ts';
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
  /** The day a まとめ of this clip last wrote its row (null: never). */
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
 *  length, not the bank's: a finished play's next opening draws the next). */
export const partWay = (s: Saved | null): boolean => !!s && Array.isArray(s.ids) && s.at >= 0 && s.at < s.ids.length;

/** Keep my place in a clip. */
export function save(who: Who, id: string, s: Saved): void {
  const clips = { ...all(who), [id]: s };
  const ids = Object.keys(clips).sort((a, b) => clips[b].t - clips[a].t).slice(0, KEEP);
  writeJson(localKV(), DEVICE.englishLesson, { who, clips: Object.fromEntries(ids.map((k) => [k, clips[k]])) });
}

/** Whether おかえりなさい was shown for a gap that ended after `last` (then not again). */
export const backShown = (who: Who, last: LocalDate): boolean => readJson<Record<string, string>>(localKV(), DEVICE.englishBack)?.[who] === last;
export const markBack = (who: Who, last: LocalDate): void => void writeJson(localKV(), DEVICE.englishBack, { ...readJson<Record<string, string>>(localKV(), DEVICE.englishBack), [who]: last });
