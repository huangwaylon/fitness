// The world's camera and projector (docs/design.md "World"). Each IslandScene owns one World; the live island's is also
// `live()` for the pure modules (the walk, the placement searches). The 3D island's camera (world3d/engine.ts, through
// `useThree`) is the camera; every world thing is a DOM node registered with its feet at world (x, z) (its tap area, its
// marks and balloons over the canvas), and one step places them all through that camera: an upright node (`up`:
// translate + scale), a flat ground mark (`flat`: also squashed by the ground's foreshortening) or a ground quad
// (`quad`: a box of the plan laid on the ground by a matrix3d). The step runs in the engine's frames, and on the game's
// own clock while something moves (a node with a `live` position) and once after a change; never when still. Until
// the 3D camera is up nothing is placed (every node hidden). Nothing in the hot path is reactive: `rest` only carries
// what components need to know when the camera is still.
import type { WashIn } from '#lib/layout/swash.ts';
import { getContext, setContext } from 'svelte';
import { quadMatrix, zIndexAt } from './geom.ts';
import { AHEAD, BEHIND, CAMS, PLAN, type Pt } from './world.ts';

type NodeMode = 'up' | 'flat' | 'quad';
export interface NodeSpec {
  x: number;
  z: number;
  mode?: NodeMode;
  /** Upright: units above the ground (a butterfly's flight, a held item). */
  lift?: number;
  /** Upright: its height (u), for the horizon's sink clip and the on-screen test (default 80). */
  h?: number;
  /** Depth offset for the z-index only (a canopy hangs over the trunk's front: −14). */
  dz?: number;
  /** Its own stacking order instead (a number), or none set (null). */
  zi?: number | null;
  /** quad: the box's extent in world units (x0…x1 across, z0 near … z1 far); the element is (x1−x0) × (z1−z0) u, its
   *  top edge the far side. */
  box?: { x0: number; x1: number; z0: number; z1: number };
  /** A moving thing's live position (read every frame while anything moves): [x, z, lift?]. */
  live?: () => readonly [number, number, number?];
  /** Always place it, whatever the live window (something that may come into view from far off). */
  always?: boolean;
  /** Set --inv = 1 / scale on the node (a popup or a label drawn at its true size). */
  inv?: boolean;
  /** A light (a lamp's glow, a lit window, a firefly): sorted by its depth like any node, but never dimmed by the time
   *  of day's tint (IslandScene's --tod-filter skips it). */
  light?: boolean;
  /** The 3D island draws this thing as a model (a tree, a bush, a decoration): its node is the model's tap area, its
   *  art invisible, squashed upright as the model's height is foreshortened by the camera (world3d/). */
  model?: boolean;
  /** The 3D island draws this thing as NH's model of this art key (world3d/assets.json), where the node is (its live
   *  position too): the node's `[data-m3art]` art goes invisible once the model stands there (world3d/Island3D). `yaw`:
   *  turned (radians); `grey`: drained toward grey (a fruit not grown yet, 0 … 1). */
  m3?: M3 | null;
  /** The 3D island draws this character as a card of its render (a visitor: depth-tested like the villagers),
   *  posed by its actor's motion; its art (`art`) invisible once the card stands there. */
  c3?: C3 | null;
}
interface C3 {
  key: string;
  /** Its height (u) and how far it floats above the ground. */
  h: number;
  lift?: number;
  flip?: boolean;
  actor?: 'visitor' | 'host';
  art?: () => Element | null | undefined;
  /** A second figure beside it (Reese's Cyrus): its art, height and how far across (u). */
  also?: { key: string; h: number; dx: number };
}
/** A node the 3D island draws as a card. */
export interface Card3 {
  id: string;
  c3: C3;
  x: number;
  z: number;
  shown: boolean;
}
interface M3 {
  key: string;
  yaw?: number;
  /** Tipped about its own x (radians): a bug flat on a trunk's bark. */
  pitch?: number;
  /** A flier's wings' angle (radians, up from flat: world3d/things.ts FLAPS). */
  flap?: number;
  grey?: number;
  /** Hidden in 3D for now (a fallen fruit mid-drop). */
  off?: boolean;
  /** Its instance's name (a reaction's echo finds it: echo3d.ts; a mover keeps it as it goes), else the node's own. */
  id?: string;
  /** A move to a new spot eases over this long (a critter's walk between its waypoints, as its CSS transition). */
  ms?: number;
  /** Its height (world y), not on the ground: a fish's shadow under the sea's surface. */
  y?: number;
  /** On the water's surface (a float, a lily pad), `lift` above it. */
  water?: boolean;
  /** It gives off a flourish every `every` ms where it is (a dive spot's bubbles, a firefly, the campfire's flames):
   *  fx3d.ts' kinds; with no model of its own (`key` ''), only that. */
  emit?: { kind: string; every: number; v?: string; size?: number; lift?: number };
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
  /** The DOM art it stands for, when it isn't in this node (a critter's sprite in its mover): hidden once drawn. */
  art?: () => Element | null | undefined;
}
/** A node the 3D island draws as a model: its id, its art key, where it is now. */
export interface Model3 {
  id: string;
  m3: M3;
  x: number;
  z: number;
  lift: number;
  el: HTMLElement;
  shown: boolean;
}

