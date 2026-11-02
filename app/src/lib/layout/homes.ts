// The homes (docs/island-layout.md "Homes"), pure: three, fixed ids `home-A` (ウェイ's), `home-B` (うめ's), `home-G`
// (the guest's). Where one stands is an object of the layout; how it looks is its style, its owner's (a `decor` op of
// scope `h`): a model `m` and, for NH's modular house, its wall `w`, roof `r` and door `d` (each a part with its
// colour). A style's footprint (tiles) and its door (the middle of its front edge) follow the model, so the home's
// interior and its way in stay valid whatever its owner picks.

export type Who = 'A' | 'B' | 'G';
export const HOME_IDS: Record<Who, string> = { A: 'home-A', B: 'home-B', G: 'home-G' };
export const WHO_OF_HOME: Record<string, Who> = { 'home-A': 'A', 'home-B': 'B', 'home-G': 'G' };

export interface HomeStyle {
  /** The model: `campsite` (today's tent), `tent-n` / `tent-p` (NH's move-in tents), `house` (NH's modular house). */
  m: string;
  /** The modular house's parts (homes.json's ids with their colour: `NABrick.A`, `NATile.C`, `Simple.R.B`). */
  w?: string;
  r?: string;
  d?: string;
}

/** Each model's footprint in tiles (across × deep, facing the camera) at the island's furniture scale (3u a model unit,
 *  NH's 10 model units a tile). */
const FOOT: Record<string, readonly [number, number]> = {
  campsite: [4, 3],
  'tent-n': [3, 3],
  'tent-p': [4, 3],
  house: [4, 3]
};

/** A style's footprint (tiles, facing the camera). */
export const homeFoot = (s: HomeStyle | undefined): readonly [number, number] => FOOT[s?.m ?? 'campsite'] ?? FOOT.campsite;

/** The homes' looks before their owners pick one: ウェイ's the campsite's tent (as it always was), うめ's and the
 *  guest's NH houses. */
export const DEFAULT_HOMES: Record<Who, HomeStyle> = {
  A: { m: 'campsite' },
  B: { m: 'house', w: 'NAStucco.A', r: 'NATile.A', d: 'Simple.R.A' },
  G: { m: 'house', w: 'NBLog.A', r: 'NBThatched.A', d: 'Standard.R.A' }
};
