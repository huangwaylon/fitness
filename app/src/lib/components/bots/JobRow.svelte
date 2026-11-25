<script lang="ts">
  // A Jobs row (JobsPage, docs/bots.md "Jobs"; English only, as the page): one button the card's width, 44pt and
  // more: the dot (StatusDot, the row's health: lib/jobs/status.ts healthOf), the job's name, the last run's age at the
  // right, its cadence and (but when OK or a first run to come) why under the name (Waiting on the job it depends on;
  // a job others wait on: what's paused; the flake hunt's open issue), then its last runs' strip (the
  // newest at the right edge; the states' fills the status card's: ok leaf, warn yuzu capped, fail coral hatched, idle
  // a sunk bar, none a tick), a picture only (VoiceOver: the button's name says the state, the detail lists the runs).
  // A tap unfolds the detail under it: what it does, Schedule and Last run, the 14 days' strip and counts, the last
  // runs (a GitHub run a link), nightly's parts or places-pull's last sync, and a link to GitHub (its workflow) or to
  // ジム's tab (the flake hunt: its issue too). Chain menus (`kalori`: the Kalori scraper's status.json) unfolds its own (status.ts menuDetail): its
  // verdict's sentence, Next run, Items and its facts, Last 8 weeks (a cell a week) in the 14 days' place, Last changes
  // (ChangeBar), and its links (the run while worth a look, the PR while held, the workflow).
  import { formatNum, scoped } from '#lib/i18n/index.ts';
  import { JOBS, runUrl, workflowUrl, type JobRow } from '#lib/contract/jobs.ts';
  import { agoOf, dayCells, dayTotals, extraRows, jobName, lastRun, menuDetail, runCells, runLine, whyOf, type RowHealth } from '#lib/jobs/status.ts';
  import type { KaloriStatus } from '#lib/kalori/status.ts';
  import { timeOf } from '#lib/i18n/when.ts';
  import type { BotId } from './registry.ts';
  import StatusDot from './StatusDot.svelte';
  import ChangeBar from './ChangeBar.svelte';
  import Phrases from '../ui/Phrases.svelte';

  interface Props {
    row: JobRow;
    h: RowHealth;
    kalori?: KaloriStatus | null;
    /** The flake hunt's open `flake` issue (its page). */
    issue?: string | null;
    now: number;
    open: boolean;
    ontoggle: () => void;
    onopen: (tab: BotId) => void;
  }
  let { row, h, kalori = null, issue = null, now, open, ontoggle, onopen }: Props = $props();

  // (JobsPage pins English)
  const { t, at } = scoped();
  const menu = $derived(kalori ? menuDetail(kalori, now) : null);
  const LINK = { run: 'bots.attn.run', pr: 'bots.attn.pr', workflow: 'kalori.menu.workflow' } as const;
  const name = $derived(jobName(row.id));
  const last = $derived(lastRun(row, kalori));
  const age = $derived(last ? agoOf(last.t, now) : h.next !== undefined ? t('jobs.row.first', { at: at(() => timeOf(h.next!, now)) }) : null);
  const cells = $derived(runCells(row, now));
  const github = $derived(JOBS.find((j) => j.id === row.id)?.group === 'github');
  const why = $derived(whyOf(h));
  const label = $derived([name, why.word, why.pauses ?? '', issue ? t('jobs.flake') : '', last && age ? t('jobs.row.last', { ago: age }) : (age ?? t('jobs.row.never'))].filter(Boolean).join(', '));
</script>

