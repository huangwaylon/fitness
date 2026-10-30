<script lang="ts">
  // One shared pot (ADR 0019 §5), the pots screen's big card: the pot's art and name, its balance in ベル (the card's
  // one big number), today's and this week's flow into it, ✎ for its menu, then the pot's own content (the treat
  // buttons or the trip bars) as `children`.
  //   <PotCard pot="treat" balance={3120} today={186} week={1260} onedit={…}>…</PotCard>
  import type { Snippet } from 'svelte';
  import type { PotKey } from '#lib/types.ts';
  import Bells from '../ui/Bells.svelte';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import Glyph from '../kiroku/Glyph.svelte';
  import { formatBells, t } from '#lib/i18n/index.ts';

  interface Props {
    pot: PotKey;
    balance: number;
    /** Bells into this pot today / this week (its share of both people's earnings). */
    today: number;
    week: number;
    /** ✎: edit this pot's menu. */
    onedit?: () => void;
    children: Snippet;
  }
  let { pot, balance, today, week, onedit, children }: Props = $props();
  const art = $derived(pot === 'treat' ? 'phone/nook-shopping' : 'money/miles-ticket');
  const hid = $props.id();
</script>

<section class="card pot {pot}" aria-labelledby="{hid}-h" data-pot={pot}>
  <header class="ph">
    <span class="art"><OfficialArt key={art} size={40} eager /></span>
    <h2 id="{hid}-h">{t(`pots.${pot}.title`)}</h2>
    {#if onedit}
      <button type="button" class="edit" onclick={onedit} aria-label={t('pots.edit', { pot: t(`pots.${pot}.title`) })}>
        <Glyph kind="pen" size={18} /><span class="el">{t('pots.editShort')}</span>
      </button>
    {/if}
  </header>
  <div class="bal">
    <Bells bells={balance} class="balance" />
  </div>
  <p class="flow">
    <span>{t('pots.today')} <b class="money">{formatBells(today, { signed: true })}</b></span>
    <span>{t('pots.week')} <b class="money">{formatBells(week, { signed: true })}</b></span>
  </p>
  {@render children()}
</section>

<style>
  .pot { display: grid; gap: 10px; padding: 14px 16px 16px; }
  .ph { display: flex; align-items: center; gap: 10px; min-height: var(--hit); }
  .art { flex: none; width: 44px; display: grid; place-items: center; line-height: 0; }
  h2 { flex: 1; min-width: 0; margin: 0; font-size: var(--fs-talk); line-height: 1.2; }
  .edit {
    appearance: none; border: 0; cursor: pointer; flex: none; min-height: var(--hit); min-width: var(--hit); padding: 0 12px;
    display: inline-flex; align-items: center; justify-content: center; gap: 6px; border-radius: var(--r-btn);
    font: 700 var(--fs-s)/1 var(--font-ui); color: var(--text); background: var(--ctl); box-shadow: var(--sh-ctl);
  }
  .edit:active { transform: translateY(2px); box-shadow: var(--sh-ctl-press); }
  .bal { line-height: 1; }
  /* the card's one big number: 36–44px, never wider than the card at 320 */
  .bal :global(.balance) { font-size: clamp(1.875rem, 10vw, var(--fs-hero)); }
  .flow { margin: -2px 0 2px; display: flex; flex-wrap: wrap; gap: 2px 14px; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  .flow b { font-size: var(--fs-s); color: var(--text); }
  .trip .flow b { color: var(--text); }
  @media (max-width: 339px) { .el { display: none; } }
</style>
