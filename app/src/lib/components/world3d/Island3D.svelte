<script lang="ts">
  // The island in 3D (docs/design.md "World", docs/decisions.md "The island in 3D"): IslandScene's drawing. A canvas
  // behind the island's DOM: NH's
  // models, the ground and the water, the lights (engine.ts), the villagers as cards. The DOM island still runs over it,
  // every node placed through this camera (camera.svelte.ts Proj3): its taps, popups, balloons and marks; its art goes
  // invisible where the canvas draws the thing (IslandScene's [data-r3] rules). The finger is gestures.ts': one finger
  // scrolls along the island (z only, a free fling), two pinch the zoom; nothing else moves the camera.
  // Its own chunk with three.js.
  import { onMount, untrack } from 'svelte';
  import { asset } from '$app/paths';
  import { art, artUrl, villagerArt } from '#lib/art.ts';
  import { resolveLook } from '#lib/villagers/look.ts';
  import type { Who } from '#lib/types.ts';
  import type { VillagerActor } from '#lib/ui-state/cast.ts';
  import type { Season } from '#lib/ui-state/theme.svelte.ts';
  import { actors, livePos } from '../motion/director.svelte.ts';
  import type { Proj3, World } from '../island/camera.svelte.ts';
  import { CAMPSITE, GOAL_TREES, SEAT_DROP, TREE_H } from '../island/world.ts';
  import { GLOW_AT, VILLAGER, type Tod } from '../island/scene.ts';
  import { LAMP_GLOW, type Piece } from '../island/fixedDecor.ts';
  import type { Scenery } from '../island/world.ts';
  import { listen3d, listenPose3d } from '../island/echo3d.ts';
  import { listenFx3 } from '../island/fx3d.ts';
  import { ambient3 } from '../island/ambient3d.svelte.ts';
  import PLACES from '../island/models.json' with { type: 'json' };
  import { createIsland, type Island3 } from './engine.ts';
  import { assetFor } from './assets.ts';
  import { keyModel, modelBounds } from './models3d.ts';
  import { floats as floatsNow, floatAt, type Float } from './floats3d.ts';
  import { attachGestures } from './gestures.ts';
  import { idlePose, motionPose } from './motion3d.ts';
  import type { CardSpec } from './cards.ts';
  import type { LampSpot } from './lights.ts';
  import { createVillagers, type VSpec, type Villagers3 } from './villagers.ts';
  import { createBalloon3, type Balloon3 } from './balloon3d.ts';
  import { has3d } from '../villager3d/manifest.ts';
  import { BufferGeometry, Float32BufferAttribute, Line, LineBasicMaterial, Vector3, type Object3D } from 'three';
  import type { FxKind } from './effects.ts';
  import { pace, SLOW_PX } from './pace.ts';
  import { site } from '../island/site.svelte.ts';
  import { layout as layoutStore } from '#lib/store/layout.svelte.ts';
  import { buildGround, type Ground as LayoutGround, type Look } from './terrain.ts';
  import { homePlaces, placeObjects, type Inst, type Standin } from './objects.ts';
  import { buildHome, homeTod } from './home.ts';
  import { buildStructure, structurePlaces } from './structure.ts';
  import { POND_Y, buildPond } from './pond.ts';
  import { pondOval, pondPlaces } from '#lib/layout/ponds.ts';
  import { washAt } from '#lib/layout/swash.ts';
  import { inOval } from '../island/world.ts';
  import { extentOf, type Layout } from '#lib/layout/model.ts';
  import { GRASS_Y, SEA_Y as LAYOUT_SEA_Y, WATER_DROP as LAYOUT_DROP, fieldOf } from '#lib/layout/height.ts';
  import { TIER_H } from '#lib/layout/grid.ts';
  import type { EditStage } from '../layoutEdit/IslandEdit.svelte';
  import { drawOff } from '../../ui-state/testMode.ts';
  import { DEVICE, localKV } from '#lib/sync/storage.ts';
  import { setDrawnFps } from '#lib/sync/telemetry.ts';

  /** A villager on this island now (IslandScene's cast). */
  export interface Cast {
    id: VillagerActor;
    person: Who;
    villager: string | null;
    side: 'left' | 'right';
    /** On the island and out of the tent. */
    shown: boolean;
    seated: boolean;
    /** Its seat's name (world.ts SEATS: a bench's, a stool's), or null. */
    seat: string | null;
    stung: boolean;
    rep: boolean;
    /** Its hat (an asset key: a birthday's), or null. */
    hat?: string | null;
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
    /** Petals or maple leaves on the stream (their weeks), or none. */
    floating: 'petal' | 'maple' | null;
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
    /** The engine failed to start (no WebGL): the scene shows its no-WebGL line. */
    onfail: () => void;
    /** The camera is up and the island's models are in (once). */
    onready: () => void;
  }
  let { world, scene, season, foliage, month, tod, scenery, pieces, hybrid, floating, wet, cast, enabled, start, onscroll, onhorizon, onfail, onready }: Props = $props();

  let canvas = $state<HTMLCanvasElement>();
  let eng = $state.raw<Island3 | null>(null);
  let loaded = $state(false);

  const q = new URLSearchParams(location.search);
  const num = (k: string) => (q.get(k) !== null && q.get(k) !== '' && Number.isFinite(Number(q.get(k))) ? Number(q.get(k)) : null);

  // ---- the island on its layout (island/site.svelte.ts, synced as the island opens): the layout's ground (terrain.ts
  // buildGround), its objects (objects.ts placeObjects), its homes and bridges and stairs (home.ts, structure.ts), the
  // camera's ends from its extent ----
  site.sync();
  /** The layout the island stands on (site's, synced above). */
  const layoutNow = (): Layout => site.layout ?? layoutStore.current;
  let lground: LayoutGround | null = null;
  /** The ground's look today: the season's, the petals' or the fallen leaves' weeks. */
  const lookNow = (): Look => (season === 'spring' && foliage === 'blossom' ? 'spring-petals' : season === 'autumn' && foliage === 'fall' ? 'autumn-leaves' : season);

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
      const gy = heightOf(s.x, s.z);
      out.push({ id: `s:${s.id}`, x: s.x, z: s.z - 1, y: gy + s.h * at, gy, kind: 'lamp', colour: 0xffd38a, glow: 12, pool: 34 });
    }
    return out;
  }

  // ---- the villagers: cards of their renders (the director's state: where, which way, its motion) ----
  const motionAt: Partial<Record<VillagerActor | 'visitor' | 'host', { n: number; t0: number }>> = {};
  const PULL_MS = 4200;
  /** The pull-up bar's three reps (IslandScene's keyframes): up at 8–16 % and 40–48 % of the cycle. */
  function pullLift(t: number): number {
    const k = (t % PULL_MS) / PULL_MS, up = (a: number, b: number, c: number, d: number) => (k < a || k > d ? 0 : k < b ? (k - a) / (b - a) : k <= c ? 1 : (d - k) / (d - c));
    return 9 * Math.max(up(0, 0.08, 0.16, 0.24), up(0.32, 0.4, 0.48, 0.56));
  }
  /** The seats' tops (u): a bench's, a stool's (NH's park bench and log stool at 3u a model unit). */
  const seatTop = (name: string) => (name.startsWith('stool') ? 9 : 13);
  let vil3: Villagers3 | null = null;
  /** The board's focus (its face's middle on the ground): a villager between the camera and it fades out of the way. */
  let focusAt: { x: number; z: number } | null = null;
  function inFocusWay(x: number, z: number): boolean {
    if (!focusAt || !eng) return false;
    const p = eng.at(x, z, VILLAGER.h / 2), b = eng.at(focusAt.x, focusAt.z, VILLAGER.h / 2), r = canvas!.getBoundingClientRect();
    // (on screen any part of it: a near one is big)
    const m = 20 + p.k * VILLAGER.h;
    return p.depth > 1 && p.depth < b.depth - 4 && p.sx > -m && p.sx < r.width + m && p.sy > -m && p.sy < r.height + m;
  }
  /** The villagers' floating marks (NH's ♪ ♥ ✦ ！ sweat zzz over the head) drawn in 3D for a 3D villager: its
   *  DOM mark hidden (data-v3 on its node; a mark with no model, the ？, stays the DOM's). */
  const MARK3: Record<string, true> = { sparkle: true, heart: true, note: true, zzz: true, bang: true, sweat: true };
  const markAt: Record<string, { n: number; t: number }> = {};
  const headV = new Vector3();
  function marks3(e: Island3, t: number, slot: string, x: number, z: number) {
    const a = actors[slot as keyof typeof actors], m = a.emote?.startsWith('mark-') ? a.emote.slice(5) : null;
    if (!m || !MARK3[m]) return;
    const was = markAt[slot];
    // once each; a held one (a sleeper's, a surprise held) again as the last fades
    if (was && was.n === a.emoteN && !(a.emoteHold && t - was.t > 2000)) return;
    // (a held one's repeats are ambience: they play at the ambient rate)
    const again = !!was && was.n === a.emoteN;
    markAt[slot] = { n: a.emoteN, t };
    // over the head (NH's head joint is at the head's base: its top about as high again)
    const hb = vil3?.head(slot), feet = feetOf(x, z);
    const lift = hb ? (hb.getWorldPosition(headV).y - feet) * 2 + 10 : VILLAGER.h + 10;
    e.fx('mark', x, z, lift, { v: m, ms: 2200, tag: again ? 'mark' : undefined });
  }
  function villagerCards(t: number, active: boolean): boolean {
    if (!eng) return false;
    let moving = false;
    const swaying = scene.hasAttribute('data-show');
    // NH's own 3D villagers where they have one (world3d/villagers.ts); a card for the rest, and while one loads
    const specs: VSpec[] = [];
    for (const c of cast()) {
      const a = actors[c.id], look = resolveLook({ villager: c.villager, person: c.person });
      if (!has3d(look.id)) continue;
      const [x, z] = livePos(c.id);
      specs.push({
        slot: c.id, id: look.id, x, z, y: feetOf(x, z), walking: a.walking, face: a.face, side: c.side, asleep: a.asleep,
        seat: c.seat ? seatTop(c.seat) : null, lift: c.rep ? pullLift(t) : 0, motion: a.motion, motionN: a.motionN, emote: a.emote, stung: c.stung, shown: c.shown,
        away: inFocusWay(x, z), hat: c.hat, tool: c.id === 'mine' && fishing ? 'tools/rod' : null
      });
    }
    const r = vil3?.frame(t, specs, active) ?? { cards: new Set<string>(specs.map((s) => s.slot)), moving: false };
    moving = r.moving;
    for (const c of cast()) {
      const a = actors[c.id], look = resolveLook({ villager: c.villager, person: c.person });
      const card = !has3d(look.id) || r.cards.has(c.id);
      // drawn in 3D: its marks too (the DOM's hidden: IslandScene's [data-v3])
      const in3 = c.shown && !card, node = scene.querySelector(`.actor[data-actor="${c.id}"]`);
      // (checked each frame: the node is the DOM island's, made anew when its villager comes back)
      if (node && node.hasAttribute('data-v3') !== in3) node.toggleAttribute('data-v3', in3);
      // its tap area its model's core (IslandScene's [data-v3] .vil, in u), not the 2D render's: in front of the tent's
      // door it covered most of it (docs/world3d-gaps.md 2)
      const sz = in3 ? vil3?.size(c.id) : null;
      if (node instanceof HTMLElement && sz) {
        // (a thumb's least, 44 px on screen either way: hitbox.ts MIN_HIT, with a margin: the node is placed a frame behind a walker)
        const k = eng.at(...livePos(c.id), 0).k, least = k > 0 ? 50 / k : 0;
        const [w, h] = sz.map((v) => String(Math.ceil(Math.max(v, least) * 2) / 2));
        if (node.style.getPropertyValue('--v3w') !== w) node.style.setProperty('--v3w', w);
        if (node.style.getPropertyValue('--v3h') !== h) node.style.setProperty('--v3h', h);
      }
      if (in3) marks3(eng, t, c.id, ...livePos(c.id));
      const base = c.shown && card && !inFocusWay(...livePos(c.id)) ? artCard(villagerArt(look.id) ?? '', VILLAGER.h) : null;
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

  // ---- the characters' flourishes (the director's fx: sparkles, hearts, notes, confetti, a puff, a sleeper's zzz) ----
  const FX3: Record<string, FxKind> = { sparkles: 'sparkle', hearts: 'hearts', notes: 'notes', confetti: 'confetti', puff: 'dust', glint: 'sparkle', zzz: 'zzz' };
  const fxSeen = new Set<string>(), zzzAt: Record<string, number> = {};
  function actorFx(e: Island3, t: number) {
    for (const id of ['mine', 'partner', 'third', 'visitor'] as const) {
      const a = actors[id];
      if (!a.fx.length) continue;
      const [x, z] = livePos(id);
      for (const f of a.fx) {
        const k = FX3[f.kind];
        if (!k) continue;
        if (f.kind === 'zzz') {
          // a sleeper's zzz: one every couple of seconds while it sleeps
          if (t - (zzzAt[id] ?? -Infinity) < 1900) continue;
          zzzAt[id] = t;
          e.fx('zzz', x + 8, z, VILLAGER.h * 0.75, { tag: 'zzz' });
          continue;
        }
        const key = `${id}:${f.n}`;
        if (fxSeen.has(key)) continue;
        fxSeen.add(key);
        e.fx(k, x, z, VILLAGER.h * (f.kind === 'confetti' ? 0.6 : f.kind === 'puff' ? 0 : 0.7));
      }
    }
    if (fxSeen.size > 200) fxSeen.clear();
  }

  // ---- the other characters (a visitor): cards of their renders where their nodes are, posed by their actors ----
  let cards3 = new Set<string>();
  function characterCards(e: Island3, t: number): boolean {
    const seen = new Set<string>();
    let moving = false;
    for (const n of world.cards3()) {
      const c = n.c3, base = artCard(c.key, c.h);
      const art = c.art?.();
      if (art && marked.get(art) !== !!base) {
        marked.set(art, !!base);
        art.classList.toggle('m3on', !!base);
      }
      if (!base) continue;
      const id = `c:${n.id}`;
      seen.add(id);
      const a = c.actor ? actors[c.actor] : null;
      let pose = { lift: 0, squash: 0, tilt: 0 };
      if (a) {
        const m = motionAt[c.actor!];
        if (!m || m.n !== a.motionN) motionAt[c.actor!] = { n: a.motionN, t0: t };
        const mp = a.motion ? motionPose(a.motion, t - motionAt[c.actor!]!.t0) : null, ip = idlePose(t, a.walking, a.asleep, a.stepMs || 640, 2.1);
        if (mp || a.walking) moving = true;
        pose = { lift: (mp?.lift ?? 0) + ip.lift, squash: (mp?.squash ?? 0) + ip.squash, tilt: (mp?.tilt ?? 0) + ip.tilt };
      }
      e.cards.set(id, { ...base, x: n.x - (c.also ? c.also.dx / 2 : 0), z: n.z, flip: c.flip, shadow: 15, hidden: !n.shown, lift: (c.lift ?? 0) + pose.lift, squash: pose.squash, tilt: pose.tilt });
      const b2 = c.also ? artCard(c.also.key, c.also.h) : null;
      if (c.also && b2) {
        seen.add(`${id}:b`);
        e.cards.set(`${id}:b`, { ...b2, x: n.x + c.also.dx / 2, z: n.z - 1, flip: c.flip, shadow: 15, hidden: !n.shown, lift: (c.lift ?? 0) + pose.lift, squash: pose.squash, tilt: -pose.tilt });
      }
    }
    for (const id of cards3) if (!seen.has(id)) e.cards.set(id, null);
    cards3 = seen;
    return moving;
  }

  // ---- what comes and goes (a find, a weed, a decoration, a fallen fruit): the DOM nodes with an `m3` key ----
  interface Live3 {
    m: string;
    on: boolean;
    /** Where it's drawn now, and its move (from, to, start, length). */
    x: number;
    z: number;
    lift: number;
    to: [number, number, number];
    from: [number, number, number];
    t0: number;
    ms: number;
    yaw: number;
    pitch?: number;
    size?: number;
    grey: number;
    art?: Element | null;
    /** Its wings' angle as last written (a flier's: things.ts flap). */
    flap?: number;
    /** Its opacity, when it washes in (Over `fade`). */
    fade?: number;
  }
  const live3 = new Map<string, Live3>(), seen3 = new Set<string>();
  /** The emitters' last flourish, the lines drawn (by node). */
  const emitted = new Map<string, number>(), seenEmit = new Set<string>();
  const lines = new Map<string, { obj: Line; off: () => void }>(), seenLine = new Set<string>();
  const LINE_N = 12;
  /** The water's surface at (x, z): the sea's level, or a stream's or a pond's (its banks less the drop). */
  const waterY = (x: number, z: number) => {
    const l = layoutNow();
    // a pond put down (pond.ts): its water POND_Y over the grass it stands on
    const pd = pondIn(l, x, z);
    if (pd) return heightOf(pd.x, pd.z) + POND_Y + 0.2;
    // the layout's: the sea's level, or a fresh water's (its tier's banks less the drop: layout/mesh.ts)
    const f = fieldOf(l);
    return f.surfaceAt(x, z) === 'sea' ? LAYOUT_SEA_Y + 0.2 : f.tierAt(x, z) * TIER_H + GRASS_Y - LAYOUT_DROP + 0.2;
  };
  /** The ponds put down on a layout (their water's ovals), once a layout; a pond's own a little past its rim (a
   *  shadow's model is placed by its head, which noses up to the stones). */
  const pondsOf = new WeakMap<Layout, ReturnType<typeof pondOval>[]>();
  const pondIn = (l: Layout, x: number, z: number) => {
    let ps = pondsOf.get(l);
    if (!ps) pondsOf.set(l, (ps = pondPlaces(l).map(pondOval)));
    return ps.find((o) => inOval(o, x, z, 6)) ?? null;
  };
  /** What's under the water at (x, z): a put-down pond's bed (pond.ts: 0.4 under its water, over the grass), else the
   *  ground (a river's or a pond's bed, the seabed). A fish's shadow keeps above it: under a pond put down, the shadow's
   *  2.5 under the water was under the grass, hidden. */
  const bedY = (x: number, z: number) => {
    const pd = pondIn(layoutNow(), x, z);
    return pd ? heightOf(pd.x, pd.z) + POND_Y - 0.4 : heightOf(x, z);
  };
  const marked = new WeakMap<Element, boolean>();
  let lamps3: LampSpot[] = [];
  const smooth = (k: number) => k * k * (3 - 2 * k);
  // (the ground is built as the engine starts: 0 before it, should anything ask)
  const heightOf = (x: number, z: number) => lground?.heightAt(x, z) ?? 0;
  const feetOf = (x: number, z: number) => lground?.feet(x, z) ?? 0;
  /** The self-light of the island's models at each time of day (engine.ts TOD lift): the 3D villagers' too. */
  const LIFT = { day: 0.32, dusk: 0.22, night: 0.08 } as const;
  const todNow = () => (tod === 'night' ? 'night' : tod === 'dusk' || tod === 'dawn' ? 'dusk' : 'day');
  /** My cast is out (the bobber's node): my 3D villager holds NH's rod, its line from the rod's tip. */
  let fishing = false;
  /** An emitter on the island now (bubbles, a firefly, flames): ambience. */
  let emitting = false;
  /** A model's move slower on screen than SLOW_PX (pace.ts) or off it is ambience (the ambient rate: a fish's shadow
   *  drifting); the canvas's size from the ResizeObserver (a read in the frame forced a layout each frame). */
  let cw = 0, ch = 0, slowAmbient = true;
  function mirror(e: Island3, t: number): boolean | 'ambient' {
    // (per frame for every model: nothing new made where nothing changed, its sets kept from frame to frame)
    const winter = season === 'winter', seen = seen3, add: Inst[] = [];
    seen.clear();
    let moving: boolean | 'ambient' = false;
    fishing = false;
    emitting = false;
    for (const n of world.models3()) {
      const a = n.m3.key ? keyModel(n.m3.key, winter) : null, drawn = !!a || !!n.m3.emit;
      const art = n.m3.art ? n.m3.art() : n.el;
      if (art && marked.get(art) !== drawn) {
        marked.set(art, drawn);
        art.classList.toggle('m3on', drawn);
        // (no model: the node's own art shows: IslandScene's [data-m3])
        if (art === n.el) art.classList.toggle('m3off', !drawn);
      }
      // a flourish it gives off (bubbles, a firefly, flames), where it is
      if (n.m3.emit && n.shown && !n.m3.off) {
        const em = n.m3.emit, last = emitted.get(n.id) ?? -Infinity;
        if (t - last >= em.every) {
          emitted.set(n.id, t);
          const y0 = n.m3.water ? waterY(n.x, n.z) - heightOf(n.x, n.z) : n.lift;
          // (an emitter's flourishes are ambience: the ambient rate)
          e.fx(em.kind as FxKind, n.x, n.z, y0 + (em.lift ?? 0), { v: em.v, size: em.size, ms: em.every * 1.5, tag: 'emit' });
        }
        seenEmit.add(n.id);
        emitting = true;
      }
      if (!a) continue;
      seen.add(n.id);
      const b = modelBounds(a.m);
      // a flier's model hangs by its middle at the node's height; the rest stand on their feet
      const base = n.m3.y !== undefined ? n.m3.y - heightOf(n.x, n.z) : n.m3.water ? Math.max(waterY(n.x, n.z) + n.lift, Math.min(bedY(n.x, n.z) + 0.1, waterY(n.x, n.z))) - heightOf(n.x, n.z) : n.lift;
      const lift = base - (a.anchor === 'centre' && b ? ((b.min[1] + b.max[1]) / 2) * a.s : 0);
      let L = live3.get(n.id);
      const fresh = !L || L.m !== a.m;
      if (!L || fresh) {
        const drop = n.m3.drop ?? 0;
        L = { m: a.m, on: false, x: n.x, z: n.z, lift: lift + drop, to: [n.x, n.z, lift], from: [n.x, n.z, lift + drop], t0: t, ms: drop ? (n.m3.ms ?? 500) : 0, yaw: 0, grey: -1, art };
        // (one the layout's objects already draw, its id theirs: the rock, the tape deck, the board: not twice)
        if (!placedIds.has(n.id)) add.push({ id: n.id, model: a.m, x: n.x, z: n.z, lift, scale: a.s });
        live3.set(n.id, L);
      } else if (n.x !== L.to[0] || n.z !== L.to[1] || lift !== L.to[2]) {
        L.from = [L.x, L.z, L.lift];
        L.to = [n.x, n.z, lift];
        L.t0 = t;
        L.ms = n.m3.ms ?? 0;
      }
      const k = L.ms > 0 ? Math.min(1, (t - L.t0) / L.ms) : 1, q = smooth(k);
      const x = L.from[0] + (L.to[0] - L.from[0]) * q, z = L.from[1] + (L.to[1] - L.from[1]) * q, lf = L.from[2] + (L.to[2] - L.from[2]) * q;
      if (k < 1 && moving !== true) {
        const p = e.at(x, z, lf), on = p.visible && p.sx > -80 && p.sx < cw + 80 && p.sy > -80 && p.sy < ch + 80;
        const px = (Math.hypot(L.to[0] - L.from[0], L.to[1] - L.from[1], L.to[2] - L.from[2]) / L.ms) * 1000 * p.k;
        moving = (on && px >= SLOW_PX) || !slowAmbient ? true : 'ambient';
      }
      let yaw = (n.m3.yaw ?? 0) + ((a.yaw ?? 0) * Math.PI) / 180;
      if (n.m3.face === 'move') {
        const dx = L.to[0] - L.from[0], dz = L.to[1] - L.from[1];
        yaw += Math.hypot(dx, dz) > 0.5 ? Math.atan2(dx, -dz) : L.yaw - (n.m3.yaw ?? 0);
      }
      const on = n.shown && !n.m3.off, grey = n.m3.grey ?? 0, pitch = n.m3.pitch ?? 0, size = n.m3.size ?? 1;
      // a find washing in from the sea (Finds: its node slides it up the beach): it fades in as it comes
      let fade = L.fade;
      if (n.m3.wash) {
        const t = performance.now(), w = washAt(n.m3.wash, t);
        fade = w.a;
        // (waiting for its wave: the ambient rate; sliding in: the full)
        if (!w.done) moving = t >= n.m3.wash.t0 ? true : moving || 'ambient';
      }
      if (fresh || on !== L.on || x !== L.x || z !== L.z || lf !== L.lift || yaw !== L.yaw || grey !== L.grey || pitch !== (L.pitch ?? 0) || fade !== L.fade || size !== (L.size ?? 1))
        e.things.over(n.id, { hidden: !on, x, z, lift: lf, yaw, pitch, grey, size, face: n.m3.face === 'camera', ...(fade !== undefined && { fade }) });
      L.on = on, L.x = x, L.z = z, L.lift = lf, L.yaw = yaw, L.pitch = pitch, L.grey = grey, L.size = size, L.art = art, L.fade = fade;
      // a flier's wings (things.ts flap), written only while it's drawn
      const flap = n.m3.flap;
      if (on && flap !== undefined && (fresh || flap !== L.flap)) e.things.flap(n.id, (L.flap = flap));
      // its line (a fishing line, a thread): from where it starts to it, sagging a little
      if (n.m3.line) {
        let ln = lines.get(n.id);
        if (!ln) {
          const geo = new BufferGeometry().setAttribute('position', new Float32BufferAttribute(new Float32Array(LINE_N * 3), 3));
          const obj = new Line(geo, new LineBasicMaterial({ color: 0xf6f1e4, transparent: true, opacity: 0.85 }));
          ln = { obj, off: e.add(obj) };
          lines.set(n.id, ln);
        }
        if (n.id === 'bobber') fishing = n.shown;
        // (a bobber's: from its 3D villager's rod's tip, where it holds one: mine `bobber`, another's `bobber-<slot>`)
        const tip = n.id === 'bobber' ? vil3?.tip('mine') : n.id.startsWith('bobber-') ? vil3?.tip(n.id.slice(7)) : null;
        let [sx, sz, sl] = n.m3.line(), y0 = heightOf(sx, sz) + sl;
        if (tip) [sx, sz, y0] = [tip.x, -tip.z, tip.y];
        const pos = ln.obj.geometry.getAttribute('position') as Float32BufferAttribute, y1 = heightOf(x, z) + lf;
        for (let i = 0; i < LINE_N; i++) {
          const k = i / (LINE_N - 1), sag = Math.sin(k * Math.PI) * 6;
          pos.setXYZ(i, sx + (x - sx) * k, y0 + (y1 - y0) * k - sag, -(sz + (z - sz) * k));
        }
        pos.needsUpdate = true;
        ln.obj.visible = on;
        seenLine.add(n.id);
      }
    }
    for (const [id, ln] of lines) if (!seenLine.has(id)) {
      ln.off();
      ln.obj.geometry.dispose();
      (ln.obj.material as LineBasicMaterial).dispose();
      lines.delete(id);
    }
    seenLine.clear();
    for (const id of emitted.keys()) if (!seenEmit.has(id)) emitted.delete(id);
    seenEmit.clear();
    let gone: string[] | null = null;
    if (live3.size > seen.size) for (const id of live3.keys()) if (!seen.has(id) && !placedIds.has(id)) (gone ??= []).push(id);
    for (const id of gone ?? []) {
      const art = live3.get(id)?.art;
      if (art) (art.classList.remove('m3on'), marked.delete(art));
      live3.delete(id);
    }
    if (gone) void e.things.remove(gone).then(() => e.glows(lamps3));
    if (add.length) void e.things.set(add).then(() => e.glows(lamps3));
    return moving;
  }

  // ---- the season's fall (Particles' rules: ambient3d.svelte.ts): that many falling round the camera ----
  let fallNext = 0;
  function fall(e: Island3, t: number) {
    const { kind, count } = ambient3;
    if (!kind || t < fallNext || e.fxCount('fall') >= count) return;
    fallNext = t + 900;
    const z = e.view().camZ + rnd(40, 420), drop = rnd(90, 140);
    e.fx('fall', 195 + rnd(-190, 190), z, drop, { v: kind, tag: 'fall', ms: (drop / 18) * 1000, size: kind === 'snowflake' ? 1.1 : 1.3 });
  }
  const rnd = (a: number, b: number) => a + Math.random() * (b - a);

  // ---- petals or maple leaves on the stream in their weeks (floats3d.ts) ----
  let floatsOn: string | null = null, floatList: readonly Float[] = [];
  function floats(e: Island3, t: number) {
    const key = floating ? `season/${floating === 'petal' ? 'petal' : 'maple-leaf'}` : null;
    const a = key ? assetFor(key) : null;
    // (on the layout its river and pond: a new list when the layout changes)
    const list = key ? floatsNow() : floatList;
    if (key !== floatsOn || list !== floatList) {
      void e.things.remove(floatList.map((f) => f.id));
      floatsOn = key;
      floatList = list;
      if (a) void e.things.set(list.map((f) => ({ id: f.id, model: a.m, x: f.x, z: f.z, scale: a.s * 1.4, pitch: -Math.PI / 2 })));
    }
    if (!a) return;
    for (const f of floatList) {
      const p = floatAt(f, t);
      // (the water's surface there: the layout's levels on the layout)
      const y = waterY(p.x, p.z) + 0.2;
      e.things.over(f.id, { x: p.x, z: p.z, yaw: p.yaw, lift: y - heightOf(p.x, p.z), size: Math.max(0.01, p.show) }, false);
    }
  }

  // ---- the balloon present flying over the island (balloon3d.ts: its flight is island/balloonFlight.ts') ----
  let b3: Balloon3 | null = null;

  // ---- the island's day: its models and stand-ins ----
  let placed = '';
  /** The ids the layout's objects draw (placeObjects'): a DOM node's model of the same id isn't added again. */
  let placedIds = new Set<string>();
  const layoutN = new WeakMap<Layout, number>();
  let layouts = 0;
  $effect(() => {
    const e = eng;
    if (!e) return;
    const lay = layoutNow();
    if (!layoutN.has(lay)) layoutN.set(lay, ++layouts);
    const sig = `${season}|${foliage}|${month}|${hybrid?.id}:${hybrid?.flower}|${scenery.map((s) => s.id + s.key).join()}|${pieces.map((p) => p.id + p.key).join()}|${layoutN.get(lay)}`;
    if (sig === placed) return;
    placed = sig;
    untrack(() => {
      const { insts, standins: st } = placeObjects(lay, { season, foliage, month, pieces, hybrid, swaps: Object.fromEntries(scenery.map((s) => [s.id, { key: s.key, h: s.h }])), fruit: false, structures: true });
      placedIds = new Set(insts.map((i) => i.id));
      void e.place(insts).then(() => {
        if (!loaded) {
          queueMicrotask(onready);
          // the flourishes' models on the GPU ahead of their first use (a high five's sparkles whole at once)
          setTimeout(() => void e.warmFx().catch(() => {}), 400);
        }
        loaded = true;
      });
      standins(st);
      e.glows((lamps3 = standinLamps(st)));
      lground?.look(lookNow());
      builtOn(e, lay);
      fitEnds(e);
    });
  });

  // ---- the layout's homes (NH's parts: home.ts) and its bridges and stairs (NH's models: structure.ts), built and
  // stood on the ground; again when one's look or spot changes ----
  const built = new Map<string, { key: string; g: Object3D | null }>();
  const TOD_LAMPS = { day: 0, dusk: 0.7, night: 1 } as const;
  function builtOn(e: Island3, lay: Layout) {
    const want = new Map<string, { key: string; make: () => Promise<Object3D | null>; at: { x: number; z: number; yaw: number; y?: number }; home: boolean }>();
    for (const p of homePlaces(lay))
      want.set(`home:${p.id}`, { key: JSON.stringify(p), make: () => buildHome(p.style), at: { x: p.x, z: p.z, yaw: p.yaw }, home: true });
    for (const p of structurePlaces(lay)) {
      // its origin on the lower ground: the lower of its two ends' (a bridge's banks, the stairs' foot)
      const dx = (Math.cos(p.yaw) * p.length) / 2, dz = (Math.sin(p.yaw) * p.length) / 2;
      const y = Math.min(heightOf(p.x - dx, p.z - dz), heightOf(p.x + dx, p.z + dz));
      want.set(`structure:${p.id}`, { key: JSON.stringify(p) + y.toFixed(1), make: () => buildStructure(p), at: { x: p.x, z: p.z, yaw: p.yaw, y }, home: false });
    }
    // the ponds put down (pond.ts: their water, bed and stones), on the grass
    for (const p of pondPlaces(lay)) {
      const y = heightOf(p.x, p.z);
      want.set(`pond:${p.id}`, { key: JSON.stringify(p) + y.toFixed(1), make: async () => buildPond(p), at: { x: p.x, z: p.z, yaw: p.yaw, y }, home: false });
    }
    for (const id of built.keys()) if (!want.has(id)) {
      e.placeGroup(id, null);
      built.delete(id);
    }
    for (const [id, w] of want) {
      if (built.get(id)?.key === w.key) continue;
      const entry = { key: w.key, g: null as Object3D | null };
      built.set(id, entry);
      void w.make().then((g) => {
        if (built.get(id) !== entry || !eng) return;
        entry.g = g;
        if (g && w.home) homeTod(g as Parameters<typeof homeTod>[0], TOD_LAMPS[todNow()], LIFT[todNow()]);
        eng.placeGroup(id, g, w.at);
      });
    }
  }
  // the homes' lamps and self-light with the time of day
  $effect(() => {
    const t3 = todNow();
    if (!eng) return;
    untrack(() => {
      for (const [id, b] of built) if (b.g && id.startsWith('home:')) homeTod(b.g as Parameters<typeof homeTod>[0], TOD_LAMPS[t3], LIFT[t3]);
      eng?.kick();
    });
  });
  $effect(() => {
    const e = eng, t3 = tod === 'night' ? 'night' : tod === 'dusk' || tod === 'dawn' ? 'dusk' : 'day';
    const w = wet;
    if (!e) return;
    untrack(() => {
      const hz = getComputedStyle(scene).getPropertyValue('--sky-hz').trim();
      e.tod(t3, w, hz);
      vil3?.lift(LIFT[t3] * (1 - 0.35 * w));
      b3?.lift(LIFT[t3] * (1 - 0.35 * w));
    });
  });

  // (a sheet over the island: no frames)
  $effect(() => {
    const e = eng, on = !enabled();
    if (e) untrack(() => e.pause(on));
  });

  /** The island's もようがえ on the layout (layoutEdit/IslandEdit.svelte): world ⇄ the scene's px through this camera,
   *  what's held hidden; null before the island is up. */
  let hiddenEdit: string | null = null;
  export function editStage(): EditStage | null {
    const e = eng, c = canvas;
    if (!e || !c) return null;
    const off = () => {
      const r = c.getBoundingClientRect(), h = scene.getBoundingClientRect();
      return [r.left - h.left, r.top - h.top];
    };
    return {
      host: scene,
      toScreen(x, z, lift = 0) {
        const p = e.at(x, z, lift), [ox, oy] = off();
        return p.visible ? [p.sx + ox, p.sy + oy] : null;
      },
      toGround(sx, sy) {
        const [ox, oy] = off(), g = e.groundAt(sx - ox, sy - oy);
        return g ? [g.x, g.z] : null;
      },
      size: () => [scene.clientWidth, scene.clientHeight],
      hide(id) {
        if (hiddenEdit && hiddenEdit !== id) e.things.over(hiddenEdit, { hidden: false });
        hiddenEdit = id;
        if (id) e.things.over(id, { hidden: true });
      }
    };
  }

  /** Put the camera at a world z at once (the e2e, IslandScene's goTo). */
  export function go(z: number, k?: number) {
    eng?.go(z, k, true);
  }
  /** The camera's two ends (まえ, おく). */
  export function limits(): { min: number; max: number } {
    return eng?.limits() ?? { min: 30, max: 1000 };
  }

  /** The camera's ends for this screen: まえ puts the shoreline SHORE_AT down
   *  the screen (unless the goal trees' canopies would go under the HUD), おく the campsite's feet CAMP_AT down it with
   *  its top clear of the HUD. */
  const SHORE_AT = 0.83, CAMP_AT = 0.5, CLEAR = 16;
  /** The layout ground's bake (px a unit): nothing drawn (the e2e's logic mode), a token one; a software renderer
   *  half the phone's (its bake held every tab of CI's browser up for seconds). */
  const groundPx = (soft: boolean) => (drawOff() ? 0.05 : soft ? 0.8 : undefined);
  /** The ends' landmarks: the layout's (its front shore, ウェイ's home's door; まえ's canopy that must clear the HUD,
   *  おく's landmark, its feet half way down the screen, its top clear). */
  function endsNow(): { shore: number; canopy: readonly [number, number, number]; back: readonly [number, number, number]; edge: number } {
    const x = extentOf(layoutNow());
    // (and the land's far edge: the user, "scroll further back, to see the back of the island too")
    return { shore: x.shore, canopy: [GOAL_TREES.A[0], GOAL_TREES.A[1], TREE_H], back: [x.home[0], x.home[1], CAMPSITE.h], edge: x.land.z1 };
  }
  /** The far end shows the island's back: its far edge this share down the screen (the cliff top, its trees, the far
   *  shore and the sea past it all in view). */
  const EDGE_AT = 0.42;
  function fitEnds(e: Island3) {
    const v = e.view(), H = canvas?.clientHeight ?? 0;
    if (!H) return;
    const hud = Math.max(0, (document.querySelector('.ribbon-wrap')?.getBoundingClientRect().bottom ?? 0) - scene.getBoundingClientRect().top);
    const en = endsNow();
    e.setLimits(en.shore - 400, Math.max(en.back[1], en.edge) + 700);
    const syAt = (x: number, z: number, lift: number) => (cz: number) => (e.go(cz, 1), e.at(x, z, lift).sy);
    const solve = (f: (cz: number) => number, target: number, lo: number, hi: number) => {
      for (let i = 0; i < 28; i++) {
        const mid = (lo + hi) / 2;
        if (f(mid) < target) lo = mid;
        else hi = mid;
      }
      return Math.round((lo + hi) / 2);
    };
    const { shore, canopy: [cx, cz, ch], back: [bx, bz, bh], edge } = endsNow();
    const lo = shore - 400, hi = Math.max(bz, edge) + 700;
    const min = Math.max(solve(syAt(195, shore, 0), H * SHORE_AT, lo, shore + 530), solve(syAt(cx, cz, ch), hud + CLEAR, lo, cz + 400));
    let max = Math.max(solve(syAt(bx, bz, 0), H * CAMP_AT, min, hi), solve(syAt(bx, bz, bh), hud + CLEAR, min, hi));
    max = Math.max(max, solve(syAt(195, edge, 0), Math.max(hud + CLEAR, H * EDGE_AT), min, hi));
    e.setLimits(min, max);
    e.go(v.camZ, v.zoom);
  }

  /** A software renderer (no GPU: headless CI's SwiftShader, llvmpipe), asked of a throwaway context before the
   *  island's own is made (its antialiasing is fixed at its making). */
  function softwareGL(): boolean {
    // (asked once a device: a throwaway context costs seconds under SwiftShader; the e2e's logic mode draws nothing)
    if (drawOff()) return true;
    try {
      const was = localKV()?.getItem(DEVICE.softGL);
      if (was === '1' || was === '0') return was === '1';
    } catch {
      // (private mode: asked each time)
    }
    const soft = askGL();
    try {
      localKV()?.setItem(DEVICE.softGL, soft ? '1' : '0');
    } catch {
      // (as above)
    }
    return soft;
  }
  function askGL(): boolean {
    try {
      const c = document.createElement('canvas'), gl = (c.getContext('webgl2') ?? c.getContext('webgl')) as WebGLRenderingContext | null;
      if (!gl) return false;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const name = String(gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /swiftshader|llvmpipe|software/i.test(name);
    } catch {
      return false;
    }
  }

  onMount(() => {
    if (!canvas) return;
    let e: Island3;
    // a software renderer draws a frame in a fraction of a second only at its lightest: half the pixels, no
    // antialiasing, no shadow map (?dpr= ?aa= ?shadows=1 keep theirs), the ambience a couple of frames a second (CI's
    // tabs share their runner's cores: at the phone's pixel ratio a frame took ~0.5 s)
    const soft = softwareGL();
    try {
      e = createIsland(canvas, (renderer) => (lground = buildGround(layoutNow(), { renderer, look: lookNow(), stairs: false, px: groundPx(soft) })), {
        dpr: num('dpr') ?? (soft ? 0.5 : Math.min(2, window.devicePixelRatio || 1)),
        shadows: soft ? q.get('shadows') === '1' : q.get('shadows') !== '0',
        cap: num('cap') === 30 ? 30 : 60,
        aa: q.get('aa') !== null ? q.get('aa') !== '0' : !soft
      });
    } catch (err) {
      console.warn('world3d', err);
      onfail();
      return;
    }
    eng = e;
    // (?ambient= the frames a second of the ambience, anywhere)
    // (not in the e2e's logic mode: nothing's drawn, a frame costs nothing, and the island's life runs in its frames)
    const amb = num('ambient') ?? (soft && !drawOff() ? 2 : null);
    if (amb !== null) e.options({ ambient: Math.max(0, amb) });
    // (a slow move as ambience only where the ambience runs near the full rate: not on a software renderer's 2)
    slowAmbient = pace.slow = (amb ?? 30) >= 24;
    fitEnds(e);
    e.go(start ?? e.limits().min);
    const proj: Proj3 = {
      at: (x, z, lift) => e.at(x, z, lift), ground: (sx, sy) => e.groundAt(sx, sy), feet: (x, z) => feetOf(x, z), horizon: () => e.horizon(),
      rev: () => e.rev(), camZ: () => e.view().camZ, kick: () => e.kick(), idle: () => e.idle(), paused: () => e.isPaused(),
      focus: (f, ms) => ((focusAt = { x: f.x, z: f.z }), e.frame(f, ms)), unfocus: (ms) => ((focusAt = null), e.restore(ms)), attach: (id, obj) => e.things.attach(id, obj as Object3D | null)
    };
    world.useThree(proj);
    let camWas = NaN, horizonWas = NaN, revWas = -1;
    vil3 = createVillagers((o) => e.add(o), asset('room/villagers3d/' as Parameters<typeof asset>[0]), () => e.kick());
    vil3.lift(LIFT[todNow()]);
    b3 = createBalloon3((o) => e.add(o), heightOf, () => e.kick());
    b3.lift(LIFT[todNow()]);
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
      const camMoved = e.rev() !== revWas;
      revWas = e.rev();
      const moving = mirror(e, t);
      floats(e, t);
      fall(e, t);
      b3?.frame(performance.now());
      const acting = characterCards(e, t);
      actorFx(e, t);
      if (villagerCards(t, camMoved || more) || more || moving === true || acting) return true;
      // the ambience (the ambient rate): a slow move, the season's fall, the stream's floats, an emitter, a blink, the
      // balloon drifting over
      return moving || ambient3.kind || floatsOn || emitting || b3?.shown() || cast().some((c) => c.shown) ? 'ambient' : false;
    });
    // the DOM island's reactions on its (invisible) art: the model, or the stand-in's card, moves too
    listenFx3((kind, x, z, lift, o) => e.fx(kind, x, z, lift, o));
    listenPose3d((id, key) => e.things.swap(id, key ? (keyModel(key)?.m ?? null) : null));
    // the layout changed (the editor, a phone's もようがえ): the ground's changed chunks rebuilt (site's own listener,
    // first, has re-derived world.ts and bumped site.rev: the objects, the homes and the ends follow in the day's effect)
    const offLayout = layoutStore.on(({ diff }) => {
      if (!lground || !diff.chunks.length) return;
      lground.rebuild(layoutNow(), diff.chunks);
      e.kick();
    });
    listen3d((id, k) => {
      if (e.things.has(id)) e.things.jiggle(id, k);
      else e.cards.jiggle(`s:${id}`, k);
    });
    const off = attachGestures(scene, e, { enabled, top: () => scene.getBoundingClientRect().top, left: () => scene.getBoundingClientRect().left });
    [cw, ch] = [canvas.clientWidth, canvas.clientHeight];
    const ro = new ResizeObserver(() => {
      [cw, ch] = [canvas!.clientWidth, canvas!.clientHeight];
      e.resize();
      fitEnds(e);
      world.invalidate();
    });
    ro.observe(canvas);
    const W = window as unknown as { __world3d?: unknown };
    W.__world3d = {
      stats: () => e.stats(), view: () => e.view(), limits: () => e.limits(), loaded: () => loaded && !e.stats().loading,
      go: (z: number, k?: number, x?: number) => e.go(z, k, false, x), pan: (dy: number, dx?: number) => (e.touching(true), e.pan(dy, dx), e.touching(false)), xRoom: (k?: number) => e.xRoom(k), zoomRange: () => e.zoomRange(),
      zoom: (f: number) => e.zoom(f), fling: (vy: number, vx?: number) => e.fling(vy, vx),
      /** A world point on screen (client px), `lift` above the ground. */
      client: (x: number, z: number, lift = 0) => {
        const p = e.at(x, z, lift), r = canvas!.getBoundingClientRect();
        return [r.left + p.sx, r.top + p.sy];
      },
      ground: (cx: number, cy: number) => {
        const r = canvas!.getBoundingClientRect();
        return e.groundAt(cx - r.left, cy - r.top);
      },
      away: (x: number, z: number) => inFocusWay(x, z), camStill: () => e.camStill(), idle: () => e.idle(), fxWarmed: () => e.fxWarmed(), fx: (kind: FxKind, x: number, z: number, lift?: number, o?: Parameters<typeof e.fx>[4]) => e.fx(kind, x, z, lift, o), strays: (reach?: number) => e.strays(reach), alphaBlends: () => e.alphaBlends(),
      things: (id: string) => e.things.has(id), where: (id: string) => e.things.where(id), groups: () => e.things.groups(), over: (id: string, o: Parameters<typeof e.things.over>[1]) => e.things.over(id, o), head: (slot: string) => { const h = vil3?.head(slot); if (!h) return null; const p = h.getWorldPosition(new Vector3()); return [p.x, p.y, p.z]; },
      focus: (x: number, z: number, lift?: number) => e.focusOn({ x, z, lift }), restore: () => e.restore(),
      /** The water's surface and what's under it at world (x, z) (a fish's shadow is drawn between them). */
      water: (x: number, z: number) => [waterY(x, z), bedY(x, z)],
      /** The ids of the lamps lit now (a model's id; a stand-in's `s:` prefixed). */
      lamps: () => e.lamps(),
      /** My angler's line up: its facing, its rod and its line's headings in plan (degrees), or null. */
      angler: (slot = 'mine') => vil3?.angler(slot) ?? null,
      /** On the layout: its ground built (the layout's); the homes, bridges and stairs placed. */
      onLayout: () => !!lground,
      placedGroups: () => e.placedGroups(),
      /** The balloon present drawn now (world space: its balloon's middle, the present's top, its shadow), or null. */
      balloon: () => b3?.state() ?? null
    };
    setDrawnFps(() => e.stats().fps);
    return () => {
      setDrawnFps(null);
      offLayout();
      listen3d(null);
      vil3?.dispose();
      vil3 = null;
      b3?.dispose();
      b3 = null;
      listenPose3d(null);
      listenFx3(null);
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
