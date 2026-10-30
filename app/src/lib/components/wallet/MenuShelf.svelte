<script lang="ts">
  // The treats (ADR 0022: one simple list): big buy tiles in two columns (the item's NH art, its name, the price in ベル).
  // A treat the wallet can't pay for yet is aria-disabled (a tap boops, as NH's shop does) and says how much is missing.
  // Tap → `onbuy` (the page asks first). Under the tiles, a quiet ✎ to change the list.
  import type { WalletItem } from '#lib/types.ts';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import Glyph from '../kiroku/Glyph.svelte';
  import { itemArt } from './icons.ts';
  import { formatBells, t } from '#lib/i18n/index.ts';

  interface Props {
    items: WalletItem[];
    balance: number;
    onbuy: (item: WalletItem) => void;
    onedit: () => void;
  }
  let { items, balance, onbuy, onedit }: Props = $props();
</script>

<section class="treats" aria-label={t('menu.title')}>
  {#if items.length}
    <div class="shelf">
      {#each items as item (item.id)}
        {@const short = item.bells - balance}
        <button type="button" class="item" aria-disabled={short > 0} data-sfx="open" data-item={item.id} onclick={() => onbuy(item)}
          aria-label="{item.label} {formatBells(item.bells)}{short > 0 ? ' ' + t('menu.left', { bells: formatBells(short) }) : ''}">
          <span class="ic"><OfficialArt key={itemArt(item.id)} size="60px" /></span>
          <b class="nm">{item.label}</b>
          <span class="pr money">{formatBells(item.bells)}</span>
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
    display: grid; justify-items: center; align-content: center; gap: 2px; padding: 12px 8px; text-align: center;
    border-radius: var(--r-card); background: var(--ctl); box-shadow: var(--sh-ctl);
    transition: transform var(--dur-base) var(--ease-bounce);
  }
  .item:active:not([aria-disabled='true']) { transform: translateY(3px) scale(1.04, .94); box-shadow: var(--sh-ctl-press); transition-duration: var(--dur-tap); }
  .item[aria-disabled='true'] { cursor: default; box-shadow: none; background: var(--ctl-off); color: var(--text-soft); transform: translateY(4px); }
  .item[aria-disabled='true'] .ic { opacity: .5; filter: saturate(.3); }
  .ic { width: 60px; height: 60px; margin-bottom: 2px; display: grid; place-items: center; line-height: 0; }
  .nm { max-width: 100%; font-size: var(--fs-body); line-height: 1.25; overflow-wrap: anywhere; word-break: auto-phrase; }
  .pr { font-size: var(--fs-talk); }
  .short { font-size: var(--fs-s); font-weight: 700; }
  .empty { margin: 0; text-align: center; font-size: var(--fs-body); font-weight: 700; color: var(--text-soft); }
  /* ✎: a quiet secondary pill under the list (changing the list is rare) */
  .edit {
    appearance: none; border: 0; cursor: pointer; justify-self: center; display: inline-flex; align-items: center; gap: 8px;
    min-height: var(--hit); padding: 0 18px; border-radius: var(--r-pill); font: 700 var(--fs-body)/1 var(--font-ui);
    color: var(--text); background: var(--ctl); box-shadow: var(--sh-ctl);
  }
  .edit:active { transform: translateY(2px); box-shadow: var(--sh-ctl-press); }
</style>
