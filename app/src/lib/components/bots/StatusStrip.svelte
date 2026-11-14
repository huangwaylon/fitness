<script lang="ts">
  // A bot's history strip (docs/design.md "Bots"), one card on the three pages: the span (「直近12時間（1枠15分）」), the
  // legend of the states it can show, the cells (lib/strip.ts: drawn 24 high in a 44 hit; ok green, avail green full
  // height, warn yellow capped in ink, fail coral hatched, none a low tick: never colour alone), the times under them,
  // and one line: the summary (確認46回 · 失敗1 · 空き3), the picked cell's once one is tapped. Nothing kept (every cell
  // none): `empty` as a warning in the cells' place (保養所 running), else the page leaves the card out. One labelled
  // group, a tab stop (the picked cell, else the newest): a tap anywhere picks the cell under it (≤ 72 cells are
  // narrower than a finger), ← → Home End walk them; VoiceOver reads `summary`, each cell its line. `attr`: the page's
  // data-* prefix (data-its-strip, data-its-cell, …).
  import { cue } from '#lib/sound/cues.ts';
  import type { CellState, StripCell, StripTick } from '#lib/strip.ts';

  interface Props {
    cells: readonly StripCell[];
    ticks: readonly StripTick[];
    title: string;
    /** The states this bot shows, in words (the legend's order: ok, avail, warn, fail, none). */
    legend: Partial<Record<CellState, string>>;
    /** The strip's one line for VoiceOver. */
    summary: string;
    /** The line under it while no cell is picked. */
    line: string;
    /** Shown instead of the cells when none holds anything (a warning). */
    empty?: string;
    attr: string;
  }
  let { cells, ticks, title, legend, summary, line, empty, attr }: Props = $props();

  let picked = $state<number | null>(null);
  let strip = $state<HTMLElement>();
  const n = $derived(cells.length);
  const STATES: CellState[] = ['ok', 'avail', 'warn', 'fail', 'none'];
  const blank = $derived(!cells.some((c) => c.state !== 'none'));
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

<section class="card pad scans" aria-label={title} {...data('scans')}>
  <div class="shead"><b>{title}</b>
    {#if !(blank && empty)}
      <span class="legend" aria-hidden="true">{#each STATES.filter((k) => legend[k]) as k (k)}<span><i class="cell {k}"></i>{legend[k]}</span>{/each}</span>
    {/if}
  </div>
  {#if blank && empty}
    <p class="sline warn" role="status" {...data('empty')}>{empty}</p>
  {:else}
    <div class="strip" role="toolbar" tabindex="-1" aria-label={summary} bind:this={strip} onpointerdown={pickAt} onkeydown={onkey} {...data('strip')}>
      {#each cells as c, i (c.start)}
        <button type="button" class="cell {c.state}" class:on={picked === i} tabindex={i === (picked ?? n - 1) ? 0 : -1} aria-label={c.label}
          aria-pressed={picked === i} {...data('cell', c.state)} data-sfx="none" onclick={() => (picked = i)}></button>
      {/each}
    </div>
    <div class="ticks" aria-hidden="true">{#each ticks as k (k.i)}<span style:left="{((k.i + 0.5) / n) * 100}%" style:translate={edge(k.i)}>{k.label}</span>{/each}</div>
    <p class="sline" aria-live="polite" {...data('scan-line')}>{picked === null || !cells[picked] ? line : cells[picked].label}</p>
  {/if}
</section>

<style>
  /* each cell outlined in the edge (the pale fills need it to read, 3:1); height, the hatch and the ink cap tell the
     states apart without their colour */
  .scans { display: grid; gap: 2px; }
  .shead { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 2px 10px; font-size: var(--fs-s); }
  .legend { display: flex; flex-wrap: wrap; gap: 2px 10px; font-weight: 700; color: var(--text-soft); }
  .legend span { display: inline-flex; align-items: center; gap: 4px; }
  .legend .cell { display: inline-block; width: 8px; height: 12px; flex: none; }
  .legend .cell.ok { height: 8px; }
  .legend .cell.none { height: 3px; align-self: flex-end; margin-bottom: 3px; }
  .strip { display: flex; align-items: flex-end; gap: 1px; height: var(--hit); padding: 10px 0; touch-action: pan-y; cursor: pointer; }
  .strip .cell { appearance: none; border: 0; padding: 0; flex: 1 1 0; min-width: 0; height: 60%; cursor: pointer; }
  .cell { border-radius: 2px; box-shadow: inset 0 0 0 1px var(--edge); background: var(--ctl-off); }
  .cell.ok, .cell.avail { background: var(--c-leaf); }
  .strip .cell.avail, .strip .cell.warn, .strip .cell.fail { height: 100%; }
  .cell.warn { background: var(--c-yuzu); box-shadow: inset 0 3px 0 var(--text-soft), inset 0 0 0 1px var(--edge); }
  .cell.fail { background: repeating-linear-gradient(135deg, var(--c-coral) 0 3px, color-mix(in srgb, var(--c-coral) 45%, var(--card)) 3px 5px); }
  .strip .cell.none { height: 4px; }
  .cell.none { box-shadow: none; background: color-mix(in srgb, var(--edge) 35%, var(--ctl-off)); }
  .strip .cell.on { outline: 2px solid var(--text); outline-offset: 1px; }
  .strip .cell:focus-visible { outline: 3px solid var(--focus); outline-offset: 1px; }
  .ticks { position: relative; height: 1.3em; font: 700 var(--fs-s)/1.3 var(--font-num); color: var(--text-soft); }
  .ticks span { position: absolute; translate: -50% 0; white-space: nowrap; }
  .sline { margin: 2px 0 0; min-height: 1.3em; font-size: var(--fs-s); font-weight: 700; color: var(--text); font-variant-numeric: tabular-nums; line-height: var(--lh); }
  .sline.warn { margin: 4px 0 0; padding: 6px 10px; border-radius: var(--r-chip); background: color-mix(in srgb, var(--c-yuzu) 30%, var(--card)); }
</style>