/** The 3D island's game clock: the World steps itself at least this often (ms) while anything moves, drawn or not. */
const SIM_MS = 33;

/** Where a world point is on screen (px from the scene's top-left): the perspective scale (CSS px a unit there over
 *  `view.s`), the ground's foreshortening there (a flat mark's), its distance from the camera, and whether it's in
 *  front of the horizon (nothing is, before the 3D camera is up). */
export interface Screen {
  sx: number;
  sy: number;
  scale: number;
  ground: number;
  depth: number;
  visible: boolean;
}
/** Off screen: before the 3D camera is up. */
const NOWHERE: Screen = { sx: -1e5, sy: -1e5, scale: 1, ground: 1, depth: Infinity, visible: false };

/** The 3D island's camera (world3d/engine.ts): every node is placed through it. Px are from the scene's top-left. */
export interface Proj3 {
  /** A world point `lift` units above the ground under it: where it is on screen, the px a unit across there (an upright
   *  thing's scale), how much an upright `model` is foreshortened there (its height's px over k), the ground's
   *  foreshortening (a flat mark's), its distance from the camera, and whether it's in front of the horizon. */
  at(x: number, z: number, lift: number): { sx: number; sy: number; k: number; up: number; ground: number; depth: number; visible: boolean };
  /** The ground under a screen point, or null in the sky. */
  ground(sx: number, sy: number): { x: number; z: number } | null;
  /** The ground's height where feet stand at (x, z) (world y): `at`'s lift is above it. */
  feet?(x: number, z: number): number;
  /** The horizon's height on screen (px from the top). */
  horizon(): number;
  /** Bumped on every camera move. */
  rev(): number;
  /** Where the camera is now (world z): the move's own, before the frame that writes it into the view. */
  camZ?(): number;
  /** Ask for a frame (the engine runs the World's step in it, then draws). */
  kick(): void;
  /** No frame pending. */
  idle(): boolean;
  /** Drawing paused (a sheet over the island): the World's own clock holds too. */
  paused?(): boolean;
  /** The bulletin board's (docs/board.md "To the 3D lead"): dolly and zoom to look at a rect face-on (its middle x, z on
   *  the ground, y above it, w × h u), framed in the screen between `top` and `bottom` px and filling `fill` of it, over `ms` (600):
   *  the user's one exception to "x centred, nothing but the finger moves the camera"; the finger does nothing while
   *  focused; called again it re-frames from where it is. unfocus() goes back to exactly the view the first focus left. */
  focus?(f: { x: number; z: number; y: number; w: number; h: number; yaw?: number; top?: number; bottom?: number; fill?: number }, ms?: number): Promise<void>;
  unfocus?(ms?: number): Promise<void>;
  /** A three.js object riding on a model instance by its id (the board's face plane with its CanvasTexture), in that
   *  model's own units, placed, turned, scaled and bent with it; null takes it off. */
  attach?(id: string, obj: object | null): void;
}

