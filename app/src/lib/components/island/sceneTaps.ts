// Scenery taps (docs/design/scene-interactions.md): what a tap on the island's decorative scenery hit, in stage units,
// and the sound hook for it. Pure (no DOM): SceneTaps.svelte measures the stage and calls hitStage below the horizon;
// the sky (sun, moon, clouds) moves and resizes, so the component hit-tests those against their live boxes instead.
// No points, no state: a scenery tap only plays a ≤ 1 s flourish.
import type { FlowerId } from '#lib/art.ts';
import { BED_ROWS, BED_X, BUSH_U, HEDGE_BASE, HEDGE_X, PLATEAU, SAND } from './scene.ts';

export type SceneHit =
  | { kind: 'bush'; i: number }
  /** row 0 = the beds' back row, 1 = the front row; col 0–3 left to right (FlowerBeds' data-flower="row-col"). */
  | { kind: 'flower'; row: number; col: number }
  | { kind: 'grass' }
  | { kind: 'sand' }
  | { kind: 'sea' };

interface RRect { x0: number; y0: number; x1: number; y1: number; rt: number; rb: number }

/** Inside a rounded rectangle with back (top) corners of radius rt and front corners rb. */
export function inRRect(r: RRect, x: number, y: number): boolean {
  if (x < r.x0 || x > r.x1 || y < r.y0 || y > r.y1) return false;
  const top = y < r.y0 + r.rt;
  const rad = top ? r.rt : y > r.y1 - r.rb ? r.rb : 0;
  if (!rad) return true;
  const cy = top ? r.y0 + rad : r.y1 - rad;
  const cx = Math.min(Math.max(x, r.x0 + rad), r.x1 - rad);
  return (x - cx) ** 2 + (y - cy) ** 2 <= rad * rad;
}

/** Half a tile either side of a bush (neighbours touch) and its figure height, a little proud at the foot. */
const BUSH_HALF = 22;
/** A flower's tap cell: ≈ a tile wide, from its head to just under its stem. */
const FLOWER_HALF = 20;
const FLOWER_UP = 36;
const FOOT = 6;
const FLOWER_COLS = [...BED_X.left, ...BED_X.right];

/** What a tap at stage point (x, y) in u, below the horizon, hit. Buttons (trees, fruit, jar, villagers) are filtered
 *  out before this; anything off the island is sea (the open sea behind it, the sea at its sides and in front). */
export function hitStage(x: number, y: number): SceneHit {
  if (y >= HEDGE_BASE - BUSH_U - FOOT && y <= HEDGE_BASE + FOOT) {
    const i = HEDGE_X.findIndex((hx) => Math.abs(x - hx) <= BUSH_HALF);
    if (i >= 0) return { kind: 'bush', i };
  }
  // the front row is drawn over the back row's stems: test it first
  for (const row of [1, 0]) {
    const by = BED_ROWS[row];
    if (y < by - FLOWER_UP || y > by + FOOT) continue;
    const col = FLOWER_COLS.findIndex((fx) => Math.abs(x - fx) <= FLOWER_HALF);
    if (col >= 0) return { kind: 'flower', row, col };
  }
  if (inRRect(PLATEAU, x, y)) return { kind: 'grass' };
  if (inRRect(SAND, x, y)) return { kind: 'sand' };
  return { kind: 'sea' };
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

/** The sounds a scenery tap asks for (the wanted ids and their mapping: scene-interactions.md §Sound). */
export type SceneSfx =
  | 'bush' | 'flower' | 'cloud' | 'sun' | 'moon' | 'star' | 'shooting-star'
  | 'splash' | 'fish' | 'sand' | 'grass' | 'snow' | 'balloon' | 'butterfly';

/**
 * The one hook between scenery taps and the sound engine. A no-op until src/lib/sound/ lands on main: then this
 * becomes `cue(SCENE_CUES[kind])` (or a play(id) with the gain / pitch in the doc's table). Callers fire it at the
 * moment of the tap, so a delay (if any) belongs in the cue.
 */
export function sceneSfx(kind: SceneSfx): void {
  void kind;
}
