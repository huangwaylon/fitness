// The homes (docs/island-layout.md "Homes"), pure: three, fixed ids `home-A` (ウェイ's), `home-B` (うめ's), `home-G`
// (the guest's). Where one stands is an object of the layout; how it looks is its style, its owner's alone (a `decor`
// op of scope `h`): a model `m` and, for NH's modular house, its wall `w`, roof `r` and door `d`, each a part in a
// colour. The catalogue is NH's (homes.json: scripts/home-models.ts from the game's House* models):
//   campsite                 today's campsite tent (ウェイ's, as it always was)
//   tent-n  w: 'A' | 'B'     NH's move-in tent, two colours
//   tent-p                   the player's first tent
//   house   w: '<shape><Material>.<colour>'  (PA04Stucco.B: the player's house; NABrick.C … ND*: the villagers' houses)
//           r: '<shape><Material>.<colour>'  (the same shape's roof: PA04Westerntile.C)
//           d: '<Style>.<R|S>.<colour>'      (Simple.R.A: NH's 14 doors, round or square)
// A style's footprint (tiles) and its porch follow its shape, and its door is the middle of its front edge
// (model.ts doorOf), so a home's way in stays valid whatever its owner picks; every interior is the same 8 × 8 room.
import HOMES_JSON from './homes.json' with { type: 'json' };

export type Who = 'A' | 'B' | 'G';
export const HOME_IDS: Record<Who, string> = { A: 'home-A', B: 'home-B', G: 'home-G' };
export const WHO_OF_HOME: Record<string, Who> = { 'home-A': 'A', 'home-B': 'B', 'home-G': 'G' };

export interface HomeStyle {
  m: string;
  w?: string;
  r?: string;
  d?: string;
  /** Its facing (0–3: 0 the camera's way), its owner's like the rest of its look; none: the object's. */
  f?: 0 | 1 | 2 | 3;
}

interface Family {
  kind: 'wall' | 'roof' | 'door' | 'tent';
  min: number[];
  max: number[];
  kb: number;
  v: string;
  colours: Record<string, string[]>;
  /** A wall's doorway (model units): NH's DoorModel0 joint, where its door stands (the door's own origin there). */
  door?: number[];
}
/** NH's house parts as converted (scripts/home-models.ts): family → its bounds, size, hash, colours. */
export const FAMILIES = (HOMES_JSON as unknown as { families: Record<string, Family> }).families;

/** The house shapes: their footprint (tiles across × deep, the porch in it), the porch's depth in front of the wall
 *  (u), and their names. PA04 is the player's house (NH's last); NA … ND the villagers'. */
export const SHAPES: Record<string, { foot: readonly [number, number]; porch: number; ja: string; en: string }> = {
  PA04: { foot: [5, 3], porch: 15, ja: 'プレイヤーのいえ', en: 'Your house' },
  NA: { foot: [4, 3], porch: 15, ja: 'ようふう', en: 'Western' },
  NB: { foot: [4, 3], porch: 15, ja: 'ログハウス', en: 'Log house' },
  NC: { foot: [4, 3], porch: 15, ja: 'わふう', en: 'Japanese' },
  ND: { foot: [4, 4], porch: 16, ja: 'こや', en: 'Cabin' }
};
/** The tents' and the campsite's. */
const OTHER: Record<string, { foot: readonly [number, number]; porch: number }> = {
  campsite: { foot: [4, 3], porch: 0 },
  'tent-n': { foot: [3, 3], porch: 8 },
  'tent-p': { foot: [4, 3], porch: 2 }
};

const kebab = (s: string) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
/** A wall's or a roof's part id (`PA04Stucco.B`) → its shape, material, colour and family (`wall-pa04-stucco`). */
export function partOf(kind: 'wall' | 'roof', id: string | undefined): { shape: string; material: string; colour: string; family: string } | null {
  const m = /^(N[A-D]|PA04)([A-Z][a-z]+)\.([A-J])$/.exec(id ?? '');
  if (!m) return null;
  const family = `${kind}-${m[1].toLowerCase()}-${kebab(m[2])}`;
  if (!FAMILIES[family]?.colours[m[3]]) return null;
  return { shape: m[1], material: m[2], colour: m[3], family };
}
/** A door's id (`Simple.R.A`) → its style, shape, colour and family (`door-simple-r`). */
export function doorPartOf(id: string | undefined): { style: string; shape: 'R' | 'S'; colour: string; family: string } | null {
  const m = /^([A-Z][A-Za-z]*)\.([RS])\.([A-J])$/.exec(id ?? '');
  if (!m) return null;
  const family = `door-${kebab(m[1])}-${m[2].toLowerCase()}`;
  if (!FAMILIES[family]?.colours[m[3]]) return null;
  return { style: m[1], shape: m[2] as 'R' | 'S', colour: m[3], family };
}

