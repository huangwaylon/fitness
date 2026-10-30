<script lang="ts">
  // ふたりの壺 (ADR 0019 §5; the route keeps its /jar path): `◀ 島へ` + the NookPhone, a small hero (the island's jar,
  // so the route change still morphs one into the other, and today's ベル), then the two shared pots as big cards:
  // おやつ (the menu as buy buttons) and 旅 (trip types with a bar toward each). ✎ edits a pot's menu (shared by
  // both). Buying asks first, then shows at once and waits 5 s with もとに戻す on the banner before it is sent.
  // The bottom card: the last few ベル moves, tap → きろく お金. No しずえ here.
  import { resolve } from '$app/paths';
  import Jar from '#lib/components/island/Jar.svelte';
  import PhoneButton from '#lib/components/ui/PhoneButton.svelte';
  import PotCard from '#lib/components/pots/PotCard.svelte';
  import TreatShelf from '#lib/components/pots/TreatShelf.svelte';
  import TripList from '#lib/components/pots/TripList.svelte';
  import BuyConfirm from '#lib/components/pots/BuyConfirm.svelte';
  import MenuEditor from '#lib/components/pots/MenuEditor.svelte';
  import Bells from '#lib/components/ui/Bells.svelte';
  import type { MenuItem, PotKey } from '#lib/types.ts';
  import { potFill, potShare } from '#lib/components/pots/flow.ts';
  import { recentMoves } from '#lib/components/pots/recent.ts';
  import { bellsLedger } from '#lib/model/history.ts';
  import { formatDate } from '#lib/i18n/format.ts';
  import { openKiroku } from '#lib/ui-state/ui.svelte.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { toasts } from '#lib/ui-state/toast.svelte.ts';
  import { buyTreat, buyTrip, setMenu, undoBanner } from '#lib/store/actions.ts';
  import { formatBells, t } from '#lib/i18n/index.ts';

  const view = $derived(week.view);
  const pots = $derived(view?.pots ?? null);
  const menus = $derived(view?.menus ?? null);

  let phoneOpen = $state(false);
  let asking = $state<{ pot: PotKey; item: MenuItem } | null>(null);
  let askItem = $state<MenuItem | null>(null);
  let editing = $state<PotKey | null>(null);
  let editOpen = $state(false);

  /** The bottom card: the last three ベル moves, tap → きろく お金 (round 7 F11). */
  const recent = $derived(week.model ? recentMoves(bellsLedger(week.model.state, week.model.now)) : []);
  const moveLabel = (m: (typeof recent)[number]) =>
    m.kind === 'day' ? t('pots.recent.day', { date: formatDate(m.label) }) : m.kind === 'bonus' ? t('pots.recent.bonus') : m.label;

  const fill = $derived(pots ? potFill(pots.treat.balance + pots.trip.balance) : 0);

  function ask(pot: PotKey, item: MenuItem) {
    asking = { pot, item };
    askItem = item;
  }
  function buy(item: MenuItem) {
    if (!asking) return;
    const pot = asking.pot;
    const r = pot === 'treat' ? buyTreat(item.id) : buyTrip(item.id);
    askItem = null;
    if (!r.ok) {
      toasts.show(t('pots.short'), 2400, { reaction: 'worry' });
      return;
    }
    undoBanner(t(`pots.${pot}.bought`, { label: item.label, bells: formatBells(item.bells) }), r, { reaction: 'joy' });
  }
  function edit(pot: PotKey) {
    editing = pot;
    editOpen = true;
  }
  function save(pot: PotKey, items: MenuItem[]) {
    const r = setMenu(pot, items);
    if (r.ok) toasts.show(t('pots.menuSaved'), 1800, { reaction: 'pleased' });
  }
</script>

