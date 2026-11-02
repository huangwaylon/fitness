// The world's camera and projector (docs/design.md "World"). Each IslandScene owns one World (the gallery's still
// thumbnails too); the live island's is also `live()` for the pure modules (the walk, the placement searches). The
// scroller's scrollTop is the camera (camZ); every world thing is a node registered with its feet at world (x, z), and
// one tick places them all through roll.ts project(): an upright billboard (`up`: translate + scale, faded near the
// horizon, sunk behind it), a flat ground mark (`flat`: also squashed by the ground's foreshortening) or a ground quad
// (`quad`: a box of the plan bent onto the log by a matrix3d, like the ground bands). The tick runs on a scroll frame,
// while something moves (a node with a `live` position) and once after a change; never when still. Nothing in the hot
// path is reactive: `rest` only carries what components need to know when the camera is still.
import { getContext, setContext } from 'svelte';
import { ROLL_DEFAULTS, horizonAhead, horizonUp, project, quadMatrix, radiusFor, sinkBelow, unproject, zIndexAt, type Projected, type RollParams } from './roll.ts';
import { AHEAD, BEHIND, CAMS, PIVOT, PLAN, SKY, TILT, type Pt } from './world.ts';

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
}

interface Node extends NodeSpec {
  el: HTMLElement;
  shown: boolean;
  tf: string;
  op: string;
  clip: string;
  zIndex: number;
  invS: string;
}

/** The stacking order of what stands over every world thing (a popup, a held-up item's plate): above any depth. */
export const OVER = 50_000_000;

/** The depth order of feet at (x, z): nearer in front, ties by x (left first). */
const depthAt = (x: number, z: number): number => zIndexAt(z, x, PLAN.z1);

export class World {
  readonly P: RollParams = { ...ROLL_DEFAULTS, tilt: TILT, R: 756 };
  /** The hot state (read every frame). `s` = CSS px per unit at the pivot (vw / 390); left / top: the scene's client
   *  offset. */
  readonly view = { camZ: CAMS.mae as number, s: 1, vw: 390, vh: 844, pivot: 844 * PIVOT, horizon: 844 * SKY, left: 0, top: 0 };
  /** What components may read reactively: the camera when it settles, the screen's size. */
  readonly rest = $state({ z: CAMS.mae as number, s: 1, vw: 390, vh: 844, horizon: 844 * SKY, ready: false });
  /** Writes in the last frame and the nodes registered (perf). */
  readonly perf = { writes: 0, nodes: 0, frames: 0 };

  private nodes = new Set<Node>();
  private movers = new Set<Node>();
  private dirty = new Set<Node>();
  private raf = 0;
  private moving = 0;
  private lastCam = NaN;
  private win: [number, number] = [-Infinity, Infinity];
  private hook: ((ts: number) => boolean) | null = null;
  private ground: (() => void) | null = null;

  /** Fit the camera to a viewport (the scroller's size and its client offset). */
  fit(vw: number, vh: number, left = 0, top = 0): void {
    const s = vw / 390, v = this.view;
    Object.assign(v, { s, vw, vh, left, top, pivot: vh * PIVOT });
    this.P.R = Math.round(radiusFor(((PIVOT - SKY) * vh) / s, this.P.tilt, this.P.curve));
    v.horizon = v.pivot - horizonUp(this.P) * s;
    Object.assign(this.rest, { s, vw, vh, horizon: v.horizon });
    this.invalidate();
  }

  /** Where a world point is on screen: px from the scene's top-left (lift: units above the ground, upright). */
  screenAt(x: number, z: number, lift = 0): Projected & { sx: number; sy: number } {
    const v = this.view, pr = project(x, z, v.camZ, this.P);
    return { ...pr, sx: v.vw / 2 + pr.x * v.s, sy: v.pivot + pr.y * v.s - lift * pr.scale * v.s };
  }

  /** The same in client px (a balloon's speaker, a plate's point). */
  clientAt(x: number, z: number, lift = 0): Pt {
    const p = this.screenAt(x, z, lift);
    return [p.sx + this.view.left, p.sy + this.view.top];
  }

