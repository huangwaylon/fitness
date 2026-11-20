// The island's test probe (window.__world3d's pick, box, actor and the state hooks; docs/ops/testing.md "The test
// API"): what a tap at a client point goes to, where a thing's tap area is, and what the island shows, as plain data,
// so the specs ask by kind and id. The island has no DOM of its own (R4 steps 7–8): its answers are the 3D island's
// (world3d/pick3d.ts, things3 probes); what's read here is the DOM over it (the HUD's buttons, the speech balloon:
// `ui`, `talk`) and the shapes the hooks answer in. Test hooks only (testMode.ts testHooks).

import type { ShakesRows } from './treeShakes.svelte.ts';
import type { VisitorRow } from './visitor.svelte.ts';
import type { KKRow } from './kk.svelte.ts';

/** What a tap goes to: a control (a villager, a door, the decor, a goal tree, its fruit row, a balloon, the board, a
 *  tree shake's pick or swarm, any other button: `ui`), else a scenery thing (SceneTaps' order: tree, bush, campfire, sit,
 *  fixture, flower). */
export type PickKind =
  | 'villager' | 'building' | 'decor' | 'goal' | 'row' | 'talk' | 'board' | 'balloon' | 'swarm' | 'drop' | 'ui'
  | 'tree' | 'bush' | 'campfire' | 'sit' | 'fixture' | 'flower' | 'visitor';
type Ref = { kind: PickKind; id: string };
/** A pick: the thing a tap goes to, and the other things the same tap area is (a bench is a seat and a fixture). */
export type Picked = Ref & { also: Ref[] };
/** What `box` finds: a tap area (PickKind), or a figure the scene hit-tests itself (a visitor's, K.K.'s, the cake,
 *  the arch, a toy, the tape deck) or a critter (`id` its species, or `fish` / `pond`: a shadow) or a find (`id` its kind or uid; the foot the
 *  point it lies on) or a care thing (a weed's uid, or `rock`), my float
 *  (`bobber`), the dive spot's bubbles, the shadow a dive chases (`chase`), or a goal tree's fruit (id `tree:fruit`, `A:apple`), or a
 *  tree's trunk (a goal tree's, `A`, or the scenery's, `oak-m1`: its own tap area, ≥ 45 px wide, a part of the tree's). */
export type BoxKind = Exclude<PickKind, 'ui'> | 'kk' | 'cake' | 'arch' | 'toy' | 'deck' | 'critter' | 'find' | 'care' | 'fruit' | 'trunk' | 'bobber' | 'bubbles' | 'chase';
/** A tap area's box (client px) and its node's foot (the world point it stands on, on screen), if it has one. */
export type Box = { left: number; top: number; width: number; height: number; foot: [number, number] | null };

/** The kinds a tap's button is (a tap under one is the control's, SceneTaps' first rule). */
export const CONTROLS: readonly PickKind[] = ['villager', 'building', 'decor', 'goal', 'row', 'talk', 'board', 'balloon', 'swarm', 'drop', 'ui'];

function* up(el: Element | null): Generator<Element> {
  for (let n = el; n; n = n.parentElement) yield n;
}
const isControl = (n: Element) => /^(button|a)$/i.test(n.tagName) || n.getAttribute('role') === 'button';

/** The button `b`'s thing. */
function controlOf(b: Element): Ref {
  if (b.getAttribute('data-fx') === 'talk') return { kind: 'talk', id: '' };
  return { kind: 'ui', id: b.getAttribute('aria-label') ?? b.getAttribute('class')?.split(' ')[0] ?? b.tagName.toLowerCase() };
}

/** The overlays drawn over the island (the tree's popup, a speech balloon or its answers, a mark, a caption, the catch
 *  plates, the say picker): a tap that lands on one is its own, never the island's under it (docs/design.md "Taps"; one
 *  that lets taps through has `pointer-events: none`, and the tap never lands on it). */
export const OVERLAYS = '[data-tree-pop], [data-fx], [data-say], [data-mumble], [data-catch-stack], [role="dialog"], dialog';

