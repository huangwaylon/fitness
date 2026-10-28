// Villager roster: the ten villagers we ship official NH art for (static/art/villagers/<id>[-icon].webp).
// Names follow the Japanese game. `colour` only tints the generic silhouette (Silhouette.svelte)
// that shows if an image is missing.
// Selection: prefs `villager` (roster id) → per-person default. Unknown ids fall back to the default.

export type RosterId =
  | 'goldie' | 'raymond' | 'bob' | 'bunnie' | 'judy' | 'stitches' | 'hamlet' | 'molly' | 'lily' | 'dom';

export interface Look {
  id: RosterId;
  nameJa: string;
  nameEn: string;
  /** Main fur colour (fallback silhouette). */
  colour: string;
}

const L = (id: RosterId, nameJa: string, nameEn: string, colour: string): Look => ({ id, nameJa, nameEn, colour });

export const ROSTER: Record<RosterId, Look> = {
  goldie: L('goldie', 'キャラメル', 'Goldie', '#F4C04E'),
  raymond: L('raymond', 'ジャック', 'Raymond', '#AEB4BE'),
  bob: L('bob', 'ニコバン', 'Bob', '#B67CE6'),
  bunnie: L('bunnie', 'リリアン', 'Bunnie', '#F2662E'),
  judy: L('judy', 'みすず', 'Judy', '#F6B6DC'),
  stitches: L('stitches', 'パッチ', 'Stitches', '#F7A33A'),
  hamlet: L('hamlet', 'ハムスケ', 'Hamlet', '#F6A83C'),
  molly: L('molly', 'カモミ', 'Molly', '#F2D27E'),
  lily: L('lily', 'レイニー', 'Lily', '#4FD0BE'),
  dom: L('dom', 'ちゃちゃまる', 'Dom', '#FFF6DC')
};

export const ROSTER_IDS = Object.keys(ROSTER) as RosterId[];

/** Defaults until the users pick: A = Goldie (dog), B = Raymond (cat). */
const DEFAULT_VILLAGER: Record<'A' | 'B', RosterId> = { A: 'goldie', B: 'raymond' };

export function isRosterId(s: unknown): s is RosterId {
  return typeof s === 'string' && s in ROSTER;
}

/** Resolve who to draw: a roster `villager` id wins; anything else → the per-person default. */
export function resolveLook(opts: { villager?: string | null; person?: 'A' | 'B' }): Look {
  if (isRosterId(opts.villager)) return ROSTER[opts.villager];
  return ROSTER[DEFAULT_VILLAGER[opts.person ?? 'A']];
}
