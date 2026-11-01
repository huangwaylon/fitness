<script lang="ts">
  // What a shaken tree drops (docs/design.md "Trees", "Shaking a tree"; island/treeShake.ts): FruitTree reports a shake
  // (a quick run of canopy taps) and this rolls the drop. A tree branch falls beside the trunk on the jar's side and lies
  // there until a tap picks it up (a pop, gone; cosmetic). Now and then a bagworm (at night sometimes a spider) drops
  // out of the canopy on its thread beside the trunk on the outer side and dangles there, swaying, for DANGLE_MS: a tap
  // nets it (NH's catch line, the ずかん's bagworm or spider), else it climbs back up. Rarely a wasp nest falls beside the trunk on the outer side:
  // it lands with a thud, and SWARM_DELAY_MS later three wasps buzz out and charge the villager standing on that side
  // for SWARM_MS. A tap on them in time nets one (the net's swing, NH's catch line on the plate, the shared ずかん's
  // wasp); too late and they sting (`onsting`: the scene gives that villager a fright and a sweat drop), then fly off.
  // Nothing here pays ベル. `?shake=nest|branch|bagworm|spider` (dev or ?demo) makes the next shake drop that (the e2e's hook).
  // Everything is a world node beside its tree (world.ts GOAL_TREES); the swarm's node follows the villager's feet as it
  // flies (its live position, frames only while it's out).
  import CatchPlate from './CatchPlate.svelte';
  import { cardFor, type CatchCard } from './catchCard.ts';
  import { pickUp } from '../motion/transitions.ts';
  import { timers } from './timers.ts';
  import { hookOneOf } from './devHooks.ts';
  import { onDestroy } from 'svelte';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import type { PersonId } from '#lib/types.ts';
  import { t } from '#lib/i18n/index.ts';
  import { recordFind } from '#lib/store/actions.ts';
  import { TREE, VILLAGER, u } from './scene.ts';
  import { GOAL_TREES } from './world.ts';
  import { OVER, useWorld } from './camera.svelte.ts';
  import { sceneSfx } from './sceneTaps.ts';
  import { waspMusic } from '#lib/sound/sound.svelte.ts';
  import { critterArt, type BugId } from './critters.ts';
  import { catchLine, loadLines } from './catchLine.ts';
  import { jst } from '#lib/time/clock.ts';
  import { artUrl } from '#lib/art.ts';
  import {
    DANGLE_MS, SWARM_DELAY_MS, SWARM_MS, lastNest, markNest, netsSwarm, shakeDrop, shakenBug, type ShakeDrop
  } from './treeShake.ts';
  import { approach, turnTo } from './avatar.ts';
  import { livePos } from '../motion/director.svelte.ts';

  type Side = 'mine' | 'partner';
  interface Props {
    scene?: HTMLElement;
    /** The wasps reached the villager on `side`. */
    onsting?: (side: Side) => void;
  }
  let { scene, onsting }: Props = $props();
  const w = useWorld();

  const { later, clear } = timers();
  onDestroy(() => {
    clear();
    stopSwarm();
  });

  /** Where things land beside a trunk (world units from its foot): just in front of the trunk's line (FRONT), a branch
   *  on the inner side, a nest and a dangling bug on the outer. Their nodes stand NEAR in front of the tree's own
   *  (the canopy's and the fruit row's buttons), so a branch's or a bug's own tap target is on top. */
  const FRONT = 2, NEAR = -60;
  const NEST_DX = 34, BRANCH_DX = 36;
  /** Where a falling thing starts: inside the canopy (u above the ground). */
  const FROM = TREE.h * 0.55;
  /** A dangling bug hangs beside the trunk on the outer side, at a branch's height (its tap target between the canopy's
   *  and the fruit row's buttons; u above the ground). */
  const DANGLE_DX = 30;
  const DANGLE_UP = 22;
  /** The wasps come out of the nest this high, and go for the villager's face. */
  const NEST_UP = 10, FACE = VILLAGER.h * 0.78;

  let seq = 0;
  /** World x, y = the world's z. */
  let nests = $state<{ n: number; pid: PersonId; x: number; y: number; fading: boolean }[]>([]);
  let branches = $state<{ n: number; pid: PersonId; x: number; y: number }[]>([]);
  let swarm = $state<{ n: number; side: Side; x0: number; z0: number; at: number; stung: boolean; away: number } | null>(null);
  /** The net's swing at world (x, z), `lift` up. */
  let net = $state<{ n: number; x: number; z: number; lift: number } | null>(null);
  let card = $state<CatchCard | null>(null);
  let dangler = $state<{ n: number; pid: PersonId; id: 'bagworm' | 'spider'; x: number; y: number; up: boolean } | null>(null);

  // the dev hook: the next shake drops this (a bagworm or a spider: that bug)
  let forced: string | undefined = hookOneOf('shake', ['nest', 'branch', 'bagworm', 'spider']) ?? undefined;

  /** A shake of `pid`'s tree, standing on `slot` (A: the left, beside my villager; B: the right, the partner's). */
  export function shaken(pid: PersonId, slot: 'A' | 'B') {
    const now = Date.now();
    const bugForced = forced === 'bagworm' || forced === 'spider' ? forced : undefined;
    let drop = shakeDrop(Math.random, now, lastNest(pid), bugForced ? 'bug' : (forced as ShakeDrop | undefined));
    forced = undefined;
    if (drop === 'nest' && (swarm || dangler?.pid === pid || nests.some((s) => s.pid === pid))) drop = null;
    if (drop === 'branch' && branches.some((b) => b.pid === pid)) drop = null;
    if (drop === 'bug' && (dangler || nests.some((s) => s.pid === pid))) drop = null;
    const [tx, tz] = GOAL_TREES[slot], out = slot === 'A' ? -1 : 1, fz = tz - FRONT;
    if (drop === 'bug') {
      const id = bugForced ?? shakenBug(jst().hour, Math.random);
      void loadLines().catch(() => {});
      const url = artUrl(critterArt(id));
      if (url) new Image().src = url;
      const d = { n: ++seq, pid, id, x: tx + out * DANGLE_DX, y: fz, up: false };
      dangler = d;
      later(() => dangler?.n === d.n && (dangler = { ...d, up: true }), DANGLE_MS);
      later(() => dangler?.n === d.n && (dangler = null), DANGLE_MS + 900);
    } else if (drop === 'branch') {
      branches = [...branches, { n: ++seq, pid, x: tx - out * BRANCH_DX, y: fz }];
      later(() => sceneSfx('twig'), 520);
    } else if (drop === 'nest') {
      markNest(pid, now);
      void loadLines().catch(() => {});
      const nest = { n: ++seq, pid, x: tx + out * NEST_DX, y: fz, fading: false };
      nests = [...nests, nest];
      later(() => (sceneSfx('nest'), waspMusic('nest')), 560);
      later(() => charge(nest.n, nest.x, nest.y, slot), 560 + SWARM_DELAY_MS);
    }
  }

  /** A tap on the dangling bug: netted (the net's swing, NH's catch line, a ずかん find). */
  function netDangler() {
    const d = dangler;
    if (!d || d.up || netting) return;
    // my villager walks over with the net (avatar.ts); caught at the tap, swung on arrival
    netting = true;
    const { ms } = approach(d.x, d.y, { tool: 'net', toolMs: 450 });
    later(() => swingAt(d), ms);
  }
  let netting = false;
  function swingAt(d: NonNullable<typeof dangler>) {
    netting = false;
    if (dangler === d) dangler = null;
    net = { n: ++seq, x: d.x, z: d.y, lift: DANGLE_UP };
    sceneSfx('net');
    later(() => (net = null), 420);
    later(async () => {
      sceneSfx('catch');
      const added = recordFind('bug', d.id);
      const n = ++seq;
      const text = await catchLine(d.id as BugId);
      const [sx, sy] = w.screenU(d.x, d.y, DANGLE_UP);
      card = cardFor(n, sx, sy, critterArt(d.id), text, added);
    }, 160);
  }

  /** The swarm's world point now: from the nest to the villager's face where its feet are this frame (mine has usually
   *  walked over to shake the tree, and may still be moving), easing in. */
  function swarmAt(): [number, number, number] {
    const s = swarm;
    if (!s) return [0, 0, 0];
    const t = Math.min(1, Math.max(0, (performance.now() - s.at) / SWARM_MS)), e = t * t * (1.6 - 0.6 * t);
    const [vx, vz] = livePos(s.side);
    return [s.x0 + (vx - s.x0) * e, s.z0 + (vz - s.z0) * e, NEST_UP + (FACE - NEST_UP) * e];
  }
  /** Frames run while the swarm is out (its node follows `swarmAt`). */
  let stopFrames: (() => void) | null = null;
  function stopSwarm() {
    stopFrames?.();
    stopFrames = null;
  }

  function charge(nestN: number, x: number, z: number, slot: 'A' | 'B') {
    const side: Side = slot === 'A' ? 'mine' : 'partner';
    const n = ++seq;
    stopSwarm();
    swarm = { n, side, x0: x, z0: z, at: performance.now(), stung: false, away: x < 195 ? -1 : 1 };
    stopFrames = w.moveStart();
    sceneSfx('buzz');
    waspMusic('chase'); // NH's Chased by Bees cuts in over the island's music
    later(() => {
      if (swarm?.n !== n) return;
      swarm = { ...swarm, stung: true };
      sceneSfx('sting');
      waspMusic('stung');
      onsting?.(side);
      later(() => {
        if (swarm?.n !== n) return;
        swarm = null;
        stopSwarm();
      }, 900);
      fadeNest(nestN);
    }, SWARM_MS);
  }

  function fadeNest(n: number) {
    later(() => (nests = nests.map((s) => (s.n === n ? { ...s, fading: true } : s))), 1200);
    later(() => (nests = nests.filter((s) => s.n !== n)), 1800);
  }

  /** A tap on the swarm: netted while it's on its way. */
  function netIt() {
    const s = swarm;
    if (!s || s.stung || !netsSwarm(performance.now() - s.at)) return;
    const [x, z, lift] = swarmAt();
    swarm = null;
    stopSwarm();
    turnTo(x); // no walk: the wasps' timing stays as it is
    net = { n: ++seq, x, z, lift };
    sceneSfx('net');
    waspMusic('caught');
    const nest = nests.find((ns) => !ns.fading);
    if (nest) fadeNest(nest.n);
    later(() => (net = null), 420);
    later(async () => {
      sceneSfx('catch');
      const added = recordFind('bug', 'wasp');
      const n = ++seq;
      const text = await catchLine('wasp');
      const [sx, sy] = w.screenU(x, z, lift);
      card = cardFor(n, sx, sy, critterArt('wasp'), text, added);
    }, 160);
  }

  /** NH's pick-up: a hop and gone. */
  /** Branches my villager is walking to. */
  const going = new Set<number>();
  /** My villager walks over (avatar.ts) and picks the branch up. */
  function pick(n: number) {
    const b = branches.find((x) => x.n === n);
    if (!b || going.has(n)) return;
    going.add(n);
    const { ms } = approach(b.x, b.y, { motion: 'squish' });
    later(() => {
      going.delete(n);
      sceneSfx('twig');
      branches = branches.filter((x) => x.n !== n);
    }, ms);
  }
