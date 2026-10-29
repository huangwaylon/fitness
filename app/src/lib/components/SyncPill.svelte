<script lang="ts">
  // Sync chip under the HUD clock: shown only when sync is not ok (offline, or the last refresh failed).
  import { week } from '#lib/client/week.svelte.ts';
  import { t, formatSyncTime } from '#lib/i18n/index.ts';

  const time = $derived(week.lastSync ? formatSyncTime(week.lastSync) : '');
</script>

{#if week.offline}
  <span class="chip" role="status" aria-live="polite">{t('sync.offline', { time })}</span>
{/if}

<style>
  .chip {
    display: inline-flex; align-items: center; min-height: 28px; padding: 0 10px; border-radius: var(--r-chip);
    background: var(--c-cream); color: var(--c-ink); box-shadow: 0 3px 0 var(--c-lip); font: 700 var(--fs-s)/1 var(--font-ui);
  }
</style>
