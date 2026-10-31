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
  //   Bugs: a tap on one swings the net (caught); a tap close by startles it away. A tarantula or a scorpion (night,
  //   the grass) rears up at the first tap; a tap while it's reared and it charges off; once it settles, a tap nets it.
  //   A mole cricket chirps under a mound of earth: a tap digs it up. A tap on my villager now and then sends a flea
  //   hopping off it (`fromVillager`).
  // SceneTaps.svelte mounts this inside the stage and routes taps here first (`tap`), and a shaken bush (`fromBush`).
  // Cheap: ≤ 1 fish + 1 bug; they move by CSS transitions between waypoints a timer picks every second or few (no rAF),
  // with one wing / fin loop each while on screen; nothing exists between visits but one timer. Covered or hidden:
  // they all leave at once and the countdown holds. Reduced motion: no critters. Decorative, pointer-only.
  //   ?critter=fish | <fish id> | <bug id> (dev or ?demo): one now, staying until caught (the e2e's hook); ?flea: a tap
  //   on my villager always sends a flea off it.
  import { onMount, untrack } from 'svelte';
  import Plate from './Plate.svelte';
  import { artUrl } from '#lib/art.ts';
  import { jst, now, reducedMotion } from '#lib/time/clock.ts';
  import { HEDGE_BASE, HEDGE_X, BUSH_U, PLATEAU, SAND, TREE, type Tod } from './scene.ts';
  import { hitStage, sceneSfx } from './sceneTaps.ts';
  import { guardsU, stageGeo, type Box, type StageGeo } from './placement.ts';
  import { recordFind } from '#lib/store/actions.ts';
  import { catchLine, loadLines } from './catchLine.ts';
  import { BEACH } from './beach.ts';
  import { LONG_REACH, approach, goHomeLater, turnTo } from './avatar.ts';
  import { HOLD_MS, actors, holdUp, putAway, useTool } from '../motion/director.svelte.ts';
  import { t } from '#lib/i18n/index.ts';
  import {
    BUGS, CAST_U, FISH, HESITATE_MS, HESITATE_U, NOTICE_U, REAR_MS, STAY_MS, bitePlan, bushBug, castPhase, critterArt,
    fleaJumps, hesitatePlan, hookItem, netSwing, nextSpawnMs, oddsAt, pickBug, pickFish, reel, spawnKind, stalkTap, type BitePlan,
    type BugId, type FishId, type Flight, type JunkId, type StalkState
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
  interface Bug {
    id: BugId; flight: Flight; x: number; y: number; ms: number; flip: boolean; gone: boolean; area: Box; keep: Box[]; sat: boolean;
    /** A tarantula's or a scorpion's mood (stalkTap). */
    stalk?: StalkState;
    /** Netted: it holds still until the swing lands (my villager is on its way). */
    held?: boolean;
  }
  interface Card { n: number; x: number; y: number; art: string; parts: string[] }
  /** `held`: the net is in my villager's hand (no floating one). */
  interface Net { n: number; x: number; y: number; held?: boolean }

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
  /** Earth flying up where a mole cricket was dug up. */
  let dig = $state<Net | null>(null);
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
    fish = cast = bug = card = net = dig = null;
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
  /** A crawler's pace: how far it goes at a time (u) and how long that takes (ms). A hermit crab scuttles, a tiger beetle
   *  runs, a snail or a walking leaf barely moves, a stink bug ambles over the flowers. */
  const PACE: Partial<Record<BugId, [number, number, number]>> = {
    'hermit-crab': [30, 450, 700], 'tiger-beetle': [34, 260, 420], snail: [8, 3500, 5000], 'walking-leaf': [6, 3000, 4200],
    stinkbug: [10, 2200, 3200], 'man-faced-stink-bug': [10, 2200, 3200], tarantula: [14, 1800, 2600], scorpion: [16, 1600, 2400]
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

  /** The bugs' sprites (BugSprite.svelte): loaded with the first bug of a session, out of the island's first load. */
  let Sprite = $state<typeof import('./BugSprite.svelte').default | null>(null);
  let sprite: Promise<unknown> | null = null;
  const loadSprite = () => (sprite ??= import('./BugSprite.svelte').then((m) => (Sprite = m.default)).catch(() => (sprite = null)));

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
    void loadLines().catch(() => {});
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

  /** My villager is walking down to the beach to cast (a tap meanwhile does nothing). */
  let casting = false;
  function castAt(x: number, y: number) {
    const f = fish!;
    // the angler stands on the beach: in front, a little toward the middle; beside the island, on its sand edge
    const front = y > shoreY(x);
    const bx = front ? x : x < 195 ? Math.min(x, SAND.x0 - 6) : Math.max(x, SAND.x1 + 6);
    const by = front ? Math.max(y, shoreY(x) + 8) : y;
    const side = x < 195 ? 1 : -1;
    const [sx, sy] = front ? [x + side * 10, shoreY(x + side * 10) - 4] : [x < 195 ? SAND.x0 + 6 : SAND.x1 - 6, y - 8];
    // my villager walks to that spot on the beach (avatar.ts), rod in hand, and casts from there
    casting = true;
    const spot = [Math.round(clamp(sx, BEACH.x0 + 4, BEACH.x1 - 4)), Math.round(Math.min(sy + 2, BEACH.y1 - 1))] as const;
    const { ms } = approach(bx, by, { spot, tool: 'rod', toolMs: 20_000, linger: 20_000 });
    if (ms) later(() => throwLine(f, bx, by, sx, sy), ms);
    else throwLine(f, bx, by, sx, sy);
  }
  function throwLine(f: Fish, bx: number, by: number, sx: number, sy: number) {
    casting = false;
    if (fish !== f || f.gone) return putRodAway();
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
    turnTo(c.x);
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

  /** The line's in (caught, gone or never cast): the rod goes away and my villager heads home in a while. */
  function putRodAway() {
    if (actors.mine.tool !== 'rod') return;
    useTool('mine', null);
    goHomeLater('mine', 3000);
  }
  $effect(() => {
    if (!cast && actors.mine.tool === 'rod' && !casting) untrack(putRodAway);
  });

  // ---------- bugs ----------
  function spawnBug(id: BugId | null, from?: { x: number; y: number }, stay = true) {
    const g = geo();
    if (!id || !g || bug) return;
    void loadSprite();
    preload(critterArt(id));
    void loadLines().catch(() => {});
    const flight = BUGS[id].flight;
    // a flea hops off a villager into the grass on its side
    const side = from && id === 'flea' ? (from.x < 195 ? -1 : 1) : rand() < 0.5 ? -1 : 1;
    const ground = BUGS[id].ground;
    const area = flight === 'perch' ? trunk(g, side)
      : ground === 'beach' ? beach(g)
      : id === 'flea' || flight === 'stalk' || flight === 'burrow' ? GRASS[side < 0 ? 0 : 1]
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
    const inPlace = flight === 'drift' || flight === 'hop' || flight === 'crawl' || flight === 'stalk' || flight === 'burrow' || STILL.has(id);
    const start = from ?? (inPlace ? spot : { x: side < 0 ? g.left - 16 : g.right + 16, y: spot.y - (flight === 'perch' ? 40 : 0) });
    bug = { id, flight, ...start, ms: 0, flip: side < 0, gone: false, area, keep, sat: false, ...(flight === 'stalk' && { stalk: 'calm' as const }) };
    later(fly, 60);
    if (stay) later(() => bugLeave(), STAY_MS.bug);
  }
  function fly() {
    const b = bug;
    if (!b || b.gone || b.held) return;
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
    if (b.flight === 'burrow') return; // under its mound, chirping, until it's dug up or done
    if (b.flight === 'crawl' || b.flight === 'stalk') {
      // a little way along its ground, then a rest: a hermit crab scuttles sideways, a snail barely moves; a reared
      // tarantula holds still
      if (b.stalk === 'rear') return later(fly, 600);
      const [reach, m0, m1] = PACE[b.id] ?? [18, 1600, 2600];
      const crab = b.id === 'hermit-crab';
      const x = clamp(b.x + clamp(p.x - b.x, -reach, reach), b.area.x0, b.area.x1);
      const y = clamp(b.y + clamp(p.y - b.y, -reach / 3, reach / 3), b.area.y0, b.area.y1);
      const ms = between(m0, m1);
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
    if (!b || b.gone || b.held || !g) return;
    b.gone = true;
    const ground = b.flight === 'crawl' || b.flight === 'stalk';
    if (b.flight === 'drift' || b.flight === 'burrow' || ((b.flight === 'hop' || ground || STILL.has(b.id)) && !fast)) {
      b.ms = 900;
    } else if (ground) {
      // startled: it scurries off along the ground and is gone
      const dir = away ?? (b.x < 195 ? -1 : 1);
      Object.assign(b, { ms: 700, flip: dir > 0, x: b.x + dir * 26 });
    } else {
      const dir = away ?? (b.x < 195 ? -1 : 1);
      Object.assign(b, { ms: fast ? 700 : 1600, flip: dir > 0, x: dir < 0 ? g.left - 20 : g.right + 20, y: Math.max(10, b.y - 30) });
    }
    later(() => bug === b && (bug = null), b.ms + 50);
  }

  /** A pill bug (or, in its hours, a centipede) crawls out from under the rock by the hedge (Care's rock tap). */
  export function fromRock(x: number, y: number) {
    if (bug) return;
    const { hour } = jst(now());
    const id: BugId = oddsAt(BUGS.centipede, 1, hour) > 0 ? 'centipede' : 'pill-bug';
    void loadSprite();
    preload(critterArt(id));
    // a little patch of lawn by the rock, in front of the hedge
    const area = { x0: x - 18, x1: x + 20, y0: y - 9, y1: y - 3 }; // in front of the rock's foot, above the jar's lid
    bug = { id, flight: 'crawl', x: x + 8, y: y - 4, ms: 0, flip: false, gone: false, area, keep: [], sat: false };
    later(fly, 300);
    later(() => bugLeave(), STAY_MS.bug);
  }

  /** A tap on my villager (IslandScene via SceneTaps): now and then a flea hops off it into the grass (NH's fleas). */
  export function fromVillager(el: Element) {
    const g = geo();
    if (bug || !g || !(forceFlea || fleaJumps(jst(now()).month, rand))) return;
    const r = el.getBoundingClientRect();
    spawnBug('flea', { x: (r.left + r.width / 2 - g.r.left) * g.k, y: (r.top + r.height * 0.3 - g.r.top) * g.k });
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
  async function show(item: FishId | JunkId | BugId, x: number, y: number) {
    // the shared ずかん: the first catch of each fish or bug (junk isn't a find) gets a second page saying so
    const added = item in FISH ? recordFind('fish', item) : item in BUGS ? recordFind('bug', item) : false;
    const n = ++seq;
    const text = await catchLine(item);
    if (seq !== n) return;
    card = { n, x, y, art: critterArt(item), parts: added ? [text, t('zukan.added')] : [text] };
    holdUp('mine', critterArt(item), HOLD_MS);
  }

  /** A tap on the scene (client px), before SceneTaps' own flourishes: true when a critter took it. */
  export function tap(px: number, py: number): boolean {
    if (casting) return true;
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
      const bx = (r.left + r.width / 2 - g.r.left) * g.k, by = (r.top + r.height / 2 - g.r.top) * g.k;
      if (b.flight === 'stalk' && b.stalk) {
        // NH's tarantula: it rears up when it's come at, charges if you keep coming; settled again, it can be netted
        const act = stalkTap(b.stalk, swing);
        if (act === 'rear') {
          b.stalk = 'rear';
          later(() => bug === b && b.stalk === 'rear' && (b.stalk = 'settled'), REAR_MS);
          return true;
        }
        if (act === 'charge') {
          sceneSfx('bug-flee');
          const tx = (px - g.r.left) * g.k, ty = (py - g.r.top) * g.k;
          const dx = Math.sign(tx - b.x) || 1;
          b.stalk = 'calm';
          Object.assign(b, { ms: 220, flip: dx > 0, x: b.x + clamp(tx - b.x, -16, 16), y: b.y + clamp(ty - b.y, -6, 6) });
          later(() => bugLeave(true, -dx), 260);
          return true;
        }
      }
      if (b.flight === 'burrow') {
        // dug up: a puff of earth and it's caught; a tap anywhere else leaves it under its mound. My villager walks
        // over with the shovel first (avatar.ts).
        if (swing !== 'catch') return false;
        if (b.held) return true;
        b.held = true;
        const { ms } = approach(bx, by, { tool: 'shovel', toolMs: 640 });
        later(() => {
          dig = { n: ++seq, x: bx, y: by };
          sceneSfx('dig');
          if (bug === b) bug = null;
          later(() => {
            sceneSfx('catch');
            show(b.id, bx, by);
          }, 260);
          later(() => (dig = null), 700);
        }, ms);
        return true;
      }
      if (swing === 'catch') {
        if (b.held) return true;
        const x = (r.left + r.width / 2 - g.r.left) * g.k, y = (r.top + r.height / 2 - g.r.top) * g.k;
        // it holds still where it is (mid-flight included) while my villager walks over with the net (avatar.ts)
        const cs = getComputedStyle(bugEl).translate.split(' ').map(parseFloat);
        if (cs.length >= 2 && cs.every(Number.isFinite)) Object.assign(b, { x: cs[0] * g.k, y: cs[1] * g.k });
        Object.assign(b, { held: true, ms: 0 });
        const { ms, walked } = approach(x, y, { tool: 'net', toolMs: 450, reach: LONG_REACH });
        later(() => {
          net = { n: ++seq, x, y, held: walked };
          sceneSfx('net');
          later(() => {
            if (bug === b) bug = null;
            sceneSfx('catch');
            show(b.id, x, y);
          }, walked ? 420 : 160); // in hand, the swing finishes before the hold-up
          later(() => (net = null), 420);
        }, ms);
        return true;
      }
      if (swing === 'startle') {
        // it flies off; the tap still lands where it was meant (a visitor, a shell, the grass)
        sceneSfx('bug-flee');
        bugLeave(true, px < r.left + r.width / 2 ? 1 : -1);
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
  /** `?flea` (dev or ?demo): every tap on my villager sends a flea hopping off it (the e2e's hook). */
  const forceFlea = typeof location !== 'undefined' && new URLSearchParams(location.search).has('flea') && (import.meta.env.DEV || new URLSearchParams(location.search).has('demo'));
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
      else if (want === 'flea') spawnBug('flea', { x: 150, y: 250 }, false);
      else if (want in BUGS && BUGS[want as BugId].flight !== 'dangle') spawnBug(want as BugId, undefined, false);
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
          {#if Sprite}<Sprite id={b.id} flight={b.flight} sat={b.sat} stalk={b.stalk} />{/if}
        </span>
      </span>
    </span>
  {/if}
</div>

<div class="held">
  {#if dig}
    {#key dig.n}
      <!-- the mound dug open: clods of earth fly up -->
      <span class="mover digfx" style:translate="{U(dig.x)} {U(dig.y)}">{#each [-50, -15, 20, 55] as a (a)}<i style:--a="{a}deg"></i>{/each}</span>
    {/key}
  {/if}
  {#if cast?.under}
    <!-- over the land and the tint, so the 「！」 is never hidden behind the beach -->
    <span class="mover" style:translate="{U(cast.x)} {U(cast.y)}"><span class="bang" data-bite>！</span></span>
  {/if}
  {#if net}
    {#key net.n}
      <span class="mover netfx" data-net={net.held ? 'held' : 'float'} style:translate="{U(net.x)} {U(net.y)}">
        <svg class:held={net.held} viewBox="-20 -20 40 40"><path class="handle" d="M6 6 L19 19" /><circle class="hoop" cx="-1" cy="-1" r="9.5" /><path class="mesh" d="M-10 -1 H8 M-1 -10 V8 M-7.5 -7.5 L5.5 5.5 M-7.5 5.5 L5.5 -7.5" /></svg>
      </span>
    {/key}
  {/if}
  {#if card}
    {@const c = card}
    {#key c.n}<Plate {scene} x={c.x} y={c.y} art={c.art} parts={c.parts} ondone={() => card?.n === c.n && ((card = null), putAway('mine'))} />{/key}
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

  /* bugs: the motion (the sprites are BugSprite.svelte, loaded with the first bug) */
  .bug.gone { opacity: 0; }
  .bug .hopper, .bug .face { left: 0; top: 0; display: block; }
  .flutter .hopper { animation: flutter .42s ease-in-out infinite alternate; }
  @keyframes flutter { from { transform: translateY(calc(-2.5 * var(--su))); } to { transform: translateY(calc(2 * var(--su))); } }
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
  @keyframes clod { from { transform: translateY(0) scale(.6); opacity: 1; } 60% { opacity: 1; } to { transform: translateY(calc(-14 * var(--su))) scale(.9); opacity: 0; } }
  /* at night the bugs sit above the tint: dim them like the island (a firefly keeps its light) */
  .night .bug:not(.drift) .face { filter: brightness(.8) saturate(.85); }

  /* the net: one swing across the bug */
  .netfx svg.held { display: none; }
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
