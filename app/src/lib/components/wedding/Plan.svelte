<script lang="ts">
  // けっこんしき's やること (docs/wedding.md "Plan"): the filter chips with their counts (すべて / 期限切れ / もうすぐ /
  // あとで / 完了: over the whole board; 期限切れ's count coral), then 期限切れ (a coral plate) and こんげつ lifted out
  // of the calendar, one yuzu plate per month with its done / total (the wedding's month with the arch and a pink
  // plate), ひづけ なし last. Finished tasks are hidden under すべて (a device pref: 「おわった やることも みる」); one
  // ticked since stays where it was. A member's ＋ (bottom right) adds a task.
  import OfficialArt from '../characters/OfficialArt.svelte';
  import TaskCard from './TaskCard.svelte';
  import { counts, FILTERS, groupPlan, visibleTasks, type Board, type Filter, type Group, type Who3 } from './view.ts';
  import { monthTitle } from './format.ts';
  import { t } from '#lib/i18n/index.ts';

  interface Props {
    board: Board;
    canEdit: boolean;
    names: Record<Who3, string>;
    filter: Filter;
    showDone: boolean;
    /** Rows ticked since the filter was chosen (they stay put). */
    held: ReadonlySet<string>;
    onfilter: (f: Filter) => void;
    onshowdone: (v: boolean) => void;
    onopen: (id: string) => void;
    ontick: (id: string, done: boolean) => void;
    onadd: () => void;
  }
  let { board, canEdit, names, filter, showDone, held, onfilter, onshowdone, onopen, ontick, onadd }: Props = $props();

  const c = $derived(counts(board.tasks));
  const shown = $derived(visibleTasks(board.tasks, filter, showDone, held));
  const groups = $derived(groupPlan(shown, board.tasks, board.today, board.config.date, filter !== 'all'));
  /** Finished rows hidden from すべて. */
  const hiddenDone = $derived(filter === 'all' && !showDone ? c.done - board.tasks.filter((x) => x.done && held.has(x.id)).length : 0);

  const heading = (g: Group): string =>
    g.kind === 'overdue' ? t('wed.sec.overdue') : g.kind === 'thisMonth' ? t('wed.sec.thisMonth') : g.kind === 'nodate' ? t('wed.sec.nodate') : monthTitle(g.month);
</script>

<div class="plan" data-wed-plan>
  {#if board.tasks.length}<div class="chips filters" role="group" aria-label={t('wed.filters')}>
    {#each FILTERS as f (f)}
      <button type="button" class="chip" aria-pressed={filter === f} data-wed-filter={f} data-count={c[f]} data-sfx={filter === f ? 'none' : 'tick'}
        aria-disabled={c[f] === 0 && filter !== f ? 'true' : undefined} onclick={() => onfilter(f)}>
        {t(`wed.filter.${f}`)}<span class="n" class:alert={f === 'overdue' && c[f] > 0}>{c[f]}</span>
      </button>
    {/each}
  </div>{/if}

  {#if !board.tasks.length}
    <p class="empty" data-wed-empty><OfficialArt key="villagers/harvey-icon" size={64} />{t('wed.empty')}</p>
  {:else if !groups.length}
    <p class="empty" data-wed-empty-filter>{t('wed.emptyFilter')}</p>
  {/if}

  {#each groups as g (g.key)}
    <section class="group {g.kind}" class:wedding={g.wedding} data-wed-group={g.key} aria-labelledby="wg-{g.key}">
      <h3 class="ghead" id="wg-{g.key}">
        <span class="gplate">
          {#if g.wedding}<span class="garch" aria-hidden="true"><OfficialArt key="deco/wedding-arch" size={26} /></span>{/if}
          {heading(g)}{#if g.kind === 'thisMonth' && g.month}<small>{monthTitle(g.month)}</small>{/if}
        </span>
        {#if g.wedding}<span class="theday">{t('wed.theMonth')}</span>{/if}
        {#if g.tally}
          <span class="gtally" aria-label={t('wed.tallyLabel', g.tally)} data-wed-group-tally={`${g.tally.done}/${g.tally.total}`}>{g.tally.done} / {g.tally.total}</span>
        {:else if g.kind === 'overdue' || g.kind === 'thisMonth'}
          <span class="gtally" aria-hidden="true">{g.tasks.length}</span>
        {/if}
      </h3>
      <div class="rows">
        {#each g.tasks as task (task.id)}
          <TaskCard {task} today={board.today} {canEdit} {names} wedding={board.config.date} {onopen} {ontick} />
        {/each}
      </div>
    </section>
  {/each}

  {#if filter === 'all' && (hiddenDone > 0 || showDone) && c.done > 0}
    <button type="button" class="btn small paper more" data-wed-showdone={showDone ? 'on' : 'off'} data-sfx={showDone ? 'toggle-off' : 'toggle-on'}
      onclick={() => onshowdone(!showDone)}>{showDone ? t('wed.hideDone') : t('wed.showDone', { n: hiddenDone })}</button>
  {/if}

  {#if canEdit}
    <!-- ＋: the one action, held at the scroller's bottom right over the cards (the leaf, NH's) -->
    <button type="button" class="fab" aria-label={t('wed.add')} data-wed-add data-sfx="open" onclick={onadd}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
    </button>
  {/if}
</div>

<style>
  .plan { display: flex; flex-direction: column; gap: 14px; min-height: 0; }
  /* the five fit one row at 393 (a longer language wraps to two) */
  .filters { gap: 8px 3px; justify-content: space-between; margin: 0 -3px; }
  .filters .chip { padding: 0 5px 0 7px; gap: 3px; flex: none; }
  .n { font: 700 var(--fs-s)/1 var(--font-num); font-variant-numeric: tabular-nums; color: var(--text-soft); }
  .chip[aria-pressed='true'] .n { color: var(--c-ink); }
  .n.alert { color: var(--c-ink); background: var(--c-coral); border-radius: var(--r-pill); padding: 2px 5px 1px; margin-right: -3px; }
  .chip[aria-disabled='true'] { opacity: .55; }
  .empty { margin: 18px 0; display: grid; justify-items: center; gap: 8px; text-align: center; font-weight: 700; color: var(--text-soft); }

  .group { display: grid; gap: 8px; }
  .ghead { display: flex; align-items: center; gap: 8px; margin: 2px 2px 0; font: 700 var(--fs-body)/1 var(--font-ui); }
  /* a month's name on a yuzu plate, tilted (NH's nameplate); 期限切れ coral, こんげつ leaf, the wedding's month pink */
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
  .fab {
    position: sticky; bottom: 4px; align-self: flex-end; z-index: 3; margin: -6px 2px 0 0;
    width: 60px; height: 60px; flex: none; border-radius: 50%; border: 0; cursor: pointer; display: grid; place-items: center;
    appearance: none; background: var(--c-leaf); color: var(--c-ink);
    box-shadow: inset 0 0 0 2px var(--c-leaf-edge), 0 var(--lip-h) 0 var(--c-leaf-edge), var(--sh-float);
    -webkit-tap-highlight-color: transparent;
  }
  .fab svg { width: 28px; height: 28px; fill: none; stroke: currentColor; stroke-width: 3.2; stroke-linecap: round; }
  .fab:active { transform: translateY(3px) scale(1.04, .94); box-shadow: inset 0 0 0 2px var(--c-leaf-edge), 0 1px 0 var(--c-leaf-edge); }
  .fab:focus-visible { outline: 3px solid var(--focus); outline-offset: 3px; }
</style>
