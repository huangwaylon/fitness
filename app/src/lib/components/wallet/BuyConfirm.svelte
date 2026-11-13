<script lang="ts">
  // Ask before spending: the reward's picture, name and price, and my wallet by my name before → after (「ウェイのベル
  // 53 → 33」). やめる beside the one CTA (買う！), as NH pairs every purchase; the page spends it and shows the banner with とりけす.
  //   <BuyConfirm item="snack" balance={31} payer="ウェイ" price={20} onconfirm={(item) => …} onclose={() => …} />
  import Sheet from '../ui/Sheet.svelte';
  import Bells from '../ui/Bells.svelte';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { itemArt } from './icons.ts';
  import type { ShopItemId } from '#lib/types.ts';
  import { formatBells, t } from '#lib/i18n/index.ts';

  interface Props {
    /** The reward asked about (null = closed). */
    item: ShopItemId | null;
    /** My own wallet and whose it is (my name: the payer). */
    payer: string;
    balance: number;
    /** The reward's price now. */
    price: number;
    onconfirm: (item: ShopItemId) => void;
    onclose: () => void;
  }
  let { item, balance, payer, price: asked, onconfirm, onclose }: Props = $props();
  let open = $state(false);
  /** Kept while the sheet slides away, so its content doesn't vanish first. */
  let shown = $state<ShopItemId | null>(null);
  /** Its price, kept with it. */
  let price = $state(0);
  $effect(() => {
    if (item) {
      shown = item;
      price = asked;
      open = true;
    } else open = false;
  });
</script>

<Sheet bind:open title={t('wallet.buyTitle')} {onclose} name="buy">
  {#if shown}
    <div class="ask">
      <span class="ic"><OfficialArt key={itemArt(shown)} size="72px" /></span>
      <b class="nm">{t(`shop.${shown}`)}</b>
      <Bells bells={price} class="price" />
      <p class="after">
        <span data-buy-payer>{t('wallet.after', { name: payer })}</span>
        <span class="money">{formatBells(balance)} → <b>{formatBells(Math.max(0, balance - price))}</b></span>
      </p>
    </div>
  {/if}
  {#snippet footer()}
    <div class="two">
      <button type="button" class="btn paper" data-sfx="back" onclick={() => (open = false)}>{t('common.cancel')}</button>
      <button type="button" class="btn" aria-disabled={!shown || price > balance} data-sfx="self" onclick={() => shown && onconfirm(shown)}>
        {t('wallet.buy')}
      </button>
    </div>
  {/snippet}
</Sheet>

<style>
  .ask { display: grid; justify-items: center; gap: 6px; padding: 0 0 8px; text-align: center; }
  .ic { width: 72px; height: 72px; display: grid; place-items: center; line-height: 0; animation: if-pop var(--dur-pop) var(--ease-bounce) both; }
  .nm { font-size: var(--fs-title); line-height: 1.2; }
  .ask :global(.price) { font-size: var(--fs-title); }
  .after { margin: 6px 0 0; display: grid; gap: 2px; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  .after .money { font-size: var(--fs-body); color: var(--text); }
  .two { display: grid; grid-template-columns: 1fr 1.4fr; gap: 10px; }
  .two .btn { margin: 0; }
</style>