/** What a tap on `el` (the topmost node at the point) goes to of the DOM over the island (a button: the HUD's `ui`, the
 *  speech balloon's `talk`), or null (the island's: world3d/pick3d.ts). e2e/probe.spec.ts holds pick to it. */
export function pickOf(el: Element | null): Picked | null {
  if (!el) return null;
  for (const n of up(el)) if (isControl(n)) return { ...controlOf(n), also: [] };
  return null;
}

/** Where thing `kind` is on screen of the DOM over the island (only the speech balloon, `talk`: every island thing's
 *  box is its tap area's or its model's, Island3D's box() and drawn()), or null (not there; `shown`: nor hidden). */
export function boxOf(root: Pick<ParentNode, 'querySelector'>, kind: BoxKind, shown = false): Box | null {
  const el = kind === 'talk' ? root.querySelector('[data-fx="talk"]') : null;
  if (!el || (shown && !(el.checkVisibility?.({ visibilityProperty: true }) ?? true))) return null;
  const r = el.getBoundingClientRect();
  return shown && !(r.width && r.height) ? null : { left: r.left, top: r.top, width: r.width, height: r.height, foot: null };
}

/** A piece of the scenery as shown (a tree, a bush, a rock, a fixed decor piece, the decor, a building, a flower). */
export type Piece = {
  id: string;
  /** Its scenery kind (world.ts: oak, palm, bush, rock, …), or `fixture` (fixedDecor), `decor`, `building`, `flower`. */
  kind: string;
  /** Its art's key (`deco/picnic-set`, `flowers/black-cosmos`; the decor's item). */
  look: string | null;
  /** The seat it is (its sit id: a tap walks up and sits on it), or null. */
  sit: string | null;
  /** The fixed decor piece a tap answers as (its id), or null. */
  fixture: string | null;
  /** The shishi-odoshi tipped; a campfire lit (its flames); a flower watered today (its glint). */
  tipped: boolean; lit: boolean; watered: boolean;
};
/** A villager as the island shows it (`slot`: mine, partner, third): IslandScene's probe 'actors' (the director's state, the
 *  faces, the seats), Island3D's `v3`. */
export type Actor = {
  /** Its motion now (the director's: hop, squish, …), or null. */
  act: string | null;
  walking: boolean; inside: boolean; hat: boolean; stung: string | null; swollen: boolean; tricked: boolean;
  seat: string | null; gym: string | null; who: string | null;
  /** Its flourishes showing (the director's fx on it: sparkles, hearts, notes, …). */
  fx: string[];
  /** Drawn by the 3D island (its tap area its model's core). */
  v3: boolean;
};
type Root = Pick<ParentNode, 'querySelectorAll'>;
const all = (root: Root, sel: string) => [...root.querySelectorAll(sel)];
const rect = (n: Element): Omit<Box, 'foot'> => {
  const r = n.getBoundingClientRect();
  return { left: r.left, top: r.top, width: r.width, height: r.height };
};

/** Every control shown (a villager, a door, the decor, a goal tree, the HUD's buttons: `ui`, …) and its tap area's box,
 *  stacked or not: what a figure may overlap (a pick finds only the topmost). */
export const controlsOf = (root: Root) =>
  all(root, 'button, a, [role="button"]')
    .filter((n) => (n as HTMLElement).checkVisibility?.({ visibilityProperty: true }) ?? true)
    .map((n) => ({ ...controlOf(n), box: rect(n) }))
    .filter((c) => c.box.width && c.box.height);

/** The critters out (critters.svelte.ts: no DOM): a bug (`id` its species) or a fish's shadow (`id` fish or pond, its
 *  water and pool). A bug's `place` (a flower, a trunk, the water's air…), `flight` (drift, dart, stalk…), a stalker's
 *  `stalk` (rear, settled); a shadow's `shape` (`fin`: a shark's), or null. `gone`/`fled`: on its way out; `sat`:
 *  landed. A bug's box is its 3D model's (≥ 20 px), a shadow's a point at its middle. */
