<svelte:options namespace="svg" />

<script lang="ts">
  // Isabelle, the host (fan-art rendition), as an SVG <g> in the 100×120 villager frame:
  // golden shih-tzu with a tied topknot (follows her bob 80 ms late), parted fringe,
  // long floppy ears, cream muzzle and the coral leaf-print resident-services shirt.
  import type { EmoteKind, Expression } from './species.ts';
  import { EXPRESSION_EMOTE } from './species.ts';
  import EmoteArt from './EmoteArt.svelte';

  interface Props {
    expression?: Expression;
    head?: boolean;
    lw?: number;
    animate?: boolean;
    emote?: boolean | EmoteKind;
    emoteHold?: boolean;
    replay?: number;
  }
  let { expression = 'happy', head: headOnly = false, lw = 2.6, animate = true, emote = false, emoteHold = false, replay = 0 }: Props = $props();

  const uid = $props.id();
  const LINE = '#4A3A2C';
  const EYE = '#2A1C14';
  const FUR = '#F8C845';
  const FUR2 = '#EBA92E';
  const MUZZLE = '#FFF4D6';
  const SHIRT = '#F27B6B';
  const fs = $derived(Math.min(1.6, lw / 2.6));
  const emoteKind = $derived<EmoteKind | null>(
    emote === true ? EXPRESSION_EMOTE[expression] : emote === false ? null : emote
  );
  const arm = $derived(
    expression === 'cheer' ? 'M31 76 L18.5 65.5'
    : expression === 'surprised' ? 'M31 76 L21 86'
    : expression === 'proud' ? 'M31 76 L22 84 L29.5 92'
    : expression === 'sleepy' ? 'M31 76 L28.5 90'
    : 'M31 76 L26.7 89.3'
  );
  const hand = $derived(
    (arm.match(/(-?[\d.]+) (-?[\d.]+)$/) ?? ['', '26.7', '89.3']).slice(1, 3).map(Number) as [number, number]
  );
  const hop = $derived(expression === 'cheer' ? 'hop' : expression === 'surprised' ? 'hop small' : '');
  const torso = 'M38 70 H62 Q67 70 67.6 75 L71.6 98 Q72.6 106 64.5 106 H35.5 Q27.4 106 28.4 98 L32.4 75 Q33 70 38 70 Z';
  const legs = 'M42.5 104 V110.5 M57.5 104 V110.5';
  const ear = 'M26 25 Q12 24 10 42 Q8 60 11 71 Q15 80 21 76 Q24.6 72 23.6 60 Q23.6 45 29.6 33 Z';
</script>

