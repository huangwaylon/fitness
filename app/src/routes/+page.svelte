<script lang="ts">
  // 島 Island (style guide v3 §B.1): the scene, one しずえ line, ONE primary action (今夜のチェック).
  // A pending 「筋トレとして記録する？」 replaces the button (one tap each way) and しずえ doesn't
  // repeat it. After today's check-in the button goes quiet. Tap the partner → partner sheet.
  import IslandScene from '#lib/components/IslandScene.svelte';
  import Bubble from '#lib/components/Bubble.svelte';
  import CheckinSheet from '#lib/components/CheckinSheet.svelte';
  import HelpButton from '#lib/components/HelpButton.svelte';
  import PartnerSheet from '#lib/components/PartnerSheet.svelte';
  import SyncPill from '#lib/components/SyncPill.svelte';
  import { week } from '#lib/client/week.svelte.ts';
  import { highFive, confirmPending } from '#lib/client/actions.ts';
  import { t, juniperLine, formatDate } from '#lib/i18n/index.ts';

  let checkinOpen = $state(false);
  let partnerOpen = $state(false);
  /** Short-lived reactions on the island (style guide §7.4). */
  let partnerCheer = $state(false);
  let meCheer = $state(false);
  const view = $derived(week.view);
  const pending = $derived(view?.pending[0] ?? null);
  const checkedIn = $derived(!!view && (view.people[view.me].habits?.ticksByDate[view.today] ?? []).length > 0);
  const line = $derived.by(() => {
    if (!view) return '';
    const key = view.juniper.key.replace(/^juniper\./, '');
    // M6: the pending card already asks; Juniper says something else.
    if (key === 'pending_confirm') return t('juniper.default');
    return juniperLine(view.juniper.key, view.juniper.params);
  });

  function answer(yes: boolean) {
    if (!pending) return;
    confirmPending(pending.kind, pending.id, yes);
    if (yes) week.showToast(t('pending.saved'), 1600);
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

  // M5: tell me when my partner sent a high-five today (once per new one, per device).
  $effect(() => {
    const v = week.view;
    if (!v || v.highFivesToday <= 0) return;
    const k = `hf-seen:${v.today}`;
    const seen = Number(localStorage.getItem(k) ?? 0);
    if (v.highFivesToday > seen) {
      localStorage.setItem(k, String(v.highFivesToday));
      setTimeout(() => {
        partnerCheer = true;
        week.showToast(t('island.highfiveGot', { name: v.people[v.partner].villagerName }), 3200);
        setTimeout(() => (partnerCheer = false), 2600);
      }, 700);
    }
  });
</script>

{#if view}
  <main class="island">
    <div class="top">
      <IslandScene {view} onhighfive={() => (partnerOpen = true)}
        partnerExpression={partnerCheer ? 'cheer' : undefined} partnerEmote={partnerCheer ? 'heart' : false}
        meExpression={meCheer ? 'cheer' : undefined} meEmote={meCheer} />
      <div class="head">
        <SyncPill />
        <HelpButton topic="island" />
      </div>
    </div>

    <div class="below">
      <Bubble text={line} host="wave" size={96} />

      {#if pending}
        <div class="pending card" role="group" aria-labelledby="pending-q">
          <span class="tape">{pending.label} · {formatDate(pending.date)}</span>
          <b class="q" id="pending-q">{t('pending.strength')}</b>
          <div class="yn">
            <button type="button" class="btn paper" onclick={() => answer(false)}>{t('common.no')}</button>
            <button type="button" class="btn" onclick={() => answer(true)}>{t('common.yes')}</button>
          </div>
        </div>
      {:else}
        <button type="button" class="btn cta" class:paper={checkedIn} onclick={() => (checkinOpen = true)}>
          {#if checkedIn}<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-check" /></svg>{t('island.checkedIn')}
          {:else}<svg viewBox="0 0 48 48" aria-hidden="true"><use href="#i-bowl" /></svg>{t('island.checkin')}{/if}
        </button>
      {/if}
    </div>
  </main>
  <CheckinSheet bind:open={checkinOpen} onclose={celebrate} />
  <PartnerSheet bind:open={partnerOpen} onhighfive={sendHighFive} />
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
  .cta, .pending { position: sticky; bottom: calc(var(--tabbar-h) + var(--safe-bottom) + 18px); z-index: 7; }
  .pending { display: grid; gap: 12px; padding: 24px 14px 10px; margin-top: 6px; box-shadow: var(--sh-lip), var(--sh-float); }
  .pending .tape { --tape: var(--c-sky-soft); max-width: calc(100% - 32px); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: block; }
  .q { font-size: var(--fs-h2); font-weight: 900; line-height: 1.3; text-align: center; word-break: auto-phrase; }
  .yn { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  /* iPhone SE-height screens: trim empty sky so the scene, しずえ and the button fit. */
  @media (max-height: 720px) {
    .top { margin-top: -26cqw; }
    .head { top: calc(var(--safe-top) + 8px + 26cqw); }
    .below { gap: 8px; }
    .below :global(.spk img) { height: 64px !important; }
    .below :global(.spk) { min-height: 64px; }
    /* Compact yes/no: question beside the two buttons. */
    .pending { grid-template-columns: 1fr auto; align-items: center; padding: 20px 10px 8px 14px; gap: 8px; }
    .q { font-size: var(--fs-body-lg); text-align: left; }
    .yn { grid-template-columns: auto auto; gap: 8px; }
    .yn .btn { width: auto; min-width: 68px; padding: 0 14px; }
  }
</style>
