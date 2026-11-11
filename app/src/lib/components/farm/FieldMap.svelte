<script lang="ts">
  // My fields as the 畑 sheet's map (docs/farming.md "Playing"): a cell a plot, laid out as the island's camera sees the
  // field (its back row, the highest, at the top: row 0 is its front, nearest the beach), the plant's own art sized by its stage (12 / 15 / 18 px growing, 24 px ripe: a crop and its growth told apart), ripe ones ringed yuzu, watered soil dark. A tap only selects a
  // cell (32 px at most: a 10 × 4 field is 347 px wide); the sheet's row under it acts on it.
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { stageOf, type Farm, type Watered } from '#lib/contract/farm.ts';
  import type { PlotTile } from '#lib/layout/field.ts';
  import type { LocalDate } from '#lib/types.ts';

  interface Props {
    /** My plots, any of my fields, in the layout's order. */
    plots: readonly PlotTile[];
    farm: Farm;
    date: LocalDate;
    watered: Watered;
    /** A cell's label (what the row says of it). */
    label: (p: string) => string;
    selected: string | null;
  }
  let { plots, farm, date, watered, label, selected = $bindable() }: Props = $props();
  /** A plant's art height by stage (0, 1, 2 growing; 3 ripe). */
  const SIZE = [12, 15, 18, 24] as const;

  /** Each field: its columns and its cells by row (a plot id's `fd:<field>.<col>.<row>`). */
  const fields = $derived.by(() => {
    const by = new Map<string, { w: number; cells: { p: string; i: number; j: number }[] }>();
    for (const t of plots) {
      const m = /^fd:(.+)\.(\d+)\.(\d+)$/.exec(t.p);
      if (!m) continue;
      const f = by.get(m[1]) ?? { w: 0, cells: [] };
      by.set(m[1], f);
      f.w = Math.max(f.w, Number(m[2]) + 1);
      f.cells.push({ p: t.p, i: Number(m[2]), j: Number(m[3]) });
    }
    return [...by].map(([id, f]) => ({ id, w: f.w, cells: f.cells.sort((a, b) => b.j - a.j || a.i - b.i) }));
  });
</script>

{#each fields as f (f.id)}
  <div class="map" style:--w={f.w} role="group" data-farm-map={f.id}>
    {#each f.cells as c (c.p)}
      {@const pl = farm.plots.get(c.p)}
      {@const stage = pl ? stageOf(pl, date) : 0}
      {@const ripe = !!pl && stage === 3}
      <button type="button" class="cell" class:wet={watered(c.p, date)} class:ripe aria-pressed={selected === c.p} aria-label={label(c.p)}
        data-farm-cell={c.p} data-wet={watered(c.p, date) || undefined} data-ripe={ripe || undefined} data-sfx="tick"
        onclick={() => (selected = selected === c.p ? null : c.p)}>
        {#if pl}<OfficialArt key={`finds/${pl.c}`} size={SIZE[stage]} />{/if}
      </button>
    {/each}
  </div>
{/each}

<style>
  .map { display: grid; grid-template-columns: repeat(var(--w), minmax(0, 32px)); gap: 3px; justify-content: center; }
  .cell {
    appearance: none; border: 0; padding: 0; aspect-ratio: 1; border-radius: 7px; cursor: pointer; display: grid; place-items: center; line-height: 0;
    background: var(--c-lip); box-shadow: inset 0 -2px 0 color-mix(in srgb, var(--c-edge) 40%, transparent);
  }
  /* watered: dark soil, as on the island */
  .cell.wet { background: var(--c-edge); }
  .cell.ripe { box-shadow: inset 0 0 0 2px var(--c-yuzu-lip); }
  .cell[aria-pressed='true'] { background: var(--c-yuzu); outline: 2px solid var(--c-yuzu-lip); outline-offset: 1px; }
</style>
