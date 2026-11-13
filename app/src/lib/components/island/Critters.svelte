<script lang="ts">
  // The island's critters (docs/design.md "Critters", "Scene interactions": who comes, fishing, diving, the bugs; the
  // rules are critters.ts, fishing.ts, sea.ts, pondFish.ts and critterPath.ts, each header its numbers). This component
  // plays them: the slots (ambient life's, island/ambient.ts), a fish shadow off each stretch of the coast
  // (world/coast.ts) and in each fresh water (pondFish.ts, its own chunk, with the first such shadow), the bubbles
  // (sea.ts, loaded with the first spot) and the bugs (where each: critters.ts bugPlace; a mole cricket under a mound,
  // dug up by a tap; a reared tarantula or scorpion charges off at a second tap); the partner's catches played here.
  // Each critter is a world node (camera.svelte.ts) at its spot: a fish shadow a flat ground mark, a bug, the bobber and
  // the bubbles upright. They move inside their node by CSS transitions between waypoints a timer picks every second or
  // few, in the node's local units (a flat node's local y is −z; an upright one's −z·ground − lift), so nothing runs
  // per frame. Taps are hit-tested against their live boxes (getBoundingClientRect works through the transforms).
  // SceneTaps.svelte mounts this inside the stage and routes taps here first (`tap`, client px), a shaken bush
  // (`fromBush`), a tap on my villager (`fromVillager`) and the rock (`fromRock`). Covered or hidden: they all leave at
  // once and the countdown holds. Decorative, pointer-only.
  //   ?critter=fish | pond | river | mouth | clifftop | <fish id> | <fresh fish id> | <bug id> (dev or test mode): one now,
  //   staying until caught (the e2e's hook; it comes where the camera can see it if it can, else at its place);
  //   ?sea=<id>|pearl: a bubble spot; ?flea: a tap on my villager always sends a flea off it.
  import { fx3d, has3d } from '../../world/fx3d.ts';
  import { angle, angling, floatLift, nibbled } from '../world3d/fishing3d.ts';
  import { NOTICE_U, cast as castLine, due, pull, step as stepLine, type Around, type Line as MyLine, type Plan, type Step } from '../../world/fishing.ts';
  import { actorOf } from '#lib/ui-state/cast.ts';
  import { moveFast, pace, type CritKind } from '../world3d/pace.ts';
  import { showCatch } from './catchCard.ts';
  import { timers } from '../../world/timers.ts';
  import { fnv1a as seedOf, pickOne } from '#lib/random.ts';
  import { hook, hookFlag, hooksOn, islandSeed } from '../../world/devHooks.ts';
  import { skyAt, yieldSky } from './weatherNow.svelte.ts';
  import type { Sky } from '../../world/weather.ts';
  import { onMount, untrack } from 'svelte';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { SHOWN, bodyRect, grow, hitSources, inside, type Seen } from '../../world/hitbox.ts';
  import { artUrl } from '#lib/art.ts';
  import { jst, now } from '#lib/time/clock.ts';
  import { bugRivals, crittersAt, msToNextSlot, slotAt, slotStart, spawnRand, type Spawn } from './ambient.ts';
  import { relayOffset } from './ambientClock.ts';
  import { coasts } from '../../world/coast.ts';
  import { site } from './site.svelte.ts';
  import { su, type Tod } from './scene.ts';
  import { hitWorld, sceneSfx } from './sceneTaps.ts';
  import type { Box } from '../../world/geom.ts';
  import { clearAt, guardsU, stageGeo } from '../../world/placement.ts';
  import { recordFind, recordGoods } from '#lib/store/actions.ts';
  import { catchLine, loadLines, loadNames } from './catchLine.ts';
  import { digSpots, findArt } from '../../world/beach.ts';
  import { eggTime, eventNow } from '../../world/events.ts';
  import { eggOnLine } from '../../world/eggs.ts';
  import { partnerTurnTo, sendTo, turnTo } from './avatar.ts';
  import { world as shared } from '#lib/store/world.svelte.ts';
  import { caught, lyingAt } from '#lib/sync/world-day.ts';
  import type { FishPhase, How, Relayed, Who } from '#lib/contract/live-protocol.ts';
  import { GLIDE_U, STILL, bubblesAt, bugAt, bugPath, clearOf, critterId, fishPath, freshWater, groundOk, inWater, legAt, type BugOpts, type Leg } from './critterPath.ts';
  import { tellPartner } from './partnerNews.ts';
  import { inMotion, livePos } from '../motion/director.svelte.ts';
  import { t } from '#lib/i18n/index.ts';
  import type { DiveItem } from '../../world/sea.ts';
  import { OVER, useWorld } from './camera.svelte.ts';
  import { GOAL_TREES, ROCK, SEA_BOX, SHORE_Z, flowerById, offBuildingsAt } from '../../world/world.ts';
  import {
    BUGS, bushes, FISH, FRESH, POND_SHADOW, REAR_MS, SEA_SWIM, STAY_MS,
    bugPlace, bushBug, critterArt, findKind, fleesFrom, freshAreas, shadowLen, fleaJumps, hookItem, landing, netSwing,
    oddsAt, patches, perch3d, perches, pickBug, pickFish, sameWater, stalkTap, swimAt, swimPick, swimmable, type BugId, type Catch,
    type FishId, type JunkId, type Patch, type Swim, type Water
  } from '../../world/critters.ts';
  import type { PondFishId } from '../../world/pondFish.ts';
  import type { FreshWhere } from '../../world/world.ts';
  import { bugLoc, fishLoc, loc, poolOf, seaPool, type Bug, type Fish, type Line, type Net, type P3, type Pool, type Shared } from './critterTypes.ts';
  import { critterMotion3d } from './critterMotion3d.ts';
  import { clamp } from '#lib/math.ts';

  interface Props {
    scene?: HTMLElement;
    tod: Tod;
    /** Live, not covered by a sheet, page visible. */
    enabled: () => boolean;
  }
  let { scene, tod, enabled }: Props = $props();
  const w = useWorld();

  const rand = Math.random;
  const between = (a: number, b: number) => a + rand() * (b - a);

  /** One shadow off each stretch of coast and one in each fresh water, at most. */
  const none = (): Partial<Record<Pool, Fish | null>> => ({});
  let fishes = $state<Partial<Record<Pool, Fish | null>>>(none());
  /** The shadows here now. */
  const allFish = (): Fish[] => Object.values(fishes).filter((f): f is Fish => !!f);
  // ---------- my line (fishing.ts: its state machine; here, what each of its steps plays) ----------
  /** My line, as the machine has it (null: none out). */
  let line = $state.raw<MyLine | null>(null);
  /** Each line's number (a shadow's darts at an older one stand down), when it went out (the relay's clock: the others'
   *  phones hear it), and its rings so far (the landing's, each nibble's small ring, the bite's splash: a node each). */
  let lineN = 0, lineS = 0;
  let rings = $state(0);
  /** The 「！」's nudge (px) keeping it on screen, and whether the 3D island drew it (fx3d.ts: the DOM's invisible). */
  let bang = $state<{ dx: number; in3d: boolean } | null>(null);
  /** Why the last tap on water did what it did (the e2e's `__fish.why()`). */
  let why = '';
  // the 3D island's angler (world3d/fishing3d.ts: my 3D villager's rod swings out, tugs at the bite, reels in); a reel
  // stays said till the next cast
  $effect(() => {
    const l = line;
    if (l) angle(l.phase === 'bite' ? 'bite' : l.phase === 'flying' ? 'cast' : 'wait', l);
    else if (angling.phase !== 'reel') angle(null);
    // (the line in without a reel: the critters left, the day ended)
    if (!l) untrack(() => tellLine('off'));
  });
  // gone with the line out (through a door: the phone's socket stays, so the others hear it end), and the others'
  // villagers' rods down (their steps go unheard till I'm back)
  onMount(() => () => {
    clearTimeout(tickT);
    if (line) tellLine('off');
    angle(null);
    for (const l of Object.values(lines)) if (l) angle(null, undefined, l.slot);
  });
  /** Where the 3D float is this frame (one array, rewritten: read every frame). */
  const floatXYZ: [number, number, number] = [0, 0, 0];
  const floatAt = (l: MyLine) => ((floatXYZ[0] = l.x), (floatXYZ[1] = l.z), (floatXYZ[2] = floatLift(performance.now())), floatXYZ);
  // the 3D float bobs, dips and plunges each frame (fishing3d.ts floatLift): frames at full rate while it's on the water
  const floatOut = $derived(!!line && line.phase !== 'flying');
  $effect(() => {
    if (floatOut && w.rest.three) return w.moveStart();
  });
  /** The bugs about (ambient life's two roaming ones, one out of a bush, from under the rock, off a villager), at
   *  most MAX_BUGS. */
  let bugs = $state<Bug[]>([]);
  const MAX_BUGS = 2;
  const isBug = (b: Bug) => bugs.includes(b);
  const dropBug = (b: Bug) => void (isBug(b) && (bugs = bugs.filter((x) => x !== b)));
  /** Each bug's sprite and hopper (by its `n`). */
  const bugEls = $state<Record<number, HTMLElement>>({});
  const hopEls = $state<Record<number, HTMLElement>>({});
  let net = $state<Net | null>(null);
  /** A spot of bubbles in the sea: something to dive for. */
  let bubbles = $state<{ n: number; item: DiveItem; x: number; z: number; cid?: string } | null>(null);
  /** A dive: the splash, then (a quick one) its shadow darting off, catchable until `until`. */
  let diving = $state<{ n: number; item: DiveItem; x: number; z: number; ax: number; az: number; ms: number; size: number; chase: boolean; until: number; gone: boolean; cid?: string } | null>(null);
  /** The sea creatures' module (world/sea.ts): loaded with the first bubble spot, out of the island's first load. */
  let S: typeof import('../../world/sea.ts') | null = null;
  let seaChunk: Promise<typeof import('../../world/sea.ts')> | null = null;
  const loadSea = () => (seaChunk ??= import('../../world/sea.ts').then((m) => (S = m)).catch((e) => ((seaChunk = null), Promise.reject(e))));
  /** Earth flying up where a mole cricket was dug up. */
  let dig = $state<Net | null>(null);
  let seq = 0;
  $effect(() => {
    const list = () => bugs.flatMap((b) => {
      const el = bugEls[b.n];
      return !b.gone && el ? [{ box: grow(bugBox(b, el)), kind: 'bug' }] : [];
    });
    hitSources.add(list);
    return () => void hitSources.delete(list);
  });
  let chaseEl = $state<HTMLElement>();
  const night = $derived(tod === 'night');

  // ---------- timers (all cleared when the critters leave) ----------
  const pending = timers(), later = pending.later;
  function clearAll() {
    pending.clear();
    clearTimeout(tickT);
    fishes = none();
    bugs = [];
    line = net = dig = bubbles = diving = bang = null;
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
      const p = swimPick(a, rand);
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
  /** (`?coast=front|back|left|right`, dev or test mode: a hook's sea shadow off that side of the island) */
  const coastSide = hook('coast');
  const areasOf = (water: Water): Swim[] =>
    water === 'sea' ? coasts().filter((c) => !coastSide || c.side === coastSide).map((c) => c.area) : freshAreas(water);
  const inViewArea = (a: Swim) => a.tiles
    ? a.tiles.some(([x, z], i) => i % 3 === 0 && w.inView(x, z, -16))
    : [0, -0.7, 0.7].some((s) => [0, -0.8, 0.8].some((t) => { const p = swimAt(a, s, t); return w.inView(p.x, p.z, -16); }));

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
  let pondChunk: Promise<typeof import('../../world/pondFish.ts')> | null = null;
  // (a failed fetch let go of: the next shadow asks again, as loadSea does)
  const loadPond = () => (pondChunk ??= import('../../world/pondFish.ts').catch((e) => ((pondChunk = null), Promise.reject(e))));

  /** A shadow in `water`, `want` being one of its fish: a shared one (`o.path`) where its seed puts it, wherever that is
   *  (the projector shows it when the camera sees it); else (a dev hook's) where the camera can see it (`pinned`: or
   *  anywhere in it). `stay`: how long it stays (ms; true: STAY_MS.fish, false: until caught); `r`: what it is
   *  (ambient life's seeded species, the same on both phones). */
  async function spawnFish(water: Water, stay: boolean | number = true, want?: FishId | PondFishId, pinned = false, r = rand, o: Shared & { month?: number; hour?: number; coast?: number; sky?: Sky } = {}): Promise<boolean> {
    const pool = poolOf(water, o.coast);
    if (fishes[pool]) return true;
    const t = jst(now()), month = o.month ?? t.month, hour = o.hour ?? t.hour;
    let id: FishId | PondFishId, look: { size: number; shape?: 'narrow' | 'fin' };
    if (water === 'sea') {
      id = want ?? pickFish(month, hour, r, o.sky ?? yieldSky.sky);
      look = FISH[id as FishId];
    } else {
      const { POND_FISH, pickFresh } = await loadPond();
      if (fishes[pool] || !enabled()) return !!fishes[pool];
      id = want ?? pickFresh(water, month, hour, r);
      look = POND_FISH[id as PondFishId];
    }
    let area: Swim | null = null, p: { x: number; z: number } | null = null, anchor: { x: number; z: number } | null = null;
    let legs: Leg[] | undefined;
    if (o.path) {
      // the shared world's: from its seed, where it is now in its stay
      const path = fishPath(o.path.seed, water, o.path.total, o.coast);
      if (!path) return false;
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
        area = areas[0] ?? areasOf(water)[0] ?? null;
        p = area && (freeSwim(area, (x, z) => inWater(water, x, z)) ?? { x: area.cx, z: area.cz });
      }
    }
    if (!area || !p) return false;
    anchor ??= p;
    // a dev hook's fish (kept until caught: `stay` false) is always a fish, never junk
    const item = want ?? (stay ? hookItem(id, r) : id);
    preload(critterArt(item));
    void loadLines().catch(() => {});
    const f: Fish = {
      n: ++seq, item, water, pool, size: look.size, shape: look.shape, x: p.x, z: p.z, ax: anchor.x, az: anchor.z, ms: 0, flip: rand() < 0.5, rot: 0, area,
      gone: false, dash: false, ...(o.cid ? { cid: o.cid } : {}), ...(legs ? { legs, t0: o.path!.t0 } : {})
    };
    fishes[pool] = f;
    const fp = fishes[pool]!; // the state's proxy (the timers compare against it)
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
  /** Playing with a bobber: mine, or another's line out at it. */
  const busy = (f: Fish) => line?.fish === fishId(f) || !!f.taken;
  /** A slow wander to another spot in its patch of water (NH shadows dawdle), unless it's busy with a bobber: a shared
   *  one along its itinerary, leg by leg at its time (the same on both phones). */
  function swim(f: Fish) {
    if (fishes[f.pool] !== f || f.gone) return;
    if (f.legs && f.t0 !== undefined) {
      const e = shared.now() - f.t0;
      const k = f.legs.findIndex((l) => l.t + l.ms > e);
      if (k < 0) return;
      const l = f.legs[k];
      if (l.t > e) return later(() => swim(f), l.t - e);
      if (!busy(f)) {
        f.spurt = false;
        swimTo(f, l.x, l.z, Math.max(0, l.t + l.ms - e));
      }
      return later(() => swim(f), Math.max(0, l.t + l.ms - e) + 20);
    }
    if (!busy(f)) {
      f.spurt = false;
      // (along a coast, a glide at a time and by sea, as the shared ones: critterPath.ts)
      const ok = swimOk(f, guards(4)), from = { x: f.x, z: f.z };
      const p = freeSwim(f.area, f.area.tiles ? (x, z) => Math.hypot(x - from.x, z - from.z) <= GLIDE_U && swimmable(f.water, from.x, from.z, x, z) && ok(x, z) : ok) ?? f;
      swimTo(f, p.x, p.z, clamp(Math.hypot(p.x - f.x, p.z - f.z) * (f.water === 'sea' ? 110 : 160), 2500, 6000));
    }
    later(() => swim(f), f.ms + between(600, 2200));
  }
  function leaveFish(f: Fish) {
    if (fishes[f.pool] !== f) return;
    if (busy(f)) return void (f.due = true); // (letGo: once the line lets it go)
    f.gone = true;
    later(() => fishes[f.pool] === f && (fishes[f.pool] = null), 1200);
  }
  /** A line let go of it (reeled in, ended, another came to it): its stay over meanwhile, it leaves now. */
  const letGo = (f: Fish | null | undefined) => f && f.due && !busy(f) && leaveFish(f);
  /** Spooked (an early pull, or the bite missed): a quick dart away from the float (x, z) and gone (on both phones: it
   *  got away). */
  function fleeFrom(f: Fish, x: number, z: number) {
    if (fishes[f.pool] !== f || f.gone) return;
    const p = fishNow(f) ?? f;
    claim(f.cid, f.item, p.x, p.z, 'flee');
    const d = Math.hypot(p.x - x, p.z - z) || 1;
    const run = f.water === 'sea' ? 40 : 14; // a small water: it dives instead of darting off
    Object.assign(f, { x: p.x, z: p.z });
    swimTo(f, p.x + ((p.x - x) / d) * run, p.z + ((p.z - z) / d) * run, 650);
    Object.assign(f, { dash: true, gone: true });
    later(() => fishes[f.pool] === f && (fishes[f.pool] = null), 700);
  }

  /** The shadow under a key (fishId), while it's here. */
  const fishByKey = (k: string | null | undefined): Fish | null => (k ? (allFish().find((f) => fishId(f) === k) ?? null) : null);
  /** The island's day (ambient life's, on the relay's clock: the shadows' own). */
  const today = () => slotAt(now().getTime(), relayOffset()).date;
  /** What a step of my line asks of the island: my villager, the day, the shadows. */
  const around = (): Around => {
    return {
      day: today(), rand,
      // the nearest free shadow on that water within NOTICE_U, open water between it and the float
      notice(x, z, water) {
        let best: { fish: string; d: number } | null = null;
        for (const f of allFish()) {
          if (f.gone || f.taken || theirs(f.cid) || !sameWater(water, f.water)) continue;
          const p = fishNow(f) ?? f, d = Math.hypot(p.x - x, p.z - z);
          if (d <= NOTICE_U && (!best || d < best.d) && swimmable(f.water, p.x, p.z, x, z)) best = { fish: fishId(f), d };
        }
        return best;
      },
      here(k) {
        const f = fishByKey(k);
        return !!f && !f.gone && !f.taken && !theirs(f.cid);
      }
    };
  };
  /** The look between steps while the float waits (ms): a shadow swimming near it notices it within this. */
  const LOOK_MS = 250;
  let tickT: ReturnType<typeof setTimeout> | undefined;
  /** My line stepped to now (fishing.ts step), what it did played, and the next step set for when it's due. */
  function tick() {
    clearTimeout(tickT);
    const l = line;
    if (!l) return;
    const t = performance.now(), r = stepLine(l, t, around());
    line = r.line;
    for (const st of r.steps) play(st, l);
    if (l.fish && r.line?.fish !== l.fish) letGo(fishByKey(l.fish));
    if (r.line) tickT = setTimeout(tick, Math.max(10, Math.min(due(r.line), t + LOOK_MS) - t));
  }
  /** A step of my line, played: the float, the shadow, the sounds, the 「！」, the others' phones. */
  function play(st: Step, was: MyLine) {
    const l = line ?? was, f = 'fish' in st ? fishByKey(st.fish) : null;
    switch (st.ev) {
      case 'land':
        rings++;
        sceneSfx('plop');
        return;
      case 'notice':
        // (the others' phones: the shadow at it is mine now)
        tellLine('cast');
        if (f) follow(f, l, st.plan);
        return;
      case 'arrive':
        return;
      case 'nibble':
        rings++;
        nibble(f ?? undefined);
        sceneSfx('nibble');
        return;
      case 'bite': {
        // NH's 「！」 (the phone's cue: NH has only the plunk) kept inside the screen, 8px from its sides; the 3D
        // island draws its own over my villager's head while the bite lasts (world3d/biteMark.ts, from the angler's
        // step: on the others' phones too), this one hidden (its splash and big ring are the float's node's)
        const cx = w.clientAt(l.x, l.z)[0] - w.view.left, half = 22;
        bang = { dx: clamp(cx, half, w.view.vw - half) - cx, in3d: has3d() };
        rings++;
        tellLine('bite');
        sceneSfx('bite');
        return;
      }
      case 'escape':
        // too late: it got away (the float stays out, bobbing)
        bang = null;
        tellLine('cast');
        sceneSfx('flee');
        if (f) fleeFrom(f, l.x, l.z);
        return;
      case 'lost':
        bang = null;
        tellLine('cast');
        return;
      case 'off':
        bang = null;
        return;
    }
  }

  /** A tap on water at world `at` with no line out: the cast there, however far, from where my villager stands (NH: no
   *  walk; the user: "I want to be able to fish from anywhere"). False: no water there, or a building's in front of it
   *  (not ours: the tap goes on to what's there). */
  function castAt(at: { x: number; z: number }, seen: Seen, px: number, py: number): boolean {
    const to = landing(at.x, at.z) ?? onShadow(px, py);
    if (!to) return (why = 'not water'), false;
    // (behind a building's body: the building's tap)
    if (!seen(to.x, to.z)) return (why = 'behind a building'), false;
    const [mx, mz] = livePos('mine');
    // walking: it stops where it is, and casts
    if (inMotion('mine')) sendTo(mx, mz);
    turnTo(to.x);
    line = castLine(to, performance.now(), today());
    lineN++;
    lineS = Math.round(shared.now());
    rings = 0;
    bang = null;
    // the partner's phone: their villager of mine turns to it (the line itself is the `fish` steps')
    shared.share({ kind: 'act', act: 'cast', pt: [Math.round(to.x), Math.round(to.z)] });
    tellLine('cast');
    sceneSfx('cast');
    why = `cast in the ${to.water}`;
    tick();
    return true;
  }

  /** The shadow that noticed my float swims up to it (NH): it turns to it, then closes in over 2–3 short darts with
   *  pauses between, nose to the float by the plan's `arrive` (all from when it noticed). */
  function follow(f: Fish, l: MyLine, plan: Plan) {
    const n = lineN, key = fishId(f), t0 = l.noticed || performance.now();
    const live = () => lineN === n && line?.fish === key;
    const at = (ms: number) => Math.max(0, t0 + ms - performance.now());
    const from = fishNow(f) ?? f;
    const d = Math.hypot(from.x - l.x, from.z - l.z) || 1;
    const ux = (l.x - from.x) / d, uz = (l.z - from.z) / d;
    const len = sizeU(f) * 0.5;
    const end = { x: l.x - ux * len, z: l.z - uz * len };
    Object.assign(f, { ms: 0, x: from.x, z: from.z, spurt: true });
    // (the 3D model's nose meets the float once it's there)
    nose = { f, at: t0 + plan.arrive, n };
    face(f, l.x, l.z);
    const k3 = d > 60 ? 3 : 2, share = k3 === 3 ? [0.5, 0.82, 1] : [0.62, 1];
    const moves = share.map(() => between(450, 700)), pauses = share.slice(1).map(() => between(300, 600));
    const total = [...moves, ...pauses].reduce((a, b) => a + b, 0), avail = at(plan.arrive);
    const k = Math.min(1, avail / total);
    let t = Math.max(0, avail - total * k); // a beat to turn and look first
    moves.forEach((m, i) => {
      later(() => live() && Object.assign(f, { ms: m * k, x: from.x + (end.x - from.x) * share[i], z: from.z + (end.z - from.z) * share[i] }), t);
      t += (m + (pauses[i] ?? 0)) * k;
    });
  }

  let bobEl = $state<HTMLElement>();
  const fishEls: Partial<Record<Pool, HTMLElement>> = $state({});
  /** Where the shadow is right now (world), mid-transition included: its node's anchor plus its inner offset (the 3D
   *  island's: where its model is, by the same curves). */
  function fishNow(f: Fish): { x: number; z: number } | null {
    if (w.rest.three) {
      const g = fishGlide(fishId(f), f, performance.now());
      return { x: g.x, z: g.z };
    }
    const el = fishEls[f.pool];
    if (!el) return null;
    const [lx, ly] = getComputedStyle(el).translate.split(' ').map(parseFloat);
    if (!Number.isFinite(lx)) return null;
    const s = w.view.s;
    return { x: f.ax + lx / s, z: f.az - (Number.isFinite(ly) ? ly : 0) / s };
  }
  // ---------- the 3D island's critters, frame by frame (glide.ts) ----------
  // The 2D sprites move by CSS transitions; the 3D models read the same moves here each frame (their nodes' `live`), by
  // the same curves: smooth from wherever they are (never a jump), turning toward where they go. A fish's model stands
  // by its nose (assets.json shadow/*: the body trails behind it), so the middle the game moves is set half a body
  // behind it. While it plays with my line its nose meets the float: backed off a little, each nibble a bump on it with
  // the float's dip (fishing3d.ts), the bite a lunge onto it as it plunges; scared, it darts off with a quick tail
  // wiggle. The models fade in and out (world3d/things.ts: never popped).
  const { mos, fishId, bugId, len3, fishGlide, mirrorFish, mirrorBug, srcBug, fish3, fishYaw, bug3, bugYaw, bugOff, ball3, ballRoll, ballOff } = critterMotion3d({
    line: () => line, nose: () => nose, lineN: () => lineN, relayNow: () => shared.now(), snapshot: (v) => $state.snapshot(v) as typeof v
  });
  /** My line's fish, nose to the float from `at` (performance.now() ms) on, for that line (`n`: lineN). */
  let nose: { f: Fish; at: number; n: number } | null = null;
  // the 3D island's frames for them (world3d/pace.ts): a shadow dawdling at the ambient rate (the engine's 30 a
  // second: a slow move is ambience), a dart off or a bug's flight fast on screen at the full rate to its move's end (a
  // butterfly drifting slowly or off screen is ambience, as a slow model's move is: Island3D); their fades are the 3D
  // island's own (world3d/things.ts). The moves' state of the critters gone dropped.
  // (by kind: perf.rest says which keeps the island at the full rate)
  const fullTill: Record<CritKind, number> = { fish: 0, bug: 0, rear: 0 };
  const fullTimer: Partial<Record<CritKind, ReturnType<typeof setTimeout>>> = {};
  const wake = () => w.moveStart()();
  function full3(kind: CritKind, ms: number) {
    const till = performance.now() + ms;
    if (till <= fullTill[kind]) return;
    if (!fullTill[kind]) pace.full[kind]++;
    fullTill[kind] = till;
    clearTimeout(fullTimer[kind]);
    fullTimer[kind] = setTimeout(() => {
      pace.full[kind]--;
      fullTill[kind] = 0;
    }, ms);
    wake();
  }
  /** A bug's move drawn at the full rate (pace.ts moveFast: a startled flight, one with no 3D spot yet, or one at least
   *  SLOW_PX a second on screen, a dart's and a hop's alike). */
  function bugFast(b: Bug): boolean {
    const m = mos.get(bugId(b));
    if (!pace.slow) return true;
    return moveFast(b.ms, !!b.fled, m ? w.screenAt(m.xyz[0], m.xyz[1], m.xyz[2]) : null, w.screenAt(b.x, b.z, b.lift), w.view);
  }
  /** A fish's dart off drawn at the full rate: as a bug's move, on screen and fast there (a startled shadow anywhere on
   *  the island held all of it at 30 frames a second for ~0.85 s, review 2026-11-13). */
  function dashFast(f: Fish): boolean {
    const m = mos.get(fishId(f));
    if (!pace.slow) return true;
    return moveFast(f.ms, false, m ? w.screenAt(m.xyz[0], m.xyz[1], m.xyz[2]) : null, w.screenAt(f.x, f.z), w.view);
  }
  onMount(() => () => {
    for (const k of ['fish', 'bug', 'rear'] as const) {
      clearTimeout(fullTimer[k]);
      if (fullTill[k]) pace.full[k]--;
      fullTill[k] = 0;
    }
  });
  $effect(() => {
    if (!w.rest.three) return;
    const ids = new Set<string>();
    for (const f of allFish()) {
      ids.add(fishId(f));
      void f.x, void f.z, void f.ms;
      if (f.dash && untrack(() => dashFast(f))) full3('fish', f.ms + 200);
    }
    for (const b of bugs) {
      ids.add(bugId(b));
      void b.x, void b.z, void b.lift, void b.flip, void b.gone;
      if (untrack(() => bugFast(b))) full3('bug', b.ms + 200);
    }
    for (const id of mos.keys()) if (!ids.has(id)) mos.delete(id);
    if (!ids.size) return;
    pace.ambient++;
    wake();
    return () => void pace.ambient--;
  });

  /** A nibble: the float twitches, a small gentle wiggle (nothing like the bite's plunge). */
  function nibble(f?: Fish) {
    nibbled();
    tellLine('nibble');
    // the shadow's nose bumps the float (2u toward its head and back), in step with the float's twitch
    const fin = f ? fishEls[f.pool]?.querySelector('.fin') : null;
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

  /** NH's A button while the line is out (fishing.ts pull, on the line as it's shown): the line comes in; on the bite
   *  the fish with it, any earlier with a fish at it, it's scared off. */
  function reelIn() {
    const l = line!, p = pull(l), f = 'fish' in p ? fishByKey(p.fish) : null;
    clearTimeout(tickT);
    line = null;
    bang = null;
    turnTo(l.x);
    angle('reel', l);
    tellLine('reel', l);
    sceneSfx('reel');
    if (p.ev === 'reel' || !f) return void ((why = 'reel'), letGo(fishByKey(l.fish)));
    if (p.ev === 'scare') {
      why = 'scared';
      sceneSfx('flee');
      return fleeFrom(f, l.x, l.z);
    }
    why = 'caught';
    if (fishes[f.pool] === f) fishes[f.pool] = null;
    // first wins: the partner reeling in the same shadow a moment before has it (their news says so here)
    if (!claim(f.cid, f.item, l.x, l.z, 'rod')) return;
    sceneSfx('catch');
    const at = stageAt(l.x, l.z);
    show(f.item, at.x, at.y, f.cid);
  }

  // ---------- bugs ----------
  // (what they are and how they move: critterPath.ts)
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
        // (on the 3D island: on the model's bark, toward the camera, under its canopy)
        const s = w.rest.three ? perch3d(p, f) : { x: p.x + p.dx, z: p.z - 1, lift: p.lift * f };
        if (seen(s.x, s.z, s.lift, keep, 5, 6)) {
          spots.push(s);
          break;
        }
      }
    if (spots.length) return pickOne(spots, rand);
    if (!pinned) return null;
    // nowhere on screen: the nearest trunk ahead of the camera all the same
    const p = [...all].sort((a, b) => Math.abs(a.z - w.view.camZ - 150) - Math.abs(b.z - w.view.camZ - 150))[0];
    return p ? (w.rest.three ? perch3d(p) : { x: p.x + p.dx, z: p.z - 1, lift: p.lift }) : null;
  }

  /** A bug comes on where NH keeps it and the camera can see it (`pinned`: or at its place anyway); false when there's
   *  nowhere clear for it right now. `from`: it flies (or hops) in from there (a shaken bush, my villager, the rock),
   *  keeping to `area`. */
  function spawnBug(id: BugId | null, o: { from?: P3; area?: Patch; avoid?: Patch[]; taken?: P3[]; stay?: boolean | number; pinned?: boolean; keep?: BugOpts['keep'] } & Shared = {}): boolean {
    const { area, stay = true, pinned = false } = o;
    if (!id || bugs.length >= MAX_BUGS) return bugs.length > 0;
    void loadSprite();
    preload(critterArt(id));
    void loadLines().catch(() => {});
    if (o.path) return placeBug(id, o, o.path);
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
      // away from the villagers: they idle and wander round where they stand, and one passing in front would take the
      // tap meant for the bug; the half of the heads farthest from them
      const vils = [...document.querySelectorAll('[data-actor]')].map((el) => el.getBoundingClientRect()).filter((r) => r.width);
      const far = (h: { x: number; z: number; lift: number }) => {
        const q = w.screenAt(h.x, h.z, h.lift);
        return Math.min(Infinity, ...vils.map((r) => Math.hypot(q.sx - (r.left + r.width / 2 - w.view.left), q.sy - (r.top + r.height / 2 - w.view.top))));
      };
      if (vils.length && heads.length > 1) heads = [...heads].sort((a, b) => far(b) - far(a)).slice(0, Math.ceil(heads.length / 2));
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
        // (one in view first; on its own ground where a patch has any, off screen or not: a bench may stand in front of
        // the campfire)
        const seenFirst = [...list].sort((a, b) => +w.inView((b.x0 + b.x1) / 2, (b.z0 + b.z1) / 2) - +w.inView((a.x0 + a.x1) / 2, (a.z0 + a.z1) / 2));
        for (const a of seenFirst) if ((spot = freeIn(a, (p) => groundOk(place, p.x, p.z)))) { patch = a; break; }
        if (!spot) {
          patch = seenFirst[0];
          spot = { x: (patch.x0 + patch.x1) / 2, z: (patch.z0 + patch.z1) / 2, lift: patch.l0 };
        }
      }
    }
    if (!spot) return false;
    const shown = seen(spot.x, spot.z, spot.lift, null);
    // (a perch's or a flower's spot is its one, vetted already with its own margins: the walk in never looks again)
    const oneSpot = flight === 'perch' || flight === 'flower';
    // this phone's own itinerary from there (critterPath.ts, as a shared one's), kept on screen and clear of the
    // controls when its spot is
    const total = typeof stay === 'number' ? stay : stay ? STAY_MS.bug : KEPT_MS;
    return placeBug(id, { ...o, at: { spot, patch: oneSpot ? null : patch }, keep: shown && !oneSpot ? ok : undefined }, { seed: (rand() * 2 ** 32) >>> 0, t0: shared.now(), total });
  }
  /** How long a bug kept until it's caught (a dev hook's) has moves for. */
  const KEPT_MS = 30 * 60_000;
  /** A bug on its itinerary (critterPath.ts bugPath: a shared one's from its seed, wherever that is: the projector
   *  shows it when the camera sees it), where in its stay it is now. */
  function placeBug(id: BugId, o: { from?: P3; area?: Patch; avoid?: Patch[]; taken?: P3[]; stay?: boolean | number; at?: BugOpts['at']; keep?: BugOpts['keep'] } & Shared, p: NonNullable<Shared['path']>): boolean {
    const path = bugPath(id, p.seed, p.total, { from: o.from, area: o.area, white: whiteHeads(), avoid: o.avoid, taken: o.taken, at: o.at, keep: o.keep });
    if (!path) return false;
    const e = shared.now() - p.t0, at = bugAt(path.flight, path.legs, path.start, e);
    const k = path.legs.findLastIndex((l) => l.t <= e), spot = path.spot, last = k >= 0 ? path.legs[k] : null;
    bugs.push({
      n: ++seq, id, flight: path.flight, place: path.place, x: at.x, z: at.z, lift: at.lift, ax: spot.x, az: spot.z, g: Math.max(0.2, w.screenAt(spot.x, spot.z).ground), ms: 0,
      flip: spot.x >= site.midX, gone: false, sat: !!last?.sat && e >= last.t + last.ms,
      ...(path.flight === 'stalk' && { stalk: 'calm' as const }), cid: o.cid, legs: path.legs, start: path.start, t0: p.t0
    });
    const b = bugs.at(-1)!; // (the state's proxy: the timers compare against it)
    later(() => fly(b), 60);
    const stay = o.stay ?? true;
    if (stay) later(() => bugLeave(b), stay === true ? STAY_MS.bug : stay);
    return true;
  }
  /** The white flowers' ids (the orchid mantis's). */
  const whiteHeads = () => flowerHeads().filter((h) => h.white).map((h) => h.fid);
  /** Its next move, at its time (critterPath.ts): a shared one's the same moves at the same moments on both phones.
   *  The 3D model follows the itinerary's own curve (bug3); the invisible sprite, the tap box's fallback, its legs. */
  function fly(b: Bug) {
    if (!isBug(b) || b.gone || b.held || !b.legs || b.t0 === undefined) return;
    if (b.stalk === 'rear') return later(() => fly(b), 600); // reared up at my tap: it holds still
    const e = shared.now() - b.t0;
    const k = b.legs.findIndex((l) => l.t + l.ms > e);
    if (k < 0) return;
    const l = b.legs[k];
    if (l.t > e) return later(() => fly(b), l.t - e);
    const left = Math.max(0, l.t + l.ms - e);
    b.sat = false;
    Object.assign(b, { ms: left, flip: l.x > b.x, x: l.x, z: l.z, lift: l.lift });
    if (l.hop) hopEls[b.n]?.animate([{ translate: '0 0' }, { translate: '0 calc(-9 * var(--u))', offset: 0.45 }, { translate: '0 0' }], { duration: Math.max(120, left), easing: 'ease-out' });
    if (l.sat) later(() => isBug(b) && !b.gone && !b.held && (b.sat = true), left);
    later(() => fly(b), left + 20);
  }
  /** Off its itinerary, from where it's drawn now (a startle, a charge, a rear, the net take it from there). */
  function offLegs(b: Bug) {
    if (!b.legs || !b.start || b.t0 === undefined) return;
    const m = mos.get(bugId(b)), p = m?.g.started ? { x: m.xyz[0], z: m.xyz[1], lift: m.xyz[2] } : bugAt(b.flight, b.legs, b.start, shared.now() - b.t0);
    Object.assign(b, { x: p.x, z: p.z, lift: p.lift, ms: 0, legs: undefined });
  }
  /** Off to the nearer side, up a little, fading (a firefly or a cricket just fades where it is). */
  function bugLeave(b: Bug, fast = false, away?: number) {
    if (!isBug(b) || b.gone || b.held) return;
    offLegs(b);
    b.gone = true;
    b.goneAt = performance.now();
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
      Object.assign(b, { ms: 2000, sat: false, flip: dir > 0, x: b.x + dir * 90, lift: b.lift + 30 });
    }
    later(() => dropBug(b), b.ms + 50);
  }

  // my villager running at a flier, a percher or a hopper sends it off (on both phones), as in NH; walked up to slowly
  // or netted from where it stands, it stays (critters.ts fleesFrom). Looked at 5 times a second while one is about.
  $effect(() => {
    const list = bugs.filter((b) => !b.gone && !b.held && fleesFrom(b.flight, 0, Infinity));
    if (!list.length) return;
    let last = livePos('mine'), lt = performance.now();
    const id = setInterval(() => {
      const p = livePos('mine'), t = performance.now();
      const ups = (Math.hypot(p[0] - last[0], p[1] - last[1]) / Math.max(1, t - lt)) * 1000;
      [last, lt] = [p, t];
      if (!inMotion('mine')) return;
      for (const b of list) {
        if (!isBug(b) || b.gone || b.held || theirs(b.cid)) continue;
        const m = mos.get(bugId(b)), qx = m?.g.started ? m.xyz[0] : b.x, qz = m?.g.started ? m.xyz[1] : b.z;
        if (!fleesFrom(b.flight, Math.hypot(p[0] - qx, p[1] - qz), ups)) continue;
        claim(b.cid, b.id, b.x, b.z, 'flee');
        sceneSfx('bug-flee');
        bugLeave(b, true, Math.sign(qx - p[0]) || 1);
      }
    }, 200);
    return () => clearInterval(id);
  });

  /** A pill bug (or, in its hours, a centipede) crawls out from under the rock (Care's rock tap). */
  export function fromRock(_x?: number, _y?: number) {
    if (bugs.length >= MAX_BUGS) return;
    const { hour } = jst(now());
    const id: BugId = oddsAt(BUGS.centipede, 1, hour) > 0 ? 'centipede' : 'pill-bug';
    // a little patch of lawn in front of the rock's foot
    putBug(id, 'rock', ROCK[0] + 8, ROCK[1] - 6);
  }

  /** The goal trees' fruit lies here once met (its row is a button): a flea never lands under it. */
  // (the row button stands up the screen from that ground: its top edge is ~30u further in, measured at 390 × 844)
  const fruitGround = (): Patch[] => Object.values(GOAL_TREES).map(([x, z]) => ({ x0: x - 56, x1: x + 56, z0: z - 34, z1: z + 34, l0: 0, l1: 0 }));
  /** Where a bug put down by a person's doing comes from and keeps to: out of a bush, from under the rock, off a
   *  villager (`src`), from (x, z). */
  function putFrom(src: string, x: number, z: number): { from: P3; area: Patch; avoid?: Patch[] } {
    if (src === 'rock') return { from: { x, z, lift: 0 }, area: patches('rock')[0] };
    // off the villager it hopped from, never back under its button (its figure stands up the screen from its feet)
    if (src === 'flea') return { from: { x, z, lift: 34 }, area: { x0: x - 90, x1: x + 90, z0: z - 50, z1: z + 16, l0: 0, l1: 0 }, avoid: [{ x0: x - 30, x1: x + 30, z0: z - 8, z1: z + 48, l0: 0, l1: 0 }, ...fruitGround()] };
    const b = bushes().find((s) => Math.abs(s.x - x) < 2 && Math.abs(s.z - z) < 2), h = b?.h ?? 40;
    return { from: { x, z, lift: h * 0.7 }, area: { x0: x - 30, x1: x + 30, z0: z - 14, z1: z + 14, l0: 20, l1: 50 } };
  }
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
    if (bugs.length >= MAX_BUGS || !(forceFlea || fleaJumps(jst(now()).month, rand))) return;
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
    if (bugs.length >= MAX_BUGS) return;
    const id = typeof which === 'number' ? `hedge-${which}` : which;
    const b = bushes().find((s) => s.id === id);
    if (!b) return;
    const { month, hour } = jst(now());
    const bid = bushBug(month, hour, rand, yieldSky.sky);
    if (bid) putBug(bid, 'bush', b.x, b.z);
  }

  // ---------- diving ----------
  /** A spot of bubbles rises in the sea in front of the beach (where a shadow would swim, on screen), with a sea
   *  creature (or a pearl) under it. */
  async function spawnBubbles(stay: boolean | number = true, want?: string, pinned = false, r = rand, o: Shared & { month?: number; hour?: number } = {}) {
    const m = await loadSea().catch(() => null);
    if (!m || bubbles || diving) return;
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
  /** The catch: NH's caption on a plate with the official icon, popping up out of the catch at (x, y) (stage
   *  units) (in the bottom stack: CatchStack.svelte). */
  /** The plates asked for: only a newer one drops one still waiting for its words (a spawn, a line or a dig in the
   *  meantime dropped it, its find already recorded: the session's first catch, its names' fetch the wait). */
  let plates = 0;
  async function show(item: Catch | DiveItem, x: number, y: number, cid?: string) {
    // the partner's claim reached the relay first: it's theirs (its plate is the news's)
    if (!stillMine(cid)) return;
    const pearl = item === 'pearl';
    const kind = pearl ? 'shell' : S && item in S.SEA ? 'sea' : findKind(item as FishId | PondFishId | JunkId | BugId);
    // Bunny Day's celebrations: now and then a fish on the line (any water's) is NH's water egg (a caption only, no find)
    const t0 = now();
    if (kind === 'fish' && eggTime(eventNow(t0)) && eggOnLine(rand)) {
      const n = ++plates;
      await loadNames().catch(() => {});
      if (plates !== n) return;
      recordGoods('water-egg', cid && `catch:${cid}`);
      showCatch(x, y, findArt('water-egg'), t('beach.fished', { name: t('beach.name.water-egg') }));
      return;
    }
    // the shared ずかん: the first catch of each fish, bug or sea creature (junk isn't a find; the pearl is a shell) gets
    // a second page saying so
    const added = kind ? recordFind(kind, item, cid && `catch:${cid}`) : false;
    // junk is no find, but it's kept (the shop buys it: contract/pocket.ts goods)
    if (!kind) recordGoods(item, cid && `catch:${cid}`);
    // a fish or a bug tells the island (Turkey Day's Franklin and Wendell wait for a fish; Chip and Nat cheer)
    if (kind === 'fish' || kind === 'bug') scene?.dispatchEvent(new CustomEvent('island:catch', { detail: { kind, id: item } }));
    const n = ++plates;
    const text = pearl ? await loadNames().then(() => t('beach.picked', { name: t('beach.name.pearl') }), () => '') : await catchLine(item as Catch);
    if (plates !== n) return;
    const art = pearl ? findArt(item) : critterArt(item as Catch);
    showCatch(x, y, art, text, added);
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
   *  their villager runs over and nets it, reels it in, digs it up or dives for it, and its plate joins the stack (out
   *  of view, its icon from the edge); `beat`: I tapped it too, and the relay heard them first. */
  function theirCatch(e: { what: string; id?: string; at?: readonly [number, number]; how?: How; who?: Who; t?: number }, live: boolean, beat: boolean) {
    const id = e.id, how = e.how;
    const f = allFish().find((x) => x.cid === id) ?? null;
    const b = bugs.find((x) => x.cid === id) ?? null;
    const bb = bubbles && bubbles.cid === id ? bubbles : null;
    const dv = diving && diving.cid === id ? diving : null;
    // my line was out for it: it's theirs now (my float waits on: the next step finds it gone)
    if (f && line?.fish === fishId(f)) queueMicrotask(tick);
    if (how === 'flee') {
      if (f && fishes[f.pool] === f) {
        // (from where it is now: mid-swim)
        const p = fishNow(f) ?? f;
        Object.assign(f, { x: p.x, z: p.z, dash: true, gone: true });
        swimTo(f, p.x + (f.flip ? 30 : -30), p.z, 650);
        later(() => fishes[f.pool] === f && (fishes[f.pool] = null), 700);
      }
      if (b) bugLeave(b, true);
      if (bb && bubbles === bb) bubbles = null;
      if (dv) getAway(dv.n, true);
      return;
    }
    const at = e.at ?? (f ? [f.x, f.z] : b ? [b.x, b.z] : bb ? [bb.x, bb.z] : null);
    const gone = () => {
      if (f && fishes[f.pool] === f) {
        f.gone = true;
        later(() => fishes[f.pool] === f && (fishes[f.pool] = null), 500);
      }
      if (b) dropBug(b);
      if (bb && bubbles === bb) bubbles = null;
      if (dv && diving === dv) diving = null;
    };
    if (!live || !at) return gone();
    const [x, z] = at;
    if (b) Object.assign(b, { held: true, ms: 0 });
    // in place: their villager turns to it, and the net or the shovel shows at the catch (a reel or a dive: a splash)
    partnerTurnTo(x, e.who, e.t);
    const p = stageAt(x, z);
    // (the 3D island's swing: fx3d.ts)
    if (how === 'dig') dig = { n: ++seq, ...p, in3d: fx3d('swing', x, z, 0, { v: 'shovel' }) && fx3d('dust', x, z, 0, { v: '#b48a5a' }) };
    else if (how !== 'rod' && how !== 'dive') net = { n: ++seq, ...p, in3d: fx3d('swing', x, z, 0, { v: 'net' }) };
    later(() => (net = dig = null), 700);
    const ms = how === 'rod' ? 900 : how === 'dive' ? 450 : how === 'dig' ? 260 : 300;
    later(() => {
      gone();
      if (how === 'rod' || how === 'dive') sceneSfx('splash', [x, z]);
      tellPartner({ who: e.who, art: artOf(e.what), verb: beat ? 'beat' : verbOf(how), name: nameOf(e.what, how), x, z });
    }, ms);
  }

  /** A bug the partner's doing put on the island (out of a bush, from under the rock, off their villager): it comes
   *  out here too, along the same itinerary (from its id), while its stay lasts. */
  function theirBug(e: { id: string; what: string; at: readonly [number, number]; t: number }) {
    const [, bid, src] = e.what.split(':');
    if (!bid || !(bid in BUGS) || bugs.length >= MAX_BUGS || bugs.some((b) => b.cid === e.id)) return;
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
        partnerTurnTo(e.pt[0], e.who, e.t);
      }
    })
  );

  /** A tap on the scene (client px), before SceneTaps' own flourishes: true when a critter took it; only what shows there
   *  (`seen`); a line out reels in (`reel`: not on a building's door, which one goes through with it out). */
  export function tap(px: number, py: number, seen: Seen = SHOWN, reel = true): boolean {
    if (line) {
      if (!reel) return false;
      reelIn();
      return true;
    }
    const g = geo();
    if (!g) return false;
    // (the partner has it already, their villager on the way: it's theirs, the tap goes on to whatever else is there)
    const b = nearestBug(px, py, seen), bugEl = b && bugEls[b.n];
    if (b && bugEl) {
      // what it draws (its mover is a 0 × 0 point): on its tap box (hitbox.ts, at least 44px) it's caught
      const r = bugBox(b, bugEl);
      const d = Math.hypot(px - (r.left + r.width / 2), py - (r.top + r.height / 2));
      // (a percher on a trunk: a wider box, 56px, over the tree's own: the critters answer a tap first)
      const swing = inside(grow(r, b.flight === 'perch' ? 56 : undefined), px, py) ? 'catch' : netSwing(d, Math.max(r.width, r.height));
      const at = { x: (r.left + r.width / 2 - g.r.left) * g.k, y: (r.top + r.height / 2 - g.r.top) * g.k };
      if (b.flight === 'stalk' && b.stalk) {
        // NH's tarantula: it rears up when it's come at, charges if you keep coming; settled again, it can be netted
        const act = stalkTap(b.stalk, swing);
        if (act === 'rear' || act === 'charge') turnTo(b.x); // no walk: its mood is the game
        if (act !== 'none') offLegs(b); // (come at, it stays where it is till it charges off or is netted)
        if (act === 'rear') {
          b.stalk = 'rear';
          full3('rear', REAR_MS + 200); // (its front lifted, drawn at once: it may have been resting, its model still)
          // reared up, on the 3D island too: it lifts its front (bug3) under NH's 「！」 till it settles (the 3D model
          // had no rear: the first tap showed nothing, the second came while it was reared and it always charged off)
          fx3d('bang', b.x, b.z, b.lift + 12, { ms: REAR_MS, held: () => isBug(b) && b.stalk === 'rear' });
          later(() => isBug(b) && b.stalk === 'rear' && (b.stalk = 'settled'), REAR_MS);
          return true;
        }
        if (act === 'charge') {
          claim(b.cid, b.id, b.x, b.z, 'flee');
          sceneSfx('bug-flee');
          const to = w.worldAtClient(px, py) ?? b;
          const dx = Math.sign(to.x - b.x) || 1;
          b.stalk = 'calm';
          Object.assign(b, { ms: 220, flip: dx > 0, x: b.x + clamp(to.x - b.x, -16, 16), z: b.z + clamp(to.z - b.z, -8, 8) });
          later(() => bugLeave(b, true, -dx), 260);
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
        dig = { n: ++seq, ...p, in3d: fx3d('swing', b.x, b.z, 0, { v: 'shovel' }) && fx3d('dust', b.x, b.z, 0, { v: '#b48a5a' }) };
        sceneSfx('dig');
        dropBug(b);
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
        offLegs(b); // (netted where it's drawn)
        if (!claim(b.cid, b.id, b.x, b.z, 'net')) return true;
        // it holds still where it is (mid-flight included) under the net, swung where it is (my villager turns to it)
        const cs = getComputedStyle(bugEl).translate;
        Object.assign(b, { held: true, ms: 0, freeze: cs && cs !== 'none' ? cs : undefined });
        turnTo(b.x);
        const p = (bugEl && stageOf(bugEl)) ?? at;
        net = { n: ++seq, ...p, in3d: fx3d('swing', b.x, b.z, b.lift, { v: 'net', dir: b.x < site.midX ? -1 : 1 }) };
        sceneSfx('net');
        later(() => {
          dropBug(b);
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
        bugLeave(b, true, px < r.left + r.width / 2 ? 1 : -1);
      }
    }
    const dv = diving;
    if (dv?.chase && !dv.gone && chaseEl && performance.now() <= dv.until && seen(dv.x, dv.z)) {
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
    if (spot && S && sea && !theirs(spot.cid) && seen(spot.x, spot.z)) {
      const [bx, by] = w.clientAt(spot.x, spot.z), reach = Math.max(S.DIVE_U * w.scaleAt(spot.x, spot.z) * w.view.s, 22);
      if (Math.hypot(px - bx, py - by) <= reach) {
        // in place (avatar.ts): my villager turns to the bubbles and the dive plays there; the chase never walks
        turnTo(spot.x);
        diveAt(spot);
        return true;
      }
    }
    return false;
  }
  /** A tap on the water (SceneTaps, once nothing on it took the tap: a find, a visitor, a tree over it): the cast there
   *  from where my villager stands, or why not. True when it cast. */
  export function fish(px: number, py: number, seen: Seen = SHOWN): boolean {
    if (line || !geo()) return false;
    const at = w.worldAtClient(px, py);
    return !!at && castAt(at, seen, px, py);
  }
  /** A tap on a shadow as drawn (its body and half a finger round it: the ground under the finger may be the bank
   *  behind a narrow stream, near the horizon): where its float lands. */
  function onShadow(px: number, py: number): ReturnType<typeof landing> {
    for (const f of allFish()) {
      if (f.gone) continue;
      const { p, cx, cy, half, shown } = seenOf(f);
      if (shown && Math.hypot(px - cx, py - cy) <= half + 22) return landing(p.x, p.z);
    }
    return null;
  }
  /** My line is out (SceneTaps: any tap on the island but a door is its reel, NH's A button). */
  export const lineOut = (): boolean => !!line;
  /** Where a shadow is seen now (client px), its half-length there (px: the 3D model's, longer than the 2D sprite's in a
   *  fresh water) and whether it's in view. */
  function seenOf(f: Fish): { p: { x: number; z: number }; cx: number; cy: number; half: number; shown: boolean } {
    const p = fishNow(f) ?? f, [cx, cy] = w.clientAt(p.x, p.z);
    return { p, cx, cy, half: ((w.rest.three ? Math.max(len3(f), sizeU(f)) : sizeU(f)) / 2) * w.scaleAt(p.x, p.z) * w.view.s, shown: w.inView(p.x, p.z) };
  }
  /** Where a bug is drawn (client px): on the 3D island its model's spot (bug3's: the true x, z and lift, by the 3D
   *  island's curves; its invisible sprite moves by its own transition from a flat offset at its spot's scale, 30–110 px
   *  off the model as a percher flies in, so a tap on what's drawn startled it), its sprite's size round it; else the
   *  sprite's own box. */
  function bugBox(b: Bug, el: HTMLElement): DOMRect {
    const r = bodyRect(el) ?? el.getBoundingClientRect(), m = w.rest.three ? mos.get(bugId(b)) : undefined;
    if (!m) return r;
    const [cx, cy] = w.clientAt(m.xyz[0], m.xyz[1], m.xyz[2]), bw = Math.max(r.width, 20), bh = Math.max(r.height, 20);
    return new DOMRect(cx - bw / 2, cy - bh / 2, bw, bh);
  }
  /** Whether a tap at client (px, py) is on my bug as drawn: SceneTaps gives it the tap over the island's buttons (a bug
   *  flies or crawls in front of my villager, a canopy, a door). A fish's shadow lies on the water, behind them all: a
   *  button over it hides it, and the button keeps its tap (a canopy over the pond shakes its tree). */
  export function onCritter(px: number, py: number): boolean {
    if (line) return false;
    return bugs.some((b) => {
      const el = bugEls[b.n];
      return !b.gone && !!el && !theirs(b.cid) && inside(grow(bugBox(b, el), 0, 0), px, py);
    });
  }
  /** The bug a tap is for: of those mine to catch and shown, the one nearest it as drawn (null: none about). */
  function nearestBug(px: number, py: number, seen: Seen): Bug | null {
    let best: Bug | null = null, bd = Infinity;
    for (const b of bugs) {
      const el = bugEls[b.n];
      if (b.gone || !el || theirs(b.cid) || !seen(b.x, b.z)) continue;
      const r = bugBox(b, el), d = Math.hypot(px - (r.left + r.width / 2), py - (r.top + r.height / 2));
      if (d < bd) (best = b), (bd = d);
    }
    return best;
  }
  // ---------- the others' lines (docs/design.md "Shared world") ----------
  // Each step of my line goes to the others' phones (`fish`: presence only), and theirs come here: their villager's rod,
  // the line to their float, its dips and plunge and the reel, and the shadow at their float swims up to it, theirs
  // while it's at it (it never notices mine). A `cast` step again at the same float says which shadow is at it now
  // (one noticed it, or it got away: none). Someone coming while my line is out hears its step again; someone whose
  // phone goes is no longer fishing.
  /** The last step of mine told (`off` and `reel` end it). */
  let told: FishPhase | null = null;
  function tellLine(ph: FishPhase, l: MyLine | null = line) {
    if (ph === 'off' ? told === null || told === 'reel' || told === 'off' : !l) return;
    told = ph;
    // (the line runs from my villager's rod: `from` its feet, where a phone draws it from when the rod isn't in)
    const [mx, mz] = livePos('mine'), cid = fishByKey(l?.fish)?.cid;
    shared.tell({
      kind: 'fish', ph,
      ...(l ? { pt: [Math.round(l.x), Math.round(l.z)] as const, from: [Math.round(mx), Math.round(mz)] as const, s: lineS, ...(cid ? { id: cid } : {}) } : {})
    });
  }
  let lines = $state<Partial<Record<Who, Line>>>({});
  const lineFish = (l: Line) => (l.id ? (allFish().find((f) => !f.gone && f.cid === l.id) ?? null) : null);
  /** The shadow another's line is at: theirs, swimming up to their float (never one at my line). */
  function takeFor(l: Line) {
    const f = lineFish(l);
    if (!f || !f.cid || theirs(f.cid) || line?.fish === fishId(f) || f.taken === l.who) return;
    f.taken = l.who;
    const p = fishNow(f) ?? f, d = Math.hypot(p.x - l.x, p.z - l.z) || 1, gap = Math.min(d, sizeU(f) / 2 + 2);
    Object.assign(f, { x: p.x, z: p.z, ms: 0 });
    swimTo(f, l.x + ((p.x - l.x) / d) * gap, l.z + ((p.z - l.z) / d) * gap, clamp(d * 12, 600, 2400));
  }
  /** A step of another's line. */
  function theirLine(m: Extract<Relayed, { kind: 'fish' }>) {
    const slot = actorOf(m.who);
    if (slot === 'mine') return;
    const was = lines[m.who];
    if (m.ph === 'reel' || m.ph === 'off') {
      if (!was) return;
      angle(m.ph === 'reel' ? 'reel' : null, undefined, slot);
      const f = lineFish(was);
      if (f?.taken === m.who) (f.taken = undefined), letGo(f); // (a catch or its getting away comes as their `catch`)
      const { [m.who]: _gone, ...rest } = lines;
      lines = rest;
      return;
    }
    if (!m.pt) return;
    if (!was || was.x !== m.pt[0] || was.z !== m.pt[1]) {
      // the line goes out (or a phone coming late hears where it is): their villager's rod swings it out, the float
      // lands a moment later (cast again elsewhere, its off unheard: the shadow the old line was at goes free)
      const old = was && lineFish(was);
      if (old?.taken === m.who) (old.taken = undefined), letGo(old);
      lines = { ...lines, [m.who]: { who: m.who, slot, id: m.id, x: m.pt[0], z: m.pt[1], sx: m.from?.[0] ?? m.pt[0], sz: m.from?.[1] ?? m.pt[1], landed: false, under: false, rings: 0, n: ++seq } };
      angle('cast', { x: m.pt[0], z: m.pt[1] }, slot);
      const l = lines[m.who]!;
      later(() => {
        if (lines[m.who]?.n !== l.n || l.landed) return;
        l.landed = true;
        l.rings++;
        angle(l.under ? 'bite' : 'wait', undefined, slot);
      }, m.ph === 'cast' ? 300 : 0);
    } else if (m.ph === 'cast' && was.id !== m.id) {
      // the same float, another shadow at it (or none: it got away), the float back up bobbing
      const old = lineFish(was);
      if (old?.taken === m.who) (old.taken = undefined), letGo(old);
      was.id = m.id;
      if (was.under) (was.under = false), angle('wait', undefined, slot);
    }
    const l = lines[m.who]!;
    takeFor(l);
    if (m.ph === 'nibble') {
      if (!l.landed) (l.landed = true), angle('wait', undefined, slot);
      l.rings++;
      nibbled(slot);
    } else if (m.ph === 'bite' && !l.under) {
      l.under = true;
      l.rings++;
      angle('bite', undefined, slot);
    }
  }
  onMount(() => {
    const offs = [
      shared.hear((m) => m.kind === 'fish' && theirLine(m)),
      // someone came: my line's step again (they see it as it is); someone gone: their line with them
      shared.onHere((here) => {
        for (const w of Object.keys(lines) as Who[]) if (!here.includes(w)) theirLine({ kind: 'fish', ph: 'off', who: w, v: 3, t: 0 });
        const l = line, now = here.join();
        if (l && told && told !== 'off' && told !== 'reel' && now !== hereWas && here.some((w) => !hereWas.split(',').includes(w))) tellLine(l.phase === 'bite' ? 'bite' : 'cast');
        hereWas = now;
      })
    ];
    return () => offs.forEach((f) => f());
  });
  let hereWas = '';
  /** Another's float this frame (world x, z, lift: their line's bob, dips and plunge). */
  const floatOf = (l: Line): [number, number, number] => [l.x, l.z, floatLift(performance.now(), l.slot)];

  // ---------- the visits ----------
  // Ambient life's critters (island/ambient.ts, docs/backend.md#ambient-life): each 10-second slot of the day brings the
  // same on both phones, on the relay's clock: a sea shadow or bubbles, a fresh-water shadow or a bug, its species from
  // the slot's seed, staying to the same boundary. This phone shows each where its camera sees that water or patch (none
  // in view, or the place taken: not here). While the island is live and visible; under a sheet or in a hidden tab the
  // critters leave, and coming back shows the ones still staying.
  /** `?critter=` (dev or test mode) shows that one alone: no ambient visits around it, so it can be looked at and tested. */
  const pinned = hookFlag('critter') || hookFlag('sea');
  /** `?flea` (dev or test mode): every tap on my villager sends a flea hopping off it (the e2e's hook). */
  const forceFlea = hookFlag('flea');
  /** The first look at the slots after the island shows (ms): the scene measured and the camera placed by then. */
  const FIRST_LOOK_MS = 3000;
  /** What lies on the ground to be tapped at `t` (a slot's start), as the shared day has it on both phones (world x,
   *  z): the puts lying then (presents, wood: lyingAt, never what each phone has heard since) where they're drawn, and
   *  the day's dig spots (dug or not: the same on both). */
  function tapSpots(date: string, t: number): { x: number; z: number }[] {
    const puts = lyingAt(shared.day, t).filter((p) => !p.what.startsWith('bug:')).map((p) => {
      const [x, z] = offBuildingsAt(p.at[0], p.at[1]);
      return { x, z };
    });
    return [...puts, ...digSpots(date, new Set(), islandSeed()).map((d) => ({ x: d.x, z: d.y }))];
  }
  /** A slot's critter comes now, staying until the end of its last slot (`end`, the relay's ms), where its seed puts it
   *  in the world (critterPath.ts: the same on both phones; this camera shows it if it sees it), unless one of us has
   *  caught it (or it got away) today. */
  function visit(c: Spawn, date: string, end: number) {
    const stay = end - shared.now();
    if (stay < 1000) return;
    const cid = critterId(c);
    if (caught(shared.day, cid)) return;
    const t0 = slotStart(date, c.slot) + c.at;
    // (the sky at its start: the same species on both phones across a change of weather)
    const o = { cid, path: { seed: c.seed, t0, total: end - t0 }, month: +date.slice(5, 7), hour: Math.floor(c.slot / 360), sky: skyAt(t0) };
    const r = spawnRand(c);
    if (c.kind === 'fish') {
      // (off its stretch of coast; the front's waits on a dive there, never on its bubbles: every stretch's shadow alike)
      if (!fishes[seaPool(c.coast)] && (c.coast || !diving)) void spawnFish('sea', stay, undefined, false, r, { ...o, coast: c.coast });
    } else if (c.kind === 'bubbles') {
      if (!bubbles && !diving) void spawnBubbles(stay, undefined, false, r, o);
    } else if (c.kind === 'fresh') {
      const wt = freshWater(c);
      if (!fishes[wt]) void spawnFish(wt, stay, undefined, false, r, o);
    } else if (!bugs.some((b) => b.cid === cid)) {
      // (the second lane's spot keeps off the first lane's bugs about in its stay: ambient.ts bugRivals)
      // (clear of what lies to be tapped: a bug hovering over a present took the finger meant for it; its rivals' too)
      const keep = clearOf(tapSpots(date, t0));
      const taken = bugRivals(date, c).flatMap((q) => {
        const id = pickBug(o.month, Math.floor(q.slot / 360), spawnRand(q), skyAt(slotStart(date, q.slot) + q.at));
        const p = id && bugPath(id, q.seed, 0, { white: whiteHeads(), keep });
        return p ? [p.spot] : [];
      });
      spawnBug(pickBug(o.month, o.hour, r, o.sky), { stay, ...o, taken, keep });
    }
  }
  $effect(() => {
    if (!scene || !enabled() || pinned) return;
    let id: ReturnType<typeof setTimeout>;
    /** The slot now: those coming in it (at their `at`) and, the first time, those still staying from before. */
    const slotNow = (first: boolean) => {
      const t = slotAt(now().getTime(), relayOffset());
      for (const c of crittersAt(t.date, t.slot, coasts().length)) {
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

  // the e2e's view of the fishing (dev builds and test mode): what the last tap on water did and why, and the shadows
  // now (world: where each is seen now, and its water)
  onMount(() => {
    if (!hooksOn()) return;
    window.__fish = {
      why: () => why,
      fish: () => allFish().flatMap((f) => {
        if (f.gone) return [];
        const p = fishNow(f) ?? f;
        return [{ water: f.water, pool: f.pool, id: fishId(f), x: p.x, z: p.z, to: [f.x, f.z], len: sizeU(f), cid: f.cid ?? null, theirs: theirs(f.cid) }];
      }),
      casting: () => !!line,
      /** My line now (fishing.ts: its phase, where its float is, the shadow at it) and the others' as their phones tell
       *  them. */
      line: () => (line ? { x: line.x, z: line.z, water: line.water, phase: line.phase, landed: line.phase !== 'flying', under: line.phase === 'bite', fish: line.fish } : null),
      lines: () => Object.values(lines).map((l) => l && { who: l.who, x: l.x, z: l.z, landed: l.landed, under: l.under, id: l.id ?? null })
    };
    return () => void delete window.__fish;
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
    // (and for the 3D island's camera a poll before, a few seconds at most: till it's up and has placed the nodes
    // through it, every control is hidden and a guard skips a hidden one: on a slow CPU a percher sat behind a goal
    // tree's fruit row, shown a moment later, bugs.spec's and critters.spec's cicada)
    let waits = 0, threeAt = 0;
    const go = () => {
      if (w.rest.three) threeAt ||= ++waits;
      if (!enabled() || !w.rest.ready || ((!threeAt || threeAt === waits) && ++waits < 20)) return later(go, 300);
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
  <!-- the 3D island's (world3d/Island3D: camera.svelte.ts m3): each critter NH's model where it is, moving as its
       sprite does (the sprite stays as its tap box, invisible) -->
  {#if w.rest.three}
  {#each Object.entries(fishes) as [pk, f] (pk)}
    {#if f}
      <!-- (its moves, its heading and its nose at the float: fish3, each frame; it fades in and out: world3d/things.ts) -->
      <i class="m3n" {@attach w.at({ bare: true, x: f.ax, z: f.az, lift: -2.5, h: 4, always: true, live: () => fish3(f), m3: { key: f.shape ? `shadow/${f.shape}` : `shadow/${f.water === 'sea' ? 'sea' : 'fresh'}-${Math.max(1, Math.min(6, Math.round(f.size)))}`, id: fishId(f), water: true, get off() { return f.gone; }, get yaw() { return fishYaw(f); }, art: () => fishEls[f.pool] } })} {@attach mirrorFish(f)}></i>
    {/if}
  {/each}
  {#if diving?.chase}
    {@const d = diving}
    <i class="m3n" {@attach w.at({ bare: true, x: d.x, z: d.z, h: 4, always: true, m3: { key: 'shadow/dive', id: `dive-${d.n}`, ms: d.ms, face: 'move', water: true, off: d.gone, art: () => chaseEl } })}></i>
  {/if}
  {#if bubbles}
    <i class="m3n" {@attach w.at({ bare: true, x: bubbles.x, z: bubbles.z, h: 4, always: true, m3: { key: '', water: true, emit: { kind: 'bubbles', every: 420 }, art: () => scene?.querySelector('[data-bubbles]') } })}></i>
  {/if}
  <!-- each nibble's small ring on the water at a float, and the bite's splash and big ring (once each: a node of its own) -->
  {#snippet ring(x: number, z: number, id: string, n: number, under: boolean)}
    {#key n}
      {#if n > 1}
        <i class="m3n" {@attach w.at({ bare: true, x, z, h: 4, always: true, m3: { key: '', id: `ring-${id}`, water: true, emit: under ? { kind: 'splash', every: 60_000 } : { kind: 'ripple', every: 60_000, size: 0.7 } } })}></i>
      {/if}
    {/key}
  {/snippet}
  {#each Object.values(lines) as l (l.n)}
    {#if l}
      <!-- another's float and the line from their villager's rod (or the bank) to it (their phone's steps) -->
      <i class="m3n" {@attach w.at({ bare: true, x: l.x, z: l.z, h: 4, always: true, live: () => floatOf(l), m3: { key: 'tools/bobber', id: `bobber-${l.slot}`, water: true, off: !l.landed && !l.under,
        emit: l.landed && !l.under ? { kind: 'ripple', every: 2600, size: 0.45 } : undefined, line: () => [l.sx, l.sz, 4] as const } })}></i>
      {@render ring(l.x, l.z, `${l.slot}-${l.rings}`, l.rings, l.under)}
    {/if}
  {/each}
  {#if line}
    {@const l = line}
    {@const out = l.phase !== 'flying'}
    {@const under = l.phase === 'bite'}
    <!-- the float on the water, sinking at the bite; the line from my villager's rod to it (from the hand's height at its
         feet till its model holds the rod) -->
    <!-- (its bob, a nibble's dip and the bite's plunge: fishing3d.ts floatLift, each frame; a soft ring now and then while
         it waits) -->
    <i class="m3n" {@attach w.at({ bare: true, x: l.x, z: l.z, h: 4, always: true, live: () => floatAt(l), m3: { key: 'tools/bobber', id: 'bobber', water: true, off: !out, art: () => scene?.querySelector('[data-bobber]'),
      emit: out && !under ? { kind: 'ripple', every: 2600, size: 0.45 } : undefined,
      line: () => {
        // (a hand's reach toward the float, however far it is)
        const [mx, mz] = livePos('mine'), d = Math.hypot(l.x - mx, l.z - mz) || 1, k = Math.min(1, 10 / d);
        return [mx + (l.x - mx) * k, mz + (l.z - mz) * k, 34] as const;
      } } })}></i>
    {@render ring(l.x, l.z, `${rings}`, rings, under)}
  {/if}
  {#each bugs as b (b.n)}
    <!-- (its moves and its turns: bug3, each frame; it fades in where it comes, and out over its leave's end) -->
    <i class="m3n" {@attach w.at({ bare: true, x: b.ax, z: b.az, lift: 0, h: 4, always: true, live: () => bug3(b), m3: { key: `critters/${b.id}`, id: bugId(b), get yaw() { return bugYaw(b); }, get flap() { return mos.get(srcBug(b).id)?.flap ?? 0; }, get off() { return bugOff(b); }, art: () => bugEls[b.n],
      // perched on a trunk: flat on its bark, its back to the camera (read each frame, as its yaw: a turn or a perch
      // read here made the attach build its node again)
      get pitch() { return b.sat && (b.place === 'trunk' || b.place === 'palm') ? (b.flip ? -1 : 1) * Math.PI / 2 : 0; } } })} {@attach mirrorBug(b)}></i>
    {#if b.id === 'dung-beetle'}
      <!-- NH's dung beetle rolls a snowball before it (critterMotion3d.ts ball3) -->
      <i class="m3n" {@attach w.at({ bare: true, x: b.ax, z: b.az, lift: 0, h: 4, always: true, live: () => ball3(b), m3: { key: 'critters/dung-beetle-ball', id: `ball-${b.n}`, get yaw() { return bugYaw(b); }, get pitch() { return ballRoll(b); }, get off() { return ballOff(b); } } })}></i>
    {/if}
  {/each}
  {/if}
  {#each Object.entries(fishes) as [pk, f] (pk)}
    {#if f}
      {@const wt = f.water}
      {#key f.n}
        <!-- a flat ground mark at its spawn point; it swims inside the node (local x = across, local y = −z) -->
        <div class="node" data-shadow-of={wt} data-ax={Math.round(f.ax)} data-az={Math.round(f.az)} {@attach w.at({ x: f.ax, z: f.az, mode: 'flat', h: 10 })}>
          <span class="mover shadow {f.shape ? `is-${f.shape}` : ''} {wt}" class:gone={f.gone} class:dash={f.dash} class:spurt={f.spurt}
            data-critter={wt === 'sea' ? 'fish' : 'pond'} data-water={wt} data-pool={pk} bind:this={fishEls[f.pool]}
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
  {#each Object.values(lines) as l (l.n)}
    {#if l}<i hidden data-angler={l.who} data-line={l.under ? 'bite' : l.landed ? 'wait' : 'cast'} data-x={l.x} data-z={l.z} data-fish={l.id}></i>{/if}
  {/each}
  {#if line}
    {@const l = line}
    {@const under = l.phase === 'bite'}
    <!-- the float, upright where it landed (its phase for the e2e: cast, wait, bite) -->
    <div class="node" {@attach w.at({ x: l.x, z: l.z, h: 24 })}>
      <span class="mover bobber" data-bobber={under ? 'bite' : l.phase === 'flying' ? 'cast' : 'wait'} data-phase={l.phase} class:under>
        {#key rings}{#if rings}<i class="ripple" class:big={under}></i>{/if}{/key}
        {#if under}
          <i class="ripple big late"></i>
          <!-- the bite's splash: seven drops, 14u high -->
          <span class="splash big">{#each [-75, -50, -25, 0, 25, 50, 75] as a (a)}<i style:--a="{a}deg"></i>{/each}</span>
        {/if}
        <span class="float" bind:this={bobEl}><i class="ball"></i></span>
      </span>
    </div>
    {#if under && bang}
      <!-- NH's 「！」 over every world thing at its true size, nudged inside the screen -->
      <div class="node" {@attach w.at({ x: l.x, z: l.z, h: 40, zi: OVER, inv: true, always: true })}>
        <span class="inv" class:in3d={bang.in3d}><span class="bang" data-bite style:left="{bang.dx.toFixed(1)}px">！</span></span>
      </div>
    {/if}
  {/if}
  {#each bugs as b (b.n)}
      <div class="node" {@attach w.at({ x: b.ax, z: b.az, h: 80, dz: -16, light: night })}>
        <span class="mover bug {b.flight} {b.id}" class:night class:gone={b.gone} class:fled={b.fled} class:sat={b.sat} data-critter={b.id} data-place={b.place} bind:this={bugEls[b.n]}
          style:translate={b.freeze ?? bugLoc(b)} style:transition-duration={b.fled ? null : `${b.ms}ms`} style:--ms="{b.ms}ms">
          <span class="hopper" bind:this={hopEls[b.n]}>
            <span class="face" class:flip={b.flip}>
              {#if Sprite}<Sprite id={b.id} flight={b.flight} sat={b.sat} stalk={b.stalk} />{/if}
            </span>
          </span>
        </span>
      </div>
  {/each}
</div>

<div class="held">
  {#if dig}
    {#key dig.n}
      <!-- the mound dug open: the shovel strikes, clods of earth fly up -->
      <span class="fx digfx" class:in3d={dig.in3d} style:translate="{su(dig.x)} {su(dig.y)}"><span class="shovel"><OfficialArt key={findArt('shovel')} size="calc(30 * var(--su))" eager /></span>{#each [-50, -15, 20, 55] as a (a)}<i style:--a="{a}deg"></i>{/each}</span>
    {/key}
  {/if}
  {#if net}
    {#key net.n}
      <span class="fx netfx" class:in3d={net.in3d} data-net="float" style:translate="{su(net.x)} {su(net.y)}">
        <svg viewBox="-20 -20 40 40"><path class="handle" d="M6 6 L19 19" /><circle class="hoop" cx="-1" cy="-1" r="9.5" /><path class="mesh" d="M-10 -1 H8 M-1 -10 V8 M-7.5 -7.5 L5.5 5.5 M-7.5 5.5 L5.5 -7.5" /></svg>
      </span>
    {/key}
  {/if}
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
  .fin svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; fill: rgba(10, 36, 70, .55); filter: var(--leaf-tint,) blur(calc(1.5 * var(--u))); }
  /* the fresh waters' are smaller and seen through shallower water: a sharper edge */
  .shadow:not(.sea) .fin svg { fill: rgba(10, 36, 70, .62); filter: var(--leaf-tint,) blur(calc(.7 * var(--u))); }
  /* NH's long thin shadow (the eels) and the fin cutting the surface (the sharks, the sunfish, the suckerfish): a dark
     sail over the shadow's front half with a thin white wake at its foot */
  .is-narrow .fin { height: calc(var(--w) * .18); }
  .is-fin .fin::before {
    content: ''; position: absolute; left: 28%; bottom: 44%; width: 20%; height: 95%;
    background: linear-gradient(180deg, rgba(36, 58, 92, .95), rgba(44, 70, 108, .85)); clip-path: polygon(38% 0, 100% 100%, 0 100%);
    filter: var(--tod-filter,) drop-shadow(0 1px 0 rgba(255, 255, 255, .85));
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

  /* the bobber: NH's red-and-white float, bobbing; under on the bite */
  .bobber .float { left: 0; top: 0; transform-origin: 50% 100%; }
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
