// The 3D island's things (R4 step 4): what Island3D's mirror draws, as data. A model writes each thing it has on the
// island here, by id: its NH model (`m3`) and where it is (a spot, or its live position); a character (`figure`) by its
// actor. Read by mirror3.ts (Island3D's chunk only: this side is the first load's, kept small).
import type { WashIn } from '#lib/layout/swash.ts';
import type { World } from '../island/camera.svelte.ts';

export interface V3 {
  /** Its model (villager3d/villagers.json). */
  id: string;
  /** How far it floats above the ground now (u: Wisp's float, a flight down), read each frame. */
  lift: () => number;
  /** Asleep face down on the ground (Gulliver washed up), read each frame. */
  prone: () => boolean;
  /** Faded out (walking on or off at the campsite's door, leaving in a puff), read each frame. */
  away: () => boolean;
  /** A second figure beside it (Reese's Cyrus): its model and how far across (u: each stands half of it off the
   *  node). */
  also?: { id: string; dx: number };
  /** Its director's actor (default the visitor's; the day's guest's, `guest`; K.K. on his stool his own, `kk`: each drawn
   *  beside the day's visitor). */
  actor?: 'visitor' | 'guest' | 'kk';
  /** Seated: how high its seat's top is over the ground (u: K.K.'s stool), and the way it faces (three's yaw). */
  seat?: number;
  yaw?: number;
  /** Asleep (dozing where it sits), read each frame. */
  asleep?: () => boolean;
}
export interface M3 {
  key: string;
  yaw?: number;
  /** Tipped about its own x (radians): a bug flat on a trunk's bark. */
  pitch?: number;
  /** A flier's wings' angle (radians, up from flat: world3d/things.ts FLAPS). */
  flap?: number;
  grey?: number;
  /** Hidden in 3D for now (a fallen fruit mid-drop). */
  off?: boolean;
  /** Its instance's name (a reaction's echo finds it: echo3d.ts; a mover keeps it as it goes). */
  id: string;
  /** A move to a new spot eases over this long (a critter's walk between its waypoints, as its CSS transition). */
  ms?: number;
  /** Its height (world y), not on the ground: a fish's shadow under the sea's surface. */
  y?: number;
  /** On the water's surface (a float, a lily pad), `lift` above it. */
  water?: boolean;
  /** Where its water is read (world x, z), when not at the node: a fish's shadow stands by its nose, its middle in the
   *  water (world3d/swim.ts). */
  wet?: () => { x: number; z: number } | undefined;
  /** It gives off a flourish every `every` ms where it is (a dive spot's bubbles, a firefly, the campfire's flames):
   *  fx3d.ts' kinds; with no model of its own (`key` ''), only that. `hold`: one flourish held as long as it's shown,
   *  following it (a light: Wisp's glow, a candle's flame, the pair's heart float); `art`: an `art` one's picture. */
  emit?: { kind: string; every: number; v?: string; size?: number; lift?: number; art?: string; hold?: true };
  /** A line from this point (world x, z, lift) to it: a fishing line, a bagworm's thread. */
  line?: () => readonly [number, number, number];
  /** It comes falling from this many units up (over `ms`: a tree's present out of its canopy). */
  drop?: number;
  /** It washes in from the sea (layout/swash.ts: a shell, the bottle): its model fades in with it (the node's `live`
   *  slides it up the beach). */
  wash?: WashIn;
  /** Bigger or smaller than its model (a factor: a balloon's falling present growing to its size on the ground). */
  size?: number;
  /** Turned the way it moves (a fish), `yaw` added; or to the camera (a flat flourish: a sparkle). */
  face?: 'move' | 'camera';
}
/** A thing as mirror draws it: its id, its model, where it is now. */
export interface Model3 {
  id: string;
  m3: M3;
  x: number;
  z: number;
  lift: number;
  shown: boolean;
}

