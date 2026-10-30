<script lang="ts">
  // Sync chip under the HUD clock (review r6 (c)): shown only when sync is not ok (offline, or the last refresh
  // or send failed). A lasting system state, so it is a chip, not しずえ. Tap = retry now (flush + refresh);
  // while that runs it says 同期中…. A failed save (data may be lost) is the store's one banner + R17 instead.
  import { week } from '#lib/store/week.svelte.ts';
  import { t } from '#lib/i18n/index.ts';
  import { formatSyncTime } from '#lib/i18n/format.ts';

  const time = $derived(week.lastSync ? formatSyncTime(week.lastSync) : t('sync.never'));
</script>

{#if week.offline}
  <button type="button" class="chip" aria-label={week.syncing ? t('sync.syncing') : t('sync.retryLabel', { time })}
    aria-disabled={week.syncing} data-sfx="sync" onclick={() => week.refresh()}>
    <svg viewBox="0 0 24 24" class:spin={week.syncing} aria-hidden="true"><use href="#i-sync" /></svg>
    <span aria-hidden="true">{week.syncing ? t('sync.syncing') : t('sync.offline')}</span>
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
  .spin { animation: spin 1s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @media (prefers-reduced-motion: reduce) { .spin { animation: none; } }
</style>
