<script lang="ts">
  // One grid of the すがた level's closet (customization.md §3.4), NH's wardrobe way: a tile per item (in the variant
  // worn, else the one last chosen, else the first; the colour filter's when one is set), a tap wears it and shows its
  // colours on the stage (the level's dots, never in the grid: the grid doesn't move). A なし tile first where the slot
  // may be empty. Built a slice per frame (a few
  // hundred tops at once is a long task on a phone); a garment's tile is its catalogue icon, loaded lazily and tinted to
  // the colour shown (closet.ts Variant.tint); a face part's or hairstyle's its number. The closet's items have no
  // names: a tile is 「トップス 3、いろ 4しゅるい」 to a screen reader.
  import type { PartId, PlayerLook } from '#lib/contract/look.ts';
  import { roving } from '../ui/roving.ts';
  import { closet, GARMENT_KINDS, OPTIONAL_KINDS, wornIn, type ClosetItem, type ClosetKind, type Hue, type Variant } from './closet.ts';
  import { t } from '#lib/i18n/index.ts';

  interface Props {
    kind: ClosetKind;
    look: PlayerLook;
    hue: Hue | null;
    /** The variant last chosen per item key (the tile shows it). */
    chosen: Record<string, PartId>;
    onwear: (kind: ClosetKind, id: PartId | null) => void;
    /** Every tap on a tile (its item; null: なし), worn already or not: the stage shows its colours. */
    ontap?: (item: ClosetItem | null) => void;
  }
  let { kind, look, hue, chosen, onwear, ontap }: Props = $props();

  const COLS = 5;
  const FIRST = 30;
  const STEP = 60;
  const garment = $derived(GARMENT_KINDS.has(kind));
  const worn = $derived(wornIn(look, kind));
  const all = $derived(closet().items(kind));
  const shown = $derived(hue ? all.filter((i) => i.variants.some((v) => v.hue === hue)) : all);
  let limit = $derived.by(() => {
    void shown;
    return FIRST;
  });
  $effect(() => {
    if (limit >= shown.length) return;
    const raf = requestAnimationFrame(() => (limit += STEP));
    return () => cancelAnimationFrame(raf);
  });

  type Tile = { item: ClosetItem | null; v: Variant | null; n: number };
  /** The variant a tile shows: the worn one, the last chosen, the first (within the filter). */
  function face(item: ClosetItem): Variant {
    const ok = (v: Variant) => !hue || v.hue === hue;
    return item.variants.find((v) => v.id === worn && ok(v)) ?? item.variants.find((v) => v.id === chosen[item.key] && ok(v)) ?? item.variants.find(ok) ?? item.variants[0];
  }
  const tiles = $derived<Tile[]>([
    ...(OPTIONAL_KINDS.has(kind) && !hue ? [{ item: null, v: null, n: 0 }] : []),
    ...shown.slice(0, limit).map((item) => ({ item, v: face(item), n: all.indexOf(item) + 1 }))
  ]);
  const rows = $derived(Array.from({ length: Math.ceil(tiles.length / COLS) }, (_, r) => tiles.slice(r * COLS, r * COLS + COLS)));
  const isWorn = (tile: Tile) => (tile.item ? tile.item.variants.some((v) => v.id === worn) : worn === null);
  const tabStop = $derived(tiles.find(isWorn) ?? tiles[0]);
  const label = (tile: Tile) => {
    if (!tile.item) return t('look.none');
    const name = t('look.item', { kind: t(`look.kind.${kind}`), n: tile.n });
    return tile.item.variants.length > 1 ? t('look.itemColours', { name, n: tile.item.variants.length }) : name;
  };

  function tap(tile: Tile) {
    ontap?.(tile.item);
    if (!tile.item) return onwear(kind, null);
    if (tile.v && tile.v.id !== worn) onwear(kind, tile.v.id);
  }
</script>

{#snippet art(tile: Tile)}
  {#if !tile.item || !tile.v}
    <svg class="none" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2.4" /><path d="M6.5 17.5 17.5 6.5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" /></svg>
  {:else if tile.v.icon}
    {@const tint = tile.v.tint}
    <span class="ico">
      <img src={tile.v.icon} alt="" width="96" height="96" loading="lazy" decoding="async" draggable="false"
        style:filter={tint === null ? null : `grayscale(1) brightness(${tint})`} />
      {#if tint !== null}
        {@const mask = `url("${tile.v.icon}") center / contain no-repeat`}
        <span class="tint" style:background={tile.v.swatch} style:-webkit-mask={mask} style:mask></span>
      {/if}
    </span>
  {:else if garment}
    <span class="sw" style:background={tile.v.swatch}></span><span class="n">{tile.n}</span>
  {:else}
    <span class="n big">{tile.n - 1}</span>
  {/if}
{/snippet}

{#if tiles.length}
  <div class="grid" role="radiogroup" aria-label={t(`look.kind.${kind}`)} data-closet={kind} {@attach roving}>
    {#each rows as row, r (r)}
      <div class="row">
        {#each row as tile (tile.item?.key ?? '-')}
          {@const on = isWorn(tile)}
          <button type="button" class="tile" role="radio" aria-checked={on} aria-label={label(tile)} tabindex={tile === tabStop ? 0 : -1}
            data-item={tile.item?.key ?? 'none'} data-part={tile.v?.id ?? 'none'} data-sfx={on ? 'none' : 'tick'} onclick={() => tap(tile)}>
            {@render art(tile)}
          </button>
        {/each}
      </div>
    {/each}
  </div>
{:else}
  <p class="empty" role="status">{t('look.noneInHue')}</p>
{/if}

<style>
  .grid { display: grid; gap: 10px; }
  .row { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; }
  .tile {
    appearance: none; cursor: pointer; border: 0; padding: 0; position: relative; aspect-ratio: 1; min-height: 44px;
    display: grid; place-items: center; border-radius: 18px; background: var(--ctl); color: var(--text); box-shadow: var(--sh-ctl);
    font: 700 var(--fs-s)/1 var(--font-num); transition: transform var(--dur-base) var(--ease-bounce);
  }
  .tile:active { transform: scale(1.06, .92); transition-duration: var(--dur-tap); }
  .tile[aria-checked='true'] { background: var(--ctl-sel); color: var(--c-ink); box-shadow: 0 0 0 3px var(--c-leaf-edge); }
  /* the catalogue's icon, one per line in one of its colours: another colour tints it (grey, brightened so its
     main colour is near white, times the swatch, masked to the icon's shape) */
  .ico { position: relative; width: 86%; height: 86%; isolation: isolate; pointer-events: none; }
  .ico img { display: block; width: 100%; height: 100%; object-fit: contain; user-select: none; -webkit-user-drag: none; }
  .tint { position: absolute; inset: 0; mix-blend-mode: multiply; }
  .sw { width: 54%; height: 54%; border-radius: 30%; box-shadow: inset 0 0 0 2px rgb(0 0 0 / .14); grid-area: 1 / 1; }
  .n { position: absolute; right: 6px; bottom: 5px; font-size: 11px; opacity: .7; }
  .n.big { position: static; font-size: var(--fs-body); opacity: 1; }
  .none { width: 46%; height: 46%; opacity: .6; }
  .empty { margin: 16px 0; text-align: center; font-weight: 700; color: var(--text-soft); }
</style>
