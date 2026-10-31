<script module lang="ts">
  /** Buys shown at first, and added per 「もっと見る」 tap. */
  const AT_ONCE = 10;
</script>

<script lang="ts">
  // ごほうびの きろく: the buys from the shared wallet, newest first (the day, the reward, who bought it, the price), each
  // with ✕ to erase it. Either of us may erase any buy (one wallet). ✕ asks first, NH style (はい / いいえ), then
  // `onerase` (the page sends the `spend_void`: the ベル go back, with とりけす on the banner). An erased buy leaves the
  // list. Ten at first, ten more per 「もっと見る」.
  //   <Purchases spends={…} names={…} villagers={…} onerase={(s) => …} />
  import type { PersonId } from '#lib/types.ts';
  import type { LedgerSpend } from '#lib/model/bells.ts';
  import { localDateAt } from '#lib/time/dates.ts';
  import Sheet from '../ui/Sheet.svelte';
  import Avatar from '../characters/Avatar.svelte';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { itemArt } from './icons.ts';
  import { dayTitle } from '../kiroku/fmt.ts';
  import { formatBells, t } from '#lib/i18n/index.ts';

  interface Props {
    /** The accepted buys, newest first (erased ones are left out here). */
    spends: LedgerSpend[];
    names: Record<PersonId, string>;
    villagers: Record<PersonId, string | null>;
    onerase: (s: LedgerSpend) => void;
  }
  let { spends, names, villagers, onerase }: Props = $props();

  const live = $derived(spends.filter((s) => !s.voided));
  let shown = $state(AT_ONCE);

  /** The buy being asked about; kept while the sheet slides away. */
  let ask = $state<LedgerSpend | null>(null);
  let open = $state(false);
  function askErase(s: LedgerSpend) {
    ask = s;
    open = true;
  }
  function yes() {
    open = false;
    if (ask) onerase(ask);
  }
</script>

{#snippet when(s: LedgerSpend)}
  <span class="money">{dayTitle(localDateAt(s.at))}</span>
  <span class="who"><Avatar person={s.by} villager={villagers[s.by]} size={20} />{names[s.by]}</span>
{/snippet}

<section class="hist" aria-labelledby="hist-h">
  <h2 id="hist-h" class="sec">{t('wallet.history')}</h2>
  {#if !live.length}
    <p class="card empty">{t('wallet.historyEmpty')}</p>
  {:else}
    <ul class="card rows">
      {#each live.slice(0, shown) as s (s.spendId)}
        {@const label = t(`shop.${s.item}`)}
        <li data-spend={s.spendId}>
          <span class="ic"><OfficialArt key={itemArt(s.item)} size="32px" /></span>
          <span class="lbl"><b>{label}</b><small class="meta">{@render when(s)}</small></span>
          <span class="money amt">{formatBells(-s.bells)}</span>
          <button type="button" class="x" data-sfx="open" aria-label={t('wallet.erase', { label })} onclick={() => askErase(s)}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </li>
      {/each}
    </ul>
    {#if live.length > shown}
      <button type="button" class="btn small paper more" data-sfx="page" onclick={() => (shown += AT_ONCE)}>{t('wallet.more')}</button>
    {/if}
  {/if}
</section>

<Sheet bind:open label={t('wallet.eraseTitle')} title={t('wallet.eraseTitle')} onclose={() => (open = false)}>
  {#if ask}
    <div class="ask">
      <span class="big"><OfficialArt key={itemArt(ask.item)} size="64px" /></span>
      <b class="nm">{t(`shop.${ask.item}`)}</b>
      <small class="meta">{@render when(ask)}</small>
      <p>{t('wallet.eraseAsk')}<br /><b class="money">{t('wallet.eraseRefund', { bells: formatBells(ask.bells) })}</b></p>
    </div>
  {/if}
  {#snippet footer()}
    <div class="two">
      <button type="button" class="btn paper" data-sfx="back" onclick={() => (open = false)}>{t('wallet.eraseNo')}</button>
      <button type="button" class="btn" data-sfx="confirm" onclick={yes}>{t('wallet.eraseYes')}</button>
    </div>
  {/snippet}
</Sheet>

<style>
  .hist { display: grid; gap: 8px; margin-top: 20px; }
  .sec { margin: 0 4px; font: 700 var(--fs-s)/1.2 var(--font-ui); color: var(--text-soft); letter-spacing: .04em; }
  .empty { margin: 0; padding: 14px 16px; text-align: center; font-weight: 700; color: var(--text-soft); }
  .rows { list-style: none; margin: 0; padding: 2px 6px 2px 12px; display: grid; }
  .rows li { display: flex; align-items: center; gap: 10px; min-height: 56px; font-weight: 700; }
  .rows li + li { box-shadow: 0 -2px 0 color-mix(in srgb, var(--lip) 40%, transparent); }
  .ic { flex: none; width: 32px; height: 32px; display: grid; place-items: center; line-height: 0; }
  .lbl { flex: 1; min-width: 0; display: grid; gap: 2px; padding: 6px 0; font-size: var(--fs-body); }
  .lbl b { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  /* the day and the buyer never break inside; they wrap between them on a narrow phone */
  .meta { display: flex; flex-wrap: wrap; align-items: center; gap: 0 10px; font-size: var(--fs-s); color: var(--text-soft); }
  .meta > span { white-space: nowrap; }
  .who { display: inline-flex; align-items: center; gap: 4px; }
  .amt { flex: none; font-size: var(--fs-body); white-space: nowrap; }
  .x {
    flex: none; appearance: none; border: 0; cursor: pointer; width: var(--hit); height: var(--hit); padding: 0; border-radius: 50%;
    display: grid; place-items: center; background: none; color: var(--text-soft);
  }
  .x svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 2.6; stroke-linecap: round; }
  .x:active { background: var(--hl); transform: scale(.92); }
  .more { justify-self: center; }

  .ask { display: grid; justify-items: center; gap: 4px; padding: 0 0 8px; text-align: center; }
  .big { width: 64px; height: 64px; display: grid; place-items: center; line-height: 0; }
  .nm { font-size: var(--fs-talk); line-height: 1.2; }
  .ask .meta { justify-content: center; }
  .ask p { margin: 10px 0 0; font-weight: 700; line-height: 1.6; }
  .two { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .two .btn { margin: 0; }
  @media (max-width: 359px) { .rows { padding-left: 8px; } .rows li { gap: 6px; } .meta :global(.av) { display: none; } }
</style>
