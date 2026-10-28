<script lang="ts">
  // Official NH art with our fan-art as the fallback (missing key, or the image fails to load).
  //   <OfficialArt key={villagerArt('raymond')} alt="ジャック" size={120}>
  //     {#snippet fallback()}<Villager villager="raymond" size={120} />{/snippet}
  //   </OfficialArt>
  // `size` = rendered height (number → px, or any CSS length); width follows the art's aspect ratio.
  // Use `width` instead for width-driven layouts. Decorative art: pass alt="".
  import type { Snippet } from 'svelte';
  import { art, artUrl } from '#lib/client/assets.ts';

  interface Props {
    key: string | null | undefined;
    alt?: string;
    size?: number | string;
    width?: number | string;
    /** Eager-load above-the-fold art (default lazy). */
    eager?: boolean;
    class?: string;
    fallback?: Snippet;
  }
  let { key, alt = '', size, width, eager = false, class: cls = '', fallback }: Props = $props();

  const entry = $derived(art(key));
  const src = $derived(artUrl(key));
  let failed = $state<string | null>(null);
  const css = (v: number | string | undefined) => (typeof v === 'number' ? `${v}px` : v);
</script>

{#if src && entry && failed !== src}
  <img
    class="official {cls}"
    {src}
    {alt}
    width={entry.w}
    height={entry.h}
    style:height={width === undefined ? css(size) : 'auto'}
    style:width={width === undefined ? 'auto' : css(width)}
    style:aspect-ratio="{entry.w} / {entry.h}"
    loading={eager ? 'eager' : 'lazy'}
    decoding="async"
    draggable="false"
    onerror={() => (failed = src)}
  />
{:else if fallback}
  {@render fallback()}
{/if}

<style>
  .official {
    display: block;
    max-width: 100%;
    object-fit: contain;
    user-select: none;
    -webkit-user-drag: none;
    pointer-events: none;
  }
</style>
