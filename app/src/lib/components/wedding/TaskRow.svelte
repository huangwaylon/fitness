<script lang="ts">
  // One task on 結婚式's plan, a row of its month's dense card (docs/design.md "Unified kit"): a member's Tick at
  // the left, the month small over the day (Fredoka), the title (15, three lines at most) over its category tag and the
  // checklist's ☑ count, the relative due at the right (coral past it). A tap on the row opens it in place: the
  // checklist (each item a member's Tick, its URLs links, who ticked it), who finished it (「うめ が完了」; the old
  // Sheet's ticks say so), a start day still ahead, and a member's 編集 / 完了. The guest's row has nothing to press but
  // the row itself: a finished task's tick is drawn, an open one's is not.
  import { slide } from 'svelte/transition';
  import Icon from '../ui/Icon.svelte';
  import Tick from '../ui/Tick.svelte';
  import Linked from './Linked.svelte';
  import { board } from './board.svelte.ts';
  import { formatDate, md } from '#lib/i18n/format.ts';
  import { t } from '#lib/i18n/index.ts';
  import { dueLine } from './format.ts';
  import { monthLabel } from '#lib/i18n/format.ts';
  import type { Who } from '#lib/types.ts';
  import type { Task } from './view.ts';

  interface Props {
    task: Task;
    canEdit: boolean;
    names: Record<Who, string>;
    /** The wedding day: its own row's day in rose. */
    wedding: string;
    /** Opened in place. */
    open: boolean;
    ontoggle: () => void;
    ontick: (id: string, done: boolean) => void;
    onedit: (id: string) => void;
  }
  let { task, canEdit, names, wedding, open, ontoggle, ontick, onedit }: Props = $props();
  const due = $derived(dueLine(task));
  const tally = $derived(task.progress.tally);
  const done = $derived(!!task.doneAt);
  const dated = $derived(task.progress.dated);
  const dateLabel = $derived(dated ? `${Number(task.due.slice(0, 4))}/${md(task.due)}` : t('wed.sec.nodate'));
  /** Promoted from a checklist: no dates, no items of its own. */
  const promoted = $derived(!!task.parentId);
  const uid = $props.id();
</script>

