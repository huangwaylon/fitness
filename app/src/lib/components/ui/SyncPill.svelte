<script lang="ts">
  // Sync chip under the HUD row: shown only when sync is not ok (offline, or the last refresh
  // or send failed). A lasting system state, so it is a chip, not しずえ. Tap = retry now (flush + refresh);
  // while that runs it says 同期中…. Offline, the taps waiting to go (sync/queue.ts) are counted on it, and its label
  // says when the record last came. Online with a write waiting over 2 minutes (backed off, set aside: queue.ts
  // unsentStuck, 2026-11-08), it says so: 「おくれて いない きろく {n} · タップで おくる」, and a tap sends the set-aside
  // ones too. A failed save (data may be lost) is the store's one banner + R17 instead.
  import { week } from '#lib/store/week.svelte.ts';
  import { queued, unsentStuck } from '#lib/sync/queue.ts';
  import { t } from '#lib/i18n/index.ts';
  import { formatSyncTime } from '#lib/i18n/format.ts';
  import { dayKey, minuteNow } from '#lib/time/clock.ts';

  const time = $derived(week.lastSync ? formatSyncTime(week.lastSync, dayKey()) : t('sync.never'));
  // (the view recomputes as a tap is queued and as one is acked: the count follows it; the minute tick for the wait)
  const waiting = $derived((void week.view, week.offline ? queued().length : 0));
  const stuck = $derived((void week.view, week.offline || week.demo ? 0 : unsentStuck(minuteNow().getTime())));
  const label = $derived(week.syncing ? t('sync.syncing') : t('sync.retryLabel', { time }) + (waiting ? t('sync.queuedLabel', { n: waiting }) : ''));
</script>

{#if week.offline}
  <button type="button" class="chip" aria-label={label} aria-disabled={week.syncing} data-sfx="sync" data-sync-waiting={waiting} onclick={() => week.refresh({ unpark: true })}>
    <svg viewBox="0 0 24 24" class:spin={week.syncing} aria-hidden="true"><use href="#i-sync" /></svg>
    <span aria-hidden="true">{week.syncing ? t('sync.syncing') : t('sync.offline')}</span>
    {#if waiting && !week.syncing}<span class="n" aria-hidden="true">{t('sync.queued', { n: waiting })}</span>{/if}
  </button>
{:else if stuck}
  <button type="button" class="chip" aria-disabled={week.syncing} data-sfx="sync" data-sync-stuck={stuck} onclick={() => week.refresh({ unpark: true })}>
    <svg viewBox="0 0 24 24" class:spin={week.syncing} aria-hidden="true"><use href="#i-sync" /></svg>
    <span>{week.syncing ? t('sync.syncing') : t('sync.stuck', { n: stuck })}</span>
  </button>
{/if}

<style>
  .chip {
    appearance: none; border: 0; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;
    min-height: 32px; padding: 0 12px 0 9px; border-radius: var(--r-chip);
    background: var(--c-card); color: var(--c-ink); box-shadow: var(--sh-obj); font: 700 var(--fs-s)/1 var(--font-ui);
    position: relative;
  }
  /* A 44px tap target around the 32px chip. */
  .chip::after { content: ''; position: absolute; inset: -6px -4px; }
  .chip:active { transform: translateY(3px); box-shadow: var(--sh-obj-press); }
  .chip[aria-disabled='true'] { cursor: default; }
  svg { width: 14px; height: 14px; color: var(--c-coral); flex: none; }
  /* the waiting count: a small coral-ringed tag */
  .n { padding: 3px 7px; margin-right: -5px; border-radius: var(--r-pill); color: var(--coral-text); box-shadow: inset 0 0 0 1.5px currentColor; }
  .spin { animation: spin 1s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
</style>
