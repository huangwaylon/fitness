<svelte:options namespace="svg" />

<script lang="ts">
  // Emote pop bubble (style guide v2 §4.7) as an SVG <g>: a round cream bubble (r 15) with a
  // short tail pointing down-left at the speaker, holding one brand-coloured symbol.
  import type { EmoteKind } from './species.ts';

  interface Props {
    kind: EmoteKind;
    /** Bubble centre in the parent's units. */
    x?: number;
    y?: number;
    r?: number;
    animate?: boolean;
    /** Stay on screen after popping (otherwise rise and fade over --dur-emote). */
    hold?: boolean;
  }
  let { kind, x = 15, y = 15, r = 15, animate = true, hold = false }: Props = $props();
  const LINE = '#4A3A2C';
  const k = $derived(r / 15);
</script>

<g transform="translate({x} {y}) scale({k})">
  <g class="emote" class:anim={animate} class:hold>
    <path
      d="M-4 12.6 L-9 21 L3 14 Z"
      fill="#FFFBEA" stroke={LINE} stroke-width="1.8" stroke-linejoin="round"
    />
    <circle r="15" fill="#FFFBEA" stroke={LINE} stroke-width="1.8" />
    <path d="M-5.2 13.4 L2.6 13.4" stroke="#FFFBEA" stroke-width="3.4" />
    {#if kind === 'note'}
      <g fill="#2E6B38">
        <ellipse cx="-4.2" cy="5.6" rx="4.4" ry="3.4" transform="rotate(-20 -4.2 5.6)" />
        <path d="M-1 5 V-9 Q5 -8 7.4 -3.4 Q4 -5.4 1.6 -5.2 V5 Z" />
      </g>
    {:else if kind === 'bang'}
      <g fill="#4D7CF2">
        <path d="M-3.4 -9.4 Q0 -11.8 3.4 -9.4 L1.8 3 Q0 4.4 -1.8 3 Z" />
        <circle cy="8.4" r="2.8" />
      </g>
    {:else if kind === 'zz'}
      <g fill="none" stroke="#2F6F96" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
        <path d="M-8.6 -1.6 H-1.6 L-8.6 6.4 H-1.6" />
        <path d="M2 -8.6 H7.6 L2 -2.2 H7.6" />
      </g>
    {:else if kind === 'sparkle'}
      <path d="M0 -10.5 Q1.6 -1.6 10.5 0 Q1.6 1.6 0 10.5 Q-1.6 1.6 -10.5 0 Q-1.6 -1.6 0 -10.5 Z" fill="#F5A623" />
      <circle cx="7.4" cy="-7.4" r="1.6" fill="#F5A623" />
    {:else}
      <path d="M0 9 C-11 2.4 -10.6 -6.4 -5.6 -7.6 C-2.8 -8.2 -1 -6.4 0 -4.4 C1 -6.4 2.8 -8.2 5.6 -7.6 C10.6 -6.4 11 2.4 0 9 Z" fill="#F28BA8" />
      <circle cx="-4.4" cy="-3.6" r="1.6" fill="#fff" opacity=".8" />
    {/if}
  </g>
</g>

<style>
  .emote { transform-box: fill-box; transform-origin: 30% 100%; }
  .emote.anim { animation: if-emote var(--dur-emote, 2.2s) var(--ease-soft, ease) both; }
  .emote.anim.hold { animation: if-pop var(--dur-pop, 360ms) var(--ease-bounce, ease) both; }
  @media (prefers-reduced-motion: reduce) {
    .emote.anim { animation: rm-emote var(--dur-emote, 1.6s) linear both; }
    .emote.anim.hold { animation: none; }
  }
  @keyframes rm-emote { 0%, 90% { opacity: 1; } 100% { opacity: 0; } }
</style>
