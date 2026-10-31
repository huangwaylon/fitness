// Group stretching (docs/design.md "Group stretching"), after NH's ラジオ体操: the tape deck turns up on the island on a
// day either of us met 🍑 Exercise, or when the island is opened in the morning (06:00–08:00); a tap plays a short
// original tune and everyone on the island (both villagers, and the visitor if one is out and awake) does three of NH's
// stretches in sync (Posture Warm-Up, Side Bends, Jump: ~6 s), once a day per phone, then the deck goes for the day.
// No ベル. This phone's record of the day is in localStorage (sync/storage.ts SCENE.stretch): losing it only brings the
// deck back.
import { localKV, readJson, SCENE, writeJson } from '#lib/sync/storage.ts';
import type { Motion } from '../motion/reactions.ts';

/** The three stretches, in order (NH's names: Posture Warm-Up, Side Bends, Jump), each POSE_MS long. */
export const POSES: readonly Motion[] = ['warmup', 'sidebend', 'leap'];
export const POSE_MS = 2000;
export const STRETCH_MS = POSES.length * POSE_MS;
/** The tape deck's morning (NH's ラジオ体操 is a morning thing): opening the island in these hours brings it out. */
export const MORNING = { from: 6, to: 8 } as const;

export const isMorning = (hour: number): boolean => hour >= MORNING.from && hour < MORNING.to;

interface Day { date: string; morning: boolean; done: boolean }

const read = (date: string): Day => {
  const d = readJson<Day>(localKV(), SCENE.stretch);
  return d && d.date === date ? { date, morning: !!d.morning, done: !!d.done } : { date, morning: false, done: false };
};

/** Note that the island was open at `hour` on `date` (a morning opening brings the deck out for the day). */
export function sawIsland(date: string, hour: number): void {
  const d = read(date);
  if (isMorning(hour) && !d.morning) writeJson(localKV(), SCENE.stretch, { ...d, morning: true });
}

/** Today's stretch has played on this phone. */
export function stretched(date: string): void {
  writeJson(localKV(), SCENE.stretch, { ...read(date), done: true });
}

/** Whether the tape deck is out at `hour`: not yet played today, and either of us met Exercise today or the island was
 *  opened in the morning (now, or earlier today). */
export function deckOut(date: string, hour: number, exerciseMet: boolean): boolean {
  const d = read(date);
  return !d.done && (exerciseMet || d.morning || isMorning(hour));
}
