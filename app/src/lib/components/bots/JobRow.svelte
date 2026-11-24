<script lang="ts">
  // A 定期処理 row (JobsPage, docs/bots.md "定期処理"): one button the card's width, 44pt and more: the dot (StatusDot,
  // the row's health: lib/jobs/status.ts rowHealth), the job's name, the last run's age at the right, its cadence and
  // (but when 順調) why under the name, then its last runs' strip (the newest at the right edge; the states' fills
  // the status card's: ok leaf, warn yuzu capped, fail coral hatched, idle a sunk bar, none a tick), a picture only
  // (VoiceOver: the button's name says the state, the detail lists the runs). A tap unfolds the detail under it:
  // what it does, 間隔 and 前回, the 14 days' strip and counts, the last runs (a GitHub run a link), nightly's
  // parts or places-pull's last sync, and a link to GitHub (its workflow) or to ジム's tab.
  import { t, formatNum } from '#lib/i18n/index.ts';
  import { JOBS, runUrl, workflowUrl, type JobRow } from '#lib/contract/jobs.ts';
  import { agoOf, dayCells, dayTotals, extraRows, jobName, rowHealth, runCells, runLine } from '#lib/jobs/status.ts';
  import { timeOf } from '#lib/i18n/when.ts';
  import type { BotId } from './registry.ts';
  import StatusDot from './StatusDot.svelte';
  import Phrases from '../ui/Phrases.svelte';

  let { row, now, since, open, ontoggle, onopen }: { row: JobRow; now: number; since?: number; open: boolean; ontoggle: () => void; onopen: (tab: BotId) => void } = $props();

  const h = $derived(rowHealth(row, now, since));
  const name = $derived(jobName(row.id));
  const last = $derived(row.runs[0]);
  const age = $derived(last ? agoOf(last.t, now) : h.next !== undefined ? t('jobs.row.first', { at: timeOf(h.next, now) }) : null);
  const cells = $derived(runCells(row, now));
  const github = $derived(JOBS.find((j) => j.id === row.id)?.group === 'github');
  const why = $derived(t(`jobs.why.${h.why}`));
  const label = $derived([name, why, last && age ? t('jobs.row.last', { ago: age }) : (age ?? t('jobs.row.never'))].join('、'));
</script>

<li class="job" class:open data-jobs-row={row.id} data-jobs-tone={h.tone} data-jobs-why={h.why}>
  <button type="button" class="head" aria-expanded={open} aria-controls="jobs-d-{row.id}" aria-label={label} data-sfx="tick" onclick={ontoggle}>
    <span class="l1">
      <StatusDot tone={h.tone} size={10} />
      <b class="name">{name}</b>
      <span class="age" data-jobs-age>{age ?? t('jobs.row.never')}</span>
      <span class="chev" aria-hidden="true"></span>
    </span>
    <span class="l2"><span>{t(`jobs.when.${row.id}`)}</span>{#if h.why !== 'ok' && h.why !== 'first'}<span class="why {h.why === 'recovered' ? 'back' : h.tone}" data-jobs-why-word>{why}</span>{/if}</span>
    <span class="strip" aria-hidden="true" data-jobs-strip>{#each cells as c (c.start)}<i class="cell {c.state}" data-jobs-cell={c.state}></i>{/each}</span>
  </button>
  {#if open}
    {@const days = dayCells(row, now)}
    {@const [ok, fail] = dayTotals(row)}
    <div class="detail" id="jobs-d-{row.id}" data-jobs-detail={row.id}>
      <p class="about"><Phrases text={t(`jobs.about.${row.id}`)} /></p>
      <dl class="kv">
        <div><dt>{t('jobs.d.when')}</dt><dd>{t(`jobs.when.${row.id}`)}</dd></div>
        <div><dt>{t('jobs.d.last')}</dt><dd data-jobs-last>{last ? runLine(last, now) : t('jobs.row.never')}</dd></div>
        {#each extraRows(row, now) as x (x.id)}<div data-jobs-x={x.id}><dt>{x.label}</dt><dd>{x.value}</dd></div>{/each}
      </dl>
      <div class="days">
        <span class="lbl">{t('jobs.d.days')}<small data-jobs-days-sum>{t('jobs.d.daysSum', { ok: formatNum(ok), fail: formatNum(fail) })}</small></span>
        <ul class="strip dstrip" aria-label={t('jobs.d.days')} data-jobs-days>{#each days as c (c.start)}<li class="cell {c.state}" aria-label={c.label} title={c.label} data-jobs-day={c.state}></li>{/each}</ul>
      </div>
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
      {#if github}
        <a class="btn small paper" href={workflowUrl(row.id)} target="_blank" rel="noopener noreferrer" data-sfx="open" data-jobs-open>{t('jobs.d.open')}</a>
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
  .detail .btn { justify-self: start; margin: 2px 0 0; min-height: var(--hit); }
</style>
