<script lang="ts">
  // A bot's recent checks (docs/bots.md), in its Jobs service row (ServiceRow): the cells drawn 32 high in a 44 hit (ok
  // green, avail green full height, warn yellow capped, fail coral hatched, idle a low sunk bar (ran, nothing to
  // check), none a low tick: never colour alone) the row's width, 前回 ringed; the ticks (前回's time the right-hand
  // one, in ink); one line: each state's swatch and count (only those > 0) and the 成果 term, the picked cell's line
  // once one is tapped, and Next at its end (never read as a range with 前回's time). The cells are drawn only: one
  // hit layer the strip's full height, a slider and one tab stop (a tap or a drag picks the cell nearest the finger's
  // x; ← → Home End walk them); VoiceOver reads `summary`, then the picked cell's line. Nothing kept: `empty` in the
  // strip's place, else nothing. `page`: the data-* prefix (data-its-strip, …).
  import { formatNum, scoped } from '#lib/i18n/index.ts';
  import { cue } from '#lib/sound/cues.ts';
  import { pickIndex, type CardStrip, type CellState } from '#lib/strip.ts';

  let { strip, page }: { strip: CardStrip; page: string } = $props();
  const { t } = scoped();
  const data = (k: string, v: string | number = '') => ({ [`data-${page}-${k}`]: v });

  const STATES: CellState[] = ['ok', 'avail', 'warn', 'fail', 'idle'];
  const cells = $derived(strip.cells);
  const n = $derived(cells.length);
  const blank = $derived(!cells.some((c) => c.state !== 'none'));
  // (idle's word, a label without a number, only when nothing else is counted: a strip of idle alarms alone)
  const counts = $derived.by(() => {
    const all = STATES.flatMap((s) => {
      const k = cells.filter((c) => c.state === s).length;
      return k && strip.words[s] ? [{ s, label: strip.words[s]!, n: k }] : [];
    });
    return all.some((c) => c.s !== 'idle') ? all.filter((c) => c.s !== 'idle') : all;
  });
  /** The ticks: 前回's in ink, the others clear of it. */
  const ticks = $derived.by(() => {
    const last = strip.last;
    const others = strip.ticks.filter((k) => !last || Math.abs(k.i - last.i) / n > 0.18).map((k) => ({ ...k, last: false }));
    return last ? [...others, { ...last, last: true }] : others;
  });

  /** The cell picked, by its start (a read that shifts the cells keeps it on its slot); gone from the window: none. */
  let pickedAt = $state<number | null>(null);
  const picked = $derived(pickIndex(cells, pickedAt));
  $effect(() => {
    if (pickedAt !== null && picked === null) pickedAt = null;
  });
  let el = $state<HTMLElement>();
  let dragging = false;
  /** The cell nearest the pointer's x (a tick when it changes). */
  function pickAt(e: PointerEvent) {
    if (!el || !n) return;
    const r = el.getBoundingClientRect();
    const i = Math.min(n - 1, Math.max(0, Math.floor(((e.clientX - r.left) / r.width) * n)));
    if (i !== picked) cue('tick');
    pickedAt = cells[i].start;
  }
  function down(e: PointerEvent) {
    dragging = true;
    el?.setPointerCapture?.(e.pointerId);
    el?.focus({ preventScroll: true });
    pickAt(e);
    e.preventDefault();
  }
  function onkey(e: KeyboardEvent) {
    const step = e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : e.key === 'Home' ? -n : e.key === 'End' ? n : 0;
    if (!step) return;
    e.preventDefault();
    pickedAt = cells[Math.min(n - 1, Math.max(0, (picked ?? n - 1) + step))].start;
  }
  /** A time at the edge kept inside the cells (left- or right-aligned to its cell). */
  const edge = (i: number) => ((i + 0.5) / n < 0.07 ? '0 0' : (i + 0.5) / n > 0.9 ? '-100% 0' : undefined);
  const left = (i: number) => ((i + 0.5) / n < 0.07 ? `${(i / n) * 100}%` : (i + 0.5) / n > 0.9 ? `${((i + 1) / n) * 100}%` : `${((i + 0.5) / n) * 100}%`);
</script>

