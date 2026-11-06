<script lang="ts">
  // One task on けっこんしき's plan: a card (its month over its day in one column, the title, its category chip, the
  // start, the checklist's tally, a due line when it's near or past), the whole card one tap (→ its page), and beside
  // it the ✓ bubble a member ticks (its own 44px target: a button holds no button). Done: the bubble full, the title
  // soft, who did it on a chip in their colour (the old board's rows: 「むかしの きろく」). The guest's card has no ✓
  // to tap: a finished one shows the mark, an open one nothing.
  import { tagOf } from '#lib/ui-state/viewer.ts';
  import { t } from '#lib/i18n/index.ts';
  import { dueLine, monthShort, shortDay } from './format.ts';
  import type { Task, Who3 } from './view.ts';

  interface Props {
    task: Task;
    today: string;
    canEdit: boolean;
    names: Record<Who3, string>;
    onopen: (id: string) => void;
    ontick?: (id: string, done: boolean) => void;
  }
  let { task, today, canEdit, names, onopen, ontick }: Props = $props();
  const due = $derived(dueLine(today, task));
  const tally = $derived(task.progress.tally);
  const dated = $derived(!!task.due && /^\d{4}-\d{2}-\d{2}$/.test(task.due));
  const dateLabel = $derived(dated ? `${Number(task.due!.slice(0, 4))}/${shortDay(task.due!)}` : t('wed.sec.nodate'));
</script>

<article class="card" class:done={task.done} class:over={due?.tone === 'over'} data-wed-task={task.id} data-done={task.done || undefined}>
  <button type="button" class="head" data-sfx="open" aria-label="{task.title}、{dateLabel}{due ? `、${due.text}` : ''}{tally ? `、${t('wed.tallyLabel', tally)}` : ''}" onclick={() => onopen(task.id)}>
    <span class="date" aria-hidden="true">
      {#if dated}<small>{monthShort(task.due!)}</small><b>{Number(task.due!.slice(8, 10))}</b>{:else}<b class="dash">–</b>{/if}
    </span>
    <span class="body">
      <span class="ttl">{task.title}</span>
      <span class="meta" aria-hidden="true">
        {#if task.cat}<span class="cat">{task.cat}</span>{/if}
        {#if due}<span class="due {due.tone}">{due.text}</span>{/if}
        {#if task.start && !task.done && task.start > today}<span class="starts">{t('wed.starts', { d: shortDay(task.start) })}</span>{/if}
        {#if tally}<span class="tally" data-wed-tally={`${tally.done}/${tally.total}`}><svg viewBox="0 0 16 16"><path d="M3 8.5 6.5 12 13 4.5" /></svg>{tally.done}/{tally.total}</span>{/if}
        {#if task.done && task.imported}<span class="who old" data-wed-imported>{t('wed.imported')}</span>
        {:else if task.done && task.by}<span class="who" style:--tag={tagOf(task.by)} data-wed-by={task.by}>{names[task.by]}</span>{/if}
      </span>
    </span>
  </button>
  {#if canEdit}
    <button type="button" class="tick" aria-pressed={task.done} aria-label={task.done ? t('wed.untick', { title: task.title }) : t('wed.tick', { title: task.title })}
      data-wed-tick={task.id} data-sfx={task.done ? 'toggle-off' : 'confirm'} onclick={() => ontick?.(task.id, !task.done)}>
      <span class="bub"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5 10 17.5 19 7" /></svg></span>
    </button>
  {:else if task.done}
    <span class="mark" role="img" aria-label={t('wed.doneMark')} data-wed-mark><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5 10 17.5 19 7" /></svg></span>
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
  .body { flex: 1; min-width: 0; display: grid; gap: 5px; }
  .ttl { font: 700 var(--fs-body)/1.35 var(--font-ui); overflow-wrap: anywhere; }
  .done .ttl { color: var(--text-soft); }
  .meta { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 6px; font: 700 var(--fs-s)/1 var(--font-ui); color: var(--text-soft); }
  .meta:empty { display: none; }
  .meta > span { white-space: nowrap; }
  .cat { padding: 3px 8px 2px; border-radius: var(--r-pill); background: color-mix(in srgb, var(--c-lip) 40%, var(--card)); color: var(--text); }
  .due.over { color: var(--coral-text); }
  .due.soon { color: var(--leaf-text); }
  .tally { display: inline-flex; align-items: center; gap: 2px; font-family: var(--font-num); font-variant-numeric: tabular-nums; }
  .tally svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round; }
  .who { padding: 3px 8px 2px; border-radius: var(--r-pill); background: var(--tag); color: var(--c-ink); }
  .who.old { background: var(--ctl-off); color: var(--text-soft); }
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
  .bub svg, .mark svg { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
  .tick:active .bub { transform: translateY(2px) scale(.94); box-shadow: var(--sh-ctl-press); }
  .tick[aria-pressed='true'] .bub {
    background: var(--c-leaf); color: var(--c-ink); box-shadow: inset 0 0 0 2px var(--c-leaf-edge), 0 var(--lip-h) 0 var(--c-leaf-edge);
    animation: pop 320ms var(--ease-bounce);
  }
  @keyframes pop { 0% { transform: scale(.7); } 60% { transform: scale(1.15); } 100% { transform: none; } }
  .mark { flex: none; display: grid; place-items: center; width: 52px; color: var(--leaf-text); }
  @media (prefers-reduced-motion: reduce) { .tick[aria-pressed='true'] .bub { animation: none; } }
</style>
