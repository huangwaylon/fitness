<script lang="ts">
  // Official NH art with our fan-art as the fallback (missing key, or the image fails to load).
  //   <OfficialArt key={villagerArt('raymond')} alt="ジャック" size={120}>
  //     {#snippet fallback()}<Villager villager="raymond" size={120} />{/snippet}
  //   </OfficialArt>
  // `size` = rendered height (number → px, or any CSS length); width follows the art's aspect ratio.
  // Use `width` instead for width-driven layouts. Decorative art: pass alt="".
  // Renders with a padded canvas (art.ts BOX) are cropped to the figure, so sizes are comparable.
  // The box is reserved from the manifest aspect ratio: no layout shift while loading.
  import type { Snippet } from 'svelte';
  import { art, artUrl } from '#lib/art.ts';
  import { getArtGate } from './artGate.ts';

  interface Props {
    key: string | null | undefined;
    alt?: string;
    size?: number | string;
    width?: number | string;
    /** Eager-load above-the-fold art (default lazy). */
    eager?: boolean;
    /** The screen's largest image (the island's oaks): fetched first. */
    priority?: boolean;
    fallback?: Snippet;
  }
  let { key, alt = '', size, width, eager = false, priority = false, fallback }: Props = $props();

  const entry = $derived(art(key));
  const src = $derived(artUrl(key));
  let failed = $state<string | null>(null);
  // over the 3D island: no download while the canvas draws the thing instead (artGate.ts); on the island `data-src` names the art either way (what the specs read)
  const gate = getArtGate();
  let openFor = $state<string | null>(null), img = $state<HTMLImageElement>();
  const held = $derived(!!gate?.on && openFor !== src);
  const BLANK = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  $effect(() => {
    if (!held || !img || !gate || !src) return;
    const want = src;
    return gate.hold(img, () => (openFor = want));
  });
  const css = (v: number | string | undefined) => (typeof v === 'number' ? `${v}px` : v);
</script>

{#if src && entry && failed !== src}
  {#if entry.box}
    {@const [bx, by, bw, bh] = entry.box}
    <!-- Padded render: a box the size of the figure, the image shifted inside it. -->
    <span
      class="official crop"
      role={alt ? 'img' : undefined}
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : 'true'}
      style:height={width === undefined ? css(size) : 'auto'}
      style:width={width === undefined ? 'auto' : css(width)}
      style:aspect-ratio="{bw} / {bh}"
    >
      <img
        bind:this={img}
        src={held ? BLANK : src}
        data-src={gate ? src : undefined}
        alt=""
        width={entry.w}
        height={entry.h}
        style:width="{(entry.w / bw) * 100}%"
        style:left="{(-bx / bw) * 100}%"
        style:top="{(-by / bh) * 100}%"
        loading={eager || priority ? 'eager' : 'lazy'}
        fetchpriority={priority ? 'high' : undefined}
        decoding="async"
        draggable="false"
        onerror={() => held || (failed = src)}
      />
    </span>
  {:else}
    <img
      bind:this={img}
      class="official"
      src={held ? BLANK : src}
      data-src={gate ? src : undefined}
      {alt}
      width={entry.w}
      height={entry.h}
      style:height={width === undefined ? css(size) : 'auto'}
      style:width={width === undefined ? 'auto' : css(width)}
      style:aspect-ratio="{entry.w} / {entry.h}"
      loading={eager || priority ? 'eager' : 'lazy'}
      fetchpriority={priority ? 'high' : undefined}
      decoding="async"
      draggable="false"
      onerror={() => held || (failed = src)}
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
