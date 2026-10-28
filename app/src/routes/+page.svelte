<script lang="ts">
  // 島 Island (style guide v3 §B.1): the scene, one しずえ line, ONE primary action (今夜のチェック),
  // always visible (U2). A pending 「筋トレとして記録する？」 is asked in しずえ's bubble with two chips.
  // After today's check-in the button goes quiet. Tap the partner → partner sheet.
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import type { FruitKey } from '#lib/types.ts';
  import { FRUITS } from '#lib/config/rules.ts';
  import IslandScene from '#lib/components/IslandScene.svelte';
  import Bubble from '#lib/components/Bubble.svelte';
  import CheckinSheet from '#lib/components/CheckinSheet.svelte';
  import HelpButton from '#lib/components/HelpButton.svelte';
  import PartnerSheet from '#lib/components/PartnerSheet.svelte';
  import SyncPill from '#lib/components/SyncPill.svelte';
  import Toast from '#lib/components/Toast.svelte';
  import { week } from '#lib/client/week.svelte.ts';
  import { ui } from '#lib/client/ui.svelte.ts';
  import { highFive, confirmPending } from '#lib/client/actions.ts';
  import { t, hostLine, formatDate } from '#lib/i18n/index.ts';

  let checkinOpen = $state(false);
  let partnerOpen = $state(false);
  /** Short-lived reactions on the island (style guide §7.4). */
  let partnerCheer = $state(false);
  let meCheer = $state(false);
  /** The partner's high-five toast (their icon, not しずえ's; U6). */
  let fiveToast = $state<{ text: string; id: number } | null>(null);
  /** My fruit % when the check-in sheet opened, to name the fruit that actually grew (U7). */
  let before = $state<Record<FruitKey, number> | null>(null);

  const view = $derived(week.view);
  const me = $derived(view ? view.people[view.me] : null);
  const pending = $derived(view?.pending[0] ?? null);
  const checkedIn = $derived(!!view && (me?.habits?.ticksByDate[view.today] ?? []).length > 0);
  const grew = $derived(me && before ? (FRUITS.find((f) => me.fruits[f].pct > before![f]) ?? null) : null);

  /** U8: the unripe fruit closest to ripe, as "{fruit}, {n} more {unit}". Needs my raw numbers. */
  const UNIT: Record<FruitKey, string> = { peach: 'nearly_min', coconut: 'nearly_day', apple: 'nearly_day', pear: 'nearly_tick' };
  function nearlyLine(): string | null {
    if (!me) return null;
    const open = FRUITS.filter((f) => me.fruits[f].pct < 100 && me.fruits[f].target !== undefined && me.fruits[f].actual !== undefined);
    if (!open.length) return null;
    const f = open.reduce((a, b) => (me.fruits[b].pct > me.fruits[a].pct ? b : a));
    const n = Math.ceil((me.fruits[f].target ?? 0) - (me.fruits[f].actual ?? 0));
    return n > 0 ? hostLine(UNIT[f], { fruit: f, n }) : null;
  }

  const line = $derived.by(() => {
    if (!view) return '';
    if (pending) return t('pending.ask', { label: pending.label });
    const key = view.juniper.key.replace(/^(juniper|host)\./, '');
    if (key === 'harvest_ready' || key === 'harvest_waiting' || key === 'payday') return hostLine(key, view.juniper.params);
    if (grew) return hostLine('grew', { fruit: grew });
    if (key === 'default' || key === 'pending_confirm') return nearlyLine() ?? hostLine('default');
    return hostLine(key, view.juniper.params);
  });

  function answer(yes: boolean) {
    if (!pending) return;
    confirmPending(pending.kind, pending.id, yes);
    if (yes) week.showToast(t('pending.saved'), 1600);
  }

  function openCheckin() {
    if (me) before = Object.fromEntries(FRUITS.map((f) => [f, me.fruits[f].pct])) as Record<FruitKey, number>;
    checkinOpen = true;
  }

  // Closing the check-in sheet with today ticked → my villager cheers once.
  function celebrate() {
    if (!checkedIn) return;
    meCheer = true;
    setTimeout(() => (meCheer = false), 2400);
  }

  function sendHighFive() {
    if (!view) return;
    highFive();
    week.showToast(t('island.highfiveSent'), 1600);
    partnerCheer = true;
    setTimeout(() => (partnerCheer = false), 2400);
  }

  // M5: tell me when my partner sent a high-five today (once per new one, per device), but not over
  // the harvest: wait until it closes (U6).
  $effect(() => {
    const v = week.view;
    if (!v || v.highFivesToday <= 0 || ui.overlay) return;
    const k = `hf-seen:${v.today}`;
    const seen = Number(localStorage.getItem(k) ?? 0);
    if (v.highFivesToday > seen) {
      localStorage.setItem(k, String(v.highFivesToday));
      setTimeout(() => {
        partnerCheer = true;
        const toast = { text: t('island.highfiveGot', { name: v.people[v.partner].villagerName }), id: Date.now() };
        fiveToast = toast;
        setTimeout(() => (partnerCheer = false), 2600);
        setTimeout(() => fiveToast === toast && (fiveToast = null), 3200);
      }, 700);
    }
  });
