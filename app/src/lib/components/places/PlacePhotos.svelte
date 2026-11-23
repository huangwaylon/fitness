<script lang="ts">
  // A card's vendored photo band (docs/places.md "Card"): ≤3 cells of the sprite sheets (2 × 3 cells of 600 × 338,
  // two places a sheet; the last sheet of a pack can be its used cells only), a 150 px horizontal scroll-snap strip,
  // each cell its box (~266 px) drawn by background (the sheet scaled by width, auto height: a short sheet never
  // stretches — E2); pager dots under it when >1, the active one the strip's scroll position's. A sheet that can't
  // load (offline, never cached: one hidden probe <img> a sheet tells us, the background alone never does) shows the
  // paper placeholder (ui/photoFallback's look) and the dots hide. 「写真：Googleマップ」 quiet right-aligned under
  // the band, the place's Maps link (the attribution).
  import { S, photoOf } from '#lib/places/strings.ts';
  import { i18n } from '#lib/i18n/index.ts';
  import { pick } from '../travel/text.ts';

  /** One photo: its sheet's url and the cell's rect in the sheet's pixels (places/vendored.ts cardCell). */
  export interface PhotoCell {
    url: string;
    x: number;
    y: number;
    w: number;
    h: number;
  }
  interface Props {
    cells: PhotoCell[];
    /** The place's name (each cell's alt). */
    alt: string;
    /** The place's Google Maps link (the attribution's). */
    href: string;
  }
  let { cells, alt, href }: Props = $props();
  const L = $derived(i18n.locale);

  // the sheets: 2 × 3 cells of 600 × 338 in one webp (the vendored build's; a short last sheet its used rows only)
  const SHEET_W = 1200;
  const H = 150;
  const W = (H * 600) / 338; // ~266, the box's (its CSS: the height and the ratio, this only the sheet math's)
  /** A cell's box style: the sheet scaled k = box/cell by width (the height auto: the sheet's own aspect, so a
   *  partial last sheet draws right), the cell's corner the box's origin. */
  const bg = (c: PhotoCell) => {
    const k = W / c.w;
    return `background-image:url("${c.url}");background-size:${SHEET_W * k}px auto;background-position:${-c.x * k}px ${-c.y * k}px`;
  };

  // a sheet that errors: every cell of it the paper placeholder, the dots hidden
  let bad = $state<readonly string[]>([]);
  const miss = (url: string) => {
    if (!bad.includes(url)) bad = [...bad, url];
  };
  const sheets = $derived([...new Set(cells.map((c) => c.url))]);

  // the active dot: the cell at the strip's scroll position
  let strip: HTMLElement | undefined = $state();
  let atI = $state(0);
  function scrolled() {
    const cw = strip?.firstElementChild?.clientWidth;
    if (cw) atI = Math.min(cells.length - 1, Math.round(strip!.scrollLeft / (cw + 8)));
  }
</script>

<div class="band" data-place-photos>
  <div class="strip" bind:this={strip} onscroll={scrolled}>
    {#each cells as c, i (i)}
      {#if bad.includes(c.url)}
        <div class="cell miss" role="img" aria-label={photoOf(alt, i, cells.length, L)}>
          <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><rect x="3" y="4.5" width="18" height="15" rx="3" /><circle cx="9" cy="10" r="1.8" /><path d="m4 17.5 5-5 4 4 2.5-2.5 4.5 4.5" /></svg>
        </div>
      {:else}
        <div class="cell" role="img" aria-label={photoOf(alt, i, cells.length, L)} style={bg(c)}></div>
      {/if}
    {/each}
  </div>
  <div class="dots-wrap">
    {#if cells.length > 1 && !bad.length}
      <div class="dots" aria-hidden="true" data-photo-dots>
        {#each cells as _, i (i)}<span class="dot" class:on={i === atI}></span>{/each}
      </div>
    {/if}
  </div>
  <div class="cred-wrap"><a class="cred" {href} target="_blank" rel="noopener noreferrer" data-sfx="open">{pick(S.photos, L)}</a></div>
  <!-- a probe a sheet: the background can't say it failed, this can -->
  {#each sheets as u (u)}<img class="probe" src={u} alt="" decoding="async" onerror={() => miss(u)} />{/each}
</div>

<style>
  /* a fixed height (150 + 4 + 10 + 4 + 24 = 192): the band the card holds for it is exactly this tall (E3) */
  .band { display: flex; flex-direction: column; gap: 4px; height: 192px; animation: pp-in 0.25s var(--ease-soft); }
  @keyframes pp-in { from { opacity: 0; } }
  .strip { flex: none; display: flex; gap: 8px; margin: 0 -2px; padding: 0 2px; overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: none; }
  .strip::-webkit-scrollbar { display: none; }
  .cell {
    flex: none; width: calc(150px * 600 / 338); height: 150px; border-radius: var(--r-row); scroll-snap-align: center;
    background-color: var(--ctl-off); background-repeat: no-repeat;
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
  .probe { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; }
</style>
