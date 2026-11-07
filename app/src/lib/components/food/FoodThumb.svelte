<script lang="ts">
  // A food's picture box (docs/design.md "Gohan"): a fixed NH rounded square with a brown lip, `size` px. Until there
  // are pictures, its category's tile (art.ts FOOD_CAT): the tint, a plain line glyph (a leaf for 野菜: never a
  // particular food) and the category's word in small type; night tints darker. `img`, a cell of a packed sprite sheet
  // (its url, the cell's x / y and size in the sheet's pixels), fades in over the tint once it decodes, the tile again if
  // it fails: the box never changes size, so nothing shifts. Decorative (the row beside it says the name) unless `alt`.
  import { FOOD_CAT, type FoodGlyph } from '#lib/art.ts';

  interface Props {
    /** `Item.cat`, or レシピ; unknown: その他. */
    cat?: string;
    size?: number;
    img?: { url: string; x: number; y: number; size: number } | null;
    /** What the picture shows (the amount's: 「…の イメージ」); none: decorative. */
    alt?: string;
  }
  let { cat, size = 48, img = null, alt }: Props = $props();

  const key = $derived(cat && FOOD_CAT[cat] ? cat : 'その他');
  const tile = $derived(FOOD_CAT[key]);
  let failed = $state<string | null>(null);
  let loaded = $state<string | null>(null);
  const shown = $derived(!!img && failed !== img.url && loaded === img.url);
  /** The cell's scale into the box. */
  const k = $derived(img ? size / img.size : 1);
  /** Each glyph's lines on a 24 × 24 grid. */
  const GLYPH: Record<FoodGlyph, string> = {
    bowl: 'M3 12h18a9 7 0 0 1-18 0z M6.5 12a5.5 4.5 0 0 1 11 0',
    noodles: 'M3 12h18a9 7 0 0 1-18 0z M12 12 15 3 M15 12 19 3',
    don: 'M3 13h18a9 6 0 0 1-18 0z M5 11a7 4.5 0 0 1 14 0z M11 6.5h2',
    sushi: 'M4 14h16v5H4z M3.5 14c3-4.5 14-4.5 17 0',
    bread: 'M5 20V10.5A3.5 3.5 0 0 1 6.5 4h11A3.5 3.5 0 0 1 19 10.5V20z',
    plate: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z M12 7.5a4.5 4.5 0 1 0 0 9a4.5 4.5 0 1 0 0-9z',
    meat: 'M15 3a6 6 0 0 1 3.5 10.5c-2 1.5-4.5 1.5-6 .5l-4 4a2 2 0 1 1-3 1 2 2 0 1 1 1-3l4-4c-1-1.5-1-4 .5-6A6 6 0 0 1 15 3z',
    fish: 'M3 12c3-5 10-6.5 14 0-4 6.5-11 5-14 0z M17 12l4-4v8z M8 11h.01',
    egg: 'M12 3c4 0 7 6.5 7 10.5a7 7 0 0 1-14 0C5 9.5 8 3 12 3z',
    milk: 'M7 9.5 9 4h6l2 5.5V21H7z M7 9.5h10',
    pod: 'M2.5 13c0-4 4.5-6 9.5-6s9.5 2 9.5 6-4.5 4.5-9.5 4.5S2.5 17 2.5 13z M7.5 12.5h.01 M12 12.5h.01 M16.5 12.5h.01',
    seed: 'M12 3c4 5 6 8 6 11.5a6 6 0 0 1-12 0C6 11 8 8 12 3z M12 10v7',
    tuber: 'M3.5 13c0-5 6-8 11-7s6.5 6 3.5 9-8.5 5-11.5 3-3-3-3-5z M8.5 14.5l1.5-1 M13.5 10.5l1.5-1',
    leaf: 'M5 19C5 10 11 5 20 4c0 9-5 15-15 15z M5 19l8-8',
    side: 'M4 13h16a8 5.5 0 0 1-16 0z M12 11c0-3 2-5.5 5-5.5 0 3-2 5.5-5 5.5z',
    fruit: 'M12 8C8 6 4 9 4 14s4 7.5 8 6.5c4 1 8-1.5 8-6.5s-4-8-8-6z M12 8V4.5 M12 6.5c1-2 3-2.5 4.5-2',
    mushroom: 'M3 12a9 7.5 0 0 1 18 0z M9 12v6a3 2 0 0 0 6 0v-6',
    seaweed: 'M8 21c-3-4 3-7 0-11s1-7 1-7 M15 21c-3-4 3-7 0-11s1-7 1-7',
    candy: 'M8 12a4 4 0 1 0 8 0a4 4 0 1 0-8 0z M8 12 3.5 8.5v7z M16 12l4.5-3.5v7z',
    cup: 'M6 7.5h12L16.5 21h-9z M13 7.5l2-4.5h3',
    glass: 'M7 3h10c0 5-2 8.5-5 8.5S7 8 7 3z M12 11.5V20 M8 20.5h8',
    soup: 'M3 12h18a9 7 0 0 1-18 0z M9 9c-1-2 1-3 0-5 M15 9c-1-2 1-3 0-5',
    bottle: 'M10 3h4v4l2 3v11H8V10l2-3z M8 14h8',
    drop: 'M12 3c3 5 6 8 6 12a6 6 0 0 1-12 0c0-4 3-7 6-12z',
    bag: 'M5 8h14l-1 13H6z M9 8V6.5a3 3 0 0 1 6 0V8',
    cutlery: 'M7 3v7a2 2 0 0 0 2 2v9 M5 3v6 M9 3v6 M16.5 3c-2.5 2-2.5 7 0 9.5V21',
    pot: 'M4 10h16v6.5a4.5 4.5 0 0 1-4.5 4.5h-7A4.5 4.5 0 0 1 4 16.5z M2 10h20 M9.5 7h5',
    dish: 'M12 5a8 8 0 1 0 0 16a8 8 0 1 0 0-16z M19.5 2.5l-6 9'
  };
