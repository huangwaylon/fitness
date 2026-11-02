<script lang="ts">
  // The island in 3D (docs/design.md "World", docs/decisions.md "The island in 3D"): IslandScene's drawing when
  // `?island=3d` / せってい's switch says so (store/islandRender.svelte.ts). A canvas behind the island's DOM: NH's
  // models, the ground and the water, the lights (engine.ts), the villagers as cards. The DOM island still runs over it,
  // every node placed through this camera (camera.svelte.ts Proj3): its taps, popups, balloons and marks; its art goes
  // invisible where the canvas draws the thing (IslandScene's [data-r3] rules). The finger is gestures.ts': one finger
  // scrolls along the island (z only, a free fling), two pinch the zoom; nothing else moves the camera.
  // Its own chunk with three.js: the 2D island never loads it.
  import { onMount, untrack } from 'svelte';
  import { asset } from '$app/paths';
  import { art, artUrl, villagerArt } from '#lib/art.ts';
  import { resolveLook } from '#lib/villagers/look.ts';
  import type { Who } from '#lib/types.ts';
  import type { VillagerActor } from '#lib/ui-state/cast.ts';
  import type { Season } from '#lib/ui-state/theme.svelte.ts';
  import { actors, livePos } from '../motion/director.svelte.ts';
  import type { Proj3, World } from '../island/camera.svelte.ts';
  import { CAMPSITE, GOAL_TREES, SEAT_DROP, SHORE_Z, TREE_H } from '../island/world.ts';
  import { GLOW_AT, VILLAGER, type Tod } from '../island/scene.ts';
  import { LAMP_GLOW, type Piece } from '../island/fixedDecor.ts';
  import type { Scenery } from '../island/world.ts';
  import { listen3d } from '../island/echo3d.ts';
  import TERRAIN from '../island/terrain.json' with { type: 'json' };
  import PLACES from '../island/models.json' with { type: 'json' };
  import { createIsland, type Ground, type Island3, type Options } from './engine.ts';
  import { WORLD_GROUND } from './ground.ts';
  import { island, type Inst, type Standin } from './layout3d.ts';
  import { assetFor } from './assets.ts';
  import { modelBounds } from './models3d.ts';
  import { attachGestures } from './gestures.ts';
  import { idlePose, motionPose } from './motion3d.ts';
  import type { CardSpec } from './cards.ts';
  import type { LampSpot } from './lights.ts';
  import type { Object3D } from 'three';

  /** A villager on this island now (IslandScene's cast). */
  export interface Cast {
    id: VillagerActor;
    person: Who;
    villager: string | null;
    side: 'left' | 'right';
    /** On the island and out of the tent. */
    shown: boolean;
    seated: boolean;
    rep: boolean;
  }

  interface Props {
    world: World;
    scene: HTMLElement;
    season: Season;
    foliage: string;
    month: number;
    tod: Tod;
    /** The day's scenery (its swaps) and the fixed decor's pieces (Scenery's own). */
    scenery: readonly Scenery[];
    pieces: readonly Piece[];
    /** Today's hybrid flower in its spot (care.ts). */
    hybrid: { id: string; flower: string } | null;
    /** A wet day's darkening (0 … 1). */
    wet: number;
    cast: () => readonly Cast[];
    /** The finger may move the camera (no sheet over the island, not decorating). */
    enabled: () => boolean;
    /** Where the camera opens (back from the tent: where it was), or null: まえ. */
    start: number | null;
    /** The camera moved (a scroll's frame: the balloons hold, the rest of the island learns where it settled). */
    onscroll: () => void;
    /** The horizon's height on screen changed (the sky's band follows it). */
    onhorizon: (px: number) => void;
    /** The engine failed to start (no WebGL): the scene draws in 2D. */
    onfail: () => void;
    /** The camera is up and the island's models are in (once). */
    onready: () => void;
    /** What the camera's ends frame (the island layout's, once it lands; world.ts's today): まえ's shoreline and the
     *  canopy that must clear the HUD there, おく's landmark (its feet half way down the screen, its top clear). */
    /** The ground: world.ts's baked heightfield today, the layout's buildGround() once it lands. */
    ground?: Ground;
    ends?: { shore: number; canopy: readonly [number, number, number]; back: readonly [number, number, number] };
  }
  let { world, scene, season, foliage, month, tod, scenery, pieces, hybrid, wet, cast, enabled, start, onscroll, onhorizon, onfail, onready, ground = WORLD_GROUND,
    ends = { shore: SHORE_Z, canopy: [GOAL_TREES.A[0], GOAL_TREES.A[1], TREE_H], back: [CAMPSITE.x, CAMPSITE.z, CAMPSITE.h] } }: Props = $props();

  let canvas = $state<HTMLCanvasElement>();
  let eng = $state.raw<Island3 | null>(null);
  let loaded = $state(false);

  const q = new URLSearchParams(location.search);
  const num = (k: string) => (q.get(k) !== null && q.get(k) !== '' && Number.isFinite(Number(q.get(k))) ? Number(q.get(k)) : null);

  /** The ground's look (WorldGround's rule): the season's, the petals' or the fallen leaves' weeks. */
  function groundUrls(): string[] {
    const T = TERRAIN as { chunks: number; seasons: string[]; bytes?: Record<string, number[]> };
    const look = season === 'spring' && foliage === 'blossom' ? 'spring-petals' : season === 'autumn' && foliage === 'fall' ? 'autumn-leaves' : season;
    const ss = T.seasons.includes(look) ? look : season;
    return Array.from({ length: T.chunks }, (_, c) => `${asset(`terrain/${ss}/${c}.webp` as Parameters<typeof asset>[0])}?v=${T.bytes?.[ss]?.[c] ?? 0}`);
  }

  // ---- what has no model yet: a card of today's art, standing on its feet point (island/models.json) ----
  const P = PLACES as unknown as Record<string, { ax: number; ay: number }>;
  function artCard(key: string, h: number): Omit<CardSpec, 'x' | 'z'> | null {
    const a = art(key), url = artUrl(key);
    if (!a || !url) return null;
    const box = a.box;
    const aspect = box ? box[2] / box[3] : a.w / a.h;
    const crop = box ? ([box[0] / a.w, box[1] / a.h, box[2] / a.w, box[3] / a.h] as const) : undefined;
    const p = P[key];
    return { url, aspect, h, crop, ax: p?.ax, foot: p ? 1 - p.ay : 0 };
  }
  let standinIds: string[] = [];
  function standins(list: readonly Standin[]) {
    if (!eng) return;
    const ids = new Set<string>();
    for (const s of list) {
      const c = artCard(s.key, s.h);
      if (!c) continue;
      ids.add(`s:${s.id}`);
      eng.cards.set(`s:${s.id}`, { ...c, x: s.x, z: s.z, flip: s.flip, cast: true, shadow: 0 });
    }
    for (const id of standinIds) if (!ids.has(id)) eng.cards.set(id, null);
    standinIds = [...ids];
  }
  /** A stand-in lamp's light (a seasonal lamp from the decor: its share of its height, as Scenery's glow). */
  function standinLamps(list: readonly Standin[]): LampSpot[] {
    const out: LampSpot[] = [];
    for (const s of list) {
      const at = GLOW_AT[s.key] ?? LAMP_GLOW[s.key] ?? (s.key === 'deco/illumi-tree' ? 0.5 : 0);
      if (!at) continue;
      const gy = 'group' in ground ? ground.heightAt(s.x, s.z) : ground.height(s.x, s.z);
      out.push({ id: `s:${s.id}`, x: s.x, z: s.z - 1, y: gy + s.h * at, gy, kind: 'lamp', colour: 0xffd38a, glow: 12, pool: 34 });
    }
    return out;
  }

  // ---- the villagers: cards of their renders (the director's state: where, which way, its motion) ----
  const motionAt: Partial<Record<VillagerActor, { n: number; t0: number }>> = {};
  const PULL_MS = 4200;
  /** The pull-up bar's three reps (IslandScene's keyframes): up at 8–16 % and 40–48 % of the cycle. */
  function pullLift(t: number): number {
    const k = (t % PULL_MS) / PULL_MS, up = (a: number, b: number, c: number, d: number) => (k < a || k > d ? 0 : k < b ? (k - a) / (b - a) : k <= c ? 1 : (d - k) / (d - c));
    return 9 * Math.max(up(0, 0.08, 0.16, 0.24), up(0.32, 0.4, 0.48, 0.56));
  }
  function villagerCards(t: number): boolean {
    if (!eng) return false;
    let moving = false;
    const swaying = scene.hasAttribute('data-show');
    for (const c of cast()) {
      const a = actors[c.id], look = resolveLook({ villager: c.villager, person: c.person });
      const base = c.shown ? artCard(villagerArt(look.id) ?? '', VILLAGER.h) : null;
      if (!base) {
        eng.cards.set(`v:${c.id}`, null);
        continue;
      }
      const m = motionAt[c.id];
      if (!m || m.n !== a.motionN) motionAt[c.id] = { n: a.motionN, t0: t };
      const mp = a.motion ? motionPose(a.motion, t - motionAt[c.id]!.t0) : null;
      const ip = idlePose(t, a.walking, a.asleep, a.stepMs || 640, c.id === 'partner' ? 1.2 : c.id === 'third' ? 0.6 : 0);
      if (mp || a.walking) moving = true;
      const f = a.face, wantRight = f === 'l' ? false : f === 'r' ? true : f === 'in' ? c.side === 'left' : null;
      const flip = !(wantRight === null || look.noMirror || wantRight === look.looksRight);
      const [x, z] = livePos(c.id);
      const sway = swaying ? Math.sin(t / 420 + (c.id === 'partner' ? Math.PI : 0)) * 0.05 : 0;
      eng.cards.set(`v:${c.id}`, {
        ...base, x, z, flip, shadow: 17,
        lift: (mp?.lift ?? 0) + ip.lift + (c.seated ? -SEAT_DROP * 0.6 : 0) + (c.rep ? pullLift(t) : 0),
        squash: (mp?.squash ?? 0) + ip.squash, tilt: (mp?.tilt ?? 0) + ip.tilt + sway
      });
    }
    return moving;
  }

  // ---- what comes and goes (a find, a weed, a decoration, a fallen fruit): the DOM nodes with an `m3` key ----
  interface Live3 {
    m: string;
    on: boolean;
    x: number;
    z: number;
    lift: number;
    yaw: number;
    grey: number;
  }
  const live3 = new Map<string, Live3>();
  const marked = new WeakMap<HTMLElement, boolean>();
  let lamps3: LampSpot[] = [];
  function mirror(e: Island3) {
    const winter = season === 'winter', seen = new Set<string>(), add: Inst[] = [];
    for (const n of world.models3()) {
      const a = assetFor(n.m3.key, winter);
      if (marked.get(n.el) !== !!a) {
        marked.set(n.el, !!a);
        n.el.classList.toggle('m3on', !!a);
      }
      if (!a) continue;
      seen.add(n.id);
      const b = modelBounds(a.m);
      // a flier's model hangs by its middle at the node's height; the rest stand on their feet
      const lift = n.lift - (a.anchor === 'centre' && b ? ((b.min[1] + b.max[1]) / 2) * a.s : 0);
      const now: Live3 = { m: a.m, on: n.shown && !n.m3.off, x: n.x, z: n.z, lift, yaw: (n.m3.yaw ?? 0) + ((a.yaw ?? 0) * Math.PI) / 180, grey: n.m3.grey ?? 0 };
      const was = live3.get(n.id);
      if (!was || was.m !== now.m) add.push({ id: n.id, model: a.m, x: now.x, z: now.z, lift: now.lift, scale: a.s, yaw: now.yaw });
      if (!was || was.m !== now.m || was.on !== now.on || was.x !== now.x || was.z !== now.z || was.lift !== now.lift || was.yaw !== now.yaw || was.grey !== now.grey)
        e.things.over(n.id, { hidden: !now.on, x: now.x, z: now.z, lift: now.lift, yaw: now.yaw, grey: now.grey });
      live3.set(n.id, now);
    }
    const gone = [...live3.keys()].filter((id) => !seen.has(id));
    for (const id of gone) live3.delete(id);
    if (gone.length) void e.things.remove(gone).then(() => e.glows(lamps3));
    if (add.length) void e.things.set(add).then(() => e.glows(lamps3));
  }

  // ---- the island's day: its models and stand-ins ----
  let placed = '';
  $effect(() => {
    const e = eng;
    if (!e) return;
    const day = { season, foliage, month, scenery, pieces, hybrid, fruit: false };
    const sig = `${season}|${foliage}|${month}|${hybrid?.id}:${hybrid?.flower}|${scenery.map((s) => s.id + s.key).join()}|${pieces.map((p) => p.id + p.key).join()}`;
    if (sig === placed) return;
    placed = sig;
    untrack(() => {
      const { insts, standins: st } = island(day);
      void e.place(insts).then(() => {
        if (!loaded) queueMicrotask(onready);
        loaded = true;
      });
      standins(st);
      e.glows((lamps3 = standinLamps(st)));
      e.groundLook(groundUrls());
    });
  });
  $effect(() => {
    const e = eng, t3 = tod === 'night' ? 'night' : tod === 'dusk' || tod === 'dawn' ? 'dusk' : 'day';
    const w = wet;
    if (!e) return;
    untrack(() => {
      const hz = getComputedStyle(scene).getPropertyValue('--sky-hz').trim();
      e.tod(t3, w, hz);
    });
  });

  /** Put the camera at a world z at once (the e2e, IslandScene's goTo). */
  export function go(z: number, k?: number) {
    eng?.go(z, k);
  }
  /** The camera's two ends (まえ, おく). */
  export function limits(): { min: number; max: number } {
    return eng?.limits() ?? { min: 30, max: 1000 };
  }

  /** The camera's ends for this screen (IslandScene's 2D rule, through this camera): まえ puts the shoreline SHORE_AT down
   *  the screen (unless the goal trees' canopies would go under the HUD), おく the campsite's feet CAMP_AT down it with
   *  its top clear of the HUD. */
  const SHORE_AT = 0.83, CAMP_AT = 0.5, CLEAR = 16;
  function fitEnds(e: Island3) {
    const v = e.view(), H = canvas?.clientHeight ?? 0;
    if (!H) return;
    const hud = Math.max(0, (document.querySelector('.ribbon-wrap')?.getBoundingClientRect().bottom ?? 0) - scene.getBoundingClientRect().top);
    e.setLimits(ends.shore - 400, ends.back[1] + 700);
    const syAt = (x: number, z: number, lift: number) => (cz: number) => (e.go(cz, 1), e.at(x, z, lift).sy);
    const solve = (f: (cz: number) => number, target: number, lo: number, hi: number) => {
      for (let i = 0; i < 28; i++) {
        const mid = (lo + hi) / 2;
        if (f(mid) < target) lo = mid;
        else hi = mid;
      }
      return Math.round((lo + hi) / 2);
    };
    const { shore, canopy: [cx, cz, ch], back: [bx, bz, bh] } = ends;
    const lo = shore - 400, hi = bz + 700;
    const min = Math.max(solve(syAt(195, shore, 0), H * SHORE_AT, lo, shore + 530), solve(syAt(cx, cz, ch), hud + CLEAR, lo, cz + 400));
    const max = Math.max(solve(syAt(bx, bz, 0), H * CAMP_AT, min, hi), solve(syAt(bx, bz, bh), hud + CLEAR, min, hi));
    e.setLimits(min, max);
    e.go(v.camZ, v.zoom);
  }

  onMount(() => {
    if (!canvas) return;
    let e: Island3;
    try {
      e = createIsland(canvas, ground, {
        dpr: num('dpr') ?? Math.min(2, window.devicePixelRatio || 1),
        water: q.get('water') !== '0',
        shadows: q.get('shadows') !== '0',
        cap: num('cap') === 30 ? 30 : 60,
        aa: q.get('aa') !== '0'
      });
    } catch (err) {
      console.warn('world3d', err);
      onfail();
      return;
    }
    eng = e;
    fitEnds(e);
    e.go(start ?? e.limits().min);
    const proj: Proj3 = {
      at: (x, z, lift) => e.at(x, z, lift), ground: (sx, sy) => e.groundAt(sx, sy), horizon: () => e.horizon(),
      rev: () => e.rev(), kick: () => e.kick(), idle: () => e.idle(),
      focusOn: (t, o) => e.focusOn(t, o), restore: (ms) => e.restore(ms), attach: (obj, at) => e.attach(obj as Object3D, at)
    };
    world.useThree(proj);
    let camWas = NaN, horizonWas = NaN;
    e.onFrame((t) => {
      const z = e.view().camZ;
      world.view.camZ = z;
      if (z !== camWas) {
        if (!Number.isNaN(camWas)) onscroll();
        camWas = z;
      }
      const hz = e.horizon();
      if (!(Math.abs(hz - horizonWas) <= 0.5)) onhorizon((horizonWas = hz));
      const more = world.step(t);
      mirror(e);
      return villagerCards(t) || more;
    });
    // the DOM island's reactions on its (invisible) art: the model, or the stand-in's card, moves too
    listen3d((id, k) => {
      if (e.things.has(id)) e.things.jiggle(id, k);
      else e.cards.jiggle(`s:${id}`, k);
    });
    const off = attachGestures(scene, e, { enabled, top: () => scene.getBoundingClientRect().top });
    const ro = new ResizeObserver(() => {
      e.resize();
      fitEnds(e);
      world.invalidate();
    });
    ro.observe(canvas);
    const W = window as unknown as { __world3d?: unknown };
    W.__world3d = {
      stats: () => e.stats(), view: () => e.view(), limits: () => e.limits(), loaded: () => loaded && !e.stats().loading,
      go: (z: number, k?: number) => e.go(z, k), pan: (dy: number) => (e.touching(true), e.pan(dy), e.touching(false)),
      zoom: (f: number) => e.zoom(f), fling: (vy: number) => e.fling(vy), options: (o: Partial<Options>) => e.options(o),
      /** A world point on screen (client px), `lift` above the ground. */
      client: (x: number, z: number, lift = 0) => {
        const p = e.at(x, z, lift), r = canvas!.getBoundingClientRect();
        return [r.left + p.sx, r.top + p.sy];
      },
      ground: (cx: number, cy: number) => {
        const r = canvas!.getBoundingClientRect();
        return e.groundAt(cx - r.left, cy - r.top);
      },
      things: (id: string) => e.things.has(id),
      focus: (x: number, z: number, lift?: number) => e.focusOn({ x, z, lift }), restore: () => e.restore(), focused: () => e.focused()
    };
    return () => {
      listen3d(null);
      off();
      ro.disconnect();
      e.onFrame(null);
      world.useThree(null);
      e.dispose();
      eng = null;
      delete W.__world3d;
    };
  });
</script>

<canvas class="w3d" bind:this={canvas} data-w3d data-loaded={loaded || undefined} aria-hidden="true"></canvas>

<style>
  /* over the sky (the sun and the moon behind the world), under every world node (their taps and overlays) */
  .w3d { position: absolute; inset: 0; width: 100%; height: 100%; z-index: 5; pointer-events: none; display: block; }
</style>
