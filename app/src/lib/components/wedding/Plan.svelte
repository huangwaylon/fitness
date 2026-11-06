<script lang="ts">
  // けっこんしき's やること (docs/wedding.md "Plan"): the filter chips with their counts (すべて / すぎた / もうすぐ /
  // あとで / おわった: over the whole board; すぎた's count coral), pinned at the scroller's top, then すぎた (a coral
  // plate), the months before this one, こんげつ, one yuzu plate per later month (the wedding's month with the arch and a
  // pink plate), ひづけ なし last; each heading pinned under the chips while its rows scroll, with its done / total.
  // Finished tasks are hidden under すべて (a device pref: 「おわった やることも みる」); one ticked since stays where it was.
  import OfficialArt from '../characters/OfficialArt.svelte';
  import TaskCard from './TaskCard.svelte';
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
    onfilter: (f: Filter) => void;
    onshowdone: (v: boolean) => void;
    onopen: (id: string) => void;
    ontick: (id: string, done: boolean) => void;
  }
  let { tasks, overall, today, wedding, canEdit, names, filter, showDone, held, onfilter, onshowdone, onopen, ontick }: Props = $props();

  const c = $derived(counts(overall));
  const shown = $derived(visibleTasks(tasks, filter, showDone, held));
  const groups = $derived(groupPlan(shown, tasks, today, wedding, filter !== 'all'));
  /** Finished rows hidden from すべて. */
  const hiddenDone = $derived(filter === 'all' && !showDone ? c.done - tasks.filter((x) => x.doneAt && held.has(x.id)).length : 0);

  const heading = (g: Group): string =>
    g.kind === 'overdue' ? t('wed.sec.overdue') : g.kind === 'thisMonth' ? t('wed.sec.thisMonth') : g.kind === 'nodate' ? t('wed.sec.nodate') : monthTitle(g.month);
</script>

<div class="plan">
  {#if tasks.length}<div class="chips filters" role="group" aria-label={t('wed.filters')}>
    {#each FILTERS as f (f)}
      <button type="button" class="chip" aria-pressed={filter === f} data-wed-filter={f} data-count={c[f]} data-sfx={filter === f ? 'none' : 'tick'}
        aria-disabled={c[f] === 0 && filter !== f ? 'true' : undefined} onclick={() => onfilter(f)}>
        {t(`wed.filter.${f}`)}<span class="n" class:alert={f === 'overdue' && c[f] > 0}>{c[f]}</span>
      </button>
    {/each}
  </div>{/if}

  {#if !tasks.length}
    <p class="empty"><OfficialArt key="villagers/harvey-icon" size={64} />{t('wed.empty')}</p>
  {:else if !groups.length}
    <p class="empty">{t('wed.emptyFilter')}</p>
  {/if}

  {#each groups as g (g.key)}
    <section class="group {g.kind}" class:wedding={g.wedding} data-wed-group={g.key} aria-labelledby="wg-{g.key}">
      <h3 class="ghead" id="wg-{g.key}">
        <span class="gplate">
          {#if g.wedding}<span class="garch" aria-hidden="true"><OfficialArt key="deco/wedding-arch" size={26} /></span>{/if}
          {heading(g)}{#if g.kind === 'thisMonth' && g.month}<small>{monthTitle(g.month)}</small>{/if}
        </span>
        {#if g.wedding}<span class="theday">{t('wed.theMonth')}</span>{/if}
        <span class="gtally" aria-label={t('wed.tallyLabel', g.tally)} data-wed-group-tally={`${g.tally.done}/${g.tally.total}`}>{g.tally.done} / {g.tally.total}</span>
      </h3>
      <div class="rows">
        {#each g.tasks as task (task.id)}
          <TaskCard {task} {today} {canEdit} {names} {wedding} {onopen} {ontick} />
        {/each}
      </div>
    </section>
  {/each}

  {#if filter === 'all' && (hiddenDone > 0 || showDone) && c.done > 0}
    <button type="button" class="btn small paper more" data-wed-showdone={showDone ? 'on' : 'off'} data-sfx={showDone ? 'toggle-off' : 'toggle-on'}
      onclick={() => onshowdone(!showDone)}>{showDone ? t('wed.hideDone') : t('wed.showDone', { n: hiddenDone })}</button>
  {/if}
</div>

<style>
  /* --chips-h: the pinned chips' strip (the headings pin under it) */
  .plan { --chips-h: 56px; display: flex; flex-direction: column; gap: 14px; min-height: 0; }
  /* the five fit one row at 393 (a longer language wraps to two), each a full 44px target; pinned on paper */
  .filters {
    position: sticky; top: -6px; z-index: 3; gap: 6px 3px; justify-content: space-between; margin: -6px -8px -8px; padding: 6px 5px 6px;
    background: linear-gradient(var(--surface) 85%, transparent);
  }
  .filters .chip { min-height: var(--hit); padding: 0 6px 0 8px; gap: 3px; flex: none; }
  .filters .chip::after { content: none; }
  .n { font: 700 var(--fs-s)/1 var(--font-num); font-variant-numeric: tabular-nums; color: var(--text-soft); }
  .chip[aria-pressed='true'] { box-shadow: inset 0 0 0 2px var(--c-yuzu-lip), var(--sh-ctl); }
  .chip[aria-pressed='true'] .n { color: var(--c-ink); }
  .n.alert { color: var(--c-ink); background: var(--c-coral); border-radius: var(--r-pill); padding: 2px 5px 1px; margin-right: -3px; }
  .chip[aria-disabled='true'] { opacity: .55; }
  .empty { margin: 18px 0; display: grid; justify-items: center; gap: 8px; text-align: center; font-weight: 700; color: var(--text-soft); }

  .group { display: grid; gap: 8px; }
  /* a heading stays under the chips while its month's rows scroll by */
  .ghead {
    position: sticky; top: calc(var(--chips-h) - 8px); z-index: 2; display: flex; align-items: center; gap: 8px; margin: 0 -8px; padding: 4px 10px 6px;
    font: 700 var(--fs-body)/1 var(--font-ui); background: linear-gradient(var(--surface) 75%, transparent);
  }
  /* a month's name on a yuzu plate, tilted (NH's nameplate); すぎた coral, こんげつ leaf, the wedding's month pink */
  .gplate {
    display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: var(--r-pill); transform: rotate(-2deg);
    background: var(--c-yuzu); color: var(--c-ink); box-shadow: 0 3px 0 var(--c-yuzu-lip);
  }
  .gplate small { font-size: var(--fs-s); color: var(--c-ink-soft); }
  .overdue .gplate { background: var(--c-coral); box-shadow: 0 3px 0 #D9654F; }
  .thisMonth .gplate { background: var(--c-leaf); box-shadow: 0 3px 0 var(--c-leaf-edge); }
  .wedding .gplate { background: #F7B3CB; box-shadow: 0 3px 0 #D9789C; }
  .nodate .gplate { background: var(--ctl-off); box-shadow: 0 3px 0 var(--c-lip); }
  .garch { display: inline-flex; margin: -6px 0 -6px -4px; line-height: 0; }
  .theday { font-size: var(--fs-s); color: var(--text-soft); }
  .gtally { margin-left: auto; padding: 0 6px; font: 700 var(--fs-body)/1 var(--font-num); font-variant-numeric: tabular-nums; color: var(--text-soft); }
  .rows { display: grid; gap: 8px; }
  .more { align-self: center; }
</style>