export interface Thing3 {
  m3: M3;
  x: number;
  z: number;
  /** Units above the ground (a flier's height). */
  lift?: number;
  /** Its height (u) for the in-view test (default 80). */
  h?: number;
  /** A moving thing's live position, read each frame: [x, z, lift?]. */
  live?: () => readonly [number, number, number?];
  /** In view wherever it is along the island (the anchor rule's `always`: not held to the camera's z window). */
  always?: boolean;
}
export interface Entry extends Thing3 {
  id: string;
}
/** A character the 3D island draws as its NH model (a visitor, K.K.: world3d/villagers.ts), posed by its actor. */
export interface Figure3 {
  v3: V3;
  x: number;
  z: number;
  h?: number;
  live?: () => readonly [number, number, number?];
  always?: boolean;
}
/** A tap area (world3d/pick3d.ts projects it): placed by the camera's anchor rule (World.place: its foot at x, z,
 *  `lift` up; `model`: squashed upright by the camera's foreshortening), a rect in its units round its foot, grown to
 *  a least size on screen. Several areas of one thing (a tree's leaves and its
 *  trunk) share kind and id, each its own `part`. */
export interface Tap3 {
  /** probe.ts PickKind. */
  kind: string;
  id: string;
  part?: string;
  /** The other things the same area is (a bench: a seat and a fixture). */
  also?: readonly { kind: string; id: string }[];
  x: number;
  z: number;
  lift?: number;
  live?: () => readonly [number, number, number?];
  /** Placed wherever it is (not held to the camera's z window), and its height for the in-view test (default 80). */
  always?: boolean;
  h?: number;
  model?: boolean;
  /** The rect (u): across from the foot (l … r), up from it (b … t; b < 0 below it). */
  l: number;
  r: number;
  b: number;
  t: number;
  /** Its bottom reaches down to where its 3D model's silhouette ends on screen (that model's instance id: a tree's
   *  trunk, whose model seen from above near the camera stands out below its foot, its crown or its roots). */
  base?: string;
  /** Its least size on screen (px), centred across; up from its bottom or about its middle. */
  min?: readonly [number, number, 'mid' | 'bottom'];
  /** Rounded corners: their radius as a share of the rect's size, the top's and the bottom's (CSS border-radius %), or
   *  in px on screen (`radius`: the fruit row's pill, clamped to half its height). */
  round?: readonly [number, number];
  radius?: number;
  /** What clips it (u, as the rect: the art's own inset box). */
  clip?: { l: number; r: number; b: number; t: number };
  /** Its stacking (World's): a depth offset, or its own order. */
  dz?: number;
  zi?: number;
  /** A building's body (pick3d.ts bodyOf): its footprint and height, its model's silhouette once built. */
  body?: { x0: number; x1: number; z0: number; z1: number; h: number; shape?: string };
  /** What a tap on it does (a control's: the canvas router's, SceneTaps; R4 step 6), given the tap (client px), its area
   *  on screen and the click (its target the DOM's node there). */
  act?: (x: number, y: number, a: { l: number; t: number; r: number; b: number }, e: MouseEvent) => void;
}
/** What the canvas router acts on at a client point (world3d/pick3d.ts route3d): the tap area under it (`under`, null:
 *  the ground or the sky) and that area, and (a building) whether a point is on its body; 'dom' where the DOM stays (off
 *  the stage, an overlay, the HUD's buttons, the speech balloon), 'rush' on a fling (a touch only stops it). */
export type Route = 'dom' | 'rush' | { under: Picked3 | null; tap: Tap3 | null; area: { l: number; t: number; r: number; b: number } | null; onHouse?: (px: number, py: number) => boolean };
type Picked3 = { kind: string; id: string; also: { kind: string; id: string }[] };
/** What a tap goes to in the scene's own chain, before the scenery and the ground (SceneTaps claims: a plot, a visitor,
 *  a critter, a find, …): its kind and id. */
