<script lang="ts">
  // 島 Island: two trees, two scores, the jar total, one Juniper line, ONE primary action.
  // While a confirmation is pending, its yes/no card replaces the check-in button (review M6),
  // and Juniper doesn't repeat the question. After today's check-in the button goes quiet.
  import IslandScene from '#lib/components/IslandScene.svelte';
  import Bubble from '#lib/components/Bubble.svelte';
  import CheckinSheet from '#lib/components/CheckinSheet.svelte';
  import HelpButton from '#lib/components/HelpButton.svelte';
  import SyncPill from '#lib/components/SyncPill.svelte';
  import { week } from '#lib/client/week.svelte.ts';
  import { highFive, confirmPending } from '#lib/client/actions.ts';
  import { t, juniperLine, formatDate } from '#lib/i18n/index.ts';

  let checkinOpen = $state(false);
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
      <IslandScene {view} onhighfive={sendHighFive}
        partnerExpression={partnerCheer ? 'cheer' : undefined} partnerEmote={partnerCheer ? 'heart' : false}
        meExpression={meCheer ? 'cheer' : undefined} meEmote={meCheer} />
      <div class="head">
        <SyncPill />
        <HelpButton topic="island" />
      </div>
    </div>

    <div class="below">
      <Bubble text={line} expression={meCheer || partnerCheer ? 'cheer' : 'happy'} />

      {#if pending}
        <div class="pending card" role="group" aria-label={t('pending.strength')}>
          <span class="tape">{pending.label} · {formatDate(pending.date)}</span>
          <b class="q">{t('pending.strength')}</b>
          <button type="button" class="btn paper small" onclick={() => confirmPending(pending.kind, pending.id, false)}>{t('common.no')}</button>
          <button type="button" class="btn small" onclick={() => confirmPending(pending.kind, pending.id, true)}>{t('common.yes')}</button>
        </div>
      {:else}
        <button type="button" class="btn cta" class:paper={checkedIn} onclick={() => (checkinOpen = true)}>
          <svg viewBox="0 0 48 48" aria-hidden="true"><use href="#i-bowl" /></svg>{checkedIn ? t('island.checkedIn') : t('island.checkin')}
        </button>
      {/if}
    </div>
  </main>
  <CheckinSheet bind:open={checkinOpen} onclose={celebrate} />
{/if}

<style>
  .island {
    max-width: var(--col); margin: 0 auto;
    padding-bottom: calc(var(--tabbar-h) + var(--safe-bottom) + 24px);
  }
  .top { position: relative; container-type: inline-size; }
  .head {
    position: absolute; z-index: 8; top: calc(var(--safe-top) + 8px); left: calc(16px + var(--safe-left)); right: calc(16px + var(--safe-right));
    display: flex; justify-content: space-between; align-items: center;
  }
  .island { container-type: inline-size; }
  .below {
    padding: 0 calc(18px + var(--safe-right)) 0 calc(18px + var(--safe-left)); margin-top: -11cqw; position: relative; z-index: 6;
    display: grid; gap: 12px;
  }
  .pending {
    display: flex; align-items: center; gap: 8px; padding: 22px 12px 10px 16px; margin-top: 6px;
    position: sticky; bottom: calc(var(--tabbar-h) + var(--safe-bottom) + 18px); z-index: 7; box-shadow: var(--sh-lip), var(--sh-float);
  }
  .pending .tape { --tape: var(--c-sky-soft); }
  .q { flex: 1; font-size: var(--fs-body); font-weight: 900; line-height: 1.3; text-wrap: balance; word-break: keep-all; overflow-wrap: anywhere; }
  .pending .btn { min-width: 64px; padding: 0 14px; }
  /* The one primary action stays in the thumb zone, above the dock, even on short phones. */
  .cta { position: sticky; bottom: calc(var(--tabbar-h) + var(--safe-bottom) + 18px); z-index: 7; }
  /* iPhone SE-height screens: trim empty sky so the scene, Juniper and the button fit. */
  @media (max-height: 720px) {
    .top { margin-top: -26cqw; }
    .head { top: calc(var(--safe-top) + 8px + 26cqw); }
  }
</style>