interface Node extends NodeSpec {
  el: HTMLElement;
  id3: string;
  shown: boolean;
  tf: string;
  op: string;
  clip: string;
  zIndex: number;
  invS: string;
  invY: string;
}

/** The stacking order of what stands over every world thing (a popup, a plate): above any depth. */
export const OVER = 50_000_000;

/** The depth order of feet at (x, z): nearer in front, ties by x (left first). */
const depthAt = (x: number, z: number): number => zIndexAt(z, x, PLAN.z1);

export class World {
  /** The hot state (read every frame). `s` = CSS px per unit (vw / 390); camZ: the 3D camera's z (Island3D writes it in
   *  each frame); left / top: the scene's client offset. */
  readonly view = { camZ: CAMS.mae as number, s: 1, vw: 390, vh: 844, horizon: 0, left: 0, top: 0 };
  /** What components may read reactively: the camera when it settles, the screen's size, the 3D camera up. */
  readonly rest = $state({ z: CAMS.mae as number, s: 1, vw: 390, vh: 844, horizon: 0, ready: false, three: false });
  /** Writes in the last frame and the nodes registered (perf). */
  readonly perf = { writes: 0, nodes: 0, frames: 0 };

  private nodes = new Set<Node>();
  private m3s = new Set<Node>();
  private c3s = new Set<Node>();
  private seq3 = 0;
  private movers = new Set<Node>();
  private dirty = new Set<Node>();
  private moving = 0;
  private lastCam = NaN;
  private win: [number, number] = [-Infinity, Infinity];
  private hook: ((ts: number) => boolean) | null = null;
  /** The game's own clock under the 3D island (docs/decisions.md "The island in 3D"): the engine steps the World in
   *  its frames (the DOM in step with the picture), and this steps it whenever no frame has for SIM_MS while anything
   *  moves, so the island's life keeps real time however slowly (or seldom: the ambience's rate, a software renderer,
   *  the e2e's logic mode) the picture is drawn. Every position is a function of the time, so a step is the same
   *  whichever clock runs it. */
  private lastStep = 0;
  private simTimer: ReturnType<typeof setTimeout> | 0 = 0;
  private simWants = false;
  /** The 3D island's camera (null: not up yet, or gone: nothing is placed). */
  three: Proj3 | null = null;

  /** Draw through the 3D island's camera from now on (null: it's gone). */
  useThree(p: Proj3 | null): void {
    this.three = p;
    this.rest.three = !!p;
    if (p) this.view.horizon = p.horizon();
    this.invalidate();
  }

  /** Fit the camera to a viewport (the island's size and its client offset). */
  fit(vw: number, vh: number, left = 0, top = 0): void {
    const s = vw / 390, v = this.view;
    Object.assign(v, { s, vw, vh, left, top });
    v.horizon = this.three ? this.three.horizon() : 0;
    Object.assign(this.rest, { s, vw, vh, horizon: v.horizon });
    this.invalidate();
  }

  /** Where a world point is on screen: px from the scene's top-left (lift: units above the ground, upright). */
  screenAt(x: number, z: number, lift = 0): Screen {
    if (!this.three) return NOWHERE;
    const q = this.three.at(x, z, lift);
    return { sx: q.sx, sy: q.sy, scale: q.k / this.view.s, ground: q.ground, depth: q.depth, visible: q.visible };
  }

  /** The same in client px (a balloon's speaker, a plate's point). */
  clientAt(x: number, z: number, lift = 0): Pt {
    const p = this.screenAt(x, z, lift);
    return [p.sx + this.view.left, p.sy + this.view.top];
  }

  /** The world point under a screen point (px from the scene's top-left), or null in the sky. */
  worldAt(sx: number, sy: number): { x: number; z: number } | null {
    return this.three?.ground(sx, sy) ?? null;
  }