</script>

{#if view}
  <main class="island">
    <div class="top">
      <IslandScene {view} onpartner={() => (partnerOpen = true)} onme={openCheckin} onjar={() => goto(resolve('/jar'))}
        partnerExpression={partnerCheer ? 'cheer' : undefined} partnerEmote={partnerCheer ? 'heart' : false}
        meExpression={meCheer ? 'cheer' : undefined} meEmote={meCheer} />
      <div class="head">
        <SyncPill />
        <HelpButton topic="island" />
      </div>
    </div>

    <div class="below">
      <Bubble text={line} host="wave" size={96}>
        {#snippet actions()}
          {#if pending}
            <span class="when">{formatDate(pending.date)}</span>
            <button type="button" class="chip" onclick={() => answer(true)}>{t('common.yes')}</button>
            <button type="button" class="chip no" onclick={() => answer(false)}>{t('common.no')}</button>
          {/if}
        {/snippet}
      </Bubble>

      <button type="button" class="btn cta" class:paper={checkedIn} onclick={openCheckin}>
        {#if checkedIn}<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-check" /></svg>{t('island.checkedIn')}
        {:else}<svg viewBox="0 0 48 48" aria-hidden="true"><use href="#i-bowl" /></svg>{t('island.checkin')}{/if}
      </button>
    </div>
  </main>
  <CheckinSheet bind:open={checkinOpen} onclose={celebrate} />
  <PartnerSheet bind:open={partnerOpen} onhighfive={sendHighFive} />
  {#if fiveToast && !ui.overlay}
    {#key fiveToast.id}<Toast text={fiveToast.text} person={view.partner} />{/key}
  {/if}
{/if}

<style>
  .island {
    max-width: var(--col); margin: 0 auto; container-type: inline-size;
    padding-bottom: calc(var(--tabbar-h) + var(--safe-bottom) + 24px);
  }
  .top { position: relative; container-type: inline-size; }
  .head {
    position: absolute; z-index: 8; top: calc(var(--safe-top) + 8px); left: calc(16px + var(--safe-left)); right: calc(16px + var(--safe-right));
    display: flex; justify-content: space-between; align-items: center;
  }
  .below {
    padding: 0 calc(18px + var(--safe-right)) 0 calc(18px + var(--safe-left)); margin-top: -11cqw; position: relative; z-index: 6;
    display: grid; gap: 12px;
  }
  /* The one primary action stays in the thumb zone, above the dock, even on short phones. */
  .cta { position: sticky; bottom: calc(var(--tabbar-h) + var(--safe-bottom) + 18px); z-index: 7; }
  /* Answer chips inside しずえ's bubble. */
  .when { flex: 1 0 100%; font-size: var(--fs-caption); color: var(--c-ink-talk); opacity: .8; margin-top: -6px; }
  .chip {
    appearance: none; cursor: pointer; min-height: 44px; min-width: 76px; padding: 0 18px; border-radius: var(--r-pill);
    font: 700 var(--fs-body) var(--font-ui); color: var(--c-ink); background: var(--c-leaf); border: 0;
    box-shadow: var(--sh-btn-hi), 0 3px 0 var(--c-leaf-lip);
  }
  .chip.no { background: var(--c-paper); box-shadow: 0 3px 0 var(--c-paper-2); border: var(--bw) solid var(--c-stitch); }
  .chip:active { transform: translateY(2px); box-shadow: 0 1px 0 var(--c-leaf-lip); }
  /* iPhone SE-height screens: trim empty sky so the scene, しずえ and the button fit. */
  @media (max-height: 720px) {
    .top { margin-top: -26cqw; }
    .head { top: calc(var(--safe-top) + 8px + 26cqw); }
    .below { gap: 8px; }
    .below :global(.spk img) { height: 64px !important; }
    .below :global(.spk) { min-height: 64px; }
  }
</style>
