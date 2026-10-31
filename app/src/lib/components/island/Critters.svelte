<script lang="ts">
  // The island's critters (docs/design.md "Scene interactions"), after NH: now and then (every 15–40 s the island
  // is on screen) a fish shadow swims in the sea off the beach or a bug of the season and hour comes by; a shaken
  // bush sometimes lets a butterfly or a moth out. Nothing counts: a catch is an official icon and NH's caption for a moment.
  //   Fishing: a tap in the sea near a shadow (CAST_U) casts a bobber (a line from the beach); the fish swims up,
  //   nibbles 0–3 times (small wiggles of the bobber) and bites: the bobber is yanked under with a splash, its own
  //   sound and NH's 「！」 over it. While the bobber is out any tap is the reel: on the bite (within 1.6 s) it catches
  //   the fish; a first tap any earlier only makes it hesitate (it backs off, comes back, nibbles and bites later), a
  //   second early tap or none in time and it flees. 1 in 14 the line brings up a boot, a tire or a can.
  //   Bugs (NH's by month and hour): butterflies, a bee or a ladybug over the flower beds, a dragonfly over the hedge,
  //   fireflies on summer nights, grasshoppers, crickets and mantises in the grass, a cicada perched on a trunk.
  //   Bugs: a tap on one swings the net (caught); a tap close by startles it away.
  // SceneTaps.svelte mounts this inside the stage and routes taps here first (`tap`), and a shaken bush (`fromBush`).
  // Cheap: ≤ 1 fish + 1 bug; they move by CSS transitions between waypoints a timer picks every second or few (no rAF),
  // with one wing / fin loop each while on screen; nothing exists between visits but one timer. Covered or hidden:
  // they all leave at once and the countdown holds. Reduced motion: no critters. Decorative, pointer-only.
  //   ?critter=fish | <fish id> | <bug id> (dev or ?demo): one now, staying until caught (the e2e's hook).
  import { onMount } from 'svelte';
  import Plate from './Plate.svelte';
  import { artUrl } from '#lib/art.ts';
  import { t } from '#lib/i18n/index.ts';
  import { jst, now, reducedMotion } from '#lib/time/clock.ts';
  import { HEDGE_BASE, HEDGE_X, BUSH_U, PLATEAU, SAND, TREE, type Tod } from './scene.ts';
  import { hitStage, sceneSfx } from './sceneTaps.ts';
  import { guardsU, stageGeo, type Box, type StageGeo } from './placement.ts';
  import { recordFind } from '#lib/store/actions.ts';
  import {
    BUGS, CAST_U, FISH, HESITATE_MS, HESITATE_U, NOTICE_U, STAY_MS, bitePlan, bushBug, castPhase, caption, critterArt,
    hesitatePlan, hookItem, netSwing, nextSpawnMs, pickBug, pickFish, reel, spawnKind, type BitePlan, type BugId, type FishId,
    type Flight, type JunkId
  } from './critters.ts';

  interface Props {
    scene?: HTMLElement;
    tod: Tod;
    /** Live, not covered by a sheet, page visible. */
    enabled: () => boolean;
  }
  let { scene, tod, enabled }: Props = $props();

  interface Fish { item: FishId | JunkId; size: number; shape?: 'narrow' | 'fin'; x: number; y: number; ms: number; flip: boolean; box: Box; gone: boolean; dash: boolean }
  interface Cast {
    x: number; y: number; sx: number; sy: number; landed: boolean; t0: number; plan: BitePlan | null; under: boolean; rings: number;
    /** Bumped by each new plan (and a hesitation): the old plan's timers check it and stand down. */
    gen: number;
    /** A first tap before the bite made the fish hesitate: the next early one scares it off. */
    hesitated: boolean;
  }
  interface Bug { id: BugId; flight: Flight; x: number; y: number; ms: number; flip: boolean; gone: boolean; area: Box; keep: Box[]; sat: boolean }
  interface Card { n: number; x: number; y: number; art: string; text: string }
  interface Net { n: number; x: number; y: number }

  // Everything in stage units (u: 390 across), drawn with calc(n × --su).
  const U = (n: number) => `calc(${n.toFixed(1)} * var(--su))`;
  const rand = Math.random;
  const between = (a: number, b: number) => a + rand() * (b - a);
  const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

  let fish = $state<Fish | null>(null);
  let cast = $state<Cast | null>(null);
  let bug = $state<Bug | null>(null);
  let card = $state<Card | null>(null);
  let net = $state<Net | null>(null);
  let seq = 0;
  let bugEl = $state<HTMLElement>();
  let hopEl = $state<HTMLElement>();
  const night = $derived(tod === 'night');

  // ---------- timers (all cleared when the critters leave) ----------
  const timers = new Set<ReturnType<typeof setTimeout>>();
  function later(fn: () => void, ms: number) {
    const id = setTimeout(() => {
      timers.delete(id);
      fn();
    }, ms);
    timers.add(id);
  }
  function clearAll() {
    for (const id of timers) clearTimeout(id);
    timers.clear();
    fish = cast = bug = card = net = null;
  }

  // ---------- geometry ----------
  const geo = () => stageGeo(scene);
  /** The beach's sea edge (SAND's front, rounded at the corners) at x, in u. */
  function shoreY(x: number): number {
    const { x0, x1, y1, rb } = SAND;
    const cx = clamp(x, x0 + rb, x1 - rb);
    const dx = Math.min(Math.abs(x - cx), rb);
    return y1 - rb + Math.sqrt(rb * rb - dx * dx);
  }
  /** Where a shadow can swim on one side (−1 left, 1 right): the open sea off the front beach, just past the foam, down
   *  to above the screen's bottom edge and しずえ's box; where that's too shallow (a short browser viewport), the strip
   *  of side sea beside the island; null when neither has room. */
  function seaBox(g: StageGeo, side: -1 | 1): Box | null {
    const [f0, f1] = side < 0 ? [0.06, 0.44] : [0.56, 0.94];
    const x0 = g.left + g.w * f0, x1 = g.left + g.w * f1;
    const news = document.querySelector('.news')?.getBoundingClientRect();
    const floor = Math.min(g.bottom - 16 * g.k, news?.height ? (news.top - g.r.top) * g.k - 6 : Infinity);
    const y0 = Math.max(shoreY(x0), shoreY(x1)) + 10;
    const y1 = Math.min(y0 + 44, floor);
    if (y1 - y0 >= 12) return { x0, x1, y0, y1 };
    // the side sea: beyond the sand's straight edge, alongside the lawn
    const [sx0, sx1] = side < 0 ? [g.left + 6 * g.k, SAND.x0 - 8] : [SAND.x1 + 8, g.right - 6 * g.k];
    return sx1 - sx0 >= 12 ? { x0: sx0, x1: sx1, y0: 130, y1: Math.min(290, floor) } : null;
  }
  /** Sea beyond the beach (in front of it, or beside the island). */
  const offshore = (x: number, y: number) => y > shoreY(x) || x < SAND.x0 || x > SAND.x1;
  const inBox = (b: Box) => ({ x: between(b.x0, b.x1), y: between(b.y0, b.y1) });
  /** The open places a bug keeps to: the flower beds, the hedge tops, the grass in front of the beds. */
  const BEDS: Box[] = [{ x0: 45, x1: 110, y0: 212, y1: 285 }, { x0: 280, x1: 345, y0: 212, y1: 285 }];
  const HEDGE: Box = { x0: 50, x1: 340, y0: 14, y1: 46 };
  const GRASS: Box[] = [{ x0: 48, x1: 112, y0: 250, y1: 306 }, { x0: 278, x1: 342, y0: 250, y1: 306 }];
  /** The front beach (a crab, a wharf roach): the sand between the cliff's foot and the foam, on screen. */
  function beach(g: StageGeo): Box | null {
    const x0 = Math.max(g.left + 16, 66), x1 = Math.min(g.right - 16, 324);
    const y0 = PLATEAU.y1 + 15, y1 = Math.min(shoreY(195) - 6, g.bottom - 12 * g.k);
    return x1 - x0 > 20 && y1 - y0 >= 4 ? { x0, x1, y0, y1 } : null;
  }
  /** Bugs that don't fly in: a cicada's shell, a walking stick (they're on their trunk already). */
  const STILL = new Set<BugId>(['cicada-shell', 'walking-stick']);
  /** How a percher is drawn: a cicada (or its shell), a stag beetle with its jaws, a horned or round beetle, a stick. */
  const PERCH: Partial<Record<BugId, 'stag' | 'beetle' | 'stick'>> = {
    'saw-stag': 'stag', 'miyama-stag': 'stag', 'giant-stag': 'stag', 'rainbow-stag': 'stag',
    'horned-dynastid': 'beetle', 'goliath-beetle': 'beetle', 'drone-beetle': 'beetle', 'jewel-beetle': 'beetle', 'walking-stick': 'stick'
  };
  /** A cicada's perch: the visible trunk of a tree, midway between its canopy and its fruit row (both buttons, measured:
   *  the row's 44px tap target reaches up the trunk on a small phone), so a tap on the cicada (a finger's fuzzy hit
   *  included) lands on neither; null when the gap is under 20px. */
  function trunk(g: StageGeo, side: -1 | 1): Box | null {
    const tree = scene?.querySelectorAll<HTMLElement>('.canopy')[side < 0 ? 0 : 1];
    const row = scene?.querySelectorAll<HTMLElement>('.row-btn')[side < 0 ? 0 : 1];
    if (!tree || !row) return null;
    const top = tree.getBoundingClientRect().bottom, bottom = row.getBoundingClientRect().top;
    if (bottom - top < 20) return null;
    const y = ((top + bottom) / 2 - g.r.top) * g.k, x = side < 0 ? TREE.x.A : TREE.x.B;
    return { x0: x - 2, x1: x + 2, y0: y - 1.5, y1: y + 1.5 };
  }

  /** A spot in `area` clear of the guards (null when there's none to be found). */
  function freeIn(area: Box, keep: Box[]): { x: number; y: number } | null {
    for (let i = 0; i < 16; i++) {
      const p = inBox(area);
      if (!keep.some((b) => p.x > b.x0 && p.x < b.x1 && p.y > b.y0 && p.y < b.y1)) return p;
    }
    return null;
  }
  /** A shadow's length (u): NH's sizes 1–6; the eels' thin shadow is long. */
  const sizeU = (f: Fish) => 8 + (f.shape === 'narrow' ? 5.5 : f.size) * 4.5;

  function preload(key: string) {
    const url = artUrl(key);
    if (url) new Image().src = url;
  }

  // ---------- fish ----------
  function spawnFish(stay = true, want?: FishId) {
    const g = geo();
    const side = rand() < 0.5 ? -1 : 1;
    const box = g && (seaBox(g, side) ?? seaBox(g, side < 0 ? 1 : -1));
    if (!box) return;
    const { month, hour } = jst(now());
    const id = want ?? pickFish(month, hour, rand);
    const item = want ?? hookItem(id, rand);
    preload(critterArt(item));
    const p = inBox(box);
    fish = { item, size: FISH[id].size, shape: FISH[id].shape, ...p, ms: 0, flip: rand() < 0.5, box, gone: false, dash: false };
    later(swim, 400);
    if (stay) later(() => leaveFish(), STAY_MS.fish);
  }
  /** A slow wander to another spot in its patch of sea (NH shadows dawdle), unless it's busy with a bobber. */
  function swim() {
    const f = fish;
    if (!f || f.gone) return;
    if (!cast) {
      const p = inBox(f.box);
      f.ms = clamp(Math.hypot(p.x - f.x, p.y - f.y) * 110, 2500, 6000);
      f.flip = p.x > f.x;
      f.x = p.x;
      f.y = p.y;
    }
    later(swim, (fish?.ms ?? 3000) + between(600, 2200));
  }
  function leaveFish() {
    if (!fish) return;
    if (cast) return later(leaveFish, 4000); // never while it's playing with the bobber
    fish.gone = true;
    later(() => (fish = null), 1200);
  }
  /** The fish is spooked: a quick dart away from the bobber and gone. */
  function flee() {
    const f = fish, c = cast;
    cast = null;
    sceneSfx('flee');
    if (!f) return;
    const dx = c ? Math.sign(f.x - c.x) || 1 : f.flip ? 1 : -1;
    Object.assign(f, { ms: 650, dash: true, gone: true, flip: dx > 0, x: f.x + dx * 40, y: f.y + between(-6, 10) });
    later(() => fish === f && (fish = null), 700);
  }

  function castAt(x: number, y: number) {
    const f = fish!;
    // the angler stands on the beach: in front, a little toward the middle; beside the island, on its sand edge
    const front = y > shoreY(x);
    const bx = front ? x : x < 195 ? Math.min(x, SAND.x0 - 6) : Math.max(x, SAND.x1 + 6);
    const by = front ? Math.max(y, shoreY(x) + 8) : y;
    const side = x < 195 ? 1 : -1;
    const [sx, sy] = front ? [x + side * 10, shoreY(x + side * 10) - 4] : [x < 195 ? SAND.x0 + 6 : SAND.x1 - 6, y - 8];
    cast = { x: bx, y: by, sx, sy, landed: false, t0: 0, plan: null, under: false, rings: 0, gen: 0, hesitated: false };
    sceneSfx('cast');
    sceneSfx('plop');
    later(() => {
      const c = cast;
      if (!c) return;
      c.landed = true;
      c.t0 = performance.now();
      c.rings++;
      const d = Math.hypot(f.x - c.x, f.y - c.y);
      if (d > NOTICE_U || fish !== f) return later(() => cast === c && (cast = null), 9000); // nobody noticed
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
    const d = Math.hypot(f.x - c.x, f.y - c.y) || 1;
    const ux = (c.x - f.x) / d, uy = (c.y - f.y) / d;
    const len = sizeU(f) * 0.5;
    Object.assign(f, { ms: at(plan.arrive), flip: c.x > f.x, x: c.x - ux * len, y: c.y - uy * len * 0.6 });
    for (const t of plan.nibbles)
      later(() => {
        if (!live()) return;
        c.rings++;
        nibble();
        sceneSfx('nibble');
      }, at(t));
    later(() => {
      if (!live()) return;
      c.under = true;
      c.rings++;
      sceneSfx('bite');
    }, at(plan.bite));
    later(() => live() && flee(), at(plan.bite + plan.window)); // too late
  }

  let bobEl = $state<HTMLElement>();
  let fishEl = $state<HTMLElement>();
  /** The shadow's position on screen right now (u), mid-transition included. */
  function fishNow(): { x: number; y: number } | null {
    const g = geo(), r = fishEl?.getBoundingClientRect();
    return g && r ? { x: (r.left - g.r.left) * g.k, y: (r.top - g.r.top) * g.k } : null;
  }
  /** A nibble: the bobber twitches, a small gentle wiggle (nothing like the bite's plunge). */
  function nibble() {
    bobEl?.animate(
      [{ translate: '0 0', rotate: '0deg' }, { translate: `0 ${U(0.9)}`, rotate: '-9deg', offset: 0.25 },
        { translate: `0 ${U(0.2)}`, rotate: '7deg', offset: 0.55 }, { translate: '0 0', rotate: '0deg' }],
      { duration: 380, easing: 'ease-out' }
    );
  }

  /** NH's A button while the bobber is out. */
  function reelIn() {
    const c = cast!;
    if (!c.landed) return; // still in the air
    const ms = performance.now() - c.t0;
    const r = reel(castPhase(c.plan, ms), c.hesitated);
    if (r === 'flee') return flee();
    if (r === 'hesitate') {
      // the line twitches; the fish backs off a little, thinks it over, and comes back for another try
      const f = fish!;
      c.hesitated = true;
      c.gen++;
      c.rings++;
      nibble();
      // from where it is now (it may still be swimming up), straight back from the bobber
      const p = fishNow() ?? f;
      const d = Math.hypot(p.x - c.x, p.y - c.y) || 1;
      Object.assign(f, { ms: HESITATE_MS, x: p.x + ((p.x - c.x) / d) * HESITATE_U, y: p.y + ((p.y - c.y) / d) * HESITATE_U * 0.6 });
      const plan = hesitatePlan(ms, rand);
      return later(() => cast === c && fish === f && follow(c, f, plan), HESITATE_MS);
    }
    cast = null;
    sceneSfx('reel');
    if (r === 'reel') return;
    const f = fish!;
    fish = null;
    sceneSfx('catch');
    show(f.item, c.x, c.y);
  }

  // ---------- bugs ----------
  function spawnBug(id: BugId | null, from?: { x: number; y: number }, stay = true) {
    const g = geo();
    if (!id || !g || bug) return;
    preload(critterArt(id));
    const flight = BUGS[id].flight;
    const side = rand() < 0.5 ? -1 : 1;
    const ground = BUGS[id].ground;
    const area = flight === 'perch' ? trunk(g, side)
      : ground === 'beach' ? beach(g)
      : from || id === 'moth' || flight === 'dart' ? HEDGE
      : flight === 'hop' || ground === 'grass' ? GRASS[side < 0 ? 0 : 1] : BEDS[side < 0 ? 0 : 1];
    if (!area) return;
    // flyers come in from the side of their patch; a firefly blinks on, a grasshopper is just there in the grass
    // its patch, minus the controls (measured once: the villagers and the jar don't move far); a cicada's trunk spot
    // is already measured clear of the tree's buttons
    const keep = flight === 'perch' ? [] : guardsU(g, 16);
    const spot = freeIn(area, keep);
    if (!spot) return;
    // a firefly blinks on, a grasshopper or a crawler is just there, a shell or a walking stick is on its trunk already
    const inPlace = flight === 'drift' || flight === 'hop' || flight === 'crawl' || STILL.has(id);
    const start = from ?? (inPlace ? spot : { x: side < 0 ? g.left - 16 : g.right + 16, y: spot.y - (flight === 'perch' ? 40 : 0) });
    bug = { id, flight, ...start, ms: 0, flip: side < 0, gone: false, area, keep, sat: false };
    later(fly, 60);
    if (stay) later(() => bugLeave(), STAY_MS.bug);
  }
  function fly() {
    const b = bug;
    if (!b || b.gone) return;
    const p = freeIn(b.area, b.keep);
    if (!p) return bugLeave();
    if (b.flight === 'perch') {
      // in to the trunk, then it sits there and sings until it's netted, startled or done
      Object.assign(b, { ms: 1500, flip: p.x > b.x, x: p.x, y: p.y });
      return later(() => bug === b && (b.sat = true), 1500);
    }
    if (b.flight === 'hop') {
      // a short hop along the grass toward a free spot, then a sit
      const x = clamp(b.x + Math.sign(p.x - b.x || 1) * Math.min(Math.abs(p.x - b.x), between(14, 30)), b.area.x0, b.area.x1);
      const y = clamp(b.y + between(-8, 8), b.area.y0, b.area.y1);
      Object.assign(b, { ms: 420, flip: x > b.x, x, y });
      hopEl?.animate([{ translate: '0 0' }, { translate: `0 ${U(-9)}`, offset: 0.45 }, { translate: '0 0' }], { duration: 420, easing: 'ease-out' });
      return later(fly, 420 + between(1400, 2800));
    }
    if (b.flight === 'crawl') {
      // a little way along its ground, then a rest: a hermit crab scuttles sideways, a snail barely moves
      const crab = b.id === 'hermit-crab', snail = b.id === 'snail';
      const reach = crab ? 30 : snail ? 8 : 18;
      const x = clamp(b.x + clamp(p.x - b.x, -reach, reach), b.area.x0, b.area.x1);
      const y = clamp(b.y + clamp(p.y - b.y, -reach / 3, reach / 3), b.area.y0, b.area.y1);
      const ms = crab ? between(450, 700) : snail ? between(3500, 5000) : between(1600, 2600);
      Object.assign(b, { ms, flip: crab ? b.flip : x > b.x, x, y });
      return later(fly, ms + between(1200, 3200));
    }
    const ms = b.flight === 'dart' ? between(240, 380) : b.flight === 'drift' ? between(2600, 4000) : between(1100, 1800);
    Object.assign(b, { ms, flip: p.x > b.x, x: p.x, y: p.y });
    later(fly, ms + (b.flight === 'dart' ? between(900, 2000) : 0)); // a dragonfly hovers between darts
  }
  /** Off to the nearer side, up a little, fading (a firefly or a cricket just fades where it is). */
  function bugLeave(fast = false, away?: number) {
    const b = bug, g = geo();
    if (!b || b.gone || !g) return;
    b.gone = true;
    if (b.flight === 'drift' || ((b.flight === 'hop' || b.flight === 'crawl' || STILL.has(b.id)) && !fast)) {
      b.ms = 900;
    } else if (b.flight === 'crawl') {
      // startled: it scurries off along the ground and is gone
      const dir = away ?? (b.x < 195 ? -1 : 1);
      Object.assign(b, { ms: 700, flip: dir > 0, x: b.x + dir * 26 });
    } else {
      const dir = away ?? (b.x < 195 ? -1 : 1);
      Object.assign(b, { ms: fast ? 700 : 1600, flip: dir > 0, x: dir < 0 ? g.left - 20 : g.right + 20, y: Math.max(10, b.y - 30) });
    }
    later(() => bug === b && (bug = null), b.ms + 50);
  }

  /** A shaken bush lets a bug out now and then (SceneTaps' bush tap). */
  export function fromBush(i: number) {
    if (bug || reducedMotion()) return;
    const { month, hour } = jst(now());
    spawnBug(bushBug(month, hour, rand), { x: HEDGE_X[i], y: HEDGE_BASE - BUSH_U * 0.7 });
  }

  // ---------- the catch ----------
  /** The catch held up: NH's caption on a plate with the official icon, popping up out of the catch at (x, y) (u)
   *  (Plate.svelte places it clear of every control). */
  function show(item: FishId | JunkId | BugId, x: number, y: number) {
    // the shared ずかん: the first catch of each fish or bug (junk isn't a find)
    if (item in FISH) recordFind('fish', item);
    else if (item in BUGS) recordFind('bug', item);
    const c = caption(item);
    card = { n: ++seq, x, y, art: critterArt(item), text: t(c.key, c.name ? { name: t(c.name) } : undefined) };
  }

  /** A tap on the scene (client px), before SceneTaps' own flourishes: true when a critter took it. */
  export function tap(px: number, py: number): boolean {
    if (cast) {
      reelIn();
      return true;
    }
    const g = geo();
    if (!g) return false;
    const b = bug;
    if (b && !b.gone && bugEl) {
      const r = bugEl.getBoundingClientRect();
      const d = Math.hypot(px - (r.left + r.width / 2), py - (r.top + r.height / 2));
      const swing = netSwing(d, Math.max(r.width, r.height));
      if (swing === 'catch') {
        const x = (r.left + r.width / 2 - g.r.left) * g.k, y = (r.top + r.height / 2 - g.r.top) * g.k;
        net = { n: ++seq, x, y };
        sceneSfx('net');
        later(() => {
          if (bug === b) bug = null;
          sceneSfx('catch');
          show(b.id, x, y);
        }, 160);
        later(() => (net = null), 420);
        return true;
      }
      if (swing === 'startle') {
        sceneSfx('bug-flee');
        bugLeave(true, px < r.left + r.width / 2 ? 1 : -1);
        return true;
      }
    }
    const x = (px - g.r.left) * g.k, y = (py - g.r.top) * g.k;
    const f = fish;
    if (f && !f.gone && offshore(x, y) && hitStage(x, y).kind === 'sea' && Math.hypot(x - f.x, y - f.y) < CAST_U) {
      castAt(x, y);
      return true;
    }
    return false;
  }

  // ---------- the visits ----------
  // A countdown of on-screen time: it runs while the island is live and visible, holds under a sheet or in a hidden
  // tab (and the critters leave), and resumes where it was.
  let remaining = nextSpawnMs(rand, true);
  /** `?critter=` (dev or ?demo) shows that one alone: no ambient visits around it, so it can be looked at and tested. */
  const pinned = typeof location !== 'undefined' && new URLSearchParams(location.search).has('critter') && (import.meta.env.DEV || new URLSearchParams(location.search).has('demo'));
  $effect(() => {
    if (!scene || !enabled() || reducedMotion() || pinned) return;
    let started = performance.now();
    let id: ReturnType<typeof setTimeout>;
    const arm = () => {
      started = performance.now();
      id = setTimeout(visit, remaining);
    };
    const visit = () => {
      const { month, hour } = jst(now());
      const kind = spawnKind({ fish: !!fish, bug: !!bug }, pickBug(month, hour, () => 0) !== null, rand);
      if (kind === 'fish') spawnFish();
      else if (kind === 'bug') spawnBug(pickBug(month, hour, rand));
      remaining = nextSpawnMs(rand);
      arm();
    };
    arm();
    return () => {
      clearTimeout(id);
      remaining = Math.max(1000, remaining - (performance.now() - started));
      clearAll();
    };
  });

  onMount(() => {
    const q = new URLSearchParams(location.search);
    const want = q.get('critter');
    if (!want || !(import.meta.env.DEV || q.has('demo'))) return;
    const go = () => {
      if (reducedMotion()) return;
      if (!enabled()) return later(go, 300);
      if (want === 'fish') spawnFish(false);
      else if (want in FISH) spawnFish(false, want as FishId);
      else if (want in BUGS) spawnBug(want as BugId, undefined, false);
    };
    later(go, 600);
    return clearAll;
  });
</script>

<div class="sea-life" aria-hidden="true">
  {#if fish}
    <span class="mover shadow {fish.shape ? `is-${fish.shape}` : ''}" class:gone={fish.gone} class:dash={fish.dash} data-critter="fish" bind:this={fishEl}
      style:translate="{U(fish.x)} {U(fish.y)}" style:transition-duration="{fish.ms}ms" style:--w={U(sizeU(fish))}>
      <i class="fin" class:flip={fish.flip}></i>
    </span>
  {/if}
  {#if cast}
    <svg class="line" class:landed={cast.landed} viewBox="0 0 390 360" preserveAspectRatio="none">
      <path d="M{cast.sx} {cast.sy} Q{(cast.sx + cast.x) / 2} {Math.min(cast.sy, cast.y) - 12} {cast.x} {cast.y - 1.5}" />
    </svg>
    <span class="mover bobber" data-bobber={cast.under ? 'bite' : cast.landed ? 'wait' : 'cast'} class:under={cast.under}
      style:translate="{U(cast.x)} {U(cast.y)}" style:--fx={U(cast.sx - cast.x)} style:--fy={U(cast.sy - cast.y)}>
      {#key cast.rings}{#if cast.rings}<i class="ripple" class:big={cast.under}></i>{/if}{/key}
      {#if cast.under}
        <i class="ripple big late"></i>
        <span class="splash">{#each [-62, -30, 0, 30, 62] as a (a)}<i style:--a="{a}deg"></i>{/each}</span>
      {/if}
      <span class="float" bind:this={bobEl}><i class="ball"></i></span>
    </span>
  {/if}
</div>

<div class="air-life" class:night aria-hidden="true">
  {#if bug}
    {@const b = bug}
    <span class="mover bug {b.flight} {b.id}" class:gone={b.gone} class:sat={b.sat} data-critter={b.id} bind:this={bugEl}
      style:translate="{U(b.x)} {U(b.y)}" style:transition-duration="{b.ms}ms">
      <span class="hopper" bind:this={hopEl}>
        <span class="face" class:flip={b.flip}>
          {#if b.flight === 'drift'}
            <i class="glow"></i>
          {:else if b.flight === 'dart'}
            <svg viewBox="-12 -8 24 16"><g class="dwing"><ellipse cx="-3" cy="-4" rx="2.2" ry="5.5" transform="rotate(-62 -3 -4)" /><ellipse cx="-3" cy="4" rx="2.2" ry="5.5" transform="rotate(62 -3 4)" />
              <ellipse cx="1" cy="-4" rx="1.9" ry="5" transform="rotate(-70 1 -4)" /><ellipse cx="1" cy="4" rx="1.9" ry="5" transform="rotate(70 1 4)" /></g>
              <path class="dbody" d="M-11 0 L4 0" /><path class="dband" d="M-11 0 L4 0" /><circle class="dhead" cx="5.5" cy="0" r="2" /></svg>
          {:else if b.flight === 'perch' && PERCH[b.id] === 'stag'}
            <!-- a stag beetle on the trunk, head up, its jaws open -->
            <svg viewBox="-6 -9 12 17"><path class="jaw" d="M-1.2 -5.4 C-3.6 -7 -3.4 -8.6 -2 -9 M1.2 -5.4 C3.6 -7 3.4 -8.6 2 -9" />
              <ellipse class="shellb" cx="0" cy="1.2" rx="3.4" ry="4.8" /><path class="seam" d="M0 -2.6 V5.8" /><ellipse class="bhead" cx="0" cy="-4.4" rx="2.3" ry="1.6" /></svg>
          {:else if b.flight === 'perch' && PERCH[b.id] === 'beetle'}
            <!-- a beetle on the trunk (the horned dynastid with its horn) -->
            <svg viewBox="-6 -9 12 17">{#if b.id === 'horned-dynastid'}<path class="horn" d="M0 -5 C-.2 -7.4 .8 -8.8 2.2 -8.8" />{/if}
              <ellipse class="shellb" cx="0" cy="1.2" rx="3.7" ry="4.8" /><path class="seam" d="M0 -2.4 V5.8" /><ellipse class="bhead" cx="0" cy="-4.2" rx="2.4" ry="1.7" /></svg>
          {:else if b.flight === 'perch' && PERCH[b.id] === 'stick'}
            <svg viewBox="-4 -10 8 20"><path class="stick" d="M0 -9 V9 M0 -5 L-2.6 -8 M0 -5 L2.6 -8 M0 0 L-3 1.2 M0 0 L3 1.2 M0 4 L-2.4 7.4 M0 4 L2.4 7.4" /></svg>
          {:else if b.flight === 'crawl'}
            {#if b.id === 'hermit-crab'}
              <!-- a hermit crab: a borrowed shell, two red claws, little legs -->
              <svg viewBox="-8 -7 16 12"><path class="cleg" d="M-3.6 2 L-6.4 4.2 M-2.4 2.6 L-4.4 5.2 M3.6 2 L6.4 4.2 M2.4 2.6 L4.4 5.2" />
                <circle class="claw" cx="-4.6" cy=".6" r="1.6" /><circle class="claw" cx="4.6" cy=".6" r="1.6" />
                <path class="cshell" d="M-4 2.4 C-5 -2.6 -1.4 -6.4 2.6 -5.2 C5.4 -4.2 5.2 1 4 2.4 Z" /><path class="swirl" d="M-1.2 -.6 C-.4 -3.6 3 -3.2 2.6 -.4" /></svg>
            {:else if b.id === 'snail'}
              <svg viewBox="-8 -7 16 12"><path class="sbody" d="M-7 3.6 H4.6 Q7 3.6 7 1.6 L6.2 -.6 L5 2.2 H-6 Z" /><path class="sant" d="M5.6 -.4 L6.4 -3.8 M6.3 0 L7.9 -2.8" />
                <circle class="sshell" cx="-.6" cy="-.6" r="4" /><path class="swirl" d="M-.6 -.6 m-2.2 0 a2.2 2.2 0 1 1 2.2 2.2" /></svg>
            {:else if b.id === 'centipede'}
              <svg viewBox="-10 -4 20 8"><path class="cleg" d="M-7.6 -2.6 V2.6 M-4.6 -2.6 V2.6 M-1.6 -2.6 V2.6 M1.4 -2.6 V2.6 M4.4 -2.6 V2.6" />
                {#each [-7.6, -4.6, -1.6, 1.4, 4.4] as cx (cx)}<circle class="cseg" {cx} cy="0" r="1.8" />{/each}<circle class="chead" cx="7.2" cy="0" r="2" /></svg>
            {:else}
              <!-- a pill bug or a wharf roach: a segmented little oval (the roach with feelers) -->
              <svg viewBox="-8 -5 16 10">{#if b.id === 'wharf-roach'}<path class="ant" d="M4.4 -1 Q7.6 -4 8.6 -2.4 M4.4 1 Q7.6 4 8.6 2.4" />{/if}
                <ellipse class="pill" rx={b.id === 'wharf-roach' ? 5 : 4.2} ry="2.9" /><path class="seg" d="M-2 -2.6 V2.6 M.4 -2.8 V2.8 M2.8 -2.3 V2.3" /></svg>
            {/if}
          {:else if b.flight === 'perch'}
            <!-- a cicada on the trunk, head up, wings folded over its back -->
            <svg viewBox="-6 -8 12 16"><ellipse class="cibody" cx="0" cy="-.5" rx="2.6" ry="4.6" /><circle class="cibody" cx="0" cy="-5" r="2.2" />
              <circle class="eye" cx="-1.7" cy="-5.6" r=".8" /><circle class="eye" cx="1.7" cy="-5.6" r=".8" />
              <g class="ciwing"><path d="M-.3 -3.4 C-4.6 -2 -4.4 4.6 -1 7.4 C-.4 4 -.2 0 -.3 -3.4 Z" /><path d="M.3 -3.4 C4.6 -2 4.4 4.6 1 7.4 C.4 4 .2 0 .3 -3.4 Z" /></g></svg>
          {:else if b.id === 'mantis' || b.id === 'orchid-mantis'}
            <svg viewBox="-8 -8 16 16"><path class="mbody" d="M-6 3 Q-1 2 3 -1" /><path class="mleg" d="M2 -.6 L4.8 -4.8 L6.6 -2.6 M-2 2.4 L-3.2 5.6 M-4.4 2.8 L-6.6 5.4 M0 1.6 L1 5.2" />
              <path class="mhead" d="M2.6 -1.8 L5.2 -3 L5 -.6 Z" /></svg>
          {:else if b.flight === 'hop'}
            <svg viewBox="-8 -6 16 12"><path class="leg" d="M-1 1 L-5 -3.5 L-7 3" /><ellipse class="cbody" cx="0" cy="0" rx="4.6" ry="2.6" />
              <circle class="cbody" cx="4.4" cy="-.6" r="1.8" /><path class="ant" d="M5.5 -1.8 Q8 -6 3 -5.6 M5.8 -1.4 Q9 -4 6 -6" /></svg>
          {:else if b.id === 'honeybee'}
            <svg viewBox="-8 -8 16 16"><g class="wing"><ellipse cx="-2" cy="-4" rx="2" ry="3.2" transform="rotate(-25 -2 -4)" /></g>
              <g class="wing r"><ellipse cx="2" cy="-4" rx="2" ry="3.2" transform="rotate(25 2 -4)" /></g>
              <ellipse class="bee" rx="4.4" ry="3.2" /><path class="stripe" d="M-1.6 -3 V3 M1.2 -3.1 V3.1" /><circle class="beehead" cx="4.6" cy="-.4" r="1.9" /></svg>
          {:else}
            <svg viewBox="-12 -10 24 20">
              <g class="wing"><path d="M0 0 C-4 -9 -12 -9 -11 -2 C-10 2 -4 2 0 0 Z M0 0 C-3 3 -9 6 -7 9 C-5 10 -1 5 0 0 Z" /></g>
              <g class="wing r"><path d="M0 0 C4 -9 12 -9 11 -2 C10 2 4 2 0 0 Z M0 0 C3 3 9 6 7 9 C5 10 1 5 0 0 Z" /></g>
              <ellipse rx="1" ry="4.5" class="bbody" />
            </svg>
          {/if}
        </span>
      </span>
    </span>
  {/if}
</div>

<div class="held" aria-hidden="true">
  {#if cast?.under}
    <!-- over the land and the tint, so the 「！」 is never hidden behind the beach -->
    <span class="mover" style:translate="{U(cast.x)} {U(cast.y)}"><span class="bang" data-bite>！</span></span>
  {/if}
  {#if net}
    {#key net.n}
      <span class="mover netfx" style:translate="{U(net.x)} {U(net.y)}">
        <svg viewBox="-20 -20 40 40"><path class="handle" d="M6 6 L19 19" /><circle class="hoop" cx="-1" cy="-1" r="9.5" /><path class="mesh" d="M-10 -1 H8 M-1 -10 V8 M-7.5 -7.5 L5.5 5.5 M-7.5 5.5 L5.5 -7.5" /></svg>
      </span>
    {/key}
  {/if}
  {#if card}
    {@const c = card}
    {#key c.n}<Plate {scene} x={c.x} y={c.y} art={c.art} text={c.text} ondone={() => card?.n === c.n && (card = null)} />{/key}
  {/if}
</div>

<style>
  .sea-life, .air-life, .held { position: absolute; inset: 0; pointer-events: none; --su: calc(100cqw / 390); }
  /* the sea's life sits in the water: over the sea (z 0), under the ground's beach edge order is moot (it keeps off the
     sand), and under the time-of-day tint like the sea itself */
  .sea-life { z-index: 1; }
  /* bugs fly over the hedge, flowers and villagers; at night above the tint (z 80) so a firefly glows */
  .air-life { z-index: var(--z-leaf); }
  .air-life.night { z-index: var(--z-taps); }
  .held { z-index: var(--z-taps); }
  .mover {
    position: absolute; left: 0; top: 0; width: 0; height: 0;
    transition-property: translate, opacity; transition-timing-function: cubic-bezier(.45, .05, .55, .95);
  }
  .mover > * { position: absolute; }
  .flip { scale: -1 1; }

  /* fish shadow: NH's dark oval with a tail (head to the left unless flipped), fading in, a slow tail wag */
  .shadow { animation: fade-in 1.4s ease-out both; }
  .shadow.gone { opacity: 0; transition-duration: 1.1s, 1.1s; }
  .shadow.dash { transition-timing-function: cubic-bezier(.2, .7, .4, 1); transition-duration: .65s, .6s; }
  .fin {
    display: block; left: 0; top: 0; width: var(--w); height: calc(var(--w) * .42); translate: -50% -50%;
    background:
      radial-gradient(closest-side, rgba(14, 44, 82, .62), rgba(14, 44, 82, .4) 60%, transparent) 0 0 / 76% 100% no-repeat,
      radial-gradient(closest-side, rgba(14, 44, 82, .48), transparent) 100% 50% / 30% 72% no-repeat;
    animation: wag 1.3s ease-in-out infinite alternate;
  }
  /* NH's long thin shadow (the eels) and the fin cutting the surface (the sharks, the sunfish, the suckerfish): a dark
     sail over the shadow's front half with a thin white wake at its foot */
  .is-narrow .fin { height: calc(var(--w) * .2); }
  .is-fin .fin::before {
    content: ''; position: absolute; left: 28%; bottom: 44%; width: 20%; height: 95%;
    background: linear-gradient(180deg, rgba(36, 58, 92, .95), rgba(44, 70, 108, .85)); clip-path: polygon(38% 0, 100% 100%, 0 100%);
    filter: drop-shadow(0 1px 0 rgba(255, 255, 255, .85));
  }
  @keyframes wag { from { transform: skewY(-4deg) scale(1, .96); } to { transform: skewY(4deg) scale(.97, 1); } }
  @keyframes fade-in { from { opacity: 0; } }

  /* the line: a thin arc from the beach to the bobber, drawn once the bobber lands */
  .line { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; opacity: 0; transition: opacity .25s; }
  .line.landed { opacity: 1; }
  .line path { fill: none; stroke: rgba(255, 255, 255, .8); stroke-width: 1px; vector-effect: non-scaling-stroke; }
  /* the bobber: NH's red-and-white float, arcing in from the beach, then bobbing; under on the bite */
  .bobber .float { left: 0; top: 0; transform-origin: 50% 100%; animation: cast .3s cubic-bezier(.3, .2, .6, 1) both; }
  @keyframes cast {
    from { transform: translate(var(--fx), var(--fy)) translateY(calc(-14 * var(--su))); }
    50% { transform: translate(calc(var(--fx) * .5), calc(var(--fy) * .5)) translateY(calc(-16 * var(--su))); }
  }
  .ball {
    display: block; width: calc(8 * var(--su)); height: calc(8 * var(--su)); margin: calc(-6.4 * var(--su)) 0 0 calc(-4 * var(--su));
    border-radius: 50%; background: linear-gradient(180deg, #F2484A 0 48%, #FFFDF6 52%); box-shadow: inset -1px -1px 0 rgba(0, 0, 0, .12);
    animation: bob 1.5s ease-in-out .3s infinite alternate;
  }
  @keyframes bob { from { transform: translateY(calc(-.6 * var(--su))); } to { transform: translateY(calc(.6 * var(--su))); } }
  /* the bite: the bobber is yanked under (a plunge, then only a dark smudge where it went), a splash, a second ring and
     NH's 「！」 popping up over it: the moment to tap */
  .under .ball { animation: plunge .22s cubic-bezier(.5, 0, .9, .5) both; }
  @keyframes plunge {
    0% { transform: translateY(0); scale: 1; opacity: 1; }
    30% { transform: translateY(calc(-1.6 * var(--su))); scale: 1.05; }
    100% { transform: translateY(calc(4.5 * var(--su))); scale: .7 .5; opacity: .2; }
  }
  .ripple.late { animation-delay: .25s; }
  .splash { left: 0; top: 0; }
  .splash i {
    position: absolute; left: calc(-1.3 * var(--su)); top: calc(-1.6 * var(--su)); width: calc(2.6 * var(--su)); height: calc(3.6 * var(--su));
    border-radius: 50% 50% 45% 45%; background: rgba(255, 255, 255, .92); rotate: var(--a); transform-origin: 50% 100%;
    animation: drop .55s cubic-bezier(.2, .7, .4, 1) both;
  }
  @keyframes drop {
    from { transform: translateY(0) scale(.4); opacity: 1; }
    60% { opacity: 1; }
    to { transform: translateY(calc(-11 * var(--su))) scale(.7); opacity: 0; }
  }
  .bang {
    left: 0; top: 0; translate: -50% -100%; margin-top: calc(-12 * var(--su));
    display: grid; place-items: center; width: clamp(30px, calc(34 * var(--su)), 38px); aspect-ratio: 1; border-radius: 50%;
    background: #FFFDF6; box-shadow: 0 3px 0 rgba(150, 110, 70, .35), 0 0 0 2px #F2484A inset;
    font: 900 clamp(20px, calc(23 * var(--su)), 26px) / 1 var(--font-ui); color: #E8383A;
    transform-origin: 50% 100%; animation: bang .32s cubic-bezier(.3, 1.6, .5, 1) both;
  }
  @keyframes bang { from { transform: scale(.2); opacity: 0; } 40% { opacity: 1; } }
  .ripple {
    display: block; left: 0; top: 0; width: calc(18 * var(--su)); height: calc(6 * var(--su)); margin: calc(-3 * var(--su)) 0 0 calc(-9 * var(--su));
    border: 1.4px solid rgba(255, 255, 255, .85); border-radius: 50%; animation: ripple .8s ease-out both;
  }
  .ripple.big { width: calc(28 * var(--su)); height: calc(9 * var(--su)); margin: calc(-4.5 * var(--su)) 0 0 calc(-14 * var(--su)); }
  @keyframes ripple { from { transform: scale(.2); opacity: 1; } to { transform: scale(1.3); opacity: 0; } }

  /* bugs: our own little NH-style sprites (the official icon is the catch) */
  .bug.gone { opacity: 0; }
  .bug .hopper, .bug .face { left: 0; top: 0; display: block; }
  .bug svg { position: absolute; overflow: visible; translate: -50% -50%; }
  .flutter .hopper { animation: flutter .42s ease-in-out infinite alternate; }
  @keyframes flutter { from { transform: translateY(calc(-2.5 * var(--su))); } to { transform: translateY(calc(2 * var(--su))); } }
  .flutter svg { width: calc(18 * var(--su)); }
  .moth svg { width: calc(14 * var(--su)); }
  .ladybug svg { width: calc(10 * var(--su)); }
  .wing { transform-origin: 0 0; animation: flap .13s ease-in-out infinite alternate; }
  .ladybug .wing { transform-origin: 0 -3px; }
  @keyframes flap { to { scale: .25 1; } }
  .common-butterfly .wing { fill: #FFFDF3; stroke: #77738F; stroke-width: .8; }
  .yellow-butterfly .wing { fill: #FFE46E; stroke: #C79A2A; stroke-width: .8; }
  .tiger-butterfly .wing { fill: #FFCF45; stroke: #3B3026; stroke-width: 1.3; stroke-dasharray: 2 1.4; }
  .peacock-butterfly .wing { fill: #2C3438; stroke: #3BB49E; stroke-width: 1.1; }
  .emperor-butterfly .wing { fill: #4C93F2; stroke: #1F3A78; stroke-width: 1; }
  .moth .wing { fill: #DCCBA6; stroke: #A38B62; stroke-width: .8; }
  .honeybee svg { width: calc(11 * var(--su)); }
  .honeybee .wing { fill: rgba(255, 255, 255, .7); stroke: rgba(120, 130, 150, .6); stroke-width: .4; animation-duration: .06s; }
  .bee { fill: #F7C63C; } .stripe { stroke: #3A2C1E; stroke-width: 1.1; } .beehead { fill: #3A2C1E; }
  .bbody { fill: #4E3E30; }
  .ladybug .wing { fill: rgba(255, 255, 255, .55); }
  .lady { fill: #E8443B; } .seam { stroke: #3A2A22; stroke-width: .6; } .dot { fill: #2E2420; }
  /* dragonfly: darts and hovers, wings a shimmer */
  .dart svg { width: calc(24 * var(--su)); }
  .dwing { fill: rgba(255, 255, 255, .55); stroke: rgba(120, 140, 160, .5); stroke-width: .4; animation: shimmer .08s linear infinite alternate; }
  @keyframes shimmer { to { opacity: .55; } }
  .dbody { stroke-width: 1.8; stroke-linecap: round; }
  .darner-dragonfly .dbody { stroke: #3C8FC4; } .darner-dragonfly .dhead { fill: #2F7A62; }
  .red-dragonfly .dbody { stroke: #E0473A; } .red-dragonfly .dhead { fill: #B8342B; }
  .dband { display: none; }
  .banded-dragonfly .dbody { stroke: #2E2C24; } .banded-dragonfly .dhead { fill: #3E7A4A; }
  .banded-dragonfly .dband { display: inline; stroke: #F2CC3A; stroke-width: 1.8; stroke-dasharray: 1.3 1.5; }
  .dart.mover { transition-timing-function: cubic-bezier(.2, .8, .3, 1); }
  /* firefly: a soft drifting light that blinks */
  .glow {
    display: block; left: 0; top: 0; width: 4.6px; height: 4.6px; margin: -2.3px; border-radius: 50%;
    background: var(--firefly, #F6FF9E); box-shadow: 0 0 7px var(--firefly-glow, #EFFF7A); animation: blink 2.2s ease-in-out infinite;
  }
  @keyframes blink { 0%, 100% { opacity: .25; } 40%, 60% { opacity: 1; } }
  /* crickets: in the grass, a hop now and then (the hop is a Web Animation on .hopper) */
  .hop svg { width: calc(13 * var(--su)); }
  .cbody { fill: #8A6238; } .bell-cricket .cbody { fill: #5A4A36; }
  .rice-grasshopper .cbody { fill: #A9C653; } .grasshopper .cbody { fill: #6DAA3C; } .migratory-locust .cbody { fill: #8F8B4A; }
  .mantis svg, .orchid-mantis svg { width: calc(15 * var(--su)); }
  .mbody { fill: none; stroke: #79B648; stroke-width: 2; stroke-linecap: round; }
  .mleg { fill: none; stroke: #5E9A36; stroke-width: .8; stroke-linecap: round; stroke-linejoin: round; } .mhead { fill: #79B648; }
  .orchid-mantis .mbody, .orchid-mantis .mhead { stroke: #F4C9DC; fill: #F4C9DC; } .orchid-mantis .mbody { fill: none; }
  .orchid-mantis .mleg { stroke: #E6A6C3; }
  /* cicadas: flown in to a trunk, then perched (a faint buzz of the wings while it sings) */
  .perch svg { width: calc(11 * var(--su)); }
  .perch.mover { transition-timing-function: cubic-bezier(.3, .6, .4, 1); }
  .cibody { fill: #3E4A38; } .evening-cicada .cibody { fill: #8B6A3C; } .eye { fill: #1E2418; }
  .ciwing path { fill: rgba(232, 242, 236, .55); stroke: rgba(80, 110, 90, .7); stroke-width: .4; }
  .perch.sat .ciwing { animation: buzz .07s linear infinite alternate; }
  @keyframes buzz { to { translate: .25px 0; } }
  .leg, .ant { fill: none; stroke: #4A3420; stroke-width: .7; stroke-linecap: round; }
  /* more cicadas, the shell a cicada left behind (amber, see-through), the beetles and the walking stick */
  .walker-cicada .cibody { fill: #5C7A4A; } .giant-cicada .cibody { fill: #2E2A26; }
  .brown-cicada .cibody { fill: #6B4A2A; } .brown-cicada .ciwing path { fill: rgba(150, 100, 60, .8); }
  .cicada-shell .cibody { fill: rgba(196, 136, 64, .78); } .cicada-shell .ciwing path { fill: rgba(220, 170, 100, .5); }
  .cicada-shell.sat .ciwing { animation: none; }
  .perch svg:has(.shellb), .perch svg:has(.stick) { width: calc(11 * var(--su)); }
  .shellb { fill: var(--beetle, #4A2A18); } .bhead { fill: var(--beetle-head, #2E1C12); }
  .seam { stroke: rgba(0, 0, 0, .35); stroke-width: .5; }
  .jaw, .horn { fill: none; stroke: var(--beetle-head, #2E1C12); stroke-width: 1.1; stroke-linecap: round; }
  .saw-stag { --beetle: #6A3A20; } .miyama-stag { --beetle: #7A4A26; } .giant-stag { --beetle: #2A1E16; --beetle-head: #15100C; }
  .rainbow-stag { --beetle: #3BAA6E; --beetle-head: #8E5AD0; }
  .goliath-beetle { --beetle: #F2EEE4; } .goliath-beetle .seam { stroke: #2A2420; stroke-width: 1; }
  .drone-beetle { --beetle: #3F6E3C; --beetle-head: #2A4A28; }
  .jewel-beetle { --beetle: #2FA05A; --beetle-head: #1F6E3E; } .jewel-beetle .seam { stroke: #E0503E; stroke-width: 1.1; }
  .stick { fill: none; stroke: #8A6A3A; stroke-width: 1; stroke-linecap: round; }
  /* crawlers on the beach, the grass and the beds: they fade in where they are */
  .crawl { animation: fade-in .8s ease-out both; }
  .crawl.mover { transition-timing-function: ease-in-out; }
  .crawl svg { width: calc(12 * var(--su)); }
  .centipede svg { width: calc(16 * var(--su)); } .hermit-crab svg { width: calc(14 * var(--su)); }
  .cleg { fill: none; stroke: #C2453A; stroke-width: .8; stroke-linecap: round; }
  .claw { fill: #E0503E; } .cshell { fill: #F2D2B0; stroke: #C99A6A; stroke-width: .5; } .swirl { fill: none; stroke: #B07A4A; stroke-width: .6; }
  .pill { fill: #7E8590; } .wharf-roach .pill { fill: #8C8478; } .seg { stroke: rgba(0, 0, 0, .3); stroke-width: .5; }
  .centipede .cleg { stroke: #E8A23A; } .cseg { fill: #8A3A26; } .chead { fill: #B8452A; }
  .sbody { fill: #D9C2A0; } .sant { fill: none; stroke: #B49A78; stroke-width: .7; stroke-linecap: round; }
  .sshell { fill: #C98A4A; stroke: #8E5A2A; stroke-width: .5; } .snail .swirl { stroke: #7A4A22; }
  /* the bigger butterflies and the moth of the night */
  .paper-kite-butterfly .wing { fill: #FFFDF8; stroke: #2E2A26; stroke-width: 1.2; stroke-dasharray: 1.2 1.6; }
  .agrias-butterfly .wing { fill: #E8433E; stroke: #2B6CC4; stroke-width: 1.4; }
  .monarch-butterfly .wing { fill: #FF9A2E; stroke: #2E2218; stroke-width: 1.2; }
  .queen-alexandras-birdwing .wing { fill: #3FB59A; stroke: #1E2A24; stroke-width: 1.5; }
  .rajah-brookes-birdwing .wing { fill: #1F2622; stroke: #3ED68C; stroke-width: 1.7; }
  .atlas-moth .wing { fill: #C8693A; stroke: #7A3A1E; stroke-width: 1; }
  .queen-alexandras-birdwing svg, .rajah-brookes-birdwing svg, .atlas-moth svg { width: calc(23 * var(--su)); }
  .damselfly svg { width: calc(18 * var(--su)); } .damselfly .dbody { stroke: #4AB3E8; stroke-width: 1.2; } .damselfly .dhead { fill: #2A6FA0; }
  .long-locust svg { width: calc(15 * var(--su)); } .long-locust .cbody { fill: #7CC24A; }
  .hop.mover { transition-timing-function: ease-out; }
  /* at night the bugs sit above the tint: dim them like the island (a firefly keeps its light) */
  .night .bug:not(.drift) .face { filter: brightness(.8) saturate(.85); }

  /* the net: one swing across the bug */
  .netfx svg { width: calc(30 * var(--su)); translate: -50% -50%; overflow: visible; transform-origin: 80% 80%; animation: swing .4s cubic-bezier(.3, .7, .4, 1) both; }
  .hoop { fill: rgba(255, 255, 255, .25); stroke: #F4E9D2; stroke-width: 1.6; }
  .mesh { stroke: rgba(255, 255, 255, .6); stroke-width: .5; }
  .handle { stroke: #B88A55; stroke-width: 2.2; stroke-linecap: round; }
  @keyframes swing { 0% { transform: rotate(-70deg); opacity: 0; } 20% { opacity: 1; } 70% { transform: rotate(25deg); opacity: 1; } 100% { transform: rotate(32deg); opacity: 0; } }

  @media (prefers-reduced-motion: reduce) {
    .sea-life, .air-life { display: none; }
    .held * { animation-name: fade-in !important; transform: none !important; }
  }
</style>
