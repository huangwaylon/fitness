<script lang="ts">
  // おやつ's menu as buy buttons (ADR 0019 §5): two columns of item tiles (picture, name, price). An item the pot
  // can't pay for yet is disabled and says how much is missing. Tap → `onbuy` (the page asks first).
  import type { MenuItem } from '#lib/types.ts';
  import { itemIcon } from './icons.ts';
  import { formatBells, t } from '#lib/i18n/index.ts';

  let { items, balance, onbuy }: { items: MenuItem[]; balance: number; onbuy: (item: MenuItem) => void } = $props();
</script>

{#if items.length}
  <div class="shelf">
    {#each items as item (item.id)}
      {@const short = item.bells - balance}
      <button type="button" class="item" disabled={short > 0} onclick={() => onbuy(item)}
        aria-label="{item.label} {formatBells(item.bells)}{short > 0 ? ' ' + t('pots.left', { bells: formatBells(short) }) : ''}">
        <svg class="ic" viewBox="0 0 48 48" aria-hidden="true"><use href="#{itemIcon('treat', item.id)}" /></svg>
        <b class="nm">{item.label}</b>
        <span class="pr money">{formatBells(item.bells)}</span>
        {#if short > 0}<span class="short">{t('pots.left', { bells: formatBells(short) })}</span>{/if}
      </button>
    {/each}
  </div>
{:else}
  <p class="empty">{t('pots.treat.empty')}</p>
{/if}

<style>
  .shelf { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  .item {
    appearance: none; border: 0; cursor: pointer; font: inherit; color: var(--text); min-width: 0; min-height: 84px;
    display: grid; justify-items: center; align-content: center; gap: 1px; padding: 8px 6px; text-align: center;
    border-radius: var(--r-btn); background: var(--ctl); box-shadow: var(--sh-ctl);
    transition: transform var(--dur-base) var(--ease-bounce);
  }
  .item:active:not(:disabled) { transform: translateY(3px) scale(1.04, .94); box-shadow: var(--sh-ctl-press); transition-duration: var(--dur-tap); }
  .item:disabled { cursor: default; box-shadow: none; background: var(--ctl-off); color: var(--text-soft); transform: translateY(4px); }
  .item:disabled .ic { opacity: .45; filter: saturate(.3); }
  .ic { width: 34px; height: 34px; margin-bottom: 2px; }
  .nm { max-width: 100%; font-size: var(--fs-body); line-height: 1.2; overflow-wrap: anywhere; word-break: auto-phrase; }
  .pr { font-size: var(--fs-body); }
  .short { font-size: var(--fs-s); font-weight: 700; }
  .empty { margin: 0; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
</style>