export type Claim = { kind: string; id: string };
/** SceneTaps' dry run (its claims): what a tap at client (x, y) goes to, given what it hit-tests to (`under`) and
 *  whether a point is on that building's body. */
type ClaimFn = (x: number, y: number, under: Claim | null, onHouse?: (px: number, py: number) => boolean) => Claim | null;
export interface Registry {
  map: Map<string, Entry>;
  /** The figures, by their actor ('visitor', 'guest', 'kk'). */
  figs: Map<string, Figure3>;
  /** The tap areas, by kind, id and part, in the order they came (the DOM's: a later one is on top of an equal depth). */
  taps: Map<string, Tap3>;
  /** Bumped on each thing in or out (mirror3's list is kept till it changes). */
  rev: number;
  /** The scene's chain, while SceneTaps is mounted. */
  claims?: ClaimFn;
  /** What a tap at a client point goes to by the 3D tap areas (Island3D's: the canvas router's, SceneTaps, and the
   *  tree popup's and the tent walk's touch-down: IslandScene). */
  route?: (x: number, y: number) => Route;
  /** A tap on a villager (IslandScene's: my villager's squish, a high five), by its actor. */
  onVillager?: (id: string) => void;
  /** Each visitor figure's .art box worked out from its spot (client px, Visitor's figBox 3d), by its slot. */
  arts: Map<string, () => { left: number; top: number; right: number; bottom: number } | null>;
  /** A figure kind's box on screen from the 3D island (client px), by its id or its DOM node (the e2e's box() and the
   *  modules' hooks; R4 step 7: the kinds whose 2D art is gone), by kind: 'critter', 'bobber', 'bubbles', 'chase' (critters.svelte.ts), 'find' (finds.svelte.ts: its foot too),
   *  'building' (its body's tap area: Island3D; the iris's door). */
  boxes: Map<string, (id: string, node?: Element) => { left: number; top: number; width: number; height: number; foot?: [number, number] | null } | null>;
  /** The e2e hooks' lists from a model whose DOM is gone, by hook name (R4 step 7: 'critters', 'dive': critters.svelte.ts; 'finds', 'digs': finds.svelte.ts;
   *  what a kind draws, drawn(), is its boxes' `drawn:<kind>`). */
  probes: Map<string, () => unknown>;
}
const regs = new WeakMap<World, Registry>();
/** A World's things (made on first use: per World, gone with it). */
export function things3(w: World): Registry {
  let r = regs.get(w);
  if (!r) regs.set(w, (r = { map: new Map(), figs: new Map(), taps: new Map(), rev: 0, arts: new Map(), boxes: new Map(), probes: new Map() }));
  return r;
}

/** Put a thing on the island by its `m3.id` (`thing(w, t)()`, in an effect): taken off by the returned function. A
 *  later one of the same id replaces it; an earlier one's taking off then does nothing. */
export const thing = (w: World, t: Thing3) => () => put(w, things3(w).map, t.m3.id, { ...t, id: t.m3.id });

/** Put a character on the island by its actor (`v3.actor`, default the visitor's), as `thing`. */
export const figure = (w: World, f: Figure3) => () => put(w, things3(w).figs, f.v3.actor ?? 'visitor', { ...f });

/** Put a thing's tap areas on the island (`{@attach tap(w, list)}`, or called bare), as `thing`; no frame for them
 *  (nothing's drawn). */
export const tap = (w: World, list: readonly Tap3[]) => () => {
  const m = things3(w).taps, keys = list.map((t) => `${t.kind}:${t.id}:${t.part ?? ''}`);
  list.forEach((t, i) => (m.delete(keys[i]), m.set(keys[i], t)));
  return () => list.forEach((t, i) => m.get(keys[i]) === t && m.delete(keys[i]));
};

function put<T>(w: World, map: Map<string, T>, id: string, e: T): () => void {
  const r = things3(w);
  map.set(id, e);
  r.rev++;
  w.kick();
  return () => void (map.get(id) === e && map.delete(id) && r.rev++);
}
