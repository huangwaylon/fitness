<script lang="ts">
  // A card's photo band (docs/places.md "Card"): ≤ 3 of the place's Google photos (the relay's links: contract picUrl,
  // 600 × 338, cached on view by the service worker), a 150 px horizontal scroll-snap strip, each its box (~266 px);
  // pager dots under it when > 1, the active one the strip's scroll position's. A photo that can't load (offline and
  // never seen, a link Google retired) shows the paper placeholder (ui/photoFallback's look) and the dots hide; the
  // next details pass brings fresh links. 「写真：Googleマップ」 quiet right-aligned under the band, the place's Maps
  // link (the attribution).
  import { S, photoOf } from '#lib/places/strings.ts';
  import { i18n } from '#lib/i18n/index.ts';
  import { pick } from '../travel/text.ts';

  interface Props {
    /** The photos' URLs. */
    urls: string[];
    /** The place's name (each photo's alt). */
    alt: string;
    /** The place's Google Maps link (the attribution's). */
    href: string;
  }
  let { urls, alt, href }: Props = $props();
  const L = $derived(i18n.locale);

  // a photo that errors: the paper placeholder, the dots hidden
  let bad = $state<readonly string[]>([]);
  const miss = (url: string) => {
    if (!bad.includes(url)) bad = [...bad, url];
  };

  // the active dot: the photo at the strip's scroll position
  let strip: HTMLElement | undefined = $state();
  let atI = $state(0);
  function scrolled() {
    const cw = strip?.firstElementChild?.clientWidth;
    if (cw) atI = Math.min(urls.length - 1, Math.round(strip!.scrollLeft / (cw + 8)));
  }
</script>

<div class="band" data-place-photos>
  <div class="strip" bind:this={strip} onscroll={scrolled}>
    {#each urls as u, i (u)}
      {#if bad.includes(u)}
        <div class="cell miss" role="img" aria-label={photoOf(alt, i, urls.length, L)}>
          <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><rect x="3" y="4.5" width="18" height="15" rx="3" /><circle cx="9" cy="10" r="1.8" /><path d="m4 17.5 5-5 4 4 2.5-2.5 4.5 4.5" /></svg>
        </div>
      {:else}
        <img class="cell" src={u} alt={photoOf(alt, i, urls.length, L)} crossorigin="anonymous" referrerpolicy="no-referrer" decoding="async" onerror={() => miss(u)} />
      {/if}
    {/each}
  </div>
  <div class="dots-wrap">
    {#if urls.length > 1 && !bad.length}
      <div class="dots" aria-hidden="true" data-photo-dots>
        {#each urls as _, i (i)}<span class="dot" class:on={i === atI}></span>{/each}
      </div>
    {/if}
  </div>
  <div class="cred-wrap"><a class="cred" {href} target="_blank" rel="noopener noreferrer" data-sfx="open">{pick(S.photos, L)}</a></div>
</div>

<style>
  /* a fixed height (150 + 4 + 10 + 4 + 24 = 192): the band the card holds for it is exactly this tall (E3) */
  .band { display: flex; flex-direction: column; gap: 4px; height: 192px; animation: pp-in 0.25s var(--ease-soft); }
  @keyframes pp-in { from { opacity: 0; } }
  .strip { flex: none; display: flex; gap: 8px; margin: 0 -2px; padding: 0 2px; overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: none; }
  .strip::-webkit-scrollbar { display: none; }
  .cell {
    flex: none; width: calc(150px * 600 / 338); height: 150px; border-radius: var(--r-row); scroll-snap-align: center;
    background-color: var(--ctl-off); object-fit: cover;
  }
  /* the paper placeholder (ui/photoFallback's look): the paper, a small picture in it */
  .cell.miss { display: grid; place-items: center; background: var(--c-paper); color: #a88b68; }
  .miss svg { fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
  .dots-wrap { flex: none; height: 10px; display: flex; align-items: center; }
  .dots { display: flex; justify-content: center; gap: 6px; width: 100%; }
  .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--stitch); }
  .dot.on { background: var(--text-soft); }
  .cred-wrap { flex: none; height: 24px; display: flex; justify-content: flex-end; }
  /* the credit: a 44 px target (E5) that costs the card no height: over the dots' row and its gaps (14 up), down to
     the card's 6 px gap under the band (the sub line's own, from there, drawn over it) */
  .cred { display: inline-flex; align-items: center; justify-content: flex-end; min-width: 44px; min-height: 44px; margin: -14px 0 -6px; font: 600 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); text-decoration: none; }
</style>
