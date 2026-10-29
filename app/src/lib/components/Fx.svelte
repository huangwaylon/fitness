<script lang="ts" module>
  import type { FxKind } from './motion/reactions.ts';
  export type { FxKind };
  /** How long each effect lives (ms); zzz loops until removed. */
  export const FX_MS: Record<FxKind, number> = {
    sparkles: 700 + 3 * 90, hearts: 1200 + 2 * 150, notes: 1100 + 2 * 220, sweat: 900, zzz: Infinity,
    confetti: 1600, puff: 500, glint: 600
  };
</script>

<script lang="ts">
  // Cute overlay effects (style guide v4 §M.4), all ours (SVG/CSS): sparkles, hearts, music notes, a
  // sweat drop, zzz, confetti, dust puffs and a glint. A 0×0 anchor: the parent positions it (head
  // top centre for most, the feet for puffs, the temple for sweat). Removes itself via `ondone`.
  //   <Fx kind="hearts" ondone={() => …} />
  //   <Fx kind="confetti" count={36} />
  // Transform/opacity only, pointer-events none, aria-hidden. Reduced motion: one static icon that
  // fades in and out (notes/hearts/sparkles), nothing for the rest.
  import { onMount } from 'svelte';
  import { reducedMotion } from './motion/clock.ts';

  interface Props {
    kind: FxKind;
    /** Spread of head-top effects (CSS length, ~ the figure width). */
    spread?: string;
    /** Outward direction for notes / zzz: 1 = right, -1 = left. */
    dir?: 1 | -1;
    /** Confetti pieces (default 16; harvest 36). */
    count?: number;
    /** Scale every size (1 = the §M.4 sizes). */
    scale?: number;
    ondone?: () => void;
  }
  let { kind, spread = '60px', dir = 1, count = 16, scale = 1, ondone }: Props = $props();

  const reduced = reducedMotion();
  const CONFETTI = ['#FF7FA8', '#FFD84D', '#6ED07A', '#6FCFF6', '#B98AE8', '#FF9B5C'];
  // deterministic-ish pieces per instance
  const pieces = $derived(Array.from({ length: kind === 'confetti' ? count : 0 }, (_, i) => {
    const a = (i / Math.max(1, count)) * Math.PI - Math.PI;
    return {
      c: CONFETTI[i % CONFETTI.length],
      round: i % 3 === 0,
      dx: Math.cos(a) * (40 + Math.random() * 80),
      up: 60 + Math.random() * 60,
      rot: Math.random() * 720,
      delay: Math.random() * 120
    };
  }));

  onMount(() => {
    const ms = reduced ? 1200 : FX_MS[kind];
    if (!Number.isFinite(ms)) return;
    const t = setTimeout(() => ondone?.(), ms + 60);
    return () => clearTimeout(t);
  });

  const STAR = 'M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0 Z';
  const HEART = 'M12 21 C5 16 1 12 1 7.5 C1 4 3.7 1.5 7 1.5 C9.2 1.5 11 2.8 12 4.6 C13 2.8 14.8 1.5 17 1.5 C20.3 1.5 23 4 23 7.5 C23 12 19 16 12 21 Z';
  const NOTE1 = 'M9 3 L20 1 V15.5 A3.5 3 0 1 1 17.5 12.6 V5.4 L11.5 6.6 V18 A3.5 3 0 1 1 9 15.1 Z';
  const NOTE2 = 'M10 2 L13 2 L13 15 A4 3.4 0 1 1 10 12 Z M13 2 C16 4 19 5 18 10 C17 7 15 6.5 13 6.5 Z';
</script>

