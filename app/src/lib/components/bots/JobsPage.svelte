<script lang="ts">
  // ボット's 定期処理 tab (docs/bots.md "定期処理"): every other recurring job, as the relay's GET /jobs reports it
  // (lib/jobs/status.ts), on BotPage: the verdict over the rows (順調 · 一部不調 · 不調, the rows in trouble named; 「!」
  // for a 不調 row or an open alert issue), 確認が必要 with the open alert issues (each a link), then a section per
  // place it runs (サーバー · GitHub · ボット), a card of rows each (JobRow: name, cadence, the last run's age, its
  // dot and its last runs' strip; a tap unfolds its detail, one at a time), and 詳しく (the GitHub copy's time, its
  // token, its failure). Read while shown (useBot.svelte.ts); offline, the last copy (lastKnown) under LoadError.
  import { t } from '#lib/i18n/index.ts';
  import { minuteNow } from '#lib/time/clock.ts';
  import { issueUrl, type JobId, type JobsStatus } from '#lib/contract/jobs.ts';
  import { agoOf, factRows, grouped } from '#lib/jobs/status.ts';
  import { driver } from '#lib/jobs/bot.ts';
  import type { BotId } from './registry.ts';
  import BotPage from './BotPage.svelte';
  import JobRow from './JobRow.svelte';
  import { useBot } from './useBot.svelte.ts';

  let { onopen }: { onopen?: (tab: BotId) => void } = $props();

  const bot = useBot<JobsStatus>('jobs', driver);
  const now = $derived(minuteNow().getTime());
  const data = $derived(bot.data);
  const verdict = $derived(data && driver.verdict(data, now));
  const groups = $derived(data ? grouped(data) : []);
  const alerts = $derived(data?.alerts ?? []);
  /** The row unfolded (one at a time). */
  let openId = $state<JobId | null>(null);
</script>

<BotPage attr="jobs" busy={bot.poll.loading} {bot} onretry={() => void bot.poll.refresh()} {verdict} vid={verdict?.w} {now}
  attention={alerts.length ? { lines: alerts.map((a) => t('jobs.alert', { title: a.title, ago: agoOf(a.at, now) })), links: alerts.slice(0, 3).map((a) => ({ id: String(a.n), href: issueUrl(a.n), label: alerts.length > 1 ? `${t('jobs.alertLink')} #${a.n}` : t('jobs.alertLink') })) } : null}
  facts={data ? factRows(data, now) : []}>
  {#each groups as g (g.group)}
    {#if g.rows.length}
      <section class="sec" aria-labelledby="jobs-g-{g.group}" data-jobs-group={g.group}>
        <h3 id="jobs-g-{g.group}" class="sec-label">{t(`jobs.g.${g.group}`)}</h3>
        <ul class="card jobs">
          {#each g.rows as row (row.id)}
            <JobRow {row} {now} open={openId === row.id} ontoggle={() => (openId = openId === row.id ? null : row.id)} onopen={(tab) => onopen?.(tab)} />
          {/each}
        </ul>
      </section>
    {/if}
  {/each}
</BotPage>

<style>
  .jobs { list-style: none; margin: 0; padding: 0; overflow: hidden; }
</style>
