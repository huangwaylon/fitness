<script lang="ts">
  // What a shaken tree drops (docs/design.md "Trees", "Shaking a tree"; island/treeShake.ts): FruitTree reports a shake
  // (a quick run of canopy taps) and this rolls the drop. A tree branch falls beside the trunk on the jar's side and lies
  // there until a tap picks it up (a pop, gone; cosmetic). Rarely a wasp nest falls beside the trunk on the outer side:
  // it lands with a thud, and SWARM_DELAY_MS later three wasps buzz out and charge the villager standing on that side
  // for SWARM_MS. A tap on them in time nets one (the net's swing, NH's catch line on the plate, the shared ずかん's
  // wasp); too late and they sting (`onsting`: the scene gives that villager a fright and a puffy eye), then fly off.
  // Nothing here pays ベル. `?shake=nest|branch` (dev or ?demo) makes the next shake drop that (the e2e's hook).
  import { onDestroy } from 'svelte';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import Plate from './Plate.svelte';
  import type { PersonId } from '#lib/types.ts';
  import { t } from '#lib/i18n/index.ts';
  import { recordFind } from '#lib/store/actions.ts';
  import { TREE, VILLAGER, u } from './scene.ts';
  import { sceneSfx } from './sceneTaps.ts';
  import { stageGeo } from './placement.ts';
  import { critterArt } from './critters.ts';
  import { catchLine, loadLines } from './catchLine.ts';
  import { SWARM_DELAY_MS, SWARM_MS, lastNest, markNest, netsSwarm, shakeDrop, type ShakeDrop } from './treeShake.ts';

  type Side = 'mine' | 'partner';
  interface Props {
    scene?: HTMLElement;
    /** The wasps reached the villager on `side`. */
    onsting?: (side: Side) => void;
  }
  let { scene, onsting }: Props = $props();

  const timers = new Set<ReturnType<typeof setTimeout>>();
  onDestroy(() => {
    for (const id of timers) clearTimeout(id);
  });
  const later = (ms: number, f: () => void) => {
    const id = setTimeout(() => {
      timers.delete(id);
      f();
    }, ms);
    timers.add(id);
  };

  /** Where things land beside a trunk (u): clear of the canopy's and the fruit row's buttons (the grass between them). */
  const FOOT = TREE.base - 14;
  const NEST_DX = 34, BRANCH_DX = 30;
  /** Where a falling thing starts: inside the canopy. */
  const FROM = TREE.base - TREE.h * 0.55;

  let seq = 0;
  let nests = $state<{ n: number; pid: PersonId; x: number; y: number; fading: boolean }[]>([]);
  let branches = $state<{ n: number; pid: PersonId; x: number; y: number }[]>([]);
  let swarm = $state<{ n: number; side: Side; x0: number; y0: number; x1: number; y1: number; at: number; stung: boolean } | null>(null);
  let net = $state<{ n: number; x: number; y: number } | null>(null);
  let card = $state<{ n: number; x: number; y: number; text: string } | null>(null);
  let swarmEl = $state<HTMLElement>();

  // the dev hook: the next shake drops this
  let forced: ShakeDrop | undefined = (() => {
    if (typeof location === 'undefined') return undefined;
    const q = new URLSearchParams(location.search);
    const v = q.get('shake');
    return (import.meta.env.DEV || q.has('demo')) && (v === 'nest' || v === 'branch') ? v : undefined;
  })();

  /** A shake of `pid`'s tree, standing on `slot` (A: the left, beside my villager; B: the right, the partner's). */
  export function shaken(pid: PersonId, slot: 'A' | 'B') {
    const now = Date.now();
    let drop = shakeDrop(Math.random, now, lastNest(pid), forced);
    forced = undefined;
    if (drop === 'nest' && (swarm || nests.some((s) => s.pid === pid))) drop = null;
    if (drop === 'branch' && branches.some((b) => b.pid === pid)) drop = null;
    const tx = TREE.x[slot], out = slot === 'A' ? -1 : 1;
    if (drop === 'branch') {
      branches = [...branches, { n: ++seq, pid, x: tx - out * BRANCH_DX, y: FOOT }];
      later(520, () => sceneSfx('twig'));
    } else if (drop === 'nest') {
      markNest(pid, now);
      void loadLines().catch(() => {});
      const nest = { n: ++seq, pid, x: tx + out * NEST_DX, y: FOOT, fading: false };
      nests = [...nests, nest];
      later(560, () => sceneSfx('nest'));
      later(560 + SWARM_DELAY_MS, () => charge(nest.n, nest.x, nest.y - 10, slot));
    }
  }

  function charge(nestN: number, x: number, y: number, slot: 'A' | 'B') {
    const side: Side = slot === 'A' ? 'mine' : 'partner';
    const n = ++seq;
    swarm = { n, side, x0: x, y0: y, x1: VILLAGER.x[slot], y1: VILLAGER.foot - VILLAGER.h * 0.78, at: performance.now(), stung: false };
    sceneSfx('buzz');
    later(SWARM_MS, () => {
      if (swarm?.n !== n) return;
      swarm = { ...swarm, stung: true };
      sceneSfx('sting');
      onsting?.(side);
      later(900, () => swarm?.n === n && (swarm = null));
      fadeNest(nestN);
    });
  }

  function fadeNest(n: number) {
    later(1200, () => (nests = nests.map((s) => (s.n === n ? { ...s, fading: true } : s))));
    later(1800, () => (nests = nests.filter((s) => s.n !== n)));
  }

  /** A tap on the swarm: netted while it's on its way. */
  function netIt() {
    const s = swarm;
    if (!s || s.stung || !netsSwarm(performance.now() - s.at)) return;
    const g = stageGeo(scene), r = swarmEl?.getBoundingClientRect();
    const x = g && r ? (r.left + r.width / 2 - g.r.left) * g.k : s.x1, y = g && r ? (r.top + r.height / 2 - g.r.top) * g.k : s.y1;
    swarm = null;
    net = { n: ++seq, x, y };
    sceneSfx('net');
    const nest = nests.find((ns) => !ns.fading);
    if (nest) fadeNest(nest.n);
    later(420, () => (net = null));
    later(160, async () => {
      sceneSfx('catch');
      recordFind('bug', 'wasp');
      const n = ++seq;
      const text = await catchLine('wasp');
      card = { n, x, y, text };
    });
  }

  /** NH's pick-up: a hop and gone. */
  function pickUp(_el: Element) {
    return {
      duration: 340,
      css: (tt: number, v: number) =>
        `transform: translateY(${(-60 * Math.sin(v * Math.PI * 0.6)).toFixed(1)}%) scale(${(1 - 0.7 * v * v).toFixed(3)}); opacity: ${Math.min(1, tt * 3).toFixed(2)}`
    };
  }
  function pick(n: number) {
    sceneSfx('twig');
    branches = branches.filter((b) => b.n !== n);
  }
