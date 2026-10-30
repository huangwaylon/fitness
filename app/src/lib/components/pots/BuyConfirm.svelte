<script lang="ts">
  // Ask before spending (ADR 0019 §5): the item's picture, name and price, and the pot before → after. One CTA
  // (買う！ / 行く！); the page spends it and shows the banner with もとに戻す.
  //   <BuyConfirm bind:item pot="treat" balance={3120} onconfirm={(item) => …} />
  import Sheet from '../ui/Sheet.svelte';
  import Bells from '../ui/Bells.svelte';
  import { itemIcon } from './icons.ts';
  import type { MenuItem, PotKey } from '#lib/types.ts';
  import { formatBells, t } from '#lib/i18n/index.ts';

  interface Props {
    /** The item asked about (null = closed). */
    item: MenuItem | null;
    pot: PotKey;
    balance: number;
    onconfirm: (item: MenuItem) => void;
  }
  let { item = $bindable(), pot, balance, onconfirm }: Props = $props();
  let open = $state(false);
  /** Kept while the sheet slides away, so its content doesn't vanish first. */
  let shown = $state<MenuItem | null>(null);
  $effect(() => {
    if (item) {
      shown = item;
      open = true;
    } else open = false;
  });
</script>

<Sheet bind:open label={t(`pots.${pot}.title`)} title={t(`pots.${pot}.title`)} onclose={() => (item = null)}>
  {#if shown}
    <div class="ask">
      <svg class="ic" viewBox="0 0 48 48" aria-hidden="true"><use href="#{itemIcon(pot, shown.id)}" /></svg>
      <b class="nm">{shown.label}</b>
      <Bells bells={shown.bells} class="price" />
      <p class="after">
        <span>{t('pots.balanceAfter')}</span>
        <span class="money">{formatBells(balance)} → <b>{formatBells(Math.max(0, balance - shown.bells))}</b></span>
      </p>
    </div>
  {/if}
  {#snippet footer()}
    <button type="button" class="btn" aria-disabled={!shown || shown.bells > balance} data-sfx="self" onclick={() => shown && onconfirm(shown)}>
      {t(`pots.${pot}.buy`)}
    </button>
  {/snippet}
</Sheet>

<style>
  .ask { display: grid; justify-items: center; gap: 6px; padding: 0 0 8px; text-align: center; }
  .ic { width: 64px; height: 64px; animation: if-pop var(--dur-pop) var(--ease-bounce) both; }
  .nm { font-size: var(--fs-title); line-height: 1.2; overflow-wrap: anywhere; }
  .ask :global(.price) { font-size: var(--fs-title); }
  .after { margin: 6px 0 0; display: grid; gap: 2px; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  .after .money { font-size: var(--fs-body); color: var(--text); }
</style>
