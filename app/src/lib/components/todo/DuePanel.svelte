<script lang="ts">
  // The menu's 今日・明日 panel (docs/design.md "Menu"; docs/todo.md "The sheet"): left of the leaf menu's pills, top-
  // aligned with the first, an always-cream world-kit card in the pills' look (kanji, as they are). 今日 then 明日: the
  // items due those days, timed ones by their time, then the rest in list order; each row its Tick (shared: anyone's
  // tick is everyone's; a ticked row stays, struck through, until the menu folds, and ticks back), its text and time.
  // Past undone items are never listed: one soft row 「前の日 N件 ›」 opens やること. Never an inner scroll: what doesn't
  // fit the pills' height becomes 「ほか N件 ›」 (「明日ほか N件 ›」 when only 明日's are cut). A row's text opens やること
  // on its list at the item. HudMenu mounts it while the menu is open (not in edit mode, nor with やること's pill hidden,
  // its chunk fetched as the leaf is touched); with nothing due today, tomorrow or before, it draws nothing.
  //   <DuePanel maxH={420} width="200px" onopen={(go) => …} />
  import '#lib/i18n/todo.ts';
  import { SvelteSet } from 'svelte/reactivity';
  import Tick from '../ui/Tick.svelte';
  import { todo } from './todo.svelte.ts';
  import { todoSheet } from './open.svelte.ts';
  import { duePanelOf, panelEmpty, panelWhen, type DueRow } from './dueLabel.ts';
  import { dayKey, minuteNow } from '#lib/time/clock.ts';
  import { t } from '#lib/i18n/index.ts';

  interface Props {
    /** The pills' column height: the card never taller (px). */
    maxH: number;
    /** The card's width (a CSS length). */
    width: string;
    /** A row's text or a › row tapped: the menu folds and `go` opens the sheet (HudMenu's pick). */
    onopen: (go: () => void) => void;
  }
  let { maxH, width, onopen }: Props = $props();

  /** Ticked done while it's up: still listed, struck through (a mis-tick is undone in place). */
  const kept = new SvelteSet<string>();
  const panel = $derived(duePanelOf(todo.lists, dayKey(minuteNow()), kept));
  function tickRow(id: string, v: boolean) {
    if (v) kept.add(id);
    todo.tick(id, v);
  }

  /** The card's measures (its CSS below): the padding and edge, a section's label, a row, the stitch between days. */
  const PAD = 12, LABEL = 26, ROW = 44, STITCH = 9;

  type Line = { k: 'label'; day: 'today' | 'tomorrow' } | { k: 'row'; row: DueRow } | { k: 'stitch' } | { k: 'past'; n: number } | { k: 'more'; n: number; tomorrow: boolean };

  /** What fits in `maxH`: the past row first, 今日's label and rows, a stitch, 明日's; rows cut from the end into one
   *  ほか row. */
  const lines = $derived.by((): Line[] => {
    const all: Line[] = [];
    if (panel.past) all.push({ k: 'past', n: panel.past });
    if (panel.today.length) all.push({ k: 'label', day: 'today' }, ...panel.today.map((row) => ({ k: 'row', row }) as const));
    if (panel.tomorrow.length) {
      if (panel.today.length) all.push({ k: 'stitch' });
      all.push({ k: 'label', day: 'tomorrow' }, ...panel.tomorrow.map((row) => ({ k: 'row', row }) as const));
    }
    const h = (l: Line) => (l.k === 'label' ? LABEL : l.k === 'stitch' ? STITCH : ROW);
    const total = all.reduce((s, l) => s + h(l), PAD);
    if (total <= maxH) return all;
    // cut from the end (a day's label never left without a row under it, nor a stitch at the end) until the ほか row fits
    const cut: DueRow[] = [];
    let used = total + ROW;
    while (all.length && used > maxH) {
      const l = all.pop()!;
      used -= h(l);
      if (l.k === 'row') cut.unshift(l.row);
      const end = all.at(-1);
      if (end?.k === 'label' || end?.k === 'stitch') used -= h(all.pop()!);
      if (all.at(-1)?.k === 'stitch') used -= h(all.pop()!);
    }
    const tomorrow = cut.every((r) => r.day === 'tomorrow') && all.some((l) => l.k === 'label' && l.day === 'tomorrow');
    all.push({ k: 'more', n: cut.length, tomorrow });
    return all;
  });

  const openAt = (row: DueRow) => onopen(() => todoSheet.show({ list: row.list, item: row.id }));
  const openAll = () => onopen(() => todoSheet.show());
