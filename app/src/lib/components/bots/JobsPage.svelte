<script lang="ts" module>
  import type { JobId } from '#lib/contract/jobs.ts';
  import type { UsageKey } from '#lib/contract/jobs.ts';
  /** A row to unfold: a job's, ジム's / 保養所's (Services), or a Cloudflare limit's. */
  export type JobsRow = JobId | 'svc-gym' | 'svc-its' | `cf-${UsageKey}`;
</script>

<script lang="ts">
  // ボット's Jobs tab (docs/bots.md "Jobs"), English only whatever the app's language (the user's ask, 2026-11-24: the
  // page pins it, lang="en" for VoiceOver; its strings one English catalog, i18n/jobs.ts): every recurring job, as the
  // relay's GET /jobs reports it, with the Kalori scraper's status.json for Menu update (lib/jobs/status.ts), and the
  // ジム and 保養所 bots' status (their tabs' cards till 2026-11-25), on BotPage: the verdict over the job rows by their
  // latest state (Healthy · Some trouble · Failing, the rows in trouble named, the recovered and the first runs to
  // come said; 「!」 for a failing row, an open alert issue or a held Menu update), Needs a look with the open alert
  // issues (their titles readable: specNames.ts alertTitle) and Menu update's step and PR (each a link), then Needs
  // attention (the job rows in trouble, the worst first), Services (ServiceRow: Gym bot, ITS bot, read here as their
  // tabs read them: useBot; then the bots' own jobs) and a section per purpose (Data updates · Monitoring & backups ·
  // Deploys & tests), the Cloudflare free tier (UsageRow: a row per daily limit, its share used and a bar, the reset's
  // countdown in the heading; first after Needs attention while one is at 60 % or more, else last; while /jobs fails
  // with the usage, the record over a limit: from that, under LoadError), a card of rows each (JobRow: name, cadence, the last run's age or its first run, its dot and its
  // last runs' strip; a tap unfolds its detail, one row at a time), and More. Read while shown; offline, the last copy
  // (lastKnown) under LoadError. `openRow`: a row unfolded at first (an old link to メニュー, a bot page's dot).
  import { untrack } from 'svelte';
  import { inLocale, pinLocale, t } from '#lib/i18n/index.ts';
  import { dayKey, minuteNow } from '#lib/time/clock.ts';
  import { issueUrl } from '#lib/contract/jobs.ts';
  import { agoOf, factRows, menuAttention, sections, usageView, type JobsView } from '#lib/jobs/status.ts';
  import { driver } from '#lib/jobs/bot.ts';
  import { outage } from '#lib/jobs/outage.svelte.ts';
  import { alertTitle } from '#lib/jobs/specNames.ts';
  import { driver as gymDriver } from '#lib/gym/bot.ts';
  import { checkStrip, edges as gymEdges, factRows as gymFacts, reasonLines, type GymStatus } from '#lib/gym/status.ts';
  import { driver as itsDriver } from '#lib/its/bot.ts';
  import { attentionLines, bookingRows, edges as itsEdges, factRows as itsFacts, minuteCells, scanStrip } from '#lib/its/view.ts';
  import type { ItsStatus } from '#lib/its/contract.ts';
  import type { BotId } from './registry.ts';
  import { botTabs } from './open.svelte.ts';
  import BotPage from './BotPage.svelte';
  import JobRow from './JobRow.svelte';
  import ServiceRow, { type ServiceView } from './ServiceRow.svelte';
  import UsageRow from './UsageRow.svelte';
  import { useBot } from './useBot.svelte.ts';

  let { onopen, openRow = null }: { onopen?: (tab: BotId) => void; openRow?: JobsRow | null } = $props();

  pinLocale('en');
  const bot = useBot<JobsView>('jobs', driver);
  // the bots this phone has (BotsSheet's tabs): read while Jobs is shown, as their own tabs read them
  const tabs = botTabs();
  const gym = tabs.includes('gym') ? useBot<GymStatus>('gym', gymDriver) : null;
  const its = tabs.includes('its') ? useBot<ItsStatus>('its', itsDriver) : null;
  const now = $derived(minuteNow().getTime());
  const data = $derived(bot.data);
  const verdict = $derived(data && driver.verdict(data, now));
  /** The sections (Services even before /jobs answers: the bots read on their own). */
  const groups = $derived(data ? sections(data, now) : [{ id: 'bots' as const, rows: [] }]);
  const alerts = $derived(data?.alerts ?? []);
  const menu = $derived(data ? menuAttention(data, now) : { lines: [], pr: null });
  const attention = $derived(alerts.length || menu.lines.length || menu.pr ? inLocale('en', () => ({
    lines: [...alerts.map((a) => t('jobs.alert', { title: alertTitle(a.title), ago: agoOf(a.at, now) })), ...menu.lines],
    links: [
      ...alerts.slice(0, 3).map((a) => ({ id: String(a.n), href: issueUrl(a.n), label: alerts.length > 1 ? `${t('jobs.alertLink')} #${a.n}` : t('jobs.alertLink') })),
      ...(menu.pr ? [{ id: 'pr', href: menu.pr, label: t('bots.attn.pr') }] : [])
    ]
  })) : null);
  /** The bots' rows, in English (their pages' words, the drivers' verdicts). */
  const gymView = $derived.by((): ServiceView | null => {
    const s = gym?.data;
    return s ? inLocale('en', () => ({ verdict: gymDriver.verdict(s, now), vid: s.verdict, strip: { ...checkStrip(s), ...gymEdges(s, now) }, lines: reasonLines(s), facts: gymFacts(s, now) })) : null;
  });
  const itsView = $derived.by((): ServiceView | null => {
    const s = its?.data;
    if (!s) return null;
    return inLocale('en', () => {
      const today = dayKey(minuteNow());
      const cells = s.recentMinutes ? minuteCells(s.recentMinutes, s.now) : [];
      const strip = cells.length ? { ...scanStrip(cells, s.mode === 'on' && !s.settings.paused), ...itsEdges(s, bookingRows(s, today, now), now) } : null;
      return { verdict: itsDriver.verdict(s, now), vid: s.verdict, strip, lines: attentionLines(s), facts: itsFacts(s, today) };
    });
  });
  const services = $derived([...(gym ? [{ id: 'gym' as const, b: gym, view: gymView }] : []), ...(its ? [{ id: 'its' as const, b: its, view: itsView }] : [])]);
  /** The Cloudflare free tier (null: a relay from before it). */
  // (/jobs failing with the free tier's usage, the record over a limit: that, beside LoadError)
  const usageNow = $derived(bot.failed && outage.usage ? outage.usage : data?.usage);
  const usage = $derived(usageView(usageNow, now));
  /** The row unfolded (one at a time). */
  let openId = $state<JobsRow | null>(untrack(() => openRow));
  const toggle = (id: JobsRow) => (openId = openId === id ? null : id);
