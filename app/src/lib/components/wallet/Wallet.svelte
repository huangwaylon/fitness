<script lang="ts">
  // ごほうび, the shared wallet: the island panel (design.md "Wallet"). Top to bottom: a header row (the island's jar
  // at the left; to its right the wallet's balance, big, and under it today's ベル so far in a yuzu pill:
  // 「きょうの ベル +6」, both of us with ふたりでぜんぶ, the pair's on the guest's phone too; a faint cream one at 0),
  // then the two rewards as tiles (Shop; buying asks first, then shows at once and waits 5 s with とりけす on the banner
  // before it is sent), then the ベル ledger (BellsLog: by week, a day → `onday`, the panel pushes it), and at the very
  // bottom the buys so far, folded (Purchases), each erasable by either of us (asked first; the ベル go back, with
  // とりけす on the banner).
  import Jar from '../island/Jar.svelte';
  import Shop from './Shop.svelte';
  import BuyConfirm from './BuyConfirm.svelte';
  import Purchases from './Purchases.svelte';
  import Bells from '../ui/Bells.svelte';
  import BellsLog from '../kiroku/BellsLog.svelte';
  import type { PersonId, ShopItemId } from '#lib/types.ts';
  import { walletAt, type LedgerSpend } from '#lib/model/bells.ts';
  import { bellsLedger } from '#lib/model/history.ts';
  import { walletFill } from './fill.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { toasts } from '#lib/ui-state/toast.svelte.ts';
  import { buy as buyItem, undoBanner, undoSpend } from '#lib/store/actions.ts';
  import { formatBells, t } from '#lib/i18n/index.ts';
  import { cue } from '#lib/sound/cues.ts';
  import { isGuest } from '#lib/ui-state/viewer.ts';

  /** A day of the ledger tapped (the panel pushes it). */
  let { onday }: { onday: (date: string) => void } = $props();

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
  const order = $derived<PersonId[]>([view?.me ?? 'A', view?.partner ?? 'B']);
  const ledger = $derived(m ? bellsLedger(m.state, m.now) : null);

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
      <span class="bigjar"><Jar fill={walletFill(balance)} width="var(--jar-w)" /></span>
      <div class="sums">
        <Bells bells={balance} class="total" />
        <p class="today" class:none={today <= 0} data-today={today}><span class="tk">{t('wallet.today')}</span><Bells bells={today} signed /></p>
      </div>
    </div>

    {#if guest}
      <p class="card guest" data-guest-jar>{t('guest.jarNote')}</p>
    {:else}
      <Shop onbuy={(item) => (ask = item)} {balance} />
    {/if}

    {#if ledger}
      <section class="ledger" data-ledger aria-labelledby="ledger-h">
        <h2 id="ledger-h" class="sec">{t('wallet.ledger')}</h2>
        <BellsLog {ledger} {order} {names} {villagers} {onday} />
      </section>
    {/if}

    <Purchases {spends} {names} {villagers} onerase={guest ? undefined : erase} />
  </div>

  {#if !guest}<BuyConfirm item={ask} {balance} onconfirm={buy} onclose={() => (ask = null)} />{/if}
{/if}

<style>
  .wallet { display: grid; gap: 16px; }
  /* the header row: the island's jar at the left, the balance (the plate's number, one per screen) to its right with
     today's ベル under it, the two as one group centred in the row */
  .hero {
    --jar-w: clamp(58px, calc(8.4 * var(--vh1)), 76px);
    display: flex; align-items: center; justify-content: center; gap: 16px; padding: 4px 0 2px; color: var(--text);
  }
  .bigjar { flex: none; display: block; line-height: 0; filter: drop-shadow(0 3px 0 rgb(0 0 0 / .08)); }
  .sums { min-width: 0; display: grid; justify-items: start; gap: 8px; }
  .hero :global(.total) { font-size: var(--fs-title); line-height: 1; }
  /* today's ベル: a soft yuzu pill under the balance (NH's "+N Bells" bubble), smaller than it; at 0 a faint cream one,
     so nothing jumps when the first coin lands */
  .today {
    display: inline-flex; align-items: center; gap: 6px; margin: 0; padding: 4px 12px 3px; min-height: 28px;
    border-radius: var(--r-pill); background: var(--c-yuzu); color: var(--c-ink); box-shadow: 0 2px 0 var(--c-yuzu-lip);
    font: 700 var(--fs-body)/1.2 var(--font-ui); white-space: nowrap;
  }
  .today .tk { font-size: var(--fs-s); }
  .today.none { background: var(--c-cream); color: var(--c-ink-soft); box-shadow: 0 2px 0 var(--c-lip); }
  .guest { margin: 0; padding: 12px 14px; font-weight: 700; color: var(--text-soft); text-align: center; line-height: var(--lh); }
  /* the ledger, under the shop: the same small soft heading as the buys' */
  .ledger { display: grid; gap: 8px; }
  .sec { margin: 0 4px; font: 700 var(--fs-s)/1.2 var(--font-ui); color: var(--text-soft); letter-spacing: .04em; }
</style>
