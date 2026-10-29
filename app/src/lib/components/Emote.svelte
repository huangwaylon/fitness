<script lang="ts">
  // Emote bubble (style guide v4 §M.3): a cream circle holding an official NH reaction icon.
  //   <Emote id="joy" />                 pops in, holds, fades (2.2 s); `hold` keeps it up
  //   <Emote id="sleepy" hold size={36} />
  //   <Emote kind="heart" />             legacy v3 vector emote (♪ ! z ✦ ♥), still supported
  // `tail` = which side the little tail points from ('left' | 'right' | 'none').
  //   <Emote id="mark-note" bare />      floating symbol, no cream disc (villagers, A1); `mark-*` are ours
  // Under reduced motion it fades in for 120 ms instead of popping.
  import EmoteArt from '#lib/villagers/EmoteArt.svelte';
  import OfficialArt from './OfficialArt.svelte';
  import Mark from './Mark.svelte';
  import { isMark, reactionArt, type EmoteIcon, type MarkId } from './art.ts';
  import type { EmoteKind } from '#lib/villagers/species.ts';

  interface Props {
    /** Official reaction icon (v4). */
    id?: EmoteIcon;
    /** Legacy vector emote (v3). */
    kind?: EmoteKind;
    /** Bubble width: px number or CSS length. Default 44px. */
    size?: number | string;
    /** Stay on screen after the pop instead of fading out. */
    hold?: boolean;
    animate?: boolean;
    tail?: 'left' | 'right' | 'none';
    /** Float the symbol on its own, without the cream disc (villagers). */
    bare?: boolean;
  }
  let { id, kind, size, hold = false, animate = true, tail = 'left', bare = false }: Props = $props();
  const w = $derived(size === undefined ? (id ? '44px' : '32px') : typeof size === 'number' ? `${size}px` : size);
  const legacy: Record<EmoteKind, EmoteIcon> = { note: 'joy', bang: 'surprise', zz: 'sleepy', sparkle: 'pleased', heart: 'love' };
  const icon = $derived(id ?? (kind ? legacy[kind] : undefined));
</script>

{#if id && (bare || isMark(id))}
  <span class="float {tail}" class:hold class:still={!animate} style:--w={w} aria-hidden="true">
    {#if isMark(id)}<Mark id={id.slice(5) as MarkId} />
    {:else}<OfficialArt key={reactionArt(id)} size="100%" eager />{/if}
  </span>
{:else if id || !kind}
  {#if icon}
    <span class="bubble {tail}" class:hold class:still={!animate} style:--w={w} aria-hidden="true">
      <span class="ico">
        <OfficialArt key={reactionArt(icon)} size="100%" eager>
          {#snippet fallback()}{#if kind}<svg viewBox="-4 -2 38 40"><EmoteArt {kind} x={17} y={16} hold animate={false} /></svg>{/if}{/snippet}
        </OfficialArt>
      </span>
    </span>
  {/if}
{:else}
  <svg class="emote" viewBox="-4 -2 38 40" style:width={w} aria-hidden="true"><EmoteArt {kind} x={17} y={16} {hold} {animate} /></svg>
{/if}

<style>
  .emote { display: block; flex: none; overflow: visible; aspect-ratio: 38 / 40; height: auto; }
  .bubble {
    position: relative; display: grid; place-items: center; flex: none;
    width: var(--w); height: var(--w); border-radius: 50%;
    background: var(--c-bubble, #FFFCEB); border: 2px solid var(--c-pill-edge, #EADBB8); box-shadow: 0 3px 0 rgba(74, 58, 44, .12);
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
    background: inherit; border: inherit; border-top: 0; border-left: 0; border-radius: 0 0 4px 0;
    transform: rotate(45deg) skew(8deg, 8deg); box-shadow: 2px 2px 0 rgba(74, 58, 44, .06);
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