/** The parts a style is drawn from (families and colours), mended where it names something that isn't (a roof of
 *  another shape, an unknown colour: the shape's first material, the family's first colour). */
export function partsOf(s: HomeStyle | undefined): { family: string; colour: string; at?: readonly number[] }[] {
  if (!s || s.m === 'campsite') return [];
  if (s.m === 'tent-n') return [{ family: 'tent-n', colour: s.w === 'B' ? 'B' : 'A' }];
  if (s.m === 'tent-p') return [{ family: 'tent-p', colour: 'A' }];
  const wall = partOf('wall', s.w) ?? partOf('wall', DEFAULT_HOMES.B.w)!;
  let roof = partOf('roof', s.r);
  if (!roof || roof.shape !== wall.shape) {
    const fam = Object.keys(FAMILIES).find((f) => f.startsWith(`roof-${wall.shape.toLowerCase()}-`))!;
    roof = { shape: wall.shape, material: '', colour: Object.keys(FAMILIES[fam].colours)[0], family: fam };
  }
  const door = doorPartOf(s.d) ?? doorPartOf(DEFAULT_HOMES.B.d)!;
  return [
    { family: wall.family, colour: wall.colour },
    { family: roof.family, colour: roof.colour },
    // (in the wall's doorway: up its step, across to a villager house's door)
    { family: door.family, colour: door.colour, at: FAMILIES[wall.family]?.door ?? [0, 0, 0] }
  ];
}

/** A style's footprint (tiles, facing the camera). */
export function homeFoot(s: HomeStyle | undefined): readonly [number, number] {
  if (s?.m === 'house') return SHAPES[partOf('wall', s.w)?.shape ?? 'PA04']?.foot ?? SHAPES.PA04.foot;
  return OTHER[s?.m ?? 'campsite']?.foot ?? OTHER.campsite.foot;
}
/** How far the model's front stands in front of its wall (u: the porch; the model's origin is the wall's front). */
export function homePorch(s: HomeStyle | undefined): number {
  if (s?.m === 'house') return SHAPES[partOf('wall', s.w)?.shape ?? 'PA04']?.porch ?? 15;
  return OTHER[s?.m ?? 'campsite']?.porch ?? 0;
}


/** The catalogue's choices for a picker: each shape's wall and roof materials (their colours), the doors (shapes,
 *  colours). */
export function catalogue() {
  const walls: Record<string, { material: string; colours: string[] }[]> = {}, roofs: Record<string, { material: string; colours: string[] }[]> = {};
  const doors: { style: string; shapes: ('R' | 'S')[]; colours: string[] }[] = [];
  const un = (k: string) => k.split('-').map((p) => p[0].toUpperCase() + p.slice(1)).join('');
  for (const [f, fam] of Object.entries(FAMILIES)) {
    const m = /^(wall|roof)-(n[a-d]|pa04)-(.+)$/.exec(f);
    if (m) {
      const shape = m[2].toUpperCase(), into = m[1] === 'wall' ? walls : roofs;
      (into[shape] ??= []).push({ material: un(m[3]), colours: Object.keys(fam.colours) });
      continue;
    }
    const d = /^door-(.+)-([rs])$/.exec(f);
    if (d) {
      const style = un(d[1]);
      let e = doors.find((x) => x.style === style);
      if (!e) doors.push((e = { style, shapes: [], colours: Object.keys(fam.colours) }));
      e.shapes.push(d[2].toUpperCase() as 'R' | 'S');
    }
  }
  return { walls, roofs, doors };
}

/** The homes' looks before their owners pick one: ウェイ's the campsite's tent (as it always was), うめ's NH's player
 *  house, the guest's a villager's log house. */
export const DEFAULT_HOMES: Record<Who, HomeStyle> = {
  A: { m: 'campsite' },
  B: { m: 'house', w: 'PA04Stucco.B', r: 'PA04Westerntile.C', d: 'Simple.R.A' },
  G: { m: 'house', w: 'NBLog.A', r: 'NBThatched.A', d: 'Standard.S.A' }
};
