// The 3D island's things (R4 step 4): what Island3D's mirror draws, as data. A model writes each thing it has on the
// island here, by id: its NH model (`m3`) and where it is (a spot, or its live position); a character (`figure`) by its
// actor. Read by mirror3.ts (Island3D's chunk only: this side is the first load's, kept small).
import type { M3, V3, World } from '../island/camera.svelte.ts';

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
  /** In view wherever it is along the island (the projector's `always`: not held to the camera's z window). */
  always?: boolean;
}
export interface Entry extends Thing3 {
  id: string;
  /** The DOM node it was attached to, while the DOM island lasts (its art hidden once the model stands: Island3D). */
  el: HTMLElement | null;
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
export interface Registry {
  map: Map<string, Entry>;
  /** The figures, by their actor ('visitor', 'guest', 'kk'). */
  figs: Map<string, Figure3>;
  /** Bumped on each thing in or out (mirror3's list is kept till it changes). */
  rev: number;
}
const regs = new WeakMap<World, Registry>();
/** A World's things (made on first use: per World, gone with it). */
export function things3(w: World): Registry {
  let r = regs.get(w);
  if (!r) regs.set(w, (r = { map: new Map(), figs: new Map(), rev: 0 }));
  return r;
}

/** Put a thing on the island by its `m3.id` (`{@attach thing(w, t)}`, or called with no element): taken off by the
 *  returned function. A later one of the same id replaces it; an earlier one's taking off then does nothing. */
export const thing = (w: World, t: Thing3 & { m3: { id: string } }) => (el?: HTMLElement) => {
  // (the node's art hidden from its first frame, till the 3D island says it has no model for it: World.at's data-m3)
  if (el && !t.m3.art) el.toggleAttribute('data-m3', true);
  return put(w, things3(w).map, t.m3.id, { ...t, id: t.m3.id, el: el ?? null });
};

/** Put a character on the island by its actor (`v3.actor`, default the visitor's), as `thing`. */
export const figure = (w: World, f: Figure3) => () => put(w, things3(w).figs, f.v3.actor ?? 'visitor', { ...f });

function put<T>(w: World, map: Map<string, T>, id: string, e: T): () => void {
  const r = things3(w);
  map.set(id, e);
  r.rev++;
  w.kick();
  return () => void (map.get(id) === e && map.delete(id) && r.rev++);
}