  /** The world point under a client point (a tap), or null in the sky. */
  worldAtClient(cx: number, cy: number): { x: number; z: number } | null {
    return this.worldAt(cx - this.view.left, cy - this.view.top);
  }

  /** A world point in stage units (screen px · 390 / vw from the scene's top-left): the placement searches. */
  screenU(x: number, z: number, lift = 0): Pt {
    const p = this.screenAt(x, z, lift), k = 390 / this.view.vw;
    return [p.sx * k, p.sy * k];
  }

  /** The ground's height at (x, z) (world y: `screenAt`'s lift is above it); 0 before the 3D camera is up. */
  feetAt(x: number, z: number): number {
    return this.three?.feet?.(x, z) ?? 0;
  }

  /** The perspective scale at a world point. */
  scaleAt(x: number, z: number): number {
    return this.three ? this.three.at(x, z, 0).k / this.view.s : 1;
  }

  /** Whether a world point is on screen (within `pad` px of it) and in front of the horizon. */
  inView(x: number, z: number, pad = 0): boolean {
    const p = this.screenAt(x, z), v = this.view;
    return p.visible && p.sx > -pad && p.sx < v.vw + pad && p.sy > v.horizon - pad && p.sy < v.vh + pad;
  }

  /** The world z at the screen's bottom edge and at the horizon. */
  zRange(): [number, number] {
    const v = this.view;
    return [this.worldAt(v.vw / 2, v.vh)?.z ?? v.camZ - 300, this.worldAt(v.vw / 2, v.horizon + 3)?.z ?? v.camZ + 600];
  }

  // ---- the projector -------------------------------------------------------------------------------------------------

  private hide(n: Node) {
    if (!n.shown) return;
    n.el.style.visibility = 'hidden';
    n.shown = false;
  }
  private show(n: Node) {
    if (n.shown) return;
    n.el.style.visibility = '';
    n.shown = true;
  }

  /** Through the 3D camera (the haze and the horizon are its own); hidden until it's up. */
  private place(n: Node, x: number, z: number, lift: number): void {
    const t = this.three, v = this.view, mode = n.mode ?? 'up';
    if (!t) return this.hide(n);
    if (mode === 'quad') {
      const b = n.box!;
      const c = [t.at(b.x0, b.z1, 0), t.at(b.x1, b.z1, 0), t.at(b.x1, b.z0, 0), t.at(b.x0, b.z0, 0)];
      if (c.every((q) => !q.visible) || c.every((q) => q.sy > v.vh + 2) || c.every((q) => q.sy < v.horizon - 4)) return this.hide(n);
      this.show(n);
      const m = quadMatrix((b.x1 - b.x0) * v.s, (b.z1 - b.z0) * v.s, c.flatMap((q) => [q.sx, q.sy]) as [number, number, number, number, number, number, number, number]);
      const tf = `matrix3d(${m.map((q) => +q.toFixed(6)).join(',')})`;
      if (tf !== n.tf) {
        n.el.style.transform = n.tf = tf;
        this.perf.writes++;
      }
      return;
    }
    const q = t.at(x, z, lift), h = n.h ?? 80, k = q.k / v.s;
    if (!q.visible || q.sy - (h + lift) * q.k > v.vh + 40 || q.sy < -60 || q.sx < -400 || q.sx > v.vw + 400) return this.hide(n);
    this.show(n);
    const X = q.sx.toFixed(1), Y = q.sy.toFixed(1);
    const ky = mode === 'flat' ? k * Math.max(0.02, q.ground) : n.model ? k * q.up : k;
    const tf = ky === k ? `translate(${X}px,${Y}px) scale(${k.toFixed(4)})` : `translate(${X}px,${Y}px) scale(${k.toFixed(4)},${ky.toFixed(4)})`;
    if (tf !== n.tf) {
      n.el.style.transform = n.tf = tf;
      this.perf.writes++;
    }
    if (n.op) n.el.style.opacity = n.op = '';
    if (n.clip) n.el.style.clipPath = n.clip = '';
    if (n.inv) {
      const iv = (1 / k).toFixed(3);
      if (iv !== n.invS) n.el.style.setProperty('--inv', (n.invS = iv));
      // (a model's node is squashed upright: its true px up there, for a tap area's least height)
      const iy = n.model ? (1 / ky).toFixed(3) : '';
      if (iy !== n.invY) n.el.style.setProperty('--inv-y', (n.invY = iy) || null);
    }
  }

