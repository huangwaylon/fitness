// Scenery taps (docs/design.md "Scene interactions"): what a tap on the island's ground hit, in world units, and the
// sound hook for it. Pure (no DOM): SceneTaps.svelte unprojects the tap (camera.svelte.ts) and calls hitWorld;
// the sky (sun, moon, clouds) moves and resizes, so the component hit-tests those against their live boxes instead.
// No points, no state: a scenery tap only plays a ≤ 1 s flourish.
import type { FlowerColour, FlowerId } from '#lib/art.ts';
import { cue } from '#lib/sound/cues.ts';
import type { SceneSfx } from '#lib/sound/ids.ts';
import { SPRING, inOval, pondAt, surfaceAt } from '#lib/world/world.ts';

export type SceneHit =
  /** A hedge bush or another bush (its node's data-bush id), found from the tapped element. */
  | { kind: 'bush'; id: string }
  /** A wild flower (Flowers' data-flower: its world.ts FLOWERS id). */
  | { kind: 'flower'; id: string }
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
  if (k === 'water') return pondAt(x, z) || inOval(SPRING, x, z) ? { kind: 'pond' } : { kind: 'river' };
  if (k === 'sand') return { kind: 'sand' };
  return { kind: 'grass' };
}

/** A petal's colour by the flower's colour (the bloom in the official renders). */
const PETAL: Record<FlowerColour, string> = {
  red: '#F0544F', white: '#FFFFFF', yellow: '#FFD54A', pink: '#FF9BC4', orange: '#FF9C3A', purple: '#A879D9',
  blue: '#6F9BF0', black: '#5A2A3A', green: '#9BD86A'
};
export const petalOf = (id: FlowerId): string => PETAL[id.slice(0, id.indexOf('-')) as FlowerColour] ?? PETAL.pink;

/** The one hook between scenery taps and the sound engine: the `scene-<kind>` cue (sound/cues.ts, all world cues,
 *  so they're quiet under a sheet). Callers fire it at the moment of the tap, so a delay (if any) belongs in the cue.
 *  `at`: where another player's doing happens (its gain by the camera); mine never pass it. */
export function sceneSfx(kind: SceneSfx, at?: readonly [number, number]): void {
  cue(`scene-${kind}`, at ? { at } : undefined);
}

/** Whether an element is drawn now: a world node outside the camera's window is `visibility: hidden` with its last box
 *  (stale), so it neither guards a spot nor counts as lying there. (The one DOM helper here.) */
export const shownNow = (el: Element): boolean => el.checkVisibility?.({ visibilityProperty: true }) ?? true;
