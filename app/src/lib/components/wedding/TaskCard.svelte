<script lang="ts">
  // One task on けっこんしき's plan: a card (its month over its day in one column, the title on three lines at most, its
  // category chip, the start, a due line when it's near or past, the checklist's tally), the whole card one tap (→ its
  // page), and beside it the ✓ bubble a member ticks (its own 44px target: a button holds no button). Done: the bubble
  // full, the title soft, who ticked it on a chip in their colour (none for the old Sheet's ticks, which never
  // recorded who). The guest's card has no ✓ to tap: a finished one shows the mark, an open one nothing.
  import Icon from './Icon.svelte';
  import { tagOf } from '#lib/ui-state/viewer.ts';
  import { md } from '#lib/i18n/format.ts';
  import { t } from '#lib/i18n/index.ts';
  import { dueLine, monthShort } from './format.ts';
  import type { Who } from '#lib/types.ts';
  import type { Task } from './view.ts';

  interface Props {
    task: Task;
    today: string;
    canEdit: boolean;
    names: Record<Who, string>;
    /** The wedding day: its own card wears the blush and a heart. */
    wedding: string;
    onopen: (id: string) => void;
    ontick: (id: string, done: boolean) => void;
  }
  let { task, today, canEdit, names, wedding, onopen, ontick }: Props = $props();
  const due = $derived(dueLine(task));
  const tally = $derived(task.progress.tally);
  const done = $derived(!!task.doneAt);
  const dated = $derived(task.progress.dated);
  const dateLabel = $derived(dated ? `${Number(task.due.slice(0, 4))}/${md(task.due)}` : t('wed.sec.nodate'));
</script>

