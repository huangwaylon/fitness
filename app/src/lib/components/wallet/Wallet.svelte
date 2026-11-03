<script lang="ts">
  // ごほうび, the shared wallet (Nook's Cranny, about spending only): the island panel's middle tab (design.md
  // "Wallet"). A hero (the island's jar over the wallet's balance and, under it, today's ベル so far in a yuzu pill:
  // 「きょう +6 ベル」, both of us with ふたりでぜんぶ, the pair's on the guest's phone too; faint 「きょう まだ 0 ベル」
  // before the first), then the two rewards as big tiles. Buying asks
  // first, then shows at once and waits 5 s with とりけす on the banner before it is sent. Under them the buys so far
  // (Purchases), each erasable by either of us (asked first; the ベル go back, with とりけす on the banner). The
  // day-by-day ledger lives in きろく.
  import Jar from '../island/Jar.svelte';
  import Shop from './Shop.svelte';
  import BuyConfirm from './BuyConfirm.svelte';
  import Purchases from './Purchases.svelte';
  import Bells from '../ui/Bells.svelte';
  import type { PersonId, ShopItemId } from '#lib/types.ts';
  import { walletAt, type LedgerSpend } from '#lib/model/bells.ts';
  import { walletFill } from './fill.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { toasts } from '#lib/ui-state/toast.svelte.ts';
  import { buy as buyItem, undoBanner, undoSpend } from '#lib/store/actions.ts';
  import { formatBells, t } from '#lib/i18n/index.ts';
  import { cue } from '#lib/sound/cues.ts';
  import { isGuest } from '#lib/ui-state/viewer.ts';

  const view = $derived(week.view);
  /** The guest's phone: the jar to look at, the buys listed; nothing bought or erased (docs/design.md "The guest"). */
  const guest = $derived(isGuest(view));
  const balance = $derived(view?.wallet.balance ?? 0);
  /** Today's ベル so far (both of us, ふたりでぜんぶ included: the members' even on the guest's phone). */
  const today = $derived(view?.wallet.today ?? 0);
  const m = $derived(week.model);
  /** The buys, newest first (walletAt is memoised per model and minute, as the view computed it). */
  const spends = $derived(m ? [...walletAt(m.state, m.now).spends].reverse() : []);
  const names = $derived({ A: view?.people.A.villagerName ?? 'A', B: view?.people.B.villagerName ?? 'B' } as Record<PersonId, string>);
  const villagers = $derived({ A: view?.people.A.villager ?? null, B: view?.people.B.villager ?? null } as Record<PersonId, string | null>);

  /** The reward being asked about. */
  let ask = $state<ShopItemId | null>(null);

  function buy(item: ShopItemId) {
    const r = buyItem(item);
    ask = null;
    if (!r.ok) {
      cue('boop');
      toasts.show(t('wallet.short'), 2400, { reaction: 'worry' });
      return;
    }
    cue('buy');
    undoBanner(t('wallet.bought', { label: t(`shop.${item}`), bells: formatBells(r.bells ?? 0) }), r, { reaction: 'joy' });
  }

  function erase(s: LedgerSpend) {
    undoBanner(t('wallet.erased', { label: t(`shop.${s.item}`), bells: formatBells(s.bells) }), undoSpend(s.spendId));
  }
</script>

{#if view}
  <div class="wallet" data-wallet>
    <div class="hero">
      <span class="bigjar"><Jar fill={walletFill(balance)} width="calc(var(--jar-h) * 54 / 68)" /></span>
      <small class="cap">{t('wallet.balance')}</small>
      <Bells bells={balance} class="total" />
      <p class="today" class:none={today <= 0} data-today={today}>
        {#if today > 0}<span class="tk">{t('wallet.today')}</span><Bells bells={today} signed />{:else}{t('wallet.todayNone')}{/if}
      </p>
    </div>

    {#if guest}
      <p class="card guest" data-guest-jar>{t('guest.jarNote')}</p>
      <Purchases {spends} {names} {villagers} />
    {:else}
      <Shop {balance} onbuy={(item) => (ask = item)} />
      <Purchases {spends} {names} {villagers} onerase={erase} />
    {/if}
  </div>

  {#if !guest}<BuyConfirm item={ask} {balance} onconfirm={buy} onclose={() => (ask = null)} />{/if}
{/if}

<style>
  /* the hero: the island's jar over the wallet's balance (the plate's number, one per screen) */
  .hero { display: grid; justify-items: center; gap: 2px; padding: 2px 0 16px; color: var(--text); --jar-h: clamp(68px, calc(11 * var(--vh1)), 112px); }
  .bigjar { display: block; line-height: 0; margin-bottom: 4px; }
  .cap { font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  .hero :global(.total) { font-size: var(--fs-title); }
  /* today's ベル: a soft yuzu pill under the balance (NH's "+N Bells" bubble), smaller than it; before the first ベル a
     faint cream one, so nothing jumps when they come */
  .today {
    display: inline-flex; align-items: center; gap: 6px; margin: 6px 0 0; padding: 4px 12px 3px; min-height: 28px;
    border-radius: var(--r-pill); background: var(--c-yuzu); color: var(--c-ink); box-shadow: 0 2px 0 var(--c-yuzu-lip);
    font: 700 var(--fs-body)/1.2 var(--font-ui);
  }
  .today .tk { font-size: var(--fs-s); }
  .today.none { background: var(--c-cream); color: var(--c-ink-soft); box-shadow: 0 2px 0 var(--c-lip); font-size: var(--fs-s); }
  .guest { margin: 0 0 12px; padding: 12px 14px; font-weight: 700; color: var(--text-soft); text-align: center; line-height: var(--lh); }

  @media (max-height: 700px), (max-width: 359px) {
    .hero { padding-bottom: 10px; }
  }
</style>