<li class="job" class:open data-jobs-row={row.id} data-jobs-tone={h.tone} data-jobs-why={h.why}>
  <button type="button" class="head" aria-expanded={open} aria-controls="jobs-d-{row.id}" aria-label={label} data-sfx="tick" onclick={ontoggle}>
    <span class="l1">
      <StatusDot tone={h.tone} size={10} />
      <b class="name">{name}</b>
      <span class="age" data-jobs-age>{age ?? t('jobs.row.never')}</span>
      <span class="chev" aria-hidden="true"></span>
    </span>
    <span class="l2"><span>{t(`jobs.when.${row.id}`)}</span>{#if h.why !== 'ok' && h.why !== 'first'}<span class="why {h.why === 'recovered' ? 'back' : h.tone}" data-jobs-why-word>{why.word}</span>{/if}{#if why.pauses}<span class="why warn" data-jobs-pauses>{why.pauses}</span>{/if}{#if issue}<span class="why warn" data-jobs-flake>{t('jobs.flake')}</span>{/if}</span>
    <span class="strip" aria-hidden="true" data-jobs-strip>{#each cells as c (c.start)}<i class="cell {c.state}" data-jobs-cell={c.state}></i>{/each}</span>
  </button>
  {#if open}
    {@const days = dayCells(row, now)}
    {@const [ok, fail] = dayTotals(row)}
    <div class="detail" id="jobs-d-{row.id}" data-jobs-detail={row.id}>
      <p class="about"><Phrases text={t(`jobs.about.${row.id}`)} /></p>
      {#if menu?.say}<p class="say" data-jobs-menu-say><Phrases text={menu.say} /></p>{/if}
      <dl class="kv">
        <div><dt>{t('jobs.d.when')}</dt><dd>{t(`jobs.when.${row.id}`)}</dd></div>
        <div><dt>{t('jobs.d.last')}</dt><dd data-jobs-last>{last ? runLine(last, now) : t('jobs.row.never')}</dd></div>
        {#each extraRows(row, now) as x (x.id)}<div data-jobs-x={x.id}><dt>{x.label}</dt><dd>{x.value}</dd></div>{/each}
        {#if menu}
          {#if menu.next}<div data-jobs-x="next"><dt>{t('jobs.d.next')}</dt><dd>{menu.next}</dd></div>{/if}
          {#if menu.outcome}<div data-jobs-x="outcome"><dt>{t('jobs.d.outcome')}</dt><dd>{menu.outcome}</dd></div>{/if}
          {#each menu.facts as f (f.id)}<div data-jobs-x={f.id}><dt>{f.label}</dt><dd>{#if f.href}<a href={f.href} target="_blank" rel="noopener noreferrer" data-sfx="open">{f.value}</a>{:else}{f.value}{/if}</dd></div>{/each}
        {/if}
      </dl>
      {#if menu}
        {@const w = menu.weeks}
        <div class="days">
          <span class="lbl">{t('jobs.d.weeks')}<small data-jobs-weeks-sum>{w.empty ? w.empty.text : w.summary}</small></span>
          <ul class="strip dstrip" aria-label={w.summary} data-jobs-weeks>{#each w.cells as c (c.start)}<li class="cell {c.state}" aria-label={c.label} title={c.label} data-jobs-week={c.state}></li>{/each}</ul>
        </div>
        {#if menu.change}
          <span class="lbl">{t('kalori.sec.latest')}</span>
          <ChangeBar segs={menu.change.parts} attr="jobs" label={menu.change.summary} />
        {/if}
      {:else}
        <div class="days">
          <span class="lbl">{t('jobs.d.days')}<small data-jobs-days-sum>{t('jobs.d.daysSum', { ok: formatNum(ok), fail: formatNum(fail) })}</small></span>
          <ul class="strip dstrip" aria-label={t('jobs.d.days')} data-jobs-days>{#each days as c (c.start)}<li class="cell {c.state}" aria-label={c.label} title={c.label} data-jobs-day={c.state}></li>{/each}</ul>
        </div>
      {/if}
      {#if row.runs.length}
        <span class="lbl">{t('jobs.d.runs')}</span>
        <ul class="runs" data-jobs-runs>
          {#each row.runs.slice(0, 8) as r (r.t)}
            <li class="run" data-jobs-run={r.st}>
              <i class="cell {r.st === 'run' ? 'none' : r.st}" aria-hidden="true"></i>
              {#if r.id}<a href={runUrl(r.id)} target="_blank" rel="noopener noreferrer" data-sfx="open">{runLine(r, now)}</a>{:else}<span>{runLine(r, now)}</span>{/if}
            </li>
          {/each}
        </ul>
      {/if}
      {#if menu}
        <div class="links">{#each menu.links as l (l.id)}<a class="btn small paper" href={l.href} target="_blank" rel="noopener noreferrer" data-sfx="open" data-jobs-link={l.id}>{t(LINK[l.id])}</a>{/each}</div>
      {:else if github}
        <div class="links">
          {#if issue}<a class="btn small paper" href={issue} target="_blank" rel="noopener noreferrer" data-sfx="open" data-jobs-link="flake">{t('jobs.flakeLink')}</a>{/if}
          <a class="btn small paper" href={workflowUrl(row.id)} target="_blank" rel="noopener noreferrer" data-sfx="open" data-jobs-open>{t('jobs.d.open')}</a>
        </div>
      {:else if row.id === 'gym'}
        <button type="button" class="btn small paper" data-sfx="tick" data-jobs-gym onclick={() => onopen('gym')}>{t('jobs.d.gym')}</button>
      {/if}
    </div>
  {/if}
</li>

<style>
  .job + .job { border-top: 1.5px dashed var(--stitch); }
  .head {
    appearance: none; display: grid; gap: 4px; width: 100%; min-height: var(--hit); margin: 0; padding: 10px 12px;
    border: 0; background: none; color: var(--text); font: inherit; text-align: left; cursor: pointer;
  }
  .head:focus-visible { outline: 3px solid var(--focus); outline-offset: -3px; border-radius: var(--r-card); }
  .l1 { display: flex; align-items: center; gap: 8px; min-width: 0; }
  .name { flex: 1; min-width: 0; font: 700 var(--fs-body)/1.3 var(--font-ui); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .age { flex: none; font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); font-variant-numeric: tabular-nums; white-space: nowrap; }
  .l1 .chev { margin-right: 0; }
  .open .l1 .chev { rotate: 225deg; margin-top: 4px; }
  .l2 { display: flex; flex-wrap: wrap; gap: 0 10px; padding-left: 18px; font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); }
  .why.warn { color: var(--text); }
  .why.bad { color: var(--coral-text); }
  .why.unknown, .why.idle { color: var(--text-soft); }
  .why.back { color: var(--leaf-text); }

  /* the strips: the status card's cells, smaller (a picture: the detail lists the runs) */
  .strip { display: flex; align-items: flex-end; gap: 1px; height: 16px; margin: 2px 0 0; padding: 0; list-style: none; }
  .strip .cell { flex: 1 1 0; min-width: 0; height: 70%; }
  .cell { display: block; border-radius: 2px; box-shadow: inset 0 0 0 1px var(--edge); background: var(--ctl-off); }
  .cell.ok { background: var(--c-leaf); }
  .strip .cell.warn, .strip .cell.fail { height: 100%; }
  .cell.warn { background: var(--c-yuzu); box-shadow: inset 0 2px 0 var(--text-soft), inset 0 0 0 1px var(--edge); }
  .cell.fail { background: repeating-linear-gradient(135deg, var(--c-coral) 0 3px, color-mix(in srgb, var(--c-coral) 45%, var(--card)) 3px 5px); }
  .strip .cell.idle { height: 35%; box-shadow: inset 0 2px 0 var(--edge), inset 0 0 0 1px var(--edge); }
  .strip .cell.none { height: 3px; }
  .cell.none { box-shadow: none; background: color-mix(in srgb, var(--edge) 35%, var(--ctl-off)); }
  .dstrip { height: 22px; gap: 3px; }

  .detail { display: grid; gap: 8px; padding: 0 12px 12px 30px; }
  .say { margin: 0; font-size: var(--fs-s); font-weight: 700; line-height: var(--lh); text-wrap: pretty; }
  .links { display: flex; flex-wrap: wrap; gap: 8px; }
  .about { margin: 0; font-size: var(--fs-s); font-weight: 700; line-height: var(--lh); color: var(--text-soft); text-wrap: pretty; }
  .kv { display: grid; grid-template-columns: max-content minmax(0, 1fr); gap: 4px 12px; margin: 0; }
  .kv div { display: contents; }
  .kv dt { font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); }
  .kv dd { margin: 0; min-width: 0; font: 700 var(--fs-s)/1.3 var(--font-ui); font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
  .lbl { font: 700 var(--fs-s)/1.2 var(--font-ui); color: var(--text-soft); }
  .lbl small { margin-left: 8px; font-size: inherit; color: var(--text); }
  .days { display: grid; gap: 4px; }
  .runs { list-style: none; margin: 0; padding: 0; display: grid; }
  .run { display: flex; align-items: center; gap: 8px; min-height: var(--hit); font: 700 var(--fs-s)/1.3 var(--font-ui); font-variant-numeric: tabular-nums; }
  .run .cell { flex: none; width: 10px; height: 10px; }
  .run a { color: var(--sky-text); display: inline-flex; align-items: center; min-height: var(--hit); }
  .detail .btn, .links .btn { justify-self: start; margin: 2px 0 0; min-height: var(--hit); }
</style>
