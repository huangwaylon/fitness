<script lang="ts">
  // The HUD disc's peek (docs/todo.md "The disc and the peek"; TodoDisc mounts it, its own chunk with やること's
  // strings): an always-cream world-kit card under the disc, its tip at it, kanji (the sheets' copy rule). 前の日 (the
  // undone items due before today, their dates in coral text), 今日, 明日: each row its Tick (shared: anyone's tick is
  // everyone's; sent after the undo snackbar's 4 s, 取り消す takes it back; the row stays, struck through, until the peek
  // shuts, and a second tap unticks it), its text (a tap opens やること at the item) and its time. Never an inner scroll:
  // past MAX_ROWS the rest are one 「ほか N件」 row. 「やることを開く ›」 opens the sheet.
  //   <TodoPeek onopen={(go) => …} />
  import '#lib/i18n/todo.ts';
  import { SvelteMap, SvelteSet } from 'svelte/reactivity';
  import Tick from '../ui/Tick.svelte';
  import { todo } from './todo.svelte.ts';
  import { todoSheet } from './open.svelte.ts';
  import { peekOf, peekWhen, type DueRow } from './dueLabel.ts';
  import { dayKey, minuteNow } from '#lib/time/clock.ts';
  import { undoBanner, UNDO_MS } from '#lib/store/actions.ts';
  import type { SendResult } from '#lib/store/backend.ts';
  import { t } from '#lib/i18n/index.ts';

  interface Props {
    /** A row's text, ほか or 開く tapped: the peek shuts and `go` opens the sheet (TodoDisc's). */
    onopen: (go: () => void) => void;
  }
  let { onopen }: Props = $props();

  /** Rows at most (more: one ほか row): the card stays clear of the island's middle on an iPhone 15. */
  const MAX_ROWS = 6;
  /** A name on the one-line snackbar at most (characters). */
  const NAME = 12;
  const clip = (s: string): string => ((cs) => (cs.length > NAME ? `${cs.slice(0, NAME - 1).join('')}…` : s))([...s]);

  /** Ticked while it's up: still listed, struck through; its held send (取り消す, or a second tap, takes it back). */
  const kept = new SvelteSet<string>();
  const held = new SvelteMap<string, SendResult>();
  const peek = $derived(peekOf(todo.items, dayKey(minuteNow()), kept));
  function tickRow(r: DueRow, v: boolean) {
    const h = held.get(r.id);
    if (!v && h?.undo) {
      held.delete(r.id);
      h.undo();
      return;
    }
    const res = todo.tick(r.id, v, v ? UNDO_MS : 0);
    if (!res.ok || !v) return;
    kept.add(r.id);
    held.set(r.id, res);
    undoBanner(t('todo.ticked', { name: clip(r.text) }), res);
  }

  type Day = 'past' | 'today' | 'tomorrow';
  /** The sections drawn, rows cut from the end past MAX_ROWS (a day left with none drops its label). */
  const shown = $derived.by(() => {
    let room = MAX_ROWS;
    const out: { day: Day; rows: DueRow[] }[] = [];
    for (const day of ['past', 'today', 'tomorrow'] as const) {
      const rows = peek[day].slice(0, Math.max(0, room));
      room -= rows.length;
      if (rows.length) out.push({ day, rows });
    }
    return { out, more: peek.past.length + peek.today.length + peek.tomorrow.length - (MAX_ROWS - Math.max(0, room)) };
  });

  const openAt = (r: DueRow) => onopen(() => todoSheet.show({ item: r.id }));
  const openAll = () => onopen(() => todoSheet.show());
</script>

