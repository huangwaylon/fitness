<script lang="ts">
  // The one lightweight fan-art villager: a chibi silhouette tinted with the villager's colour.
  // Only shows when an official render is missing / fails to load (see Villager.svelte).
  import type { Look } from './roster.ts';

  interface Props {
    look: Look;
    /** Head-only (avatar) framing. */
    head?: boolean;
    /** Rendered height (CSS length). */
    height: string;
  }
  let { look, head = false, height }: Props = $props();
  const INK = '#4A3A2C';
  const c = $derived(look.colour);
</script>

<svg
  class="vfb"
  viewBox={head ? '8 -6 84 84' : '0 -6 100 128'}
  style:height
  style:width={head ? height : `calc(${height} * 100 / 128)`}
  aria-hidden="true"
>
  <g stroke={INK} stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round">
    {#if !head}
      <ellipse cx="50" cy="118" rx="22" ry="4" fill="rgba(46,60,40,.22)" stroke="none" />
      <rect x="37" y="100" width="10" height="16" rx="5" fill={c} />
      <rect x="53" y="100" width="10" height="16" rx="5" fill={c} />
      <path d="M34 68 H66 Q74 86 72 100 Q72 106 66 106 H34 Q28 106 28 100 Q26 86 34 68 Z" fill="#FFFBEA" />
    {/if}
    {#if look.ears === 'point'}
      <path d="M18 28 L20 2 L40 14 Z M82 28 L80 2 L60 14 Z" fill={c} />
    {:else if look.ears === 'long'}
      <rect x="30" y="-6" width="13" height="34" rx="6.5" fill={c} />
      <rect x="57" y="-6" width="13" height="34" rx="6.5" fill={c} />
    {:else if look.ears === 'round'}
      <circle cx="22" cy="14" r="10" fill={c} /><circle cx="78" cy="14" r="10" fill={c} />
    {:else if look.ears === 'flop'}
      <path d="M22 20 Q8 30 12 56 Q22 54 26 34 Z M78 20 Q92 30 88 56 Q78 54 74 34 Z" fill={c} />
    {/if}
    <ellipse cx="50" cy="40" rx="36" ry="32" fill={c} />
  </g>
  <ellipse cx="36" cy="44" rx="3.6" ry="4.6" fill={INK} />
  <ellipse cx="64" cy="44" rx="3.6" ry="4.6" fill={INK} />
  <circle cx="37.2" cy="42.4" r="1.3" fill="#fff" />
  <circle cx="65.2" cy="42.4" r="1.3" fill="#fff" />
  <ellipse cx="27" cy="54" rx="6.5" ry="4" fill="#FF9E8F" opacity=".7" />
  <ellipse cx="73" cy="54" rx="6.5" ry="4" fill="#FF9E8F" opacity=".7" />
  <path d="M45 58 Q50 63 55 58" fill="none" stroke={INK} stroke-width="2.4" stroke-linecap="round" />
</svg>

<style>
  .vfb { display: block; flex: none; overflow: visible; }
</style>
