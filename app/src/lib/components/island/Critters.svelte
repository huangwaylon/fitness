<script lang="ts">
  // The island's critters (docs/design.md "Scene interactions", "Critters"), after NH, in the rolling-log world
  // (world.ts units: x across, z into the island): now and then (ambient life's slots, island/ambient.ts: the same on both phones) a fish
  // shadow swims in the sea in front of the front beach (seen from まえ), another in a fresh water in view, NH's fresh
  // water by where it is (the pond, the river's reaches, the river mouth on the west beach, the falls' pool (clifftop) and the
  // spring: pondFish.ts, its own chunk, fetched with the first such shadow), or a bug of the season and hour comes by
  // where NH keeps it; a shaken bush sometimes lets a butterfly or a moth out. A catch is an official icon and NH's
  // line, and the first of each a ずかん find (never ベル).
  //   Fishing, the same in every water (critters.ts `Water`): a tap in the water near a shadow (CAST_U) walks my villager
  //   to its fishing spot (the beach in front, z ≈ 18, facing the sea; the pond's back bank, walkGraph's pondside; the
  //   river's bank) and casts a bobber; the fish swims up, nibbles 0–3 times (small wiggles of the bobber) and bites: the
  //   bobber is yanked under with a splash, its own sound and NH's 「！」 over it. While the bobber is out any tap is the
  //   reel: on the bite (within 1.6 s) it catches the fish; a first tap any earlier only makes it hesitate (it backs
  //   off, comes back, nibbles and bites later), a second early tap or none in time and it flees. 1 in 14 the line
  //   brings up a boot, a tire or a can.
  //   Diving (island/sea.ts, loaded with the first bubble spot): 1 sea turn in 4 brings a spot of bubbles rising instead
  //   of a shadow; a tap on it is a dive (a splash, a ripple): a slow sea creature is caught; a quick one darts off as a
  //   shadow and a second tap on it in time catches it, or it gets away. Now and then the spot holds NH's pearl.
  //   Bugs (NH's by month and hour, where NH keeps them: critters.ts bugPlace): cicadas and beetles on the trunks of the
  //   goal trees, the oaks and the cedars, NH's palm beetles on the palms, butterflies and the bee over the flowers
  //   (now and then resting on a flower), a ladybug or a mantis on a flower's head, the moth round the lamps at night,
  //   dragonflies and fireflies near the water, grasshoppers, crickets and the night's tarantula and scorpion in the
  //   grass, the hermit crab and the wharf roach on the beach, the water bugs on the pond and the river's still reach.
  //   Where each is, is the shared world's (critterPath.ts, docs/backend.md#shared-world): a slot's critter is placed in
  //   the world and walked through its stay from its seed, the same on both phones, and each phone shows what its
  //   camera sees of it; a catch or an escape is shared by the critter's id (first wins), and the partner's plays here:
  //   their villager runs over and nets it, reels it in or dives for it, and holds it up.
  //   Bugs: a tap on one swings the net (caught); a tap close by startles it away. A tarantula or a scorpion rears up at
  //   the first tap; a tap while it's reared and it charges off; once it settles, a tap nets it. A mole cricket chirps
  //   under a mound of earth: a tap digs it up. A tap on my villager now and then sends a flea hopping off it.
  // Each critter is a world node (camera.svelte.ts) at its spot: a fish shadow a flat ground mark, a bug, the bobber and
  // the bubbles upright. They move inside their node by CSS transitions between waypoints a timer picks every second or
  // few, in the node's local units (a flat node's local y is −z; an upright one's −z·ground − lift), so nothing runs
  // per frame. Taps are hit-tested against their live boxes (getBoundingClientRect works through the transforms).
  // SceneTaps.svelte mounts this inside the stage and routes taps here first (`tap`, client px), a shaken bush
  // (`fromBush`), a tap on my villager (`fromVillager`) and the rock (`fromRock`). Covered or hidden: they all leave at
  // once and the countdown holds. Decorative, pointer-only.
  //   ?critter=fish | pond | river | mouth | clifftop | <fish id> | <fresh fish id> | <bug id> (dev or ?demo): one now,
  //   staying until caught (the e2e's hook; it comes where the camera can see it if it can, else at its place);
  //   ?sea=<id>|pearl: a bubble spot; ?flea: a tap on my villager always sends a flea off it.
  import CatchPlate from './CatchPlate.svelte';
  import { cardFor, type CatchCard } from './catchCard.ts';
  import { timers } from './timers.ts';
  import { pickOne } from '#lib/random.ts';
  import { hook, hookFlag } from './devHooks.ts';
  import { weather } from './weatherNow.svelte.ts';
  import { onMount } from 'svelte';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { artUrl } from '#lib/art.ts';
  import { jst, now } from '#lib/time/clock.ts';
  import { crittersAt, msToNextSlot, slotAt, slotStart, spawnRand, type Spawn } from './ambient.ts';
  import { relayOffset } from './ambientClock.ts';
  import { su, type Tod } from './scene.ts';
  import { hitWorld, sceneSfx } from './sceneTaps.ts';
  import type { Box } from './geom.ts';
  import { clearAt, guardsU, stageGeo } from './placement.ts';
  import { recordFind } from '#lib/store/actions.ts';
  import { catchLine, loadLines, loadNames } from './catchLine.ts';
  import { findArt } from './beach.ts';
  import { eggTime, eventNow } from './events.ts';
  import { eggOnLine } from './eggs.ts';
  import { partnerTurnTo, turnTo } from './avatar.ts';
  import { world as shared } from '#lib/store/world.svelte.ts';
  import { caught } from '#lib/sync/world-day.ts';
  import type { How } from '#lib/sync/live-protocol.ts';
  import { LANDS, PACE, STILL, bubblesAt, bugPath, critterId, fishPath, freshWater, groundOk, inWater, legAt, type Leg } from './critterPath.ts';
  import { tellPartner } from './partnerNews.ts';
  import { livePos } from '../motion/director.svelte.ts';
  import { t } from '#lib/i18n/index.ts';
  import type { DiveItem } from './sea.ts';
  import { OVER, useWorld } from './camera.svelte.ts';
  import { ROCK, SEA_BOX, SHORE_Z, flowerById } from './world.ts';
  import { nearestWalkable, walkGeo } from './walkGraph.ts';
  import {
    BUGS, BUSHES, CAST_U, FISH, FRESH, HESITATE_MS, HESITATE_U, NOTICE_U, POND_SHADOW, REAR_MS, SEA_SWIM, STAY_MS, bitePlan,
    bugPlace, bushBug, castInto, castPhase, critterArt, findKind, freshAreas, shadowLen, fleaJumps, hesitatePlan, hookItem, netSwing,
    oddsAt, patches, perches, pickBug, pickFish, reel, stalkTap, swimAt, waterAt, type BitePlan, type BugId, type BugPlace, type Catch,
    type FishId, type Flight, type JunkId, type Patch, type StalkState, type Swim, type Water
  } from './critters.ts';
  import type { PondFishId } from './pondFish.ts';
  import { RIVER, riverNear, type FreshWhere } from './world.ts';

  const WATERS: readonly Water[] = ['sea', ...FRESH];

  interface Props {
    scene?: HTMLElement;
    tod: Tod;
    /** Live, not covered by a sheet, page visible. */
    enabled: () => boolean;
  }
  let { scene, tod, enabled }: Props = $props();
  const w = useWorld();

  /** A world point (units) and its height above the ground. */
  interface P3 { x: number; z: number; lift: number }
  interface Fish {
    n: number; item: FishId | PondFishId | JunkId; water: Water; size: number; shape?: 'narrow' | 'fin';
    /** Where it is heading (world) and how long that takes; its node's anchor (its spawn point). */
    x: number; z: number; ms: number; ax: number; az: number;
    /** Heading: mirrored (head right) and turned toward where it swims (deg, −90…90 on screen). */
    flip: boolean; rot: number;
    area: Swim; gone: boolean; dash: boolean;
    /** Closing in on a bobber in short darts (NH): each one quick off the mark, easing in. */
    spurt?: boolean;
    /** The shared world's (critterPath.ts): its id (its catch is shared), its itinerary and when it came (relay ms). */
    cid?: string; legs?: Leg[]; t0?: number;
  }
  interface Cast {
    /** The shadow it was cast to (its water). */
    fish: Fish;
    /** Where the bobber is (world) and where the line starts, relative to it (local units: the rod's tip, measured,
     *  or the bank). */
    x: number; z: number; fx: number; fy: number;
    /** The bank the line starts from when my villager didn't walk there (world). */
    sx: number; sz: number;
    landed: boolean; t0: number; plan: BitePlan | null; under: boolean; rings: number;
    /** The 「！」's nudge (px) keeping it on screen. */
    bdx: number;
    /** Bumped by each new plan (and a hesitation): the old plan's timers check it and stand down. */
    gen: number;
    /** A first tap before the bite made the fish hesitate: the next early one scares it off. */
    hesitated: boolean;
  }
  interface Bug {
    n: number; id: BugId; flight: Flight; place: BugPlace;
    /** Where it is (world, lift above the ground), its node's anchor and the ground's foreshortening there. */
    x: number; z: number; lift: number; ax: number; az: number; g: number;
    ms: number; flip: boolean; gone: boolean;
    /** Its patch (null: it stays put: a perch, a flower head) and a check for a spot in it (on screen, clear). */
    patch: Patch | null; ok: (p: P3) => boolean;
    /** Sat down: a cicada on its trunk, a butterfly resting on a flower (its wings slowly open and close). */
    sat: boolean;
    /** A butterfly's hops since it last rested on a flower, and how many it makes before the next rest. */
    hops?: number; rest?: number;
    /** Startled: it rises up and away, fully seen, and fades out at the end. */
    fled?: boolean;
    /** A tarantula's or a scorpion's mood (stalkTap). */
    stalk?: StalkState;
    /** Netted: it holds still where it was seen (its translate frozen) until the swing lands. */
    held?: boolean; freeze?: string;
    /** The shared world's (critterPath.ts): its id, its itinerary and when it came (relay ms). */
    cid?: string; legs?: Leg[]; t0?: number;
  }
  /** A shared critter's id and where its itinerary comes from: its seed, when it came (relay ms) and how long it stays
   *  in all (ms). */
  interface Shared { cid?: string; path?: { seed: number; t0: number; total: number } }
  /** The net swung at a bug (stage units: the screen's overlay). */
  interface Net { n: number; x: number; y: number }

  const rand = Math.random;
  const between = (a: number, b: number) => a + rand() * (b - a);
  const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
  /** A node's inner offset (local units: before the node's perspective scale). */
  const loc = (dx: number, dy: number) => `calc(${dx.toFixed(2)} * var(--u)) calc(${dy.toFixed(2)} * var(--u))`;
  const fishLoc = (f: Fish) => loc(f.x - f.ax, -(f.z - f.az));
  const bugLoc = (b: Bug) => loc(b.x - b.ax, -(b.z - b.az) * b.g - b.lift);

  /** One shadow in the sea and one in each fresh water, at most. */
  const none = (): Record<Water, Fish | null> => ({ sea: null, pond: null, river: null, mouth: null, clifftop: null });
  let fishes = $state<Record<Water, Fish | null>>(none());
  let cast = $state<Cast | null>(null);
  let bug = $state<Bug | null>(null);
  let card = $state<CatchCard | null>(null);
  let net = $state<Net | null>(null);
  /** A spot of bubbles in the sea: something to dive for. */
  let bubbles = $state<{ n: number; item: DiveItem; x: number; z: number; cid?: string } | null>(null);
  /** A dive: the splash, then (a quick one) its shadow darting off, catchable until `until`. */
  let diving = $state<{ n: number; item: DiveItem; x: number; z: number; ax: number; az: number; ms: number; size: number; chase: boolean; until: number; gone: boolean; cid?: string } | null>(null);
  /** The sea creatures' module (island/sea.ts): loaded with the first bubble spot, out of the island's first load. */
  let S: typeof import('./sea.ts') | null = null;
  let seaChunk: Promise<typeof import('./sea.ts')> | null = null;
  const loadSea = () => (seaChunk ??= import('./sea.ts').then((m) => (S = m)).catch((e) => ((seaChunk = null), Promise.reject(e))));
  /** Earth flying up where a mole cricket was dug up. */
  let dig = $state<Net | null>(null);
  let seq = 0;
  let bugEl = $state<HTMLElement>();
  let hopEl = $state<HTMLElement>();
  let chaseEl = $state<HTMLElement>();
  const night = $derived(tod === 'night');

  // ---------- timers (all cleared when the critters leave) ----------
  const pending = timers(), later = pending.later;
  function clearAll() {
    pending.clear();
    fishes = none();
    cast = bug = card = net = dig = bubbles = diving = null;
  }

  // ---------- geometry ----------
  const geo = () => stageGeo(scene);
  /** The controls nothing of ours covers (stage units), grown by `pad` u. */
  const guards = (pad: number): Box[] => {
    const g = geo();
    return g ? guardsU(g, pad) : [];
  };
  /** A world point is on screen (inside its edges, below the horizon) and, with `keep`, a box of half-size hw × hh
   *  units round it (at its perspective scale) is clear of every control. */
  function seen(x: number, z: number, lift: number, keep: Box[] | null, hw = 8, hh = 8): boolean {
    const p = w.screenAt(x, z, lift), v = w.view;
    if (!w.inView(x, z, -12)) return false;
    if (p.sy < v.horizon + 6 || p.sy > v.vh - 10 || p.sx < 10 || p.sx > v.vw - 10) return false;
    if (!keep) return true;
    const [ux, uy] = w.screenU(x, z, lift);
    return clearAt(keep, ux, uy, hw * p.scale, hh * p.scale);
  }
  /** A world point in stage units (the catch plate's point). */
  const stageAt = (x: number, z: number, lift = 0) => {
    const [sx, sy] = w.screenU(x, z, lift);
    return { x: sx, y: sy };
  };
  /** An element's centre in stage units. */
  function stageOf(el: Element): { x: number; y: number } | null {
    const g = geo(), r = el.getBoundingClientRect();
    return g ? { x: (r.left + r.width / 2 - g.r.left) * g.k, y: (r.top + r.height / 2 - g.r.top) * g.k } : null;
  }
  /** A point in a patch passing `ok` (null when there's none to be found: enough tries to find a small phone's gaps). */
  function freeIn(a: Patch, ok: (p: P3) => boolean): P3 | null {
    for (let i = 0; i < 48; i++) {
      const p = { x: between(a.x0, a.x1), z: between(a.z0, a.z1), lift: between(a.l0, a.l1) };
      if (ok(p)) return p;
    }
    return null;
  }
  function freeSwim(a: Swim, ok: (x: number, z: number) => boolean): { x: number; z: number } | null {
    for (let i = 0; i < 40; i++) {
      const p = swimAt(a, between(-1, 1), between(-1, 1));
      if (ok(p.x, p.z)) return p;
    }
    return null;
  }
  /** A shadow's length (u): NH's sizes 1–6 (critters.ts SHADOW_U); the eels' thin shadow is long; smaller in fresh water. */
  const sizeU = (f: Fish) => shadowLen(f.size, f.shape) * (f.water === 'sea' ? 1 : POND_SHADOW);
  /** Where a shadow may swim to now: in its water, on screen, clear of the controls. */
  const swimOk = (f: { water: Water; size: number; shape?: 'narrow' | 'fin' }, keep: Box[]) => (x: number, z: number) =>
    inWater(f.water, x, z) && seen(x, z, 0, keep, sizeU(f as Fish) / 2, 4);
  /** The swim patches of a water whose middle is on screen. */
  const areasOf = (water: Water): Swim[] => (water === 'sea' ? [SEA_SWIM] : freshAreas(water));
  const inViewArea = (a: Swim) => [0, -0.7, 0.7].some((s) => [0, -0.8, 0.8].some((t) => { const p = swimAt(a, s, t); return w.inView(p.x, p.z, -16); }));
  /** The sea's water in front of the beach is on screen (まえ). */
  const seaInView = () => [60, 165, 270].some((x) => w.inView(x, -20, -16));

  /** The bugs' sprites (BugSprite.svelte): loaded with the first bug of a session, out of the island's first load. */
  let Sprite = $state<typeof import('./BugSprite.svelte').default | null>(null);
  let sprite: Promise<unknown> | null = null;
  const loadSprite = () => (sprite ??= import('./BugSprite.svelte').then((m) => (Sprite = m.default)).catch(() => (sprite = null)));

  function preload(key: string) {
    const url = artUrl(key);
    if (url) new Image().src = url;
  }

  // ---------- fish ----------
  /** The fresh-water fish table: its own chunk, fetched with the first fresh-water shadow. */
  let pondChunk: Promise<typeof import('./pondFish.ts')> | null = null;
  const loadPond = () => (pondChunk ??= import('./pondFish.ts'));

  /** A shadow in `water`, `want` being one of its fish: a shared one (`o.path`) where its seed puts it, wherever that is
   *  (the projector shows it when the camera sees it); else (a dev hook's) where the camera can see it (`pinned`: or
   *  anywhere in it). `stay`: how long it stays (ms; true: STAY_MS.fish, false: until caught); `r`: what it is
   *  (ambient life's seeded species, the same on both phones). */
  async function spawnFish(water: Water, stay: boolean | number = true, want?: FishId | PondFishId, pinned = false, r = rand, o: Shared & { month?: number; hour?: number } = {}): Promise<boolean> {
    if (fishes[water]) return true;
    const t = jst(now()), month = o.month ?? t.month, hour = o.hour ?? t.hour;
    let id: FishId | PondFishId, look: { size: number; shape?: 'narrow' | 'fin' };
    if (water === 'sea') {
      id = want ?? pickFish(month, hour, r, weather.sky);
      look = FISH[id as FishId];
    } else {
      const { POND_FISH, pickFresh } = await loadPond();
      if (fishes[water] || !enabled()) return !!fishes[water];
      id = want ?? pickFresh(water, month, hour, r);
      look = POND_FISH[id as PondFishId];
    }
    let area: Swim | null = null, p: { x: number; z: number } | null = null, anchor: { x: number; z: number } | null = null;
    let legs: Leg[] | undefined;
    if (o.path) {
      // the shared world's: from its seed, where it is now in its stay
      const path = fishPath(o.path.seed, water, o.path.total);
      area = path.area;
      anchor = path.start;
      legs = path.legs;
      p = legAt(legs, { ...path.start, lift: 0 }, shared.now() - o.path.t0).at;
    } else {
      const ok = swimOk({ water, ...look }, guards(4));
      // the nearer reaches first (by the horizon a shadow is a speck), in a random order
      const far = (a: Swim) => (w.screenAt(a.cx, a.cz).ground < 0.6 ? 1 : 0);
      const areas = areasOf(water).filter(inViewArea).map((a) => [a, far(a) + rand()] as const).sort((a, b) => a[1] - b[1]).map(([a]) => a);
      for (const a of areas) if ((p = freeSwim(a, ok))) { area = a; break; }
      if (!p && pinned) {
        // nowhere on screen: at its water all the same (the e2e brings the camera to it)
        area = areas[0] ?? areasOf(water)[0];
        p = { x: area.cx, z: area.cz };
      }
    }
    if (!area || !p) return false;
    anchor ??= p;
    // a dev hook's fish (kept until caught: `stay` false) is always a fish, never junk
    const item = want ?? (stay ? hookItem(id, r) : id);
    preload(critterArt(item));
    void loadLines().catch(() => {});
    const f: Fish = {
      n: ++seq, item, water, size: look.size, shape: look.shape, x: p.x, z: p.z, ax: anchor.x, az: anchor.z, ms: 0, flip: rand() < 0.5, rot: 0, area,
      gone: false, dash: false, ...(o.cid ? { cid: o.cid } : {}), ...(legs ? { legs, t0: o.path!.t0 } : {})
    };
    fishes[water] = f;
    const fp = fishes[water]!; // the state's proxy (the timers compare against it)
    later(() => swim(fp), legs ? 60 : 400);
    if (stay) later(() => leaveFish(fp), stay === true ? STAY_MS.fish : stay);
    return true;
  }
  /** Turn a shadow toward (x, z): head right (mirrored) or left, tilted along the way it swims. */
  function face(f: Fish, x: number, z: number) {
    const dx = x - f.x, dy = -(z - f.z);
    if (Math.hypot(dx, dy) < 0.5) return;
    const a = (Math.atan2(dy, dx) * 180) / Math.PI;
    f.flip = Math.abs(a) <= 90;
    f.rot = f.flip ? a : a > 0 ? a - 180 : a + 180;
  }
  /** Swim to (x, z) over ms. */
  function swimTo(f: Fish, x: number, z: number, ms: number) {
    face(f, x, z);
    Object.assign(f, { x, z, ms });
  }
  /** A slow wander to another spot in its patch of water (NH shadows dawdle), unless it's busy with a bobber: a shared
   *  one along its itinerary, leg by leg at its time (the same on both phones). */
  function swim(f: Fish) {
    if (fishes[f.water] !== f || f.gone) return;
    if (f.legs && f.t0 !== undefined) {
      const e = shared.now() - f.t0;
      const k = f.legs.findIndex((l) => l.t + l.ms > e);
      if (k < 0) return;
      const l = f.legs[k];
      if (l.t > e) return later(() => swim(f), l.t - e);
      if (cast?.fish !== f) {
        f.spurt = false;
        swimTo(f, l.x, l.z, Math.max(0, l.t + l.ms - e));
      }
      return later(() => swim(f), Math.max(0, l.t + l.ms - e) + 20);
    }
    if (cast?.fish !== f) {
      f.spurt = false;
      const p = freeSwim(f.area, swimOk(f, guards(4))) ?? f;
      swimTo(f, p.x, p.z, clamp(Math.hypot(p.x - f.x, p.z - f.z) * (f.water === 'sea' ? 110 : 160), 2500, 6000));
    }
    later(() => swim(f), f.ms + between(600, 2200));
  }
  function leaveFish(f: Fish) {
    if (fishes[f.water] !== f) return;
    if (cast?.fish === f) return later(() => leaveFish(f), 4000); // never while it's playing with the bobber
    f.gone = true;
    later(() => fishes[f.water] === f && (fishes[f.water] = null), 1200);
  }
  /** The fish is spooked: a quick dart away from the bobber and gone (on both phones: it got away). */
  function flee() {
    const c = cast, f = c?.fish;
    cast = null;
    sceneSfx('flee');
    if (!f || fishes[f.water] !== f) return;
    claim(f.cid, f.item, f.x, f.z, 'flee');
    const p = fishNow(f) ?? f;
    const d = c ? Math.hypot(p.x - c.x, p.z - c.z) || 1 : 1;
    const [ux, uz] = c ? [(p.x - c.x) / d, (p.z - c.z) / d] : [f.flip ? 1 : -1, 0];
    const run = f.water === 'sea' ? 40 : 14; // a small water: it dives instead of darting off
    Object.assign(f, { x: p.x, z: p.z });
    swimTo(f, p.x + ux * run, p.z + uz * run, 650);
    Object.assign(f, { dash: true, gone: true });
    later(() => fishes[f.water] === f && (fishes[f.water] = null), 700);
  }

  /** Where the angler stands to cast at a bobber at (x, z) in `water` (world): on the beach in front of it, facing the
   *  sea; the pond's back bank (walkGraph's pondside: in front, my villager would hide the little pond); the river's
   *  bank, the far one where the channel runs across (the line in view), else the island's side. */
  function anglerSpot(water: Water, x: number, z: number): readonly [number, number] {
    if (water === 'sea') return [Math.round(clamp(x, SEA_BOX.x0 + 20, SEA_BOX.x1)), SHORE_Z + 18];
    const g = walkGeo();
    if (water === 'pond') return g.nodes.pondside;
    const r = riverNear(x, z), [ax, az] = RIVER[r.i], [bx, bz] = RIVER[r.i + 1];
    const len = Math.hypot(bx - ax, bz - az) || 1, ux = (bx - ax) / len, uz = (bz - az) / len;
    let [nx, nz] = [-uz, ux];
    if (Math.abs(nz) > 0.4 ? nz < 0 : nx * (195 - x) < 0) [nx, nz] = [-nx, -nz];
    const reach = Math.max(r.hw, 18) + 14;
    return nearestWalkable(g, x + nx * reach, z + nz * reach, 30) ?? nearestWalkable(g, x, z, 90) ?? [x, z];
  }
  function castAt(f: Fish, x: number, z: number) {
    const to = castInto(f.water, x, z);
    const spot = anglerSpot(f.water, to.x, to.z);
    // in place (only a tap on empty ground walks): my villager turns to it and the line flies out from the bank
    turnTo(to.x);
    // the partner's phone: their line goes out there too
    if (f.cid) shared.share({ kind: 'act', act: 'cast', id: f.cid, pt: [Math.round(to.x), Math.round(to.z)] });
    throwLine(f, { ...to, sx: spot[0], sz: spot[1] });
  }
  /** The line's start relative to the bobber (its node's local units): the bank, where an angler would stand. */
  function lineFrom(c: Cast): [number, number] {
    const [bx, by] = w.clientAt(c.x, c.z), k = w.scaleAt(c.x, c.z) * w.view.s;
    const [tx, ty] = w.clientAt(c.sx, c.sz, 6);
    return [(tx - bx) / k, (ty - by) / k];
  }
  function throwLine(f: Fish, to: { x: number; z: number; sx: number; sz: number }) {
    if (fishes[f.water] !== f || f.gone) return;
    const c0: Cast = { fish: f, ...to, fx: 0, fy: 0, landed: false, t0: 0, plan: null, under: false, rings: 0, bdx: 0, gen: 0, hesitated: false };
    [c0.fx, c0.fy] = lineFrom(c0);
    cast = c0;
    sceneSfx('cast');
    sceneSfx('plop');
    later(() => {
      const c = cast;
      if (!c) return;
      c.landed = true;
      c.t0 = performance.now();
      c.rings++;
      const d = Math.hypot(f.x - c.x, f.z - c.z);
      if (d > NOTICE_U || fishes[f.water] !== f) return later(() => cast === c && (cast = null), 9000); // nobody noticed
      follow(c, f, bitePlan(d, rand));
    }, 300);
  }

  /** Play out a plan (ms from the bobber landing): the swim up to it, nose to the bobber, the nibbles, the bite and its
   *  window. A new plan (the fish hesitated) supersedes the old one's timers. */
  function follow(c: Cast, f: Fish, plan: BitePlan) {
    const gen = ++c.gen;
    c.plan = plan;
    const live = () => cast === c && c.gen === gen;
    const at = (ms: number) => Math.max(0, ms - (performance.now() - c.t0));
    const from = fishNow(f) ?? f;
    const d = Math.hypot(from.x - c.x, from.z - c.z) || 1;
    const ux = (c.x - from.x) / d, uz = (c.z - from.z) / d;
    const len = sizeU(f) * 0.5;
    // NH: the shadow turns to the bobber, then closes in over 2–3 short darts (450–700 ms each, a long one first) with
    // pauses between them (300–600 ms), nose to the bobber by plan.arrive (all scaled down if that's sooner)
    const end = { x: c.x - ux * len, z: c.z - uz * len };
    Object.assign(f, { ms: 0, x: from.x, z: from.z, spurt: true });
    face(f, c.x, c.z);
    const n = d > 60 ? 3 : 2, share = n === 3 ? [0.5, 0.82, 1] : [0.62, 1];
    const moves = share.map(() => between(450, 700)), pauses = share.slice(1).map(() => between(300, 600));
    const total = [...moves, ...pauses].reduce((a, b) => a + b, 0), avail = at(plan.arrive);
    const k = Math.min(1, avail / total);
    let t = Math.max(0, avail - total * k); // a beat to turn and look first
    moves.forEach((m, i) => {
      later(() => live() && Object.assign(f, { ms: m * k, x: from.x + (end.x - from.x) * share[i], z: from.z + (end.z - from.z) * share[i] }), t);
      t += (m + (pauses[i] ?? 0)) * k;
    });
    for (const t of plan.nibbles)
      later(() => {
        if (!live()) return;
        c.rings++;
        nibble(f);
        sceneSfx('nibble');
      }, at(t));
    later(() => {
      if (!live()) return;
      // NH's 「！」 (the phone's cue: NH has only the plunk) kept inside the screen, 8px from its sides
      const cx = w.clientAt(c.x, c.z)[0] - w.view.left, half = 22;
      c.bdx = clamp(cx, half, w.view.vw - half) - cx;
      c.under = true;
      c.rings++;
      sceneSfx('bite');
    }, at(plan.bite));
    later(() => live() && flee(), at(plan.bite + plan.window)); // too late
  }

  let bobEl = $state<HTMLElement>();
  const fishEls: Partial<Record<Water, HTMLElement>> = $state({});
  /** Where the shadow is right now (world), mid-transition included: its node's anchor plus its inner offset. */
  function fishNow(f: Fish): { x: number; z: number } | null {
    const el = fishEls[f.water];
    if (!el) return null;
    const [lx, ly] = getComputedStyle(el).translate.split(' ').map(parseFloat);
    if (!Number.isFinite(lx)) return null;
    const s = w.view.s;
    return { x: f.ax + lx / s, z: f.az - (Number.isFinite(ly) ? ly : 0) / s };
  }
  /** A nibble: the bobber twitches, a small gentle wiggle (nothing like the bite's plunge). */
  function nibble(f?: Fish) {
    // the shadow's nose bumps the bobber (2u toward its head and back), in step with the bobber's twitch
    const fin = f ? fishEls[f.water]?.querySelector('.fin') : null;
    if (fin && f) {
      const dx = f.flip ? 2 : -2;
      fin.animate([{ translate: '-50% -50%' }, { translate: `calc(-50% + ${dx} * var(--u)) -50%`, offset: 0.3 }, { translate: '-50% -50%' }], { duration: 380, easing: 'ease-out' });
    }
    bobEl?.animate(
      [{ translate: '0 0', rotate: '0deg' }, { translate: '0 calc(.9 * var(--u))', rotate: '-9deg', offset: 0.25 },
        { translate: '0 calc(.2 * var(--u))', rotate: '7deg', offset: 0.55 }, { translate: '0 0', rotate: '0deg' }],
      { duration: 380, easing: 'ease-out' }
    );
  }

  /** NH's A button while the bobber is out. */
  function reelIn() {
    const c = cast!, f = c.fish;
    turnTo(c.x);
    if (!c.landed) return; // still in the air
    const ms = performance.now() - c.t0;
    const r = reel(castPhase(c.plan, ms), c.hesitated);
    if (r === 'flee') return flee();
    if (r === 'hesitate') {
      // the line twitches; the fish backs off a little, thinks it over, and comes back for another try
      c.hesitated = true;
      c.gen++;
      c.rings++;
      nibble();
      // from where it is now (it may still be swimming up), straight back from the bobber
      const p = fishNow(f) ?? f;
      const d = Math.hypot(p.x - c.x, p.z - c.z) || 1;
      Object.assign(f, { ms: HESITATE_MS, x: p.x + ((p.x - c.x) / d) * HESITATE_U, z: p.z + ((p.z - c.z) / d) * HESITATE_U });
      const plan = hesitatePlan(ms, rand);
      return later(() => cast === c && fishes[f.water] === f && follow(c, f, plan), HESITATE_MS);
    }
    cast = null;
    sceneSfx('reel');
    if (r === 'reel') return;
    if (fishes[f.water] === f) fishes[f.water] = null;
    // first wins: the partner reeling in the same shadow a moment before has it (their news says so here)
    if (!claim(f.cid, f.item, c.x, c.z, 'rod')) return;
    sceneSfx('catch');
    const at = stageAt(c.x, c.z);
    show(f.item, at.x, at.y, f.cid);
  }

  // ---------- bugs ----------
  // (what they are and how they move: critterPath.ts STILL, LANDS, PACE, groundOk)
  /** The wild flowers' heads (world, lift measured from the flower as drawn): where a ladybug or a mantis sits and a
   *  butterfly rests. The orchid mantis prefers white flowers. */
  function flowerHeads(): (P3 & { fid: string; white: boolean })[] {
    const out: (P3 & { fid: string; white: boolean })[] = [];
    const s = w.view.s;
    for (const el of scene?.querySelectorAll<HTMLElement>('[data-flower]') ?? []) {
      const f = flowerById(el.dataset.flower ?? '');
      const r = el.getBoundingClientRect();
      if (!f || !r.width) continue;
      const foot = w.clientAt(f.x, f.z)[1], k = w.scaleAt(f.x, f.z) * s;
      out.push({ fid: f.id, x: f.x, z: f.z, lift: Math.max(6, (foot - (r.top + r.height * 0.16)) / k), white: el.dataset.white !== undefined });
    }
    return out;
  }
  /** A trunk spot for a percher, on screen and clear of the tree's own buttons (the canopy, the fruit row): up the
   *  trunk, then a little lower or higher where a button covers it. */
  function perchSpot(palm: boolean, keep: Box[], pinned: boolean): P3 | null {
    const all = perches(palm), spots: P3[] = [];
    for (const p of all)
      for (const f of [1, 0.85, 1.15, 0.7]) {
        const s = { x: p.x + p.dx, z: p.z - 1, lift: p.lift * f };
        if (seen(s.x, s.z, s.lift, keep, 5, 6)) {
          spots.push(s);
          break;
        }
      }
    if (spots.length) return pickOne(spots, rand);
    if (!pinned) return null;
    // nowhere on screen: the nearest trunk ahead of the camera all the same
    const p = [...all].sort((a, b) => Math.abs(a.z - w.view.camZ - 150) - Math.abs(b.z - w.view.camZ - 150))[0];
    return p ? { x: p.x + p.dx, z: p.z - 1, lift: p.lift } : null;
  }

  /** A bug comes on where NH keeps it and the camera can see it (`pinned`: or at its place anyway); false when there's
   *  nowhere clear for it right now. `from`: it flies (or hops) in from there (a shaken bush, my villager, the rock),
   *  keeping to `area`. */
  function spawnBug(id: BugId | null, o: { from?: P3; area?: Patch; avoid?: Patch[]; stay?: boolean | number; pinned?: boolean } & Shared = {}): boolean {
    const { from, area, stay = true, pinned = false } = o;
    if (!id || bug) return !!bug;
    void loadSprite();
    preload(critterArt(id));
    void loadLines().catch(() => {});
    if (o.path) return sharedBug(id, o, o.path);
    const flight = BUGS[id].flight, place = bugPlace(id);
    let spot: P3 | null = null, patch: Patch | null = null;
    const keep = guards(flight === 'perch' || flight === 'flower' ? 4 : 10);
    const ok = (p: P3) => groundOk(place, p.x, p.z) && seen(p.x, p.z, p.lift, keep);
    if (flight === 'perch') spot = perchSpot(BUGS[id].tree === 'palm', keep, pinned);
    else if (flight === 'flower') {
      // a ladybug or a mantis sits on a flower's head (the orchid mantis on a white one if there are any)
      let heads = flowerHeads();
      const shown = heads.filter((h) => seen(h.x, h.z, h.lift, keep, 5, 5));
      if (shown.length || !pinned) heads = shown;
      if (id === 'orchid-mantis' && heads.some((h) => h.white)) heads = heads.filter((h) => h.white);
      spot = heads.length ? pickOne(heads, rand) : null;
    } else {
      let list = area ? [area] : patches(place);
      // the moth round a lamp; where there's none on screen, round a bush
      if (place === 'lights' && !list.some((a) => seen((a.x0 + a.x1) / 2, (a.z0 + a.z1) / 2, a.l0, null))) list = patches('bush').map((a) => ({ ...a, l0: a.l0 + 6, l1: a.l1 + 30 }));
      for (const a of [...list].sort(() => rand() - 0.5)) {
        const p = freeIn(a, ok);
        if (p) {
          spot = p;
          patch = a;
          break;
        }
      }
      if (!spot && (pinned || area) && list.length) {
        patch = list.find((a) => w.inView((a.x0 + a.x1) / 2, (a.z0 + a.z1) / 2)) ?? list[0];
        spot = { x: (patch.x0 + patch.x1) / 2, z: (patch.z0 + patch.z1) / 2, lift: patch.l0 };
      }
    }
    if (!spot) return false;
    const shown = seen(spot.x, spot.z, spot.lift, null);
    // a firefly blinks on, a grasshopper or a crawler is just there, a shell or a walking stick is on its trunk already
    const inPlace = flight === 'drift' || flight === 'flower' || flight === 'hop' || flight === 'crawl' || flight === 'stalk' || flight === 'burrow' || STILL.has(id);
    // flyers come in from the nearer side of the screen (a percher from above its trunk)
    const side = w.screenAt(spot.x, spot.z).sx < w.view.vw / 2 ? -1 : 1;
    const start = from ?? (inPlace ? spot : { x: spot.x + side * 300, z: spot.z, lift: spot.lift + (flight === 'perch' ? 40 : 0) });
    bug = {
      n: ++seq, id, flight, place, ...start, ax: spot.x, az: spot.z, g: Math.max(0.2, w.screenAt(spot.x, spot.z).ground), ms: 0, flip: side < 0,
      gone: false, patch: flight === 'perch' || flight === 'flower' ? null : patch, ok: shown ? ok : (p) => groundOk(place, p.x, p.z), sat: false,
      hops: 0, rest: 2 + Math.floor(rand() * 2), ...(flight === 'stalk' && { stalk: 'calm' as const }), cid: o.cid
    };
    // a perch or a flower is its one spot
    if (!bug.patch) bug.patch = { x0: spot.x, x1: spot.x, z0: spot.z, z1: spot.z, l0: spot.lift, l1: spot.lift };
    later(fly, 60);
    if (stay) later(() => bugLeave(), stay === true ? STAY_MS.bug : stay);
    return true;
  }
  /** A shared bug: where its seed puts it (critterPath.ts bugPath), wherever that is (the projector shows it when the
   *  camera sees it), and where in its stay it is now. */
  function sharedBug(id: BugId, o: { from?: P3; area?: Patch; avoid?: Patch[]; stay?: boolean | number } & Shared, p: NonNullable<Shared['path']>): boolean {
    const white = flowerHeads().filter((h) => h.white).map((h) => h.fid);
    const path = bugPath(id, p.seed, p.total, { from: o.from, area: o.area, white, avoid: o.avoid });
    if (!path) return false;
    const e = shared.now() - p.t0, { k, at } = legAt(path.legs, path.start, e);
    const spot = path.spot, last = k >= 0 ? path.legs[k] : null;
    bug = {
      n: ++seq, id, flight: path.flight, place: path.place, ...at, ax: spot.x, az: spot.z, g: Math.max(0.2, w.screenAt(spot.x, spot.z).ground), ms: 0,
      flip: spot.x >= 195, gone: false, patch: path.patch, ok: (q) => groundOk(path.place, q.x, q.z), sat: !!last?.sat && e >= last.t + last.ms,
      ...(path.flight === 'stalk' && { stalk: 'calm' as const }), cid: o.cid, legs: path.legs, t0: p.t0
    };
    later(fly, 60);
    const stay = o.stay ?? true;
    if (stay) later(() => bugLeave(), stay === true ? STAY_MS.bug : stay);
    return true;
  }
  function go(b: Bug, p: P3, ms: number) {
    Object.assign(b, { ms, flip: p.x > b.x, x: p.x, z: p.z, lift: p.lift });
  }
  /** A shared bug's next move, at its time (critterPath.ts): the same moves at the same moments on both phones. */
  function flyLegs(b: Bug, legs: Leg[], t0: number) {
    if (b.stalk === 'rear') return later(fly, 600); // reared up at my tap: it holds still
    const e = shared.now() - t0;
    const k = legs.findIndex((l) => l.t + l.ms > e);
    if (k < 0) return;
    const l = legs[k];
    if (l.t > e) return later(fly, l.t - e);
    const left = Math.max(0, l.t + l.ms - e);
    b.sat = false;
    go(b, l, left);
    if (l.hop) hopEl?.animate([{ translate: '0 0' }, { translate: '0 calc(-9 * var(--u))', offset: 0.45 }, { translate: '0 0' }], { duration: Math.max(120, left), easing: 'ease-out' });
    if (l.sat) later(() => bug === b && !b.gone && !b.held && (b.sat = true), left);
    later(fly, left + 20);
  }
  function fly() {
    const b = bug;
    if (!b || b.gone || b.held || !b.patch) return;
    if (b.legs && b.t0 !== undefined) return flyLegs(b, b.legs, b.t0);
    const p = freeIn(b.patch, b.ok);
    if (!p) return later(fly, 1000); // nowhere else clear just now: it stays where it is a while
    if (b.flight === 'perch') {
      // in to the trunk, then it sits there and sings until it's netted, startled or done
      go(b, p, b.x === p.x && b.lift === p.lift ? 0 : 1500);
      return later(() => bug === b && (b.sat = true), b.ms);
    }
    if (b.flight === 'hop') {
      // a short hop along the grass toward a free spot, then a sit
      // (off a villager, or wherever it isn't clear: the first hop goes straight to a clear spot in the grass)
      const a = b.patch, away = b.lift > 0 || !b.ok({ x: b.x, z: b.z, lift: 0 });
      const x = away ? p.x : clamp(b.x + Math.sign(p.x - b.x || 1) * Math.min(Math.abs(p.x - b.x), between(14, 30)), a.x0, a.x1);
      const z = away ? p.z : clamp(b.z + between(-8, 8), a.z0, a.z1);
      const next = { x, z, lift: 0 };
      if (!away && !b.ok(next)) return later(fly, 600); // a hop onto a control: it waits and tries again
      go(b, next, 420);
      hopEl?.animate([{ translate: '0 0' }, { translate: '0 calc(-9 * var(--u))', offset: 0.45 }, { translate: '0 0' }], { duration: 420, easing: 'ease-out' });
      return later(fly, 420 + between(1400, 2800));
    }
    if (b.flight === 'burrow') return; // under its mound, chirping, until it's dug up or done
    if (b.flight === 'flower') {
      // flown in from a shaken bush: down onto its flower; else it's just there, sitting still (a slow bob)
      go(b, p, b.x === p.x && b.z === p.z && b.lift === p.lift ? 0 : 1200);
      return;
    }
    if (b.flight === 'flutter' && LANDS(b.id)) {
      // NH's butterflies: every 2–3 hops it lands on a flower head, rests 2–4 s with its wings slowly opening and
      // closing, then lifts off again
      if (b.sat) {
        b.sat = false;
        b.hops = 0;
        b.rest = 2 + Math.floor(rand() * 2);
      } else if ((b.hops = (b.hops ?? 0) + 1) > (b.rest ?? 2)) {
        const keep = guards(4);
        const p = b.patch;
        const h = pickOne(flowerHeads().filter((h) => (p ? h.x >= p.x0 && h.x <= p.x1 && h.z >= p.z0 && h.z <= p.z1 : Math.abs(h.x - b.x) < 120 && Math.abs(h.z - b.z) < 120) && seen(h.x, h.z, h.lift, keep, 5, 5)), rand);
        if (h) {
          const ms = between(1100, 1600);
          go(b, { ...h, lift: h.lift + 2 }, ms);
          later(() => bug === b && !b.gone && !b.held && (b.sat = true), ms);
          return later(fly, ms + between(2000, 4000));
        }
      }
    }
    if (b.flight === 'crawl' || b.flight === 'stalk') {
      // a little way along its ground, then a rest: a hermit crab scuttles sideways, a snail barely moves; a reared
      // tarantula holds still
      if (b.stalk === 'rear') return later(fly, 600);
      const [reach, m0, m1] = PACE[b.id] ?? [18, 1600, 2600];
      const a = b.patch, crab = b.id === 'hermit-crab';
      const x = clamp(b.x + clamp(p.x - b.x, -reach, reach), a.x0, a.x1);
      const z = clamp(b.z + clamp(p.z - b.z, -reach / 2, reach / 2), a.z0, a.z1);
      const ms = between(m0, m1);
      Object.assign(b, { ms, flip: crab ? b.flip : x > b.x, x, z, lift: p.lift });
      return later(fly, ms + between(1200, 3200));
    }
    const ms = b.flight === 'dart' ? between(240, 380) : b.flight === 'drift' ? between(2600, 4000) : between(1100, 1800);
    go(b, p, ms);
    later(fly, ms + (b.flight === 'dart' ? between(900, 2000) : 0)); // a dragonfly hovers between darts
  }
  /** Off to the nearer side, up a little, fading (a firefly or a cricket just fades where it is). */
  function bugLeave(fast = false, away?: number) {
    const b = bug;
    if (!b || b.gone || b.held) return;
    b.gone = true;
    const ground = b.flight === 'crawl' || b.flight === 'stalk';
    const dir = away ?? (w.screenAt(b.x, b.z).sx < w.view.vw / 2 ? -1 : 1);
    if (b.flight === 'drift' || b.flight === 'burrow' || ((b.flight === 'hop' || ground || STILL.has(b.id)) && !fast)) {
      b.ms = 900;
    } else if (ground) {
      // startled: it scurries off along the ground and is gone
      Object.assign(b, { ms: 700, fled: true, flip: dir > 0, x: b.x + dir * 26 });
    } else if (fast) {
      // startled: it rises 40u up and away, in full view, and fades only at the end
      Object.assign(b, { ms: 800, sat: false, fled: true, flip: dir > 0, x: b.x + dir * 50, lift: b.lift + 40 });
    } else {
      Object.assign(b, { ms: 1600, sat: false, flip: dir > 0, x: b.x + dir * 300, lift: b.lift + 30 });
    }
    later(() => bug === b && (bug = null), b.ms + 50);
  }

  /** A pill bug (or, in its hours, a centipede) crawls out from under the rock (Care's rock tap). */
  export function fromRock(_x?: number, _y?: number) {
    if (bug) return;
    const { hour } = jst(now());
    const id: BugId = oddsAt(BUGS.centipede, 1, hour) > 0 ? 'centipede' : 'pill-bug';
    // a little patch of lawn in front of the rock's foot
    putBug(id, 'rock', ROCK[0] + 8, ROCK[1] - 6);
  }

  /** Where a bug put down by a person's doing comes from and keeps to: out of a bush, from under the rock, off a
   *  villager (`src`), from (x, z). */
  function putFrom(src: string, x: number, z: number): { from: P3; area: Patch; avoid?: Patch[] } {
    if (src === 'rock') return { from: { x, z, lift: 0 }, area: patches('rock')[0] };
    // off the villager it hopped from, never back under its button (its figure stands up the screen from its feet)
    if (src === 'flea') return { from: { x, z, lift: 34 }, area: { x0: x - 90, x1: x + 90, z0: z - 50, z1: z + 16, l0: 0, l1: 0 }, avoid: [{ x0: x - 30, x1: x + 30, z0: z - 8, z1: z + 48, l0: 0, l1: 0 }] };
    const b = BUSHES.find((s) => Math.abs(s.x - x) < 2 && Math.abs(s.z - z) < 2), h = b?.h ?? 40;
    return { from: { x, z, lift: h * 0.7 }, area: { x0: x - 30, x1: x + 30, z0: z - 14, z1: z + 14, l0: 20, l1: 50 } };
  }
  /** A string's seed (FNV-1a): a put bug's itinerary from its id, the same on both phones. */
  const seedOf = (id: string) => {
    let h = 0x811c9dc5;
    for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 0x01000193);
    return h >>> 0;
  };
  /** A bug out of a bush, from under the rock or off my villager: shared (a `put`, so it comes out on the partner's
   *  phone too, and either of us may net it), its itinerary from its id. */
  function putBug(id: BugId, src: 'bush' | 'rock' | 'flea', x: number, z: number, stay: boolean | number = true): boolean {
    const t0 = shared.now();
    const cid = `b${(shared.me ?? 'A').toLowerCase()}${t0.toString(36)}`;
    const at: [number, number] = [Math.round(x), Math.round(z)];
    if (!spawnBug(id, { ...putFrom(src, at[0], at[1]), stay, cid, path: { seed: seedOf(cid), t0, total: typeof stay === 'number' ? stay : STAY_MS.bug } })) return false;
    shared.share({ kind: 'put', id: cid, what: `bug:${id}:${src}`, at });
    return true;
  }

  /** A tap on my villager (IslandScene via SceneTaps): now and then a flea hops off it (NH's fleas) into the grass
   *  round its feet. */
  export function fromVillager(_el?: Element) {
    if (bug || !(forceFlea || fleaJumps(jst(now()).month, rand))) return;
    flea();
  }
  function flea(stay = true) {
    const [x, z] = livePos('mine');
    if (stay) return putBug('flea', 'flea', x, z);
    return spawnBug('flea', { from: { x, z, lift: 34 }, area: { x0: x - 90, x1: x + 90, z0: z - 50, z1: z + 16, l0: 0, l1: 0 }, stay });
  }

  /** A shaken bush lets a bug out now and then (SceneTaps' bush tap: its scenery id, 'hedge-<i>', or the hedge's
   *  index): it flutters round that bush. */
  export function fromBush(which: string | number) {
    if (bug) return;
    const id = typeof which === 'number' ? `hedge-${which}` : which;
    const b = BUSHES.find((s) => s.id === id);
    if (!b) return;
    const { month, hour } = jst(now());
    const bid = bushBug(month, hour, rand, weather.sky);
    if (bid) putBug(bid, 'bush', b.x, b.z);
  }

  // ---------- diving ----------
  /** A spot of bubbles rises in the sea in front of the beach (where a shadow would swim, on screen), with a sea
   *  creature (or a pearl) under it. */
  async function spawnBubbles(stay: boolean | number = true, want?: string, pinned = false, r = rand, o: Shared & { month?: number; hour?: number } = {}) {
    const m = await loadSea().catch(() => null);
    if (!m || fishes.sea || bubbles || diving) return;
    const ok = (x: number, z: number) => inWater('sea', x, z) && seen(x, z, 0, guards(8), 16, 6);
    // the shared world's spot (from its seed, on both phones), else one on screen
    const p = o.path ? bubblesAt(o.path.seed) : freeSwim(SEA_SWIM, ok) ?? (pinned ? { x: SEA_SWIM.cx, z: SHORE_Z - 24 } : null);
    if (!p) return;
    const t = jst(now()), month = o.month ?? t.month, hour = o.hour ?? t.hour;
    const item = (want as DiveItem | undefined) ?? m.pickDive(month, hour, r);
    preload(item === m.PEARL ? findArt(item) : critterArt(item));
    void loadLines().catch(() => {});
    const b = { n: ++seq, item, ...p, ...(o.cid ? { cid: o.cid } : {}) };
    bubbles = b;
    if (stay) later(() => bubbles?.n === b.n && (bubbles = null), stay === true ? m.BUBBLE_STAY_MS : stay);
  }
  /** NH's dive at the bubbles: a splash and a ripple; what's there is caught, darts off as a shadow, or is gone. */
  function diveAt(b: NonNullable<typeof bubbles>) {
    const m = S!;
    bubbles = null;
    sceneSfx('splash');
    const speed = m.speedOf(b.item);
    const out = m.dive(speed, rand);
    const size = b.item === m.PEARL ? 1 : m.SEA[b.item].size;
    const d = { n: ++seq, item: b.item, x: b.x, z: b.z, ax: b.x, az: b.z, ms: 0, size, chase: false, until: 0, gone: false, cid: b.cid };
    diving = d;
    later(() => {
      if (diving?.n !== d.n) return;
      if (out === 'catch') return dived(d);
      // a quick one: its shadow darts off a little way in the sea, away from the nearer edge of its water if it's close
      const room = { l: d.x - SEA_BOX.x0, r: SEA_BOX.x1 - d.x };
      const dir = room.l < 30 ? 1 : room.r < 30 ? -1 : rand() < 0.5 ? -1 : 1;
      const dx = dir * between(26, 40), dz = between(-8, 8);
      const window = out === 'escape' ? 0 : m.CHASE_MS[speed];
      diving = { ...d, chase: true, ms: 320, x: d.x + dx, z: Math.min(-14, d.z + dz), until: performance.now() + 320 + window };
      if (out === 'escape') return later(() => getAway(d.n), 350);
      later(() => getAway(d.n), 320 + window);
    }, 450);
  }
  function getAway(n: number, theirs = false) {
    const d = diving;
    if (d?.n !== n) return;
    if (!theirs) claim(d.cid, d.item, d.x, d.z, 'flee');
    sceneSfx('flee');
    diving = { ...d, ms: 650, gone: true, x: d.x + Math.sign(d.x - d.ax || 1) * 40 };
    later(() => diving?.n === n && (diving = null), 700);
  }
  function dived(d: NonNullable<typeof diving>) {
    diving = null;
    if (!claim(d.cid, d.item, d.x, d.z, 'dive')) return;
    sceneSfx('catch');
    const at = stageAt(d.x, d.z);
    void show(d.item, at.x, at.y, d.cid);
  }

  // ---------- the catch ----------
  /** The catch held up: NH's caption on a plate with the official icon, popping up out of the catch at (x, y) (stage
   *  units) (Plate.svelte places it clear of every control). */
  async function show(item: Catch | DiveItem, x: number, y: number, cid?: string) {
    // the partner's claim reached the relay first: it's theirs (their villager holds it up here: the news)
    if (!stillMine(cid)) return;
    const pearl = item === 'pearl';
    const kind = pearl ? 'shell' : S && item in S.SEA ? 'sea' : findKind(item as FishId | PondFishId | JunkId | BugId);
    // Bunny Day's celebrations: now and then a fish on the line (any water's) is NH's water egg (a caption only, no find)
    const t0 = now();
    if (kind === 'fish' && eggTime(eventNow(t0)) && eggOnLine(rand)) {
      const n = ++seq;
      await loadNames().catch(() => {});
      if (seq !== n) return;
      card = cardFor(n, x, y, findArt('water-egg'), t('beach.fished', { name: t('beach.name.water-egg') }));
      return;
    }
    // the shared ずかん: the first catch of each fish, bug or sea creature (junk isn't a find; the pearl is a shell) gets
    // a second page saying so
    const added = kind ? recordFind(kind, item) : false;
    // a fish tells the island (Turkey Day: Franklin is waiting for one)
    if (kind === 'fish') scene?.dispatchEvent(new CustomEvent('island:catch', { detail: { kind: 'fish', id: item } }));
    const n = ++seq;
    const text = pearl ? await loadNames().then(() => t('beach.picked', { name: t('beach.name.pearl') }), () => '') : await catchLine(item as Catch);
    if (seq !== n) return;
    const art = pearl ? findArt(item) : critterArt(item as Catch);
    card = cardFor(n, x, y, art, text, added);
  }

  // ---------- the shared world ----------
  /** Claim a shared critter as mine (`how`: caught by, or `flee`: it got away): false when the partner has it already
   *  (first wins). A critter without a shared id (a dev hook's) is always mine. */
  function claim(cid: string | undefined, what: string, x: number, z: number, how: How): boolean {
    if (!cid) return true;
    return shared.share({ kind: 'catch', what, id: cid, at: [Math.round(x), Math.round(z)], how }).fresh;
  }
  /** Still mine when its moment comes: the partner's claim may have reached the relay first. */
  const stillMine = (cid?: string) => !cid || (caught(shared.day, cid)?.who ?? shared.me) === shared.me;
  /** The partner has it (caught, or it got away from them). */
  const theirs = (cid?: string) => !!cid && !stillMine(cid);

  /** What a shared catch's line names and shows. */
  const nameOf = (what: string, how?: How) =>
    what === 'pearl' ? 'beach.name.pearl' : how === 'dive' || (S && what in S.SEA) ? `sea.name.${what}` : `critter.name.${what}`;
  const artOf = (what: string) => (what === 'pearl' ? findArt('pearl') : critterArt(what as Catch));
  const verbOf = (how?: How) => (how === 'rod' ? 'fished' : how === 'dive' ? 'dived' : how === 'dig' ? 'dug' : 'caught') as 'fished' | 'dived' | 'dug' | 'caught';

  /** The partner's catch (or a critter that got away from them), heard over the relay: gone here too. Just now (`live`):
   *  their villager runs over and nets it, reels it in, digs it up or dives for it, then holds it up (or, out of view,
   *  the notice at the edge); `beat`: I tapped it too, and the relay heard them first. */
  function theirCatch(e: { what: string; id?: string; at?: readonly [number, number]; how?: How }, live: boolean, beat: boolean) {
    const id = e.id, how = e.how;
    const f = WATERS.map((wt) => fishes[wt]).find((x) => !!x && x.cid === id) ?? null;
    const b = bug && bug.cid === id ? bug : null;
    const bb = bubbles && bubbles.cid === id ? bubbles : null;
    const dv = diving && diving.cid === id ? diving : null;
    // my line was out for it: it's theirs now
    if (f && cast?.fish === f) cast = null;
    if (how === 'flee') {
      if (f && fishes[f.water] === f) {
        Object.assign(f, { dash: true, gone: true });
        swimTo(f, f.x + (f.flip ? 30 : -30), f.z, 650);
        later(() => fishes[f.water] === f && (fishes[f.water] = null), 700);
      }
      if (b && bug === b) bugLeave(true);
      if (bb && bubbles === bb) bubbles = null;
      if (dv) getAway(dv.n, true);
      return;
    }
    const at = e.at ?? (f ? [f.x, f.z] : b ? [b.x, b.z] : bb ? [bb.x, bb.z] : null);
    const gone = () => {
      if (f && fishes[f.water] === f) {
        f.gone = true;
        later(() => fishes[f.water] === f && (fishes[f.water] = null), 500);
      }
      if (b && bug === b) bug = null;
      if (bb && bubbles === bb) bubbles = null;
      if (dv && diving === dv) diving = null;
    };
    if (!live || !at) return gone();
    const [x, z] = at;
    if (b) Object.assign(b, { held: true, ms: 0 });
    // in place: their villager turns to it, and the net or the shovel shows at the catch (a reel or a dive: a splash)
    partnerTurnTo(x);
    const p = stageAt(x, z);
    if (how === 'dig') dig = { n: ++seq, ...p };
    else if (how !== 'rod' && how !== 'dive') net = { n: ++seq, ...p };
    later(() => (net = dig = null), 700);
    const ms = how === 'rod' ? 900 : how === 'dive' ? 450 : how === 'dig' ? 260 : 300;
    later(() => {
      gone();
      if (how === 'rod' || how === 'dive') sceneSfx('splash');
      tellPartner({ art: artOf(e.what), verb: beat ? 'beat' : verbOf(how), name: nameOf(e.what, how), x, z });
    }, ms);
  }

  /** A bug the partner's doing put on the island (out of a bush, from under the rock, off their villager): it comes
   *  out here too, along the same itinerary (from its id), while its stay lasts. */
  function theirBug(e: { id: string; what: string; at: readonly [number, number]; t: number }) {
    const [, bid, src] = e.what.split(':');
    if (!bid || !(bid in BUGS) || bug) return;
    const left = STAY_MS.bug - (shared.now() - e.t);
    if (left < 1000 || caught(shared.day, e.id)) return;
    spawnBug(bid as BugId, { ...putFrom(src ?? 'bush', e.at[0], e.at[1]), stay: left, cid: e.id, path: { seed: seedOf(e.id), t0: e.t, total: STAY_MS.bug } });
  }

  onMount(() =>
    shared.on(({ e, live, beat }) => {
      if (!enabled() && e.kind !== 'catch') return;
      if (e.kind === 'catch' && e.id && !/^(dg|ws):/.test(e.id)) theirCatch(e, live, !!beat);
      else if (e.kind === 'put' && e.what.startsWith('bug:')) theirBug(e);
      else if (e.kind === 'act' && e.act === 'cast' && live && e.pt) {
        // the partner casts: their villager turns to the water where it stands (their bite is theirs)
        partnerTurnTo(e.pt[0]);
      }
    })
  );

  /** A tap on the scene (client px), before SceneTaps' own flourishes: true when a critter took it. */
  export function tap(px: number, py: number): boolean {
    if (cast) {
      reelIn();
      return true;
    }
    const g = geo();
    if (!g) return false;
    const b = bug;
    // the partner has it already (their villager is on the way): a tap here takes nothing
    if (b && theirs(b.cid)) return true;
    if (b && !b.gone && bugEl) {
      const r = bugEl.getBoundingClientRect();
      const d = Math.hypot(px - (r.left + r.width / 2), py - (r.top + r.height / 2));
      const swing = netSwing(d, Math.max(r.width, r.height));
      const at = { x: (r.left + r.width / 2 - g.r.left) * g.k, y: (r.top + r.height / 2 - g.r.top) * g.k };
      if (b.flight === 'stalk' && b.stalk) {
        // NH's tarantula: it rears up when it's come at, charges if you keep coming; settled again, it can be netted
        const act = stalkTap(b.stalk, swing);
        if (act === 'rear' || act === 'charge') turnTo(b.x); // no walk: its mood is the game
        if (act === 'rear') {
          b.stalk = 'rear';
          later(() => bug === b && b.stalk === 'rear' && (b.stalk = 'settled'), REAR_MS);
          return true;
        }
        if (act === 'charge') {
          claim(b.cid, b.id, b.x, b.z, 'flee');
          sceneSfx('bug-flee');
          const to = w.worldAtClient(px, py) ?? b;
          const dx = Math.sign(to.x - b.x) || 1;
          b.stalk = 'calm';
          Object.assign(b, { ms: 220, flip: dx > 0, x: b.x + clamp(to.x - b.x, -16, 16), z: b.z + clamp(to.z - b.z, -8, 8) });
          later(() => bugLeave(true, -dx), 260);
          return true;
        }
      }
      if (b.flight === 'burrow') {
        // dug up: the shovel at the mound, a puff of earth and it's caught; a tap anywhere else leaves it under its
        // mound. My villager turns to it where it stands (avatar.ts).
        if (swing !== 'catch') return false;
        if (b.held) return true;
        if (!claim(b.cid, b.id, b.x, b.z, 'dig')) return true;
        b.held = true;
        turnTo(b.x);
        const p = (bugEl && stageOf(bugEl)) ?? at;
        dig = { n: ++seq, ...p };
        sceneSfx('dig');
        if (bug === b) bug = null;
        later(() => {
          sceneSfx('catch');
          show(b.id, p.x, p.y, b.cid);
        }, 260);
        later(() => (dig = null), 700);
        return true;
      }
      if (swing === 'catch') {
        if (b.held) return true;
        // first wins: claimed at the tap (the relay's first claim is the catch)
        if (!claim(b.cid, b.id, b.x, b.z, 'net')) return true;
        // it holds still where it is (mid-flight included) under the net, swung where it is (my villager turns to it)
        const cs = getComputedStyle(bugEl).translate;
        Object.assign(b, { held: true, ms: 0, freeze: cs && cs !== 'none' ? cs : undefined });
        turnTo(b.x);
        const p = (bugEl && stageOf(bugEl)) ?? at;
        net = { n: ++seq, ...p };
        sceneSfx('net');
        later(() => {
          if (bug === b) bug = null;
          sceneSfx('catch');
          show(b.id, p.x, p.y, b.cid);
        }, 160);
        later(() => (net = null), 420);
        return true;
      }
      if (swing === 'startle') {
        // it flies off (on both phones); the tap still lands where it was meant (a visitor, a shell, the grass)
        claim(b.cid, b.id, b.x, b.z, 'flee');
        sceneSfx('bug-flee');
        bugLeave(true, px < r.left + r.width / 2 ? 1 : -1);
      }
    }
    const dv = diving;
    if (dv?.chase && !dv.gone && chaseEl && performance.now() <= dv.until) {
      const r = chaseEl.getBoundingClientRect(), reach = Math.max((S?.DIVE_U ?? 30) * w.scaleAt(dv.x, dv.z) * w.view.s, 22);
      if (Math.hypot(px - (r.left + r.width / 2), py - (r.top + r.height / 2)) <= reach * 1.2) {
        turnTo(dv.x); // no walk: the chase is a timing game
        sceneSfx('splash');
        dived(dv);
        return true;
      }
    }
    const at = w.worldAtClient(px, py);
    if (!at) return false;
    const sea = hitWorld(at.x, at.z).kind === 'sea';
    const spot = bubbles;
    if (spot && S && sea && !theirs(spot.cid)) {
      const [bx, by] = w.clientAt(spot.x, spot.z), reach = Math.max(S.DIVE_U * w.scaleAt(spot.x, spot.z) * w.view.s, 22);
      if (Math.hypot(px - bx, py - by) <= reach) {
        // in place (avatar.ts): my villager turns to the bubbles and the dive plays there; the chase never walks
        turnTo(spot.x);
        diveAt(spot);
        return true;
      }
    }
    const water = waterAt(at.x, at.z, sea);
    const f0 = water && fishes[water];
    const f = f0 && !theirs(f0.cid) ? f0 : null;
    // near where it's heading, or where it's seen now (it glides between waypoints: the eye goes by the latter)
    const seenAt = water ? scene?.querySelector(`[data-shadow-of="${water}"] [data-critter]`)?.getBoundingClientRect() : null;
    const nearSeen = !!seenAt && Math.hypot(px - (seenAt.left + seenAt.width / 2), py - (seenAt.top + seenAt.height / 2)) < CAST_U * w.scaleAt(at.x, at.z) * w.view.s;
    if (f && !f.gone && (Math.hypot(at.x - f.x, at.z - f.z) < CAST_U || nearSeen)) {
      castAt(f, at.x, at.z);
      return true;
    }
    return false;
  }

  // ---------- the visits ----------
  // Ambient life's critters (island/ambient.ts, docs/backend.md#ambient-life): each 10-second slot of the day brings the
  // same on both phones, on the relay's clock: a sea shadow or bubbles, a fresh-water shadow or a bug, its species from
  // the slot's seed, staying to the same boundary. This phone shows each where its camera sees that water or patch (none
  // in view, or the place taken: not here). While the island is live and visible; under a sheet or in a hidden tab the
  // critters leave, and coming back shows the ones still staying.
  /** `?critter=` (dev or ?demo) shows that one alone: no ambient visits around it, so it can be looked at and tested. */
  const pinned = hookFlag('critter') || hookFlag('sea');
  /** `?flea` (dev or ?demo): every tap on my villager sends a flea hopping off it (the e2e's hook). */
  const forceFlea = hookFlag('flea');
  /** The fresh waters on screen without a shadow (only waters near the view get a turn). */
  const freshOpen = (): FreshWhere[] => FRESH.filter((wh) => !fishes[wh] && areasOf(wh).some(inViewArea));
  /** The first look at the slots after the island shows (ms): the scene measured and the camera placed by then. */
  const FIRST_LOOK_MS = 3000;
  /** A slot's critter comes now, staying until the end of its last slot (`end`, the relay's ms), where its seed puts it
   *  in the world (critterPath.ts: the same on both phones; this camera shows it if it sees it), unless one of us has
   *  caught it (or it got away) today. */
  function visit(c: Spawn, date: string, end: number) {
    const stay = end - shared.now();
    if (stay < 1000) return;
    const cid = critterId(c);
    if (caught(shared.day, cid)) return;
    const t0 = slotStart(date, c.slot) + c.at;
    const o = { cid, path: { seed: c.seed, t0, total: end - t0 }, month: +date.slice(5, 7), hour: Math.floor(c.slot / 360) };
    const r = spawnRand(c);
    if (c.kind === 'fish') {
      if (!fishes.sea && !bubbles && !diving) void spawnFish('sea', stay, undefined, false, r, o);
    } else if (c.kind === 'bubbles') {
      if (!fishes.sea && !bubbles && !diving) void spawnBubbles(stay, undefined, false, r, o);
    } else if (c.kind === 'fresh') {
      const wt = freshWater(c);
      if (!fishes[wt]) void spawnFish(wt, stay, undefined, false, r, o);
    } else if (!bug) spawnBug(pickBug(o.month, o.hour, r, weather.sky), { stay, ...o });
  }
  $effect(() => {
    if (!scene || !enabled() || pinned) return;
    let id: ReturnType<typeof setTimeout>;
    /** The slot now: those coming in it (at their `at`) and, the first time, those still staying from before. */
    const slotNow = (first: boolean) => {
      const t = slotAt(now().getTime(), relayOffset());
      for (const c of crittersAt(t.date, t.slot)) {
        const end = slotStart(t.date, c.slot + c.slots);
        if (c.slot === t.slot && c.at > t.into) later(() => visit(c, t.date, end), c.at - t.into);
        else if (first || c.slot === t.slot) visit(c, t.date, end);
      }
      // a moment past the boundary, so the next reading is in the next slot
      id = setTimeout(() => slotNow(false), msToNextSlot(now().getTime(), relayOffset()) + 20);
    };
    // the first look once the scene has settled (measured, the camera placed), as the old first visit after 3–6 s
    id = setTimeout(() => slotNow(true), FIRST_LOOK_MS);
    return () => {
      clearTimeout(id);
      clearAll();
    };
  });

  onMount(() => {
    const want = hook('critter'), dive = hook('sea');
    if (!(want || dive)) return;
    // a critter waits for the world to be measured and a free spot (the layout may still be settling): a few tries; the
    // last ones take its place even off screen
    let tries = 0;
    // a hook's critter is shared too (its id the hook's: the demo's other tab, opened with the same hook, has the same one)
    const cid = `hook:${want ?? dive}`;
    const fishFor = async (water: Water, id?: FishId | PondFishId) => {
      if (!(await spawnFish(water, false, id, tries >= 4, rand, { cid })) && ++tries < 10) later(() => void fishFor(water, id), 400);
    };
    const bugFor = (id: BugId) => {
      if (!spawnBug(id, { stay: false, pinned: tries >= 4, cid }) && ++tries < 10) later(() => bugFor(id), 400);
    };
    const go = () => {
      if (!enabled() || !w.rest.ready) return later(go, 300);
      // ?sea=<id> | pearl | (anything else: the usual pick)
      if (dive !== null) void loadSea().then((m) => spawnBubbles(false, dive in m.SEA || dive === m.PEARL ? dive : undefined, true, rand, { cid }));
      else if (want === 'fish') void fishFor('sea');
      else if (!want) return;
      else if ((FRESH as readonly string[]).includes(want)) void fishFor(want as FreshWhere);
      else if (want in FISH) void fishFor('sea', want as FishId);
      else if (want === 'flea') flea(false);
      else if (want in BUGS && BUGS[want as BugId].flight !== 'dangle') bugFor(want as BugId);
      else void loadPond().then(({ POND_FISH }) => { if (want in POND_FISH) void fishFor(POND_FISH[want as PondFishId].water, want as PondFishId); });
    };
    later(go, 600);
    return clearAll;
  });