</script>

{#each nests as s (s.n)}
  <div class="node" {@attach w.at({ x: s.x, z: s.y, h: FROM, dz: NEAR })}>
    <span class="drop nest" class:fading={s.fading} data-nest={s.pid} style:--from={u(-FROM)}>
      <!-- NH's wasp nest: a papery grey-brown hive, banded, with its dark mouth -->
      <svg viewBox="0 0 24 28" aria-hidden="true">
        <path d="M12 1.5 C17.5 1.5 21.5 7 21.5 14 C21.5 21.5 17 26.5 12 26.5 C7 26.5 2.5 21.5 2.5 14 C2.5 7 6.5 1.5 12 1.5 Z" fill="#B49A78" />
        <path d="M4 9.5 C9 11 15 11 20 9.5 M3 15 C9 16.8 15 16.8 21 15 M4 20.5 C9 22 15 22 20 20.5" fill="none" stroke="#8C7356" stroke-width="1.3" stroke-linecap="round" />
        <path d="M8 4.5 C9 3.5 10.5 3 12 3" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="1.2" stroke-linecap="round" />
        <ellipse cx="12" cy="23.4" rx="2.6" ry="1.8" fill="#4A3828" />
        <path d="M11 1.8 L12 -1 L13 1.8 Z" fill="#7A6248" />
      </svg>
    </span>
  </div>
{/each}

{#each branches as b (b.n)}
  <div class="node" {@attach w.at({ x: b.x, z: b.y, h: FROM, dz: NEAR, inv: true })}>
    <span class="drop branch" style:--from={u(-FROM)} out:pickUp>
      <OfficialArt key="finds/tree-branch" size={u(22)} eager />
    </span>
    <button type="button" class="pick" data-branch={b.pid} data-sfx="self" aria-label={t('shake.branch')} style:top={u(-9)}
      onclick={() => pick(b.n)}></button>
  </div>
{/each}

{#if dangler}
  {@const d = dangler}
  {#key d.n}
    <!-- a bagworm or a spider on its thread, out of the canopy beside the trunk: it drops, sways, and climbs back up -->
    <div class="node" {@attach w.at({ x: d.x, z: d.y, h: FROM, dz: NEAR, inv: true })}>
      <span class="dangle {d.id}" class:up={d.up} data-dangle={d.id} style:top={u(-FROM)} style:--len={u(FROM - DANGLE_UP)}>
        <i class="thread"></i>
        <svg class="dbug" viewBox="-8 -8 16 16" aria-hidden="true">
          {#if d.id === 'bagworm'}
            <path d="M0 -6 C3.6 -5 4.4 1 3 5.6 C1.6 7.4 -1.6 7.4 -3 5.6 C-4.4 1 -3.6 -5 0 -6 Z" fill="#8A6A3E" />
            <path d="M-3.4 -1.6 L3.4 -2.6 M-3.8 1.6 L3.8 .8 M-3.2 4.6 L3.2 4" stroke="#5E4628" stroke-width=".8" stroke-linecap="round" />
            <path d="M-2.6 -3.6 L-1 -5 M1.4 -4.8 L2.8 -3.4 M-3.6 .6 L-5 -.4 M3.8 -.6 L5 -1.8" stroke="#6E8A3E" stroke-width="1" stroke-linecap="round" />
          {:else}
            <path d="M-1.8 -1 L-6 -4.4 L-7 -1 M-1.8 .6 L-6.6 1 L-7 4.6 M1.8 -1 L6 -4.4 L7 -1 M1.8 .6 L6.6 1 L7 4.6 M-1.4 2 L-4 5.8 M1.4 2 L4 5.8 M-1.4 -2 L-3.6 -6 M1.4 -2 L3.6 -6"
              fill="none" stroke="#2A2420" stroke-width=".8" stroke-linecap="round" stroke-linejoin="round" />
            <ellipse cx="0" cy="1.6" rx="2.6" ry="3" fill="#2E2826" /><circle cx="0" cy="-2" r="1.8" fill="#3A322E" />
            <path d="M-1 1 H1 M-1.4 2.6 H1.4" stroke="#C9A040" stroke-width=".6" />
          {/if}
        </svg>
      </span>
      <button type="button" class="pick" data-dangler={d.id} data-sfx="self" aria-label={t('shake.dangle')} disabled={d.up}
        style:top={u(-DANGLE_UP)} onclick={netDangler}></button>
    </div>
  {/key}
{/if}

{#if swarm}
  {@const s = swarm}
  {#key s.n}
    <!-- the swarm: a ≥ 44px button over every world thing, flying from the nest to the villager's face (its live spot) -->
    <div class="node" {@attach w.at({ x: s.x0, z: s.z0, lift: NEST_UP, h: FACE + 20, zi: OVER, inv: true, live: swarmAt })}>
      <button type="button" class="swarm" class:stung={s.stung} data-swarm={s.side} data-sfx="self" aria-label={t('shake.swarm')}
        style:--away={u(s.away * 120)} onclick={netIt}>
        {#each [[-11, -4, 0], [10, -9, 0.13], [1, 9, 0.26]] as [dx, dy, d], k (k)}
          <svg class="wasp" viewBox="-8 -8 16 16" aria-hidden="true" style:--dx={u(dx)} style:--dy={u(dy)} style:animation-delay="-{d}s">
            <g class="w"><ellipse cx="-2" cy="-4.2" rx="2" ry="3.4" transform="rotate(-25 -2 -4.2)" /><ellipse cx="2" cy="-4.2" rx="2" ry="3.4" transform="rotate(25 2 -4.2)" /></g>
            <ellipse cx="-2.6" cy=".2" rx="3.4" ry="2.6" fill="#F2B21E" />
            <path d="M-4.4 -2 V2.4 M-2.2 -2.5 V2.9" stroke="#2E2218" stroke-width="1.1" />
            <path d="M-6 .2 L-7.6 .2" stroke="#2E2218" stroke-width="1" stroke-linecap="round" />
            <circle cx="1.2" cy="0" r="1.6" fill="#D6921A" />
            <circle cx="3.9" cy="-.3" r="1.9" fill="#2E2218" />
          </svg>
        {/each}
      </button>
    </div>
  {/key}
{/if}
{#if net}
  {#key net.n}
    <div class="node" {@attach w.at({ x: net.x, z: net.z, lift: net.lift, h: 40, zi: OVER })}>
      <span class="netfx">
        <svg viewBox="-20 -20 40 40" aria-hidden="true"><path class="handle" d="M6 6 L19 19" /><circle class="hoop" cx="-1" cy="-1" r="9.5" /><path class="mesh" d="M-10 -1 H8 M-1 -10 V8 M-7.5 -7.5 L5.5 5.5 M-7.5 5.5 L5.5 -7.5" /></svg>
      </span>
    </div>
  {/key}
{/if}

<div class="held">
  <CatchPlate {scene} bind:card />
</div>

<style>
  /* a world node at the feet (camera.svelte.ts places it) */
  .node { width: 0; height: 0; pointer-events: none; }
  /* on the grass beside the trunk; it falls out of the canopy (--from) and bounces */
  .drop { position: absolute; left: 0; top: 0; translate: -50% -100%; line-height: 0; pointer-events: none; transform-origin: 50% 100%; animation: shake-drop 560ms cubic-bezier(.45, 0, .8, .6) both; }
  .drop::before {
    content: ''; position: absolute; z-index: -1; left: 10%; width: 90%; bottom: -12%; height: 26%; border-radius: 50%;
    background: radial-gradient(closest-side, var(--sh-c), transparent);
  }
  @keyframes shake-drop {
    0% { transform: translateY(var(--from)); }
    60% { transform: translateY(0) scale(1.1, .88); animation-timing-function: ease-out; }
    76% { transform: translateY(-18%) scale(.96, 1.04); animation-timing-function: ease-in; }
    90% { transform: translateY(0) scale(1.03, .97); } 100% { transform: none; }
  }
  /* in a 0 × 0 node: sized by its art, not squeezed to the node's width */
  .drop { width: max-content; }
  .drop :global(.official) { max-width: none; }
  .nest svg { width: calc(20 * 100cqw / 390); display: block; }
  .nest.fading { transition: opacity 600ms ease; opacity: 0; }
  /* a branch: ≥ 44px to tap, over the grass beside the trunk (between the canopy and the fruit row) */
  .pick {
    position: absolute; left: 0; translate: -50% -50%; width: max(calc(44px * var(--inv, 1)), calc(30 * 100cqw / 390)); aspect-ratio: 1; pointer-events: auto;
    appearance: none; border: 0; background: none; padding: 0; cursor: pointer; border-radius: 50%; -webkit-tap-highlight-color: transparent;
  }
  .pick:focus-visible, .swarm:focus-visible { outline: 3px solid var(--focus); outline-offset: -4px; }
  /* a dangling bug: its thread out of the canopy (it drops down it, sways, and climbs back up it) */
  .dangle {
    /* under the canopy (its thread runs up into it), over the grass */
    position: absolute; left: 0; width: 0; height: var(--len); pointer-events: none; transform-origin: 50% 0;
    animation: dangle-drop 650ms cubic-bezier(.3, .6, .5, 1.2) both, sway 2.6s ease-in-out 650ms infinite alternate;
  }
  .dangle.up { animation: dangle-up 850ms ease-in both; }
  .thread { position: absolute; left: -.5px; top: 0; width: 1px; height: 100%; background: rgba(255, 255, 255, .7); }
  .dbug { position: absolute; left: 0; top: 100%; width: calc(16 * 100cqw / 390); translate: -50% -30%; overflow: visible; }
  @keyframes dangle-drop { from { translate: 0 calc(var(--len) * -1); } }
  @keyframes dangle-up { from { translate: 0 0; opacity: 1; } to { translate: 0 calc(var(--len) * -1); opacity: 0; } }
  @keyframes sway { from { rotate: -5deg; } to { rotate: 5deg; } }
  .held { position: absolute; inset: 0; z-index: var(--z-taps); pointer-events: none; }
  /* the swarm: a ≥ 44px button (whatever the perspective: --inv) centred on its node, which flies from the nest to the
     villager's face, wobbling; stung, it flies off */
  .swarm {
    --s: max(calc(44px * var(--inv, 1)), calc(46 * 100cqw / 390));
    position: absolute; left: 0; top: 0; width: var(--s); aspect-ratio: 1; margin: calc(var(--s) / -2) 0 0 calc(var(--s) / -2);
    appearance: none; border: 0; background: none; padding: 0; cursor: pointer; border-radius: 50%; pointer-events: auto;
    -webkit-tap-highlight-color: transparent;
  }
  .swarm.stung { animation: away 900ms ease-in both; pointer-events: none; }
  @keyframes away { from { translate: 0 0; opacity: 1; } to { translate: var(--away) -25cqw; opacity: 0; } }
  .wasp {
    /* NH's wasps are big and plain to see: each about a third of a villager's head */
    position: absolute; left: 50%; top: 50%; width: calc(21 * 100cqw / 390); overflow: visible;
    translate: calc(-50% + var(--dx)) calc(-50% + var(--dy)); animation: buzz .3s ease-in-out infinite alternate;
  }
  @keyframes buzz { from { transform: translate(-2px, 1px) rotate(-8deg); } to { transform: translate(2px, -2px) rotate(8deg); } }
  .w { fill: rgba(255, 255, 255, .75); stroke: rgba(110, 120, 140, .6); stroke-width: .4; transform-origin: 0 -1px; animation: flap .05s linear infinite alternate; }
  @keyframes flap { to { scale: 1 .3; } }
  .netfx { position: absolute; width: 0; height: 0; }
  .netfx svg {
    position: absolute; width: calc(30 * var(--su)); translate: -50% -50%; overflow: visible; transform-origin: 80% 80%;
    animation: swing .4s cubic-bezier(.3, .7, .4, 1) both;
  }
  /* the net: the critters' own swing (Critters.svelte) */
  .hoop { fill: rgba(255, 255, 255, .25); stroke: #F4E9D2; stroke-width: 1.6; }
  .mesh { stroke: rgba(255, 255, 255, .6); stroke-width: .5; }
  .handle { stroke: #B88A55; stroke-width: 2.2; stroke-linecap: round; }
  @keyframes swing { 0% { transform: rotate(-70deg); opacity: 0; } 20% { opacity: 1; } 70% { transform: rotate(25deg); opacity: 1; } 100% { transform: rotate(32deg); opacity: 0; } }
</style>