<span class="fx {kind}" class:reduced style:--spread={spread} style:--dir={dir} style:--k={scale} aria-hidden="true">
  {#if reduced}
    {#if kind === 'notes' || kind === 'hearts' || kind === 'sparkles' || kind === 'confetti'}
      <svg class="still" viewBox="0 0 24 24" style:width="calc(16px * var(--k))">
        {#if kind === 'hearts'}<path d={HEART} fill="var(--fx-heart)" />
        {:else if kind === 'notes'}<path d={NOTE1} fill="var(--fx-note-1)" />
        {:else}<path d={STAR} fill="var(--fx-spark)" />{/if}
      </svg>
    {/if}
  {:else if kind === 'sparkles'}
    {#each [-0.5, -0.18, 0.18, 0.5] as x, i (i)}
      <svg class="p" viewBox="0 0 24 24" style:--x={x} style:--y={Math.abs(x) * 0.8} style:width="calc({[10, 14, 12, 8][i]}px * var(--k))" style:animation-delay="{i * 90}ms">
        <path d={STAR} fill="var(--fx-spark)" /><circle cx="12" cy="12" r="3" fill="#fff" />
      </svg>
    {/each}
  {:else if kind === 'hearts'}
    {#each [-0.25, 0.1, 0.35] as x, i (i)}
      <svg class="p" viewBox="0 0 24 24" style:--x={x} style:width="calc({[14, 16, 12][i]}px * var(--k))" style:animation-delay="{i * 150}ms">
        <path d={HEART} fill="var(--fx-heart)" /><ellipse cx="7" cy="7" rx="2.6" ry="1.8" fill="#fff" opacity=".4" />
      </svg>
    {/each}
  {:else if kind === 'notes'}
    {#each [0, 1, 2] as i (i)}
      <svg class="p" viewBox="0 0 24 24" style:--i={i} style:width="calc(14px * var(--k))" style:animation-delay="{i * 220}ms">
        <path d={i % 2 ? NOTE2 : NOTE1} fill={i % 2 ? 'var(--fx-note-2)' : 'var(--fx-note-1)'} />
      </svg>
    {/each}
  {:else if kind === 'sweat'}
    <svg class="p" viewBox="0 0 10 14" style:width="calc(10px * var(--k))">
      <path d="M5 0 C7 4 10 7 10 9.5 A5 4.5 0 0 1 0 9.5 C0 7 3 4 5 0 Z" fill="var(--fx-sweat)" />
      <ellipse cx="3.4" cy="9" rx="1.2" ry="2" fill="#fff" opacity=".8" />
    </svg>
  {:else if kind === 'zzz'}
    {#each [12, 15, 18] as s, i (i)}
      <span class="p z" style:font-size="calc({s}px * var(--k))" style:animation-delay="{i * 600}ms">z</span>
    {/each}
  {:else if kind === 'confetti'}
    {#each pieces as p, i (i)}
      <span class="p c" class:round={p.round} style:background={p.c} style:--dx="{p.dx}px" style:--up="{p.up}px"
        style:--rot="{p.rot}deg" style:animation-delay="{p.delay}ms"></span>
    {/each}
  {:else if kind === 'puff'}
    {#each [0, 1] as i (i)}
      <span class="p puff" style:--i={i} style:--s="{[10, 7][i]}px" style:animation-delay="{i * 80}ms"></span>
    {/each}
  {:else if kind === 'glint'}
    <svg class="p" viewBox="0 0 24 24" style:width="calc(10px * var(--k))"><path d={STAR} fill="#fff" /></svg>
  {/if}
</span>

<style>
  .fx { position: absolute; width: 0; height: 0; pointer-events: none; z-index: 5; }
  .p { position: absolute; display: block; left: 0; top: 0; opacity: 0; will-change: transform, opacity; }
  svg.p { height: auto; overflow: visible; }

  .sparkles .p {
    translate: calc(var(--x) * var(--spread) - 50%) calc(var(--y) * var(--spread) * .5 - 50%);
    animation: sparkle 700ms var(--ease-soft) both;
  }
  @keyframes sparkle {
    0% { transform: scale(0) rotate(0); opacity: 0; } 45% { transform: scale(1.2) rotate(45deg); opacity: 1; }
    100% { transform: scale(0) rotate(60deg); opacity: 0; }
  }
  .hearts .p { translate: calc(var(--x) * var(--spread) - 50%) -50%; animation: heart 1200ms ease-out both; }
  @keyframes heart {
    0% { transform: translate(0, 0) scale(.4); opacity: 0; } 12% { transform: translate(-3px, -5px) scale(1); opacity: 1; }
    35% { transform: translate(5px, -14px); } 60% { transform: translate(-6px, -25px); opacity: 1; }
    80% { transform: translate(4px, -33px); opacity: .6; } 100% { transform: translate(0, -40px); opacity: 0; }
  }
  .notes .p { translate: calc(var(--dir) * (var(--i) * 6px) - 50%) -50%; animation: note 1100ms ease-out both; }
  @keyframes note {
    0% { transform: translate(0, 0) scale(.5) rotate(0); opacity: 0; } 15% { opacity: 1; transform: translate(calc(var(--dir) * 4px), -4px) scale(1) rotate(calc(var(--dir) * -12deg)); }
    55% { transform: translate(calc(var(--dir) * 14px), -18px) rotate(calc(var(--dir) * 12deg)); opacity: 1; }
    100% { transform: translate(calc(var(--dir) * 26px), -36px) rotate(calc(var(--dir) * -6deg)); opacity: 0; }
  }
  .sweat .p { translate: -50% -50%; animation: sweat 900ms ease-in both; }
  @keyframes sweat { 0% { transform: translateY(-2px) scale(.6); opacity: 0; } 20% { transform: none; opacity: 1; } 100% { transform: translateY(8px); opacity: 0; } }
  .z {
    font: 700 1em/1 var(--font-num); color: var(--fx-zzz); -webkit-text-stroke: 1px #fff; paint-order: stroke;
    animation: zzz 1800ms ease-out infinite; animation-duration: 1800ms;
  }
  .zzz .z { animation: zzz 3000ms ease-out infinite; }
  @keyframes zzz {
    0% { transform: translate(0, 0) scale(.6); opacity: 0; } 15% { opacity: 1; } 70% { opacity: 1; }
    100% { transform: translate(calc(var(--dir) * 18px), -24px) scale(1.1); opacity: 0; }
  }
  .c { width: 6px; height: 10px; border-radius: 1.5px; translate: -50% -50%; animation: confetti 1600ms cubic-bezier(.2,.6,.4,1) both; }
  .c.round { width: 6px; height: 6px; border-radius: 50%; }
  @keyframes confetti {
    0% { transform: translate(0, 0) rotate(0) scale(.4); opacity: 1; }
    35% { transform: translate(calc(var(--dx) * .6), calc(var(--up) * -1)) rotate(calc(var(--rot) * .4)) scale(1); opacity: 1; }
    85% { opacity: 1; }
    100% { transform: translate(var(--dx), calc(200px - var(--up))) rotate(var(--rot)); opacity: 0; }
  }
  .puff {
    width: var(--s); height: var(--s); border-radius: 50%; background: rgba(255, 246, 224, .8);
    translate: calc((var(--i) * 2 - 1) * 6px - 50%) -50%; animation: puff 500ms ease-out both;
  }
  @keyframes puff { 0% { transform: scale(.4); opacity: .9; } 100% { transform: scale(1.2) translateY(-3px); opacity: 0; } }
  .glint .p { translate: -50% -50%; animation: twinkle 600ms ease-in-out both; }
  @keyframes twinkle { 0%, 100% { transform: scale(0); opacity: 0; } 50% { transform: scale(1); opacity: 1; } }
  .still { position: absolute; translate: -50% -100%; animation: if-fade-hold 1200ms linear both; }
</style>
