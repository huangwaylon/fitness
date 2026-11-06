<script lang="ts">
  // A classic card's photo (the site's figure.thumb: 16:9, cropped, rounded); `caption` lays its place over its foot
  // with the pin, on the gradient.
  import { asset } from '$app/paths';
  import type { Photo } from '#lib/travel/types.ts';
  import { i18n } from '#lib/i18n/index.ts';
  import CIcon from './CIcon.svelte';
  import { pick } from '../text.ts';

  let { photo, caption = false }: { photo: Photo; caption?: boolean } = $props();
  const src = $derived(asset(photo.src as Parameters<typeof asset>[0]));
  const cap = $derived(caption ? pick(photo.caption, i18n.locale) : '');
</script>

<figure class="thumb">
  <img {src} alt={pick(photo.alt, i18n.locale)} width={photo.w} height={photo.h} loading="lazy" decoding="async" />
  {#if cap}<figcaption><CIcon name="pin" />{cap}</figcaption>{/if}
</figure>