</script>

{#each nests as s (s.n)}
  <span class="drop nest" class:fading={s.fading} data-nest={s.pid} style:left={u(s.x)} style:top={u(s.y)} style:--from={u(FROM - s.y)}>
    <!-- NH's wasp nest: a papery grey-brown hive, banded, with its dark mouth -->
    <svg viewBox="0 0 24 28" aria-hidden="true">
      <path d="M12 1.5 C17.5 1.5 21.5 7 21.5 14 C21.5 21.5 17 26.5 12 26.5 C7 26.5 2.5 21.5 2.5 14 C2.5 7 6.5 1.5 12 1.5 Z" fill="#B49A78" />
      <path d="M4 9.5 C9 11 15 11 20 9.5 M3 15 C9 16.8 15 16.8 21 15 M4 20.5 C9 22 15 22 20 20.5" fill="none" stroke="#8C7356" stroke-width="1.3" stroke-linecap="round" />
      <path d="M8 4.5 C9 3.5 10.5 3 12 3" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="1.2" stroke-linecap="round" />
      <ellipse cx="12" cy="23.4" rx="2.6" ry="1.8" fill="#4A3828" />
      <path d="M11 1.8 L12 -1 L13 1.8 Z" fill="#7A6248" />
    </svg>
  </span>
{/each}

{#each branches as b (b.n)}
  <span class="drop branch" style:left={u(b.x)} style:top={u(b.y)} style:--from={u(FROM - b.y)} out:pickUp>
    <OfficialArt key="finds/tree-branch" size={u(22)} eager />
  </span>
  <button type="button" class="pick" data-branch={b.pid} data-sfx="self" aria-label={t('shake.branch')} style:left={u(b.x)} style:top={u(b.y - 9)}
    onclick={() => pick(b.n)}></button>
{/each}

<div class="held">
  {#if swarm}
    {@const s = swarm}
    {#key s.n}
      <button type="button" class="swarm" class:stung={s.stung} data-swarm={s.side} data-sfx="self" aria-label={t('shake.swarm')} bind:this={swarmEl}
        style:--x0={u(s.x0)} style:--y0={u(s.y0)} style:--x1={u(s.x1)} style:--y1={u(s.y1)} style:--ms="{SWARM_MS}ms"
        style:--away={u(s.x1 < 195 ? -120 : 120)} onclick={netIt}>
        {#each [[-7, -3, 0], [6, -6, 0.13], [1, 6, 0.26]] as [dx, dy, d], k (k)}
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
    {/key}
  {/if}
  {#if net}
    {#key net.n}
      <span class="netfx" style:left={u(net.x)} style:top={u(net.y)}>
        <svg viewBox="-20 -20 40 40" aria-hidden="true"><path class="handle" d="M6 6 L19 19" /><circle class="hoop" cx="-1" cy="-1" r="9.5" /><path class="mesh" d="M-10 -1 H8 M-1 -10 V8 M-7.5 -7.5 L5.5 5.5 M-7.5 5.5 L5.5 -7.5" /></svg>
      </span>
    {/key}
  {/if}
  {#if card}
    {@const c = card}
    {#key c.n}<Plate {scene} x={c.x} y={c.y} art={critterArt('wasp')} text={c.text} ms={Math.min(5600, 2600 + c.text.length * 45)} ondone={() => card?.n === c.n && (card = null)} />{/key}
  {/if}
</div>

<style>
  /* on the grass beside the trunk, under the villagers; it falls out of the canopy (--from) and bounces */
  .drop { position: absolute; z-index: var(--z-fruit); translate: -50% -100%; line-height: 0; pointer-events: none; transform-origin: 50% 100%; animation: shake-drop 560ms cubic-bezier(.45, 0, .8, .6) both; }
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
  .nest svg { width: calc(20 * 100cqw / 390); display: block; }
  .nest.fading { transition: opacity 600ms ease; opacity: 0; }
  /* a branch: ≥ 44px to tap, over the grass beside the trunk (between the canopy and the fruit row) */
  .pick {
    position: absolute; z-index: var(--z-fruit-row); translate: -50% -50%; width: max(44px, calc(30 * 100cqw / 390)); aspect-ratio: 1;
    appearance: none; border: 0; background: none; padding: 0; cursor: pointer; border-radius: 50%; -webkit-tap-highlight-color: transparent;
  }
  .pick:focus-visible, .swarm:focus-visible { outline: 3px solid var(--focus); outline-offset: -4px; }
  .held { position: absolute; inset: 0; z-index: var(--z-taps); pointer-events: none; --su: calc(100cqw / 390); }
  /* the swarm: a ≥ 44px button that charges from the nest to the villager's face, wobbling; stung, it flies off */
  .swarm {
    position: absolute; left: 0; top: 0; width: max(44px, calc(36 * 100cqw / 390)); aspect-ratio: 1; margin: calc(max(44px, calc(36 * 100cqw / 390)) / -2) 0 0 calc(max(44px, calc(36 * 100cqw / 390)) / -2);
    appearance: none; border: 0; background: none; padding: 0; cursor: pointer; border-radius: 50%; pointer-events: auto;
    -webkit-tap-highlight-color: transparent; animation: charge var(--ms) cubic-bezier(.4, .1, .7, 1) both;
  }
  .swarm.stung { animation: away 900ms ease-in both; pointer-events: none; }
  @keyframes charge { from { translate: var(--x0) var(--y0); } to { translate: var(--x1) var(--y1); } }
  @keyframes away { from { translate: var(--x1) var(--y1); opacity: 1; } to { translate: calc(var(--x1) + var(--away)) calc(var(--y1) - 25cqw); opacity: 0; } }
  .wasp {
    position: absolute; left: 50%; top: 50%; width: calc(13 * 100cqw / 390); overflow: visible;
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
