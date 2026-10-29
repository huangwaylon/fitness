<script lang="ts">
  // Emote bubble (design.md §M.3): a cream circle holding an official NH reaction icon.
  //   <Emote id="joy" />                 pops in, holds, fades (2.2 s); `hold` keeps it up
  //   <Emote id="sleepy" hold size={36} />
  // `tail` = which side the little tail points from ('left' | 'right' | 'none').
  //   <Emote id="mark-note" bare />      floating symbol, no cream disc (villagers, A1); `mark-*` are ours
  // Under reduced motion it fades in for 120 ms instead of popping.
  import OfficialArt from './OfficialArt.svelte';
  import Mark from '../ui/Mark.svelte';
  import { isMark, reactionArt, type EmoteIcon, type MarkId } from '#lib/art.ts';

  interface Props {
    /** Official reaction icon (v4) or one of our marks. */
    id: EmoteIcon;
    /** Bubble width: px number or CSS length. Default 44px. */
    size?: number | string;
    /** Stay on screen after the pop instead of fading out. */
    hold?: boolean;
    animate?: boolean;
    tail?: 'left' | 'right' | 'none';
    /** Float the symbol on its own, without the cream disc (villagers). */
    bare?: boolean;
  }
  let { id, size = 44, hold = false, animate = true, tail = 'left', bare = false }: Props = $props();
  const w = $derived(typeof size === 'number' ? `${size}px` : size);
</script>

{#if bare || isMark(id)}
  <span class="float {tail}" class:hold class:still={!animate} style:--w={w} aria-hidden="true">
    {#if isMark(id)}<Mark id={id.slice(5) as MarkId} />
    {:else}<OfficialArt key={reactionArt(id)} size="100%" eager />{/if}
  </span>
{:else}
  <span class="bubble {tail}" class:hold class:still={!animate} style:--w={w} aria-hidden="true">
    <span class="ico"><OfficialArt key={reactionArt(id)} size="100%" eager /></span>
  </span>
{/if}

<style>
  .bubble {
    position: relative; display: grid; place-items: center; flex: none;
    width: var(--w); height: var(--w); border-radius: 50%;
    background: #FFF9E3; box-shadow: 0 3px 0 #E0C48A; /* v5: no stroke, one lip */
    transform-origin: 30% 110%;
    animation: if-bubble var(--dur-emote, 2200ms) var(--ease-bounce) both;
  }
  .bubble.right { transform-origin: 70% 110%; }
  .float {
    position: relative; display: grid; place-items: center; flex: none; width: var(--w); height: var(--w); line-height: 0;
    transform-origin: 50% 100%; animation: if-bubble var(--dur-emote, 2200ms) var(--ease-bounce) both;
  }
  .float :global(.official) { width: 100%; height: 100%; }
  .float.hold { animation: if-pop var(--dur-pop, 360ms) var(--ease-bounce) both; }
  .float.still { animation: none; }
  .bubble.hold { animation: if-pop var(--dur-pop, 360ms) var(--ease-bounce) both; }
  .bubble.still { animation: none; }
  /* the tail: a small rounded triangle under the bubble, toward the speaker */
  .bubble::after {
    content: ''; position: absolute; bottom: -7px; left: 26%; width: 11px; height: 11px;
    background: inherit; border-radius: 0 0 4px 0;
    transform: rotate(45deg) skew(8deg, 8deg); box-shadow: 2px 2px 0 #E0C48A;
  }
  .bubble.right::after { left: auto; right: 26%; }
  .bubble.none::after { display: none; }
  .ico { width: 77%; height: 77%; display: grid; place-items: center; line-height: 0; }
  .ico :global(.official) { height: 100%; width: 100%; }
  @media (prefers-reduced-motion: reduce) {
    .bubble, .float { animation: if-fade-hold 2200ms linear both; }
    .bubble.hold, .float.hold { animation: fade-in 120ms linear both; }
  }
  @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
</style>
