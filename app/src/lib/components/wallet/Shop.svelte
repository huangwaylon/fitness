<script lang="ts">
  // The two rewards (config/rules.ts SHOP) as two big tiles: the item's NH art, its name, a few examples and the price.
  // One the wallet can't pay for yet is aria-disabled (a tap boops, as NH's shop does) and says how much is missing.
  // Tap → `onbuy` (the page asks first).
  import type { ShopItemId } from '#lib/types.ts';
  import { SHOP } from '#lib/config/rules.ts';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { itemArt } from './icons.ts';
  import { formatBells, t } from '#lib/i18n/index.ts';

  let { balance, onbuy }: { balance: number; onbuy: (item: ShopItemId) => void } = $props();
</script>

<section class="shop" aria-label={t('wallet.title')}>
  {#each SHOP as item (item.id)}
    {@const short = item.bells - balance}
    <button type="button" class="item" aria-disabled={short > 0} data-sfx="open" data-item={item.id} onclick={() => onbuy(item.id)}
      aria-label="{t(`shop.${item.id}`)} {formatBells(item.bells)}{short > 0 ? ' ' + t('wallet.left', { bells: formatBells(short) }) : ''}">
      <span class="ic"><OfficialArt key={itemArt(item.id)} size="84px" /></span>
      <b class="nm">{t(`shop.${item.id}`)}</b>
      <span class="ex">{t(`shop.${item.id}.ex`)}</span>
      <span class="pr money" data-price={item.bells}>{formatBells(item.bells)}</span>
      {#if short > 0}<span class="short">{t('wallet.left', { bells: formatBells(short) })}</span>{/if}
    </button>
  {/each}
</section>

<style>
  .shop { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
  .item {
    appearance: none; border: 0; cursor: pointer; font: inherit; color: var(--text); min-width: 0; min-height: 200px;
    display: grid; justify-items: center; align-content: start; gap: 4px; padding: 14px 10px 12px; text-align: center;
    border-radius: var(--r-card); background: var(--ctl); box-shadow: var(--sh-ctl);
    transition: transform var(--dur-base) var(--ease-bounce);
  }
  .item:active:not([aria-disabled='true']) { transform: translateY(3px) scale(1.04, .94); box-shadow: var(--sh-ctl-press); transition-duration: var(--dur-tap); }
  .item[aria-disabled='true'] { cursor: default; box-shadow: none; background: var(--ctl-off); color: var(--text-soft); transform: translateY(4px); }
  .item[aria-disabled='true'] .ic { opacity: .5; filter: saturate(.3); }
  .ic { width: 84px; height: 84px; display: grid; place-items: center; line-height: 0; }
  .nm { max-width: 100%; font-size: var(--fs-talk); line-height: 1.25; }
  .ex { max-width: 100%; font-size: var(--fs-s); font-weight: 700; line-height: 1.35; color: var(--text-soft); text-wrap: balance; }
  .pr { margin-top: 2px; font-size: var(--fs-talk); }
  .short { font-size: var(--fs-s); font-weight: 700; }
</style>
