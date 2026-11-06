<script lang="ts">
  // A food's picture (docs/design.md "Gohan"): a fixed NH rounded square with a brown lip (`size` px; `wide`: the card's
  // width × `size`), its category's tile (art.ts FOOD_CAT: the tint, and a catalogue icon's visible part or a drawn one;
  // night tints darker). `img`, a cell of a packed sprite sheet (its url, the cell's x / y and size in the sheet's pixels), is drawn
  // over the tint once it decodes, the tile again if it fails: the box never changes size, so nothing shifts.
  // Decorative: the row or card beside it says the name.
  import { art, artUrl, FOOD_CAT, type FoodDraw } from '#lib/art.ts';

  interface Props {
    /** `Item.cat`, or レシピ; unknown: その他. */
    cat?: string;
    size?: number;
    wide?: boolean;
    img?: { url: string; x: number; y: number; size: number } | null;
  }
  let { cat, size = 48, wide = false, img = null }: Props = $props();

  const key = $derived(cat && FOOD_CAT[cat] ? cat : 'その他');
  const tile = $derived(FOOD_CAT[key]);
  const icon = $derived(artUrl(tile.art));
  const file = $derived(art(tile.art));
  const cell = $derived(wide ? null : img);
  let failed = $state<string | null>(null);
  let loaded = $state<string | null>(null);
  const shown = $derived(!!cell && failed !== cell.url && loaded === cell.url);
  /** The cell's scale into the box. */
  const k = $derived(cell ? size / cell.size : 1);
  /** The icon: ¾ of a thumbnail; under half a wide one's height (a category's mark, never read as the food itself). */
  const ic = $derived(Math.round(size * (wide ? 0.45 : 0.74)));
  /** The icon's visible part (its `box`, else the whole file) fitted to `ic`. */
  const fit = $derived.by(() => {
    if (!file) return null;
    const [x, y, w, h] = tile.box ?? [0, 0, file.w, file.h];
    const f = ic / Math.max(w, h);
    return { x: -x * f, y: -y * f, w: w * f, h: h * f, fw: file.w * f, fh: file.h * f };
  });
</script>

{#snippet drawn(d: FoodDraw)}
  <svg class="ic" viewBox="0 0 48 48" width={ic} height={ic} aria-hidden="true">
    {#if d === 'bowl'}
      <path d="M9 24 C9 12 39 12 39 24 Z" fill="#FFFDF5" />
      <path d="M17 18 l2 -1 M25 15 l2 1 M30 19 l2 -1" class="fine" />
      <path d="M6 24 H42 C42 33 35 40 24 40 C13 40 6 33 6 24 Z" fill="#D9644A" />
      <path d="M8.5 29.5 H39.5" stroke="#F3E2B3" stroke-width="2.4" />
      <path d="M18 40 H30 V43 H18 Z" fill="#B84E38" />
    {:else if d === 'egg'}
      <path d="M10 26 C6 16 18 8 27 11 C37 8 44 18 39 27 C42 36 30 41 23 38 C14 41 8 34 10 26 Z" fill="#FFFDF5" />
      <circle cx="25" cy="24" r="7" fill="#FFC23D" />
      <circle cx="22.5" cy="21.5" r="2" fill="#FFE7A0" stroke="none" />
    {:else if d === 'beans'}
      <path d="M7 30 C7 22 14 20 18 22 C21 15 29 15 31 21 C35 16 43 19 42 26 C41 33 33 36 28 32 C25 38 16 38 14 33 C10 36 7 34 7 30 Z" fill="#8FCB5A" />
      <circle cx="14" cy="28" r="3.5" fill="#B4E07F" stroke="none" />
      <circle cx="24.5" cy="25" r="3.5" fill="#B4E07F" stroke="none" />
      <circle cx="35" cy="26" r="3.5" fill="#B4E07F" stroke="none" />
    {:else if d === 'nut'}
      <path d="M14 22 C14 34 19 42 24 43 C29 42 34 34 34 22 Z" fill="#C98A4B" />
      <path d="M11 23 C11 12 37 12 37 23 Z" fill="#8A5A32" />
      <path d="M24 13 V8" />
    {:else}
      <path d="M8 30 C6 22 16 14 28 14 C38 14 43 20 41 27 C39 34 28 37 18 37 C12 37 9 34 8 30 Z" fill="#B5486E" />
      <ellipse cx="38" cy="21.5" rx="3.6" ry="5.6" transform="rotate(-35 38 21.5)" fill="#F6D36B" />
      <path d="M8 30 L4 32" />
    {/if}
  </svg>
{/snippet}

<span class="th" class:wide class:pic={shown} data-thumb={shown ? 'img' : 'cat'} data-cat={key} aria-hidden="true"
  style:--t={tile.tint} style:--s="{size}px" style:--r="{wide ? 18 : Math.round(size / 4)}px">
  {#if !shown}
    {#if tile.draw}{@render drawn(tile.draw)}
    {:else if icon && fit}
      <span class="ic" style:width="{fit.w}px" style:height="{fit.h}px">
        <img src={icon} alt="" loading="lazy" decoding="async" style:left="{fit.x}px" style:top="{fit.y}px" style:width="{fit.fw}px" style:height="{fit.fh}px" />
      </span>
    {/if}
  {/if}
  {#if cell && failed !== cell.url}
    <img class="cell" src={cell.url} alt="" loading="lazy" decoding="async" class:in={shown}
      style:left="{-cell.x * k}px" style:top="{-cell.y * k}px" style:scale={k}
      onload={() => (loaded = cell.url)} onerror={() => (failed = cell.url)} />
  {/if}
</span>

<style>
  .th {
    position: relative; flex: none; display: grid; place-items: center; overflow: hidden; box-sizing: border-box;
    width: var(--s); height: var(--s); border-radius: var(--r); background: var(--t);
    box-shadow: 0 3px 0 color-mix(in srgb, var(--c-edge) 60%, transparent);
  }
  .wide { width: 100%; }
  :global(:root[data-tod='night']) .th { background: color-mix(in srgb, var(--t) 78%, #1F2A5E); }
  /* a picture on navy: a thin cream line inside (its colours untouched) */
  :global(:root[data-tod='night']) .pic::after { content: ''; position: absolute; inset: 0; border-radius: inherit; box-shadow: inset 0 0 0 1px rgba(255, 246, 224, 0.6); }
  .ic { display: block; position: relative; overflow: hidden; }
  .ic img { position: absolute; max-width: none; }
  svg.ic { fill: none; stroke: #6B4A2E; stroke-width: 2.4; stroke-linejoin: round; stroke-linecap: round; }
  svg.ic .fine { stroke-width: 1.6; stroke: #C9B98F; }
  .cell { position: absolute; max-width: none; transform-origin: 0 0; opacity: 0; }
  .cell.in { opacity: 1; transition: opacity 150ms; }
  @media (prefers-reduced-motion: reduce) { .cell.in { transition: none; } }
</style>
