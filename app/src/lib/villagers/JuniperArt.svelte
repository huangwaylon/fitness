<svelte:options namespace="svg" />

<script lang="ts">
  // Juniper the capybara host (style guide v2 §7.5) as an SVG <g> in the 100×120 frame:
  // a calm blocky loaf, dot eyes, a big muzzle, a yuzu on her head that follows 80 ms late,
  // and the green host neckerchief.
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

  const LINE = '#4A3A2C';
  const EYE = '#3A2C20';
  const COAT = '#C1915F';
  const SHADE = '#A97B50';
  const EAR = '#9C6F48';
  const fs = $derived(Math.min(1.6, lw / 2.6));
  const emoteKind = $derived<EmoteKind | null>(
    emote === true ? EXPRESSION_EMOTE[expression] : emote === false ? null : emote
  );
  const arm = $derived(
    expression === 'cheer' ? 'M29 80 L17 68'
    : expression === 'surprised' ? 'M29 80 L19 89'
    : expression === 'proud' ? 'M29 80 L21 88 L28 95'
    : 'M29 80 L25 93'
  );
  const hop = $derived(expression === 'cheer' ? 'hop' : expression === 'surprised' ? 'hop small' : '');
  const torso = 'M34 70 H66 Q71 70 71.8 75 L76 98 Q77 106 68.6 106 H31.4 Q23 106 24 98 L28.2 75 Q29 70 34 70 Z';
</script>