</script>

<span class="th" class:pic={shown} data-thumb={shown ? 'img' : 'cat'} data-cat={key} role={alt ? 'img' : undefined} aria-label={alt} aria-hidden={alt ? undefined : 'true'}
  style:--t={tile.tint} style:--s="{size}px" style:--r="{Math.round(size / 4)}px">
  {#if !shown}
    <svg viewBox="0 0 24 24" width={Math.round(size * 0.46)} height={Math.round(size * 0.46)}><path d={GLYPH[tile.glyph]} /></svg>
    <span class="w">{tile.word}</span>
  {/if}
  {#if img && failed !== img.url}
    <!-- the cell alone: an img its size showing the sheet at -x -y (object-position), scaled to the box -->
    <img class="cell" src={img.url} alt="" loading="lazy" decoding="async" class:in={shown} width={img.size} height={img.size}
      style:object-position="{-img.x}px {-img.y}px" style:scale={k}
      onload={() => (loaded = img.url)} onerror={() => (failed = img.url)} />
  {/if}
</span>

<style>
  .th {
    position: relative; flex: none; display: grid; place-content: center; justify-items: center; gap: 1px; overflow: hidden;
    box-sizing: border-box; width: var(--s); height: var(--s); border-radius: var(--r); background: var(--t);
    box-shadow: 0 3px 0 color-mix(in srgb, var(--c-edge) 60%, transparent); color: var(--c-ink);
  }
  :global(:root[data-tod='night']) .th { background: color-mix(in srgb, var(--t) 78%, #1F2A5E); }
  /* a picture on navy: dimmed a little (its cream paper glared beside the night's cards; the tiles tint darker too), a
     thin cream line inside */
  :global(:root[data-tod='night']) .cell { filter: brightness(.85) saturate(.95); }
  :global(:root[data-tod='night']) .pic::after { content: ''; position: absolute; inset: 0; border-radius: inherit; box-shadow: inset 0 0 0 1px rgba(255, 246, 224, 0.6); }
  svg { display: block; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
  .w { font: 700 calc(var(--s) * 0.21)/1 var(--font-ui); white-space: nowrap; letter-spacing: -0.02em; }
  .cell { position: absolute; left: 0; top: 0; max-width: none; object-fit: none; transform-origin: 0 0; opacity: 0; }
  .cell.in { opacity: 1; transition: opacity 150ms; }
  @media (prefers-reduced-motion: reduce) { .cell.in { transition: none; } }
</style>
