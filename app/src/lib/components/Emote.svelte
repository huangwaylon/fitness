<script lang="ts">
  // Standalone emote bubble (style guide §4.7): ♪ note · ! bang · z z · ✦ sparkle · ♥ heart.
  import EmoteArt from '#lib/villagers/EmoteArt.svelte';
  import type { EmoteKind } from '#lib/villagers/species.ts';

  interface Props {
    kind: EmoteKind;
    /** Width: px number or CSS length (height follows). */
    size?: number | string;
    /** Keep it on screen after the pop instead of fading out. */
    hold?: boolean;
    animate?: boolean;
  }
  let { kind, size = 32, hold = false, animate = true }: Props = $props();
</script>

<svg
  class="emote" viewBox="-4 -2 38 40" style:width={typeof size === 'number' ? `${size}px` : size}
  aria-hidden="true"
><EmoteArt {kind} x={17} y={16} {hold} {animate} /></svg>

<style>
  .emote { display: block; flex: none; overflow: visible; aspect-ratio: 38 / 40; height: auto; }
</style>