{#snippet eye(cx: number)}
  {#if expression === 'cheer'}
    <path d="M{cx - 4} 47 Q{cx} 41.5 {cx + 4} 47" fill="none" stroke={EYE} stroke-width={2.8 * fs} stroke-linecap="round" />
  {:else if expression === 'sleepy'}
    <path d="M{cx - 4} 45 Q{cx} 49 {cx + 4} 45" fill="none" stroke={EYE} stroke-width={2.8 * fs} stroke-linecap="round" />
  {:else if expression === 'surprised'}
    <ellipse cx={cx} cy="45.5" rx="3.8" ry="4.6" fill={EYE} /><circle cx={cx + 1.2} cy="44" r="1.4" fill="#fff" />
  {:else if expression === 'proud'}
    <path d="M{cx - 3.2} 45 A3.2 3.8 0 0 0 {cx + 3.2} 45 Z" fill={EYE} />
    <path d="M{cx - 4.4} 44.4 L{cx + 4.2} 44.8" stroke={LINE} stroke-width={2.2 * fs} stroke-linecap="round" />
  {:else}
    <ellipse cx={cx} cy="45.5" rx="3" ry="3.9" fill={EYE} /><circle cx={cx + 1} cy="44.2" r="1.1" fill="#fff" />
  {/if}
{/snippet}

{#snippet topknot()}
  <g class="knot-wrap" class:anim={animate} class:tilt={expression === 'sleepy'}>
    <g class="knot {animate && expression === 'cheer' ? 'khop' : ''}">
      <ellipse cx="60" cy="3.5" rx="6.4" ry="5.6" fill={FUR} stroke={LINE} stroke-width={lw} />
      <ellipse cx="49" cy="5" rx="11.5" ry="9.5" fill={FUR} stroke={LINE} stroke-width={lw} />
      <path d="M42 3 Q46 -2 52 -1.6" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" opacity=".55" />
      <path d="M44 9 Q49 12 55 9" fill="none" stroke={FUR2} stroke-width="1.4" stroke-linecap="round" />
      <rect x="42.6" y="12.2" width="13.4" height="5" rx="2.5" fill="#E8414E" stroke={LINE} stroke-width={lw * 0.7} />
    </g>
  </g>
{/snippet}

{#snippet headArt()}
  <g transform={expression === 'sleepy' ? 'rotate(5 50 76)' : undefined}>
    <!-- head + fringe silhouette -->
    <ellipse cx="50" cy="46" rx="35" ry="30" fill={FUR} stroke={LINE} stroke-width={lw} />
    <clipPath id="{uid}-h"><ellipse cx="50" cy="46" rx={35 - lw / 2} ry={30 - lw / 2} /></clipPath>
    <g clip-path="url(#{uid}-h)">
      <!-- parted fringe: two soft lobes with a darker underside -->
      <path d="M14 44 Q16 24 34 18 Q46 16 50 24 Q46 30 40 34 Q30 38 20 40 Z" fill={FUR2} opacity=".55" />
      <path d="M86 44 Q84 24 66 18 Q54 16 50 24 Q54 30 60 34 Q70 38 80 40 Z" fill={FUR2} opacity=".55" />
      <path d="M14 40 Q16 20 34 15 Q46 13 50 22 Q46 28 40 31 Q30 35 18 37 Z" fill={FUR} />
      <path d="M86 40 Q84 20 66 15 Q54 13 50 22 Q54 28 60 31 Q70 35 82 37 Z" fill={FUR} />
      <path d="M50 22 Q47 28 40 31 M50 22 Q53 28 60 31" fill="none" stroke={LINE} stroke-width={1.3 * fs} stroke-linecap="round" opacity=".45" />
      <path d="M24 26 Q30 21 38 20" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".4" />
    </g>
    <!-- muzzle -->
    <path d="M36 56 Q36 47 44 49 Q50 46 56 49 Q64 47 64 56 Q64 67 50 68 Q36 67 36 56 Z" fill={MUZZLE} />
    <ellipse cx="25" cy="56" rx="5.6" ry="3.6" fill="#FF9466" opacity=".6" />
    <ellipse cx="75" cy="56" rx="5.6" ry="3.6" fill="#FF9466" opacity=".6" />
    {@render eye(37)}
    {@render eye(63)}
    <!-- expressive brows -->
    {#if expression === 'surprised'}
      <path d="M32.5 36.4 Q37 33.8 41.5 36 M58.5 36 Q63 33.8 67.5 36.4" fill="none" stroke={LINE} stroke-width={1.9 * fs} stroke-linecap="round" />
    {:else if expression !== 'sleepy'}
      <path d="M33 38.6 Q37 37 41 38.4 M59 38.4 Q63 37 67 38.6" fill="none" stroke={LINE} stroke-width={1.7 * fs} stroke-linecap="round" opacity=".75" />
    {/if}
    <ellipse cx="50" cy="52.6" rx="4" ry="2.9" fill={EYE} />
    <ellipse cx="48.8" cy="51.8" rx="1.3" ry=".7" fill="#fff" opacity=".7" />
    <path d="M50 55.4 V57.6" stroke={LINE} stroke-width={1.4 * fs} stroke-linecap="round" />
    {#if expression === 'cheer'}
      <path d="M44.8 58.4 H55.2 Q55.2 65.4 50 65.4 Q44.8 65.4 44.8 58.4 Z" fill="#8A3B2E" stroke={LINE} stroke-width={1.3 * fs} stroke-linejoin="round" />
      <path d="M46.8 63.4 Q50 61 53.2 63.4 Q50 65 46.8 63.4 Z" fill="#FF8A7A" />
    {:else if expression === 'surprised'}
      <ellipse cx="50" cy="60.6" rx="2.4" ry="2.9" fill="#8A3B2E" />
    {:else if expression === 'sleepy'}
      <path d="M47 60 H53" stroke={LINE} stroke-width={2 * fs} stroke-linecap="round" />
    {:else}
      <path d="M44.6 58.2 Q47.3 61.2 50 57.8 Q52.7 61.2 55.4 58.2" fill="none" stroke={LINE} stroke-width={1.9 * fs} stroke-linecap="round" stroke-linejoin="round" />
    {/if}
    <!-- long floppy ears over the head rim -->
    {#each [0, 1] as m (m)}
      <g transform={m ? 'matrix(-1 0 0 1 100 0)' : undefined}>
        <path d={ear} fill={FUR} stroke={LINE} stroke-width={lw} stroke-linejoin="round" />
        <path d="M23 40 Q17 54 18 70" fill="none" stroke={FUR2} stroke-width="2" stroke-linecap="round" opacity=".8" />
      </g>
    {/each}
  </g>
{/snippet}

{#snippet body()}
  <path d="M66 100 Q80 102 80 92 Q80 84 74 86 Q70 88 74 92" fill="none" stroke={LINE} stroke-width={7 + lw * 2} stroke-linecap="round" />
  <path d="M66 100 Q80 102 80 92 Q80 84 74 86 Q70 88 74 92" fill="none" stroke={FUR} stroke-width="7" stroke-linecap="round" />
  <path d={legs} stroke={LINE} stroke-width={11 + lw * 2} stroke-linecap="round" />
  <path d={legs} stroke={FUR} stroke-width="11" stroke-linecap="round" />
  <g transform={expression === 'proud' ? 'translate(50 0) scale(1.04 1) translate(-50 0)' : undefined}>
    <path d={torso} fill={SHIRT} stroke={LINE} stroke-width={lw} stroke-linejoin="round" />
    <clipPath id="{uid}-t"><path d={torso} /></clipPath>
    <g clip-path="url(#{uid}-t)" fill="#FFE3D6" opacity=".9">
      {#each [[37, 82, -30], [58, 80, 20], [46, 94, -10], [66, 96, 30], [34, 102, 10], [56, 104, -20]] as [x, y, r], i (i)}
        <path d="M{x} {y} q3.4 -5 7.6 -2.2 q-3.4 5 -7.6 2.2 z" transform="rotate({r} {x} {y})" />
      {/each}
    </g>
    <!-- collar + leaf badge -->
    <path d="M40 70.4 Q42 77.4 49 74.2 L50 71 Z M60 70.4 Q58 77.4 51 74.2 L50 71 Z" fill="#FFB2A6" stroke={LINE} stroke-width="1" stroke-linejoin="round" />
    <path d="M57 84 q3 -4 7 -2 q-3 4.6 -7 2 z" fill="#7BC67E" stroke={LINE} stroke-width=".9" />
  </g>
  {#each [0, 1] as m (m)}
    <g transform={m ? 'matrix(-1 0 0 1 100 0)' : undefined}>
      <path d={arm} fill="none" stroke={LINE} stroke-width={10 + lw * 2} stroke-linecap="round" stroke-linejoin="round" />
      <path d={arm} fill="none" stroke={SHIRT} stroke-width="10" stroke-linecap="round" stroke-linejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r="4.6" fill={FUR} />
    </g>
  {/each}
{/snippet}

<g class="isabelle-art" class:anim={animate}>
  {#key `${expression}-${replay}`}
    <g class="hopper {animate ? hop : ''}">
      {@render topknot()}
      <g class="bob" class:slow={expression === 'sleepy'}>
        {#if !headOnly}{@render body()}{/if}
        {@render headArt()}
      </g>
    </g>
    {#if emoteKind}
      <EmoteArt kind={emoteKind} x={86} y={-6} {animate} hold={emoteHold} />
    {/if}
  {/key}
</g>

<style>
  .hopper, .bob, .knot, .knot-wrap { transform-box: fill-box; transform-origin: 50% 100%; }
  .anim .bob { animation: if-bob var(--dur-idle, 2.4s) var(--ease-idle, ease-in-out) infinite; }
  .anim .bob.slow { animation-duration: 4s; }
  /* follow-through: the topknot repeats the bob 80 ms late with a little rock */
  .knot-wrap.anim { animation: knot-follow var(--dur-idle, 2.4s) var(--ease-idle, ease-in-out) 80ms infinite; }
  .knot-wrap.tilt { transform: rotate(10deg); animation-duration: 4s; }
  .knot.khop { animation: knot-hop 760ms var(--ease-bounce, ease) 1 both; }
  .hopper.hop { animation: if-hop 600ms 1 both; }
  .hopper.hop.small { animation: hop-small 420ms 1 both; }
  @keyframes knot-follow {
    0%, 100% { transform: translateY(0) rotate(0); }
    50% { transform: translateY(1.6px) rotate(-4deg); }
  }
  @keyframes knot-hop {
    0% { transform: translateY(0); }
    35% { transform: translateY(-5px) rotate(8deg); }
    70% { transform: translateY(0) scale(1.1, .9); }
    100% { transform: none; }
  }
  @keyframes hop-small {
    0% { transform: translateY(0) scale(1, 1); }
    30% { transform: translateY(-6%) scale(.95, 1.05); }
    70% { transform: translateY(0) scale(1.05, .95); }
    100% { transform: none; }
  }
  @media (prefers-reduced-motion: reduce) {
    .anim .bob, .knot-wrap.anim, .knot.khop, .hopper.hop, .hopper.hop.small { animation: none; }
  }
</style>
