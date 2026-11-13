// おやすみ ものがたり on this phone (docs/kikimimi.md "おやすみ ものがたり"): the bedtime serials this build has (the index's
// `stories`: a voiced one, or a draft with the dev hooks on) and each serial's progress kept here (DEVICE.kikiStory, by
// who I am: kikimimi/bedtime.ts SerialProgress), with the sleep timer last set. Loaded with the sheet only.
import { INDEX } from '#lib/kikimimi/pool.ts';
import { SLEEP_TIMERS, type SerialProgress, type SleepTimer, type StoryProgress } from '#lib/kikimimi/bedtime.ts';
import type { RosterId } from '#lib/villagers/roster.ts';
import type { Who } from '#lib/types.ts';
import { DEVICE, localKV, readJson, writeJson } from '#lib/sync/storage.ts';
import { hooksOn } from '../../../world/devHooks.ts';

interface ChapterLine {
  /** Its chunk (`st-johnny-3`: pool.ts loadChapter), number from 1, title, caption, segments and length (s). */
  part: string;
  ch: number;
  title: string;
  line: string;
  segs: number;
  secs: number;
}
interface Serial {
  unit: string;
  name: string;
  host: RosterId;
  chapters: ChapterLine[];
}

/** The serials this phone can play, in the index's order: voiced or listened (past the listening check), a draft only
 *  with the dev hooks. */
export const SERIALS: readonly Serial[] = Object.entries(INDEX.stories)
  .filter(([, s]) => s.status !== 'draft' || hooksOn())
  .map(([unit, s]) => ({
    unit, name: s.name, host: s.host,
    chapters: s.chapters.map(([part, , title, line, segs, cs], k) => ({ part, ch: k + 1, title, line, segs, secs: cs / 100 }))
  }));
/** A story can be played here (catalog.ts Ctx's `story`). */
export const STORY_OK = SERIALS.some((s) => s.chapters.length && s.chapters.every((c) => c.secs > 0));
export const serialOf = (unit: string): Serial | undefined => SERIALS.find((s) => s.unit === unit);

type Kept = { who?: unknown; s?: unknown; timer?: unknown };
/** Bumped as a serial's progress is kept (the hub's morning card and the chapter list read it again). */
let kept = $state(0);

/** Every serial's progress of mine on this phone. Reactive. */
export function storyProgress(me: Who): StoryProgress {
  void kept;
  const v = readJson<Kept>(localKV(), DEVICE.kikiStory);
  if (!v || v.who !== me || !v.s || typeof v.s !== 'object') return {};
  const out: StoryProgress = {};
  for (const [unit, p] of Object.entries(v.s as Record<string, unknown>))
    if (p && typeof p === 'object' && (p as SerialProgress).done && typeof (p as SerialProgress).done === 'object') out[unit] = p as SerialProgress;
  return out;
}

/** A serial's progress kept. */
export function keepSerial(me: Who, unit: string, p: SerialProgress): void {
  const v = readJson<Kept>(localKV(), DEVICE.kikiStory);
  writeJson(localKV(), DEVICE.kikiStory, { ...(v?.who === me && v), who: me, s: { ...storyProgress(me), [unit]: p } });
  kept++;
}

/** The sleep timer last set on this phone (ぜんぶ by default). */
export function lastSleepTimer(): SleepTimer {
  const t = readJson<Kept>(localKV(), DEVICE.kikiStory)?.timer;
  return SLEEP_TIMERS.find((x) => x === t) ?? 0;
}
export function keepSleepTimer(timer: SleepTimer): void {
  const v = readJson<Kept>(localKV(), DEVICE.kikiStory) ?? {};
  writeJson(localKV(), DEVICE.kikiStory, { ...v, timer });
}
