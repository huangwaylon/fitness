<script lang="ts">
  // Standalone emote bubble (style guide v2 §4.7): ♪ note · ! bang · z z · ✦ sparkle · ♥ heart.
  // Expression names are accepted too (cheer → note, surprised → bang, sleepy → zz, proud → sparkle).
  import EmoteArt from '#lib/villagers/EmoteArt.svelte';
  import { EXPRESSION_EMOTE, type EmoteKind, type Expression } from '#lib/villagers/species.ts';

  interface Props {
    kind: EmoteKind | Expression;
    size?: number;
    /** Keep it on screen after the pop instead of fading out. */
    hold?: boolean;
    animate?: boolean;
    label?: string;
  }
  let { kind, size = 32, hold = false, animate = true, label }: Props = $props();
  const k = $derived<EmoteKind>(
    (kind in EXPRESSION_EMOTE ? EXPRESSION_EMOTE[kind as Expression] : (kind as EmoteKind)) ?? 'note'
  );
</script>

<svg
  class="emote" viewBox="-4 -2 38 40" width={size} height={size * 40 / 38}
  role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : 'true'}
><EmoteArt kind={k} x={17} y={16} {hold} {animate} /></svg>

<style>
  .emote { display: block; flex: none; overflow: visible; }
</style>
