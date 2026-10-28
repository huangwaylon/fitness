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
  .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--leaf); animation: twinkle 1s ease-in-out infinite; }
  .demo { background: var(--sun); color: var(--ink); border-radius: var(--r-pill); padding: 1px 7px; font-size: var(--fs-micro); }
</style>