</script>

{#snippet cf()}
  {#if usage}
    <section class="sec" aria-labelledby="jobs-g-cf" data-jobs-group="cf">
      <h3 id="jobs-g-cf" class="sec-label cf-h"><span>{t('jobs.cf.title')}</span>{#if usage.rows.length}<span class="n" data-jobs-cf-resets>{usage.resets}</span>{/if}</h3>
      <ul class="card jobs">
        {#each usage.rows as r (r.k)}
          <UsageRow row={r} asOf={usage.asOf} open={openId === `cf-${r.k}`} ontoggle={() => toggle(`cf-${r.k}`)} />
        {/each}
        {#if usage.note}<li class="cf-note" data-jobs-cf-note>{usage.note}</li>{/if}
      </ul>
    </section>
  {/if}
{/snippet}

<BotPage attr="jobs" rootAttr={{ lang: 'en' }} busy={bot.poll.loading} {bot} onretry={() => void bot.poll.refresh()} {verdict} vid={verdict?.w} {now} {attention}
  facts={data ? factRows(data, now) : []}>
  {#each groups as g (g.id)}
    {@const bots = g.id === 'bots' ? services : []}
    {#if g.id === 'bots' && usage?.trouble}{@render cf()}{/if}
    {#if g.rows.length || bots.length}
      <section class="sec" aria-labelledby="jobs-g-{g.id}" data-jobs-group={g.id}>
        <h3 id="jobs-g-{g.id}" class="sec-label">{t(`jobs.g.${g.id}`)}</h3>
        <ul class="card jobs">
          {#each bots as x (x.id)}
            <ServiceRow id={x.id} view={x.view} stale={x.b.stale} failed={x.b.failed} readAt={x.b.readAt} {now} open={openId === `svc-${x.id}`}
              ontoggle={() => toggle(`svc-${x.id}`)} onopen={(tab) => onopen?.(tab)} />
          {/each}
          {#each g.rows as x (x.row.id)}
            <JobRow row={x.row} h={x.h} kalori={x.row.id === 'kalori-scrape' ? (data?.kalori ?? null) : null} {now} open={openId === x.row.id}
              ontoggle={() => toggle(x.row.id)} onopen={(tab) => onopen?.(tab)} />
          {/each}
        </ul>
      </section>
    {/if}
  {/each}
  {#if !usage?.trouble}{@render cf()}{/if}
</BotPage>

<style>
  .jobs { list-style: none; margin: 0; padding: 0; overflow: hidden; }
  .cf-h { display: flex; align-items: baseline; gap: 8px; }
  .cf-h .n { margin-left: auto; letter-spacing: 0; font-variant-numeric: tabular-nums; }
  .cf-note { padding: 10px 12px; font: 700 var(--fs-s)/var(--lh) var(--font-ui); color: var(--text-soft); }
  .cf-note:not(:first-child) { border-top: 1.5px dashed var(--stitch); }
</style>
