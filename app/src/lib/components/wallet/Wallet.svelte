<script lang="ts">
  // ごほうび, the wallets: the island panel (design.md "Wallet"). Top to bottom: the two members' wallets side by side
  // (mine first; each its jar, its owner's avatar and name, its balance, big, and under it today's ベル into it so far in
  // a yuzu pill, a faint cream one at 0; before the wallets' split, contract/rules.ts WALLET_SPLIT_MS, both show the one
  // shared wallet), then the two rewards as tiles (Shop, paid from my own wallet; buying asks first, then shows at once
  // and waits 5 s with とりけす on the banner before it is sent), then the ベル ledger (BellsLog: by week, a day →
  // `onday`, the panel pushes it), and at the very bottom the buys so far, folded (Purchases), each erasable by either
  // of us (asked first; the ベル go back to the wallet that paid, with とりけす on the banner).
  import Jar from '../island/Jar.svelte';
  import Avatar from '../characters/Avatar.svelte';
  import Shop from './Shop.svelte';
  import BuyConfirm from './BuyConfirm.svelte';
  import Purchases from './Purchases.svelte';
  import Bells from '../ui/Bells.svelte';
  import BellsLog from '../kiroku/BellsLog.svelte';
  import type { PersonId, ShopItemId } from '#lib/types.ts';
  import { walletAt, type LedgerSpend } from '#lib/model/bells.ts';
  import { bellsLedger } from '#lib/model/history.ts';
  import { SHOP, shopPrice } from '#lib/contract/rules.ts';
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
  /** The guest's phone: the wallets to look at, the buys listed; nothing bought or erased (docs/design.md "The guest"). */
  const guest = $derived(isGuest(view));
  /** My own wallet: what the rewards are paid from. */
  const balance = $derived(view ? view.wallet.people[view.me].balance : 0);
  const m = $derived(week.model);
  /** The rewards' prices now (the old ones before the wallets' split). */
  const prices = $derived(Object.fromEntries(SHOP.map((x) => [x.id, shopPrice(x.id, m?.now ?? 0) ?? x.bells])) as Record<ShopItemId, number>);
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
      {#each order as p (p)}
        {@const purse = view.wallet.people[p]}
        <section class="purse" class:mine={!guest && p === view.me} data-purse={p} data-balance={purse.balance} aria-label={t('wallet.of', { name: names[p] })}>
          <span class="jar"><Jar fill={walletFill(purse.balance)} width="var(--jar-w)" /></span>
          <span class="who"><Avatar worn person={p} villager={villagers[p]} size={20} />{names[p]}</span>
          <Bells bells={purse.balance} class="total" />
          <p class="today" class:none={purse.today <= 0} data-today={purse.today}><span class="tk">{t('wallet.today')}</span><Bells bells={purse.today} signed /></p>
        </section>
      {/each}
    </div>

    {#if guest}
      <p class="card guest" data-guest-jar>{t('guest.jarNote')}</p>
    {:else}
      <Shop onbuy={(item) => (ask = item)} {balance} {prices} />
    {/if}

    {#if ledger}
      <section class="ledger" data-ledger aria-labelledby="ledger-h">
        <h2 id="ledger-h" class="sec-label">{t('wallet.ledger')}</h2>
        <BellsLog {ledger} {order} {names} {villagers} {onday} />
      </section>
    {/if}

    <Purchases {spends} {names} {villagers} onerase={guest ? undefined : erase} />
  </div>

  {#if !guest}<BuyConfirm item={ask} {balance} price={ask ? prices[ask] : 0} onconfirm={buy} onclose={() => (ask = null)} />{/if}
{/if}

<style>
  .wallet { display: grid; gap: 16px; }
  /* the wallets: two cards side by side (mine first, ringed), each its jar, its owner, the balance (the plate's number)
     and today's ベル under it, centred */
  .hero {
    --jar-w: clamp(44px, calc(6.4 * var(--vh1)), 58px);
    display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; padding: 4px 0 2px; color: var(--text);
  }
  .purse {
    min-width: 0; display: grid; justify-items: center; align-content: start; gap: 6px; padding: 10px 6px 12px;
    border-radius: var(--r-card); background: var(--c-cream); box-shadow: 0 2px 0 var(--c-lip);
  }
  .purse.mine { box-shadow: 0 0 0 2px var(--c-yuzu-lip), 0 2px 0 var(--c-lip); }
  .jar { display: block; line-height: 0; filter: drop-shadow(0 3px 0 rgb(0 0 0 / .08)); }
  .who { max-width: 100%; display: inline-flex; align-items: center; gap: 4px; font: 700 var(--fs-s)/1.2 var(--font-ui); color: var(--text-soft); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .hero :global(.total) { font-size: var(--fs-title); line-height: 1; }
  /* today's ベル: a soft yuzu pill under the balance (NH's "+N Bells" bubble), smaller than it; at 0 a faint cream one,
     so nothing jumps when the first coin lands */
  .today {
    display: inline-flex; align-items: center; gap: 4px; margin: 0; padding: 4px 10px 3px; min-height: 28px; max-width: 100%;
    border-radius: var(--r-pill); background: var(--c-yuzu); color: var(--c-ink); box-shadow: 0 2px 0 var(--c-yuzu-lip);
    font: 700 var(--fs-s)/1.2 var(--font-ui); white-space: nowrap;
  }
  .today.none { background: var(--c-paper); color: var(--c-ink-soft); box-shadow: 0 2px 0 var(--c-lip); }
  .guest { margin: 0; padding: 12px 14px; font-weight: 700; color: var(--text-soft); text-align: center; line-height: var(--lh); }
  /* the ledger, under the shop: the same small soft heading as the buys' */
  .ledger { display: grid; gap: 8px; }
</style>