  private zOf(n: Node, x: number, z: number): void {
    if (n.zi === null || n.mode === 'quad') return;
    const zi = n.zi ?? depthAt(x, z + (n.dz ?? 0));
    if (zi !== n.zIndex) {
      n.el.style.zIndex = String((n.zIndex = zi));
      this.perf.writes++;
    }
  }

  private placeNode(n: Node): void {
    if (n.live) {
      const [x, z, lift] = n.live();
      this.zOf(n, x, z);
      return this.place(n, x, z, lift ?? n.lift ?? 0);
    }
    if (!n.always && n.mode !== 'quad' && (n.z < this.win[0] || n.z > this.win[1])) return this.hide(n);
    this.place(n, n.x, n.z, n.lift ?? 0);
  }

  /** One frame of the projector: the scene's hook, then what moved (everything when the camera did). True: more
   *  frames wanted (something moves). The 3D island's engine runs it in its own frame, before it draws. */
  step(ts: number): boolean {
    this.lastStep = performance.now();
    this.perf.writes = 0;
    this.perf.frames++;
    const more = this.hook?.(ts) ?? false;
    const v = this.view;
    const cam = this.three ? this.three.rev() : NaN;
    if (cam !== this.lastCam) {
      this.lastCam = cam;
      if (this.three) v.horizon = this.three.horizon();
      // (the camera's own z: a step of the game clock's between an instant move, its rev bumped, and the engine's frame
      // that writes the view's camZ placed every node by the old window, and nothing past it showed till the next move)
      const cz = this.three?.camZ?.() ?? v.camZ;
      this.win = [cz - BEHIND, cz + AHEAD];
      for (const n of this.nodes) this.placeNode(n);
      this.dirty.clear();
    } else {
      for (const n of this.dirty) this.placeNode(n);
      this.dirty.clear();
      for (const n of this.movers) this.placeNode(n);
    }
    this.perf.nodes = this.nodes.size;
    const going = more || this.moving > 0;
    this.simWants = going;
    if (going) this.simLater();
    return going;
  }

  /** The game clock's next step, SIM_MS on (it waits while the engine's frames step it). */
  private simLater(): void {
    if (this.simTimer || !this.three) return;
    this.simTimer = setTimeout(this.simTick, SIM_MS);
  }
  private simTick = () => {
    this.simTimer = 0;
    const t = this.three;
    if (!t || !this.simWants || (typeof document !== 'undefined' && document.hidden) || t.paused?.()) return;
    if (performance.now() - this.lastStep >= SIM_MS - 2) this.step(performance.now());
    else this.simLater();
  };

  /** Ask for one frame (a camera move, a node changed); none before the 3D camera is up. */
  kick(): void {
    if (!this.three) return;
    // (a frame for the picture; the game clock steps it meanwhile if the frame is slow to come)
    this.simWants = true;
    this.simLater();
    this.three.kick();
  }

  /** Re-place everything on the next frame (a resize, a new camera). */
  invalidate(): void {
    this.lastCam = NaN;
    for (const n of this.nodes) n.tf = '';
    this.kick();
  }

  /** The scene's per-frame hook (true keeps the frames coming: someone moving). */
  onTick(fn: ((ts: number) => boolean) | null): void {
    this.hook = fn;
  }

  /** Something started moving: frames run until the returned stop is called. */
  moveStart(): () => void {
    this.moving++;
    this.kick();
    let done = false;
    return () => {
      if (done) return;
      done = true;
      this.moving = Math.max(0, this.moving - 1);
    };
  }

