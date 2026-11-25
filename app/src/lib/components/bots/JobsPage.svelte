<script lang="ts" module>
  import type { SectionId } from '#lib/jobs/status.ts';
  /** The folds' state this app session (a section unfolded or folded by a tap). */
  const unfolded: Partial<Record<SectionId, boolean>> = $state({});
</script>

<script lang="ts">
  // ボット's Jobs tab (docs/bots.md "Jobs"), English only whatever the app's language (the user's ask, 2026-11-24: the
  // page pins it, lang="en" for VoiceOver; its strings one English catalog, i18n/jobs.ts): every recurring job as the
  // relay's GET /jobs reports it, Chain menus by the Kalori scraper's status.json, the Gym and ITS bots as their tabs
  // read them (useBot; ServiceRow) and the Cloudflare daily limits (UsageRow), laid out by lib/jobs/status.ts: the
  // verdict card (StatusCard, BotPage: one sentence of what to do, over every row but the flake hunt's), Needs you
  // (only while something does: the person's steps — open alerts, Chain menus' PR — then the rows in trouble from
  // anywhere, red then amber), Bots · Data for the app · Your data · Behind the scenes · Releases (the last two folded
  // while healthy: a summary row, a tap unfolds, kept this session) · Daily limits (Cloudflare), always last (its
  // amber and red rows copied into Needs you). A home heading counts the rows that moved up (「· 1 above」). A row
  // (JobRow: name, cadence, age, dot, last runs' strip) unfolds its detail on a tap, one at a time; くわしく only
  // while GitHub's read failed. Read while shown; offline, the last copy (lastKnown) under LoadError; while /jobs
  // fails with the usage (the record over a limit), the limits from that. `openRow`: a row unfolded at first (an old
  // link to メニュー, a bot page's dot), its fold opened.
  import { untrack } from 'svelte';
  import { inLocale, pinLocale, t } from '#lib/i18n/index.ts';
  import { dayKey, minuteNow } from '#lib/time/clock.ts';
  import { issueUrl } from '#lib/contract/jobs.ts';
  import { factRows, layout, stepsOf, usageView, verdictOf, type Item, type JobsView, type RowKey, type SectionView } from '#lib/jobs/status.ts';
  import { driver } from '#lib/jobs/bot.ts';
  import { outage } from '#lib/jobs/outage.svelte.ts';
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
  import StatusDot from './StatusDot.svelte';
  import Phrases from '../ui/Phrases.svelte';
  import { useBot } from './useBot.svelte.ts';

  let { onopen, openRow = null }: { onopen?: (tab: BotId) => void; openRow?: RowKey | null } = $props();

  pinLocale('en');
  const bot = useBot<JobsView>('jobs', driver);
  // the bots this phone has (BotsSheet's tabs): read while Jobs is shown, as their own tabs read them
  const tabs = botTabs();
  const gym = tabs.includes('gym') ? useBot<GymStatus>('gym', gymDriver) : null;
  const its = tabs.includes('its') ? useBot<ItsStatus>('its', itsDriver) : null;
  const now = $derived(minuteNow().getTime());
  const data = $derived(bot.data);
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
  const services = $derived({ ...(gym ? { gym: { b: gym, view: gymView } } : {}), ...(its ? { its: { b: its, view: itsView } } : {}) });
  const svcIn = $derived(Object.entries(services).map(([id, x]) => ({ id: id as 'gym' | 'its', v: x.view?.verdict ?? null })));
  const verdict = $derived(data && verdictOf(data, now, svcIn));
  // (/jobs failing with the free tier's usage, the record over a limit: that, beside LoadError)
  const usage = $derived(usageView(bot.failed && outage.usage ? outage.usage : data?.usage, now));
  const lay = $derived(layout(data, now, svcIn, usage));
  const steps = $derived(data ? stepsOf(data, now) : []);
  const flake = $derived(data?.alerts.find((a) => a.label === 'flake') ?? null);
  /** The row unfolded (one at a time; a limit's copy in Needs you `n:`-prefixed). */
  let openId = $state<string | null>(untrack(() => openRow));
  const toggle = (id: string) => (openId = openId === id ? null : id);
  const first = untrack(() => openRow);
  const folded = (g: SectionView) => unfolded[g.id] === undefined ? g.fold && !g.items.some((x) => x.key === first) : !unfolded[g.id];
</script>

