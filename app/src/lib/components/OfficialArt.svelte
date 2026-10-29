<script lang="ts">
  // Official NH art with our fan-art as the fallback (missing key, or the image fails to load).
  //   <OfficialArt key={villagerArt('raymond')} alt="ジャック" size={120}>
  //     {#snippet fallback()}<Villager villager="raymond" size={120} />{/snippet}
  //   </OfficialArt>
  // `size` = rendered height (number → px, or any CSS length); width follows the art's aspect ratio.
  // Use `width` instead for width-driven layouts. Decorative art: pass alt="".
  // Renders with a padded canvas (assets.ts BOX) are cropped to the figure, so sizes are comparable.
  // The box is reserved from the manifest aspect ratio: no layout shift while loading.
  import type { Snippet } from 'svelte';
  import { art, artUrl } from '#lib/art.ts';

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
  {#if entry.box}
    {@const [bx, by, bw, bh] = entry.box}
    <!-- Padded render: a box the size of the figure, the image shifted inside it. -->
    <span
      class="official crop {cls}"
      role={alt ? 'img' : undefined}
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : 'true'}
      style:height={width === undefined ? css(size) : 'auto'}
      style:width={width === undefined ? 'auto' : css(width)}
      style:aspect-ratio="{bw} / {bh}"
    >
      <img
        {src}
        alt=""
        width={entry.w}
        height={entry.h}
        style:width="{(entry.w / bw) * 100}%"
        style:left="{(-bx / bw) * 100}%"
        style:top="{(-by / bh) * 100}%"
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        draggable="false"
        onerror={() => (failed = src)}
      />
    </span>
  {:else}
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
  {/if}
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
  .crop { position: relative; overflow: hidden; }
  .crop img { position: absolute; height: auto; max-width: none; display: block; }
</style>
