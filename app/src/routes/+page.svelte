<script lang="ts">
  // 島 Island: two trees, two scores, the jar total, one Juniper line, one button.
  import IslandScene from '#lib/components/IslandScene.svelte';
  import Bubble from '#lib/components/Bubble.svelte';
  import CheckinSheet from '#lib/components/CheckinSheet.svelte';
  import HelpButton from '#lib/components/HelpButton.svelte';
  import SyncPill from '#lib/components/SyncPill.svelte';
  import { week } from '#lib/client/week.svelte.ts';
  import { highFive, confirmPending } from '#lib/client/actions.ts';
  import { t, juniperLine, formatDate } from '#lib/i18n/index.ts';

  let checkinOpen = $state(false);
  const view = $derived(week.view);
  const pending = $derived(view?.pending[0] ?? null);

  function sendHighFive() {
    if (!view) return;
    highFive();
    week.showToast(t('island.highfiveSent'), 1600);
  }
</script>

{#if view}
  <main class="island">
    <div class="top">
      <IslandScene {view} onhighfive={sendHighFive} />
      <div class="head">
        <SyncPill />
        <HelpButton topic="island" />
      </div>
    </div>

    <div class="below">
      <Bubble text={juniperLine(view.juniper.key, view.juniper.params)} />

      {#if pending}
        <div class="pending card" role="group" aria-label={t('pending.strength')}>
          <div class="ptxt">
            <span class="plabel">{pending.label} · {formatDate(pending.date)}</span>
            <b>{t('pending.strength')}</b>
          </div>
          <button type="button" class="btn small" onclick={() => confirmPending(pending.kind, pending.id, true)}>{t('common.yes')}</button>
          <button type="button" class="btn small quiet" onclick={() => confirmPending(pending.kind, pending.id, false)}>{t('common.no')}</button>
        </div>
      {/if}

      <button type="button" class="btn cta" onclick={() => (checkinOpen = true)}>
        <svg viewBox="0 0 48 48" aria-hidden="true"><use href="#i-bowl" /></svg>{t('island.checkin')}
      </button>
    </div>
  </main>
  <CheckinSheet bind:open={checkinOpen} />
{/if}

<style>
  .island {
    max-width: var(--col); margin: 0 auto;
    padding-bottom: calc(var(--tabbar-h) + var(--safe-bottom) + 24px);
  }
  .top { position: relative; }
  .head {
    position: absolute; z-index: 8; top: calc(var(--safe-top) + 8px); left: calc(20px + var(--safe-left)); right: calc(20px + var(--safe-right));
    display: flex; justify-content: space-between; align-items: center;
  }
  .below { padding: 0 calc(20px + var(--safe-right)) 0 calc(20px + var(--safe-left)); margin-top: -18px; position: relative; z-index: 6; display: grid; gap: 14px; }
  .pending { display: flex; align-items: center; gap: 8px; padding: 10px 12px; }
  .ptxt { flex: 1; min-width: 0; display: grid; line-height: 1.3; }
  .plabel { font-size: var(--fs-caption); color: var(--text-faint); font-weight: 700; }
  .pending b { font-size: var(--fs-body); }
  .pending .btn.small { padding: 0 14px; }
  /* The one primary action stays in the thumb zone, above the tab bar, even on short phones. */
  .cta { margin-top: 4px; position: sticky; bottom: calc(var(--tabbar-h) + var(--safe-bottom) + 18px); z-index: 7; }
  .top { container-type: inline-size; }
  /* iPhone SE-height screens: trim empty sky so the scene, Juniper and the button fit. */
  @media (max-height: 720px) {
    .top { margin-top: -18cqw; }
    .head { top: calc(var(--safe-top) + 8px + 18cqw); }
  }
</style>
