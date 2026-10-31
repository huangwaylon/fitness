<script lang="ts">
  // The treats (one simple list): big buy tiles in two columns (the item's NH art, its name, the price in ベル).
  // An escalating food treat already bought this week shows its price now, the base struck through and 「こんしゅう 2かいめ」.
  // A treat the wallet can't pay for yet is aria-disabled (a tap boops, as NH's shop does) and says how much is missing.
  // Tap → `onbuy` (the page asks first). Under the tiles, a quiet ✎ to change the list.
  import type { MenuItemView } from '#lib/types.ts';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import Glyph from '../kiroku/Glyph.svelte';
  import { itemArt } from './icons.ts';
  import { formatBells, formatNum, t } from '#lib/i18n/index.ts';
  import { nthThisWeek } from '#lib/i18n/format.ts';

  interface Props {
    items: MenuItemView[];
    balance: number;
    onbuy: (item: MenuItemView) => void;
    onedit: () => void;
  }
  let { items, balance, onbuy, onedit }: Props = $props();
  // Cheapest first, by the base price, so a tile never jumps under the finger when this week's price rises.
  const sorted = $derived([...items].sort((x, y) => x.basePrice - y.basePrice));
</script>

<section class="treats" aria-label={t('menu.title')}>
  {#if items.length}
    <div class="shelf">
      {#each sorted as item (item.id)}
        {@const short = item.price - balance}
        {@const nth = item.escalates && item.boughtThisWeek > 0 ? item.boughtThisWeek + 1 : 0}
        <button type="button" class="item" aria-disabled={short > 0} data-sfx="open" data-item={item.id} onclick={() => onbuy(item)}
          aria-label="{item.label} {formatBells(item.price)}{nth ? ' ' + nthThisWeek(nth) : ''}{short > 0 ? ' ' + t('menu.left', { bells: formatBells(short) }) : ''}">
          <span class="ic"><OfficialArt key={itemArt(item.id)} size="60px" /></span>
          <b class="nm">{item.label}</b>
          <span class="pr money" data-price={item.price}>{#if nth}<s class="was">{formatNum(item.basePrice)}</s>{/if}{formatBells(item.price)}</span>
          {#if nth}<span class="nth">{nthThisWeek(nth)}</span>{/if}
          {#if short > 0}<span class="short">{t('menu.left', { bells: formatBells(short) })}</span>{/if}
        </button>
      {/each}
    </div>
  {:else}
    <p class="empty">{t('menu.empty')}</p>
  {/if}
  <button type="button" class="edit" data-sfx="open" onclick={onedit}><Glyph kind="pen" size={16} />{t('menu.edit')}</button>
</section>

<style>
  .treats { display: grid; gap: 14px; }
  .shelf { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
  .item {
    appearance: none; border: 0; cursor: pointer; font: inherit; color: var(--text); min-width: 0; min-height: 124px;
    display: grid; justify-items: center; align-content: start; gap: 2px; padding: 12px 8px; text-align: center;
    border-radius: var(--r-card); background: var(--ctl); box-shadow: var(--sh-ctl);
    transition: transform var(--dur-base) var(--ease-bounce);
  }
  .item:active:not([aria-disabled='true']) { transform: translateY(3px) scale(1.04, .94); box-shadow: var(--sh-ctl-press); transition-duration: var(--dur-tap); }
  .item[aria-disabled='true'] { cursor: default; box-shadow: none; background: var(--ctl-off); color: var(--text-soft); transform: translateY(4px); }
  .item[aria-disabled='true'] .ic { opacity: .5; filter: saturate(.3); }
  /* top-anchored: a tile beside one with the 2かいめ pill keeps its art, name and price level with it (centred, they
     would sit lower); without a pill both tiles are as tall as their content, so nothing changes */
  .ic { width: 60px; height: 60px; margin-bottom: 2px; display: grid; place-items: center; line-height: 0; }
  .nm { max-width: 100%; font-size: var(--fs-body); line-height: 1.25; overflow-wrap: anywhere; }
  .pr { font-size: var(--fs-talk); }
  .short { font-size: var(--fs-s); font-weight: 700; }
  /* an escalating treat bought this week: the base struck through before the price, and a friendly count under it */
  .was { margin-right: 6px; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); text-decoration-thickness: 2px; }
  .nth { max-width: 100%; white-space: nowrap; letter-spacing: 0; padding: 1px 8px; border-radius: var(--r-pill); font-size: var(--fs-s); font-weight: 700; color: var(--text); background: var(--hl); }
  .empty { margin: 0; text-align: center; font-size: var(--fs-body); font-weight: 700; color: var(--text-soft); }
  /* ✎: a quiet secondary pill under the list (changing the list is rare) */
  .edit {
    appearance: none; border: 0; cursor: pointer; justify-self: center; display: inline-flex; align-items: center; gap: 8px;
    min-height: var(--hit); padding: 0 18px; border-radius: var(--r-pill); font: 700 var(--fs-body)/1 var(--font-ui);
    color: var(--text); background: var(--ctl); box-shadow: var(--sh-ctl);
  }
  .edit:active { transform: translateY(2px); box-shadow: var(--sh-ctl-press); }
</style>
