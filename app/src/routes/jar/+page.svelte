<script lang="ts">
  // ごほうび, the shared wallet (ADR 0022, round 17 IA §4.5: Nook's Cranny, about spending only; the route keeps its
  // /jar path): the page's title bar (‹ 島へ top-left, the title centred: design.md "Navigation"), a hero (the island's jar, so the route change still morphs one into the
  // other, over the wallet's balance: the number on the island's plate), then one simple list of big buy tiles (the
  // five defaults: おやつ, カフェ・デザート, 外ごはん, ほしいもの, 旅のごほうび). A quiet ✎ changes the list (shared by both). Buying asks first,
  // then shows at once and waits 5 s with とりけす on the banner before it is sent. History lives in きろく ベル.
  // No しずえ here.
  import { resolve } from '$app/paths';
  import Jar from '#lib/components/island/Jar.svelte';
  import NavButton from '#lib/components/ui/NavButton.svelte';
  import MenuShelf from '#lib/components/wallet/MenuShelf.svelte';
  import BuyConfirm from '#lib/components/wallet/BuyConfirm.svelte';
  import MenuEditor from '#lib/components/wallet/MenuEditor.svelte';
  import Bells from '#lib/components/ui/Bells.svelte';
  import type { WalletItem } from '#lib/types.ts';
  import type { Treat } from '#lib/components/wallet/shapes.ts';
  import { walletFill } from '#lib/components/wallet/fill.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { toasts } from '#lib/ui-state/toast.svelte.ts';
  import { buy as buyItem, saveMenu, undoBanner } from '#lib/store/actions.ts';
  import { formatBells, t } from '#lib/i18n/index.ts';
  import { cue } from '#lib/sound/cues.ts';

  const view = $derived(week.view);
  const balance = $derived(view?.wallet.balance ?? 0);
  const menu = $derived(view?.menu ?? []);

  let askItem = $state<WalletItem | null>(null);
  let editOpen = $state(false);

  function buy(item: WalletItem) {
    const r = buyItem(item.id);
    askItem = null;
    if (!r.ok) {
      cue('boop');
      toasts.show(t('wallet.short'), 2400, { reaction: 'worry' });
      return;
    }
    cue('buy');
    undoBanner(t('wallet.bought', { label: item.label, bells: formatBells(item.bells) }), r, { reaction: 'joy' });
  }
  function save(items: Treat[]) {
    if (saveMenu(items).ok) toasts.show(t('menu.saved'), 1800, { reaction: 'pleased' });
  }
</script>

{#if view}
  <main class="jar-screen" class:undoing={!!toasts.current?.action}>
    <div class="top">
      <NavButton kind="back" href={resolve('/')} text={t('jar.back')} />
      <h1>{t('wallet.title')}</h1>
      <span class="sp"></span>
    </div>

    <div class="hero">
      <span class="bigjar"><Jar fill={walletFill(balance)} width="calc(var(--jar-h) * 54 / 68)" name="jar" /></span>
      <small class="cap">{t('wallet.balance')}</small>
      <Bells bells={balance} class="total" />
    </div>

    <MenuShelf items={menu} {balance} onbuy={(item) => (askItem = item)} onedit={() => (editOpen = true)} />
  </main>

  <BuyConfirm bind:item={askItem} {balance} onconfirm={buy} />
  <MenuEditor bind:open={editOpen} items={menu} onsave={save} />
{/if}

<style>
  .jar-screen {
    max-width: var(--col); margin: 0 auto; min-height: var(--vh-page);
    padding: calc(var(--safe-top) + 8px) calc(var(--side) + var(--safe-right)) calc(var(--pad-bottom) + 16px) calc(var(--side) + var(--safe-left));
  }
  /* the title bar: ‹ 島へ | the title, centred on the page | an equal spacer */
  .top { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; min-height: 52px; gap: 8px; }
  .top h1 { margin: 0; font-size: var(--fs-title); text-align: center; white-space: nowrap; }
  .top > :global(.nav) { justify-self: start; }
  /* the undo banner (56px, 16px over the bottom) never covers the last card (sizing #18) */
  .jar-screen.undoing { padding-bottom: calc(var(--pad-bottom) + 88px); }

  /* the hero: the island's jar over the wallet's balance (the plate's number, one per screen) */
  .hero { display: grid; justify-items: center; gap: 2px; padding: 2px 0 16px; color: var(--text); --jar-h: clamp(68px, calc(11 * var(--vh1)), 112px); }
  .bigjar { display: block; line-height: 0; margin-bottom: 4px; }
  .cap { font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  .hero :global(.total) { font-size: var(--fs-title); }

  @media (max-height: 700px), (max-width: 359px) {
    .hero { padding-bottom: 10px; }
  }
</style>
