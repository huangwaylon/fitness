<script lang="ts">
  import { week } from '#lib/client/week.svelte.ts';
  import { t, formatSyncTime, formatDate } from '#lib/i18n/index.ts';

  /** Default text when idle (e.g. today's date). */
  let { idle = '' }: { idle?: string } = $props();
  const time = $derived(week.lastSync ? formatSyncTime(week.lastSync) : '');
</script>

<span class="pill" role="status" aria-live="polite">
  {#if week.syncing && !week.view}
    {t('sync.syncing')}
  {:else if week.offline}
    {t('sync.offline', { time })}
  {:else if week.syncing}
    <span class="dot" aria-hidden="true"></span>{idle || t('sync.syncing')}
  {:else}
    {idle || (week.view ? formatDate(week.view.today) : '')}
  {/if}
  {#if week.demo}<span class="demo">{t('demo.badge')}</span>{/if}
</span>

<style>
  .pill { font-family: var(--font-num); font-weight: 600; font-size: .9rem; padding: 6px 14px; }
  .dot { width: 9px; height: 9px; border-radius: 50%; background: var(--c-leaf); animation: twinkle 1s ease-in-out infinite; }
  .demo { background: var(--c-yuzu); color: var(--c-ink); border-radius: var(--r-pill); padding: 2px 8px; font: 700 var(--fs-micro) var(--font-ui); }
</style>
