// Scenery taps (docs/design.md "Scene interactions"): what a tap on the island's ground hit, in world units, and the
// sound hook for it. Pure (no DOM): SceneTaps.svelte unprojects the tap (camera.svelte.ts) and calls hitWorld;
// the sky (sun, moon, clouds) moves and resizes, so the component hit-tests those against their live boxes instead.
// No points, no state: a scenery tap only plays a ≤ 1 s flourish.
import type { FlowerId } from '#lib/art.ts';
import { cue } from '#lib/sound/cues.ts';
import type { SceneSfx } from '#lib/sound/ids.ts';
import { POND, SPRING, inOval, surfaceAt } from './world.ts';

export type SceneHit =
  /** A hedge bush or another bush (its node's data-bush id), found from the tapped element. */
  | { kind: 'bush'; id: string }
  /** row 0 = the beds' back row, 1 = the front row; col 0–3 left to right (FlowerBeds' data-flower="row-col"). */
  | { kind: 'flower'; row: number; col: number }
  | { kind: 'grass' }
  | { kind: 'sand' }
  | { kind: 'sea' }
  /** The pond's water (it ripples like the sea). */
  | { kind: 'pond' }
  /** The river's water (it ripples too). */
  | { kind: 'river' };

/** What a tap on the ground at world point (x, z) hit (bushes and flowers are found from the tapped element first;
 *  buttons are filtered out before this): the sea, the pond, the river, sand, or grass (paths count as
 *  grass: a dust puff). */
export function hitWorld(x: number, z: number): SceneHit {
  const k = surfaceAt(x, z);
  if (k === 'sea') return { kind: 'sea' };
  if (k === 'water') return inOval(POND, x, z) || inOval(SPRING, x, z) ? { kind: 'pond' } : { kind: 'river' };
  if (k === 'sand') return { kind: 'sand' };
  return { kind: 'grass' };
}

/** A petal's colour per flower species (the bloom in the official render). */
export const PETAL: Record<FlowerId, string> = {
  'red-tulips': '#F0544F',
  'yellow-tulips': '#FFD54A',
  'red-roses': '#E8394A',
  'white-roses': '#FFFFFF',
  'pink-cosmos': '#FF9BC4',
  'purple-mums': '#A879D9',
  'orange-pansies': '#FF9C3A'
};

/** The one hook between scenery taps and the sound engine: the `scene-<kind>` cue (sound/cues.ts, all world cues,
 *  so they're quiet under a sheet). Callers fire it at the moment of the tap, so a delay (if any) belongs in the cue. */
export function sceneSfx(kind: SceneSfx): void {
  cue(`scene-${kind}`);
}

/** Whether an element is drawn now: a world node outside the camera's window is `visibility: hidden` with its last box
 *  (stale), so it neither guards a spot nor counts as lying there. (The one DOM helper here.) */
export const shownNow = (el: Element): boolean => el.checkVisibility?.({ visibilityProperty: true }) ?? true;
