<script lang="ts">
  // ボット's 定期処理 tab (docs/bots.md "定期処理"): every recurring job, as the relay's GET /jobs reports it, with the
  // Kalori scraper's status.json for メニューの更新 (once its own tab) (lib/jobs/status.ts), on BotPage: the verdict over
  // the rows by their latest state (順調 · 一部不調 · 不調, the rows in trouble named, the recovered and the first runs to
  // come said; 「!」 for a 不調 row, an open alert issue or メニュー 保留), 確認が必要 with the open alert issues and
  // メニュー's step and PR (each a link), then 要確認 (the rows in trouble, the worst first) and a section per purpose
  // (データの更新 · 見守り・バックアップ · 配信・テスト), a card of rows each (JobRow: name, cadence, the last run's age or
  // 初回, its dot and its last runs' strip; a tap unfolds its detail, one at a time), and 詳しく. Read while shown
  // (useBot.svelte.ts); offline, the last copy (lastKnown) under LoadError. `openRow`: a row unfolded at first (an
  // old link to メニュー: its row).
  import { untrack } from 'svelte';
  import { t } from '#lib/i18n/index.ts';
  import { minuteNow } from '#lib/time/clock.ts';
  import { issueUrl, type JobId } from '#lib/contract/jobs.ts';
  import { agoOf, factRows, menuAttention, sections, type JobsView } from '#lib/jobs/status.ts';
  import { driver } from '#lib/jobs/bot.ts';
  import type { BotId } from './registry.ts';
  import BotPage from './BotPage.svelte';
  import JobRow from './JobRow.svelte';
  import { useBot } from './useBot.svelte.ts';

  let { onopen, openRow = null }: { onopen?: (tab: BotId) => void; openRow?: JobId | null } = $props();

  const bot = useBot<JobsView>('jobs', driver);
  const now = $derived(minuteNow().getTime());
  const data = $derived(bot.data);
  const verdict = $derived(data && driver.verdict(data, now));
  const groups = $derived(data ? sections(data, now) : []);
  const alerts = $derived(data?.alerts ?? []);
  const menu = $derived(data ? menuAttention(data, now) : { lines: [], pr: null });
  const attention = $derived(alerts.length || menu.lines.length || menu.pr ? {
    lines: [...alerts.map((a) => t('jobs.alert', { title: a.title, ago: agoOf(a.at, now) })), ...menu.lines],
    links: [
      ...alerts.slice(0, 3).map((a) => ({ id: String(a.n), href: issueUrl(a.n), label: alerts.length > 1 ? `${t('jobs.alertLink')} #${a.n}` : t('jobs.alertLink') })),
      ...(menu.pr ? [{ id: 'pr', href: menu.pr, label: t('bots.attn.pr') }] : [])
    ]
  } : null);
  /** The row unfolded (one at a time). */
  let openId = $state<JobId | null>(untrack(() => openRow));
</script>

<BotPage attr="jobs" busy={bot.poll.loading} {bot} onretry={() => void bot.poll.refresh()} {verdict} vid={verdict?.w} {now} {attention}
  facts={data ? factRows(data, now) : []}>
  {#each groups as g (g.id)}
    {#if g.rows.length}
      <section class="sec" aria-labelledby="jobs-g-{g.id}" data-jobs-group={g.id}>
        <h3 id="jobs-g-{g.id}" class="sec-label">{t(`jobs.g.${g.id}`)}</h3>
        <ul class="card jobs">
          {#each g.rows as x (x.row.id)}
            <JobRow row={x.row} h={x.h} kalori={x.row.id === 'kalori-scrape' ? (data?.kalori ?? null) : null} {now} open={openId === x.row.id}
              ontoggle={() => (openId = openId === x.row.id ? null : x.row.id)} onopen={(tab) => onopen?.(tab)} />
          {/each}
        </ul>
      </section>
    {/if}
  {/each}
</BotPage>

<style>
  .jobs { list-style: none; margin: 0; padding: 0; overflow: hidden; }
</style>
