// Villager roster: the ten villagers we ship official NH art for (static/art/villagers/<id>[-icon].webp).
// Names follow the Japanese game. `colour` / `ears` only drive the lightweight fan-art fallback
// (VillagerFallback.svelte) that shows if an image is missing.
// Selection: prefs `villager` (roster id) → per-person default. Unknown ids fall back to the default.

export type RosterId =
  | 'goldie' | 'raymond' | 'bob' | 'bunnie' | 'judy' | 'stitches' | 'hamlet' | 'molly' | 'lily' | 'dom';

export type Ears = 'point' | 'flop' | 'long' | 'round' | 'none';

export interface Look {
  id: RosterId;
  nameJa: string;
  nameEn: string;
  /** Main fur colour (fallback silhouette). */
  colour: string;
  ears: Ears;
}

const L = (id: RosterId, nameJa: string, nameEn: string, colour: string, ears: Ears): Look => ({ id, nameJa, nameEn, colour, ears });

export const ROSTER: Record<RosterId, Look> = {
  goldie: L('goldie', 'キャラメル', 'Goldie', '#F4C04E', 'flop'),
  raymond: L('raymond', 'ジャック', 'Raymond', '#AEB4BE', 'point'),
  bob: L('bob', 'ニコバン', 'Bob', '#B67CE6', 'point'),
  bunnie: L('bunnie', 'リリアン', 'Bunnie', '#F2662E', 'long'),
  judy: L('judy', 'みすず', 'Judy', '#F6B6DC', 'round'),
  stitches: L('stitches', 'パッチ', 'Stitches', '#F7A33A', 'round'),
  hamlet: L('hamlet', 'ハムスケ', 'Hamlet', '#F6A83C', 'round'),
  molly: L('molly', 'カモミ', 'Molly', '#F2D27E', 'none'),
  lily: L('lily', 'レイニー', 'Lily', '#4FD0BE', 'none'),
  dom: L('dom', 'ちゃちゃまる', 'Dom', '#FFF6DC', 'flop')
};

export const ROSTER_IDS = Object.keys(ROSTER) as RosterId[];

/** Defaults until the users pick: A = Goldie (dog), B = Raymond (cat). */
export const DEFAULT_VILLAGER: Record<'A' | 'B', RosterId> = { A: 'goldie', B: 'raymond' };

export function isRosterId(s: unknown): s is RosterId {
  return typeof s === 'string' && s in ROSTER;
}

/**
 * Resolve who to draw: a roster `villager` id wins (`species` is accepted as an older alias that
 * may carry a roster id); anything else → the per-person default.
 */
export function resolveLook(opts: { villager?: string | null; species?: string | null; person?: 'A' | 'B' }): Look {
  if (isRosterId(opts.villager)) return ROSTER[opts.villager];
  if (isRosterId(opts.species)) return ROSTER[opts.species];
  return ROSTER[DEFAULT_VILLAGER[opts.person ?? 'A']];
}
