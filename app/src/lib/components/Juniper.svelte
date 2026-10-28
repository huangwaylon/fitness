<script lang="ts">
  // The host: renders Isabelle (fan-art rendition; the component keeps its v2 name). <Juniper expression size head emote />.
  import IsabelleArt from '#lib/villagers/IsabelleArt.svelte';
  import type { EmoteKind, Expression } from '#lib/villagers/species.ts';

  interface Props {
    expression?: Expression;
    /** Height in px (or a CSS length). */
    size?: number | string;
    /** Head (and yuzu) only. */
    head?: boolean;
    emote?: boolean | EmoteKind;
    emoteHold?: boolean;
    animate?: boolean;
    replay?: number;
    label?: string;
  }
  let { expression = 'happy', size = 72, head = false, emote = false, emoteHold = false, animate = true, replay = 0, label }: Props = $props();
  const vbH = $derived(head ? 88 : 128);
  const vb = $derived(head ? '6 -9 88 88' : '0 -10 100 128');
  const px = $derived(typeof size === 'number' ? size : null);
  const lw = $derived(px ? Math.max(2.6, (1.15 * vbH) / px) : 2.6);
  const h = $derived(typeof size === 'number' ? `${size}px` : size);
  const w = $derived(head ? h : typeof size === 'number' ? `${(size * 100) / 128}px` : `calc(${size} * 100 / 128)`);
</script>

<svg
  class="juniper" viewBox={vb} style:width={w} style:height={h}
  role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : 'true'}
><IsabelleArt {expression} {head} {lw} {animate} {emote} {emoteHold} {replay} /></svg>

<style>
  .juniper { display: block; flex: none; overflow: visible; }
</style>
