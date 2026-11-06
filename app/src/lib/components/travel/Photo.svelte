<script lang="ts">
  // A guide photo (static/travel/<trip>/, docs/travel.md "Photos"): its box held from its size before it loads (no
  // layout shift), loaded lazily, its caption under it in the reader's locale.
  //   <Photo photo={day.photo} />            <Photo photo={trip.hero} fill eager />
  import { asset } from '$app/paths';
  import type { Photo } from '#lib/travel/types.ts';
  import { i18n } from '#lib/i18n/index.ts';
  import { pick } from './text.ts';

  interface Props {
    photo: Photo;
    /** Above the fold: fetched at once. */
    eager?: boolean;
    /** Cropped to the parent's box (a band or a cover), no caption. */
    fill?: boolean;
  }
  let { photo, eager = false, fill = false }: Props = $props();
  const src = $derived(asset(photo.src as Parameters<typeof asset>[0]));
  const alt = $derived(pick(photo.alt, i18n.locale));
  const caption = $derived(fill ? '' : pick(photo.caption, i18n.locale));
</script>

{#if fill}
  <img class="fill" {src} {alt} width={photo.w} height={photo.h} loading={eager ? 'eager' : 'lazy'} decoding="async" />
{:else}
  <figure class="ph">
    <img {src} {alt} width={photo.w} height={photo.h} loading={eager ? 'eager' : 'lazy'} decoding="async" />
    {#if caption}<figcaption>{caption}</figcaption>{/if}
  </figure>
{/if}

<style>
  .ph { margin: 0; display: grid; gap: 6px; }
  img { display: block; width: 100%; height: auto; border-radius: var(--r-btn); background: var(--hl); }
  .fill { position: absolute; inset: 0; height: 100%; object-fit: cover; border-radius: 0; }
  figcaption { font: 700 var(--fs-s)/1.35 var(--font-ui); color: var(--text-soft); padding: 0 4px; }
</style>
