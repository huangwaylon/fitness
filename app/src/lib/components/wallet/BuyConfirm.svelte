<script lang="ts">
  // Ask before spending (ADR 0022): the item's picture, name and price, and the wallet before → after. やめる beside the
  // one CTA (買う！), as NH pairs every purchase (round 16 #7); the page spends it and shows the banner with とりけす.
  //   <BuyConfirm bind:item balance={3120} onconfirm={(item) => …} />
  import Sheet from '../ui/Sheet.svelte';
  import Bells from '../ui/Bells.svelte';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { itemArt, sectionIcon } from './icons.ts';
  import type { WalletItem } from '#lib/types.ts';
  import { formatBells, t } from '#lib/i18n/index.ts';

  interface Props {
    /** The item asked about (null = closed). */
    item: WalletItem | null;
    balance: number;
    onconfirm: (item: WalletItem) => void;
  }
  let { item = $bindable(), balance, onconfirm }: Props = $props();
  let open = $state(false);
  /** Kept while the sheet slides away, so its content doesn't vanish first. */
  let shown = $state<WalletItem | null>(null);
  $effect(() => {
    if (item) {
      shown = item;
      open = true;
    } else open = false;
  });
</script>

<Sheet bind:open label={shown ? t(`menu.${shown.section}.title`) : ''} title={shown ? t(`menu.${shown.section}.title`) : undefined} onclose={() => (item = null)}>
  {#if shown}
    {@const art = itemArt(shown.id)}
    <div class="ask">
      {#if art}<span class="ic"><OfficialArt key={art} size="64px" /></span>
      {:else}<svg class="ic" viewBox="0 0 48 48" aria-hidden="true"><use href="#{sectionIcon(shown.section)}" /></svg>{/if}
      <b class="nm">{shown.label}</b>
      <Bells bells={shown.bells} class="price" />
      <p class="after">
        <span>{t('wallet.after')}</span>
        <span class="money">{formatBells(balance)} → <b>{formatBells(Math.max(0, balance - shown.bells))}</b></span>
      </p>
    </div>
  {/if}
  {#snippet footer()}
    <div class="two">
      <button type="button" class="btn paper" data-sfx="back" onclick={() => (open = false)}>{t('kiroku.cancel')}</button>
      <button type="button" class="btn" aria-disabled={!shown || shown.bells > balance} data-sfx="self" onclick={() => shown && onconfirm(shown)}>
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
  .after { margin: 6px 0 0; display: grid; gap: 2px; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  .after .money { font-size: var(--fs-body); color: var(--text); }
  .two { display: grid; grid-template-columns: 1fr 1.4fr; gap: 10px; }
  .two .btn { margin: 0; }
</style>