<article class="card" class:done class:theday={dated && task.due === wedding} class:over={due?.tone === 'over'} data-wed-task={task.id} data-done={done || undefined}>
  <button type="button" class="head" data-sfx="open" aria-label="{task.title}、{dateLabel}{due ? `、${due.text}` : ''}{tally ? `、${t('wed.tallyLabel', tally)}` : ''}" onclick={() => onopen(task.id)}>
    <span class="date" aria-hidden="true">
      {#if dated}<small>{monthShort(task.due)}</small><b>{Number(task.due.slice(8, 10))}</b>{#if task.due === wedding}<i class="heart"></i>{/if}{:else}<b class="dash">–</b>{/if}
    </span>
    <span class="body">
      <span class="ttl">{task.title}</span>
      <span class="meta" aria-hidden="true">
        {#if task.category}<span class="w-cat">{task.category}</span>{/if}
        {#if task.start && !done && task.start > today}<span>{t('wed.starts', { d: md(task.start) })}</span>{/if}
        {#if due}<span class="w-due {due.tone}">{due.text}</span>{/if}
        {#if tally}<span class="tally" data-wed-tally={`${tally.done}/${tally.total}`}><Icon name="tick" size={14} />{tally.done}/{tally.total}</span>{/if}
        {#if task.doneBy}<span class="w-who" style:--tag={tagOf(task.doneBy)} data-wed-by={task.doneBy}>{names[task.doneBy]}</span>{/if}
      </span>
    </span>
  </button>
  {#if canEdit}
    <button type="button" class="tick" aria-pressed={done} aria-label={done ? t('wed.untick', { title: task.title }) : t('wed.tick', { title: task.title })}
      data-wed-tick={task.id} data-sfx={done ? 'toggle-off' : 'confirm'} onclick={() => ontick(task.id, !done)}>
      <span class="bub"><Icon name="tick" size={20} /></span>
    </button>
  {:else if done}
    <span class="mark" role="img" aria-label={t('wed.doneMark')} data-wed-mark><Icon name="tick" size={20} /></span>
  {/if}
</article>

<style>
  .card { display: flex; align-items: stretch; gap: 0; padding: 0; border-radius: 20px; overflow: visible; }
  .head {
    appearance: none; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; text-align: left;
    flex: 1; min-width: 0; display: flex; align-items: center; gap: 12px; padding: 10px 4px 10px 12px; min-height: 64px;
    border-radius: 20px 0 0 20px; -webkit-tap-highlight-color: transparent;
  }
  .head:active { background: var(--hl); }
  .head:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  /* the date column: the month small over the day in Fredoka, the same width on every card */
  .date {
    flex: none; width: 44px; display: grid; justify-items: center; gap: 1px; padding: 5px 0 4px; border-radius: 12px;
    background: color-mix(in srgb, var(--c-mint) 22%, var(--card)); color: var(--text);
  }
  .date small { font: 700 var(--fs-xs)/1 var(--font-ui); color: var(--text-soft); }
  .date b { font: 700 var(--fs-talk)/1 var(--font-num); font-variant-numeric: tabular-nums; }
  .date .dash { color: var(--text-soft); }
  .over .date { background: color-mix(in srgb, var(--c-coral) 26%, var(--card)); }
  /* the day itself: a blush date with a small heart, the card's edge pink */
  .theday { box-shadow: 0 var(--lip-h) 0 #E7A1BA, inset 0 0 0 2px #F7B3CB; }
  .theday .date { position: relative; background: #FFE3EC; color: var(--c-ink); }
  .theday .date small { color: #B44E77; }
  .heart { position: absolute; top: -6px; right: -6px; width: 14px; height: 14px; background: #F07AA2; transform: rotate(45deg); border-radius: 3px 0 3px 3px; }
  .heart::before, .heart::after { content: ''; position: absolute; width: 14px; height: 14px; border-radius: 50%; background: inherit; }
  .heart::before { left: -7px; top: 0; }
  .heart::after { left: 0; top: -7px; }
  .body { flex: 1; min-width: 0; display: grid; gap: 5px; }
  .ttl { font: 700 var(--fs-body)/1.35 var(--font-ui); overflow-wrap: anywhere; overflow: hidden; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 3; line-clamp: 3; }
  .done .ttl { color: var(--text-soft); }
  .meta { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 6px; font: 700 var(--fs-s)/1 var(--font-ui); color: var(--text-soft); }
  .meta:empty { display: none; }
  .meta > span { white-space: nowrap; }
  .tally { display: inline-flex; align-items: center; gap: 2px; font-family: var(--font-num); font-variant-numeric: tabular-nums; }
  /* ✓: a 44px target, a 34px bubble with the brown edge; done: leaf-filled, the tick in ink, a little pop */
  .tick {
    appearance: none; border: 0; background: none; padding: 0 12px 0 6px; cursor: pointer; display: grid; place-items: center; flex: none;
    min-width: 56px; border-radius: 0 20px 20px 0; -webkit-tap-highlight-color: transparent;
  }
  .tick:focus-visible { outline: 3px solid var(--focus); outline-offset: -4px; }
  .bub {
    width: 34px; height: 34px; border-radius: 50%; display: grid; place-items: center; background: var(--ctl); box-shadow: var(--sh-ctl);
    color: transparent; transition: background-color 160ms, transform 260ms var(--ease-bounce);
  }
  .tick:active .bub { transform: translateY(2px) scale(.94); box-shadow: var(--sh-ctl-press); }
  .tick[aria-pressed='true'] .bub {
    background: var(--c-leaf); color: var(--c-ink); box-shadow: inset 0 0 0 2px var(--c-leaf-edge), 0 var(--lip-h) 0 var(--c-leaf-edge);
    animation: pop 320ms var(--ease-bounce);
  }
  @keyframes pop { 0% { transform: scale(.7); } 60% { transform: scale(1.15); } 100% { transform: none; } }
  .mark { flex: none; display: grid; place-items: center; width: 52px; color: var(--leaf-text); }
  @media (prefers-reduced-motion: reduce) { .tick[aria-pressed='true'] .bub { animation: none; } }
</style>
