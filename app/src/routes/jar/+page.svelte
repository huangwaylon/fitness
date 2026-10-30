<script lang="ts">
  // ごほうび, the shared wallet (ADR 0022, round 17 IA §4.5: Nook's Cranny, about spending only; the route keeps its
  // /jar path): `◀ 島へ` + the NookPhone, a hero (the island's jar, so the route change still morphs one into the
  // other, over the wallet's balance: the number on the island's plate), then the one menu in its two sections
  // (🍦 まいにちのごほうび, ✈️ 旅のごほうび) as buy tiles. A quiet ✎ changes a section (shared by both). Buying asks first,
  // then shows at once and waits 5 s with とりけす on the banner before it is sent. History lives in きろく ベル.
  // No しずえ here.
  import { resolve } from '$app/paths';
  import Jar from '#lib/components/island/Jar.svelte';
  import PhoneButton from '#lib/components/ui/PhoneButton.svelte';
  import MenuShelf from '#lib/components/wallet/MenuShelf.svelte';
  import BuyConfirm from '#lib/components/wallet/BuyConfirm.svelte';
  import MenuEditor from '#lib/components/wallet/MenuEditor.svelte';
  import Bells from '#lib/components/ui/Bells.svelte';
  import type { MenuSection, WalletItem } from '#lib/types.ts';
  import { walletFill } from '#lib/components/wallet/fill.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { toasts } from '#lib/ui-state/toast.svelte.ts';
  import { buy as buyItem, saveMenu, undoBanner } from '#lib/store/actions.ts';
  import { formatBells, t } from '#lib/i18n/index.ts';
  import { cue } from '#lib/sound/cues.ts';

  const SECTIONS: MenuSection[] = ['daily', 'trip'];
  const view = $derived(week.view);
  const balance = $derived(view?.wallet.balance ?? 0);
  const menu = $derived(view?.menu ?? []);
  const inSection = (s: MenuSection) => menu.filter((x) => x.section === s);

  let phoneOpen = $state(false);
  let askItem = $state<WalletItem | null>(null);
  let editing = $state<MenuSection | null>(null);
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
  function edit(s: MenuSection) {
    editing = s;
    editOpen = true;
  }
  /** One section changed: the whole menu is saved, the other section as it was (in section order). */
  function save(s: MenuSection, items: WalletItem[]) {
    const next = SECTIONS.flatMap((k) => (k === s ? items : inSection(k)));
    if (saveMenu(next).ok) toasts.show(t('menu.saved'), 1800, { reaction: 'pleased' });
  }
</script>

{#if view}
  <main class="jar-screen" class:undoing={!!toasts.current?.action}>
    <div class="top">
      <a class="back" href={resolve('/')} data-sfx="back"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 5 L8 12 L16 19 Z" /></svg>{t('jar.back')}</a>
      <PhoneButton bind:open={phoneOpen} />
    </div>
    <h1 class="sr-only">{t('wallet.title')}</h1>

    <div class="hero">
      <span class="bigjar"><Jar fill={walletFill(balance)} width="calc(var(--jar-h) * 54 / 68)" name="jar" /></span>
      <small class="cap">{t('wallet.balance')}</small>
      <Bells bells={balance} class="total" />
    </div>

    <div class="cards">
      {#each SECTIONS as s (s)}
        <MenuShelf section={s} items={inSection(s)} {balance} onbuy={(item) => (askItem = item)} onedit={() => edit(s)} />
      {/each}
    </div>
  </main>

  <BuyConfirm bind:item={askItem} {balance} onconfirm={buy} />
  {#if editing}
    {@const s = editing}
    <MenuEditor bind:open={editOpen} section={s} items={inSection(s)} onsave={(items) => save(s, items)} />
  {/if}
{/if}

<style>
  .jar-screen {
    max-width: var(--col); margin: 0 auto; min-height: var(--vh-page);
    padding: calc(var(--safe-top) + 8px) calc(var(--side) + var(--safe-right)) calc(var(--pad-bottom) + 16px) calc(var(--side) + var(--safe-left));
  }
  .top { display: flex; justify-content: space-between; align-items: center; height: 52px; margin-right: -6px; }
  /* NH's back pill. */
  .back {
    display: inline-flex; align-items: center; gap: 6px; min-height: 44px; padding: 0 16px 0 12px; border-radius: var(--r-btn);
    background: var(--c-card); color: var(--c-ink); box-shadow: var(--sh-obj); text-decoration: none;
    font: 700 var(--fs-body)/1 var(--font-ui);
  }
  /* the undo banner (56px, 16px over the bottom) never covers the last card (sizing #18) */
  .jar-screen.undoing { padding-bottom: calc(var(--pad-bottom) + 88px); }
  .back svg { width: 16px; height: 16px; fill: var(--c-yuzu-lip); }
  .back:active { transform: translateY(2px); box-shadow: var(--sh-obj-press); }

  /* the hero: the island's jar over the wallet's balance (the plate's number, one per screen) */
  .hero { display: grid; justify-items: center; gap: 2px; padding: 2px 0 16px; color: var(--text); --jar-h: clamp(68px, calc(11 * var(--vh1)), 112px); }
  .bigjar { display: block; line-height: 0; margin-bottom: 4px; }
  .cap { font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  .hero :global(.total) { font-size: var(--fs-title); }

  .cards { display: grid; gap: 16px; }
  @media (max-height: 700px), (max-width: 359px) {
    .hero { padding-bottom: 10px; }
    .cards { gap: 12px; }
  }
</style>