{#if view && pots && menus}
  <main class="jar-screen" class:undoing={!!toasts.current?.action}>
    <div class="top">
      <a class="back" href={resolve('/')}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 5 L8 12 L16 19 Z" /></svg>{t('jar.back')}</a>
      <PhoneButton bind:open={phoneOpen} />
    </div>
    <h1 class="sr-only">{t('pots.title')}</h1>

    <div class="hero">
      <span class="bigjar"><Jar {fill} width="calc(var(--jar-h) * 54 / 68)" name="jar" /></span>
      <span class="flow">
        <small>{t('pots.todayBoth')}</small>
        <Bells bells={pots.todayBells} signed class="today" />
        <span class="wk">{t('pots.week')} <b class="money">{formatBells(pots.weekBells, { signed: true })}</b></span>
      </span>
    </div>

    <div class="cards">
      <PotCard pot="treat" balance={pots.treat.balance} today={potShare('treat', pots.todayBells)} week={potShare('treat', pots.weekBells)}
        onedit={() => edit('treat')}>
        <TreatShelf items={menus.treat} balance={pots.treat.balance} onbuy={(item) => ask('treat', item)} />
      </PotCard>
      <PotCard pot="trip" balance={pots.trip.balance} today={potShare('trip', pots.todayBells)} week={potShare('trip', pots.weekBells)}
        onedit={() => edit('trip')}>
        <TripList items={menus.trip} balance={pots.trip.balance} onbuy={(item) => ask('trip', item)} />
      </PotCard>

      {#if recent.length}
        <button type="button" class="card recent" onclick={() => { openKiroku({ tab: 'money' }); phoneOpen = true; }}>
          <span class="rh"><small>{t('kiroku.recent')}</small><svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-chev" /></svg></span>
          {#each recent as r (r.key)}
            <span class="rr" class:off={r.off}><span class="rl">{moveLabel(r)}</span><b class="money">{formatBells(r.bells, { signed: true })}</b></span>
          {/each}
        </button>
      {/if}
    </div>
  </main>

  <BuyConfirm bind:item={askItem} pot={asking?.pot ?? 'treat'} balance={asking ? pots[asking.pot].balance : 0} onconfirm={buy} />
  {#if editing}
    <MenuEditor bind:open={editOpen} pot={editing} items={menus[editing]} onsave={(items) => editing && save(editing, items)} />
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
    background: var(--c-cream); color: var(--c-ink); box-shadow: 0 var(--lip-h) 0 var(--c-lip); text-decoration: none;
    font: 700 var(--fs-body)/1 var(--font-ui);
  }
  /* the undo banner (56px, 16px over the bottom) never covers the last card (sizing #18) */
  .jar-screen.undoing { padding-bottom: calc(var(--pad-bottom) + 88px); }
  .back svg { width: 16px; height: 16px; fill: var(--c-yuzu-lip); }
  .back:active { transform: translateY(2px); box-shadow: 0 1px 0 var(--c-lip); }

  /* the hero: the island's jar (smaller than before: the pots are the screen's cards) beside today's flow */
  .hero { display: flex; justify-content: center; align-items: center; gap: 16px; padding: 2px 0 16px; color: var(--text); --jar-h: clamp(68px, calc(11 * var(--vh1)), 112px); }
  .bigjar { display: block; line-height: 0; flex: none; }
  .flow { display: grid; gap: 4px; min-width: 0; }
  .flow small { font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  .flow :global(.today) { font-size: var(--fs-title); }
  .wk { font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  .wk b { font-size: var(--fs-s); color: var(--text); }

  .cards { display: grid; gap: 16px; }
  .recent { appearance: none; border: 0; cursor: pointer; width: 100%; font: inherit; color: inherit; text-align: left; display: grid; gap: 2px; padding: 10px 16px; }
  .recent:active { transform: translateY(3px); box-shadow: 0 1px 0 var(--lip); }
  .rh { display: flex; justify-content: space-between; align-items: center; }
  .rh small { font-size: var(--fs-body); font-weight: 700; color: var(--text-soft); }
  .chev { width: 18px; height: 18px; color: var(--text-soft); }
  .rr { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; min-height: 30px; padding-top: 4px; font-weight: 700; font-size: var(--fs-body); }
  .rr + .rr { box-shadow: 0 -2px 0 color-mix(in srgb, var(--lip) 40%, transparent); }
  .rl { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .rr b { font-size: var(--fs-body); white-space: nowrap; }
  .rr.off .rl, .rr.off b { color: var(--text-soft); text-decoration: line-through; }
  @media (max-height: 700px), (max-width: 359px) {
    .hero { padding-bottom: 10px; }
    .cards { gap: 12px; }
  }
</style>
