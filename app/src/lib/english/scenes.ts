// 場面のあらすじ (docs/english.md "Scene summaries"): which scene (or beat, or transcript line) of a clip is on at the
// playhead. The scenes are our own one-line outlines, the beats shorter categorized steps inside them
// (scenes/<video>.json), the lines the transcript's (transcripts/<video>.en.json), each in the clip's bank
// (vite.config.ts english-data) in time order. Pure.
import type { Beat, BeatKind, Scene } from './types.ts';

/** The beats' categories, in the list's filter order. */
export const BEAT_KINDS: readonly BeatKind[] = ['ask', 'decline', 'suggest', 'explain', 'feeling', 'joke', 'irony', 'argue', 'action'];

/** Of a time-ordered list (scenes, beats, transcript lines), the one on at `t` s: the last one begun by then (in a
 *  gap, the one before it; before the first, the first). */
export function atTime(list: readonly { t: readonly [number, number] }[], t: number): number {
  let i = 0;
  while (i + 1 < list.length && list[i + 1].t[0] <= t) i++;
  return i;
}

/** Each scene's beats, by index (a beat belongs to the scene it starts in; the files keep it inside that one). */
export const beatsByScene = (scenes: readonly Scene[], beats: readonly Beat[]): number[][] => {
  const by: number[][] = scenes.map(() => []);
  beats.forEach((b, i) => by[atTime(scenes, b.t[0])].push(i));
  return by;
};