export type Critter = {
  id: string; place: string | null; water: string | null; pool: string | null; flight: string | null; stalk: string | null; shape: string | null;
  gone: boolean; fled: boolean; sat: boolean; box: { left: number; top: number; width: number; height: number };
};
/** The dive spot out (its bubbles: the item under them, or null) and a dive on (the splash, or the shadow it chases). */
export type Dive = { bubbles: string | null; dive: 'splash' | 'chase' | null };


/** The day's finds lying out (a dig spot `fossil`, a mushroom, a present, a shell, a fragment, the bottle): `id` its
 *  item, `tree` a present's tree, `fall` a present falling out of it, `shown` drawn now (one out of view or under a
 *  control isn't), `foot` the point it lies on (client px), `box` its model's (finds.svelte.ts: the 3D island's). */
export interface Find {
  kind: string; id: string | null; uid: string; tree: string | null; fall: boolean; shown: boolean;
  foot: [number, number]; box: Omit<Box, 'foot'>;
}

/** The island care things out: the day's weeds (`uid`; `sprout`: just popped up) and the rock (uid `rock`), `shown`,
 *  `foot` and `box` (its model's: care.svelte.ts) as the finds'. */
export interface Care {
  kind: string; uid: string; sprout: boolean; shown: boolean; foot: [number, number]; box: Omit<Box, 'foot'>;
}

/** A visitor out (the day's in slot `visitor`, the day's guest in `guest`) or K.K. (`kk`), and whether it's `shown`
 *  (visitor.svelte.ts, kk.svelte.ts: their rows; Island3D adds `shown`). */
export type Visitor = (VisitorRow | KKRow) & { shown: boolean };

type Shown = { shown: boolean; box: Omit<Box, 'foot'> };
/** The day's props from their models: Toy Day's presents (Particles), the cake (`out`: its candles blown out), the tape
 *  deck (`state`: on (playing), ready (its day), idle; `hint`: its ♪ asking for a tap), the wedding arch (its model's
 *  box), Halloween (`day`, `night`) and its pumpkins (`lit`: a night's lantern; `box`: the art's size at its spot). */
export type Props = {
  toys: Shown[]; arch: Shown | null;
  cake: ({ out: boolean } & Shown) | null; deck: ({ state: 'on' | 'ready' | 'idle'; hint: boolean } & Shown) | null;
  halloween: 'day' | 'night' | null; pumpkins: ({ lit: boolean } & Shown)[];
};

/** A tree shake's leavings (treeShakes.svelte.ts' probe), each drop's `box` its tap area's. */
export type Shakes = Omit<ShakesRows, 'drops'> & { drops: (ShakesRows['drops'][number] & { box: Omit<Box, 'foot'> })[] };

/** A goal tree as shown (FruitTree's things3 probe `goal:<tree>`): its popup `open` (the popup itself, `.detail`, is an
 *  overlay that stays), its `glints` (all four met), and its fruit: each fruit's id, its stage (tree, fall, ground), up
 *  in the canopy or down, its drop playing, its grey (fruitDay.ts greyAt: 1 at 0 %, 0 once met); `id3` its model's
 *  instance and `at` its spot (world x, z, lift: Island3D's box('fruit', 'tree:f')). */
export type GoalRow = {
  open: boolean; glints: boolean;
  fruit: { f: string; stage: string; up: boolean; dropping: boolean; grey: number; id3: string; at: readonly [number, number, number] }[];
};

/** The 3D island's effects as they fired (fx3d.ts: a tap's ring, the high five's zap, a splash, …), oldest first, the
 *  last `max`: what a spec waits for, however briefly it showed. `at`: the page's clock (ms). */
export type FxSeen = { kind: string; x: number; z: number; v: string | null; at: number };
export function fxLog(max = 200) {
  const seen: FxSeen[] = [];
  return {
    add: (kind: string, x: number, z: number, v: string | null | undefined, at: number) => {
      seen.push({ kind, x, z, v: v ?? null, at });
      if (seen.length > max) seen.shift();
    },
    list: (): FxSeen[] => seen.slice()
  };
}