{#snippet eye(cx: number)}
  {#if expression === 'cheer'}
    <path d="M{cx - 4} 45.5 Q{cx} 40 {cx + 4} 45.5" fill="none" stroke={EYE} stroke-width={2.8 * fs} stroke-linecap="round" />
  {:else if expression === 'sleepy'}
    <path d="M{cx - 4} 43.5 Q{cx} 47.5 {cx + 4} 43.5" fill="none" stroke={EYE} stroke-width={2.8 * fs} stroke-linecap="round" />
  {:else if expression === 'surprised'}
    <circle cx={cx} cy="44" r="4.4" fill={EYE} /><circle cx={cx + 1.4} cy="42.4" r="1.5" fill="#fff" />
  {:else if expression === 'proud'}
    <path d="M{cx - 3.4} 43.4 A3.4 3.6 0 0 0 {cx + 3.4} 43.4 Z" fill={EYE} />
    <path d="M{cx - 4.6} 42.8 L{cx + 4.4} 43.2" stroke={LINE} stroke-width={2.2 * fs} stroke-linecap="round" />
  {:else}
    <circle cx={cx} cy="44" r="3.1" fill={EYE} /><circle cx={cx + 1} cy="42.9" r=".9" fill="#fff" opacity=".85" />
  {/if}
{/snippet}

{#snippet yuzu()}
  <g class="yuzu-wrap" class:anim={animate} class:tilt={expression === 'sleepy'}>
    <g class="yuzu {animate && expression === 'cheer' ? 'yhop' : ''}">
      <path d="M50 4.5 Q54 -3.5 63.5 -1.5 Q59.5 6 50 4.5 Z" fill="#7BC67E" stroke={LINE} stroke-width={1.8 * fs} stroke-linejoin="round" />
      <path d="M51.5 3.6 Q56 0.6 60.5 0" fill="none" stroke="#4E9A55" stroke-width="1" stroke-linecap="round" />
      <circle cx="50" cy="15" r="11" fill="#FFD66B" stroke={LINE} stroke-width={lw} />
      <path d="M41.5 18 Q44 24.5 51 25 Q58 24.6 60.4 18.6 Q56 23 50.5 22.8 Q45 22.6 41.5 18 Z" fill="#E8B93E" opacity=".55" />
      <g fill="#E8B93E"><circle cx="54.5" cy="12" r=".9" /><circle cx="57" cy="16.5" r=".9" /><circle cx="52" cy="19.4" r=".9" /></g>
      <ellipse cx="45.5" cy="11" rx="3" ry="2.2" transform="rotate(-30 45.5 11)" fill="#fff" opacity=".85" />
      <circle cx="50" cy="4.6" r="1.3" fill="#8A5A3B" />
    </g>
  </g>
{/snippet}

{#snippet body()}
  <path d="M40 104 V110.5 M60 104 V110.5" stroke={LINE} stroke-width={12 + lw * 2} stroke-linecap="round" />
  <path d="M40 104 V110.5 M60 104 V110.5" stroke={SHADE} stroke-width="12" stroke-linecap="round" />
  <g transform={expression === 'proud' ? 'translate(50 0) scale(1.04 1) translate(-50 0)' : undefined}>
    <path d={torso} fill={COAT} stroke={LINE} stroke-width={lw} stroke-linejoin="round" />
    <ellipse cx="50" cy="94" rx="15" ry="10" fill="#D6AB7C" />
  </g>
  {#each [0, 1] as m (m)}
    <g transform={m ? 'matrix(-1 0 0 1 100 0)' : undefined}>
      <path d={arm} fill="none" stroke={LINE} stroke-width={10.5 + lw * 2} stroke-linecap="round" stroke-linejoin="round" />
      <path d={arm} fill="none" stroke={COAT} stroke-width="10.5" stroke-linecap="round" stroke-linejoin="round" />
    </g>
  {/each}
  <!-- host neckerchief -->
  <path d="M32 74 Q50 80 68 74 L52.5 93 Q50 95.6 47.5 93 Z" fill="#7BC67E" stroke={LINE} stroke-width={lw * 0.8} stroke-linejoin="round" />
  <path d="M40 78.5 L50 90" stroke="#5FA862" stroke-width="1.6" stroke-linecap="round" />
  <circle cx="50" cy="77.5" r="4.2" fill="#5FA862" stroke={LINE} stroke-width={lw * 0.8} />
{/snippet}

{#snippet headArt()}
  <g transform={expression === 'sleepy' ? 'rotate(5 50 76)' : undefined}>
    <circle cx="24" cy="26" r="6.5" fill={EAR} stroke={LINE} stroke-width={lw} />
    <circle cx="76" cy="26" r="6.5" fill={EAR} stroke={LINE} stroke-width={lw} />
    <circle cx="24.6" cy="26.6" r="3" fill="#7E5838" />
    <circle cx="75.4" cy="26.6" r="3" fill="#7E5838" />
    <rect x="14" y="22" width="72" height="56" rx="26" fill={COAT} stroke={LINE} stroke-width={lw} />
    <!-- soft forehead highlight -->
    <ellipse cx="42" cy="31" rx="12" ry="5" fill="#fff" opacity=".14" />
    <rect x="29" y="50" width="42" height="27" rx="13.5" fill={SHADE} />
    <ellipse cx="44.6" cy="57.5" rx="1.8" ry="1.3" fill={LINE} opacity=".8" />
    <ellipse cx="55.4" cy="57.5" rx="1.8" ry="1.3" fill={LINE} opacity=".8" />
    {#if expression === 'cheer'}
      <path d="M45 64 H55 Q55 71 50 71 Q45 71 45 64 Z" fill="#8A3B2E" stroke={LINE} stroke-width={1.3 * fs} stroke-linejoin="round" />
      <path d="M47 69 Q50 67 53 69 Q50 70.6 47 69 Z" fill="#FF8A7A" />
    {:else if expression === 'surprised'}
      <ellipse cx="50" cy="66" rx="2.4" ry="2.9" fill="#8A3B2E" />
    {:else if expression === 'sleepy'}
      <path d="M47 65.5 H53" stroke={LINE} stroke-width={2 * fs} stroke-linecap="round" />
    {:else}
      <path d="M46 64.5 Q48 66.8 50 64.5 Q52 66.8 54 64.5" fill="none" stroke={LINE} stroke-width={1.9 * fs} stroke-linecap="round" stroke-linejoin="round" />
    {/if}
    <ellipse cx="24" cy="55" rx="5.5" ry="3.4" fill="#FF9E8F" opacity=".55" />
    <ellipse cx="76" cy="55" rx="5.5" ry="3.4" fill="#FF9E8F" opacity=".55" />
    {@render eye(37)}
    {@render eye(63)}
    {#if expression === 'surprised'}
      <path d="M33 35 Q37 32.5 41 35 M59 35 Q63 32.5 67 35" fill="none" stroke={LINE} stroke-width={2 * fs} stroke-linecap="round" />
    {/if}
  </g>
{/snippet}

<g class="juniper-art" class:anim={animate}>
  {#key `${expression}-${replay}`}
    <g class="hopper {animate ? hop : ''}">
      <g class="bob" class:slow={expression === 'sleepy'}>
        {#if !headOnly}{@render body()}{/if}
        {@render headArt()}
      </g>
      {@render yuzu()}
    </g>
    {#if emoteKind}
      <EmoteArt kind={emoteKind} x={86} y={-4} {animate} hold={emoteHold} />
    {/if}
  {/key}
</g>

<style>
  .hopper, .bob, .yuzu, .yuzu-wrap { transform-box: fill-box; transform-origin: 50% 100%; }
  .anim .bob { animation: if-bob var(--dur-idle, 2.4s) var(--ease-idle, ease-in-out) infinite; }
  .anim .bob.slow { animation-duration: 4s; }
  /* follow-through: the yuzu repeats the bob 80 ms late with a little rock */
  .yuzu-wrap.anim { animation: yuzu-follow var(--dur-idle, 2.4s) var(--ease-idle, ease-in-out) 80ms infinite; }
  .yuzu-wrap.tilt { transform: rotate(10deg); animation-duration: 4s; }
  .yuzu.yhop { animation: yuzu-hop 760ms var(--ease-bounce, ease) 1 both; }
  .hopper.hop { animation: if-hop 600ms 1 both; }
  .hopper.hop.small { animation: hop-small 420ms 1 both; }
  @keyframes yuzu-follow {
    0%, 100% { transform: translateY(0) rotate(0); }
    50% { transform: translateY(1.6px) rotate(-4deg); }
  }
  @keyframes yuzu-hop {
    0% { transform: translateY(0); }
    35% { transform: translateY(-6px) rotate(8deg); }
    70% { transform: translateY(0) scale(1.12, .86); }
    100% { transform: none; }
  }
  @keyframes hop-small {
    0% { transform: translateY(0) scale(1, 1); }
    30% { transform: translateY(-6%) scale(.95, 1.05); }
    70% { transform: translateY(0) scale(1.05, .95); }
    100% { transform: none; }
  }
  @media (prefers-reduced-motion: reduce) {
    .anim .bob, .yuzu-wrap.anim, .yuzu.yhop, .hopper.hop, .hopper.hop.small { animation: none; }
  }
</style>
