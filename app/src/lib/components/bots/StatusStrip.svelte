<script lang="ts">
  // The bots' status strip (docs/design.md "Bots"): 保養所's 直近1時間 (a cell a minute) and ジム's 直近12時間 (a cell a
  // check interval), one look: the title and the legend, the cells (lib/strip.ts: ok green, avail yellow and full
  // height, fail red, hatched and full height, none outlined: neither colour alone), the times under them, and the line
  // of the cell picked. One labelled group, a tab stop (the picked cell, else the newest): a tap anywhere picks the cell
  // under it (≤ 72 cells are narrower than a finger), ← → Home End walk them; VoiceOver reads `summary`, each cell its
  // line. `attr`: the page's data-* prefix (data-its-strip, data-its-cell, …).
  import { cue } from '#lib/sound/cues.ts';
  import type { CellState, StripCell, StripTick } from '#lib/strip.ts';

  interface Props {
    cells: readonly StripCell[];
    ticks: readonly StripTick[];
    title: string;
    legend: Record<CellState, string>;
    /** The strip's one line for VoiceOver. */
    summary: string;
    /** The line while no cell is picked. */
    hint: string;
    attr: string;
  }
  let { cells, ticks, title, legend, summary, hint, attr }: Props = $props();

  let picked = $state<number | null>(null);
  let strip = $state<HTMLElement>();
  const n = $derived(cells.length);
  const STATES: CellState[] = ['ok', 'avail', 'fail', 'none'];
  const data = (k: string, v: string | number | boolean = '') => ({ [`data-${attr}-${k}`]: v });

  function focusCell(i: number, preventScroll = false) {
    strip?.querySelectorAll<HTMLElement>('.cell')[i]?.focus({ preventScroll });
  }

  /** A tap anywhere on the strip picks the cell under it. */
  function pickAt(e: PointerEvent) {
    if (!strip || !n) return;
    const r = strip.getBoundingClientRect();
    picked = Math.min(n - 1, Math.max(0, Math.floor(((e.clientX - r.left) / r.width) * n)));
    cue('tick');
    focusCell(picked, true);
    e.preventDefault();
  }

  function onkey(e: KeyboardEvent) {
    const step = e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : e.key === 'Home' ? -n : e.key === 'End' ? n : 0;
    if (!step) return;
    e.preventDefault();
    picked = Math.min(n - 1, Math.max(0, (picked ?? n - 1) + step));
    focusCell(picked);
  }

  /** A time at the edge kept inside the strip (left- or right-aligned to its cell). */
  const edge = (i: number) => ((i + 0.5) / n < 0.07 ? '0 0' : (i + 0.5) / n > 0.93 ? '-100% 0' : undefined);
</script>

<div class="scans" {...data('scans')}>
  <div class="shead"><b>{title}</b>
    <span class="legend" aria-hidden="true">{#each STATES as k (k)}<span><i class="cell {k}"></i>{legend[k]}</span>{/each}</span>
  </div>
  <div class="strip" role="toolbar" tabindex="-1" aria-label={summary} bind:this={strip} onpointerdown={pickAt} onkeydown={onkey} {...data('strip')}>
    {#each cells as c, i (c.start)}
      <button type="button" class="cell {c.state}" class:on={picked === i} tabindex={i === (picked ?? n - 1) ? 0 : -1} aria-label={c.label}
        aria-pressed={picked === i} {...data('cell', c.state)} data-sfx="none" onclick={() => (picked = i)}></button>
    {/each}
  </div>
  <div class="ticks" aria-hidden="true">{#each ticks as k (k.i)}<span style:left="{((k.i + 0.5) / n) * 100}%" style:translate={edge(k.i)}>{k.label}</span>{/each}</div>
  <p class="sline" aria-live="polite" {...data('scan-line')}>{picked === null || !cells[picked] ? hint : cells[picked].label}</p>
</div>

<style>
  /* each cell outlined in the edge (the pale fills need it to read, 3:1); a failure hatched, a room full height, so
     neither is colour alone */
  .scans { display: grid; gap: 4px; margin-bottom: 12px; }
  .shead { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 4px 10px; font-size: var(--fs-s); }
  .legend { display: flex; flex-wrap: wrap; gap: 2px 10px; font-weight: 700; color: var(--text-soft); }
  .legend span { display: inline-flex; align-items: center; gap: 4px; }
  .legend .cell { display: inline-block; width: 10px; height: 12px; flex: none; }
  .strip { display: flex; align-items: flex-end; gap: 1px; height: var(--hit); padding: 6px 0; touch-action: pan-y; cursor: pointer; }
  .strip .cell { appearance: none; border: 0; padding: 0; flex: 1 1 0; min-width: 0; height: 70%; cursor: pointer; }
  .cell { border-radius: 2px; box-shadow: inset 0 0 0 1px var(--edge); background: var(--ctl-off); }
  .cell.ok { background: var(--c-leaf); }
  .strip .cell.avail { height: 100%; }
  .cell.avail { background: var(--c-yuzu); }
  .strip .cell.fail { height: 100%; }
  .cell.fail { background: repeating-linear-gradient(135deg, var(--c-coral) 0 3px, color-mix(in srgb, var(--c-coral) 45%, var(--card)) 3px 5px); }
  .cell.none { background: transparent; box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--edge) 55%, transparent); }
  .strip .cell.on { outline: 2px solid var(--text); outline-offset: 1px; }
  .strip .cell:focus-visible { outline: 3px solid var(--focus); outline-offset: 1px; }
  .ticks { position: relative; height: 1.3em; font: 700 var(--fs-s)/1.3 var(--font-num); color: var(--text-soft); }
  .ticks span { position: absolute; translate: -50% 0; white-space: nowrap; }
  .sline { margin: 0; min-height: 1.3em; font-size: var(--fs-s); font-weight: 700; color: var(--text); font-variant-numeric: tabular-nums; }
</style>