</script>

<!-- NH's fish shadow: one dark teardrop, its tail joined on (head to the left unless flipped) -->
{#snippet teardrop()}
  <svg viewBox="0 0 100 42" preserveAspectRatio="none"><path d="M3 21 C3 8 20 2 38 3 C56 4 68 11 80 17 L96 8 C99 16 99 26 96 34 L80 25 C68 31 56 38 38 39 C20 40 3 34 3 21 Z" /></svg>
{/snippet}

<!-- world nodes (camera.svelte.ts): no wrapper with a stacking order of its own, so each sits at its depth among the
     island's things -->
<div class="critters" aria-hidden="true">
  {#each WATERS as wt (wt)}
    {@const f = fishes[wt]}
    {#if f}
      {#key f.n}
        <!-- a flat ground mark at its spawn point; it swims inside the node (local x = across, local y = −z) -->
        <div class="node" data-shadow-of={wt} {@attach w.at({ x: f.ax, z: f.az, mode: 'flat', h: 10 })}>
          <span class="mover shadow {f.shape ? `is-${f.shape}` : ''} {wt}" class:gone={f.gone} class:dash={f.dash} class:spurt={f.spurt}
            data-critter={wt === 'sea' ? 'fish' : 'pond'} data-water={wt} bind:this={fishEls[wt]}
            style:translate={fishLoc(f)} style:transition-duration="{f.ms}ms" style:--w="calc({sizeU(f).toFixed(1)} * var(--u))">
            <i class="turn" style:rotate="{f.rot.toFixed(1)}deg"><i class="fin" class:flip={f.flip}>{@render teardrop()}</i></i>
          </span>
        </div>
      {/key}
    {/if}
  {/each}
  {#if bubbles}
    {#key bubbles.n}
      <!-- NH's dive spot: little bubbles rising and popping at the surface -->
      <div class="node" {@attach w.at({ x: bubbles.x, z: bubbles.z, h: 12 })}>
        <span class="mover bubbles" data-bubbles={bubbles.item}>
          {#each [[-3, 0], [2.5, 0.5], [-0.5, 1], [4, 1.5]] as [dx, d], i (i)}<i style:--dx="calc({dx} * var(--u))" style:animation-delay="{d * 0.45}s"></i>{/each}
        </span>
      </div>
    {/key}
  {/if}
  {#if diving}
    {@const d = diving}
    {#key d.n}
      {#if !d.chase}
        <div class="node" {@attach w.at({ x: d.ax, z: d.az, h: 20 })}>
          <span class="mover dive" data-dive="splash"><i class="ripple big"></i><span class="splash">{#each [-62, -30, 0, 30, 62] as a (a)}<i style:--a="{a}deg"></i>{/each}</span></span>
        </div>
      {:else}
        <div class="node" {@attach w.at({ x: d.ax, z: d.az, mode: 'flat', h: 10 })}>
          <span class="mover dive" class:gone={d.gone} data-dive="chase" bind:this={chaseEl} style:translate={loc(d.x - d.ax, -(d.z - d.az))} style:transition-duration="{d.ms}ms">
            <span class="shadow"><i class="fin" style:--w="calc({shadowLen(d.size)} * var(--u))">{@render teardrop()}</i></span>
          </span>
        </div>
      {/if}
    {/key}
  {/if}
  {#if cast}
    {@const c = cast}
    <!-- the bobber, upright where it landed; the line from the rod's tip (or the bank) is drawn in its node -->
    <div class="node" {@attach w.at({ x: c.x, z: c.z, h: 24 })}>
      <span class="mover bobber" data-bobber={c.under ? 'bite' : c.landed ? 'wait' : 'cast'} class:under={c.under}
        style:--fx="calc({c.fx.toFixed(1)} * var(--u))" style:--fy="calc({c.fy.toFixed(1)} * var(--u))">
        <svg class="line" class:landed={c.landed} width="1" height="1">
          <!-- from the rod's tip to the bobber, slack: it sags 8u in the middle -->
          <path transform="scale({w.rest.s})" d="M{c.fx.toFixed(1)} {c.fy.toFixed(1)} Q{(c.fx / 2).toFixed(1)} {(c.fy / 2 + 8).toFixed(1)} 0 -1.5" />
        </svg>
        {#key c.rings}{#if c.rings}<i class="ripple" class:big={c.under}></i>{/if}{/key}
        {#if c.under}
          <i class="ripple big late"></i>
          <!-- the bite's splash: seven drops, 14u high -->
          <span class="splash big">{#each [-75, -50, -25, 0, 25, 50, 75] as a (a)}<i style:--a="{a}deg"></i>{/each}</span>
        {/if}
        <span class="float" bind:this={bobEl}><i class="ball"></i></span>
      </span>
    </div>
    {#if c.under}
      <!-- NH's 「！」 over every world thing at its true size, nudged inside the screen -->
      <div class="node" {@attach w.at({ x: c.x, z: c.z, h: 40, zi: OVER, inv: true, always: true })}>
        <span class="inv"><span class="bang" data-bite style:left="{c.bdx.toFixed(1)}px">！</span></span>
      </div>
    {/if}
  {/if}
  {#if bug}
    {@const b = bug}
    {#key b.n}
      <div class="node" {@attach w.at({ x: b.ax, z: b.az, h: 80, dz: -16, light: night })}>
        <span class="mover bug {b.flight} {b.id}" class:night class:gone={b.gone} class:fled={b.fled} class:sat={b.sat} data-critter={b.id} data-place={b.place} bind:this={bugEl}
          style:translate={b.freeze ?? bugLoc(b)} style:transition-duration={b.fled ? null : `${b.ms}ms`} style:--ms="{b.ms}ms">
          <span class="hopper" bind:this={hopEl}>
            <span class="face" class:flip={b.flip}>
              {#if Sprite}<Sprite id={b.id} flight={b.flight} sat={b.sat} stalk={b.stalk} />{/if}
            </span>
          </span>
        </span>
      </div>
    {/key}
  {/if}
</div>

<div class="held">
  {#if dig}
    {#key dig.n}
      <!-- the mound dug open: the shovel strikes, clods of earth fly up -->
      <span class="fx digfx" style:translate="{su(dig.x)} {su(dig.y)}"><span class="shovel"><OfficialArt key={findArt('shovel')} size="calc(30 * var(--su))" eager /></span>{#each [-50, -15, 20, 55] as a (a)}<i style:--a="{a}deg"></i>{/each}</span>
    {/key}
  {/if}
  {#if net}
    {#key net.n}
      <span class="fx netfx" data-net="float" style:translate="{su(net.x)} {su(net.y)}">
        <svg viewBox="-20 -20 40 40"><path class="handle" d="M6 6 L19 19" /><circle class="hoop" cx="-1" cy="-1" r="9.5" /><path class="mesh" d="M-10 -1 H8 M-1 -10 V8 M-7.5 -7.5 L5.5 5.5 M-7.5 5.5 L5.5 -7.5" /></svg>
      </span>
    {/key}
  {/if}
  <CatchPlate {scene} bind:card />
</div>

<style>
  /* no z-index, no transform: the nodes inside keep the stage's stacking context (their depth orders them) */
  .critters { position: absolute; inset: 0; pointer-events: none; }
  .held { position: absolute; inset: 0; pointer-events: none; z-index: var(--z-taps); --su: calc(100cqw / 390); }
  .node { width: 0; height: 0; pointer-events: none; }
  .mover, .fx {
    position: absolute; left: 0; top: 0; width: 0; height: 0;
    transition-property: translate, opacity; transition-timing-function: cubic-bezier(.45, .05, .55, .95);
  }
  .mover > *, .fx > * { position: absolute; }
  .flip { scale: -1 1; }

  /* fish shadow: NH's dark teardrop (head to the left unless flipped), turned the way it swims, fading in, a slow tail
     wag */
  .shadow { animation: fade-in 1.4s ease-out both; }
  .shadow.gone { opacity: 0; transition-duration: 1.1s, 1.1s; }
  .shadow.spurt { transition-timing-function: cubic-bezier(.2, .7, .3, 1); }
  .shadow.dash { transition-timing-function: cubic-bezier(.2, .7, .4, 1); transition-duration: .65s, .6s; }
  .turn { display: block; left: 0; top: 0; width: 0; height: 0; transition: rotate .5s ease-out; }
  .fin {
    position: absolute; display: block; left: 0; top: 0; width: var(--w); height: calc(var(--w) * .42); translate: -50% -50%;
    animation: wag 1.3s ease-in-out infinite alternate;
  }
  .fin svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; fill: rgba(10, 36, 70, .55); filter: blur(calc(1.5 * var(--u))); }
  /* the fresh waters' are smaller and seen through shallower water: a sharper edge */
  .shadow:not(.sea) .fin svg { fill: rgba(10, 36, 70, .62); filter: blur(calc(.7 * var(--u))); }
  /* NH's long thin shadow (the eels) and the fin cutting the surface (the sharks, the sunfish, the suckerfish): a dark
     sail over the shadow's front half with a thin white wake at its foot */
  .is-narrow .fin { height: calc(var(--w) * .18); }
  .is-fin .fin::before {
    content: ''; position: absolute; left: 28%; bottom: 44%; width: 20%; height: 95%;
    background: linear-gradient(180deg, rgba(36, 58, 92, .95), rgba(44, 70, 108, .85)); clip-path: polygon(38% 0, 100% 100%, 0 100%);
    filter: drop-shadow(0 1px 0 rgba(255, 255, 255, .85));
  }
  @keyframes wag { from { transform: skewY(-4deg) scale(1, .96); } to { transform: skewY(4deg) scale(.97, 1); } }
  @keyframes fade-in { from { opacity: 0; } }

  /* the dive spot: bubbles rise from a point and pop; the dive: a splash, then a quick one's shadow darting off */
  .bubbles i {
    position: absolute; left: var(--dx); top: 0; width: calc(3.2 * var(--u)); height: calc(3.2 * var(--u)); margin: calc(-1.6 * var(--u));
    border-radius: 50%; border: 1px solid rgba(255, 255, 255, .9); background: rgba(255, 255, 255, .25);
    animation: bubble 1.8s ease-out infinite both;
  }
  @keyframes bubble { from { transform: translateY(calc(2 * var(--u))) scale(.4); opacity: 0; } 25% { opacity: 1; } 80% { opacity: .9; } to { transform: translateY(calc(-5 * var(--u))) scale(1.15); opacity: 0; } }
  .dive.mover { transition-timing-function: cubic-bezier(.2, .7, .4, 1); }
  .dive.gone { opacity: 0; }
  .dive .shadow { animation: fade-in .2s ease-out both; }
  .dive .fin svg { fill: rgba(10, 36, 70, .55); }

  /* the line: a thin arc from the rod to the bobber, drawn once the bobber lands */
  .line { left: 0; top: 0; overflow: visible; opacity: 0; transition: opacity .25s; }
  .line.landed { opacity: 1; }
  .line path { fill: none; stroke: rgba(255, 255, 255, .6); stroke-width: 1px; vector-effect: non-scaling-stroke; }
  /* the bobber: NH's red-and-white float, arcing in from the rod, then bobbing; under on the bite */
  .bobber .float { left: 0; top: 0; transform-origin: 50% 100%; animation: cast .3s cubic-bezier(.3, .2, .6, 1) both; }
  @keyframes cast {
    from { transform: translate(var(--fx), var(--fy)) translateY(calc(-14 * var(--u))); }
    50% { transform: translate(calc(var(--fx) * .5), calc(var(--fy) * .5)) translateY(calc(-16 * var(--u))); }
  }
  .ball {
    display: block; width: calc(8 * var(--u)); height: calc(8 * var(--u)); margin: calc(-6.4 * var(--u)) 0 0 calc(-4 * var(--u));
    border-radius: 50%; background: linear-gradient(180deg, #F2484A 0 48%, #FFFDF6 52%); box-shadow: inset -1px -1px 0 rgba(0, 0, 0, .12);
    animation: bob 1.5s ease-in-out .3s infinite alternate;
  }
  @keyframes bob { from { transform: translateY(calc(-.6 * var(--u))); } to { transform: translateY(calc(.6 * var(--u))); } }
  /* the bite: the bobber is yanked under (a plunge, then only a dark smudge where it went), a splash, a second ring and
     NH's 「！」 popping up over it: the moment to tap */
  .under .ball { animation: plunge .22s cubic-bezier(.5, 0, .9, .5) both; }
  @keyframes plunge {
    0% { transform: translateY(0); scale: 1; opacity: 1; }
    30% { transform: translateY(calc(-1.6 * var(--u))); scale: 1.05; }
    100% { transform: translateY(calc(4.5 * var(--u))); scale: .7 .5; opacity: .2; }
  }
  .ripple.late { animation-delay: .25s; }
  .splash { left: 0; top: 0; }
  .splash.big i { animation: drop-big .6s cubic-bezier(.2, .7, .4, 1) both; }
  @keyframes drop-big { from { transform: translateY(0) scale(.4); opacity: 1; } 60% { opacity: 1; } to { transform: translateY(calc(-14 * var(--u))) scale(.7); opacity: 0; } }
  .splash i {
    position: absolute; left: calc(-1.3 * var(--u)); top: calc(-1.6 * var(--u)); width: calc(2.6 * var(--u)); height: calc(3.6 * var(--u));
    border-radius: 50% 50% 45% 45%; background: rgba(255, 255, 255, .92); rotate: var(--a); transform-origin: 50% 100%;
    animation: drop .55s cubic-bezier(.2, .7, .4, 1) both;
  }
  @keyframes drop {
    from { transform: translateY(0) scale(.4); opacity: 1; }
    60% { opacity: 1; }
    to { transform: translateY(calc(-11 * var(--u))) scale(.7); opacity: 0; }
  }
  /* the 「！」 node is drawn at its true size: --inv undoes the node's perspective scale */
  .inv { position: absolute; left: 0; top: 0; width: 0; height: 0; scale: var(--inv, 1); transform-origin: 0 0; }
  .bang {
    position: absolute; left: 0; top: 0; translate: -50% -100%; margin-top: -24px;
    display: grid; place-items: center; width: clamp(26px, calc(27 * var(--su)), 28px); aspect-ratio: 1; border-radius: 50%;
    background: #FFFDF6; box-shadow: 0 2px 0 rgba(150, 110, 70, .35), 0 0 0 2px #F2484A inset;
    font: 900 clamp(16px, calc(17 * var(--su)), 18px) / 1 var(--font-ui); color: #E8383A;
    transform-origin: 50% 100%; animation: bang .32s cubic-bezier(.3, 1.6, .5, 1) both;
  }
  @keyframes bang { from { transform: scale(.2); opacity: 0; } 40% { opacity: 1; } }
  .ripple {
    display: block; left: 0; top: 0; width: calc(18 * var(--u)); height: calc(6 * var(--u)); margin: calc(-3 * var(--u)) 0 0 calc(-9 * var(--u));
    border: 1.4px solid rgba(255, 255, 255, .85); border-radius: 50%; animation: ripple .8s ease-out both;
  }
  .ripple.big { width: calc(28 * var(--u)); height: calc(9 * var(--u)); margin: calc(-4.5 * var(--u)) 0 0 calc(-14 * var(--u)); }
  @keyframes ripple { from { transform: scale(.2); opacity: 1; } to { transform: scale(1.3); opacity: 0; } }

  /* bugs: the motion (the sprites are BugSprite.svelte, loaded with the first bug) */
  .bug.gone { opacity: 0; }
  /* startled: seen all the way up and away, fading only over the last 40% */
  .bug.fled { transition-duration: var(--ms), calc(var(--ms) * .4); transition-delay: 0s, calc(var(--ms) * .6); transition-timing-function: cubic-bezier(.3, .6, .4, 1), linear; }
  .bug .hopper, .bug .face { left: 0; top: 0; display: block; }
  .flutter .hopper { animation: flutter .42s ease-in-out infinite alternate; }
  .flutter.sat .hopper { animation: none; }
  /* a ladybug or a mantis on a flower head: a 1u bob every 2.4 s */
  .flower .hopper { animation: perch-bob 2.4s ease-in-out infinite; }
  @keyframes perch-bob { 0%, 100% { transform: none; } 50% { transform: translateY(calc(-1 * var(--u))); } }
  .flower.mover { transition-timing-function: cubic-bezier(.3, .6, .4, 1); }
  @keyframes flutter { from { transform: translateY(calc(-2.5 * var(--u))); } to { transform: translateY(calc(2 * var(--u))); } }
  .dart.mover { transition-timing-function: cubic-bezier(.2, .8, .3, 1); }
  .perch.mover { transition-timing-function: cubic-bezier(.3, .6, .4, 1); }
  .crawl { animation: fade-in .8s ease-out both; }
  .crawl.mover { transition-timing-function: ease-in-out; }
  .hop.mover { transition-timing-function: ease-out; }
  .stalk { animation: fade-in .8s ease-out both; }
  .stalk.mover { transition-timing-function: ease-in-out; }
  .burrow.mover { animation: fade-in .8s ease-out both; }
  .digfx i {
    position: absolute; left: calc(-1.4 * var(--su)); top: calc(-1.4 * var(--su)); width: calc(2.8 * var(--su)); height: calc(2.8 * var(--su));
    border-radius: 45%; background: #8A6A44; rotate: var(--a); transform-origin: 50% 100%; animation: clod .6s cubic-bezier(.2, .7, .4, 1) both;
  }
  .digfx .shovel { position: absolute; left: 0; top: 0; line-height: 0; translate: -20% -95%; transform-origin: 30% 100%; animation: dig-shovel .6s cubic-bezier(.3, .6, .4, 1) both; }
  @keyframes dig-shovel {
    0% { transform: rotate(-40deg) translateY(-6px); opacity: 0; } 12% { opacity: 1; } 45% { transform: rotate(8deg); }
    80% { opacity: 1; } 100% { transform: rotate(-10deg) translateY(-8px); opacity: 0; }
  }
  @keyframes clod { from { transform: translateY(0) scale(.6); opacity: 1; } 60% { opacity: 1; } to { transform: translateY(calc(-14 * var(--su))) scale(.9); opacity: 0; } }
  /* at night the bugs sit above the tint: dim them like the island (a firefly keeps its light) */
  .bug.night:not(.drift) .face { filter: brightness(.8) saturate(.85); }

  /* the net: one swing across the bug */
  .netfx svg { width: calc(30 * var(--su)); translate: -50% -50%; overflow: visible; transform-origin: 80% 80%; animation: swing .4s cubic-bezier(.3, .7, .4, 1) both; }
  .hoop { fill: rgba(255, 255, 255, .25); stroke: #F4E9D2; stroke-width: 1.6; }
  .mesh { stroke: rgba(255, 255, 255, .6); stroke-width: .5; }
  .handle { stroke: #B88A55; stroke-width: 2.2; stroke-linecap: round; }
  @keyframes swing { 0% { transform: rotate(-70deg); opacity: 0; } 20% { opacity: 1; } 70% { transform: rotate(25deg); opacity: 1; } 100% { transform: rotate(32deg); opacity: 0; } }
</style>
