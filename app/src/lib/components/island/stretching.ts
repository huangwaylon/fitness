// Group stretching (docs/design.md "Group stretching"), after NH's ラジオ体操: the tape deck turns up on the island on a
// day either of us met 🍑 Exercise, or when the island is opened in the morning (06:00–08:00); a tap plays a short
// original tune and everyone on the island (both villagers, and the visitor if one is out and awake) does three of NH's
// stretches in sync (Posture Warm-Up, Side Bends, Jump: ~6 s), once a day per phone, then the deck goes for the day.
// No ベル. This phone's record of the day is in localStorage (sync/storage.ts SCENE.stretch): losing it only brings the
// deck back.
import { SCENE } from '#lib/sync/storage.ts';
import { dayRecord } from './dayRecord.ts';
import type { Motion } from '../motion/reactions.ts';

/** The three stretches, in order (NH's names: Posture Warm-Up, Side Bends, Jump), each POSE_MS long. */
export const POSES: readonly Motion[] = ['warmup', 'sidebend', 'leap'];
export const POSE_MS = 2000;
export const STRETCH_MS = POSES.length * POSE_MS;
/** The tape deck's morning (NH's ラジオ体操 is a morning thing): opening the island in these hours brings it out. */
export const MORNING = { from: 6, to: 8 } as const;

export const isMorning = (hour: number): boolean => hour >= MORNING.from && hour < MORNING.to;

const day = dayRecord(SCENE.stretch, { morning: false, done: false });

/** Note that the island was open at `hour` on `date` (a morning opening brings the deck out for the day). */
export function sawIsland(date: string, hour: number): void {
  if (isMorning(hour) && !day.read(date).morning) day.patch(date, { morning: true });
}

/** Today's stretch has played on this phone. */
export const stretched = (date: string): void => day.patch(date, { done: true });
/** Whether today's stretch has played on this phone. */
export const stretchedToday = (date: string): boolean => day.read(date).done;

/** Whether the tape deck is out at `hour`: not yet played today, and either of us met Exercise today or the island was
 *  opened in the morning (now, or earlier today). */
export function deckOut(date: string, hour: number, exerciseMet: boolean): boolean {
  const d = day.read(date);
  return !d.done && (exerciseMet || d.morning || isMorning(hour));
}
