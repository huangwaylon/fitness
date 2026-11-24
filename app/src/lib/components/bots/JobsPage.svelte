<script lang="ts">
  // ボット's Jobs tab (docs/bots.md "Jobs"), English only whatever the app's language (the user's ask, 2026-11-24: the
  // page pins it, lang="en" for VoiceOver; its strings one English catalog, i18n/jobs.ts): every recurring job, as the
  // relay's GET /jobs reports it, with the Kalori scraper's status.json for Menu update (lib/jobs/status.ts), on
  // BotPage: the verdict over the rows by their latest state (Healthy · Some trouble · Failing, the rows in trouble
  // named, the recovered and the first runs to come said; 「!」 for a failing row, an open alert issue or a held Menu
  // update), Needs a look with the open alert issues (their titles readable: specNames.ts alertTitle) and Menu update's step and PR (each a link), then Needs attention
  // (the rows in trouble, the worst first) and a section per purpose (Data updates · Monitoring & backups · Deploys &
  // tests), a card of rows each (JobRow: name, cadence, the last run's age or its first run, its dot and its last
  // runs' strip; a tap unfolds its detail, one at a time), and More. Read while shown (useBot.svelte.ts); offline, the
  // last copy (lastKnown) under LoadError. `openRow`: a row unfolded at first (an old link to メニュー: its row).
  import { untrack } from 'svelte';
  import { inLocale, pinLocale, t } from '#lib/i18n/index.ts';
  import { minuteNow } from '#lib/time/clock.ts';
  import { issueUrl, type JobId } from '#lib/contract/jobs.ts';
  import { agoOf, factRows, menuAttention, sections, type JobsView } from '#lib/jobs/status.ts';
  import { driver } from '#lib/jobs/bot.ts';
  import { alertTitle } from '#lib/jobs/specNames.ts';
  import type { BotId } from './registry.ts';
  import BotPage from './BotPage.svelte';
  import JobRow from './JobRow.svelte';
  import { useBot } from './useBot.svelte.ts';

  let { onopen, openRow = null }: { onopen?: (tab: BotId) => void; openRow?: JobId | null } = $props();

  pinLocale('en');
  const bot = useBot<JobsView>('jobs', driver);
  const now = $derived(minuteNow().getTime());
  const data = $derived(bot.data);
  const verdict = $derived(data && driver.verdict(data, now));
  const groups = $derived(data ? sections(data, now) : []);
  const alerts = $derived(data?.alerts ?? []);
  const menu = $derived(data ? menuAttention(data, now) : { lines: [], pr: null });
  const attention = $derived(alerts.length || menu.lines.length || menu.pr ? inLocale('en', () => ({
    lines: [...alerts.map((a) => t('jobs.alert', { title: alertTitle(a.title), ago: agoOf(a.at, now) })), ...menu.lines],
    links: [
      ...alerts.slice(0, 3).map((a) => ({ id: String(a.n), href: issueUrl(a.n), label: alerts.length > 1 ? `${t('jobs.alertLink')} #${a.n}` : t('jobs.alertLink') })),
      ...(menu.pr ? [{ id: 'pr', href: menu.pr, label: t('bots.attn.pr') }] : [])
    ]
  })) : null);
  /** The row unfolded (one at a time). */
  let openId = $state<JobId | null>(untrack(() => openRow));
</script>

<BotPage attr="jobs" rootAttr={{ lang: 'en' }} busy={bot.poll.loading} {bot} onretry={() => void bot.poll.refresh()} {verdict} vid={verdict?.w} {now} {attention}
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