  /** The world point under a screen point (px from the scene's top-left), or null in the sky. */
  worldAt(sx: number, sy: number): { x: number; z: number } | null {
    const v = this.view;
    const w = unproject((sx - v.vw / 2) / v.s, (v.pivot - sy) / v.s, v.camZ, this.P);
    return w && { x: w.x, z: w.z };
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

  /** The perspective scale at a world point. */
  scaleAt(x: number, z: number): number {
    return project(x, z, this.view.camZ, this.P).scale;
  }

  /** Whether a world point is on screen (within `pad` px of it) and in front of the horizon. */
  inView(x: number, z: number, pad = 0): boolean {
    const p = this.screenAt(x, z), v = this.view;
    return p.visible && p.theta < (this.P.tilt - 2) * (Math.PI / 180) && p.sx > -pad && p.sx < v.vw + pad && p.sy > v.horizon - pad && p.sy < v.vh + pad;
  }

  /** The world z at the screen's bottom edge and at the horizon. */
  zRange(): [number, number] {
    const v = this.view, near = this.worldAt(v.vw / 2, v.vh)?.z ?? v.camZ - 300;
    return [near, v.camZ + horizonAhead(this.P)];
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

  private place(n: Node, x: number, z: number, lift: number): void {
    const v = this.view, { s, vw, vh, pivot } = v, mode = n.mode ?? 'up';
    if (mode === 'quad') return this.placeQuad(n);
    const pr = project(x, z, v.camZ, this.P);
    const h = n.h ?? 80;
    const sy = pivot + pr.y * s - lift * pr.scale * s;
    const sink = mode === 'up' ? sinkBelow(pr, this.P) : 0;
    if (!pr.visible || pr.fade <= 0.01 || sy - (h + lift) * s * pr.scale > vh + 40 || sy < -60 || (mode === 'up' && sink >= h + lift)) return this.hide(n);
    this.show(n);
    const k = pr.scale, X = (vw / 2 + pr.x * s).toFixed(1), Y = sy.toFixed(1);
    const tf = mode === 'flat' ? `translate(${X}px,${Y}px) scale(${k.toFixed(4)},${(k * Math.max(0.02, pr.ground)).toFixed(4)})` : `translate(${X}px,${Y}px) scale(${k.toFixed(4)})`;
    if (tf !== n.tf) {
      n.el.style.transform = n.tf = tf;
      this.perf.writes++;
    }
    const op = pr.fade < 1 ? pr.fade.toFixed(2) : '';
    if (op !== n.op) n.el.style.opacity = n.op = op;
    if (mode === 'up') {
      const cut = sink - lift;
      const clip = cut > 0.3 ? `inset(-4000px -4000px ${(cut * s).toFixed(1)}px -4000px)` : '';
      if (clip !== n.clip) n.el.style.clipPath = n.clip = clip;
    }
    if (n.inv) {
      const iv = (1 / k).toFixed(3);
      if (iv !== n.invS) n.el.style.setProperty('--inv', (n.invS = iv));
    }
  }

  private placeQuad(n: Node): void {
    const b = n.box!, v = this.view, { s, vw, pivot } = v;
    const zh = v.camZ + horizonAhead(this.P) - 1;
    if (b.z0 >= zh) return this.hide(n);
    const z1 = Math.min(b.z1, zh);
    const near = project(this.P.cx, b.z0, v.camZ, this.P), far = project(this.P.cx, z1, v.camZ, this.P);
    const y0 = pivot + near.y * s, y1 = pivot + far.y * s;
    if (y1 > v.vh + 2 || y0 < v.horizon - 4 || !far.visible) return this.hide(n);
    this.show(n);
    const xs = (x: number, pr: Projected) => vw / 2 + (x - this.P.cx) * pr.scale * s;
    const W = (b.x1 - b.x0) * s, H = (b.z1 - b.z0) * s, cut = (b.z1 - z1) / (b.z1 - b.z0);
    // the far part past the horizon is cut: only the part in front of it is mapped (the box shifted up by the cut)
    const m = quadMatrix(W, H * (1 - cut), [xs(b.x0, far), y1, xs(b.x1, far), y1, xs(b.x1, near), y0, xs(b.x0, near), y0]);
    const tf = `matrix3d(${m.map((q) => +q.toFixed(6)).join(',')})${cut > 0 ? ` translateY(${(-H * cut).toFixed(1)}px)` : ''}`;
    if (tf !== n.tf) {
      n.el.style.transform = n.tf = tf;
      this.perf.writes++;
    }
    const clip = cut > 0 ? `inset(${(H * cut).toFixed(1)}px 0 0 0)` : '';
    if (clip !== n.clip) n.el.style.clipPath = n.clip = clip;
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

  private tick = (ts: number) => {
    this.raf = 0;
    this.perf.writes = 0;
    this.perf.frames++;
    const more = this.hook?.(ts) ?? false;
    const v = this.view;
    if (v.camZ !== this.lastCam) {
      this.lastCam = v.camZ;
      this.win = [v.camZ - BEHIND, v.camZ + AHEAD];
      this.ground?.();
      for (const n of this.nodes) this.placeNode(n);
      this.dirty.clear();
    } else {
      for (const n of this.dirty) this.placeNode(n);
      this.dirty.clear();
      for (const n of this.movers) this.placeNode(n);
    }
    this.perf.nodes = this.nodes.size;
    if (more || this.moving > 0) this.raf = requestAnimationFrame(this.tick);
  };

  /** Ask for one frame (a scroll, a node changed). */
  kick(): void {
    if (!this.raf && typeof requestAnimationFrame !== 'undefined') this.raf = requestAnimationFrame(this.tick);
  }

  /** Re-place everything on the next frame (a resize, a new camera). */
  invalidate(): void {
    this.lastCam = NaN;
    for (const n of this.nodes) n.tf = '';
    this.kick();
  }

  /** The scene's per-frame hook (reads the scroller into view.camZ; true keeps ticking: a camera follow). */
  onTick(fn: ((ts: number) => boolean) | null): void {
    this.hook = fn;
  }

  /** The ground bands: placed on each camera move, before the nodes. */
  onGround(fn: (() => void) | null): void {
    this.ground = fn;
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

  /** No frame pending (e2e and perf: nothing runs when still). */
  idle(): boolean {
    return this.raf === 0;
  }

  /** Stop (the scene unmounts). */
  stop(): void {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.hook = null;
    this.ground = null;
  }

  /** Register an element as a world node: `{@attach world.at({ x, z, ... })}` (re-attached when its spec changes). */
  at(spec: NodeSpec): (el: HTMLElement) => () => void {
    return (el: HTMLElement) => {
      // (a re-attach, its spec changed, finds the element as the last node left it: what's written there, so the first
      // place writes what differs, a fade or a cut included)
      const n: Node = { ...spec, el, shown: el.style.visibility !== 'hidden', tf: '', op: el.style.opacity, clip: el.style.clipPath, zIndex: NaN, invS: '' };
      el.style.position = 'absolute';
      el.style.left = '0';
      el.style.top = '0';
      // the time of day's tint, at the source (IslandScene): every world node but a light and what stands over
      // everything (a held-up catch, a popup's anchor)
      const lit = !!n.light || (n.zi ?? 0) >= OVER;
      el.classList.toggle('wn-lit', lit);
      el.classList.toggle('wn', !lit);
      if (n.mode === 'quad' && n.box) {
        el.style.width = `calc(${n.box.x1 - n.box.x0} * var(--u))`;
        el.style.height = `calc(${n.box.z1 - n.box.z0} * var(--u))`;
        el.style.transformOrigin = '0 0';
      }
      this.nodes.add(n);
      if (n.live) this.movers.add(n);
      if (n.mode !== 'quad') this.zOf(n, n.x, n.z);
      // placed at once when the camera is known (no flash at the origin)
      if (this.rest.ready) this.placeNode(n);
      else this.hide(n);
      this.dirty.add(n);
      this.kick();
      return () => {
        this.nodes.delete(n);
        this.movers.delete(n);
        this.dirty.delete(n);
      };
    };
  }
}

const KEY = Symbol('world');
let liveWorld: World | null = null;

/** The scene's World for its children (IslandScene calls this once). `isLive`: the interactive island. */
export function provideWorld(w: World, isLive: boolean): void {
  setContext(KEY, w);
  if (isLive) liveWorld = w;
}
/** The surrounding scene's World (a component of the island). */
export const useWorld = (): World => getContext<World>(KEY);
/** The live island's World, for the pure modules (null before it mounts / in tests). */
export const live = (): World | null => liveWorld;
/** Forget it (the live scene unmounts). */
export function dropLive(w: World): void {
  if (liveWorld === w) liveWorld = null;
}
