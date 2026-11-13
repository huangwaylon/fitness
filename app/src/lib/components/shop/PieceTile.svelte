<script module lang="ts">
  // One tile of the shops' grids (タヌキ商店's かう and its 苗, a visitor's few pieces: island/VisitorShop.svelte): the
  // icon, the name on two lines, the price (or 持っている; past my かいがら dimmed, 「あと{n}」); yuzu when picked. Its
  // colours are the sheet's controls (--ctl, --ctl-sel, --sh-ctl), so it fits the shop's cream sheet and a Sheet alike.
  // `nm`: a name breaking only between its words (words.ts), smaller with a word too long for a line (the room's card too).
  import { isLong, words } from './words.ts';
  import { i18n } from '#lib/i18n/index.ts';
  export { nm };
</script>

<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLButtonAttributes } from 'svelte/elements';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { findArt } from '../../world/beach.ts';
  import { formatNum, t } from '#lib/i18n/index.ts';

  interface Props extends Omit<HTMLButtonAttributes, 'onclick'> {
    name: string;
    /** Each one's price in かいがら (unshown with `owned`). */
    price: number;
    on?: boolean;
    owned?: boolean;
    /** How many かいがら I'm short of it (0: none). */
    short?: number;
    icon: Snippet;
    onclick: () => void;
  }
  let { name, price, on = false, owned = false, short = 0, icon, onclick, ...rest }: Props = $props();
</script>

{#snippet nm(name: string)}
  <span class="nm" class:xs={isLong(name, i18n.locale)}>{#each words(name, i18n.locale) as w, i (i)}{#if i}<wbr />{/if}{w}{/each}</span>
{/snippet}

<li class="tile" class:on class:owned class:short={short > 0}>
  <button type="button" class="pickable" data-sfx="self" {...rest} {onclick}>
    <span class="ic">{@render icon()}</span>
    {@render nm(name)}
    {#if owned}<span class="price owned-tag">{t('shop.owned')}</span>
    {:else if short > 0}<span class="price" data-short={short}>{t('shop.shortBy', { n: formatNum(short) })}</span>
    {:else}<span class="price"><span class="mini" aria-hidden="true"><OfficialArt key={findArt('cowrie')} size={14} /></span>{formatNum(price)}</span>{/if}
  </button>
</li>

<style>
  .tile { position: relative; }
  .pickable {
    appearance: none; border: 0; cursor: pointer; width: 100%; min-height: 118px; padding: 10px 6px 8px; border-radius: var(--r-btn);
    display: grid; justify-items: center; align-content: start; gap: 4px; background: var(--ctl); color: var(--text);
    box-shadow: var(--sh-ctl); -webkit-tap-highlight-color: transparent; touch-action: manipulation;
  }
  .pickable:active { transform: translateY(2px); box-shadow: var(--sh-ctl-press); }
  .pickable:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  .on .pickable { background: var(--ctl-sel); color: var(--c-ink); }
  .owned .pickable { background: var(--ctl-off); }
  .owned .ic { opacity: .55; }
  /* past my かいがら: still tappable (its card says so), dimmed */
  .short:not(.on) .pickable { opacity: .55; }
  .ic { position: relative; width: 46px; height: 46px; display: grid; place-items: center; line-height: 0; }
  .ic :global(img) { width: 46px; height: 46px; object-fit: contain; }
  /* a long name breaks only between its words (its <wbr>s: words.ts), balanced (プラスチックの / ベンチ, not プラスチッ / クの
     ベンチ); a word longer than the line still breaks where it must */
  .nm { font: 700 var(--fs-s)/1.2 var(--font-ui); text-align: center; word-break: keep-all; overflow-wrap: anywhere; text-wrap: balance; display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .nm.xs { font-size: var(--fs-xs); }
  .price { display: inline-flex; align-items: center; gap: 3px; font: 700 var(--fs-s)/1 var(--font-num); font-variant-numeric: tabular-nums; }
  .mini { display: inline-flex; line-height: 0; }
  .owned-tag { font-family: var(--font-ui); color: var(--leaf-text); }
  @media (prefers-reduced-motion: reduce) { .pickable:active { transform: none; } }
</style>