{#snippet rowOf(x: Item, copy: boolean)}
  {#if x.kind === 'job'}
    <JobRow row={x.row} h={x.h} kalori={x.key === 'kalori-scrape' ? (data?.kalori ?? null) : null} issue={x.key === 'e2e-flake-hunt' && flake ? issueUrl(flake.n) : null} {now}
      open={openId === x.key} ontoggle={() => toggle(x.key)} onopen={(tab) => onopen?.(tab)} />
  {:else if x.kind === 'svc'}
    {@const sv = services[x.id]}
    {#if sv}
      <ServiceRow id={x.id} view={sv.view} stale={sv.b.stale} failed={sv.b.failed} readAt={sv.b.readAt} {now} open={openId === x.key}
        ontoggle={() => toggle(x.key)} onopen={(tab) => onopen?.(tab)} />
    {/if}
  {:else}
    {@const k = copy ? `n:${x.key}` : x.key}
    <UsageRow row={x.u} asOf={usage?.asOf ?? null} {copy} open={openId === k} ontoggle={() => toggle(k)} />
  {/if}
{/snippet}

<BotPage attr="jobs" rootAttr={{ lang: 'en' }} busy={bot.poll.loading} {bot} onretry={() => void bot.poll.refresh()} {verdict} vid={verdict?.w} {now}
  facts={data ? factRows(data, now) : []}>
  {#if steps.length || lay.needs.length}
    <section class="sec" aria-labelledby="jobs-g-needs" data-jobs-group="needs">
      <h3 id="jobs-g-needs" class="sec-label">{t('jobs.g.needs')}</h3>
      <ul class="card jobs">
        {#each steps as st (st.id)}
          <li class="step" data-jobs-step={st.id}>
            <span class="l1"><StatusDot tone="warn" look size={10} /><span class="txt" data-jobs-reason><Phrases text={st.text} /></span></span>
            {#if st.links.length}<span class="links">{#each st.links as a (a.id)}<a class="btn small paper" href={a.href} target="_blank" rel="noopener noreferrer" data-sfx="open" data-jobs-link={a.id}>{a.label}</a>{/each}</span>{/if}
          </li>
        {/each}
        {#each lay.needs as x (x.key)}{@render rowOf(x, true)}{/each}
      </ul>
    </section>
  {/if}
  {#each lay.sections as g (g.id)}
    {@const fold = g.foldable}
    {@const shut = fold && folded(g)}
    {@const name = t(`jobs.g.${g.id}`)}
    {#if g.items.length || g.above || (g.id === 'cf' && usage?.note)}
      <section class="sec" aria-labelledby="jobs-g-{g.id}" data-jobs-group={g.id} data-jobs-folded={fold ? String(shut) : undefined}>
        <h3 id="jobs-g-{g.id}" class="sec-label hrow"><span>{name}</span>{#if g.above}<span class="above" data-jobs-above>· {t('jobs.g.above', { n: g.above })}</span>{/if}{#if g.id === 'cf' && usage?.rows.length}<span class="n" data-jobs-cf-resets>{usage.resets}</span>{/if}</h3>
        {#if fold && g.items.length}
          <div class="card fcard">
            <button type="button" class="head" aria-expanded={!shut} aria-controls="jobs-l-{g.id}" aria-label={t('jobs.fold.label', { name, summary: g.summary })} data-sfx="tick" data-jobs-fold={g.id}
              onclick={() => (unfolded[g.id] = shut)}>
              <StatusDot tone={g.tone} size={10} /><b class="sum" data-jobs-fold-sum>{g.summary}</b><span class="chev" class:up={!shut} aria-hidden="true"></span>
            </button>
            {#if !shut}<ul class="jobs" id="jobs-l-{g.id}">{#each g.items as x (x.key)}{@render rowOf(x, false)}{/each}</ul>{/if}
          </div>
        {:else if g.items.length || (g.id === 'cf' && usage?.note)}
          <ul class="card jobs">
            {#each g.items as x (x.key)}{@render rowOf(x, false)}{/each}
            {#if g.id === 'cf' && usage?.note}<li class="cf-note" data-jobs-cf-note>{usage.note}</li>{/if}
          </ul>
        {/if}
      </section>
    {/if}
  {/each}
</BotPage>

<style>
  .jobs { list-style: none; margin: 0; padding: 0; overflow: hidden; }
  .jobs > :global(li + li) { border-top: 1.5px dashed var(--stitch); }
  .hrow { display: flex; align-items: baseline; gap: 6px; }
  .hrow .above { letter-spacing: 0; }
  .hrow .n { margin-left: auto; letter-spacing: 0; font-variant-numeric: tabular-nums; }
  .cf-note { padding: 10px 12px; font: 700 var(--fs-s)/var(--lh) var(--font-ui); color: var(--text-soft); }
  /* a person's step: the 「!」 dot, the line, its links (JobRow's row metrics) */
  .step { display: grid; gap: 8px; padding: 10px 12px; }
  .step .l1 { display: flex; align-items: flex-start; gap: 8px; }
  .step .l1 :global(.sdot) { margin-top: 2px; }
  .txt { min-width: 0; font: 700 var(--fs-body)/var(--lh) var(--font-ui); text-wrap: pretty; overflow-wrap: anywhere; }
  .links { display: flex; flex-wrap: wrap; gap: 8px; padding-left: 22px; }
  .links .btn { margin: 0; min-height: var(--hit); }
  /* a folded section: its row (the dot, the summary, the chevron: JobRow's head), the rows under it once unfolded */
  .fcard { padding: 0; overflow: hidden; }
  .fcard .head {
    appearance: none; display: flex; align-items: center; gap: 8px; width: 100%; min-height: var(--hit); margin: 0; padding: 10px 12px;
    border: 0; background: none; color: var(--text); font: inherit; text-align: left; cursor: pointer;
  }
  .fcard .head:focus-visible { outline: 3px solid var(--focus); outline-offset: -3px; border-radius: var(--r-card); }
  .sum { flex: 1; min-width: 0; font: 700 var(--fs-body)/1.3 var(--font-ui); }
  .fcard .chev { margin-right: 0; }
  .fcard .chev.up { rotate: 225deg; margin-top: 4px; }
  .fcard .jobs { border-top: 1.5px dashed var(--stitch); }
</style>
