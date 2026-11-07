<script lang="ts">
  // A guide photo (static/travel/<trip>/, docs/travel.md "Photos"): its box held from its size before it loads (no
  // layout shift), loaded lazily, its caption under it in the reader's locale. (A trip's hero is ui/PhotoBand's.)
  //   <Photo photo={day.photo} />
  import { photoFallback } from '../ui/photoFallback.ts';
  import { asset } from '$app/paths';
  import type { Photo } from '#lib/travel/types.ts';
  import { i18n } from '#lib/i18n/index.ts';
  import { pick } from './text.ts';

  let { photo }: { photo: Photo } = $props();
  const src = $derived(asset(photo.src as Parameters<typeof asset>[0]));
  const alt = $derived(pick(photo.alt, i18n.locale));
  const caption = $derived(pick(photo.caption, i18n.locale));
</script>

<figure class="ph">
  <img {src} {alt} width={photo.w} height={photo.h} loading="lazy" decoding="async" {@attach photoFallback} />
  {#if caption}<figcaption>{caption}</figcaption>{/if}
</figure>

<style>
  .ph { margin: 0; display: grid; gap: 6px; }
  img { display: block; width: 100%; height: auto; border-radius: var(--r-chip); background: var(--ctl-off); }
  figcaption { font-size: var(--fs-s); line-height: 1.35; color: var(--text-soft); padding: 0 2px; }
</style>