</script>

{#if !panelEmpty(panel)}
<section class="due" style:width={width} aria-label={t('todo.panel')} data-guard data-due-panel>
  {#each lines as l, i (l.k === 'row' ? l.row.id : `${l.k}${i}`)}
    {#if l.k === 'label'}
      <h3 class="lbl" data-due-day={l.day}>{t(l.day === 'today' ? 'todo.today' : 'todo.tomorrow')}</h3>
    {:else if l.k === 'stitch'}
      <hr class="stitch" />
    {:else if l.k === 'row'}
      {@const when = panelWhen(l.row.due)}
      <div class="row" class:done={l.row.done} data-due-item={l.row.id} data-done={l.row.done || undefined}>
        <Tick checked={l.row.done} label={l.row.text} onchange={(v) => tickRow(l.row.id, v)} />
        <button type="button" class="txt" data-due-open={l.row.id} data-sfx="open" aria-label={when ? t('todo.rowLabel', { text: l.row.text, when }) : l.row.text}
          onclick={() => openAt(l.row)}><span class="name">{l.row.text}</span>{#if when}<span class="when">{when}</span>{/if}</button>
      </div>
    {:else}
      <button type="button" class="row go" {...{ [`data-due-${l.k}`]: l.n }} data-sfx="open" onclick={openAll}>
        <span class="name">{l.k === 'past' ? t('todo.past', { n: l.n }) : t(l.tomorrow ? 'todo.moreTomorrow' : 'todo.more', { n: l.n })}</span><span class="chev" aria-hidden="true">›</span>
      </button>
    {/if}
  {/each}
</section>
{/if}

<style>
  /* The world kit's cream card (as the pills and FarmPicker's): brown text, the lip under it. */
  .due {
    position: absolute; top: 0; right: calc(100% + 12px); box-sizing: border-box; display: flex; flex-direction: column;
    padding: 4px 4px 4px 0; border-radius: 22px; background: var(--c-cream); color: var(--c-ink);
    box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--c-lip) 70%, transparent), 0 var(--lip-h) 0 var(--c-lip), 0 6px 14px rgb(60 40 20 / .14);
    pointer-events: auto; user-select: none; -webkit-user-select: none; -webkit-touch-callout: none;
  }
  .lbl { margin: 0; height: 26px; padding: 8px 0 0 14px; box-sizing: border-box; font: 700 var(--fs-s)/1 var(--font-ui); color: var(--c-ink-soft); letter-spacing: .04em; }
  .stitch { border: 0; border-top: 1.5px dashed color-mix(in srgb, var(--c-edge) 35%, transparent); margin: 4px 10px 4px 14px; }
  .row { display: flex; align-items: center; height: var(--hit); flex: none; min-width: 0; }
  .row > :global(.tick-wrap) { width: 44px; justify-content: center; }
  .txt, .go {
    appearance: none; border: 0; background: none; color: inherit; margin: 0; cursor: pointer; -webkit-tap-highlight-color: transparent;
    display: flex; align-items: center; gap: 8px; min-width: 0; height: var(--hit); text-align: start; font: 700 var(--fs-body)/1.2 var(--font-ui);
  }
  .txt { flex: 1; padding: 0 10px 0 0; border-radius: 12px; }
  .txt:active, .go:active { background: color-mix(in srgb, var(--c-lip) 35%, transparent); }
  .name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .when { flex: none; font: 600 var(--fs-s)/1 var(--font-num); font-variant-numeric: tabular-nums; color: var(--c-ink-soft); }
  .done .name { color: var(--c-ink-soft); text-decoration: line-through; text-decoration-thickness: 1.5px; }
  .go { width: 100%; padding: 0 12px 0 14px; border-radius: 12px; color: var(--c-ink-soft); font-weight: 600; font-size: var(--fs-s); }
  .chev { flex: none; font: 700 var(--fs-body)/1 var(--font-ui); }
</style>
