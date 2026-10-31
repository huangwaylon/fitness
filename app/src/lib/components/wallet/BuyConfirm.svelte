<script lang="ts">
  // Ask before spending: the item's picture, name and price, and the wallet before → after. やめる beside the
  // one CTA (買う！), as NH pairs every purchase; the page spends it and shows the banner with とりけす.
  // The price is the one being paid now: an escalating food treat's price this week, with 「こんしゅう 2かいめ」.
  // `item` is the live menu item, so a price that steps up while the sheet is open (a sync: the partner bought the same
  // おやつ) shows here before 買う！ charges it.
  //   <BuyConfirm {item} balance={3120} onconfirm={(item) => …} onclose={() => …} />
  import Sheet from '../ui/Sheet.svelte';
  import Bells from '../ui/Bells.svelte';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { itemArt } from './icons.ts';
  import type { MenuItemView } from '#lib/types.ts';
  import { formatBells, formatNum, t } from '#lib/i18n/index.ts';
  import { nthThisWeek } from '#lib/i18n/format.ts';

  interface Props {
    /** The item asked about (null = closed). */
    item: MenuItemView | null;
    balance: number;
    onconfirm: (item: MenuItemView) => void;
    onclose: () => void;
  }
  let { item, balance, onconfirm, onclose }: Props = $props();
  let open = $state(false);
  /** Kept while the sheet slides away, so its content doesn't vanish first. */
  let shown = $state<MenuItemView | null>(null);
  $effect(() => {
    if (item) {
      shown = item;
      open = true;
    } else open = false;
  });
</script>

<Sheet bind:open label={t('wallet.title')} title={t('wallet.title')} {onclose}>
  {#if shown}
    <div class="ask">
      <span class="ic"><OfficialArt key={itemArt(shown.id)} size="64px" /></span>
      <b class="nm">{shown.label}</b>
      <Bells bells={shown.price} class="price" />
      {#if shown.escalates && shown.boughtThisWeek > 0}
        <small class="nth">{nthThisWeek(shown.boughtThisWeek + 1)} · <s>{formatNum(shown.basePrice)}</s></small>
      {/if}
      <p class="after">
        <span>{t('wallet.after')}</span>
        <span class="money">{formatBells(balance)} → <b>{formatBells(Math.max(0, balance - shown.price))}</b></span>
      </p>
    </div>
  {/if}
  {#snippet footer()}
    <div class="two">
      <button type="button" class="btn paper" data-sfx="back" onclick={() => (open = false)}>{t('kiroku.cancel')}</button>
      <button type="button" class="btn" aria-disabled={!shown || shown.price > balance} data-sfx="self" onclick={() => shown && onconfirm(shown)}>
        {t('wallet.buy')}
      </button>
    </div>
  {/snippet}
</Sheet>

<style>
  .ask { display: grid; justify-items: center; gap: 6px; padding: 0 0 8px; text-align: center; }
  .ic { width: 64px; height: 64px; display: grid; place-items: center; line-height: 0; animation: if-pop var(--dur-pop) var(--ease-bounce) both; }
  .nm { font-size: var(--fs-title); line-height: 1.2; overflow-wrap: anywhere; }
  .ask :global(.price) { font-size: var(--fs-title); }
  .nth { font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  .after { margin: 6px 0 0; display: grid; gap: 2px; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  .after .money { font-size: var(--fs-body); color: var(--text); }
  .two { display: grid; grid-template-columns: 1fr 1.4fr; gap: 10px; }
  .two .btn { margin: 0; }
</style>
