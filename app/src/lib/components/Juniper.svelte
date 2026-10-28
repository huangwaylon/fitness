<script lang="ts">
  // Juniper the capybara host (style guide v2 §7.5). <Juniper expression size head emote />.
  import JuniperArt from '#lib/villagers/JuniperArt.svelte';
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
  const vbH = $derived(head ? 86 : 124);
  const vb = $derived(head ? '7 -6 86 86' : '0 -6 100 124');
  const px = $derived(typeof size === 'number' ? size : null);
  const lw = $derived(px ? Math.max(2.6, (1.15 * vbH) / px) : 2.6);
  const h = $derived(typeof size === 'number' ? `${size}px` : size);
  const w = $derived(head ? h : typeof size === 'number' ? `${(size * 100) / 124}px` : `calc(${size} * 100 / 124)`);
</script>

<svg
  class="juniper" viewBox={vb} style:width={w} style:height={h}
  role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : 'true'}
><JuniperArt {expression} {head} {lw} {animate} {emote} {emoteHold} {replay} /></svg>

<style>
  .juniper { display: block; flex: none; overflow: visible; }
</style>