<article class="row tk" class:done class:over={due?.tone === 'over'} class:theday={dated && task.due === wedding} data-wed-task={task.id} data-done={done || undefined}>
  <div class="line">
    {#if canEdit}
      <span class="tick" data-wed-tick={task.id}><Tick checked={done} label={done ? t('wed.untick', { title: task.title }) : t('wed.tick', { title: task.title })} onchange={(v) => ontick(task.id, v)} /></span>
    {:else}
      <span class="tick" data-wed-mark={done || undefined}>{#if done}<Tick checked label={task.title} />{/if}</span>
    {/if}
    <button type="button" class="head" aria-expanded={open} aria-controls="{uid}-more" data-sfx={open ? 'back' : 'open'}
      aria-label="{task.title}、{dateLabel}{due ? `、${due.text}` : ''}{tally ? `、${t('wed.tallyLabel', tally)}` : ''}" onclick={ontoggle}>
      <span class="dc" aria-hidden="true">
        {#if dated}<span class="mo">{monthLabel(task.due, { year: false })}</span><span class="dd">{Number(task.due.slice(8, 10))}</span>{:else}<span class="dd dash">–</span>{/if}
      </span>
      <span class="body">
        <span class="tt" data-wed-title>{task.title}</span>
        {#if task.category || tally}
          <span class="meta" aria-hidden="true">
            {#if task.category}<span class="tag">{task.category}</span>{/if}
            {#if tally}<span class="tag" data-wed-tally="{tally.done}/{tally.total}"><Icon name="checks" size={12} stroke={2.4} />{tally.done}/{tally.total}</span>{/if}
          </span>
        {/if}
      </span>
      {#if due && !done}<span class="rel" aria-hidden="true">{due.text}</span>{/if}
    </button>
  </div>

  {#if open}
    <div class="more" id="{uid}-more" transition:slide={{ duration: 180 }}>
      {#if !promoted && task.subtasks.length}
        <ul class="subs" aria-label={t('wed.checklist')}>
          {#each task.subtasks as s (s.id)}
            <li class:done={!!s.doneAt} data-wed-sub={s.id} data-done={!!s.doneAt || undefined}>
              {#if canEdit}
                <span class="stick" data-wed-sub-tick={s.id}><Tick checked={!!s.doneAt} label={s.doneAt ? t('wed.untick', { title: s.title }) : t('wed.tick', { title: s.title })} onchange={(v) => board.tick(s.id, v)} /></span>
              {:else}
                <span class="stick">{#if s.doneAt}<Tick checked label={s.title} />{/if}</span>
              {/if}
              <span class="stxt"><Linked text={s.title} /></span>
              {#if s.doneBy}<span class="who" style:--who="var(--person-{s.doneBy === 'B' ? 'b' : 'a'})">{names[s.doneBy]}</span>{/if}
            </li>
          {/each}
        </ul>
      {/if}
      {#if task.start && !done}<p class="note">{t('wed.starts', { d: formatDate(task.start) })}</p>{/if}
      {#if task.doneBy}
        <p class="note" data-wed-by={task.doneBy}>{t('wed.byWho', { name: names[task.doneBy] })}</p>
      {:else if done}
        <p class="note" data-wed-imported>{t('wed.imported.task')}</p>
      {/if}
      {#if canEdit}
        <div class="acts">
          <button type="button" class="btn small paper" data-wed-edit data-sfx="open" onclick={() => onedit(task.id)}><Icon name="edit" size={18} />{t('common.edit')}</button>
          <button type="button" class="btn small" class:paper={done} data-wed-page-tick data-sfx={done ? 'toggle-off' : 'confirm'} onclick={() => ontick(task.id, !done)}>
            {#if !done}<Icon name="check" size={18} stroke={2.6} />{/if}{done ? t('wed.reopen') : t('wed.complete')}
          </button>
        </div>
      {/if}
    </div>
  {/if}
</article>

<style>
  /* a row of the month's dense card (the stitch between rows is the card's), opening downward */
  .tk { flex-direction: column; align-items: stretch; gap: 0; padding: 0; }
  .line { display: flex; align-items: stretch; }
  /* the tick: 24px drawn, its 44px hit inside the row's left edge */
  .tick { flex: none; width: 48px; display: grid; place-items: center; }
  .head {
    appearance: none; border: 0; background: none; color: inherit; font: inherit; text-align: start; cursor: pointer; flex: 1; min-width: 0;
    display: grid; grid-template-columns: 30px minmax(0, 1fr) auto; column-gap: 10px; align-items: center; padding: 9px 12px 9px 0; min-height: 56px;
    -webkit-tap-highlight-color: transparent;
  }
  .head:active { background: var(--hl); }
  .head:focus-visible { outline-offset: -3px; }
  .dc { display: flex; flex-direction: column; align-items: center; line-height: 1; font-family: var(--font-num); font-variant-numeric: tabular-nums; }
  .mo { font: 700 var(--fs-xs)/1 var(--font-ui); color: var(--text-soft); margin-bottom: 2px; }
  .dd { font-size: 20px; font-weight: 600; color: var(--text); }
  .dash { color: var(--edge); }
  .over .mo, .over .dd { color: var(--coral-text); }
  .theday .mo, .theday .dd { color: var(--c-rose); }
  .tt { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 3; line-clamp: 3; overflow: hidden; overflow-wrap: anywhere; font-size: var(--fs-body); line-height: 1.35; }
  .done .tt { color: var(--text-soft); }
  .meta { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; margin-top: 4px; }
  .meta :global(svg) { flex: none; }
  .rel { align-self: start; padding-top: 2px; font-size: var(--fs-s); color: var(--text-soft); white-space: nowrap; }
  .over .rel { color: var(--coral-text); font-weight: 600; }

  .more { padding: 0 12px 12px 88px; display: grid; gap: 4px; }
  .subs { list-style: none; margin: 0 0 4px; padding: 0; }
  .subs li { display: flex; align-items: flex-start; gap: 8px; min-height: 40px; }
  .stick { flex: none; width: 24px; height: 40px; display: grid; place-items: center; }
  .stxt { flex: 1; min-width: 0; padding: 9px 0; font-size: var(--fs-body); line-height: 1.45; overflow-wrap: anywhere; }
  li.done .stxt { color: var(--text-soft); text-decoration: line-through; text-decoration-color: color-mix(in srgb, var(--text-soft) 50%, transparent); }
  .who { flex: none; display: inline-flex; align-items: center; gap: 4px; padding-top: 13px; font: 700 var(--fs-xs)/1 var(--font-ui); color: var(--text-soft); white-space: nowrap; }
  .who::before { content: ''; width: 8px; height: 8px; border-radius: 50%; background: var(--who); }
  .note { margin: 0; font-size: var(--fs-s); line-height: 1.5; color: var(--text-soft); }
  .acts { display: flex; justify-content: flex-end; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
  .acts .btn { margin: 0 0 var(--lip-h); gap: 6px; padding: 0 14px; }
  .acts .btn :global(svg) { width: 18px; height: 18px; }
</style>
