<script lang="ts">
  // The island's critters (docs/design.md "Scene interactions"), after NH: now and then (every 1–3 minutes the island
  // is on screen) a fish shadow swims in the sea off the beach or a bug of the season and hour comes by (butterflies
  // over the flower beds, a dragonfly over the hedge, fireflies on summer nights, a cricket in the autumn grass); a
  // shaken bush sometimes lets one out. Nothing counts: a catch is an official icon and NH's caption for a moment.
  //   Fishing: a tap in the sea near a shadow casts a bobber (a line from the beach); the fish swims up, nibbles 0–3
  //   times and bites (the bobber goes under, plop): a tap then catches it, a tap any earlier or none in time and it
  //   flees. 1 in 14 the line brings up a boot, a tire or a can.
  //   Bugs: a tap on one swings the net (caught); a tap close by startles it away.
  // SceneTaps.svelte mounts this inside the stage and routes taps here first (`tap`), and a shaken bush (`fromBush`).
  // Cheap: ≤ 1 fish + 1 bug; they move by CSS transitions between waypoints a timer picks every second or few (no rAF),
  // with one wing / fin loop each while on screen; nothing exists between visits but one timer. Covered or hidden:
  // they all leave at once and the countdown holds. Reduced motion: no critters. Decorative, pointer-only.
  //   ?critter=fish | <bug id> (dev or ?demo): one now, staying until caught (the e2e's hook).
  import { onMount } from 'svelte';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { artUrl } from '#lib/art.ts';
  import { t } from '#lib/i18n/index.ts';
  import { jst, now, reducedMotion } from '#lib/time/clock.ts';
  import { HEDGE_BASE, HEDGE_X, BUSH_U, SAND, type Tod } from './scene.ts';
  import { hitStage, sceneSfx } from './sceneTaps.ts';
  import {
    BUGS, FISH, STAY_MS, bitePlan, bushBug, castPhase, caption, critterArt, hookItem, netSwing, nextSpawnMs, pickBug,
    pickFish, reel, spawnKind, type BitePlan, type BugId, type FishId, type Flight, type JunkId
  } from './critters.ts';

  interface Props {
    scene?: HTMLElement;
    tod: Tod;
    /** Live, not covered by a sheet, page visible. */
    enabled: () => boolean;
  }
  let { scene, tod, enabled }: Props = $props();

  interface Box { x0: number; x1: number; y0: number; y1: number }
  interface Fish { item: FishId | JunkId; size: number; x: number; y: number; ms: number; flip: boolean; box: Box; gone: boolean; dash: boolean }
  interface Cast { x: number; y: number; sx: number; sy: number; landed: boolean; t0: number; plan: BitePlan | null; under: boolean; rings: number }
  interface Bug { id: BugId; flight: Flight; x: number; y: number; ms: number; flip: boolean; gone: boolean; area: Box; hops: number }
  interface Card { n: number; x: number; y: number; dx: number; dy: number; cx: number; art: string; text: string }
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
  /** The stage's box, px → u, and what of it is on screen (u). */
  function geo() {
    const stage = scene?.querySelector<HTMLElement>('.stage');
    if (!scene || !stage) return null;
    const r = stage.getBoundingClientRect(), s = scene.getBoundingClientRect();
    const k = 390 / r.width;
    return { r, k, left: (s.left - r.left) * k, right: (s.right - r.left) * k, bottom: (s.bottom - r.top) * k, w: s.width * k };
  }
  /** The beach's sea edge (SAND's front, rounded at the corners) at x, in u. */
  function shoreY(x: number): number {
    const { x0, x1, y1, rb } = SAND;
    const cx = clamp(x, x0 + rb, x1 - rb);
    const dx = Math.min(Math.abs(x - cx), rb);
    return y1 - rb + Math.sqrt(rb * rb - dx * dx);
  }
  /** The open sea off the beach on one side (left or right of the しまフォン button, which sits in the middle), from
   *  just past the foam down to above the screen's bottom edge; null when a short screen leaves no room. */
  function seaBox(g: NonNullable<ReturnType<typeof geo>>, side: -1 | 1): Box | null {
    const [f0, f1] = side < 0 ? [0.08, 0.3] : [0.7, 0.92];
    const x0 = g.left + g.w * f0, x1 = g.left + g.w * f1;
    const y0 = Math.max(shoreY(x0), shoreY(x1)) + 12;
    const y1 = Math.min(y0 + 40, g.bottom - 34 * g.k);
    return y1 - y0 >= 14 ? { x0, x1, y0, y1 } : null;
  }
  const inBox = (b: Box) => ({ x: between(b.x0, b.x1), y: between(b.y0, b.y1) });
  /** The open places a bug keeps to, clear of the trees, the jar and the villagers (a bug over a button couldn't be
   *  netted: the tap is the button's). */
  const BEDS: Box[] = [{ x0: 45, x1: 115, y0: 212, y1: 285 }, { x0: 275, x1: 345, y0: 212, y1: 285 }];
  const HEDGE: Box = { x0: 50, x1: 340, y0: 18, y1: 66 };
  const GRASS: Box[] = [{ x0: 48, x1: 118, y0: 250, y1: 306 }, { x0: 272, x1: 342, y0: 250, y1: 306 }];
  const sizeU = (f: Fish) => 8 + f.size * 4.5;

  function preload(key: string) {
    const url = artUrl(key);
    if (url) new Image().src = url;
  }

  // ---------- fish ----------
  function spawnFish(stay = true) {
    const g = geo();
    const side = rand() < 0.5 ? -1 : 1;
    const box = g && (seaBox(g, side) ?? seaBox(g, side < 0 ? 1 : -1));
    if (!box) return;
    const { month, hour } = jst(now());
    const id = pickFish(month, hour, rand);
    const item = hookItem(id, rand);
    preload(critterArt(item));
    const p = inBox(box);
    fish = { item, size: FISH[id].size, ...p, ms: 0, flip: rand() < 0.5, box, gone: false, dash: false };
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
    const by = Math.max(y, shoreY(x) + 8);
    const side = x < 195 ? 1 : -1; // the angler stands on the beach, a little toward the middle
    cast = { x, y: by, sx: x + side * 10, sy: shoreY(x + side * 10) - 4, landed: false, t0: 0, plan: null, under: false, rings: 0 };
    sceneSfx('cast');
    sceneSfx('plop');
    later(() => {
      const c = cast;
      if (!c) return;
      c.landed = true;
      c.t0 = performance.now();
      c.rings++;
      const d = Math.hypot(f.x - c.x, f.y - c.y);
      if (d > 90 || fish !== f) return later(() => cast === c && (cast = null), 9000); // nobody noticed
      const plan = (c.plan = bitePlan(d, rand));
      // swim up to it, nose to the bobber
      const ux = (c.x - f.x) / (d || 1), uy = (c.y - f.y) / (d || 1);
      const len = sizeU(f) * 0.5;
      Object.assign(f, { ms: plan.arrive, flip: c.x > f.x, x: c.x - ux * len, y: c.y - uy * len * 0.6 });
      for (const at of plan.nibbles)
        later(() => {
          if (cast !== c) return;
          c.rings++;
          dip(0.9);
          sceneSfx('nibble');
        }, at);
      later(() => {
        if (cast !== c) return;
        c.under = true;
        c.rings++;
        sceneSfx('bite');
      }, plan.bite);
      later(() => cast === c && flee(), plan.bite + plan.window); // too late
    }, 300);
  }

  let bobEl = $state<HTMLElement>();
  function dip(depth: number) {
    bobEl?.animate([{ translate: '0 0' }, { translate: `0 ${U(depth * 2.4)}`, offset: 0.35 }, { translate: '0 0' }], { duration: 300, easing: 'ease-out' });
  }

  /** NH's A button while the bobber is out. */
  function reelIn() {
    const c = cast!;
    if (!c.landed) return; // still in the air
    const r = reel(castPhase(c.plan, performance.now() - c.t0));
    if (r === 'flee') return flee();
    cast = null;
    sceneSfx('reel');
    if (r === 'reel') return;
    const f = fish!;
    fish = null;
    sceneSfx('catch');
    show(f.item, c.x, c.y, shoreY(c.x) - 6, shoreY(c.x) - 2);
  }

  // ---------- bugs ----------
  function spawnBug(id: BugId | null, from?: { x: number; y: number }, stay = true) {
    const g = geo();
    if (!id || !g || bug) return;
    preload(critterArt(id));
    const flight = BUGS[id].flight;
    const side = rand() < 0.5 ? -1 : 1;
    const area = from || id === 'moth' || flight === 'dart' ? HEDGE : flight === 'hop' ? GRASS[side < 0 ? 0 : 1] : BEDS[side < 0 ? 0 : 1];
    // flyers come in from the side of their patch; a firefly blinks on, a cricket is just there in the grass
    const start = from ?? (flight === 'drift' || flight === 'hop' ? inBox(area) : { x: side < 0 ? g.left - 16 : g.right + 16, y: between(area.y0, area.y1) });
    bug = { id, flight, ...start, ms: 0, flip: side < 0, gone: false, area, hops: 0 };
    later(fly, 60);
    if (stay) later(() => bugLeave(), STAY_MS.bug);
  }
  function fly() {
    const b = bug;
    if (!b || b.gone) return;
    const p = inBox(b.area);
    if (b.flight === 'hop') {
      // a short hop along the grass, then a sit
      const x = clamp(b.x + (rand() < 0.5 ? -1 : 1) * between(14, 30), b.area.x0, b.area.x1);
      const y = clamp(b.y + between(-8, 8), b.area.y0, b.area.y1);
      Object.assign(b, { ms: 420, flip: x > b.x, x, y });
      hopEl?.animate([{ translate: '0 0' }, { translate: `0 ${U(-9)}`, offset: 0.45 }, { translate: '0 0' }], { duration: 420, easing: 'ease-out' });
      return later(fly, 420 + between(1400, 2800));
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
    if (b.flight === 'drift' || (b.flight === 'hop' && !fast)) {
      b.ms = 900;
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
  /** The catch held up: its official icon pops up from (x, y) to stand on `top` (u) with NH's caption under it, kept on
   *  screen and above `floor` (u: the beach, so it never reaches the しまフォン button); gone after 2.6 s. */
  function show(item: FishId | JunkId | BugId, x: number, y: number, top: number, floor = 340) {
    const g = geo();
    if (!g) return;
    // the icon over the catch, the caption (≤ 236px wide) under it, both kept 10px inside the screen's edges
    const ix = clamp(x, g.left + 34 * g.k, g.right - 34 * g.k);
    const cx = clamp(x, g.left + 128 * g.k, g.right - 128 * g.k);
    // the icon (≈ 44u) stays under the horizon; two lines of caption (≈ 50px) above the floor
    const cy = Math.max(52, Math.min(top, floor - 52 * g.k));
    const c = caption(item);
    const n = ++seq;
    card = { n, x: ix, y: cy, dx: x - ix, dy: y - cy, cx: cx - ix, art: critterArt(item), text: t(c.key, c.name ? { name: t(c.name) } : undefined) };
    later(() => card?.n === n && (card = null), 2600);
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
          show(b.id, x, y, y - 10);
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
    if (f && !f.gone && y > shoreY(x) && hitStage(x, y).kind === 'sea' && Math.abs(x - f.x) < 130) {
      castAt(x, y);
      return true;
    }
    return false;
  }

  // ---------- the visits ----------
  // A countdown of on-screen time: it runs while the island is live and visible, holds under a sheet or in a hidden
  // tab (and the critters leave), and resumes where it was.
  let remaining = nextSpawnMs(rand, true);
  $effect(() => {
    if (!scene || !enabled() || reducedMotion()) return;
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
      if (!enabled()) return later(go, 300);
      if (want === 'fish') spawnFish(false);
      else if (want in BUGS) spawnBug(want as BugId, undefined, false);
    };
    later(go, 600);
    return clearAll;
  });
</script>

<div class="sea-life" aria-hidden="true">
  {#if fish}
    <span class="mover shadow" class:gone={fish.gone} class:dash={fish.dash} data-critter="fish"
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
      <span class="float" bind:this={bobEl}><i class="ball"></i></span>
    </span>
  {/if}
</div>

<div class="air-life" class:night aria-hidden="true">
  {#if bug}
    {@const b = bug}
    <span class="mover bug {b.flight} {b.id}" class:gone={b.gone} data-critter={b.id} bind:this={bugEl}
      style:translate="{U(b.x)} {U(b.y)}" style:transition-duration="{b.ms}ms">
      <span class="hopper" bind:this={hopEl}>
        <span class="face" class:flip={b.flip}>
          {#if b.flight === 'drift'}
            <i class="glow"></i>
          {:else if b.flight === 'dart'}
            <svg viewBox="-12 -8 24 16"><g class="dwing"><ellipse cx="-3" cy="-4" rx="2.2" ry="5.5" transform="rotate(-62 -3 -4)" /><ellipse cx="-3" cy="4" rx="2.2" ry="5.5" transform="rotate(62 -3 4)" />
              <ellipse cx="1" cy="-4" rx="1.9" ry="5" transform="rotate(-70 1 -4)" /><ellipse cx="1" cy="4" rx="1.9" ry="5" transform="rotate(70 1 4)" /></g>
              <path class="dbody" d="M-11 0 L4 0" /><circle class="dhead" cx="5.5" cy="0" r="2" /></svg>
          {:else if b.flight === 'hop'}
            <svg viewBox="-8 -6 16 12"><path class="leg" d="M-1 1 L-5 -3.5 L-7 3" /><ellipse class="cbody" cx="0" cy="0" rx="4.6" ry="2.6" />
              <circle class="cbody" cx="4.4" cy="-.6" r="1.8" /><path class="ant" d="M5.5 -1.8 Q8 -6 3 -5.6 M5.8 -1.4 Q9 -4 6 -6" /></svg>
          {:else if b.id === 'ladybug'}
            <svg viewBox="-9 -8 18 16"><g class="wing"><ellipse cx="-3" cy="-4" rx="4" ry="2.4" /></g><g class="wing r"><ellipse cx="3" cy="-4" rx="4" ry="2.4" /></g>
              <circle class="lady" r="4.4" /><path d="M0 -4.4 V4.4" class="seam" /><circle cx="-2" cy="-1" r=".9" class="dot" /><circle cx="2.1" cy="1.4" r=".9" class="dot" /><circle cx="-1.6" cy="2.2" r=".7" class="dot" /></svg>
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
  {#if net}
    {#key net.n}
      <span class="mover netfx" style:translate="{U(net.x)} {U(net.y)}">
        <svg viewBox="-20 -20 40 40"><path class="handle" d="M6 6 L19 19" /><circle class="hoop" cx="-1" cy="-1" r="9.5" /><path class="mesh" d="M-10 -1 H8 M-1 -10 V8 M-7.5 -7.5 L5.5 5.5 M-7.5 5.5 L5.5 -7.5" /></svg>
      </span>
    {/key}
  {/if}
  {#if card}
    {#key card.n}
      <span class="mover catch" data-fx="catch" style:translate="{U(card.x)} {U(card.y)}" style:--dx={U(card.dx)} style:--dy={U(card.dy)} style:--cx={U(card.cx)}>
        <span class="icon"><OfficialArt key={card.art} size="clamp(38px, calc(46 * var(--su)), 54px)" eager /></span>
        <span class="say">{card.text}</span>
      </span>
    {/key}
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
  @keyframes wag { from { transform: skewY(-4deg) scale(1, .96); } to { transform: skewY(4deg) scale(.97, 1); } }
  @keyframes fade-in { from { opacity: 0; } }

  /* the line: a thin arc from the beach to the bobber, drawn once the bobber lands */
  .line { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; opacity: 0; transition: opacity .25s; }
  .line.landed { opacity: 1; }
  .line path { fill: none; stroke: rgba(255, 255, 255, .8); stroke-width: 1px; vector-effect: non-scaling-stroke; }
  /* the bobber: NH's red-and-white float, arcing in from the beach, then bobbing; under on the bite */
  .bobber .float { left: 0; top: 0; animation: cast .3s cubic-bezier(.3, .2, .6, 1) both; }
  @keyframes cast {
    from { transform: translate(var(--fx), var(--fy)) translateY(calc(-14 * var(--su))); }
    50% { transform: translate(calc(var(--fx) * .5), calc(var(--fy) * .5)) translateY(calc(-16 * var(--su))); }
  }
  .ball {
    display: block; width: calc(8 * var(--su)); height: calc(8 * var(--su)); margin: calc(-6.4 * var(--su)) 0 0 calc(-4 * var(--su));
    border-radius: 50%; background: linear-gradient(180deg, #F2484A 0 48%, #FFFDF6 52%); box-shadow: inset -1px -1px 0 rgba(0, 0, 0, .12);
    animation: bob 1.5s ease-in-out .3s infinite alternate; transition: translate .12s ease-in, opacity .12s, scale .12s;
  }
  @keyframes bob { from { transform: translateY(calc(-.6 * var(--su))); } to { transform: translateY(calc(.6 * var(--su))); } }
  .under .ball { translate: 0 calc(3 * var(--su)); scale: .8; opacity: .35; }
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
  .moth .wing { fill: #DCCBA6; stroke: #A38B62; stroke-width: .8; }
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
  .leg, .ant { fill: none; stroke: #4A3420; stroke-width: .7; stroke-linecap: round; }
  .hop.mover { transition-timing-function: ease-out; }
  /* at night the bugs sit above the tint: dim them like the island (a firefly keeps its light) */
  .night .bug:not(.drift) .face { filter: brightness(.8) saturate(.85); }

  /* the net: one swing across the bug */
  .netfx svg { width: calc(30 * var(--su)); translate: -50% -50%; overflow: visible; transform-origin: 80% 80%; animation: swing .4s cubic-bezier(.3, .7, .4, 1) both; }
  .hoop { fill: rgba(255, 255, 255, .25); stroke: #F4E9D2; stroke-width: 1.6; }
  .mesh { stroke: rgba(255, 255, 255, .6); stroke-width: .5; }
  .handle { stroke: #B88A55; stroke-width: 2.2; stroke-linecap: round; }
  @keyframes swing { 0% { transform: rotate(-70deg); opacity: 0; } 20% { opacity: 1; } 70% { transform: rotate(25deg); opacity: 1; } 100% { transform: rotate(32deg); opacity: 0; } }

  /* the catch: the icon pops up from where it was caught; NH's caption under it */
  .catch { animation: fade-out 2.6s linear both; }
  @keyframes fade-out { 85% { opacity: 1; } 100% { opacity: 0; } }
  .catch .icon { left: 0; top: 0; line-height: 0; translate: -50% -100%; animation: lift .55s cubic-bezier(.3, 1.5, .5, 1) both; }
  .catch .icon { width: max-content; }
  .catch .icon :global(.official) { max-width: none; filter: drop-shadow(0 2px 2px rgba(60, 40, 20, .3)); }
  @keyframes lift { from { transform: translate(var(--dx), var(--dy)) scale(.3); opacity: 0; } 30% { opacity: 1; } }
  .say {
    left: var(--cx); top: 2px; translate: -50% 0; width: max-content; max-width: 236px; padding: 3px 12px 4px; border-radius: 14px;
    background: var(--c-cream); color: var(--c-ink); font: 700 var(--fs-s) / 1.35 var(--font-ui); text-align: center; text-wrap: balance;
    box-shadow: 0 2px 0 rgba(147, 112, 71, .35); animation: say .3s ease-out .3s both;
  }
  @keyframes say { from { opacity: 0; transform: translateY(-4px); } }
  @media (prefers-reduced-motion: reduce) {
    .sea-life, .air-life { display: none; }
    .held * { animation-name: fade-in !important; transform: none !important; }
  }
</style>