  /** The nodes the 3D island draws as models, where they are now (Island3D reads them each frame). */
  *models3(): Generator<Model3> {
    for (const n of this.m3s) {
      const [x, z, lift] = n.live ? n.live() : [n.x, n.z, n.lift];
      yield { id: n.m3!.id ?? n.id3, m3: n.m3!, x, z, lift: lift ?? n.lift ?? 0, el: n.el, shown: n.shown };
    }
  }

  /** The nodes the 3D island draws as cards. */
  *cards3(): Generator<Card3> {
    for (const n of this.c3s) {
      const [x, z] = n.live ? n.live() : [n.x, n.z];
      yield { id: n.id3, c3: n.c3!, x, z, shown: n.shown };
    }
  }

  /** No frame pending (e2e and perf: nothing runs when still). */
  idle(): boolean {
    return this.three ? this.three.idle() : true;
  }

  /** Stop (the scene unmounts). */
  stop(): void {
    if (this.simTimer) clearTimeout(this.simTimer);
    this.simTimer = 0;
    this.hook = null;
    this.three = null;
  }

  /** Register an element as a world node: `{@attach world.at({ x, z, ... })}` (re-attached when its spec changes). */
  at(spec: NodeSpec): (el: HTMLElement) => () => void {
    return (el: HTMLElement) => {
      // (a re-attach, its spec changed, finds the element as the last node left it: what's written there, so the first
      // place writes what differs, a fade or a cut included)
      const n: Node = { ...spec, el, id3: `m${++this.seq3}`, shown: el.style.visibility !== 'hidden', tf: '', op: el.style.opacity, clip: el.style.clipPath, zIndex: NaN, invS: '', invY: '' };
      el.style.position = 'absolute';
      el.style.left = '0';
      el.style.top = '0';
      // the time of day's tint, at the source (IslandScene): every world node but a light and what stands over
      // everything (a popup's anchor)
      const lit = !!n.light || (n.zi ?? 0) >= OVER;
      el.classList.toggle('wn-lit', lit);
      el.classList.toggle('wn', !lit);
      if (n.mode === 'quad' && n.box) {
        el.style.width = `calc(${n.box.x1 - n.box.x0} * var(--u))`;
        el.style.height = `calc(${n.box.z1 - n.box.z0} * var(--u))`;
        el.style.transformOrigin = '0 0';
      }
      // a node the 3D island draws as a model: its art hidden there from its first frame (IslandScene's [data-m3]), till
      // the 3D island says it has no model for it (m3off): never a flash of the 2D sprite as it mounts (a weed coming
      // into view)
      el.toggleAttribute('data-m3', !!n.m3 && !n.m3.art);
      this.nodes.add(n);
      if (n.m3) this.m3s.add(n);
      if (n.c3) this.c3s.add(n);
      if (n.live) this.movers.add(n);
      if (n.mode !== 'quad') this.zOf(n, n.x, n.z);
      // placed at once when the camera is known (no flash at the origin)
      if (this.rest.ready) this.placeNode(n);
      else this.hide(n);
      this.dirty.add(n);
      this.kick();
      return () => {
        this.nodes.delete(n);
        this.m3s.delete(n);
        this.c3s.delete(n);
        this.movers.delete(n);
        this.dirty.delete(n);
      };
    };
  }
}

const KEY = Symbol('world');
let liveWorld: World | null = null;

/** The scene's World for its children (IslandScene calls this once). */
export function provideWorld(w: World): void {
  setContext(KEY, w);
  liveWorld = w;
}
/** The surrounding scene's World (a component of the island). */
export const useWorld = (): World => getContext<World>(KEY);
/** The live island's World, for the pure modules (null before it mounts / in tests). */
export const live = (): World | null => liveWorld;
/** Forget it (the live scene unmounts). */
export function dropLive(w: World): void {
  if (liveWorld === w) liveWorld = null;
}
