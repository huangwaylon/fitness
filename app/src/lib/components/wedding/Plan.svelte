<script lang="ts">
  // けっこんしき's プラン (docs/wedding.md "Plan"): one row of filter chips with their counts (over the whole board),
  // then 期限切れ (coral), the months before this one, 今月 (leaf), one heading per later month (the year only where it
  // changes), 日付なし last; each heading (.sec-label.head) pinned under the chips while its rows scroll, with its
  // tally, its rows in one dense card. Finished tasks are hidden under すべて (a device pref); one ticked since stays
  // where it was. A row opens in place (TaskRow).
  import Chip from '../ui/Chip.svelte';
  import ChipRow from '../ui/ChipRow.svelte';
  import TaskRow from './TaskRow.svelte';
  import { counts, FILTERS, groupPlan, visibleTasks, type Filter, type Group, type Task } from './view.ts';
  import type { Overall } from '#lib/wedding/progress.ts';
  import type { Who } from '#lib/types.ts';
  import { monthTitle } from './format.ts';
  import { t } from '#lib/i18n/index.ts';

  interface Props {
    tasks: Task[];
    overall: Overall;
    today: string;
    /** The wedding day ('' unset). */
    wedding: string;
    canEdit: boolean;
    names: Record<Who, string>;
    filter: Filter;
    showDone: boolean;
    /** Rows ticked since the filter was chosen (they stay put). */
    held: ReadonlySet<string>;
    /** The row open in place (null: none). */
    expanded: string | null;
    onfilter: (f: Filter) => void;
    onshowdone: (v: boolean) => void;
    onexpand: (id: string | null) => void;
    ontick: (id: string, done: boolean) => void;
    onedit: (id: string) => void;
  }
  let { tasks, overall, today, wedding, canEdit, names, filter, showDone, held, expanded, onfilter, onshowdone, onexpand, ontick, onedit }: Props = $props();

  const c = $derived(counts(overall));
  const shown = $derived(visibleTasks(tasks, filter, showDone, held));
  const groups = $derived(groupPlan(shown, tasks, today, wedding, filter !== 'all'));
  /** Finished rows hidden from すべて. */
  const hiddenDone = $derived(filter === 'all' && !showDone ? c.done - tasks.filter((x) => x.doneAt && held.has(x.id)).length : 0);

  /** Each month heading's year shown only where it changes (from today's). */
  const titles = $derived.by(() => {
    let year = today.slice(0, 4);
    const out = new Map<string, string>();
    for (const g of groups) {
      if (g.kind === 'overdue') out.set(g.key, t('wed.sec.overdue'));
      else if (g.kind === 'nodate') out.set(g.key, t('wed.sec.nodate'));
      else {
        const y = g.month.slice(0, 4);
        const m = monthTitle(g.month, y !== year);
        year = y;
        out.set(g.key, g.kind === 'thisMonth' ? `${m} · ${t('wed.sec.thisMonth')}` : g.wedding ? `${m} · ${t('wed.theMonth')}` : m);
      }
    }
    return out;
  });
  const tally = (g: Group): string => (g.tally.done ? `${g.tally.done}/${g.tally.total}` : t('wed.count', { n: g.tally.total }));
</script>

<div class="plan">
  {#if overall.total}
    <div class="filters">
      <ChipRow label={t('wed.filters')}>
        {#each FILTERS as f (f)}
          <Chip label={t(`wed.filter.${f}`)} count={c[f]} selected={filter === f} dot={f === 'overdue' && c[f] > 0 ? 'var(--c-coral)' : undefined}
            data-wed-filter={f} data-count={c[f]} onclick={() => onfilter(f)} />
        {/each}
      </ChipRow>
    </div>
  {/if}

  {#if !tasks.length}
    <p class="empty">{t('wed.empty')}</p>
  {:else if !groups.length}
    <p class="empty">{t('wed.emptyFilter')}</p>
  {/if}

  {#each groups as g (g.key)}
    <section class="group {g.kind}" data-wed-group={g.key} aria-labelledby="wg-{g.key}">
      <h3 class="sec-label head sticky" class:coral={g.kind === 'overdue'} class:leaf={g.kind === 'thisMonth'} id="wg-{g.key}">
        <span>{titles.get(g.key)}</span>
        <span class="n" aria-label={t('wed.tallyLabel', g.tally)} data-wed-group-tally="{g.tally.done}/{g.tally.total}">{tally(g)}</span>
      </h3>
      <div class="card dense">
        {#each g.tasks as task (task.id)}
          <TaskRow {task} {canEdit} {names} {wedding} open={expanded === task.id} ontoggle={() => onexpand(expanded === task.id ? null : task.id)} {ontick} {onedit} />
        {/each}
      </div>
    </section>
  {/each}

  {#if filter === 'all' && (hiddenDone > 0 || showDone) && c.done > 0}
    <button type="button" class="chip s more" data-wed-showdone={showDone ? 'on' : 'off'} data-sfx={showDone ? 'toggle-off' : 'toggle-on'}
      onclick={() => onshowdone(!showDone)}>{showDone ? t('wed.hideDone') : t('wed.showDone', { n: hiddenDone })}</button>
  {/if}
</div>

<style>
  /* the filters pinned at the scroller's top, the month headings under them */
  .plan { --sticky-top: 44px; display: flex; flex-direction: column; padding: 0 12px; }
  .filters { position: sticky; top: 0; z-index: 3; margin: 0 -12px; background: var(--surface); }
  .empty { margin: 32px 4px; text-align: center; color: var(--text-soft); }
  .group { display: flex; flex-direction: column; }
  /* the heading's count beside its title, never at the right edge, where ＋ floats over the list */
  .group > .head > :global(.n) { margin-left: 0; }
  .more { align-self: center; margin: 14px 0 0; }
</style>