<section class="peek" aria-label={t('todo.peek')} data-guard data-todo-peek>
  {#each shown.out as s (s.day)}
    {#if s.day === 'tomorrow' && shown.out.length > 1}<hr class="stitch" />{/if}
    <h3 class="lbl" class:ov={s.day === 'past'} data-peek-day={s.day}>{t(s.day === 'past' ? 'todo.pastDays' : s.day === 'today' ? 'todo.today' : 'todo.tomorrow')}</h3>
    {#each s.rows as r (r.id)}
      {@const when = peekWhen(r)}
      <div class="row" class:done={r.done} data-peek-item={r.id} data-done={r.done || undefined}>
        <Tick checked={r.done} label={r.text} onchange={(v) => tickRow(r, v)} />
        <button type="button" class="txt" data-peek-open={r.id} data-sfx="open" aria-label={when ? t('todo.rowLabel', { text: r.text, when }) : r.text}
          onclick={() => openAt(r)}><span class="name">{r.text}</span>{#if when}<span class="when" class:ov={r.day === 'past'}>{when}</span>{/if}</button>
      </div>
    {/each}
  {/each}
  {#if shown.more > 0}
    <button type="button" class="row more" data-peek-more={shown.more} data-sfx="open" onclick={openAll}>{t('todo.more', { n: shown.more })}</button>
  {/if}
  <button type="button" class="go" data-peek-all data-sfx="open" onclick={openAll}>{t('todo.openAll')}<span aria-hidden="true">›</span></button>
</section>

<style>
  /* The world kit's cream card (the pills' and FarmPicker's): brown text, the lip under it, its tip up at the disc
     (--tip: the tip's centre from the card's right edge, TodoDisc's). */
  .peek {
    position: absolute; top: calc(100% + 14px); right: var(--peek-right, 0px); z-index: 1; box-sizing: border-box;
    width: min(300px, calc(100vw - 2 * max(14px, var(--safe-right)))); display: flex; flex-direction: column;
    padding: 8px 6px 6px; border-radius: 26px; background: var(--c-cream); color: var(--c-ink);
    box-shadow: 0 var(--lip-h) 0 var(--c-lip), 0 10px 26px rgb(60 40 20 / .2);
    pointer-events: auto; user-select: none; -webkit-user-select: none; -webkit-touch-callout: none;
    transform-origin: calc(100% - var(--tip, 22px)) 0; animation: drop 180ms var(--ease-soft) both;
  }
  .peek::before {
    content: ''; position: absolute; top: -6px; right: calc(var(--tip, 22px) - 7px); width: 14px; height: 14px;
    background: inherit; border-radius: 3px 0 0 0; transform: rotate(45deg);
  }
  .lbl { margin: 6px 14px 2px; font: 700 var(--fs-s)/1.2 var(--font-ui); color: var(--c-ink-soft); letter-spacing: .06em; }
  .lbl.ov, .when.ov { color: var(--c-coral-text); }
  .stitch { border: 0; border-top: 1.5px dashed color-mix(in srgb, var(--c-edge) 35%, transparent); margin: 6px 14px 2px; }
  .row { display: flex; align-items: center; min-height: var(--hit); min-width: 0; }
  .row > :global(.tick-wrap) { width: 44px; justify-content: center; }
  .txt, .more, .go {
    appearance: none; border: 0; background: none; color: inherit; margin: 0; cursor: pointer; -webkit-tap-highlight-color: transparent;
    font: 700 var(--fs-body)/1.2 var(--font-ui); text-align: start;
  }
  .txt { flex: 1; min-width: 0; display: flex; align-items: center; gap: 8px; height: var(--hit); padding: 0 12px 0 2px; border-radius: 12px; }
  .txt:active, .more:active { background: color-mix(in srgb, var(--c-lip) 35%, transparent); }
  .name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .when { flex: none; font: 600 var(--fs-s)/1 var(--font-num); font-variant-numeric: tabular-nums; color: var(--c-ink-soft); }
  .done .name { color: var(--c-ink-soft); text-decoration: line-through; text-decoration-thickness: 1.5px; }
  .more { padding: 0 14px; border-radius: 12px; color: var(--c-ink-soft); font-weight: 600; font-size: var(--fs-s); }
  .go {
    display: flex; align-items: center; justify-content: center; gap: 6px; height: var(--hit); margin-top: 6px; border-radius: 20px;
    background: color-mix(in srgb, var(--c-lip) 30%, var(--c-cream)); font-size: var(--fs-s);
  }
  .go:active { background: color-mix(in srgb, var(--c-lip) 55%, var(--c-cream)); }
  @keyframes drop { from { opacity: 0; transform: translateY(-6px) scale(.96); } }
</style>
