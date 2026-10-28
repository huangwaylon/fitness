<script lang="ts">
  // Status pill over the sky: today's date, or syncing / offline. Demo builds get a badge.
  import { week } from '#lib/client/week.svelte.ts';
  import { t, formatSyncTime, formatDate } from '#lib/i18n/index.ts';

  const time = $derived(week.lastSync ? formatSyncTime(week.lastSync) : '');
</script>

<span class="pill" class:off={week.offline} role="status" aria-live="polite">
  {#if week.offline}
    {t('sync.offline', { time })}
  {:else}
    {#if week.syncing}<span class="dot" aria-hidden="true"></span>{/if}
    {week.view ? formatDate(week.view.today) : t('sync.syncing')}
  {/if}
  {#if week.demo}<span class="demo">{t('demo.badge')}</span>{/if}
</span>

<style>
  .pill { font-family: var(--font-num); font-weight: 600; font-size: .95rem; padding: 6px 14px; min-height: 40px; }
  .pill.off { font-family: var(--font-ui); font-size: var(--fs-caption); }
  .dot { width: 9px; height: 9px; border-radius: 50%; background: var(--c-leaf); animation: twinkle 1s ease-in-out infinite; }
  .demo { background: var(--c-yuzu); color: var(--c-ink); border-radius: var(--r-pill); padding: 3px 9px; font: 700 var(--fs-micro) var(--font-ui); }
</style>