{#if blank && strip.empty}
  <p class="empty" role="status" {...data('empty')}>{strip.empty.text}</p>
{:else if !blank}
  <div class="scans" {...data('scans')}>
    <div class="strip" role="slider" tabindex="0" aria-label={strip.summary} aria-valuemin={0} aria-valuemax={n - 1} aria-valuenow={picked ?? n - 1}
      aria-valuetext={cells[picked ?? n - 1]?.label} bind:this={el} data-sfx="self" onkeydown={onkey} onpointerdown={down}
      onpointermove={(e) => dragging && pickAt(e)} onpointerup={() => (dragging = false)} onpointercancel={() => (dragging = false)} {...data('strip')}>
      {#each cells as c, i (c.start)}<i class="cell {c.state}" class:on={picked === i} class:last={strip.last?.i === i} data-on={picked === i || undefined}
        data-last={strip.last?.i === i || undefined} {...data('cell', c.state)}></i>{/each}
    </div>
    <div class="ticks" aria-hidden="true">{#each ticks as k (`${k.i}-${k.last}`)}<span class:last={k.last} style:left={left(k.i)} style:translate={edge(k.i)} data-last={k.last || undefined} {...data('tick')}>{k.label}</span>{/each}</div>
  </div>
  <div class="sline">
    <p class="line" aria-live="polite" {...data('scan-line')}>
      {#if picked !== null && cells[picked]}{cells[picked].label}
      {:else}
        {#each counts as c (c.s)}<span class="count" {...data('count', c.s)}><i class="cell {c.s}" aria-hidden="true"></i>{c.label}{#if c.s !== 'idle'}<span class="n">{formatNum(c.n)}</span>{/if}</span>{/each}
        {#if strip.outcome}<span class="outcome" {...data('outcome')}>{strip.outcome}</span>{/if}
      {/if}
    </p>
    {#if strip.next}<span class="next" {...data('next')}>{t('bots.key.next')} {strip.next}</span>{/if}
  </div>
{/if}

<style>
  /* the strip: the cells the row's width, the ticks under them */
  .scans { margin-top: 4px; }
  .strip { display: flex; align-items: flex-end; gap: 1px; height: var(--hit); padding: 6px 0; touch-action: pan-y; cursor: pointer; outline: none; border-radius: 4px; }
  .strip:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  .strip .cell { flex: 1 1 0; min-width: 0; height: 60%; }
  .cell { border-radius: 2px; box-shadow: inset 0 0 0 1px var(--edge); background: var(--ctl-off); }
  .cell.ok, .cell.avail { background: var(--c-leaf); }
  .strip .cell.avail, .strip .cell.warn, .strip .cell.fail { height: 100%; }
  .cell.warn { background: var(--c-yuzu); box-shadow: inset 0 3px 0 var(--text-soft), inset 0 0 0 1px var(--edge); }
  .cell.fail { background: repeating-linear-gradient(135deg, var(--c-coral) 0 3px, color-mix(in srgb, var(--c-coral) 45%, var(--card)) 3px 5px); }
  .strip .cell.none { height: 4px; }
  /* idle: ran with nothing to check, a low sunk bar (neither none's tick nor ok's green) */
  .strip .cell.idle { height: 30%; box-shadow: inset 0 2px 0 var(--edge), inset 0 0 0 1px var(--edge); }
  .cell.none { box-shadow: none; background: color-mix(in srgb, var(--edge) 35%, var(--ctl-off)); }
  /* 前回 ringed; a picked cell outlined */
  .strip .cell.last, .strip .cell.on { outline: 2px solid var(--text); outline-offset: 1px; }
  .ticks { position: relative; height: 1.3em; font: 700 11px/1.3 var(--font-num); color: var(--text-soft); }
  .ticks span { position: absolute; translate: -50% 0; white-space: nowrap; }
  .ticks span.last { color: var(--text); }
  /* one row: the line (the counts and 成果, or the picked cell's), 次回 at its end as メニュー's info sits on its row */
  .sline { display: flex; align-items: baseline; gap: 10px; margin-top: 2px; min-height: 1.3em; font-size: var(--fs-s); font-weight: 700; color: var(--text); font-variant-numeric: tabular-nums; line-height: var(--lh); }
  .line { display: flex; flex-wrap: wrap; align-items: center; gap: 2px 10px; margin: 0; min-width: 0; }
  .count { display: inline-flex; align-items: center; gap: 4px; color: var(--text-soft); }
  /* every state's swatch one 10×10 square (its fill tells it, as the calendars' legends) */
  .count .cell { display: inline-block; width: 10px; height: 10px; flex: none; }
  .count .n { margin-left: 3px; }
  .outcome { color: var(--text); }
  .next { margin-left: auto; color: var(--text-soft); white-space: nowrap; }
  /* nothing kept: a plain soft line the strip's height in its place (no slab: it isn't a control) */
  .empty { display: flex; align-items: center; min-height: 32px; margin: 6px 0 0; color: var(--text-soft); font-size: var(--fs-s); font-weight: 700; }
</style>
