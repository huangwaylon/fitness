// 場面のあらすじ (docs/english.md "Scene summaries"): which scene of a clip is on at the playhead. The scenes are our own
// one-line outlines (scenes/<video>.json, in the clip's bank: vite.config.ts english-data), in time order. Pure.
import type { Scene } from './types.ts';

/** The scene on at `t` s: the last one begun by then (in a short gap, the one before it; before the first, the first). */
export function sceneAt(scenes: readonly Scene[], t: number): number {
  let i = 0;
  while (i + 1 < scenes.length && scenes[i + 1].t[0] <= t) i++;
  return i;
}
